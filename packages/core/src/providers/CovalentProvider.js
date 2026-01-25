export class CovalentProvider {
    chain;
    apiKey;
    baseUrl = 'https://api.covalenthq.com/v1';
    constructor(chain, apiKey) {
        this.chain = chain;
        this.apiKey = apiKey;
    }
    getChainId() {
        const map = {
            ethereum: 'eth-mainnet',
            linea: 'linea-mainnet',
            arbitrum: 'arbitrum-mainnet',
            optimism: 'optimism-mainnet',
            base: 'base-mainnet',
            polygon: 'matic-mainnet',
        };
        return map[this.chain] || 'eth-mainnet';
    }
    async getFirstFunder(address) {
        try {
            const chainName = this.getChainId();
            const url = `${this.baseUrl}/${chainName}/address/${address}/transactions_v3/`;
            const params = new URLSearchParams({
                'key': this.apiKey,
                'page-size': '5',
                'block-signed-at-asc': 'true',
                'no-logs': 'true'
            });
            const response = await fetch(`${url}?${params}`);
            if (!response.ok) {
                console.warn(`[Covalent] API error: ${response.status} ${await response.text()}`);
                return null;
            }
            const data = await response.json();
            const items = data.data?.items;
            if (!items || items.length === 0)
                return null;
            for (const tx of items) {
                if (!tx.successful)
                    continue;
                if (tx.to_address?.toLowerCase() === address.toLowerCase()) {
                    const valueEth = parseFloat(tx.value) / 1e18;
                    if (valueEth > 0) {
                        const timestamp = new Date(tx.block_signed_at).getTime();
                        return {
                            address: tx.from_address,
                            label: tx.from_address_label || 'Funding Source',
                            depth: 1,
                            direction: 'source',
                            totalValue: valueEth.toString(),
                            totalValueInEth: valueEth,
                            txCount: 1,
                            firstTx: {
                                hash: tx.tx_hash,
                                blockNumber: tx.block_height,
                                timestamp,
                                from: tx.from_address,
                                to: tx.to_address,
                                value: tx.value,
                                valueInEth: valueEth,
                                gasUsed: tx.gas_spent.toString(),
                                gasPrice: tx.gas_price.toString(),
                                gasCostInEth: (tx.gas_spent * tx.gas_price) / 1e18,
                                status: tx.successful ? 'success' : 'failed',
                                category: 'transfer',
                                isIncoming: true
                            },
                            children: [],
                            suspiciousScore: 0,
                            suspiciousReasons: [],
                        };
                    }
                }
            }
            return null;
        }
        catch (error) {
            console.error('[Covalent] Error finding funding source:', error);
            return null;
        }
    }
    async getAllTransactions(address) {
        return [];
    }
}
