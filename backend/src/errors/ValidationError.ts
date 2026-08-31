import { BaseError } from './BaseError';

export interface ValidationIssue {
  path: string;
  message: string;
}

export class ValidationError extends BaseError {
  issues: ValidationIssue[];
  target: string;

  constructor(issues: ValidationIssue[], target = 'Request payload') {
    super('Validation failed', 400);
    this.issues = issues;
    this.target = target;
  }
}
