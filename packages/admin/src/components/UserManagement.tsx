import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { Search, Edit2, Ban, CheckCircle, XCircle } from 'lucide-react';

interface User {
    id: string;
    email: string;
    displayName?: string;
    walletAddress?: string;
    tier: 'free' | 'pro' | 'max';
    pohVerified: boolean;
    blacklisted: boolean;
    analysisCount: number;
    createdAt: number;
    lastActive?: number;
}

interface Props {
    onUserUpdated: () => void;
}

export default function UserManagement({ onUserUpdated }: Props) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUserId, setEditingUserId] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const usersSnap = await getDocs(collection(db, 'users'));
            const usersData = usersSnap.docs.map(doc => ({
                id: doc.id,
                email: doc.data().email || '',
                displayName: doc.data().displayName,
                walletAddress: doc.data().walletAddress,
                tier: doc.data().tier || 'free',
                pohVerified: doc.data().pohVerified || false,
                blacklisted: doc.data().blacklisted || false,
                analysisCount: doc.data().analysisCount || 0,
                createdAt: doc.data().createdAt || Date.now(),
                lastActive: doc.data().lastActive,
            })) as User[];

            usersData.sort((a, b) => b.createdAt - a.createdAt);
            setUsers(usersData);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChangeTier = async (userId: string, newTier: 'free' | 'pro' | 'max') => {
        try {
            await updateDoc(doc(db, 'users', userId), { tier: newTier });

            // Log admin action
            await setDoc(doc(collection(db, 'admin_actions')), {
                action: 'tier_change',
                userId,
                newTier,
                timestamp: Date.now(),
            });

            await loadUsers();
            onUserUpdated();
            setEditingUserId(null);
            alert(`User tier updated to ${newTier}`);
        } catch (error) {
            console.error('Error updating tier:', error);
            alert('Failed to update tier');
        }
    };

    const handleToggleBlacklist = async (userId: string, currentStatus: boolean) => {
        const confirmed = window.confirm(
            currentStatus
                ? 'Are you sure you want to remove this user from the blacklist?'
                : 'Are you sure you want to blacklist this user? They will lose access to the platform.'
        );

        if (!confirmed) return;

        try {
            await updateDoc(doc(db, 'users', userId), { blacklisted: !currentStatus });

            // Log admin action
            await setDoc(doc(collection(db, 'admin_actions')), {
                action: currentStatus ? 'unblacklist' : 'blacklist',
                userId,
                timestamp: Date.now(),
            });

            await loadUsers();
            onUserUpdated();
            alert(currentStatus ? 'User removed from blacklist' : 'User blacklisted');
        } catch (error) {
            console.error('Error toggling blacklist:', error);
            alert('Failed to update blacklist status');
        }
    };

    const handleTogglePoH = async (userId: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'users', userId), { pohVerified: !currentStatus });

            // Log admin action
            await setDoc(doc(collection(db, 'admin_actions')), {
                action: currentStatus ? 'poh_unverify' : 'poh_verify',
                userId,
                timestamp: Date.now(),
            });

            await loadUsers();
            onUserUpdated();
            alert(currentStatus ? 'PoH verification removed' : 'PoH verified');
        } catch (error) {
            console.error('Error toggling PoH:', error);
            alert('Failed to update PoH status');
        }
    };

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.walletAddress?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto' }}></div>
            </div>
        );
    }

    return (
        <div className="card">
            <div style={{ marginBottom: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title" style={{ marginBottom: 0 }}>User Management</h3>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '40px', width: '300px' }}
                    />
                </div>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Wallet</th>
                            <th>Tier</th>
                            <th>PoH</th>
                            <th>Analyses</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div style={{ fontSize: 'var(--text-sm)' }}>
                                        <div style={{ fontWeight: 500 }}>{user.displayName || 'Anonymous'}</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', fontFamily: 'monospace' }}>
                                            {user.email}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>
                                        {user.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : '-'}
                                    </span>
                                </td>
                                <td>
                                    {editingUserId === user.id ? (
                                        <select
                                            value={user.tier}
                                            onChange={(e) => handleChangeTier(user.id, e.target.value as any)}
                                            style={{ fontSize: 'var(--text-xs)' }}
                                        >
                                            <option value="free">Free</option>
                                            <option value="pro">Pro</option>
                                            <option value="max">Max</option>
                                        </select>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                            <span className={`badge badge-${user.tier}`}>{user.tier.toUpperCase()}</span>
                                            <button
                                                onClick={() => setEditingUserId(user.id)}
                                                className="btn btn-sm"
                                                style={{ padding: '2px 4px', background: 'transparent', border: 'none' }}
                                            >
                                                <Edit2 size={12} style={{ color: 'var(--color-text-muted)' }} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleTogglePoH(user.id, user.pohVerified)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '4px',
                                        }}
                                    >
                                        {user.pohVerified ? (
                                            <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
                                        ) : (
                                            <XCircle size={18} style={{ color: 'var(--color-text-muted)' }} />
                                        )}
                                    </button>
                                </td>
                                <td>
                                    <span style={{ fontFamily: 'monospace' }}>{user.analysisCount}</span>
                                </td>
                                <td>
                                    {user.blacklisted ? (
                                        <span className="badge badge-blacklisted">Blacklisted</span>
                                    ) : (
                                        <span style={{ color: 'var(--color-success)', fontSize: 'var(--text-xs)' }}>Active</span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        onClick={() => handleToggleBlacklist(user.id, user.blacklisted)}
                                        className={`btn btn-sm ${user.blacklisted ? 'btn-success' : 'btn-danger'}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}
                                    >
                                        {user.blacklisted ? (
                                            <>
                                                <CheckCircle size={12} />
                                                Unban
                                            </>
                                        ) : (
                                            <>
                                                <Ban size={12} />
                                                Ban
                                            </>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
