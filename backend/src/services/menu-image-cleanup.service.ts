import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
  type _Object,
} from '@aws-sdk/client-s3';
import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';
import { MenuItemModel } from '../models/menu-item.model';
import { OrderModel } from '../models/order.model';

const MENU_IMAGES_PREFIX = 'menu-images/';
const DEFAULT_GRACE_MS = 24 * 60 * 60 * 1000;
const DELETE_BATCH_SIZE = 1000;

interface CleanupOptions {
  dryRun?: boolean;
  graceMs?: number;
  now?: Date;
}

interface ReferencedImageDocument {
  image?: string;
  items?: Array<{
    imageAtPurchase?: string;
  }>;
}

const getS3Client = () => {
  if (!env.AWS_REGION || !env.S3_MENU_IMAGES_BUCKET) {
    throw new ServiceError('Menu image cleanup is not configured', 503);
  }

  return new S3Client({ region: env.AWS_REGION });
};

const getPublicBaseUrl = () => {
  if (env.S3_MENU_IMAGES_PUBLIC_BASE_URL) {
    return env.S3_MENU_IMAGES_PUBLIC_BASE_URL;
  }

  if (!env.AWS_REGION || !env.S3_MENU_IMAGES_BUCKET) {
    throw new ServiceError('Menu image cleanup is not configured', 503);
  }

  return `https://${env.S3_MENU_IMAGES_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;
};

export const getMenuImageKeyFromUrl = (imageUrl: string) => {
  if (!imageUrl.startsWith('http')) return null;

  try {
    const baseUrl = new URL(getPublicBaseUrl());
    const url = new URL(imageUrl);

    if (url.origin !== baseUrl.origin) return null;

    const key = decodeURIComponent(url.pathname.replace(/^\/+/, ''));

    return key.startsWith(MENU_IMAGES_PREFIX) ? key : null;
  } catch {
    return null;
  }
};

const getReferencedMenuImageKeys = async () => {
  const referencedKeys = new Set<string>();
  const [menuItems, orders] = await Promise.all([
    MenuItemModel.find({ image: { $type: 'string' } })
      .select('image')
      .lean<ReferencedImageDocument[]>()
      .exec(),
    OrderModel.find({ 'items.imageAtPurchase': { $type: 'string' } })
      .select('items.imageAtPurchase')
      .lean<ReferencedImageDocument[]>()
      .exec(),
  ]);

  for (const menuItem of menuItems) {
    const key = menuItem.image ? getMenuImageKeyFromUrl(menuItem.image) : null;

    if (key) {
      referencedKeys.add(key);
    }
  }

  for (const order of orders) {
    for (const item of order.items ?? []) {
      const key = item.imageAtPurchase
        ? getMenuImageKeyFromUrl(item.imageAtPurchase)
        : null;

      if (key) {
        referencedKeys.add(key);
      }
    }
  }

  return referencedKeys;
};

const listMenuImageObjects = async (s3Client: S3Client) => {
  if (!env.S3_MENU_IMAGES_BUCKET) {
    throw new ServiceError('Menu image cleanup is not configured', 503);
  }

  const objects: _Object[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: env.S3_MENU_IMAGES_BUCKET,
        Prefix: MENU_IMAGES_PREFIX,
        ContinuationToken: continuationToken,
      }),
    );

    objects.push(...(response.Contents ?? []));
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects;
};

const deleteMenuImageObjects = async (s3Client: S3Client, keys: string[]) => {
  if (!env.S3_MENU_IMAGES_BUCKET) {
    throw new ServiceError('Menu image cleanup is not configured', 503);
  }

  for (let index = 0; index < keys.length; index += DELETE_BATCH_SIZE) {
    const batch = keys.slice(index, index + DELETE_BATCH_SIZE);

    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: env.S3_MENU_IMAGES_BUCKET,
        Delete: {
          Objects: batch.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
  }
};

export const cleanupOrphanMenuImages = async ({
  dryRun = true,
  graceMs = DEFAULT_GRACE_MS,
  now = new Date(),
}: CleanupOptions = {}) => {
  const s3Client = getS3Client();
  const cutoff = new Date(now.getTime() - graceMs);
  const [referencedKeys, objects] = await Promise.all([
    getReferencedMenuImageKeys(),
    listMenuImageObjects(s3Client),
  ]);

  const orphanKeys = objects
    .filter((object) => {
      if (!object.Key || !object.LastModified) return false;
      if (object.LastModified > cutoff) return false;

      return !referencedKeys.has(object.Key);
    })
    .map((object) => object.Key as string);

  if (!dryRun && orphanKeys.length > 0) {
    await deleteMenuImageObjects(s3Client, orphanKeys);
  }

  return {
    dryRun,
    scannedCount: objects.length,
    referencedCount: referencedKeys.size,
    orphanCount: orphanKeys.length,
    deletedCount: dryRun ? 0 : orphanKeys.length,
    orphanKeys,
  };
};
