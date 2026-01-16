// ============================================================
// FundTracer by DT - Alchemy Provider
// Uses Alchemy's Asset Transfers API for fast bulk fetching
// Optimizes funding source detection with Moralis if available
// ============================================================
import axios from 'axios';
import { getChainConfig } from '../chains.js';
/** Alchemy RPC URLs per chain */
const ALCHEMY_URLS = {
    ethereum: 'https://eth-mainnet.g.alchemy.com/v2/',
    linea: 'https://linea-mainnet.g.alchemy.com/v2/',
    arbitrum: 'https://arb-mainnet.g.alchemy.com/v2/',
    base: 'https://base-mainnet.g.alchemy.com/v2/',
    optimism: 'https://opt-mainnet.g.alchemy.com/v2/',
    polygon: 'https://polygon-mainnet.g.alchemy.com/v2/',
};
/** Rate limiter for Alchemy - minimal delay to avoid 429s */
class AlchemyRateLimiter {
    lastCall = 0;
    minInterval = 5; // 5ms = ~200 calls/sec - fast but avoids rate limits
    async throttle() {
        const now = Date.now();
        const waitTime = Math.max(0, this.minInterval - (now - this.lastCall));
        if (waitTime > 0) {
            await new Promise(r => setTimeout(r, waitTime));
        }
        this.lastCall = Date.now();
    }
}
/** Rate limiter for Moralis - strict 25 req/sec + buffer */
class MoralisRateLimiter {
    lastCall = 0;
    minInterval = 50; // 50ms = 20 calls/sec (safe margin under 25)
    async throttle() {
        const now = Date.now();
        const waitTime = Math.max(0, this.minInterval - (now - this.lastCall));
        if (waitTime > 0) {
            await new Promise(r => setTimeout(r, waitTime));
        }
        this.lastCall = Date.now();
    }
}
/** Response cache */
class ResponseCache {
    cache = new Map();
    ttl;
    constructor(ttlMinutes = 5) {
        this.ttl = ttlMinutes * 60 * 1000;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    set(key, data) {
        this.cache.set(key, {
            data,
            expires: Date.now() + this.ttl,
        });
    }
}
export class AlchemyProvider {
    chainConfig;
    apiKey;
    moralisKey;
    rpcUrl;
    client;
    rateLimiter;
    moralisRateLimiter;
    cache;
    constructor(chain, apiKey, moralisKey) {
        this.chainConfig = getChainConfig(chain);
        this.apiKey = apiKey;
        this.moralisKey = moralisKey;
        this.rpcUrl = `${ALCHEMY_URLS[chain]}${apiKey}`;
        this.rateLimiter = new AlchemyRateLimiter();
        this.moralisRateLimiter = new MoralisRateLimiter();
        this.cache = new ResponseCache();
        if (!this.rpcUrl) {
            throw new Error(`Alchemy not supported for chain: ${chain}`);
        }
        this.client = axios.create({
            baseURL: this.rpcUrl,
            timeout: 30000,
            headers: { 'Content-Type': 'application/json' },
        });
    }
    get chainId() {
        return this.chainConfig.id;
    }
    get chainName() {
        return this.chainConfig.name;
    }
    /** Make an Alchemy JSON-RPC request */
    async rpcRequest(method, params) {
        await this.rateLimiter.throttle();
        const response = await this.client.post('', {
            jsonrpc: '2.0',
            id: 1,
            method,
            params,
        });
        if (response.data.error) {
            throw new Error(`Alchemy error: ${response.data.error.message}`);
        }
        return response.data.result;
    }
    /** Get contract code */
    async getCode(address) {
        try {
            return await this.rpcRequest('eth_getCode', [address, 'latest']);
        }
        catch {
            return '0x';
        }
    }
    /** Get wallet info (balance and tx count) */
    async getWalletInfo(address) {
        const cacheKey = `walletInfo:${address}`;
        const cached = this.cache.get(cacheKey);
        if (cached)
            return cached;
        const [balanceHex, txCountHex] = await Promise.all([
            this.rpcRequest('eth_getBalance', [address, 'latest']),
            this.rpcRequest('eth_getTransactionCount', [address, 'latest']),
        ]);
        const balanceWei = BigInt(balanceHex);
        const balanceInEth = Number(balanceWei) / 1e18;
        const txCount = parseInt(txCountHex, 16);
        const walletInfo = {
            address: address.toLowerCase(),
            chain: this.chainConfig.id,
            balance: balanceWei.toString(),
            balanceInEth,
            txCount,
            isContract: false, // Would need eth_getCode to check
        };
        this.cache.set(cacheKey, walletInfo);
        return walletInfo;
    }
    /** Get all transactions using Asset Transfers API */
    async getTransactions(address, filters) {
        const normalizedAddr = address.toLowerCase();
        const cacheKey = `txs:${normalizedAddr}:${JSON.stringify(filters)}`;
        const cached = this.cache.get(cacheKey);
        if (cached)
            return cached;
        // Get both incoming and outgoing transfers
        const [incomingTransfers, outgoingTransfers] = await Promise.all([
            this.getAssetTransfers(normalizedAddr, 'to'),
            this.getAssetTransfers(normalizedAddr, 'from'),
        ]);
        // Convert to our Transaction format and merge
        const incomingTxs = incomingTransfers.map(t => this.convertTransfer(t, normalizedAddr, true));
        const outgoingTxs = outgoingTransfers.map(t => this.convertTransfer(t, normalizedAddr, false));
        // Merge and dedupe by hash
        const txMap = new Map();
        for (const tx of [...incomingTxs, ...outgoingTxs]) {
            if (!txMap.has(tx.hash)) {
                txMap.set(tx.hash, tx);
            }
        }
        // Sort by timestamp (newest first)
        const transactions = Array.from(txMap.values())
            .sort((a, b) => b.timestamp - a.timestamp);
        this.cache.set(cacheKey, transactions);
        return transactions;
    }
    /** Get asset transfers from Alchemy */
    async getAssetTransfers(address, direction) {
        const allTransfers = [];
        let pageKey;
        // 'internal' category only supported on ETH and MATIC
        const supportsInternal = ['ethereum', 'polygon'].includes(this.chainConfig.id);
        const categories = supportsInternal
            ? ['external', 'internal', 'erc20']
            : ['external', 'erc20'];
        do {
            const params = {
                [direction === 'from' ? 'fromAddress' : 'toAddress']: address,
                category: categories,
                withMetadata: true,
                maxCount: '0x3e8', // 1000 per page
                order: 'desc',
            };
            if (pageKey) {
                params.pageKey = pageKey;
            }
            const result = await this.rpcRequest('alchemy_getAssetTransfers', [params]);
            allTransfers.push(...result.transfers);
            pageKey = result.pageKey;
            // Limit to 10000 transfers max for thorough analysis
            if (allTransfers.length >= 10000)
                break;
        } while (pageKey);
        return allTransfers;
    }
    /** Convert Alchemy transfer to our Transaction format */
    convertTransfer(transfer, targetAddress, isIncoming) {
        const blockNumber = parseInt(transfer.blockNum, 16);
        // Handle missing metadata safely
        const timestamp = transfer.metadata?.blockTimestamp
            ? new Date(transfer.metadata.blockTimestamp).getTime() / 1000
            : 0;
        const valueInEth = transfer.value || 0;
        // Convert ETH value to Wei string for consistency
        const value = (valueInEth * 1e18).toLocaleString('fullwide', { useGrouping: false }).split('.')[0];
        let category = 'unknown';
        if (transfer.category === 'external') {
            category = 'transfer';
        }
        else if (transfer.category === 'internal') {
            category = 'contract_call';
        }
        else if (transfer.category === 'erc20') {
            category = 'token_transfer';
        }
        else if (transfer.category === 'erc721' || transfer.category === 'erc1155') {
            category = 'nft_transfer';
        }
        return {
            hash: transfer.hash,
            blockNumber,
            timestamp,
            from: transfer.from.toLowerCase(),
            to: transfer.to?.toLowerCase() || null,
            value: transfer.rawContract.value || '0',
            valueInEth,
            gasUsed: '0', // Not available in asset transfers
            gasPrice: '0',
            gasCostInEth: 0,
            status: 'success',
            category,
            isIncoming,
            tokenTransfers: transfer.category !== 'external' ? [{
                    tokenAddress: transfer.rawContract.address || '',
                    tokenName: transfer.asset || 'Unknown',
                    tokenSymbol: transfer.asset || '???',
                    tokenDecimals: parseInt(transfer.rawContract.decimal || '18'),
                    from: transfer.from.toLowerCase(),
                    to: transfer.to?.toLowerCase() || '',
                    value: transfer.rawContract.value || '0',
                    valueFormatted: valueInEth,
                }] : undefined,
        };
    }
    /** Get internal transactions (included in getTransactions for Alchemy) */
    async getInternalTransactions(address, filters) {
        // Alchemy includes internal transactions in asset transfers
        // We already fetch them in getTransactions, so return empty here to avoid duplicates
        return [];
    }
    /** Get token transfers (included in getTransactions for Alchemy) */
    async getTokenTransfers(address, filters) {
        // Already included in getTransactions via asset transfers
        return [];
    }
    /** Get first funding source (optimized with Moralis) */
    async getFirstFunder(address) {
        // Try Moralis first if key exists (faster)
        if (this.moralisKey) {
            const moralisFunding = await this.getFirstFunderMoralis(address);
            if (moralisFunding)
                return moralisFunding;
        }
        // Fallback to Alchemy (thorough but slower)
        const transfers = await this.getAssetTransfers(address, 'to');
        // Find first external transfer with value
        const funderTx = transfers
            .reverse() // Oldest first
            .find(t => t.category === 'external' &&
            (typeof t.value === 'number' ? t.value : parseFloat(t.value || '0')) > 0);
        if (!funderTx)
            return null;
        const firstTx = this.convertTransfer(funderTx, address, true);
        return {
            address: funderTx.from,
            label: 'Funding Source',
            depth: 1,
            direction: 'source',
            totalValue: firstTx.valueInEth.toString(),
            totalValueInEth: firstTx.valueInEth,
            txCount: 1,
            firstTx,
            children: [],
            suspiciousScore: 0,
            suspiciousReasons: [],
        };
    }
    /** Get first funder using Moralis API */
    async getFirstFunderMoralis(address) {
        try {
            await this.moralisRateLimiter.throttle();
            const chainMap = {
                ethereum: '0x1',
                polygon: '0x89',
                arbitrum: '0xa4b1',
                optimism: '0xa',
                base: '0x2105',
                linea: '0xe708',
            };
            const moralisChain = chainMap[this.chainConfig.id] || '0x1';
            const response = await axios.get(`https://deep-index.moralis.io/api/v2.2/${address}/verbose?chain=${moralisChain}&limit=100&order=asc`, {
                headers: {
                    'accept': 'application/json',
                    'X-API-Key': this.moralisKey
                }
            });
            const data = response.data;
            if (data.result && Array.isArray(data.result)) {
                // Filter for incoming ETH transfers
                const incomingEthTransfers = data.result.filter((tx) => tx.to_address?.toLowerCase() === address.toLowerCase() &&
                    parseFloat(tx.value) > 0 &&
                    tx.receipt_status === '1' // Only successful transactions
                );
                if (incomingEthTransfers.length > 0) {
                    // Sort by block number to find the first one
                    incomingEthTransfers.sort((a, b) => parseInt(a.block_number) - parseInt(b.block_number));
                    const firstTx = incomingEthTransfers[0];
                    // Convert minimal Moralis tx to Transaction format
                    const transaction = {
                        hash: firstTx.hash,
                        blockNumber: parseInt(firstTx.block_number),
                        timestamp: new Date(firstTx.block_timestamp).getTime() / 1000,
                        from: firstTx.from_address,
                        to: firstTx.to_address,
                        value: firstTx.value,
                        valueInEth: parseFloat(firstTx.value) / 1e18,
                        gasUsed: firstTx.receipt_gas_used,
                        gasPrice: firstTx.gas_price,
                        gasCostInEth: (parseFloat(firstTx.receipt_gas_used) * parseFloat(firstTx.gas_price)) / 1e18,
                        status: 'success',
                        category: 'transfer',
                        isIncoming: true,
                    };
                    return {
                        address: firstTx.from_address,
                        label: 'Funding Source',
                        depth: 1,
                        direction: 'source',
                        totalValue: transaction.valueInEth.toString(),
                        totalValueInEth: transaction.valueInEth,
                        txCount: 1,
                        firstTx: transaction,
                        children: [],
                        suspiciousScore: 0,
                        suspiciousReasons: [],
                    };
                }
            }
            return null;
        }
        catch (error) {
            // Moralis failure shouldn't stop flow, just return null to trigger fallback
            console.error(`Moralis API error for ${address} on ${this.chainConfig.id}:`, error);
            return null;
        }
    }
}
