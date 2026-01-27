import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig, getWalletConnectConnector } from '@rainbow-me/rainbowkit'
import { linea } from 'wagmi/chains'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '4e674e1e78cf4aeccc58b6ba6e810c13'

if (!projectId) {
    throw new Error('Missing VITE_WALLETCONNECT_PROJECT_ID in .env')
}

export const config = getDefaultConfig({
    appName: 'FundTracer',
    projectId,
    chains: [linea],
    wallets: [
        {
            groupName: 'Recommended',
            wallets: [
                ({ projectId }) => ({
                    id: 'metaMask',
                    name: 'MetaMask',
                    iconUrl: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
                    iconBackground: '#fff',
                    downloadUrls: {
                        android: 'https://play.google.com/store/apps/details?id=io.metamask',
                        ios: 'https://apps.apple.com/us/app/metamask/id1438144202',
                        qrCode: 'https://metamask.io/download/',
                    },
                    createConnector: (walletDetails) => {
                        const connector = getWalletConnectConnector({ projectId, walletDetails })
                        return {
                            connector,
                            mobile: {
                                getUri: async () => {
                                    const provider = await connector.getProvider()
                                    const uri = await new Promise<string>((resolve) => {
                                        provider.once('display_uri', resolve)
                                    })
                                    // Force MetaMask app deep link on mobile
                                    return `metamask://wc?uri=${encodeURIComponent(uri)}`
                                },
                            },
                            qrCode: {
                                getUri: async () => {
                                    const provider = await connector.getProvider()
                                    return provider.connector.uri
                                },
                            },
                        }
                    },
                }),
            ],
        },
    ],
    ssr: false,
})