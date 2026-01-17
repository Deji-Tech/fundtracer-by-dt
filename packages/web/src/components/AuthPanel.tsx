import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveAlchemyKey, removeAlchemyKey } from '../api';
import logo from '../assets/logo.png';

interface AuthPanelProps {
    showApiKeyForm: boolean;
    setShowApiKeyForm: (show: boolean) => void;
}

function AuthPanel({ showApiKeyForm, setShowApiKeyForm }: AuthPanelProps) {
    const { user, profile, loading, signIn, signOut, refreshProfile } = useAuth();

    // Alchemy key state (truncated for brevity in diff, existing code remains same logic)
    const [alchemyKeyInput, setAlchemyKeyInput] = useState('');
    const [alchemyKeyError, setAlchemyKeyError] = useState('');
    const [alchemyKeySaving, setAlchemyKeySaving] = useState(false);

    // Pricing visibility
    const [showPricing, setShowPricing] = useState(false);

    const handleSignIn = async () => {
        try {
            await signIn();
        } catch (error: any) {
            console.error('Sign-in error:', error);
        }
    };
    // ... existing handlers ...
    const handleSaveAlchemyKey = async () => {
        // ... (reuse existing logic if possible, or re-include it)
        // Since I'm using replace_file_content on the whole file or large chunk, I must be careful not to delete logic.
        // Actually, I can just replace the imports and the render part.
        // But `handleSaveAlchemyKey` is in the middle.
        // I will target the imports and then the render block separately if possible?
        // No, `multi_replace` or just replace the top block and the render block.
        if (!alchemyKeyInput.trim()) {
            setAlchemyKeyError('Please enter an Alchemy API key');
            return;
        }

        setAlchemyKeySaving(true);
        setAlchemyKeyError('');

        try {
            const result = await saveAlchemyKey(alchemyKeyInput.trim());
            if (result.success) {
                setShowApiKeyForm(false);
                setAlchemyKeyInput('');
                await refreshProfile();
            }
        } catch (error: any) {
            console.error('Save Alchemy key error:', error);
            setAlchemyKeyError(error.message || 'Failed to save Alchemy API key');
        } finally {
            setAlchemyKeySaving(false);
        }
    };

    const handleRemoveAlchemyKey = async () => {
        try {
            await removeAlchemyKey();
            await refreshProfile();
        } catch (error: any) {
            console.error('Failed to remove Alchemy key:', error);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
                <div className="loading-spinner" style={{ margin: '0 auto' }} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="card animate-fade-in animate-slide-up">
                <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                    <div style={{ marginBottom: 'var(--space-4)' }}>
                        <img src={logo} alt="Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                    </div>
                    <h2 style={{
                        fontSize: 'var(--text-xl)',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: 'var(--space-2)'
                    }}>
                        FundTracer <span style={{ fontSize: '0.6em', background: 'var(--color-primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', verticalAlign: 'middle' }}>BETA</span> by DT
                    </h2>
                    <p style={{
                        color: 'var(--color-text-secondary)',
                        marginBottom: 'var(--space-4)',
                        fontSize: 'var(--text-md)',
                        fontStyle: 'italic',
                        fontWeight: 500
                    }}>
                        "Trace with Precision. Scale with Confidence."
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
                        Please connect your wallet to access FundTracer.
                        We require PoH verification via Linea Exponent.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <button className="btn btn-primary btn-lg" onClick={handleSignIn} style={{ width: '100%', justifyContent: 'center' }}>
                            Connect Wallet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card animate-fade-in animate-slide-up" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '10px'
                    }}>
                        {user.address.substring(0, 2)}
                    </div>
                    <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {user.address.slice(0, 6)}...{user.address.slice(-4)}
                            {profile?.isVerified ? (
                                <span className="risk-badge low" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', marginLeft: 0 }}>
                                    Verified Human
                                </span>
                            ) : (
                                <span className="risk-badge critical" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', marginLeft: 0 }}>
                                    Unverified
                                </span>
                            )}
                            <span className="risk-badge medium" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', marginLeft: 0 }}>
                                {profile?.tier?.toUpperCase() || 'FREE'} TIER
                            </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {profile?.usage.remaining === 'unlimited'
                                ? 'Unlimited usage'
                                : `${profile?.usage.remaining}/${profile?.usage.limit} analyses remaining today`}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    {profile?.hasCustomApiKey ? (
                        <span className="risk-badge low" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
                            Custom API Key Active
                        </span>
                    ) : (
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowApiKeyForm(!showApiKeyForm)}
                        >
                            Add API Key
                        </button>
                    )}
                    <button className="btn btn-ghost" onClick={signOut}>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Alchemy API Key Section */}
            <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-surface-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                        ⚡ Alchemy API Key
                    </div>
                    {profile?.hasCustomApiKey ? (
                        <span className="risk-badge low" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success-text)' }}>
                            Active - Unlimited Usage
                        </span>
                    ) : null}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                    Get a free Alchemy API key for fast, unlimited analysis from{' '}
                    <a href="https://alchemy.com/?r=badge:DU02ODk5NTQ4MjM2M" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-secondary)' }}>
                        alchemy.com
                    </a>
                </div>

                {!profile?.hasCustomApiKey && !showApiKeyForm && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowApiKeyForm(true)}
                    >
                        Add Alchemy Key
                    </button>
                )}

                {showApiKeyForm && !profile?.hasCustomApiKey && (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <input
                                type="password"
                                className="input"
                                placeholder="Enter your Alchemy API key"
                                value={alchemyKeyInput}
                                onChange={(e) => setAlchemyKeyInput(e.target.value)}
                                style={{ flex: 1, paddingLeft: 'var(--space-3)' }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveAlchemyKey}
                                disabled={alchemyKeySaving}
                            >
                                {alchemyKeySaving ? 'Validating...' : 'Save'}
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowApiKeyForm(false);
                                    setAlchemyKeyInput('');
                                    setAlchemyKeyError('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>

                        {alchemyKeyError && (
                            <div className="alert danger" style={{ marginTop: 'var(--space-2)' }}>
                                {alchemyKeyError}
                            </div>
                        )}
                    </div>
                )}

                {profile?.hasCustomApiKey && (
                    <button
                        className="btn btn-ghost"
                        onClick={handleRemoveAlchemyKey}
                        style={{ color: 'var(--color-danger-text)' }}
                    >
                        Remove Alchemy Key
                    </button>
                )}
            </div>

        </div>
    );
}

export default AuthPanel;
