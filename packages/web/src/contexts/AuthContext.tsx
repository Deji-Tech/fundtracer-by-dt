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

    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { walletProvider } = useAppKitProvider('eip155');
    const { disconnect } = useDisconnect();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = getAuthToken();
        if (token) {
            try {
                const userProfile = await getProfile();
                setProfile(userProfile);
                setUser({ address: userProfile.email });
            } catch (error) {
                removeAuthToken();
                setUser(null);
                setProfile(null);
            }
        }
        setLoading(false);
    };

    const getEthereumProvider = useCallback((): any => {
        const ethereum = (window as any).ethereum;
        if (!ethereum) return null;

        if (ethereum.providers?.length) {
            const preferred = ethereum.providers.find(
                (p: any) => p.isMetaMask || p.isRabby
            );
            return preferred || ethereum.providers[0];
        }

        return ethereum;
    }, []);

    const isMobile = useCallback((): boolean => {
        return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
            navigator.userAgent
        );
    }, []);

    // Check if inside a wallet's in-app browser
    const isWalletBrowser = useCallback((): boolean => {
        const ethereum = (window as any).ethereum;
        if (!ethereum) return false;
        return !!(ethereum.isMetaMask || ethereum.isRabby || ethereum.isTrust || ethereum.isCoinbaseWallet);
    }, []);

    const performLogin = useCallback(async (
        providerInput?: any,
        addressInput?: string
    ) => {
        if (signInInProgress.current) return;

        signInInProgress.current = true;

        try {
            setLoading(true);
            setPendingSignIn(false);

            let provider: ethers.providers.Web3Provider;
            let walletAddress = addressInput;

            if (providerInput) {
                provider = new ethers.providers.Web3Provider(providerInput);
            } else if (walletProvider) {
                provider = new ethers.providers.Web3Provider(walletProvider as any);
            } else {
                throw new Error('No provider available');
            }

            const signer = provider.getSigner();

            if (!walletAddress) {
                walletAddress = await signer.getAddress();
            }

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

        } catch (error: any) {
            const isUserRejection =
                error.code === 4001 ||
                error.code === 'ACTION_REJECTED' ||
                error.message?.includes('rejected');

            if (!isUserRejection) {
                alert(`Login failed: ${error.message || 'Unknown error'}`);
            }

            setPendingSignIn(false);
        } finally {
            setLoading(false);
            signInInProgress.current = false;
        }
    }, [walletProvider]);

    // Handle AppKit connection completing
    useEffect(() => {
        if (pendingSignIn && isConnected && walletProvider && address) {
            performLogin();
        }
    }, [pendingSignIn, isConnected, walletProvider, address, performLogin]);

    const signIn = async () => {
        if (user) return;

        // Already connected via AppKit
        if (isConnected && walletProvider && address) {
            await performLogin();
            return;
        }

        const mobile = isMobile();
        const walletBrowser = isWalletBrowser();
        const ethereum = getEthereumProvider();

        // CASE 1: Mobile browser WITHOUT wallet (regular Chrome/Safari)
        // Must use AppKit modal for WalletConnect / deep linking
        if (mobile && !walletBrowser && !ethereum) {
            setPendingSignIn(true);
            setLoading(true);
            try {
                await open();
                // Don't set loading false here - wait for connection via useEffect
            } catch {
                setPendingSignIn(false);
                setLoading(false);
            }
            return;
        }

        // CASE 2: Mobile wallet in-app browser (MetaMask/Rabby app)
        if (mobile && ethereum) {
            await new Promise(r => setTimeout(r, 100));

            // Check if already connected
            if (ethereum.selectedAddress) {
                setLoading(true);
                await performLogin(ethereum, ethereum.selectedAddress);
                return;
            }

            setLoading(true);

            try {
                let accounts: string[] = [];

                try {
                    await ethereum.request({
                        method: 'wallet_requestPermissions',
                        params: [{ eth_accounts: {} }]
                    });
                    accounts = await ethereum.request({ method: 'eth_accounts' });
                } catch {
                    accounts = await ethereum.request({ method: 'eth_requestAccounts' });
                }

                if (accounts?.[0]) {
                    await performLogin(ethereum, accounts[0]);
                } else {
                    setLoading(false);
                }
            } catch (error: any) {
                setLoading(false);

                if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                    return;
                }

                // Fallback to AppKit modal
                setPendingSignIn(true);
                try {
                    await open();
                } catch {
                    setPendingSignIn(false);
                }
            }
            return;
        }

        // CASE 3: Desktop browser with extension
        if (!mobile && ethereum) {
            setLoading(true);

            try {
                const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

                if (accounts?.[0]) {
                    await performLogin(ethereum, accounts[0]);
                } else {
                    setLoading(false);
                }
            } catch (error: any) {
                setLoading(false);

                if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
                    return;
                }

                // Fallback to AppKit modal
                setPendingSignIn(true);
                try {
                    await open();
                } catch {
                    setPendingSignIn(false);
                }
            }
            return;
        }

        // CASE 4: Desktop without extension - show modal
        setPendingSignIn(true);
        setLoading(true);
        try {
            await open();
        } catch {
            setPendingSignIn(false);
            setLoading(false);
        }
    };

    const signOut = async () => {
        removeAuthToken();
        setUser(null);
        setProfile(null);
        signInInProgress.current = false;

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

        const ethereum = getEthereumProvider();
        if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            return provider.getSigner();
        }

        throw new Error('Wallet not connected');
    }, [walletProvider, getEthereumProvider]);

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