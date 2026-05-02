import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface BillingStatus {
    subscription_active: boolean;
    current_period_end: string | null;
}

const SubscriptionGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkSubscription = async () => {
            try {
                const { data, error: sbError } = await supabase
                    .from('system_billing')
                    .select('subscription_active, current_period_end')
                    .single();

                if (sbError) throw sbError;

                // For development/first run, if the table is empty or active is true, allow.
                // In production, the webhook will set this to true.
                setIsActive(data?.subscription_active ?? true);
            } catch (err: any) {
                console.error('Error checking billing status:', err);
                setError(err.message);
                // Fallback to active to avoid locking out the user if the table isn't ready
                setIsActive(true);
            } finally {
                setLoading(false);
            }
        };

        checkSubscription();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isActive) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                backgroundColor: 'rgba(26, 35, 126, 0.95)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                textAlign: 'center',
                color: 'white',
                fontFamily: 'system-ui, -apple-system, sans-serif'
            }}>
                <div style={{
                    maxWidth: '500px',
                    padding: '40px',
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    color: '#1a237e'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#f5a000', marginBottom: '20px' }}>
                        lock
                    </span>
                    <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: '#1a237e' }}>
                        Sistema Bloqueado
                    </h2>
                    <p style={{ fontSize: '16px', color: '#4b5563', marginBottom: '32px', lineHeight: 1.6 }}>
                        O acesso ao painel administrativo foi suspenso devido à falta de pagamento.
                        Regularize sua assinatura para continuar utilizando os recursos da RVGS Elétrica.
                    </p>

                    <button
                        onClick={() => window.location.href = '/admin/billing'}
                        style={{
                            width: '100%',
                            padding: '16px 24px',
                            backgroundColor: '#f5a000',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            transition: 'transform 0.2s',
                            boxShadow: '0 4px 6px -1px rgba(245, 160, 0, 0.4)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <span className="material-symbols-outlined">payments</span>
                        Regularizar Pagamento
                    </button>

                    <p style={{ marginTop: '24px', fontSize: '13px', color: '#9ca3af' }}>
                        Dúvidas? Entre em contato com o suporte técnico.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default SubscriptionGuard;
