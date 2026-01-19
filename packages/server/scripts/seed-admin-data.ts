/**
 * Seed script to populate Firestore with sample analytics data
 * Run this once to test the admin dashboard
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
    console.error('❌ Firebase credentials not found in .env');
    console.log('Make sure you have FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
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

async function seedData() {
    console.log('🌱 Seeding Firestore with sample data...\n');

    try {
        // 1. Create sample users
        console.log('👥 Creating sample users...');
        const users = [
            {
                id: 'user1',
                email: 'alice@example.com',
                displayName: 'Alice Johnson',
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
                tier: 'pro',
                pohVerified: true,
                blacklisted: false,
                analysisCount: 15,
                createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
                lastActive: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
            },
            {
                id: 'user2',
                email: 'bob@example.com',
                displayName: 'Bob Smith',
                walletAddress: '0x1234567890123456789012345678901234567890',
                tier: 'free',
                pohVerified: false,
                blacklisted: false,
                analysisCount: 5,
                createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
                lastActive: Date.now() - 24 * 60 * 60 * 1000,
            },
            {
                id: 'user3',
                email: 'charlie@example.com',
                displayName: 'Charlie Brown',
                walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
                tier: 'max',
                pohVerified: true,
                blacklisted: false,
                analysisCount: 42,
                createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
                lastActive: Date.now() - 1 * 60 * 60 * 1000,
            },
            {
                id: 'user4',
                email: 'spam@badactor.com',
                displayName: 'Spammer',
                walletAddress: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
                tier: 'free',
                pohVerified: false,
                blacklisted: true,
                analysisCount: 2,
                createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
                lastActive: Date.now() - 5 * 24 * 60 * 60 * 1000,
            },
        ];

        for (const user of users) {
            await db.collection('users').doc(user.id).set(user);
        }
        console.log(`✅ Created ${users.length} sample users\n`);

        // 2. Create daily stats for last 7 days
        console.log('📊 Creating daily analytics...');
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dailyStats = {
                date: dateStr,
                visitors: Math.floor(Math.random() * 100) + 50,
                analysisCount: Math.floor(Math.random() * 50) + 20,
                chainUsage: {
                    ethereum: Math.floor(Math.random() * 30) + 10,
                    arbitrum: Math.floor(Math.random() * 20) + 5,
                    base: Math.floor(Math.random() * 15) + 3,
                    linea: Math.floor(Math.random() * 10) + 2,
                },
                featureUsage: {
                    wallet: Math.floor(Math.random() * 40) + 15,
                    compare: Math.floor(Math.random() * 10) + 2,
                    sybil: Math.floor(Math.random() * 5) + 1,
                    contract: Math.floor(Math.random() * 15) + 5,
                },
                lastUpdated: Date.now(),
            };

            await db
                .collection('analytics')
                .doc('daily_stats')
                .collection('records')
                .doc(dateStr)
                .set(dailyStats);
        }
        console.log('✅ Created 7 days of analytics\n');

        // 3. Create sample payments
        console.log('💰 Creating payment records...');
        const payments = [
            {
                userId: 'user1',
                userEmail: 'alice@example.com',
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
                amount: 0.001,
                txHash: '0xabcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234',
                tierUnlocked: 'pro',
                chain: 'linea',
                timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000,
            },
            {
                userId: 'user3',
                userEmail: 'charlie@example.com',
                walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
                amount: 0.001,
                txHash: '0x5678efgh5678efgh5678efgh5678efgh5678efgh5678efgh5678efgh5678efgh',
                tierUnlocked: 'max',
                chain: 'linea',
                timestamp: Date.now() - 50 * 24 * 60 * 60 * 1000,
            },
        ];

        for (const payment of payments) {
            await db
                .collection('analytics')
                .doc('revenue')
                .collection('payments')
                .add(payment);
        }
        console.log(`✅ Created ${payments.length} payment records\n`);

        // 4. Create admin action logs
        console.log('📝 Creating admin action logs...');
        const adminActions = [
            {
                action: 'tier_change',
                userId: 'user1',
                newTier: 'pro',
                timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000,
            },
            {
                action: 'poh_verify',
                userId: 'user1',
                timestamp: Date.now() - 19 * 24 * 60 * 60 * 1000,
            },
            {
                action: 'blacklist',
                userId: 'user4',
                timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
            },
        ];

        for (const action of adminActions) {
            await db.collection('admin_actions').add(action);
        }
        console.log(`✅ Created ${adminActions.length} admin action logs\n`);

        // 5. Create user activity logs
        console.log('🔄 Creating user activity logs...');
        for (let i = 0; i < 10; i++) {
            await db
                .collection('analytics')
                .doc('user_activity')
                .collection('logins')
                .add({
                    userId: users[Math.floor(Math.random() * users.length)].id,
                    event: 'login',
                    timestamp: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
                });
        }
        console.log('✅ Created 10 login events\n');

        console.log('🎉 Database seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - ${users.length} users (1 Pro, 1 Max, 1 Free, 1 Blacklisted)`);
        console.log(`   - 7 days of analytics`);
        console.log(`   - ${payments.length} payments (0.002 ETH total revenue)`);
        console.log(`   - ${adminActions.length} admin actions`);
        console.log('   - 10 login events');
        console.log('\n✨ Refresh your admin dashboard to see the data!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedData();
