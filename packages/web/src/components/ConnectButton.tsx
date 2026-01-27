import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { useAuth } from '../contexts/AuthContext';

export function ConnectButton() {
    const { user, signOut, loading } = useAuth();

    if (loading) {
        return (
            <button disabled className="px-4 py-2 bg-gray-700 rounded-lg">
                Loading...
            </button>
        );
    }

    if (user) {
        return (
            <button
                onClick={signOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
            >
                Disconnect
            </button>
        );
    }

    return <RainbowConnectButton />;
}