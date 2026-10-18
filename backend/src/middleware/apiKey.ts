import type { NextFunction, Request, Response } from 'express';

export function verifyApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.API_KEY) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }
    next();
}