// ============================================================
// Web3Modal Configuration for WalletConnect Support
// ============================================================

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers5/react';

// Get project ID from environment or use default
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'f55ba487b823b0308e4621a87d4ebf76';

// Linea chain config
const linea = {
    chainId: 59144,
    name: 'Linea',
    currency: 'ETH',
    explorerUrl: 'https://lineascan.build',
    rpcUrl: 'https://rpc.linea.build'
};

// Metadata for WalletConnect
const metadata = {
    name: 'FundTracer',
    description: 'Trace with Precision. Scale with Confidence.',
    url: 'https://fundtracer-by-dt.pxxl.click',
    icons: ['https://fundtracer-by-dt.pxxl.click/logo.png']
};

// Create modal config
const ethersConfig = defaultConfig({
    metadata,
    enableEIP6963: true, // Enables EIP-6963 wallet discovery
    enableInjected: true, // Enables injected wallets (MetaMask extension)
    enableCoinbase: true, // Enables Coinbase Wallet
});

// Initialize Web3Modal with mobile-optimized settings
createWeb3Modal({
    ethersConfig,
    chains: [linea],
    projectId,
    enableAnalytics: false,
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#22c55e',
        '--w3m-border-radius-master': '8px',
    },
    // Featured wallets (shown at top on mobile)
    featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
        '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
        'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Rabby Wallet
    ],
    // Enable mobile linking
    enableOnramp: false, // Disable buy crypto for now
});

export { projectId };
