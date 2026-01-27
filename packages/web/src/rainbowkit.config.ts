import '@rainbow-me/rainbowkit/styles.css'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { linea } from 'wagmi/chains'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
    console.error('Missing VITE_WALLETCONNECT_PROJECT_ID')
}

// Line 11 is below - this MUST use getDefaultConfig, not createConfig
export const config = getDefaultConfig({
    appName: 'FundTracer',
    projectId: projectId || 'placeholder',
    chains: [linea],
    ssr: false,
})