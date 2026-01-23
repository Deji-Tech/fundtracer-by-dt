
import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getFirestore } from '../firebase.js';

const router = Router();

// Admin Email Whitelist (Synced with Frontend)
const ADMIN_EMAILS = [
    'dejitech2@gmail.com',
    'ige6956@gmail.com',
    'ayomidevoltron@gmail.com',
    'olzakariyhau@gmail.com',
    'haiconempire@gmail.com',
];

// Middleware to check admin status
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: any) => {
    if (!req.user || !req.user.email || !ADMIN_EMAILS.includes(req.user.email)) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Get Dashboard Stats (Aggregated)
router.get('/stats', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getFirestore();

        // parallelize fetching
        const [usersSnap, revenueSnap, analyticsSnap] = await Promise.all([
            db.collection('users').get(),
            db.collection('analytics').doc('revenue').collection('payments').get(),
            db.collection('analytics').doc('daily_stats').collection('records').get()
        ]);

        const users = usersSnap.docs.map(doc => doc.data());

        // Calculate Stats
        const pohVerified = users.filter((u: any) => u.pohVerified === true).length;
        const freeUsers = users.filter((u: any) => u.tier === 'free' || !u.tier).length;
        const proUsers = users.filter((u: any) => u.tier === 'pro').length;
        const maxUsers = users.filter((u: any) => u.tier === 'max').length;
        const blacklistedUsers = users.filter((u: any) => u.blacklisted === true).length;

        // Calculate Active Users (active in last 30 days)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const activeUsers = users.filter((u: any) => u.lastActive > thirtyDaysAgo).length;

        // Calculate Revenue
        const totalRevenue = revenueSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

        // Aggregate Analytics
        let totalAnalyses = 0;
        const chainUsage = { ethereum: 0, arbitrum: 0, base: 0, linea: 0 };
        const featureUsage = { wallet: 0, compare: 0, sybil: 0, contract: 0 };

        analyticsSnap.docs.forEach(doc => {
            const data = doc.data();
            totalAnalyses += (data.totalAnalyses || 0);

            // Sum chain usage
            if (data.chainUsage) {
                Object.entries(data.chainUsage).forEach(([chain, count]) => {
                    if (chain in chainUsage) {
                        (chainUsage as any)[chain] += (count as number);
                    }
                });
            }

            // Sum feature usage
            if (data.featureUsage) {
                Object.entries(data.featureUsage).forEach(([feature, count]) => {
                    if (feature in featureUsage) {
                        (featureUsage as any)[feature] += (count as number);
                    }
                });
            }
        });

        res.json({
            stats: {
                totalVisitors: usersSnap.size, // Approximation or use explicit visitor tracking collection
                activeUsers,
                pohVerifiedUsers: pohVerified,
                totalRevenue,
                totalAnalyses,
                freeUsers,
                proUsers,
                maxUsers,
                blacklistedUsers
            },
            chainUsage,
            featureUsage
        });

    } catch (error) {
        console.error('Admin Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
});

// Get All Users
router.get('/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getFirestore();
        const usersSnap = await db.collection('users').get();

        const users = usersSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({ users });
    } catch (error) {
        console.error('Admin Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get Recent Activity (Admin Actions + Payments)
router.get('/activity', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const db = getFirestore();

        // Fetch admin actions
        const actionsSnap = await db.collection('admin_actions')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();

        const adminActions = actionsSnap.docs.map(doc => ({
            id: doc.id,
            type: doc.data().action,
            userId: doc.data().userId,
            userEmail: doc.data().userEmail,
            details: doc.data(),
            timestamp: doc.data().timestamp,
        }));

        // Fetch recent payments
        const paymentsSnap = await db.collection('analytics')
            .doc('revenue')
            .collection('payments')
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        const payments = paymentsSnap.docs.map(doc => ({
            id: doc.id,
            type: 'payment',
            userId: doc.data().userId,
            userEmail: doc.data().userEmail,
            details: doc.data(),
            timestamp: doc.data().timestamp,
        }));

        // Combine and sort
        const combined = [...adminActions, ...payments]
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
            .slice(0, 20);

        res.json({ activities: combined });
    } catch (error) {
        console.error('Admin Activity Error:', error);
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

export { router as adminRoutes };
