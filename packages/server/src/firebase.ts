/**
 * Firebase Admin SDK Initialization
 * Handles server-side authentication verification and Firestore access.
 */
import admin from 'firebase-admin';

let firebaseInitialized = false;

export function initializeFirebase() {
    if (firebaseInitialized) return;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Support base64-encoded private key for platforms like Vercel
    if (privateKey && !privateKey.includes('-----BEGIN')) {
        try {
            privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
        } catch (e) {
            console.warn('Failed to decode base64 private key, using as-is');
        }
    }

    // Replace escaped newlines
    privateKey = privateKey?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
        console.warn('Firebase credentials not configured. Auth will be disabled.');
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
