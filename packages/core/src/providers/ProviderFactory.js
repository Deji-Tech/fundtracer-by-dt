// ============================================================
// FundTracer by DT - Provider Factory
// Alchemy-only provider (fast, reliable)
// ============================================================
import { AlchemyProvider } from './AlchemyProvider.js';
/** Factory for creating chain-specific providers with auto-selection */
export class ProviderFactory {
    apiKeys;
    providers = new Map();
    constructor(apiKeys) {
        this.apiKeys = apiKeys;
        // Validate at least one provider is configured
        const hasAnyKey = apiKeys.alchemy || apiKeys.etherscan || apiKeys.lineascan ||
            apiKeys.arbiscan || apiKeys.basescan;
        if (!hasAnyKey) {
            throw new Error('No API keys configured. Please set at least one provider key.\n' +
                'Run: fundtracer config --set-key alchemy:YOUR_KEY\n' +
                'Or set ALCHEMY_API_KEY environment variable.');
        }
    }
    /** Get provider for a specific chain */
    getProvider(chainId) {
        // Return cached provider if exists
        const cached = this.providers.get(chainId);
        if (cached)
            return cached;
        // Try Alchemy first (fastest, most reliable)
        if (this.apiKeys.alchemy) {
            console.log(`[ProviderFactory] Using Alchemy for ${chainId}`);
            const provider = new AlchemyProvider(chainId, this.apiKeys.alchemy, this.apiKeys.moralis, this.getExplorerKeyForChain(chainId));
            this.providers.set(chainId, provider);
            return provider;
        }
        // Fallback to chain-specific explorer API
        const explorerKey = this.getExplorerKeyForChain(chainId);
        if (explorerKey) {
            console.log(`[ProviderFactory] Using explorer API for ${chainId}`);
            // For now, create a limited AlchemyProvider - EtherscanProvider will be added
            throw new Error(`Etherscan provider not yet implemented. Please configure Alchemy.\n` +
                `Run: fundtracer config --set-key alchemy:YOUR_KEY`);
        }
        throw new Error(`No provider available for chain: ${chainId}\n` +
            `Configure Alchemy (works for all chains): fundtracer config --set-key alchemy:YOUR_KEY`);
    }
    /** Get explorer API key for a specific chain */
    getExplorerKeyForChain(chainId) {
        const keyMap = {
            ethereum: this.apiKeys.etherscan,
            linea: this.apiKeys.lineascan,
            arbitrum: this.apiKeys.arbiscan,
            base: this.apiKeys.basescan,
            optimism: this.apiKeys.optimism,
            polygon: this.apiKeys.polygonscan,
        };
        return keyMap[chainId];
    }
    /** Check which providers are available */
    getAvailableProviders() {
        return [
            { name: 'Alchemy', available: !!this.apiKeys.alchemy, recommended: true },
            { name: 'Moralis', available: !!this.apiKeys.moralis, recommended: true },
            { name: 'Dune', available: !!this.apiKeys.dune, recommended: false },
            { name: 'Etherscan', available: !!this.apiKeys.etherscan, recommended: false },
        ];
    }
    /** Get Dune API key if available */
    getDuneKey() {
        return this.apiKeys.dune;
    }
    /** Update API keys */
    setApiKeys(apiKeys) {
        this.apiKeys = { ...this.apiKeys, ...apiKeys };
        this.providers.clear();
    }
    /** Clear all cached providers */
    clearCache() {
        this.providers.forEach(p => {
            if (p.clearCache) {
                p.clearCache();
            }
        });
    }
}
export { AlchemyProvider };
