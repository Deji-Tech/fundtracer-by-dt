import React, { useState } from 'react';
import { ChainId, AnalysisResult, MultiWalletResult, getEnabledChains, CHAINS } from '@fundtracer/core';
import { useAuth } from './contexts/AuthContext';
import { analyzeWallet, compareWallets, analyzeContract } from './api';
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

type ViewMode = 'wallet' | 'contract' | 'compare';

function App() {
    const { user, profile, loading: authLoading } = useAuth();

    const [viewMode, setViewMode] = useState<ViewMode>('wallet');
    const [selectedChain, setSelectedChain] = useState<ChainId>('ethereum');
    const [walletAddresses, setWalletAddresses] = useState<string[]>(['']);
    const [contractAddress, setContractAddress] = useState<string>('');
    const [showComingSoon, setShowComingSoon] = useState(false);
    const [showHowToUse, setShowHowToUse] = useState(false);

    // Analysis state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [walletResult, setWalletResult] = useState<AnalysisResult | null>(null);
    const [multiWalletResult, setMultiWalletResult] = useState<MultiWalletResult | null>(null);
    const [contractResult, setContractResult] = useState<ContractAnalysisResult | null>(null);

    const handleChainSelect = (chainId: ChainId) => {
        const chain = CHAINS[chainId];
        if (!chain.enabled) {
            setShowComingSoon(true);
            return;
        }
        setSelectedChain(chainId);
    };

    const handleAnalyzeWallet = async () => {
        const address = walletAddresses[0]?.trim();
        if (!address) return;

        setLoading(true);
        setError(null);

        try {
            const response = await analyzeWallet(address, selectedChain);
            if (response.result) {
                setWalletResult(response.result);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompareWallets = async () => {
        const addresses = walletAddresses.filter(a => a.trim());
        if (addresses.length < 2) return;

        setLoading(true);
        setError(null);

        try {
            const response = await compareWallets(addresses, selectedChain);
            if (response.result) {
                setMultiWalletResult(response.result);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzeContract = async () => {
        if (!contractAddress.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await analyzeContract(contractAddress.trim(), selectedChain);
            if (response.result) {
                setContractResult(response.result);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddWallet = () => {
        setWalletAddresses([...walletAddresses, '']);
    };

    const handleRemoveWallet = (index: number) => {
        setWalletAddresses(walletAddresses.filter((_, i) => i !== index));
    };

    const handleWalletChange = (index: number, value: string) => {
        const updated = [...walletAddresses];
        updated[index] = value;
        setWalletAddresses(updated);
    };

    // Show auth loading state
    if (authLoading) {
        return (
            <div className="app-container">
                <Header />
                <main className="main-content">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                        <div className="loading-spinner" />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Header />

            <main className="main-content">
                {/* Auth Panel - Shows sign in or user info */}
                <AuthPanel />

                {/* How To Use Section */}
                <HowToUse isOpen={showHowToUse} onToggle={() => setShowHowToUse(!showHowToUse)} />

                {/* Only show analysis UI if authenticated */}
                {user ? (
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
                                </div>

                                {/* Usage indicator */}
                                {profile && (
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                        {profile.usage.remaining === 'unlimited'
                                            ? 'Unlimited'
                                            : `${profile.usage.remaining} remaining today`}
                                    </div>
                                )}
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
                                        Contract Address
                                    </div>
                                    <WalletInput
                                        value={contractAddress}
                                        onChange={setContractAddress}
                                        placeholder="Enter contract address (0x...)"
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
                            <AnalysisView result={walletResult} />
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
                ) : null}
            </main>

            {/* Coming Soon Modal */}
            {showComingSoon && (
                <ComingSoonModal onClose={() => setShowComingSoon(false)} />
            )}
        </div>
    );
}

export default App;
