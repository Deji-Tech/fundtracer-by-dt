import { createConfig, http } from 'wagmi'
import { linea } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

export const config = createConfig({
    chains: [linea],
    connectors: [
        injected({ target: 'metaMask' }),
        walletConnect({
            projectId: projectId || '',
            showQrModal: true,
            metadata: {
                name: 'FundTracer',
                description: 'Trace with Precision',
                url: 'https://fundtracer.xyz',
                icons: ['https://fundtracer.xyz/logo.png']
            }
        }),
    ],
    transports: {
        [linea.id]: http('https://rpc.linea.build'),
    },
})