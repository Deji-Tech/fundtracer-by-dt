// ============================================================
// Analyze Routes - Wallet & Contract Analysis Endpoints
// All requests use server-side API keys (never exposed to client)
// ============================================================

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { getFirestore } from '../firebase.js';
import {
    WalletAnalyzer,
    SybilAnalyzer,
    ChainId,
    FilterOptions
} from '@fundtracer/core';
import { DuneService } from '../services/DuneService.js';

const router = Router();

// Get Alchemy API key for a user
async function getAlchemyKeyForUser(userId: string): Promise<string> {
    try {
        const db = getFirestore();
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        // Use user's custom Alchemy key or fallback to default
        return userData?.alchemyApiKey || process.env.DEFAULT_ALCHEMY_API_KEY || '';
    } catch (error) {
        console.error('Error fetching Alchemy API key:', error);
    }

    // Fall back to default key
    return process.env.DEFAULT_ALCHEMY_API_KEY || '';
}

// Timeout helper - wrap async operations with a timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs / 1000}s`)), timeoutMs)
        )
    ]);
}

// Analyze a single wallet
router.post('/wallet', async (req: AuthenticatedRequest, res: Response) => {
    console.log('[DEBUG] /wallet endpoint hit');
    console.log('[DEBUG] Request body:', JSON.stringify(req.body));

    if (!req.user) {
        console.log('[DEBUG] No user found on request');
        return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log('[DEBUG] User authenticated:', req.user.uid);

    const { address, chain, options } = req.body;

    if (!address || !chain) {
        return res.status(400).json({ error: 'Address and chain are required' });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    try {
        console.log('[DEBUG] Fetching Alchemy API key for user...');
        const alchemyKey = await getAlchemyKeyForUser(req.user.uid);
        console.log('[DEBUG] Alchemy key retrieved, length:', alchemyKey?.length);

        const analyzer = new WalletAnalyzer({
            alchemy: alchemyKey,
        });

        console.log('[DEBUG] Starting wallet analysis with 120s timeout...');
        const result = await withTimeout(
            analyzer.analyze(address, chain as ChainId, options),
            120000, // 120 second timeout for complete analysis
            'Wallet analysis'
        );

        console.log('[DEBUG] Analysis complete, sending response');
        res.json({
            success: true,
            result,
            usageRemaining: res.locals.usageRemaining,
        });
    } catch (error: any) {
        console.error('Wallet analysis error:', error.message);
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message,
            hint: error.message.includes('timed out')
                ? 'The analysis took too long. Try a wallet with fewer transactions.'
                : undefined
        });
    }
});

// Compare multiple wallets
router.post('/compare', async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { addresses, chain, options } = req.body;

    if (!addresses || !Array.isArray(addresses) || addresses.length < 2) {
        return res.status(400).json({ error: 'At least 2 addresses are required' });
    }

    // Validate all addresses
    for (const addr of addresses) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(addr)) {
            return res.status(400).json({ error: `Invalid address format: ${addr}` });
        }
    }

    try {
        const alchemyKey = await getAlchemyKeyForUser(req.user.uid);

        const analyzer = new WalletAnalyzer({
            alchemy: alchemyKey,
        });

        const result = await analyzer.compareWallets(addresses, chain as ChainId, options);

        res.json({
            success: true,
            result,
            usageRemaining: res.locals.usageRemaining,
        });
    } catch (error: any) {
        console.error('Comparison error:', error);
        res.status(500).json({
            error: 'Comparison failed',
            message: error.message
        });
    }
});

// Analyze contract interactors
router.post('/contract', async (req: AuthenticatedRequest, res: Response) => {
    console.log('[DEBUG] /contract endpoint hit');
    console.log('[DEBUG] Request body:', JSON.stringify(req.body));

    if (!req.user) {
        console.log('[DEBUG] No user found on request');
        return res.status(401).json({ error: 'Not authenticated' });
    }

    console.log('[DEBUG] User authenticated:', req.user.uid);

    const { contractAddress, chain, options } = req.body;

    if (!contractAddress || !chain) {
        return res.status(400).json({ error: 'Contract address and chain are required' });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
        return res.status(400).json({ error: 'Invalid contract address format' });
    }

    try {
        console.log('[DEBUG] Fetching Alchemy API key for user...');
        const alchemyKey = await getAlchemyKeyForUser(req.user.uid);
        console.log('[DEBUG] Alchemy key retrieved, length:', alchemyKey?.length);

        const analyzer = new WalletAnalyzer({
            alchemy: alchemyKey,
            moralis: process.env.MORALIS_API_KEY, // Pass Moralis key if available
        });

        // Try to fetch interactors from Dune first if configured
        let externalInteractors: string[] = [];
        const duneKey = process.env.DUNE_API_KEY;

        if (duneKey) {
            try {
                console.log('[DEBUG] Attempting to fetch interactors from Dune...');
                const duneService = new DuneService(duneKey);
                externalInteractors = await duneService.getContractInteractors(
                    chain as string,
                    contractAddress
                );
                console.log(`[DEBUG] Dune returned ${externalInteractors.length} interactors`);
            } catch (duneError) {
                console.error('[DEBUG] Dune fetch failed, falling back to RPC:', duneError);
                // Fallback to empty array -> RPC
            }
        }

        console.log('[DEBUG] Starting contract analysis with 180s timeout...');
        const result = await withTimeout(
            analyzer.analyzeContract(contractAddress, chain as ChainId, {
                maxInteractors: options?.maxInteractors || 100,
                analyzeFunding: options?.analyzeFunding !== false,
                externalInteractors: externalInteractors.length > 0 ? externalInteractors : undefined
            }),
            180000, // 180 second timeout for complete contract analysis
            'Contract analysis'
        );

        console.log('[DEBUG] Contract analysis complete, sending response');
        res.json({
            success: true,
            result,
            usageRemaining: res.locals.usageRemaining,
        });
    } catch (error: any) {
        console.error('Contract analysis error:', error.message);
        res.status(500).json({
            error: 'Contract analysis failed',
            message: error.message,
            hint: error.message.includes('timed out')
                ? 'The contract has too many interactions. Try limiting maxInteractors.'
                : undefined
        });
    }
});

// Sybil Detection - Find wallets with common funding sources
router.post('/sybil', async (req: AuthenticatedRequest, res: Response) => {
    console.log('[DEBUG] /sybil endpoint hit');
    console.log('[DEBUG] Request body:', JSON.stringify(req.body));

    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const { contractAddress, chain = 'ethereum', options } = req.body;

    if (!contractAddress) {
        return res.status(400).json({ error: 'Contract address is required' });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
        return res.status(400).json({ error: 'Invalid contract address format' });
    }

    try {
        console.log('[DEBUG] Fetching Alchemy API key for user...');
        const alchemyKey = await getAlchemyKeyForUser(req.user.uid);
        const moralisKey = process.env.MORALIS_API_KEY || '';
        console.log('[DEBUG] Alchemy key retrieved, length:', alchemyKey?.length);
        console.log('[DEBUG] Moralis key present:', !!moralisKey);

        if (!alchemyKey) {
            return res.status(400).json({ error: 'Alchemy API key required for sybil detection' });
        }

        const analyzer = new SybilAnalyzer(chain as ChainId, alchemyKey, moralisKey);

        console.log('[DEBUG] Starting sybil analysis with 300s timeout...');
        const result = await withTimeout(
            analyzer.analyzeContract(contractAddress, {
                maxInteractors: options?.maxInteractors || 500,
                minClusterSize: options?.minClusterSize || 3,
            }),
            600000, // 10 minute timeout for sybil analysis
            'Sybil analysis'
        );

        console.log('[DEBUG] Sybil analysis complete, sending response');
        res.json({
            success: true,
            result,
            usageRemaining: res.locals.usageRemaining,
        });
    } catch (error: any) {
        console.error('Sybil analysis error:', error.message);
        res.status(500).json({
            error: 'Sybil analysis failed',
            message: error.message,
            hint: error.message.includes('timed out')
                ? 'The contract has too many interactors. Try reducing maxInteractors.'
                : undefined
        });
    }
});

/**
 * POST /sybil-addresses
 * Analyze a list of addresses directly (e.g., pasted from Dune)
 * Skips the slow "find interactors" step
 */
router.post('/sybil-addresses', async (req: AuthenticatedRequest, res: Response) => {
    console.log('[DEBUG] /sybil-addresses endpoint hit');

    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { addresses, chain, options } = req.body;

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
        return res.status(400).json({ error: 'Addresses array is required' });
    }

    if (addresses.length > 10000) {
        return res.status(400).json({ error: 'Maximum 10000 addresses allowed' });
    }

    // Validate addresses
    const validAddresses = addresses.filter((addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr));
    console.log(`[DEBUG] Valid addresses: ${validAddresses.length}/${addresses.length}`);

    if (validAddresses.length === 0) {
        return res.status(400).json({ error: 'No valid addresses provided' });
    }

    try {
        console.log('[DEBUG] Fetching Alchemy API key for user...');
        const alchemyKey = await getAlchemyKeyForUser(req.user.uid);
        const moralisKey = process.env.MORALIS_API_KEY || '';

        if (!alchemyKey) {
            return res.status(400).json({ error: 'Alchemy API key required for sybil detection' });
        }

        const analyzer = new SybilAnalyzer(chain as ChainId, alchemyKey, moralisKey);

        console.log('[DEBUG] Starting sybil analysis on provided addresses...');
        const result = await withTimeout(
            analyzer.analyzeAddresses(validAddresses, {
                minClusterSize: options?.minClusterSize || 3,
            }),
            600000, // 10 minute timeout for sybil analysis
            'Sybil analysis'
        );

        console.log('[DEBUG] Sybil analysis complete');
        res.json({
            success: true,
            result,
            usageRemaining: res.locals.usageRemaining,
        });
    } catch (error: any) {
        console.error('Sybil address analysis error:', error.message);
        res.status(500).json({
            error: 'Sybil analysis failed',
            message: error.message,
        });
    }
});

export { router as analyzeRoutes };
