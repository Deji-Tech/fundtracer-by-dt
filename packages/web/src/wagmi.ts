import { createConfig, http } from 'wagmi'
import { linea } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// MUST be a real project ID from cloud.walletconnect.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '4e674e1e78cf4aeccc58b6ba6e810c13'

if (!projectId || projectId === '4e674e1e78cf4aeccc58b6ba6e810c13') {
    console.error('Missing WalletConnect Project ID! Mobile will not work.')
}

export const config = createConfig({
    chains: [linea],
    connectors: [
        injected({
            target: 'metaMask',
            shimDisconnect: true
        }),
        // WalletConnect is REQUIRED for mobile browsers
        walletConnect({
            projectId: projectId || 'dummy',
            metadata: {
                name: 'FundTracer',
                description: 'Trace with Precision',
                url: 'https://fundtracer.xyz',
                icons: ['https://fundtracer.xyz/logo.png']
            },
            // Important for mobile
            qrModalOptions: {
                themeMode: 'dark',
                themeVariables: {
                    '--wcm-z-index': '9999'
                }
            }
        }),
    ],
    transports: {
        [linea.id]: http('https://rpc.linea.build'),
    },
})