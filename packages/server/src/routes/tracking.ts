
import { Router, Request, Response } from 'express';
import { trackVisitor } from '../utils/analytics.js';

const router = Router();

// Track site visit (public)
router.post('/visit', async (req: Request, res: Response) => {
    try {
        // Can optionally pass userId if logged in, but not required
        const userId = req.body.userId;

        // Asynchronously track visitor
        trackVisitor(userId).catch(err => console.error('Failed to track visitor:', err));

        res.json({ success: true });
    } catch (error) {
        console.error('Tracking error:', error);
        res.status(500).json({ error: 'Tracking failed' });
    }
});

export { router as trackingRoutes };
