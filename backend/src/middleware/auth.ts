import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

export function verifyJWT(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers['authorization'];

    if(!authHeader) {
        res.status(401).json({ error: 'Authorization header missing' });
        return;
    }

    if(!authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Invalid authorization header format' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Token missing' });
      return;
    }

    try {
        const decoded: jwtPayload = jwt.verify(token, process.env.JWT_SECRET as string) as jwtPayload;
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(403).json({ error: 'Invalid token' });
    }
}
