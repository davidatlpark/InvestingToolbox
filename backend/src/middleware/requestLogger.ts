import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';

    logger[logLevel](`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
};
