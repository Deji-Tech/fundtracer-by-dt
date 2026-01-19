/**
 * Clean up test data from Firestore
 * Run this to remove all seeded test data before going live
 */
import admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

// Initialize Firebase Admin
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (privateKey && !privateKey.includes('-----BEGIN')) {
    privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
}
privateKey = privateKey?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Firebase credentials not found');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    }),
});

const db = admin.firestore();

async function deleteCollection(collectionPath: string) {
    const collectionRef = db.collection(collectionPath);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
        console.log(`  ℹ️  ${collectionPath}: already empty`);
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`  ✅ ${collectionPath}: deleted ${snapshot.size} documents`);
}

async function deleteNestedCollection(parentPath: string, collectionName: string) {
    const parentRef = db.doc(parentPath);
    const collectionRef = parentRef.collection(collectionName);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
        console.log(`  ℹ️  ${parentPath}/${collectionName}: already empty`);
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`  ✅ ${parentPath}/${collectionName}: deleted ${snapshot.size} documents`);
}

async function cleanupTestData() {
    console.log('🧹 Cleaning up test data from Firestore...\n');

    try {
        // Delete test users
        console.log('👥 Deleting test users...');
        await deleteCollection('users');

        // Delete analytics subcollections
        console.log('\n📊 Deleting test analytics...');
        await deleteNestedCollection('analytics/daily_stats', 'records');
        await deleteNestedCollection('analytics/revenue', 'payments');
        await deleteNestedCollection('analytics/user_activity', 'logins');

        // Delete admin actions
        console.log('\n📝 Deleting admin action logs...');
        await deleteCollection('admin_actions');

        console.log('\n✨ Test data cleanup complete!');
        console.log('\n💡 Your admin dashboard will now show real data as users interact with the platform.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning up test data:', error);
        process.exit(1);
    }
}

cleanupTestData();
