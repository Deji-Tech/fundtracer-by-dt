// packages/web/src/web3modal.config.ts

import { createAppKit } from '@reown/appkit/react';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { linea } from '@reown/appkit/networks';

const projectId = '50d2e6a49b5c231708de8e982bf538d5';

const metadata = {
    name: 'FundTracer',
    description: 'Trace with Precision. Scale with Confidence.',
    url: 'https://fundtracer.xyz',
    icons: ['https://fundtracer.xyz/logo.png']
};

createAppKit({
    adapters: [new Ethers5Adapter()],
    metadata,
    networks: [linea],
    projectId,
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#22c55e',
        '--w3m-border-radius-master': '8px',
    },
    features: {
        analytics: false,
        email: false,
        socials: [],
    },
    allWallets: 'SHOW',
    featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
        'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393',
        '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
    ],
    enableInjected: true,
    enableEIP6963: true,
    enableCoinbase: true,
    enableWalletConnect: true,
});

export { projectId };