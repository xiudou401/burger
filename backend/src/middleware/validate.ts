import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodTypeAny } from 'zod';
import { ValidationError, ValidationIssue } from '../errors/ValidationError';

const toValidationIssues = (error: ZodError): ValidationIssue[] =>
  error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
  }));

const validate =
  (
    getValue: (req: Request) => unknown,
    setValue: (req: Request, value: unknown) => void,
    defaultName: string,
  ) =>
  (schema: ZodTypeAny, _schemaName = defaultName) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(getValue(req));

    if (!result.success) {
      return next(new ValidationError(toValidationIssues(result.error)));
    }

    setValue(req, result.data);
    return next();
  };

export const validateBody = validate(
  (req) => req.body,
  (req, value) => {
    req.body = value;
  },
  'Request body',
);

export const validateQuery = validate(
  (req) => req.query,
  (req, value) => {
    req.query = value as Request['query'];
  },
  'Request query',
);

export const validateParams = validate(
  (req) => req.params,
  (req, value) => {
    req.params = value as Request['params'];
  },
  'Request params',
);
