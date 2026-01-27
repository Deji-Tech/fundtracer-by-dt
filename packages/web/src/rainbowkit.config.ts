import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, createConfig } from 'wagmi';
import { linea, lineaTestnet } from 'wagmi/chains';

const projectId = '50d2e6a49b5c231708de8e982bf538d5'; // FundTracer Project ID

export const config = getDefaultConfig({
    appName: 'FundTracer',
    projectId: projectId || 'DEFAULT', // RainbowKit works without projectId for injected wallets
    chains: [linea],
    transports: {
        [linea.id]: http(),
    },
    ssr: false, // Set true if using Next.js
});