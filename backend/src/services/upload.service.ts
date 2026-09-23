import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import path from 'path';
import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';
import type { MenuImageUploadPayload } from '../validation/upload.schema';

const SIGNED_UPLOAD_URL_TTL_SECONDS = 60;

let s3Client: S3Client | null = null;

const getS3Client = () => {
  if (!env.AWS_REGION || !env.S3_MENU_IMAGES_BUCKET) {
    throw new ServiceError('Menu image uploads are not configured', 503);
  }

  s3Client = s3Client ?? new S3Client({ region: env.AWS_REGION });

  return s3Client;
};

const getFileExtension = (payload: MenuImageUploadPayload) => {
  const extension = path.extname(payload.fileName).toLowerCase();

  if (extension && ['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
    return extension === '.jpeg' ? '.jpg' : extension;
  }

  return {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  }[payload.contentType];
};

const buildPublicImageUrl = (key: string) => {
  const publicBaseUrl =
    env.S3_MENU_IMAGES_PUBLIC_BASE_URL ??
    `https://${env.S3_MENU_IMAGES_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;
  const baseUrl = publicBaseUrl.endsWith('/')
    ? publicBaseUrl
    : `${publicBaseUrl}/`;

  return new URL(key, baseUrl).toString();
};

export const createMenuImageUpload = async (
  payload: MenuImageUploadPayload,
) => {
  if (!env.S3_MENU_IMAGES_BUCKET) {
    throw new ServiceError('Menu image uploads are not configured', 503);
  }

  const extension = getFileExtension(payload);
  const key = `menu-images/${new Date().getFullYear()}/${randomUUID()}${extension}`;
  const command = new PutObjectCommand({
    Bucket: env.S3_MENU_IMAGES_BUCKET,
    Key: key,
    ContentType: payload.contentType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: SIGNED_UPLOAD_URL_TTL_SECONDS,
  });

  return {
    uploadUrl,
    imageUrl: buildPublicImageUrl(key),
  };
};
