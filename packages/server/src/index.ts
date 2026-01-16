/**
 * FundTracer Secure API Server
 * Handles authentication, secure API key management, and anti-abuse limits.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeFirebase } from './firebase.js';
import { authMiddleware } from './middleware/auth.js';
import { usageMiddleware } from './middleware/usage.js';
import { analyzeRoutes } from './routes/analyze.js';
import { userRoutes } from './routes/user.js';
import { duneRoutes } from './routes/dune.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// DEBUG LOGGING - Log every request
app.use((req, res, next) => {
    console.log(`[DEBUG] Request: ${req.method} ${req.url}`);
    console.log(`[DEBUG] Path: ${req.path}`);
    next();
});

app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        /^https:\/\/.*\.netlify\.app$/,
        /^https:\/\/.*\.firebaseapp\.com$/
    ],
    credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Increased for large wallet lists

// Initialize Firebase Admin
initializeFirebase();

console.log('[DEBUG] Default API Key Present:', !!process.env.DEFAULT_ETHERSCAN_API_KEY);
console.log('[DEBUG] Default API Key Length:', process.env.DEFAULT_ETHERSCAN_API_KEY?.length);

// Health check (public)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes
// Create a main router
const apiRouter = express.Router();
apiRouter.use('/user', authMiddleware, userRoutes);
apiRouter.use('/analyze', authMiddleware, usageMiddleware, analyzeRoutes);
apiRouter.use('/dune', authMiddleware, duneRoutes);

// Mount router at both /api (for local dev) and root (for Netlify environment where /api might be stripped)
app.use('/api', apiRouter);

// Serve Static Frontend (for single-container deployment)
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to packages/web/dist relative to packages/server/dist/packages/server/src/index.js
// We need to go up 5 levels to reach root, then down to packages/web/dist
// Dist structure: root/dist/packages/server/src/index.js
// Web dist: root/packages/web/dist (IF built separately?) 
// OR root/dist/packages/web/dist (if build output is merged?)
// Let's assume standard monorepo structure where web is built to its own dist
// Actually, if we use "npm run build --workspaces", web builds to packages/web/dist

const webDistPath = path.join(__dirname, '../../../../../../packages/web/dist');

app.use(express.static(webDistPath));

// Fallback for SPA routing - serve index.html for non-API routes
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(webDistPath, 'index.html'));
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Only listen if run directly (development or standalone server)
if (process.env.NODE_ENV !== 'production' || process.env.IS_STANDALONE === 'true') {
    app.listen(PORT, () => {
        console.log(`FundTracer API Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

export const handler = app;
export default app;
