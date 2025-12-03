import { Request, Response, NextFunction } from 'express';

/**
 * Request logging middleware for development
 */
export const logger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `✅ [${res.statusCode}] ${req.method} ${req.path} - ${duration}ms`
    );
  });

  next();
};

export default logger;
