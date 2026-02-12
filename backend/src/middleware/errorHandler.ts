/**
 * Error Handling Middleware
 * 
 * Centralized error handling for Express application
 */

import { Request, Response, NextFunction } from 'express';
import { CVInstanceError } from '../models/CVInstance';
import { CVServiceError } from '../services/CVService';

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * Error handler middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error details - omit req.body to avoid logging sensitive user data
  console.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle known error types
  if (err instanceof CVInstanceError) {
    const statusCode = getStatusCodeForError(err.code);
    res.status(statusCode).json({
      error: err.code,
      message: err.message,
      details: err.cause ? { cause: err.cause.message } : undefined
    } as ApiError);
    return;
  }

  if (err instanceof CVServiceError) {
    const statusCode = getStatusCodeForError(err.code);
    res.status(statusCode).json({
      error: err.code,
      message: err.message,
    } as ApiError);
    return;
  }

  // Handle validation errors (Joi, etc.)
  if (err.name === 'ValidationError') {
    res.status(422).json({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: { validation: err.message }
    } as ApiError);
    return;
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'INVALID_JSON',
      message: 'Invalid JSON in request body'
    } as ApiError);
    return;
  }

  // Handle 404 errors
  if (err.message === 'Not Found') {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: 'Resource not found'
    } as ApiError);
    return;
  }

  // Default internal server error
  // WARNING: Stack trace is only exposed in development mode. Ensure NODE_ENV=production in production.
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An internal server error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  } as ApiError);
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`
  } as ApiError);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(code: string): number {
  const statusMap: Record<string, number> = {
    'NOT_FOUND': 404,
    'DUPLICATE_NAME': 409,
    'INVALID_TEMPLATE': 422,
    'INVALID_CONTENT': 422,
    'PARSE_ERROR': 422,
    'TEMPLATE_NOT_FOUND': 404,
    'UNPARSED_CONTENT': 422,
    'NOT_IMPLEMENTED': 501,
    'INVALID_ASSET': 422,
    'VALIDATION_ERROR': 422,
    'INVALID_PARAMS': 400,
    'HAS_DEPENDENCIES': 409,
    'DATABASE_ERROR': 500,
  };

  return statusMap[code] || 500;
}

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(data: T, message?: string) {
  return {
    data,
    success: true,
    ...(message && { message })
  };
}

/**
 * Create a standardized paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
) {
  return {
    data,
    total,
    limit,
    offset,
    success: true
  };
}