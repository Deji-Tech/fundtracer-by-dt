import { createConfig, http } from 'wagmi'
import { linea } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '50d2e6a49b5c231708de8e982bf538d5'

// Metadata for WalletConnect
const metadata = {
    name: 'FundTracer',
    description: 'Trace with Precision. Scale with Confidence.',
    url: 'https://fundtracer.xyz',
    icons: ['https://fundtracer.xyz/logo.png']
}

export const config = createConfig({
    chains: [linea],
    connectors: [
        // Injected connector for MetaMask (works on both desktop and mobile)
        injected({ target: 'metaMask' }),
        // WalletConnect for other wallets and mobile fallback
        walletConnect({
            projectId,
            metadata,
            showQrModal: true,
        }),
    ],
    transports: {
        [linea.id]: http('https://rpc.linea.build'),
    },
    ssr: false, // Disable SSR for wallet connections
})