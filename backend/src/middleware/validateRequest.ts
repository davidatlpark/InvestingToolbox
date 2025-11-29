import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

// Generic request validation middleware factory
export const validateRequest = <T>(schema: ZodSchema<T>, source: 'body' | 'query' | 'params') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      next(error as ZodError);
    }
  };
};

// Convenience exports for common validation types
export const validateBody = <T>(schema: ZodSchema<T>) => validateRequest(schema, 'body');
export const validateQuery = <T>(schema: ZodSchema<T>) => validateRequest(schema, 'query');
export const validateParams = <T>(schema: ZodSchema<T>) => validateRequest(schema, 'params');
