import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

// Custom API Error class
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string): ApiError {
    return new ApiError(400, message);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, false);
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

// Global error handler middleware
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logger.error(err.message, { stack: err.stack });

  // Default error response
  let statusCode = 500;
  const response: ErrorResponse = {
    success: false,
    error: {
      message: 'Internal server error',
    },
  };

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    response.error.message = 'Validation error';
    response.error.code = 'VALIDATION_ERROR';
    response.error.details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle custom API errors
  else if (err instanceof ApiError) {
    statusCode = err.statusCode;
    response.error.message = err.message;
  }
  // Handle Prisma errors
  else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    response.error.message = 'Database error';
    response.error.code = 'DATABASE_ERROR';
  }
  // Include stack trace in development
  else if (env.NODE_ENV === 'development') {
    response.error.message = err.message;
    response.error.details = err.stack;
  }

  res.status(statusCode).json(response);
};

// 404 handler for unknown routes
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND',
    },
  });
};
