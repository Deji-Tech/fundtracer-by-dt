import React, { useState } from 'react';
import { Github } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveApiKey, removeApiKey } from '../api';

function AuthPanel() {
    const { user, profile, loading, signIn, signInWithGithub, signOut, refreshProfile } = useAuth();
    const [showApiKeyForm, setShowApiKeyForm] = useState(false);
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [apiKeyError, setApiKeyError] = useState('');
    const [apiKeySaving, setApiKeySaving] = useState(false);

    const handleSignIn = async () => {
        try {
            await signIn();
        } catch (error: any) {
            console.error('Sign-in error:', error);
        }
    };

    const handleGithubSignIn = async () => {
        try {
            await signInWithGithub();
        } catch (error: any) {
            console.error('GitHub Sign-in error:', error);
        }
    };

    const handleSaveApiKey = async () => {
        if (!apiKeyInput.trim()) {
            setApiKeyError('Please enter an API key');
            return;
        }

        setApiKeySaving(true);
        setApiKeyError('');

        try {
            const result = await saveApiKey(apiKeyInput.trim());
            if (result.success) {
                setShowApiKeyForm(false);
                setApiKeyInput('');
                await refreshProfile();
            }
        } catch (error: any) {
            setApiKeyError(error.message || 'Failed to save API key');
        } finally {
            setApiKeySaving(false);
        }
    };

    const handleRemoveApiKey = async () => {
        try {
            await removeApiKey();
            await refreshProfile();
        } catch (error: any) {
            console.error('Failed to remove API key:', error);
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
            <div className="card">
                <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                    <h3 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--text-lg)' }}>
                        Sign in to continue
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-sm)' }}>
                        Sign in with Google to use FundTracer. Free tier includes 7 analyses per day.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        <button className="btn btn-primary btn-lg" onClick={handleSignIn} style={{ width: '100%', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </button>

                        <button
                            className="btn btn-secondary btn-lg"
                            onClick={handleGithubSignIn}
                            style={{ width: '100%', justifyContent: 'center', background: '#24292e', color: 'white', borderColor: '#24292e' }}
                        >
                            <Github size={18} />
                            Sign in with GitHub
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {user.photoURL && (
                        <img
                            src={user.photoURL}
                            alt=""
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                border: '1px solid var(--color-surface-border)'
                            }}
                        />
                    )}
                    <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                            {user.displayName || user.email}
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

            {/* API Key Form */}
            {showApiKeyForm && !profile?.hasCustomApiKey && (
                <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-surface-border)' }}>
                    <div style={{ marginBottom: 'var(--space-3)' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
                            Add your own Etherscan API key for unlimited usage
                        </div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                            Get a free API key from <a href="https://etherscan.io/apis" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-text-secondary)' }}>etherscan.io/apis</a>
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <input
                            type="password"
                            className="input"
                            placeholder="Enter your Etherscan API key"
                            value={apiKeyInput}
                            onChange={(e) => setApiKeyInput(e.target.value)}
                            style={{ flex: 1, paddingLeft: 'var(--space-3)' }}
                        />
                        <button
                            className="btn btn-primary"
                            onClick={handleSaveApiKey}
                            disabled={apiKeySaving}
                        >
                            {apiKeySaving ? 'Validating...' : 'Save'}
                        </button>
                        <button
                            className="btn btn-ghost"
                            onClick={() => {
                                setShowApiKeyForm(false);
                                setApiKeyInput('');
                                setApiKeyError('');
                            }}
                        >
                            Cancel
                        </button>
                    </div>

                    {apiKeyError && (
                        <div className="alert danger" style={{ marginTop: 'var(--space-2)' }}>
                            {apiKeyError}
                        </div>
                    )}
                </div>
            )}

            {/* Remove API Key */}
            {profile?.hasCustomApiKey && (
                <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-surface-border)' }}>
                    <button
                        className="btn btn-ghost"
                        onClick={handleRemoveApiKey}
                        style={{ color: 'var(--color-danger-text)' }}
                    >
                        Remove API Key
                    </button>
                </div>
            )}
        </div>
    );
}

export default AuthPanel;
