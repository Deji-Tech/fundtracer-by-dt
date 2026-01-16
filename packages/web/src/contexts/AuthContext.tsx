
// ============================================================
// Auth Context - Provides auth state throughout the app
// ============================================================

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { BrowserProvider } from 'ethers';
import { getProfile, loginWithWallet, removeAuthToken, getAuthToken, UserProfile } from '../api';

interface AuthContextType {
    user: { address: string } | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<{ address: string } | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = getAuthToken();
        if (token) {
            try {
                // Determine address from profile fetch
                const userProfile = await getProfile();
                setProfile(userProfile);
                setUser({ address: userProfile.email }); // Email field holds address
            } catch (error) {
                console.error('Failed to restore session:', error);
                removeAuthToken();
                setUser(null);
                setProfile(null);
            }
        }
        setLoading(false);
    };

    const signIn = async () => {
        try {
            setLoading(true);

            if (!(window as any).ethereum) {
                alert('Please install MetaMask or a compatible wallet!');
                setLoading(false);
                return;
            }

            const provider = new BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            const message = `Login to FundTracer\nTimestamp: ${Date.now()}`;
            const signature = await signer.signMessage(message);

            const loginResponse = await loginWithWallet(address, signature, message);

            // Use data from login response which includes isVerified
            setUser({ address });

            // Fetch full profile (includes usage limits)
            const userProfile = await getProfile();
            // Merge login response data to ensure isVerified is correct
            setProfile({
                ...userProfile,
                isVerified: loginResponse.user.isVerified,
                tier: loginResponse.user.tier
            });

        } catch (error: any) {
            console.error('Wallet Sign-in failed:', error);
            alert(`Login failed: ${error.message}`);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        removeAuthToken();
        setUser(null);
        setProfile(null);
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
