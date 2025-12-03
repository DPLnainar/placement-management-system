import { Request, Response, NextFunction } from 'express';

/**
 * Input sanitization middleware
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // TODO: Implement input sanitization
  next();
};

export default { sanitizeInput };
