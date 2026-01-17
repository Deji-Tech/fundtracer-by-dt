import { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeFirebase } from '../../packages/server/src/firebase';

// Initialize Firebase once
initializeFirebase();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Health check endpoint
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
}
