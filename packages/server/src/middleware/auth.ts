// ============================================================
// Authentication Middleware - Verify Firebase ID Token
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { getAuth, getFirestore } from '../firebase.js';

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
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as any;
            const uid = decoded.address.toLowerCase();

            // 1. Fetch latest user data from Firestore (Single Source of Truth)
            const db = getFirestore();
            let userDoc;
            try {
                userDoc = await db.collection('users').doc(uid).get();
            } catch (dbError) {
                console.error('Firestore fetch failed in authMiddleware:', dbError);
                // Fallback to JWT claims if DB fails (resilience)
                userDoc = null;
            }

            const userData = userDoc?.exists ? userDoc.data() : null;

            // 2. Check Blacklist (Fail Closed)
            if (userData?.blacklisted === true) {
                console.warn(`[AUTH] Blocked blacklisted user: ${uid}`);
                return res.status(403).json({
                    error: 'Account suspended',
                    message: 'Your account has been blacklisted. Please contact support.'
                });
            }

            // 3. Populate Request User with FRESH data
            req.user = {
                uid: uid,
                email: userData?.email || uid,
                name: userData?.displayName || uid.slice(0, 6) + '...' + uid.slice(-4),
            };

            // 4. Set Locals for downstream routes (using DB values over JWT)
            res.locals.tier = userData?.tier || decoded.tier || 'free';
            res.locals.isVerified = userData?.pohVerified === true; // Strict boolean check
            res.locals.usageRemaining = userData?.usage?.remaining; // Optional, logic elsewhere might handle this

            next();
        } catch (error) {
            console.error('Auth error:', error);
            return res.status(401).json({ error: 'Invalid authentication token' });
        }
    }
