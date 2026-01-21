import React, { useState } from 'react';
import { ethers } from 'ethers';
const { parseEther } = ethers.utils;
import { ChainId, AnalysisResult, MultiWalletResult, getEnabledChains, CHAINS } from '@fundtracer/core';
import { useAuth } from './contexts/AuthContext';
import { analyzeWallet, compareWallets, analyzeContract, loadMoreTransactions, trackVisit } from './api';
import Header from './components/Header';
import AuthPanel from './components/AuthPanel';
import HowToUse from './components/HowToUse';
import WalletInput from './components/WalletInput';
import ChainSelector from './components/ChainSelector';
import EmptyState from './components/EmptyState';
import AnalysisView from './components/AnalysisView';
import MultiWalletView from './components/MultiWalletView';
import ContractAnalysisView, { ContractAnalysisResult } from './components/ContractAnalysisView';
import ComingSoonModal from './components/ComingSoonModal';
import SybilDetector from './components/SybilDetector';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';
import OnboardingModal from './components/OnboardingModal';
import FeedbackModal from './components/FeedbackModal';
import PaymentModal from './components/PaymentModal';
import ContractSearch from './components/ContractSearch';

import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import ProfilePage from './components/ProfilePage';

type ViewMode = 'wallet' | 'contract' | 'compare' | 'sybil' | 'profile';

function App() {
    // Simple routing for Privacy Policy standalone page
    if (window.location.pathname === '/privacypolicy' || window.location.pathname === '/privacy') {
        return <PrivacyPolicyPage />;
    }

    const { user, profile, loading: authLoading, getSigner } = useAuth();
    // parseEther is imported at top level now

    const [viewMode, setViewMode] = useState<ViewMode>('wallet');
    const [selectedChain, setSelectedChain] = useState<ChainId>('ethereum');
    const [walletAddresses, setWalletAddresses] = useState<string[]>(['']);
    const [contractAddress, setContractAddress] = useState<string>('');
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [showHowToUse, setShowHowToUse] = useState(false);
    // const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false); // REMOVED: Now using strict routing
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [showApiKeyForm, setShowApiKeyForm] = useState(false);

    // Analysis state
    // ... (rest of state omitted for brevity, keeping existing)

    // ... (logic omitted for brevity)

    // Show auth loading state
    if (authLoading) {
        return (
            <div className="app-container">
                <Header onSettingsClick={() => setShowApiKeyForm(true)} />
                <main className="main-content animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                        <div className="loading-spinner" />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Header
                onSettingsClick={() => {
                    setShowApiKeyForm(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onProfileClick={() => {
                    setViewMode('profile');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onUpgradeClick={() => setShowPayment(true)}
                onFeedbackClick={() => setShowFeedback(true)}
                isUpgradeActive={showPayment}
            />

            <main className="main-content">
                {/* Auth Panel - Shows sign in or user info if NOT in profile mode */}
                {viewMode !== 'profile' && (
                    <AuthPanel
                        showApiKeyForm={showApiKeyForm}
                        setShowApiKeyForm={setShowApiKeyForm}
                    />
                )}

                {/* How To Use Section */}
                {viewMode !== 'profile' && (
                    <HowToUse isOpen={showHowToUse} onToggle={() => setShowHowToUse(!showHowToUse)} />
                )}

                {/* Main Content */}
                {viewMode === 'profile' ? (
                    <ProfilePage onBack={() => setViewMode('wallet')} />
                ) : (
                    // Only show analysis UI if authenticated
                    user ? (
                        <>
                            {/* Sybil Mode - Full Screen Component */}
                            {viewMode === 'sybil' ? (
                                <div style={{ marginBottom: 'var(--space-4)' }}>
                                    {/* Mode Selector - Compact */}
                                    <div className="mode-selector" style={{ marginBottom: 'var(--space-4)' }}>
                                        <button
                                            className={`mode-btn ${(viewMode as ViewMode) === 'wallet' ? 'active' : ''}`}
                                            onClick={() => setViewMode('wallet')}
                                        >
                                            Wallet
                                        </button>
                                        <button
                                            className={`mode-btn ${(viewMode as ViewMode) === 'contract' ? 'active' : ''}`}
                                            onClick={() => setViewMode('contract')}
                                        >
                                            Contract
                                        </button>
                                        <button
                                            className={`mode-btn ${(viewMode as ViewMode) === 'compare' ? 'active' : ''}`}
                                            onClick={() => setViewMode('compare')}
                                        >
                                            Compare
                                        </button>
                                        <button
                                            className={`mode-btn ${viewMode === 'sybil' ? 'active' : ''}`}
                                            onClick={() => setViewMode('sybil')}
                                            style={{ background: 'linear-gradient(135deg, #3a3a3f 0%, #1a1a1f 100%)' }}
                                        >
                                            Sybil
                                        </button>
                                    </div>
                                    <SybilDetector />
                                </div>
                            ) : (
                                <>
                                    {/* Analysis Panel */}
                                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                                        {/* Mode Selector */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                                            <div className="mode-selector">
                                                <button
                                                    className={`mode-btn ${viewMode === 'wallet' ? 'active' : ''}`}
                                                    onClick={() => setViewMode('wallet')}
                                                >
                                                    Wallet
                                                </button>
                                                <button
                                                    className={`mode-btn ${viewMode === 'contract' ? 'active' : ''}`}
                                                    onClick={() => setViewMode('contract')}
                                                >
                                                    Contract
                                                </button>
                                                <button
                                                    className={`mode-btn ${viewMode === 'compare' ? 'active' : ''}`}
                                                    onClick={() => setViewMode('compare')}
                                                >
                                                    Compare
                                                </button>
                                                <button
                                                    className={`mode-btn ${(viewMode as ViewMode) === 'sybil' ? 'active' : ''}`}
                                                    onClick={() => setViewMode('sybil')}
                                                    style={{ background: (viewMode as ViewMode) === 'sybil' ? 'linear-gradient(135deg, #3a3a3f 0%, #1a1a1f 100%)' : undefined }}
                                                >
                                                    Sybil
                                                </button>
                                            </div>
                                        </div>

                                        {/* Chain Selector */}
                                        <div style={{ marginBottom: 'var(--space-4)' }}>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
                                                Chain
                                            </div>
                                            <ChainSelector
                                                selectedChain={selectedChain}
                                                onSelect={handleChainSelect}
                                            />
                                        </div>

                                        {/* Input Fields */}
                                        {viewMode === 'wallet' && (
                                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
                                                    Wallet Address
                                                </div>
                                                <WalletInput
                                                    value={walletAddresses[0] || ''}
                                                    onChange={(value) => handleWalletChange(0, value)}
                                                    placeholder="Enter wallet address (0x...)"
                                                />
                                            </div>
                                        )}

                                        {viewMode === 'contract' && (
                                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
                                                    Contract Address or Name
                                                </div>
                                                <ContractSearch
                                                    onSelect={(address) => setContractAddress(address)}
                                                    placeholder="Search by name (e.g. Uniswap) or paste address"
                                                />
                                            </div>
                                        )}

                                        {viewMode === 'compare' && (
                                            <div style={{ marginBottom: 'var(--space-4)' }}>
                                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
                                                    Wallet Addresses
                                                </div>
                                                {walletAddresses.map((address, index) => (
                                                    <div key={index} style={{ marginBottom: 'var(--space-2)' }}>
                                                        <WalletInput
                                                            value={address}
                                                            onChange={(value) => handleWalletChange(index, value)}
                                                            placeholder={`Wallet #${index + 1} (0x...)`}
                                                            onRemove={walletAddresses.length > 1 ? () => handleRemoveWallet(index) : undefined}
                                                        />
                                                    </div>
                                                ))}
                                                <button className="btn btn-secondary" onClick={handleAddWallet}>
                                                    + Add Wallet
                                                </button>
                                            </div>
                                        )}

                                        {/* Analyze Button */}
                                        <button
                                            className="btn btn-primary btn-lg"
                                            style={{ width: '100%' }}
                                            onClick={
                                                viewMode === 'wallet' ? handleAnalyzeWallet :
                                                    viewMode === 'contract' ? handleAnalyzeContract :
                                                        handleCompareWallets
                                            }
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                    <div className="loading-spinner" style={{ width: 16, height: 16 }} />
                                                    Analyzing...
                                                </span>
                                            ) : (
                                                viewMode === 'wallet' ? 'Analyze Wallet' :
                                                    viewMode === 'contract' ? 'Analyze Contract' :
                                                        'Compare Wallets'
                                            )}
                                        </button>

                                        {/* Error Display */}
                                        {error && (
                                            <div className="alert danger" style={{ marginTop: 'var(--space-4)' }}>
                                                {error}
                                            </div>
                                        )}
                                    </div>

                                    {/* Results */}
                                    {viewMode === 'wallet' && walletResult && (
                                        <AnalysisView
                                            result={walletResult}
                                            pagination={pagination}
                                            loadingMore={loadingMore}
                                            onLoadMore={handleLoadMoreTransactions}
                                        />
                                    )}

                                    {viewMode === 'contract' && contractResult && (
                                        <ContractAnalysisView result={contractResult} />
                                    )}

                                    {viewMode === 'compare' && multiWalletResult && (
                                        <MultiWalletView result={multiWalletResult} />
                                    )}

                                    {/* Empty State */}
                                    {!walletResult && !multiWalletResult && !contractResult && !loading && (
                                        <EmptyState />
                                    )}
                                </>
                            )}
                        </>
                    ) : null
                )}
            </main>

            {/* Footer */}
            <footer style={{
                padding: 'var(--space-4)',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                borderTop: '1px solid var(--color-border)',
                marginTop: 'auto',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                justifyContent: 'center',
                gap: 'var(--space-4)'
            }}>
                <span>&copy; {new Date().getFullYear()} FundTracer by DT</span>
                <span style={{ color: 'var(--color-border)' }}>|</span>
                <a
                    href="/privacypolicy"
                    style={{ color: 'var(--color-text-muted)', textDecoration: 'underline' }}
                >
                    Privacy Policy
                </a>
            </footer>

            {/* Modals */}
            {showComingSoon && (
                <ComingSoonModal onClose={() => setShowComingSoon(false)} />
            )}
            {/* <PrivacyPolicyModal isOpen={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} /> */}
            <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
            <PaymentModal isOpen={showPayment} onClose={() => setShowPayment(false)} />
            <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
        </div>
    );
}

export default App;
