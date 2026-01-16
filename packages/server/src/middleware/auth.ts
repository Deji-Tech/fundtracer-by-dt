// ============================================================
// Authentication Middleware - Verify Firebase ID Token
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../firebase.js';

export interface AuthenticatedRequest extends Request {
    user?: {
        uid: string;
        email: string;
        name?: string;
    };
}

import jwt from 'jsonwebtoken';

export async function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No authentication token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = {
            uid: decoded.address,
            email: decoded.address, // Use address as email identifier
            name: decoded.address.slice(0, 6) + '...' + decoded.address.slice(-4),
        };
        // Pass tier info if needed in other middlewares via res.locals or extending req.user
        res.locals.tier = decoded.tier;
        res.locals.isVerified = decoded.isVerified;

        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Invalid authentication token' });
    }
}
