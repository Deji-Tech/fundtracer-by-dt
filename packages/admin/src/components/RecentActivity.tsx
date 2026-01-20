import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { Activity, DollarSign, User, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
    id: string;
    type: 'payment' | 'analysis' | 'tier_change' | 'blacklist' | 'unblacklist' | 'poh_verify' | 'poh_unverify';
    userId: string;
    userEmail?: string;
    details: any;
    timestamp: number;
}

export default function RecentActivity() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecentActivity();
    }, []);

    const loadRecentActivity = async () => {
        try {
            // Load admin actions
            const actionsSnap = await getDocs(
                query(collection(db, 'admin_actions'), orderBy('timestamp', 'desc'), limit(20))
            );

            const adminActions = actionsSnap.docs.map(doc => ({
                id: doc.id,
                type: doc.data().action as any,
                userId: doc.data().userId,
                details: doc.data(),
                timestamp: doc.data().timestamp,
            }));

            // Load recent payments
            const paymentsSnap = await getDocs(
                query(collection(db, 'analytics', 'revenue', 'payments'), orderBy('timestamp', 'desc'), limit(10))
            );

            const payments = paymentsSnap.docs.map(doc => ({
                id: doc.id,
                type: 'payment' as const,
                userId: doc.data().userId,
                userEmail: doc.data().userEmail,
                details: doc.data(),
                timestamp: doc.data().timestamp,
            }));

            const combined = [...adminActions, ...payments]
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 20);

            setActivities(combined);
        } catch (error) {
            console.error('Error loading recent activity:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'payment': return DollarSign;
            case 'tier_change': return User;
            case 'blacklist':
            case 'unblacklist': return AlertTriangle;
            case 'poh_verify':
            case 'poh_unverify': return Activity;
            default: return Activity;
        }
    };

    const getActivityColor = (type: string) => {
        switch (type) {
            case 'payment': return 'var(--color-success)';
            case 'tier_change': return 'var(--color-info)';
            case 'blacklist': return 'var(--color-danger)';
            case 'unblacklist': return 'var(--color-success)';
            case 'poh_verify': return 'var(--color-success)';
            case 'poh_unverify': return 'var(--color-warning)';
            default: return 'var(--color-text-muted)';
        }
    };

    const formatActivityMessage = (activity: ActivityItem) => {
        switch (activity.type) {
            case 'payment':
                return `Payment received: ${activity.details.amount} ETH for ${activity.details.tierUnlocked} tier`;
            case 'tier_change':
                return `User tier changed to ${activity.details.newTier}`;
            case 'blacklist':
                return 'User blacklisted';
            case 'unblacklist':
                return 'User removed from blacklist';
            case 'poh_verify':
                return 'PoH verification granted';
            case 'poh_unverify':
                return 'PoH verification removed';
            default:
                return activity.type;
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <div className="spinner" style={{ width: '32px', height: '32px', margin: '0 auto' }}></div>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 className="card-title">Recent Activity</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {activities.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--space-6)' }}>
                        No recent activity
                    </p>
                ) : (
                    activities.map(activity => {
                        const Icon = getActivityIcon(activity.type);
                        const color = getActivityColor(activity.type);

                        return (
                            <div
                                key={activity.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 'var(--space-3)',
                                    padding: 'var(--space-3)',
                                    background: 'var(--color-bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: `3px solid ${color}`,
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: 'var(--radius-md)',
                                    background: `${color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <Icon size={16} style={{ color }} />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-1)' }}>
                                        {formatActivityMessage(activity)}
                                    </div>
                                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                                        {activity.userEmail || activity.userId} • {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
