import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { linea } from '@reown/appkit/networks'

// 1. Get projectId
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '4e674e1e78cf4aeccc58b6ba6e810c13'

// 2. Set the networks
const networks = [linea, mainnet, arbitrum]

// 3. Create a metadata object
const metadata = {
    name: 'FundTracer',
    description: 'Trace with Precision. Scale with Confidence.',
    url: 'https://fundtracer.xyz', // origin must match your domain & subdomain
    icons: ['https://fundtracer.xyz/logo.png']
}

// 4. Create the AppKit instance
export const appKit = createAppKit({
    adapters: [new EthersAdapter()],
    networks: networks,
    metadata,
    projectId,
    features: {
        analytics: true // Optional - defaults to your Cloud configuration
    }
})
