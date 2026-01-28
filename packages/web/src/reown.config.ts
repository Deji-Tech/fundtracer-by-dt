import { createAppKit } from '@reown/appkit/react'
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5'
import { linea, mainnet, arbitrum } from '@reown/appkit/networks'

// Get projectId from environment or use default
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '50d2e6a49b5c231708de8e982bf538d5'

// Set the networks
const networks = [linea, mainnet, arbitrum]

// Create metadata object
const metadata = {
    name: 'FundTracer',
    description: 'Trace with Precision. Scale with Confidence.',
    url: 'https://fundtracer.xyz',
    icons: ['https://fundtracer.xyz/logo.png']
}

// Create the AppKit instance with all wallets enabled
export const appKit = createAppKit({
    adapters: [new Ethers5Adapter()],
    networks: networks,
    metadata,
    projectId,
    features: {
        analytics: false, // Disable analytics
        email: false, // Disable email login
        socials: [] // Disable social logins
    },
    // Featured wallets (optional - these will be shown first)
    featuredWalletIds: [
        'io.metamask',
        'com.coinbase.wallet',
        'me.rainbow',
        'io.zerion.wallet'
    ],
    themeMode: 'dark',
    themeVariables: {
        '--w3m-accent': '#22c55e'
    }
})
