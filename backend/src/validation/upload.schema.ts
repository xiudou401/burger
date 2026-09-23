import { z } from 'zod';

export const MenuImageUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  size: z
    .number()
    .int()
    .positive()
    .max(3 * 1024 * 1024),
});

export type MenuImageUploadPayload = z.infer<typeof MenuImageUploadSchema>;
