import { createAppKit } from '@reown/appkit/react';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { linea } from '@reown/appkit/networks';

const projectId = '50d2e6a49b5c231708de8e982bf538d5';

// Use window.location.origin to ensure exact domain match on mobile
const metadata = {
    name: 'FundTracer',
    description: 'Trace with Precision. Scale with Confidence.',
    url: typeof window !== 'undefined'
        ? window.location.origin
        : 'https://fundtracer.xyz',
    icons: ['https://fundtracer.xyz/logo.png']  // Removed trailing space
};

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
    // Enable proper mobile handling
    enableWalletConnect: true,
});

export { projectId };