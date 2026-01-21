// ============================================================
// User Routes - Alchemy API Key Management & Account Info
// ============================================================

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getFirestore } from '../firebase.js';
import axios from 'axios';

const router = Router();

// Get user profile and usage info
router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const db = getFirestore();
        const userRef = db.collection('users').doc(req.user.uid);
        const userDoc = await userRef.get();
        let userData = userDoc.data();

        // Create user document if first time
        if (!userDoc.exists) {
            userData = {
                email: req.user.email,
                displayName: req.user.name,
                tier: 'free',
                pohVerified: false,
                blacklisted: false,
                analysisCount: 0,
                createdAt: Date.now(),
                lastActive: Date.now(),
            };
            await userRef.set(userData);
        } else {
            // Update last active
            await userRef.update({ lastActive: Date.now() });
        }

        const today = new Date().toISOString().split('T')[0];
        const usageToday = userData?.dailyUsage?.[today] || 0;
        const dailyLimit = parseInt(process.env.FREE_DAILY_LIMIT || '7', 10);
        const hasAlchemyKey = !!userData?.alchemyApiKey;

        const tier = userData?.tier || 'free';
        const isUnlimited = tier === 'pro' || tier === 'max' || hasAlchemyKey;

        res.json({
            uid: req.user.uid,
            email: req.user.email,
            name: req.user.name,
            isVerified: !!userData?.isVerified,
            tier,
            hasAlchemyApiKey: hasAlchemyKey,
            usage: {
                today: usageToday,
                limit: isUnlimited ? 'unlimited' : dailyLimit,
                remaining: isUnlimited ? 'unlimited' : Math.max(0, dailyLimit - usageToday),
            },
            createdAt: userData?.createdAt,
        });

        //Track login (async, don't await)
        const { trackVisitor } = await import('../utils/analytics.js');
        trackVisitor(req.user.uid).catch(err => console.error('Failed to track login:', err));
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.post('/profile', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { displayName, email } = req.body;

    // Validate inputs
    if (displayName && displayName.length > 50) {
        return res.status(400).json({ error: 'Display name too long (max 50 chars)' });
    }

    try {
        const db = getFirestore();
        const userRef = db.collection('users').doc(req.user.uid);

        const updates: any = {};
        if (displayName) updates.displayName = displayName;
        if (email) updates.email = email;

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
            await userRef.set(updates, { merge: true });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                uid: req.user.uid,
                ...updates
            }
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Save Alchemy API key
router.post('/alchemy-api-key', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
        return res.status(400).json({ error: 'API key is required' });
    }

    // Alchemy keys are typically 32 characters
    if (apiKey.length < 20 || apiKey.length > 50) {
        return res.status(400).json({ error: 'Invalid Alchemy API key format' });
    }

    try {
        // Validate Alchemy API key by making a test RPC request
        const isValid = await validateAlchemyApiKey(apiKey);

        if (!isValid) {
            return res.status(400).json({
                error: 'Invalid Alchemy API key',
                message: 'The API key could not be verified. Please ensure you entered a valid Alchemy API key.'
            });
        }

        // Save API key
        const db = getFirestore();
        const userRef = db.collection('users').doc(req.user.uid);

        await userRef.set({
            alchemyApiKey: apiKey,
            alchemyKeyAddedAt: new Date().toISOString(),
        }, { merge: true });

        res.json({
            success: true,
            message: 'Alchemy API key saved successfully. Your queries will now be much faster!'
        });
    } catch (error: any) {
        console.error('Alchemy API key save error:', error);
        res.status(500).json({
            error: 'Failed to save Alchemy API key',
            details: error.message
        });
    }
});

// Remove Alchemy API key
router.delete('/alchemy-api-key', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const db = getFirestore();
        const userRef = db.collection('users').doc(req.user.uid);
        const { FieldValue } = await import('firebase-admin/firestore');

        await userRef.update({
            alchemyApiKey: FieldValue.delete(),
            alchemyKeyAddedAt: FieldValue.delete(),
        });

        res.json({ success: true, message: 'Alchemy API key removed' });
    } catch (error) {
        console.error('Alchemy API key delete error:', error);
        res.status(500).json({ error: 'Failed to remove Alchemy API key' });
    }
});

// Validate Alchemy API key by making a test RPC request
async function validateAlchemyApiKey(apiKey: string): Promise<boolean> {
    try {
        const response = await axios.post(
            `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
            {
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_blockNumber',
                params: [],
            },
            { timeout: 10000 }
        );

        // Valid response has a result field with the block number
        return !!response.data.result && !response.data.error;
    } catch (error) {
        console.error('Alchemy API key validation error:', error);
        return false;
    }
}

export { router as userRoutes };
