import { BaseError } from './BaseError';

export interface ValidationIssue {
  path: string;
  message: string;
}

export class ValidationError extends BaseError {
  issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super('Validation failed', 400);
    this.issues = issues;
  }
}
