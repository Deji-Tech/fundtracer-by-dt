// packages/web/src/web3modal.config.ts

import { createAppKit } from '@reown/appkit/react';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { linea } from '@reown/appkit/networks';

// 1. Get projectId from https://cloud.reown.com
const projectId = '50d2e6a49b5c231708de8e982bf538d5';

// 2. Create metadata - URL must match your domain exactly
const metadata = {
    name: 'FundTracer',
    description: 'Trace with Precision. Scale with Confidence.',
    url: 'https://fundtracer.xyz',
    icons: ['https://fundtracer.xyz/logo.png']
};

// 3. Create the AppKit instance
createAppKit({
    adapters: [new Ethers5Adapter()],
    networks: [linea],
    metadata,
    projectId,
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#22c55e',
    },
    features: {
        analytics: false,
        email: false,
        socials: [],
    },
    enableInjected: true,
    enableEIP6963: true,
    enableCoinbase: true,
    enableWalletConnect: true,
    featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
        '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
        'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
        'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Rabby Wallet
    ]
});

export { projectId };