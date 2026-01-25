// ============================================================
// FundTracer by DT - Funding Tree Builder
// ============================================================
import { getAddressInfo } from '../data/KnownAddresses.js';
const DEFAULT_CONFIG = {
    maxDepth: 2, // Reduced depth to minimize API calls
    direction: 'both',
};
export class FundingTreeBuilder {
    provider;
    visitedAddresses = new Set();
    onProgress;
    constructor(provider, onProgress) {
        this.provider = provider;
        this.onProgress = onProgress;
    }
    /** Build funding tree for sources (who funded this wallet) */
    async buildSourceTree(address, config = {}, preloadedTxs) {
        this.visitedAddresses.clear();
        const mergedConfig = { ...DEFAULT_CONFIG, ...config };
        return this.buildTree(address, 0, mergedConfig, 'source', preloadedTxs);
    }
    /** Build funding tree for destinations (who this wallet funded) */
    async buildDestinationTree(address, config = {}, preloadedTxs) {
        this.visitedAddresses.clear();
        const mergedConfig = { ...DEFAULT_CONFIG, ...config };
        return this.buildTree(address, 0, mergedConfig, 'destination', preloadedTxs);
    }
    /** Recursive tree builder */
    async buildTree(address, depth, config, direction, preloadedTxs) {
        const normalizedAddr = address.toLowerCase();
        // Create base node
        const node = {
            address: normalizedAddr,
            depth,
            direction,
            totalValue: '0',
            totalValueInEth: 0,
            txCount: 0,
            children: [],
            suspiciousScore: 0,
            suspiciousReasons: [],
        };
        // Check if we've hit max depth or already visited
        if (depth >= config.maxDepth || this.visitedAddresses.has(normalizedAddr)) {
            return node;
        }
        this.visitedAddresses.add(normalizedAddr);
        // Check for infrastructure address (Bridge, Exchange, etc)
        // If identified, we stop tracing deeper as these are terminal nodes for Sybil analysis
        const infraInfo = getAddressInfo(normalizedAddr, this.provider.chainId);
        if (infraInfo) {
            node.isInfrastructure = true;
            node.label = infraInfo.name;
            node.entityType = infraInfo.type === 'exchange' ? 'cex' :
                infraInfo.type === 'bridge' ? 'bridge' :
                    infraInfo.type === 'mixer' ? 'mixer' :
                        infraInfo.category === 'dex' ? 'dex' : 'contract';
            // Stop recursion for infrastructure
            return node;
        }
        // Report progress
        if (this.onProgress) {
            this.onProgress({
                stage: direction === 'source' ? 'Tracing funding sources' : 'Tracing destinations',
                current: this.visitedAddresses.size,
                total: config.maxDepth * 10, // Estimated
                message: `Analyzing ${normalizedAddr.slice(0, 10)}... (depth ${depth})`,
            });
        }
        try {
            // Get transactions
            let txs;
            // Use preloaded transactions if at root level and available
            if (depth === 0 && preloadedTxs) {
                txs = preloadedTxs;
            }
            else {
                txs = await this.provider.getTransactions(normalizedAddr, {
                    timeRange: config.timeRange,
                    minValue: config.minValueEth,
                });
            }
            // Filter by direction AND only native ETH transfers (not tokens which have different value scales)
            const isEthTransfer = (tx) => tx.category === 'transfer' || tx.category === 'contract_call';
            const relevantTxs = direction === 'source'
                ? txs.filter(tx => tx.isIncoming && tx.valueInEth > 0 && isEthTransfer(tx))
                : txs.filter(tx => !tx.isIncoming && tx.valueInEth > 0 && isEthTransfer(tx));
            // Aggregate by counterparty
            const counterpartyMap = new Map();
            for (const tx of relevantTxs) {
                const counterparty = direction === 'source' ? tx.from : tx.to;
                if (!counterparty)
                    continue;
                const existing = counterpartyMap.get(counterparty) || { txs: [], totalValue: 0 };
                existing.txs.push(tx);
                existing.totalValue += tx.valueInEth;
                counterpartyMap.set(counterparty, existing);
            }
            // Sort by total value and take top addresses
            const sortedCounterparties = Array.from(counterpartyMap.entries())
                .sort((a, b) => b[1].totalValue - a[1].totalValue)
                .slice(0, 10); // Limit children per node
            // Build child nodes (with depth + 1 only if not at leaf level)
            const childPromises = sortedCounterparties.map(async ([addr, data]) => {
                const childNode = {
                    address: addr.toLowerCase(),
                    depth: depth + 1,
                    direction,
                    totalValue: (data.totalValue * 1e18).toString(),
                    totalValueInEth: data.totalValue,
                    txCount: data.txs.length,
                    firstTx: data.txs[data.txs.length - 1], // Oldest
                    children: [],
                    suspiciousScore: 0,
                    suspiciousReasons: [],
                };
                // Recursively build if not at max depth
                if (depth + 1 < config.maxDepth && !this.visitedAddresses.has(addr.toLowerCase())) {
                    const childTree = await this.buildTree(addr, depth + 1, config, direction);
                    childNode.children = childTree.children;
                }
                return childNode;
            });
            node.children = await Promise.all(childPromises);
            node.txCount = relevantTxs.length;
            node.totalValueInEth = relevantTxs.reduce((sum, tx) => sum + tx.valueInEth, 0);
            node.totalValue = (node.totalValueInEth * 1e18).toString();
        }
        catch (error) {
            // Log only a brief error message, not full stack trace
            const msg = error?.response?.status === 429
                ? 'Rate limited by API'
                : (error?.message || 'Unknown error');
            console.error(`[${normalizedAddr.slice(0, 10)}...] Skipped: ${msg}`);
        }
        return node;
    }
    /** Find common ancestors between two wallets */
    /** Find common ancestors between two wallets */
    async findCommonAncestors(address1, address2, maxDepth = 3) {
        // Try fast check first (direct funding source comparison)
        const [source1, source2] = await Promise.all([
            this.provider.getFirstFunder(address1),
            this.provider.getFirstFunder(address2)
        ]);
        if (source1 && source2 && source1.address === source2.address) {
            return [source1.address];
        }
        // Fallback to deep tree search if simple check fails
        const tree1 = await this.buildSourceTree(address1, { maxDepth });
        this.visitedAddresses.clear();
        const tree2 = await this.buildSourceTree(address2, { maxDepth });
        const addresses1 = this.flattenTreeAddresses(tree1);
        const addresses2 = this.flattenTreeAddresses(tree2);
        return addresses1.filter(addr => addresses2.includes(addr));
    }
    /** Flatten tree to list of addresses */
    flattenTreeAddresses(node) {
        const addresses = [node.address];
        for (const child of node.children) {
            addresses.push(...this.flattenTreeAddresses(child));
        }
        return addresses;
    }
}
