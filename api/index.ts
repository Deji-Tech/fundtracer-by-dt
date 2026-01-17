import type { VercelRequest, VercelResponse } from '@vercel/node';

// Re-export the Express app as a serverless function
import serverless from 'serverless-http';

// Dynamic import to handle ESM
export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        // Import the Express app
        const { default: app } = await import('../packages/server/dist/packages/server/src/index.js');

        // Convert to serverless handler
        const serverlessHandler = serverless(app as any);

        // Handle the request
        return serverlessHandler(req, res);
    } catch (error) {
        console.error('API Handler Error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
