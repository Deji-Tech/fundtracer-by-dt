import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useCallback,
    useRef
} from 'react';
import { useAccount, useConnect, useDisconnect, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';
import {
    getProfile,
    loginWithWallet,
    removeAuthToken,
    getAuthToken,
    UserProfile
} from '../api';

const AUTH_PENDING_KEY = 'fundtracer_auth_pending';

interface AuthContextType {
    user: { address: string } | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    getSigner: () => Promise<ethers.JsonRpcSigner>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<{ address: string } | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const signInInProgress = useRef(false);

    // Wagmi hooks
    const { address, isConnected, connector } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const { data: walletClient } = useWalletClient();

    // Check existing auth on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = getAuthToken();
            if (token) {
                try {
                    const userProfile = await getProfile();
                    setProfile(userProfile);
                    setUser({ address: userProfile.email });
                } catch {
                    removeAuthToken();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const completeSignIn = useCallback(async () => {
        if (signInInProgress.current) return;
        signInInProgress.current = true;
        setLoading(true);

        try {
            if (!address) {
                throw new Error('Wallet not connected');
            }

            // Get provider from connector or window.ethereum
            let provider: ethers.BrowserProvider;
            if (connector && 'getProvider' in connector) {
                const connectorProvider = await (connector as any).getProvider();
                provider = new ethers.BrowserProvider(connectorProvider);
            } else if (typeof window !== 'undefined' && (window as any).ethereum) {
                provider = new ethers.BrowserProvider((window as any).ethereum);
            } else {
                throw new Error('No wallet provider available');
            }

            const signer = await provider.getSigner();
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

            sessionStorage.removeItem(AUTH_PENDING_KEY);
        } catch (error: any) {
            const isUserRejection =
                error.code === 4001 ||
                error.code === 'ACTION_REJECTED' ||
                error.message?.includes('rejected') ||
                error.message?.includes('cancelled') ||
                error.message?.includes('user denied');

            if (!isUserRejection) {
                alert(`Login failed: ${error.message || 'Unknown error'}`);
            }

            sessionStorage.removeItem(AUTH_PENDING_KEY);
        } finally {
            setLoading(false);
            signInInProgress.current = false;
        }
    }, [address, connector]);

    // Check for pending auth on mount (for mobile redirect recovery)
    // Also handle automatic sign-in when wallet connects
    useEffect(() => {
        const pendingAuth = sessionStorage.getItem(AUTH_PENDING_KEY);
        if (pendingAuth && isConnected && connector && address && !signInInProgress.current && !user) {
            sessionStorage.removeItem(AUTH_PENDING_KEY);
            completeSignIn();
        }
    }, [isConnected, connector, address, completeSignIn, user]);

    const signIn = async () => {
        if (user) return;

        // Already connected - complete sign in immediately
        if (isConnected && connector && address) {
            await completeSignIn();
            return;
        }

        // Mark as pending BEFORE connecting (crucial for mobile)
        sessionStorage.setItem(AUTH_PENDING_KEY, 'true');
        setLoading(true);

        try {
            // Try MetaMask first (best mobile support)
            // Injected connector for MetaMask typically has id 'io.metamask' or 'metaMaskSDK'
            const metaMaskConnector = connectors.find(c => 
                c.id === 'io.metamask' || 
                c.id === 'metaMaskSDK' ||
                c.id === 'injected' ||
                c.name?.toLowerCase().includes('metamask')
            ) || connectors.find(c => c.id === 'injected') || connectors[0];

            if (metaMaskConnector) {
                connect({ connector: metaMaskConnector });
            } else if (connectors.length > 0) {
                // Fallback to first available connector
                connect({ connector: connectors[0] });
            } else {
                throw new Error('No wallet connectors available');
            }

            // Mobile fallback: if deep link doesn't trigger automatically, force it
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile && metaMaskConnector) {
                setTimeout(() => {
                    const stillPending = sessionStorage.getItem(AUTH_PENDING_KEY);
                    if (stillPending && !isConnected) {
                        // Force redirect to MetaMask if deep link didn't work
                        const currentHost = window.location.host;
                        window.location.href = `https://metamask.app.link/dapp/${currentHost}`;
                    }
                }, 2000);
            }
        } catch (error) {
            sessionStorage.removeItem(AUTH_PENDING_KEY);
            setLoading(false);
        }
    };

    const signOut = async () => {
        removeAuthToken();
        setUser(null);
        setProfile(null);
        signInInProgress.current = false;
        sessionStorage.removeItem(AUTH_PENDING_KEY);

        try {
            disconnect();

            if (typeof window !== 'undefined') {
                Object.keys(localStorage).forEach(key => {
                    if (
                        key.startsWith('wc@2:') ||
                        key.startsWith('W3M_') ||
                        key.startsWith('@w3m/') ||
                        key.startsWith('@appkit/') ||
                        key.startsWith('wagmi') ||
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

    const getSigner = useCallback(async (): Promise<ethers.JsonRpcSigner> => {
        if (!address) {
            throw new Error('Wallet not connected');
        }

        // Get provider from connector or window.ethereum
        let provider: ethers.BrowserProvider;
        if (connector && 'getProvider' in connector) {
            const connectorProvider = await (connector as any).getProvider();
            provider = new ethers.BrowserProvider(connectorProvider);
        } else if (typeof window !== 'undefined' && (window as any).ethereum) {
            provider = new ethers.BrowserProvider((window as any).ethereum);
        } else {
            throw new Error('No wallet provider available');
        }

        return provider.getSigner();
    }, [connector, address]);

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