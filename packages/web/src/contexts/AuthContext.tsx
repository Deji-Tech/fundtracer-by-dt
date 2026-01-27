import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useCallback,
    useRef
} from 'react';
import { useAccount, useDisconnect, useSignMessage, useConnectorClient } from 'wagmi';
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
    const signInInProgress = useRef(false);

    const { address, isConnected } = useAccount();
    const { disconnectAsync } = useDisconnect();
    const { signMessageAsync } = useSignMessage();
    const { data: client } = useConnectorClient();

    // Check existing auth on mount
    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            getProfile()
                .then(userProfile => {
                    setProfile(userProfile);
                    setUser({ address: userProfile.email });
                })
                .catch(() => removeAuthToken())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // Handle successful connection
    useEffect(() => {
        if (isConnected && address && !user && !signInInProgress.current) {
            performLogin();
        }
    }, [isConnected, address]);

    const performLogin = async () => {
        if (signInInProgress.current || !address) return;
        signInInProgress.current = true;
        setLoading(true);

        try {
            const timestamp = Date.now();
            const message = `Login to FundTracer\nTimestamp: ${timestamp}`;
            const signature = await signMessageAsync({ message });

            const loginResponse = await loginWithWallet(address, signature, message);
            setUser({ address });

            const userProfile = await getProfile();
            setProfile({
                ...userProfile,
                isVerified: loginResponse.user.isVerified,
                tier: loginResponse.user.tier
            });
        } catch (error: any) {
            console.error('Login error:', error);
            if (!error.message?.includes('rejected') && !error.message?.includes('denied')) {
                alert(`Login failed: ${error.message || 'Unknown error'}`);
            }
            // Disconnect on failure
            await disconnectAsync().catch(() => { });
        } finally {
            setLoading(false);
            signInInProgress.current = false;
        }
    };

    const signIn = async () => {
        if (user) return;
        // RainbowKit modal opens automatically via ConnectButton
        // If using custom button: import { useConnectModal } from '@rainbow-me/rainbowkit'
    };

    const signOut = async () => {
        removeAuthToken();
        setUser(null);
        setProfile(null);
        try {
            await disconnectAsync();
        } catch { }
        if (typeof window !== 'undefined') {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('wagmi') || key.includes('walletconnect')) {
                    localStorage.removeItem(key);
                }
            });
        }
    };

    const refreshProfile = async () => {
        if (!user) return;
        try {
            const userProfile = await getProfile();
            setProfile(userProfile);
        } catch { }
    };

    const getSigner = useCallback(async (): Promise<ethers.providers.JsonRpcSigner> => {
        if (!client) throw new Error('Wallet not connected');

        const { account, chain, transport } = client;
        const network = {
            chainId: chain.id,
            name: chain.name,
            ensAddress: chain.contracts?.ensRegistry?.address,
        };
        const provider = new ethers.providers.Web3Provider(transport as any, network);
        const signer = provider.getSigner(account.address);
        return signer;
    }, [client]);

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
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}