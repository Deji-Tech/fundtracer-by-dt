import { useAuth } from '../contexts/AuthContext';
import { Shield, LogIn } from 'lucide-react';

export default function LoginPage() {
    const { signInWithGoogle, user, isAdmin } = useAuth();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        }}>
            <div style={{
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: 'var(--space-8)',
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
            }}>
                <div style={{ marginBottom: 'var(--space-6)' }}>
                    <Shield size={48} style={{ color: 'var(--color-info)', margin: '0 auto' }} />
                </div>

                <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                    FundTracer Admin
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: ' var(--space-6)' }}>
                    Secure dashboard for administrators only
                </p>

                {user && !isAdmin && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--color-danger)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-4)',
                        marginBottom: 'var(--space-4)',
                        color: 'var(--color-danger)',
                        fontSize: 'var(--text-sm)',
                    }}>
                        ⚠️ Access Denied: Your account does not have admin privileges
                    </div>
                )}

                <button
                    onClick={signInWithGoogle}
                    className="btn btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                >
                    <LogIn size={16} />
                    Sign in with Google
                </button>

                <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Only authorized administrators can access this dashboard
                </p>
            </div>
        </div>
    );
}
