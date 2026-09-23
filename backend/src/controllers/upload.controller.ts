import { NextFunction, Request, Response } from 'express';
import { createMenuImageUpload } from '../services/upload.service';
import type { MenuImageUploadPayload } from '../validation/upload.schema';

export const createMenuImageUploadHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const upload = await createMenuImageUpload(
      req.body as MenuImageUploadPayload,
    );

    return res.status(201).json(upload);
  } catch (error) {
    return next(error);
  }
};
