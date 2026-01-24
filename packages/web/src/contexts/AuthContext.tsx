
// ============================================================
// Auth Context - Provides auth state with Web3Modal support
// ============================================================

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider, useDisconnect } from '@web3modal/ethers5/react';
import { ethers } from 'ethers';
import { getProfile, loginWithWallet, removeAuthToken, getAuthToken, UserProfile } from '../api';

interface AuthContextType {
    user: { address: string } | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    getSigner: () => Promise<ethers.providers.JsonRpcSigner>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<{ address: string } | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [pendingSignIn, setPendingSignIn] = useState(false);

    // Web3Modal hooks
    const { open } = useWeb3Modal();
    const { address, isConnected } = useWeb3ModalAccount();
    const { walletProvider } = useWeb3ModalProvider();
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

    const completeSignIn = useCallback(async () => {
        if (!walletProvider || !address) return;

        try {
            setLoading(true);
            setPendingSignIn(false);

            const provider = new ethers.providers.Web3Provider(walletProvider);
            const signer = provider.getSigner();
            const walletAddress = await signer.getAddress();

            const message = `Login to FundTracer\nTimestamp: ${Date.now()}`;
            const signature = await signer.signMessage(message);

            const loginResponse = await loginWithWallet(walletAddress, signature, message);

            setUser({ address: walletAddress });

            const userProfile = await getProfile();
            setProfile({
                ...userProfile,
                isVerified: loginResponse.user.isVerified,
                tier: loginResponse.user.tier
            });

        } catch (error: any) {
            console.error('Wallet Sign-in failed:', error);
            alert(`Login failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [walletProvider, address]);

    // Helper to detect MetaMask in-app browser
    const isMetaMaskInApp = () => {
        if (typeof window === 'undefined') return false;
        const ethereum = (window as any).ethereum;
        return ethereum?.isMetaMask && /Mobile/.test(navigator.userAgent);
    };

    // Helper to clear all WalletConnect sessions and cache
    const clearAllSessions = async () => {
        try {
            // 1. Disconnect current session
            await disconnect();

            // 2. Clear WalletConnect storage
            if (typeof window !== 'undefined') {
                // Clear WalletConnect v2 storage
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('wc@2:') ||
                        key.startsWith('W3M_') ||
                        key.startsWith('@w3m/') ||
                        key.includes('walletconnect')) {
                        localStorage.removeItem(key);
                    }
                });
            }

            // 3. Small delay to ensure cleanup
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
            console.log('[Auth] Session cleanup:', e);
        }
    };

    const signIn = async () => {
        // If already connected, complete sign-in immediately
        if (isConnected && walletProvider && address) {
            await completeSignIn();
            return;
        }

        // Handle MetaMask in-app browser separately for better UX
        if (isMetaMaskInApp()) {
            try {
                setPendingSignIn(true);
                setLoading(true);

                const ethereum = (window as any).ethereum;
                await ethereum.request({ method: 'eth_requestAccounts' });

                // The useEffect will handle the rest when isConnected becomes true
            } catch (error: any) {
                console.error('MetaMask in-app connection failed:', error);
                alert(`Connection failed: ${error.message}`);
                setPendingSignIn(false);
                setLoading(false);
            }
            return;
        }

        // For all other cases (desktop, mobile browsers), use Web3Modal
        // First, aggressively clear any stale sessions
        await clearAllSessions();

        // Open Web3Modal (Reown) - it handles mobile/desktop automatically
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

            // Clear WalletConnect storage
            if (typeof window !== 'undefined') {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith('wc@2:') ||
                        key.startsWith('W3M_') ||
                        key.startsWith('@w3m/') ||
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
                if (!walletProvider) throw new Error('Wallet not connected');
                const provider = new ethers.providers.Web3Provider(walletProvider);
                return provider.getSigner();
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
