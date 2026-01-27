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
        socials: []
    }
});

export { projectId };