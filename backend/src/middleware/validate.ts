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

const validate =
  (
    getValue: (req: Request) => unknown,
    setValue: (req: Request, value: unknown) => void,
    defaultName: string,
  ) =>
  (schema: ZodTypeAny, schemaName = defaultName) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(getValue(req));

    if (!result.success) {
      return next(
        new ServiceError(
          formatValidationMessage(schemaName, result.error),
          400,
        ),
      );
    }

    setValue(req, result.data);
    return next();
  };

export const validateBody =
  validate((req) => req.body, (req, value) => {
    req.body = value;
  }, 'Request body');

export const validateQuery =
  validate((req) => req.query, (req, value) => {
    req.query = value as Request['query'];
  }, 'Request query');

export const validateParams =
  validate((req) => req.params, (req, value) => {
    req.params = value as Request['params'];
  }, 'Request params');
