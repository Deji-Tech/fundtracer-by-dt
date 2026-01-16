
import { Router, Request, Response } from 'express';
import { verifyMessage } from 'ethers';
import jwt from 'jsonwebtoken';
import { getFirestore } from '../firebase.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

// Mock PoH check (real implementation should call API)
async function checkPoH(address: string): Promise<boolean> {
    try {
        const response = await fetch(`https://poh-api.linea.build/poh/v2/${address}`);
        const data = await response.json() as { poh: boolean };
        return data.poh === true;
    } catch (error) {
        console.error('PoH Check failed:', error);
        return false;
    }
}

router.post('/login', async (req: Request, res: Response) => {
    const { address, signature, message } = req.body;
    console.log(`[AUTH] Login Request: ${address}`);

    if (!address || !signature || !message) {
        console.error('[AUTH] Missing credentials');
        return res.status(400).json({ error: 'Missing credentials' });
    }

    try {
        // Verify signature
        const recoveredAddress = verifyMessage(message, signature);
        console.log(`[AUTH] Recovered: ${recoveredAddress}`);

        if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            console.error(`[AUTH] Sig Mismatch: ${recoveredAddress} vs ${address}`);
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Check Linea PoH
        let isVerified = false;
        try {
            console.log('[AUTH] Calling PoH API...');
            const response = await fetch(`https://poh-api.linea.build/poh/v2/${address}`);
            const text = await response.text(); // Get text first
            console.log(`[AUTH] PoH Raw Response: ${text}`);

            try {
                const data = JSON.parse(text);
                // Handle { poh: boolean } OR plain boolean
                if (typeof data === 'boolean') {
                    isVerified = data;
                } else if (typeof data === 'object' && data !== null && 'poh' in data) {
                    isVerified = data.poh === true;
                }
            } catch (e) {
                console.error('[AUTH] Failed to parse PoH JSON:', e);
                // Default to false
            }
        } catch (poHError) {
            console.error('[AUTH] PoH API Error:', poHError);
        }

        console.log(`[AUTH] Verified Human: ${isVerified}`);

        // Update User in Firestore
        console.log('[AUTH] Getting Firestore...');
        const db = getFirestore();
        const userRef = db.collection('users').doc(address.toLowerCase());
        const userDoc = await userRef.get();
        console.log(`[AUTH] User found: ${userDoc.exists}`);

        let tier = 'free';
        let expiry = 0;

        if (userDoc.exists) {
            const data = userDoc.data();
            tier = data?.tier || 'free';
            expiry = data?.subscriptionExpiry || 0;
        }

        // Check if subscription expired
        if (expiry > 0 && Date.now() > expiry) {
            tier = 'free'; // Downgrade
        }

        await userRef.set({
            address: address.toLowerCase(),
            isVerified,
            tier,
            subscriptionExpiry: expiry,
            lastLogin: Date.now()
        }, { merge: true });

        // Generate JWT
        const token = jwt.sign({
            uid: address.toLowerCase(),
            address: address.toLowerCase(),
            tier,
            isVerified
        }, JWT_SECRET, { expiresIn: '7d' });

        console.log('[AUTH] Login SUCCESS, sending response.');
        res.json({
            token,
            user: {
                address,
                tier,
                isVerified,
                subscriptionExpiry: expiry
            }
        });

    } catch (error) {
        console.error('[AUTH] Login CRITICAL error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

export { router as authRoutes };
