/**
 * FundTracer by DT - Advanced Suspicious Activity Detection
 * Core engine for identifying non-organic on-chain behavior.
 */
export class SuspiciousDetector {
    indicators = [];
    /** Run all detection patterns */
    detect(context) {
        this.indicators = [];
        // If infrastructure, skip organic behavior checks
        if (!context.isInfrastructure) {
            this.detectRapidMovement(context.transactions);
            this.detectSameBlockActivity(context.transactions);
            this.detectSybilPatterns(context.fundingSources, context.fundingDestinations);
        }
        // Run universally applicable checks
        this.detectCircularFlow(context.transactions);
        this.detectDustAttacks(context.transactions);
        this.detectFreshWallet(context.walletAge, context.transactions);
        this.detectWashTrading(context.transactions);
        return this.indicators;
    }
    /** Calculate overall risk score (0-100) */
    calculateRiskScore(indicators) {
        if (indicators.length === 0)
            return 0;
        const totalScore = indicators.reduce((sum, ind) => sum + ind.score, 0);
        return Math.min(100, totalScore);
    }
    /** Get risk level from score */
    getRiskLevel(score) {
        if (score >= 75)
            return 'critical';
        if (score >= 50)
            return 'high';
        if (score >= 25)
            return 'medium';
        return 'low';
    }
    /** Group transactions by block */
    groupByBlock(transactions) {
        const blockMap = new Map();
        for (const tx of transactions) {
            const existing = blockMap.get(tx.blockNumber) || [];
            existing.push(tx);
            blockMap.set(tx.blockNumber, existing);
        }
        return Array.from(blockMap.entries())
            .filter(([_, txs]) => txs.length > 1)
            .map(([blockNumber, txs]) => ({
            blockNumber,
            timestamp: txs[0].timestamp,
            transactions: txs,
            isSuspicious: txs.length >= 3, // 3+ txs in same block is suspicious
            reason: txs.length >= 3 ? 'Multiple transactions in same block (possible bot/MEV)' : undefined,
        }))
            .sort((a, b) => b.transactions.length - a.transactions.length);
    }
    // --- Pattern Implementation ---
    /** Detect rapid in/out movements (< 1 hour hold time) */
    detectRapidMovement(transactions) {
        const incomingByTime = transactions
            .filter(tx => tx.isIncoming && tx.valueInEth > 0.1)
            .sort((a, b) => a.timestamp - b.timestamp);
        const outgoingByTime = transactions
            .filter(tx => !tx.isIncoming && tx.valueInEth > 0.1)
            .sort((a, b) => a.timestamp - b.timestamp);
        let rapidCount = 0;
        const evidence = [];
        for (const incoming of incomingByTime) {
            // Find outgoing within 1 hour
            const matchingOutgoing = outgoingByTime.find(out => out.timestamp > incoming.timestamp &&
                out.timestamp - incoming.timestamp < 3600 && // 1 hour
                Math.abs(out.valueInEth - incoming.valueInEth) < incoming.valueInEth * 0.1 // Similar value
            );
            if (matchingOutgoing) {
                rapidCount++;
                const holdMinutes = Math.round((matchingOutgoing.timestamp - incoming.timestamp) / 60);
                evidence.push(`${incoming.valueInEth.toFixed(4)} ETH held for ${holdMinutes} min`);
            }
        }
        if (rapidCount >= 2) {
            this.indicators.push({
                type: 'rapid_movement',
                severity: rapidCount >= 5 ? 'high' : 'medium',
                description: `Funds rapidly passed through wallet ${rapidCount} times`,
                evidence: evidence.slice(0, 5),
                score: Math.min(30, rapidCount * 6),
            });
        }
    }
    /** Detect multiple transactions in same block */
    detectSameBlockActivity(transactions) {
        const blocks = this.groupByBlock(transactions);
        const suspiciousBlocks = blocks.filter(b => b.isSuspicious);
        if (suspiciousBlocks.length > 0) {
            const maxTxsInBlock = Math.max(...suspiciousBlocks.map(b => b.transactions.length));
            this.indicators.push({
                type: 'same_block_activity',
                severity: maxTxsInBlock >= 5 ? 'high' : 'medium',
                description: `${suspiciousBlocks.length} blocks with 3+ transactions (bot/MEV behavior)`,
                evidence: suspiciousBlocks.slice(0, 3).map(b => `Block ${b.blockNumber}: ${b.transactions.length} transactions`),
                score: Math.min(25, suspiciousBlocks.length * 5),
            });
        }
    }
    /** Detect circular fund flows (A -> B -> A) */
    detectCircularFlow(transactions) {
        const sentTo = new Set();
        const receivedFrom = new Set();
        for (const tx of transactions) {
            if (tx.isIncoming && tx.from) {
                receivedFrom.add(tx.from.toLowerCase());
            }
            else if (!tx.isIncoming && tx.to) {
                sentTo.add(tx.to.toLowerCase());
            }
        }
        const circular = [...sentTo].filter(addr => receivedFrom.has(addr));
        if (circular.length >= 2) {
            this.indicators.push({
                type: 'circular_flow',
                severity: circular.length >= 5 ? 'high' : 'medium',
                description: `Circular fund flows detected with ${circular.length} addresses`,
                evidence: circular.slice(0, 5).map(a => `${a.slice(0, 10)}...`),
                score: Math.min(30, circular.length * 6),
            });
        }
    }
    /** Detect dust attacks (tiny amounts from unknown sources) */
    detectDustAttacks(transactions) {
        const dustTxs = transactions.filter(tx => tx.isIncoming && tx.valueInEth > 0 && tx.valueInEth < 0.0001);
        if (dustTxs.length >= 5) {
            this.indicators.push({
                type: 'dust_attack',
                severity: 'low',
                description: `${dustTxs.length} tiny incoming transactions (possible dust attack)`,
                evidence: dustTxs.slice(0, 3).map(tx => `${tx.valueInEth.toFixed(8)} ETH from ${tx.from.slice(0, 10)}...`),
                score: 10,
            });
        }
    }
    /** Detect fresh wallet with sudden activity */
    detectFreshWallet(walletAge, transactions) {
        if (!walletAge || !transactions)
            return;
        const isNew = walletAge < 30; // Less than 30 days old
        const isActive = transactions.length > 50;
        if (isNew && isActive) {
            this.indicators.push({
                type: 'fresh_wallet',
                severity: 'medium',
                description: `New wallet (${walletAge} days) with high activity (${transactions.length} txs)`,
                evidence: [`Created ${walletAge} days ago`, `${transactions.length} transactions`],
                score: 15,
            });
        }
    }
    /** Detect Sybil farming patterns */
    detectSybilPatterns(sources, destinations) {
        // Check if multiple destinations share the same source
        const sourceAddresses = this.flattenChildren(sources).map(n => n.address);
        const destAddresses = this.flattenChildren(destinations).map(n => n.address);
        // If high overlap between sources and destinations, suspicious
        const overlap = sourceAddresses.filter(a => destAddresses.includes(a));
        if (overlap.length >= 3) {
            this.indicators.push({
                type: 'sybil_farming',
                severity: 'high',
                description: `Potential Sybil network: ${overlap.length} addresses appear in both funding sources and destinations`,
                evidence: overlap.slice(0, 5).map(a => a.slice(0, 16) + '...'),
                score: Math.min(40, overlap.length * 8),
            });
        }
    }
    /** Detect wash trading patterns */
    detectWashTrading(transactions) {
        // Look for repeated same-value transactions between same parties
        const txPairs = new Map();
        for (const tx of transactions) {
            if (!tx.to)
                continue;
            const pair = [tx.from, tx.to].sort().join('-');
            const key = `${pair}:${tx.valueInEth.toFixed(4)}`;
            txPairs.set(key, (txPairs.get(key) || 0) + 1);
        }
        const repeatedPairs = Array.from(txPairs.entries())
            .filter(([_, count]) => count >= 3)
            .sort((a, b) => b[1] - a[1]);
        if (repeatedPairs.length > 0) {
            const maxRepeats = repeatedPairs[0][1];
            this.indicators.push({
                type: 'wash_trading',
                severity: maxRepeats >= 10 ? 'high' : 'medium',
                description: `${repeatedPairs.length} address pairs with repeated identical transfers`,
                evidence: repeatedPairs.slice(0, 3).map(([key, count]) => `${count}x identical transfers`),
                score: Math.min(35, maxRepeats * 3),
            });
        }
    }
    /** Flatten tree children to array */
    flattenChildren(node) {
        const result = [];
        for (const child of node.children) {
            result.push(child);
            result.push(...this.flattenChildren(child));
        }
        return result;
    }
}
