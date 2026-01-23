
// ============================================================
// Auth Context - Provides auth state with Web3Modal support
// ============================================================

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider, useDisconnect } from '@web3modal/ethers5/react';
import { ethers } from 'ethers';
import { getProfile, loginWithWallet, removeAuthToken, getAuthToken, UserProfile } from '../api';
import MobileWalletModal from '../components/MobileWalletModal';

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

    // Detect if running in mobile browser
    const isMobileBrowser = () => {
        const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase());
    };

    // Check if any wallet is available
    const hasInjectedWallet = () => {
        return typeof window !== 'undefined' && (window as any).ethereum;
    };

    // State for mobile wallet modal
    const [showMobileWalletModal, setShowMobileWalletModal] = useState(false);

    const signIn = async () => {
        // If already connected, complete sign-in immediately
        if (isConnected && walletProvider && address) {
            await completeSignIn();
            return;
        }

        // Mobile browser without injected wallet - show wallet selector
        if (isMobileBrowser() && !hasInjectedWallet()) {
            setShowMobileWalletModal(true);
            return;
        }

        // Otherwise, open modal and set pending flag
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

    // Handler for WalletConnect fallback from mobile modal
    const handleMobileWalletConnect = () => {
        setShowMobileWalletModal(false);
        setPendingSignIn(true);
        setLoading(true);
        open().catch(error => {
            console.error('Failed to open wallet modal:', error);
            setPendingSignIn(false);
            setLoading(false);
        });
    };

    const closeMobileWalletModal = () => {
        setShowMobileWalletModal(false);
    };

    const signOut = async () => {
        removeAuthToken();
        setUser(null);
        setProfile(null);
        try {
            await disconnect();
        } catch (e) {
            // Ignore disconnect errors
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
            <MobileWalletModal
                isOpen={showMobileWalletModal}
                onClose={closeMobileWalletModal}
                onWalletConnect={handleMobileWalletConnect}
            />
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
