// ============================================================
// Usage Tracking Middleware - Enforce Daily Limits
// ============================================================

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { getFirestore } from '../firebase.js';



export async function usageMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const db = getFirestore();
        const userRef = db.collection('users').doc(req.user.uid);
        const userDoc = await userRef.get();

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const userData = userDoc.data();

        // Determine user tier and limit
        const tier = (userData?.tier || 'free') as 'free' | 'pro' | 'max';

        let dailyLimit = 7; // Default Free
        if (tier === 'pro') dailyLimit = 25;
        if (tier === 'max') dailyLimit = Infinity;

        // Check if user has their own API key (treat as unlimited)
        if (userData?.customApiKey) {
            dailyLimit = Infinity;
        }

        // Check daily usage
        const usageToday = userData?.dailyUsage?.[today] || 0;

        // Enforce Limit
        if (usageToday >= dailyLimit) {
            return res.status(429).json({
                error: 'Daily limit exceeded',
                message: `You have reached your daily limit of ${dailyLimit} analyses for the ${tier} tier. Upgrade to increase your limit.`,
                limit: dailyLimit,
                used: usageToday,
                resetsAt: getNextMidnight(),
            });
        }

        // Increment usage counter
        await userRef.set({
            dailyUsage: {
                [today]: usageToday + 1,
            },
            lastActive: new Date().toISOString(),
        }, { merge: true });

        // Attach remaining usage to response (if unlimited, return -1 or a large number)
        res.locals.usageRemaining = dailyLimit === Infinity ? 9999 : dailyLimit - usageToday - 1;

        next();
    } catch (error) {
        console.error('Usage tracking error:', error);
        // Allow request to proceed if usage tracking fails
        next();
    }
}

function getNextMidnight(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
}
