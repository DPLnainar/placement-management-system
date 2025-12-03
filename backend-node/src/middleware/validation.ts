import { Request, Response, NextFunction } from 'express';

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (_req: Request, _res: Response, next: NextFunction): void => {
  // TODO: Implement input sanitization
  next();
};

export default { sanitizeInput };
