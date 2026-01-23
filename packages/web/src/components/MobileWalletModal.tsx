import React from 'react';
import './MobileWalletModal.css';

interface WalletOption {
    id: string;
    name: string;
    icon: string;
    deepLink: string;
}

interface MobileWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onWalletConnect: () => void; // Fallback to WalletConnect modal
}

// Top 10 mobile wallets with deep links
const MOBILE_WALLETS: WalletOption[] = [
    {
        id: 'metamask',
        name: 'MetaMask',
        icon: '🦊',
        deepLink: `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`
    },
    {
        id: 'trust',
        name: 'Trust Wallet',
        icon: '🛡️',
        deepLink: `https://link.trustwallet.com/open_url?coin_id=60&url=${encodeURIComponent(window.location.href)}`
    },
    {
        id: 'rainbow',
        name: 'Rainbow',
        icon: '🌈',
        deepLink: `https://rnbwapp.com/open_url?url=${encodeURIComponent(window.location.href)}`
    },
    {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        icon: '🔵',
        deepLink: `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(window.location.href)}`
    },
    {
        id: 'okx',
        name: 'OKX Wallet',
        icon: '⚫',
        deepLink: `okx://wallet/dapp/url?dappUrl=${encodeURIComponent(window.location.href)}`
    },
    {
        id: 'bitget',
        name: 'Bitget Wallet',
        icon: '🔷',
        deepLink: `https://bkcode.vip?action=dapp&url=${encodeURIComponent(window.location.href)}`
    },
    {
        id: 'zerion',
        name: 'Zerion',
        icon: '🟣',
        deepLink: `https://wallet.zerion.io/wc?uri=${encodeURIComponent(window.location.href)}`
    },
    {
        id: 'phantom',
        name: 'Phantom',
        icon: '👻',
        deepLink: `https://phantom.app/ul/browse/${encodeURIComponent(window.location.href)}`
    },
    {
        id: 'rabby',
        name: 'Rabby Wallet',
        icon: '🐰',
        deepLink: `https://rabby.io/redirect?url=${encodeURIComponent(window.location.href)}`
    },
    {
        id: 'imtoken',
        name: 'imToken',
        icon: '🔶',
        deepLink: `imtokenv2://navigate/DappView?url=${encodeURIComponent(window.location.href)}`
    }
];

const MobileWalletModal: React.FC<MobileWalletModalProps> = ({ isOpen, onClose, onWalletConnect }) => {
    if (!isOpen) return null;

    const handleWalletClick = (wallet: WalletOption) => {
        window.location.href = wallet.deepLink;
    };

    return (
        <div className="mobile-wallet-overlay" onClick={onClose}>
            <div className="mobile-wallet-modal" onClick={e => e.stopPropagation()}>
                <div className="mobile-wallet-header">
                    <h2>Connect Wallet</h2>
                    <button className="mobile-wallet-close" onClick={onClose}>×</button>
                </div>

                <p className="mobile-wallet-subtitle">
                    Select your preferred wallet app
                </p>

                <div className="mobile-wallet-grid">
                    {MOBILE_WALLETS.map(wallet => (
                        <button
                            key={wallet.id}
                            className="mobile-wallet-option"
                            onClick={() => handleWalletClick(wallet)}
                        >
                            <span className="mobile-wallet-icon">{wallet.icon}</span>
                            <span className="mobile-wallet-name">{wallet.name}</span>
                        </button>
                    ))}
                </div>

                <div className="mobile-wallet-divider">
                    <span>or</span>
                </div>

                <button className="mobile-wallet-qr-btn" onClick={onWalletConnect}>
                    🔗 Use WalletConnect QR Code
                </button>

                <p className="mobile-wallet-hint">
                    Don't have a wallet? <a href="https://ethereum.org/wallets" target="_blank" rel="noopener noreferrer">Get one here</a>
                </p>
            </div>
        </div>
    );
};

export default MobileWalletModal;
