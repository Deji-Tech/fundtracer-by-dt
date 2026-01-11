// ============================================================
// Auth Context - Provides auth state throughout the app
// ============================================================

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, signInWithGoogle, logOut, getIdToken } from '../firebase';
import { getProfile } from '../api';

interface UserProfile {
    uid: string;
    email: string;
    name?: string;
    hasCustomApiKey: boolean;
    usage: {
        today: number;
        limit: number | 'unlimited';
        remaining: number | 'unlimited';
    };
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const userProfile = await getProfile();
                    setProfile(userProfile);
                } catch (error) {
                    console.error('Failed to fetch profile:', error);
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
        } catch (error) {
            console.error('Sign-in failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signInWithGithub = async () => {
        try {
            setLoading(true);
            const { signInWithGithub: firebaseSignInWithGithub } = await import('../firebase');
            await firebaseSignInWithGithub();
        } catch (error) {
            console.error('GitHub Sign-in failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOutHandler = async () => {
        try {
            await logOut();
            setProfile(null);
        } catch (error) {
            console.error('Sign-out failed:', error);
            throw error;
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
            signInWithGithub,
            signOut: signOutHandler,
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
