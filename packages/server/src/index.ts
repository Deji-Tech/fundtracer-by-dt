/**
 * FundTracer Secure API Server
 * Handles authentication, secure API key management, and anti-abuse limits.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { initializeFirebase } from './firebase.js';
import { authMiddleware } from './middleware/auth.js';
import { usageMiddleware } from './middleware/usage.js';
import { analyzeRoutes } from './routes/analyze.js';
import { userRoutes } from './routes/user.js';
import { duneRoutes } from './routes/dune.js';
import { PaymentListener } from './services/PaymentListener.js';

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

// Serve Static Frontend
// In Pxxl App, npm start --workspace sets CWD to packages/server
// Frontend build output is in sibling directory: ../web/dist
const webDistPath = path.join(process.cwd(), '../web/dist');

console.log('[DEBUG] CWD:', process.cwd());
console.log('[DEBUG] Serving static files from:', webDistPath);

app.use(express.static(webDistPath));



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

// Start Payment Listener
new PaymentListener().start();

console.log('[DEBUG] Default API Key Present:', !!process.env.DEFAULT_ETHERSCAN_API_KEY);
console.log('[DEBUG] Default API Key Length:', process.env.DEFAULT_ETHERSCAN_API_KEY?.length);

// Health check (public)
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes
// Create a main router
const apiRouter = express.Router();
import { authRoutes } from './routes/auth.js';

// ... (existing imports)

// Mount router at both /api (for local dev) and root (for Netlify environment where /api might be stripped)
apiRouter.use('/user', authMiddleware, userRoutes);
apiRouter.use('/auth', authRoutes); // Public auth route
apiRouter.use('/analyze', authMiddleware, usageMiddleware, analyzeRoutes);
apiRouter.use('/dune', authMiddleware, duneRoutes);

// Mount router at both /api (for local dev) and root (for Netlify environment where /api might be stripped)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Fallback for SPA routing - MUST BE LAST
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
