import { VercelRequest, VercelResponse } from '@vercel/node';
import cors from 'cors';

// Lightweight API handler - delegates to actual Express routes
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    await new Promise<void>((resolve) => {
        cors({
            origin: true,
            credentials: true
        })(req as any, res as any, resolve as any);
    });

    const path = req.url?.replace('/api', '') || '/';

    // Route to appropriate handler
    if (path.startsWith('/auth')) {
        const { authRoutes } = await import('../../packages/server/src/routes/auth');
        return authRoutes(req as any, res as any);
    }

    if (path.startsWith('/analyze')) {
        const { analyzeRoutes } = await import('../../packages/server/src/routes/analyze');
        return analyzeRoutes(req as any, res as any);
    }

    if (path.startsWith('/user')) {
        const { userRoutes } = await import('../../packages/server/src/routes/user');
        return userRoutes(req as any, res as any);
    }

    if (path.startsWith('/dune')) {
        const { duneRoutes } = await import('../../packages/server/src/routes/dune');
        return duneRoutes(req as any, res as any);
    }

    res.status(404).json({ error: 'API endpoint not found' });
}
