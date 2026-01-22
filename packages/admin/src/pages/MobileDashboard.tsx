import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import UsageCharts from '../components/UsageCharts';
import MobileUserManagement from '../components/MobileUserManagement';
import RecentActivity from '../components/RecentActivity';
import { LogOut, Users, Activity, TrendingUp } from 'lucide-react';

export interface DashboardStats {
    totalVisitors: number;
    activeUsers: number;
    pohVerifiedUsers: number;
    totalRevenue: number;
    totalAnalyses: number;
    freeUsers: number;
    proUsers: number;
    maxUsers: number;
    blacklistedUsers: number;
}

export interface ChainUsage {
    ethereum: number;
    arbitrum: number;
    base: number;
    linea: number;
}

export interface FeatureUsage {
    wallet: number;
    compare: number;
    sybil: number;
    contract: number;
}

export default function MobileDashboard() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalVisitors: 0,
        activeUsers: 0,
        pohVerifiedUsers: 0,
        totalRevenue: 0,
        totalAnalyses: 0,
        freeUsers: 0,
        proUsers: 0,
        maxUsers: 0,
        blacklistedUsers: 0,
    });
    const [chainUsage, setChainUsage] = useState<ChainUsage>({
        ethereum: 0,
        arbitrum: 0,
        base: 0,
        linea: 0,
    });
    const [featureUsage, setFeatureUsage] = useState<FeatureUsage>({
        wallet: 0,
        compare: 0,
        sybil: 0,
        contract: 0,
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity'>('overview');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            console.log('[Dashboard] Starting data load...');
            console.log('[Dashboard] Firestore db:', db);

            // Load user stats
            const usersSnap = await getDocs(collection(db, 'users'));
            const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const pohVerified = users.filter((u: any) => u.pohVerified === true).length;
            const freeUsers = users.filter((u: any) => u.tier === 'free' || !u.tier).length;
            const proUsers = users.filter((u: any) => u.tier === 'pro').length;
            const maxUsers = users.filter((u: any) => u.tier === 'max').length;
            const blacklistedUsers = users.filter((u: any) => u.blacklisted === true).length;

            // Load revenue
            const revenueSnap = await getDocs(collection(db, 'analytics', 'revenue', 'payments'));
            const totalRevenue = revenueSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

            // Load analytics
            const analyticsSnap = await getDocs(collection(db, 'analytics', 'daily_stats', 'records'));
            const analyticsData = analyticsSnap.docs.map(doc => doc.data());

            const totalAnalyses = analyticsData.reduce((sum: number, day: any) => sum + (day.analysisCount || 0), 0);

            // Chain usage
            const chainStats = analyticsData.reduce((acc: any, day: any) => {
                acc.ethereum += day.chainUsage?.ethereum || 0;
                acc.arbitrum += day.chainUsage?.arbitrum || 0;
                acc.base += day.chainUsage?.base || 0;
                acc.linea += day.chainUsage?.linea || 0;
                return acc;
            }, { ethereum: 0, arbitrum: 0, base: 0, linea: 0 });

            // Feature usage
            const featureStats = analyticsData.reduce((acc: any, day: any) => {
                acc.wallet += day.featureUsage?.wallet || 0;
                acc.compare += day.featureUsage?.compare || 0;
                acc.sybil += day.featureUsage?.sybil || 0;
                acc.contract += day.featureUsage?.contract || 0;
                return acc;
            }, { wallet: 0, compare: 0, sybil: 0, contract: 0 });

            setStats({
                totalVisitors: users.length,
                activeUsers: users.length,
                pohVerifiedUsers: pohVerified,
                totalRevenue,
                totalAnalyses,
                freeUsers,
                proUsers,
                maxUsers,
                blacklistedUsers,
            });

            setChainUsage(chainStats);
            setFeatureUsage(featureStats);
        } catch (error) {
            console.error('[Dashboard] Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', paddingBottom: '80px' }}>
            {/* Mobile Header */}
            <header style={{
                background: 'var(--color-bg-secondary)',
                borderBottom: '1px solid var(--color-border)',
                padding: 'var(--space-4)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: 0 }}>FT Admin</h1>
                    <button onClick={logout} className="btn btn-secondary btn-sm" style={{ padding: '6px' }}>
                        <LogOut size={16} />
                    </button>
                </div>

                {/* Mobile Tabs */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-2)',
                    marginTop: 'var(--space-3)',
                    overflowX: 'auto',
                    paddingBottom: '2px'
                }}>
                    {[
                        { id: 'overview', label: 'Stats', icon: TrendingUp },
                        { id: 'users', label: 'Users', icon: Users },
                        { id: 'activity', label: 'Activity', icon: Activity },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                flex: 1,
                                padding: 'var(--space-2)',
                                background: activeTab === tab.id ? 'var(--color-bg-tertiary)' : 'transparent',
                                border: '1px solid ' + (activeTab === tab.id ? 'var(--color-border)' : 'transparent'),
                                borderRadius: 'var(--radius-md)',
                                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                fontSize: 'var(--text-xs)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 'var(--space-2)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main style={{ padding: 'var(--space-4)' }}>
                {activeTab === 'overview' && (
                    <>
                        <StatsOverview stats={stats} />
                        <div style={{ overflowX: 'auto' }}>
                            <UsageCharts chainUsage={chainUsage} featureUsage={featureUsage} stats={stats} />
                        </div>
                    </>
                )}

                {activeTab === 'users' && (
                    <MobileUserManagement onUserUpdated={loadDashboardData} />
                )}

                {activeTab === 'activity' && (
                    <RecentActivity />
                )}
            </main>
        </div>
    );
}
