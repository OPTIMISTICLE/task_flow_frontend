import { HttpErrorResponse } from '@angular/common/http';
import { ApiProblem } from '../models/api.models';

export function apiErrorMessage(error: unknown, fallback = 'The operation could not be completed.'): string {
  if (error instanceof HttpErrorResponse) {
    const problem = error.error as ApiProblem | undefined;
    if (problem?.detail) {
      return problem.detail;
    }
    if (error.status === 0) {
      return 'The server is unreachable. Check that the backend is running.';
    }
  }
  return fallback;
}
