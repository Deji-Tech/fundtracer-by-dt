import { Router } from 'express';
import { ethers } from 'ethers';
import { authMiddleware } from '../middleware/auth.js';
import { getUserByAddress, updateUserTier } from '../firebase.js';

const router = Router();

// USDT contract address on Linea Mainnet
const USDT_ADDRESS = '0xA219439258ca9da29E9Cc4cE5596924745e12B93'; // Linea USDT
const PAYMENT_WALLET = '0xFF1A1D11CB6bad91C6d9250082D1DF44d84e4b87';

// Tier prices in USDT (with 6 decimals)
const TIER_PRICES = {
    pro: ethers.parseUnits('5', 6), // 5 USDT
    max: ethers.parseUnits('10', 6) // 10 USDT
};

// USDT ABI (minimal - just Transfer event)
const USDT_ABI = [
    'event Transfer(address indexed from, address indexed to, uint256 value)'
];

/**
 * Verify payment endpoint
 * Checks if user sent the correct amount of USDT to payment wallet
 */
router.post('/verify-payment', authMiddleware, async (req, res) => {
    try {
        const { userAddress, tier, paymentAddress } = req.body;

        if (!userAddress || !tier || !paymentAddress) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        if (!['pro', 'max'].includes(tier)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid tier'
            });
        }

        // Verify payment address matches
        if (paymentAddress.toLowerCase() !== PAYMENT_WALLET.toLowerCase()) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment address'
            });
        }

        // Connect to Linea RPC
        const provider = new ethers.JsonRpcProvider(
            process.env.LINEA_RPC_URL || 'https://rpc.linea.build'
        );

        // Create USDT contract instance
        const usdtContract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, provider);

        // Get current block
        const currentBlock = await provider.getBlockNumber();

        // Check last 1000 blocks (~30 minutes on Linea)
        const fromBlock = Math.max(0, currentBlock - 1000);

        // Query Transfer events from user to payment wallet
        const filter = usdtContract.filters.Transfer(userAddress, PAYMENT_WALLET);
        const events = await usdtContract.queryFilter(filter, fromBlock, currentBlock);

        // Check if any transfer matches the tier price
        const requiredAmount = TIER_PRICES[tier as 'pro' | 'max'];
        const validPayment = events.find(event => {
            // Type guard for EventLog
            if ('args' in event) {
                const amount = event.args?.value;
                return amount && amount >= requiredAmount;
            }
            return false;
        });

        if (validPayment) {
            // Payment found! Update user tier
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

            await updateUserTier(userAddress, tier, expiresAt);

            return res.json({
                success: true,
                message: `Successfully upgraded to ${tier.toUpperCase()} tier`,
                tier,
                expiresAt: expiresAt.toISOString(),
                transactionHash: validPayment.transactionHash
            });
        } else {
            return res.json({
                success: false,
                error: 'Payment not found. Please ensure you sent the correct amount and wait 2 minutes.'
            });
        }

    } catch (error: any) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Verification failed. Please try again later.'
        });
    }
});

export default router;
