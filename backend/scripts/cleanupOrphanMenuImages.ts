import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { cleanupOrphanMenuImages } from '../src/services/menu-image-cleanup.service';

dotenv.config();

const parseGraceMs = () => {
  const hours = Number(process.env.MENU_IMAGE_CLEANUP_GRACE_HOURS ?? 24);

  if (!Number.isFinite(hours) || hours < 0) {
    throw new Error(
      'MENU_IMAGE_CLEANUP_GRACE_HOURS must be a non-negative number',
    );
  }

  return hours * 60 * 60 * 1000;
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  const dryRun = process.env.MENU_IMAGE_CLEANUP_CONFIRM !== 'true';

  await mongoose.connect(process.env.MONGO_URI);

  try {
    const result = await cleanupOrphanMenuImages({
      dryRun,
      graceMs: parseGraceMs(),
    });

    console.log(
      JSON.stringify(
        {
          ...result,
          sampleOrphanKeys: result.orphanKeys.slice(0, 20),
          orphanKeys:
            result.orphanKeys.length <= 20
              ? result.orphanKeys
              : `${result.orphanKeys.length} keys omitted from log`,
        },
        null,
        2,
      ),
    );

    if (dryRun) {
      console.log(
        'Dry run only. Set MENU_IMAGE_CLEANUP_CONFIRM=true to delete orphan images.',
      );
    }
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
