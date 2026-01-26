
// ============================================================
// Auth Context - Provides auth state with Reown AppKit support
// ============================================================

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider, useDisconnect } from '@reown/appkit/react';
import { ethers } from 'ethers';
import { getProfile, loginWithWallet, removeAuthToken, getAuthToken, UserProfile } from '../api';

interface AuthContextType {
    user: { address: string } | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    getSigner: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<{ address: string } | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [pendingSignIn, setPendingSignIn] = useState(false);

    // Reown AppKit hooks
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider('eip155');
    const { disconnect } = useDisconnect();

    // Check for existing auth on mount
    useEffect(() => {
        checkAuth();
    }, []);

    // Handle wallet connection for pending sign-in
    useEffect(() => {
        if (pendingSignIn && isConnected && walletProvider && address) {
            completeSignIn();
        }
    }, [pendingSignIn, isConnected, walletProvider, address]);

    const checkAuth = async () => {
        const token = getAuthToken();
        if (token) {
            try {
                const userProfile = await getProfile();
                setProfile(userProfile);
                setUser({ address: userProfile.email });
            } catch (error) {
                console.error('Failed to restore session:', error);
                removeAuthToken();
                setUser(null);
                setProfile(null);
            }
        }
        setLoading(false);
    };

    const performLogin = useCallback(async (providerInput?: any, addressInput?: string) => {
        try {
            setLoading(true);
            setPendingSignIn(false);

            let provider;
            let walletAddress = addressInput;

            if (providerInput) {
                provider = new ethers.providers.Web3Provider(providerInput);
            } else if (walletProvider) {
                provider = new ethers.providers.Web3Provider(walletProvider as any);
            } else {
                throw new Error('No provider available');
            }

            const signer = await provider.getSigner();
            if (!walletAddress) {
                walletAddress = await signer.getAddress();
            }

            const message = `Login to FundTracer\nTimestamp: ${Date.now()}`;
            const signature = await signer.signMessage(message);

            const loginResponse = await loginWithWallet(walletAddress!, signature, message);

            setUser({ address: walletAddress! });

            const userProfile = await getProfile();
            setProfile({
                ...userProfile,
                isVerified: loginResponse.user.isVerified,
                tier: loginResponse.user.tier
            });

        } catch (error: any) {
            console.error('Wallet Sign-in failed:', error);
            // Don't alert if user rejected
            if (error.code !== 4001) {
                alert(`Login failed: ${error.message}`);
            }
            // If failed, clear pending so UI resets
            setPendingSignIn(false);
        } finally {
            setLoading(false);
        }
    }, [walletProvider]);

    // Backwards compatibility for useEffect
    const completeSignIn = () => performLogin();

    // Helper to detect MetaMask in-app browser
    const isMetaMaskInApp = () => {
        if (typeof window === 'undefined') return false;
        const ethereum = (window as any).ethereum;
        return ethereum?.isMetaMask && /Mobile/.test(navigator.userAgent);
    };

    const signIn = async () => {
        // If already connected, complete sign-in immediately
        if (isConnected && walletProvider && address) {
            await completeSignIn();
            return;
        }

        // Direct Injection Fallback (Desktop / Extension Users)
        // This bypasses AppKit modal issues for MetaMask/Rabby
        if (typeof window !== 'undefined' && (window as any).ethereum && !/Mobile/.test(navigator.userAgent)) {
            try {
                setPendingSignIn(true);
                setLoading(true);
                const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts[0]) {
                    await performLogin((window as any).ethereum, accounts[0]);
                    return;
                }
            } catch (e: any) {
                console.warn('Direct connect failed, falling back to modal:', e);
                // Fallthrough to open()
            }
        }

        // Handle MetaMask in-app browser separately
        if (isMetaMaskInApp()) {
            try {
                setPendingSignIn(true);
                setLoading(true);
                const ethereum = (window as any).ethereum;
                await ethereum.request({ method: 'eth_requestAccounts' });
            } catch (error: any) {
                console.error('MetaMask in-app connection failed:', error);
                setPendingSignIn(false);
                setLoading(false);
            }
            return;
        }

        // Standard AppKit Modal
        setPendingSignIn(true);
        setLoading(true);

        try {
            await open();
        } catch (error) {
            console.error('Failed to open wallet modal:', error);
            setPendingSignIn(false);
            setLoading(false);
        }
    };

    const signOut = async () => {
        removeAuthToken();
        setUser(null);
        setProfile(null);

        // Clear all WalletConnect sessions and cache
        try {
            await disconnect();

            if (typeof window !== 'undefined') {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('wc@2:') ||
                        key.startsWith('W3M_') ||
                        key.startsWith('@w3m/') ||
                        key.startsWith('@appkit/') ||
                        key.includes('walletconnect')) {
                        localStorage.removeItem(key);
                    }
                });
            }
        } catch (e) {
            console.log('[Auth] Disconnect error:', e);
        }
    };

    const refreshProfile = async () => {
        if (!user) return;
        try {
            const userProfile = await getProfile();
            setProfile(userProfile);
        } catch (error) {
            console.error('Failed to refresh profile:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            signIn,
            signOut,
            refreshProfile,
            getSigner: async () => {
                if (walletProvider) {
                    const provider = new ethers.providers.Web3Provider(walletProvider as any);
                    return await provider.getSigner();
                }
                // Fallback for direct connection
                if (user && (window as any).ethereum) {
                    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
                    return await provider.getSigner();
                }
                throw new Error('Wallet not connected');
            }
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
