import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const AdminBilling: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [billingData, setBillingData] = useState<any>(null);

    useEffect(() => {
        const fetchBilling = async () => {
            const { data } = await supabase
                .from('system_billing')
                .select('*')
                .single();
            setBillingData(data);
            setLoading(false);
        };
        fetchBilling();
    }, []);

    const handleCheckout = async (isPix: boolean = false, months: number = 1) => {
        // This will call the Supabase Edge Function to get a Stripe Checkout URL
        try {
            // Guarantee we have the latest session with a valid JWT
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                alert('Sua sessão expirou. Por favor, faça login novamente.');
                await supabase.auth.signOut();
                navigate('/admin/login');
                return;
            }

            const { data, error } = await supabase.functions.invoke('create-checkout-session', {
                body: { return_url: window.location.href, isPix, months },
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err: any) {
            console.error("Full error object:", err);

            let detailedMessage = err.message;
            if (err.context) {
                try {
                    // Try to read the response body if it's attached to the error context
                    if (typeof err.context.json === 'function') {
                        const errBody = await err.context.json();
                        detailedMessage += " - " + JSON.stringify(errBody);
                    } else if (typeof err.context.text === 'function') {
                        const errText = await err.context.text();
                        detailedMessage += " - " + errText;
                    } else {
                        detailedMessage += " - Context: " + JSON.stringify(err.context);
                    }
                } catch (e) {
                    detailedMessage += " - (Could not parse error context)";
                }
            } else if (err.cause) {
                detailedMessage += " - Cause: " + JSON.stringify(err.cause);
            }

            // Treat "Invalid JWT" proactively
            if (detailedMessage.includes('Invalid JWT') || detailedMessage.includes('401')) {
                alert('Sua sessão de segurança expirou (Invalid JWT). Você será redirecionado para o login novamente.');
                await supabase.auth.signOut();
                navigate('/admin/login');
                return;
            }

            alert('Erro detalhado: ' + detailedMessage);
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1a237e', margin: 0 }}>
                        Assinatura do Sistema
                    </h2>
                    <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: billingData?.subscription_active ? '#def7ec' : '#fde8e8',
                        color: billingData?.subscription_active ? '#03543f' : '#9b1c1c'
                    }}>
                        {billingData?.subscription_active ? 'ATIVA' : 'INATIVA'}
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                    <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Próximo Vencimento</p>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                            {billingData?.current_period_end ? new Date(billingData.current_period_end).toLocaleDateString('pt-BR') : 'N/A'}
                        </p>
                    </div>
                    <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px' }}>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 4px 0' }}>Plano Atual</p>
                        <p style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>
                            Mensal RVGS Premium
                        </p>
                    </div>
                </div>

                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1a237e', marginBottom: '16px' }}>
                        Ações de Cobrança
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                        Mantenha sua assinatura em dia para evitar o bloqueio automático do sistema.
                        Os pagamentos são processados com segurança pelo Stripe.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                                Assinatura Recorrente Mensal:
                            </p>
                            <button
                                onClick={() => handleCheckout(false)}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    backgroundColor: '#f5a000',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <span className="material-symbols-outlined">credit_card</span>
                                {billingData?.subscription_active ? 'Gerenciar Cartão' : 'Assinar com Cartão'}
                            </button>
                        </div>

                        <div>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                                Planos Avulsos (Pagamento Único PIX):
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                                <button
                                    onClick={() => handleCheckout(true, 1)}
                                    style={{
                                        padding: '12px',
                                        backgroundColor: '#32bcab',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pix</span>
                                        <span>1 Mês</span>
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => handleCheckout(true, 3)}
                                    style={{
                                        padding: '12px',
                                        backgroundColor: '#32bcab',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pix</span>
                                        <span>3 Meses (Trimestral)</span>
                                    </div>
                                    <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>10% OFF</span>
                                </button>

                                <button
                                    onClick={() => handleCheckout(true, 6)}
                                    style={{
                                        padding: '12px',
                                        backgroundColor: '#32bcab',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pix</span>
                                        <span>6 Meses (Semestral)</span>
                                    </div>
                                    <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>10% OFF</span>
                                </button>

                                <button
                                    onClick={() => handleCheckout(true, 12)}
                                    style={{
                                        padding: '12px',
                                        backgroundColor: '#32bcab',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pix</span>
                                        <span>12 Meses (Anual)</span>
                                    </div>
                                    <span style={{ fontSize: '12px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '4px' }}>10% OFF</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#1e40af', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span className="material-symbols-outlined">info</span>
                <p style={{ margin: 0 }}>
                    <b>Dica do Desenvolvedor:</b> Pagamentos via Cartão de Crédito liberam o sistema instantaneamente.
                    Boleto e PIX podem levar até 24h para processamento.
                </p>
            </div>
        </div>
    );
};

export default AdminBilling;
