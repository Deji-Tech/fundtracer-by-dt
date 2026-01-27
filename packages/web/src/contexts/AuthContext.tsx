// packages/web/src/contexts/AuthContext.tsx

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useCallback,
    useRef
} from 'react';
import {
    useAppKit,
    useAppKitAccount,
    useAppKitProvider,
    useDisconnect
} from '@reown/appkit/react';
import { ethers } from 'ethers';
import {
    getProfile,
    loginWithWallet,
    removeAuthToken,
    getAuthToken,
    UserProfile
} from '../api';

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
    const signInInProgress = useRef(false);
    const hasTriedAutoLogin = useRef(false);

    const { open } = useAppKit();
    const { address, isConnected, status } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider('eip155');
    const { disconnect } = useDisconnect();

    // Check for existing JWT auth on mount
    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            getProfile()
                .then(userProfile => {
                    setProfile(userProfile);
                    setUser({ address: userProfile.email });
                })
                .catch(() => {
                    removeAuthToken();
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    // Watch for wallet connection changes (handles return from wallet app)
    useEffect(() => {
        // Skip if already logged in or not pending
        if (user || !pendingSignIn) return;

        // Wait for connected status with provider
        if (isConnected && walletProvider && address && !signInInProgress.current) {
            completeSignIn();
        }
    }, [isConnected, walletProvider, address, pendingSignIn, user]);

    // Auto-complete login if user returns to page already connected
    useEffect(() => {
        if (
            !user &&
            !loading &&
            !hasTriedAutoLogin.current &&
            isConnected &&
            walletProvider &&
            address &&
            !getAuthToken()
        ) {
            hasTriedAutoLogin.current = true;
            // User is connected but not logged in - they probably returned from wallet
            setPendingSignIn(true);
        }
    }, [user, loading, isConnected, walletProvider, address]);

    const completeSignIn = async () => {
        if (signInInProgress.current) return;
        signInInProgress.current = true;

        try {
            setLoading(true);

            if (!walletProvider) {
                throw new Error('No wallet provider');
            }

            const provider = new ethers.providers.Web3Provider(walletProvider as any);
            const signer = provider.getSigner();
            const walletAddress = await signer.getAddress();

            const timestamp = Date.now();
            const message = `Login to FundTracer\nTimestamp: ${timestamp}`;
            const signature = await signer.signMessage(message);

            const loginResponse = await loginWithWallet(walletAddress, signature, message);

            setUser({ address: walletAddress });

            const userProfile = await getProfile();
            setProfile({
                ...userProfile,
                isVerified: loginResponse.user.isVerified,
                tier: loginResponse.user.tier
            });

            setPendingSignIn(false);

        } catch (error: any) {
            const isUserRejection =
                error.code === 4001 ||
                error.code === 'ACTION_REJECTED' ||
                error.message?.includes('rejected') ||
                error.message?.includes('denied');

            if (!isUserRejection) {
                alert(`Login failed: ${error.message || 'Unknown error'}`);
            }

            setPendingSignIn(false);
        } finally {
            setLoading(false);
            signInInProgress.current = false;
        }
    };

    const signIn = async () => {
        // Already logged in
        if (user) return;

        // Already connected - just need to sign
        if (isConnected && walletProvider && address) {
            await completeSignIn();
            return;
        }

        // Set pending and open modal
        setPendingSignIn(true);
        setLoading(true);

        try {
            await open();
            // Modal is now open
            // The useEffect watching isConnected will handle the rest
            // when user connects their wallet
        } catch (error) {
            setPendingSignIn(false);
            setLoading(false);
        }
    };

    const signOut = async () => {
        removeAuthToken();
        setUser(null);
        setProfile(null);
        setPendingSignIn(false);
        signInInProgress.current = false;
        hasTriedAutoLogin.current = false;

        try {
            await disconnect();

            if (typeof window !== 'undefined') {
                Object.keys(localStorage).forEach(key => {
                    if (
                        key.startsWith('wc@2:') ||
                        key.startsWith('W3M_') ||
                        key.startsWith('@w3m/') ||
                        key.startsWith('@appkit/') ||
                        key.includes('walletconnect')
                    ) {
                        localStorage.removeItem(key);
                    }
                });
            }
        } catch { }
    };

    const refreshProfile = async () => {
        if (!user) return;
        try {
            const userProfile = await getProfile();
            setProfile(userProfile);
        } catch { }
    };

    const getSigner = useCallback(async (): Promise<ethers.providers.JsonRpcSigner> => {
        if (walletProvider) {
            const provider = new ethers.providers.Web3Provider(walletProvider as any);
            return provider.getSigner();
        }
        throw new Error('Wallet not connected');
    }, [walletProvider]);

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            signIn,
            signOut,
            refreshProfile,
            getSigner
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