/**
 * Firebase Admin SDK Initialization
 * Handles server-side authentication verification and Firestore access.
 */
import admin from 'firebase-admin';
import fs from 'fs';

let firebaseInitialized = false;

export function initializeFirebase() {
    if (firebaseInitialized) return;

    console.log('[Firebase] Starting initialization...');

    // Method 1: Use base64-encoded service account JSON (most reliable)
    const base64ServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    if (base64ServiceAccount) {
        try {
            console.log('[Firebase] Found base64 service account, decoding...');
            const decoded = Buffer.from(base64ServiceAccount, 'base64').toString('utf-8');
            const serviceAccount = JSON.parse(decoded);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            firebaseInitialized = true;
            console.log('[Firebase] ✅ Initialized from base64 service account');
            return;
        } catch (error) {
            console.error('[Firebase] Failed to decode base64 service account:', error);
        }
    }

    // Method 2: Use GOOGLE_APPLICATION_CREDENTIALS file
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    console.log('[Firebase] Checking credentials file path:', credentialsPath || '(not set)');
    if (credentialsPath && fs.existsSync(credentialsPath)) {
        try {
            const serviceAccount = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            firebaseInitialized = true;
            console.log('[Firebase] ✅ Initialized from credentials file');
            return;
        } catch (error) {
            console.error('[Firebase] Failed to load credentials file:', error);
        }
    }

    // Method 2: Use individual environment variables (fallback)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log('[Firebase] Checking env vars...');
    console.log('[Firebase] Project ID:', projectId ? '✓ set' : '✗ missing');
    console.log('[Firebase] Client Email:', clientEmail ? '✓ set' : '✗ missing');
    console.log('[Firebase] Private Key:', privateKey ? `✓ set (${privateKey.length} chars)` : '✗ missing');

    // Support base64-encoded private key for platforms like Vercel
    if (privateKey && !privateKey.includes('-----BEGIN')) {
        try {
            console.log('[Firebase] Decoding base64 private key...');
            privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
        } catch (e) {
            console.warn('[Firebase] Failed to decode base64 private key, using as-is');
        }
    }

    // Replace escaped newlines
    privateKey = privateKey?.replace(/\\n/g, '\n');

    console.log('[Firebase] Private key starts with BEGIN:', privateKey?.includes('-----BEGIN PRIVATE KEY-----'));

    if (!projectId || !clientEmail || !privateKey) {
        console.warn('[Firebase] Firebase credentials not configured. Auth will be disabled.');
        return;
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
        firebaseInitialized = true;
        console.log('Firebase Admin SDK initialized');
    } catch (error) {
        console.error('Failed to initialize Firebase:', error);
    }
}

export function getAuth(): admin.auth.Auth {
    return admin.auth();
}

export function getFirestore(): admin.firestore.Firestore {
    return admin.firestore();
}

export { admin };
