import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { ServiceError } from '../errors/ServiceError';

const formatValidationMessage = (schemaName: string, error: ZodError) => {
  const issues = error.issues
    .map((issue) => {
      const path =
        issue.path.length > 0 ? `${issue.path.map(String).join('.')}: ` : '';
      return `${path}${issue.message}`;
    })
    .join('; ');

  return `${schemaName} validation failed${issues ? `: ${issues}` : ''}`;
};

export const validateBody =
  (schema: ZodTypeAny, schemaName = 'Request body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(
        new ServiceError(
          formatValidationMessage(schemaName, result.error),
          400,
        ),
      );
    }

    req.body = result.data;
    return next();
  };
