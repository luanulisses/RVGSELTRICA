import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { LOGO_BASE64 } from '../../constants/assets';

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuoteItem {
    description: string;
    qty: number | string;
    unit: string;
    unitValue: number | string;
}

interface ContractData {
    client: {
        name: string;
        cpf: string;
        phone: string;
        email: string;
        address: string;
        neighborhood: string;
        city: string;
        state: string;
        zipCode: string;
    };
    system: {
        power: string;
        installLocation: string;
        modulesQty: number | string;
        modulesWatts: number | string;
        modulesBrand: string;
        modulesModel: string;
        inverterBrand: string;
        inverterModel: string;
        inverterPower: string;
        structureType: string;
        roofType: string;
        cableSpec: string;
    };
    services: {
        includes: string[];
        deliveryDays: number | string;
        observations: string;
    };
    payment: {
        totalValue: number | string;
        deposit: number | string;
        depositDate: string;
        installments: number | string;
        installmentsValue: number | string;
        method: string;
        bankName: string;
        bankAgency: string;
        bankAccount: string;
        pixKey: string;
        observations: string;
    };
    quote: {
        number: string;
        date: string;
        validityDays: number | string;
        equipmentItems: QuoteItem[];
        serviceItems: QuoteItem[];
    };
    contractDate: string;
    contractCity: string;
}

const todayStr = () => new Date().toISOString().split('T')[0];
const quoteSeq = () => {
    const d = new Date();
    return `ORC-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-001`;
};

const INITIAL_DATA: ContractData = {
    client: { name: '', cpf: '', phone: '', email: '', address: '', neighborhood: '', city: 'Brasília', state: 'DF', zipCode: '' },
    system: {
        power: '',
        installLocation: '',
        modulesQty: '',
        modulesWatts: '',
        modulesBrand: '',
        modulesModel: '',
        inverterBrand: 'DEYE',
        inverterModel: '',
        inverterPower: '',
        structureType: 'Alumínio',
        roofType: 'Laje',
        cableSpec: '6mm²',
    },
    services: {
        includes: ['Projeto e ART', 'Instalação completa', 'Homologação Neoenergia', 'Manutenção e limpeza anual (12 meses)'],
        deliveryDays: '35',
        observations: '',
    },
    payment: {
        totalValue: '',
        deposit: '',
        depositDate: '',
        installments: '',
        installmentsValue: '',
        method: 'PIX + Cartão de Crédito',
        bankName: 'C6 Bank (336)',
        bankAgency: '0001',
        bankAccount: '41336974-9',
        pixKey: '64.976.735/0001-38 (CNPJ)',
        observations: '',
    },
    quote: {
        number: quoteSeq(),
        date: todayStr(),
        validityDays: 15,
        equipmentItems: [
            { description: 'Módulos Fotovoltaicos Bifaciais 700 W', qty: '', unit: 'un', unitValue: '' },
            { description: 'Inversor DEYE – Modelo INVDE TR 380 25KW (25 kW)', qty: 1, unit: 'un', unitValue: '' },
            { description: 'Estrutura de suporte em alumínio para fixação em laje', qty: 1, unit: 'cj', unitValue: '' },
            { description: 'Cabeamento 6mm² e conectores MC4', qty: 1, unit: 'cj', unitValue: '' },
        ],
        serviceItems: [
            { description: 'Elaboração de projeto e gestão da obra (Engenheiro Eletricista + ART CREA-DF)', qty: 1, unit: 'sv', unitValue: '' },
            { description: 'Instalação integral do sistema fotovoltaico e aterramento', qty: 1, unit: 'sv', unitValue: 'Incluso' },
            { description: 'Homologação e aprovação junto à Neoenergia', qty: 1, unit: 'sv', unitValue: 'Incluso' },
            { description: 'Manutenção, testes e limpeza anual (12 meses de garantia)', qty: 1, unit: 'sv', unitValue: 'Incluso' },
        ],
    },
    contractDate: todayStr(),
    contractCity: 'Brasília',
};

const SERVICES_OPTIONS = [
    'Projeto e ART',
    'Instalação completa',
    'Homologação Neoenergia',
    'Manutenção e limpeza anual (12 meses)',
    'Wallbox para Carro Elétrico',
    'Cabeamento e conectores MC4',
    'Monitoramento remoto do sistema',
    'Treinamento de uso do inversor',
];

const STEPS = [
    { id: 'client', label: 'Cliente', icon: 'person' },
    { id: 'system', label: 'Sistema', icon: 'solar_power' },
    { id: 'services', label: 'Serviços', icon: 'handyman' },
    { id: 'payment', label: 'Pagamento', icon: 'payments' },
    { id: 'review', label: 'Revisão', icon: 'visibility' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const C = {
    primary: '#F5A000',
    primaryDark: '#D48800',
    navy: '#1565C0',
    navyLight: '#1976D2',
    bg: '#F0F4FA',
    border: '#D0DCF0',
    muted: '#5A6A8A',
    text: '#1A2340',
};

const inputCls = `w-full bg-white border border-[#D0DCF0] rounded-xl px-4 py-3 outline-none focus:border-[#F5A000] focus:ring-4 focus:ring-[#F5A000]/10 transition-all text-[#1A2340]`;
const labelCls = `block text-[10px] font-bold uppercase tracking-wider text-[#5A6A8A] mb-1`;

// ─── Component ────────────────────────────────────────────────────────────────
const ContractGenerator: React.FC = () => {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<ContractData>(INITIAL_DATA);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [newContractId, setNewContractId] = useState<string | null>(null);
    const [printMode, setPrintMode] = useState<'contract' | 'quote' | null>(null);
    const [shouldPrint, setShouldPrint] = useState(false);
    const [searchParams] = useSearchParams();
    const printRef = useRef<HTMLDivElement>(null);
    const { id } = useParams();
    const navigate = useNavigate();

    // Fire window.print() only after the correct template has been rendered into DOM
    useEffect(() => {
        if (shouldPrint && printMode !== null) {
            const timer = setTimeout(() => {
                window.print();
                setPrintMode(null);
                setShouldPrint(false);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [shouldPrint, printMode]);

    useEffect(() => {
        if (id && id !== 'novo') {
            supabase.from('contracts').select('contract_data').eq('id', id).single().then(({ data: contract }) => {
                if (contract?.contract_data) {
                    setData(contract.contract_data as ContractData);
                    if (searchParams.get('print') === 'true') setStep(STEPS.length - 1);
                }
            });
        }
    }, [id, searchParams]);

    const updateData = (section: keyof ContractData, field: string, value: any) => {
        setData(prev => ({ ...prev, [section]: { ...(prev[section] as any), [field]: value } }));
    };

    const toggleService = (item: string) => {
        const arr = data.services.includes;
        setData(prev => ({
            ...prev,
            services: {
                ...prev.services,
                includes: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item],
            },
        }));
    };

    const handlePrint = () => { setPrintMode('contract'); setShouldPrint(true); };
    const handlePrintQuote = () => { setPrintMode('quote'); setShouldPrint(true); };

    // Print from success screen: restore normal render first, then trigger print
    const handlePrintFromSuccess = () => {
        setSaveSuccess(false);
        setStep(STEPS.length - 1);
        setTimeout(() => {
            setPrintMode('contract');
            setShouldPrint(true);
        }, 400);
    };

    const handleSave = async () => {
        if (!data.client.name) { alert('Informe o nome do cliente.'); setStep(0); return; }

        setIsSaving(true);
        try {
            // Upsert lead
            let leadId: string | null = null;
            const { data: existLead } = await supabase.from('leads').select('id').or(`phone.eq.${data.client.phone},name.eq.${data.client.name}`).maybeSingle();
            if (existLead) {
                leadId = existLead.id;
                await supabase.from('leads').update({ name: data.client.name, phone: data.client.phone, status: 'Fechado', contract_value: Number(data.payment.totalValue) || 0 }).eq('id', leadId!);
            } else {
                const { data: newLead } = await supabase.from('leads').insert([{ name: data.client.name, phone: data.client.phone, contact: data.client.phone || data.client.email, status: 'Fechado', contract_value: Number(data.payment.totalValue) || 0 }]).select('id').maybeSingle();
                leadId = newLead?.id || null;
            }

            // Save contract
            const contractId = (id && id !== 'novo') ? id : crypto.randomUUID();
            const { data: saved, error: cErr } = await supabase.from('contracts').upsert([{
                id: contractId, lead_id: leadId, client_name: data.client.name, client_cpf: data.client.cpf,
                event_date: data.contractDate, total_value: Number(data.payment.totalValue) || 0, contract_data: data
            }]).select().single();
            if (cErr) { alert(`Erro ao salvar contrato: ${cErr.message}`); return; }

            // Financial: entrada
            if (!id || id === 'novo') {
                const depositAmt = Number(data.payment.deposit || 0);
                const movements = [];
                if (depositAmt > 0) movements.push({ type: 'Receita', description: `Entrada — ${data.client.name}`, amount: depositAmt, date: data.payment.depositDate || data.contractDate, category: 'Contrato Solar' });
                const balance = Number(data.payment.totalValue || 0) - depositAmt;
                if (balance > 0) movements.push({ type: 'Receita', description: `Saldo — ${data.client.name}`, amount: balance, date: data.contractDate, category: 'Contrato Solar' });
                if (movements.length) await supabase.from('financial_movements').insert(movements);
            }

            setNewContractId(saved?.id || contractId);
            setSaveSuccess(true);
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar. Verifique a conexão.');
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-calc helper: called whenever total, deposit, or installments change
    const autoCalcInstallment = (total: string, deposit: string, installments: string) => {
        const balance = Number(total || 0) - Number(deposit || 0);
        const n = Number(installments || 0);
        if (n > 0 && balance > 0) {
            const val = (balance / n).toFixed(2);
            setData(prev => ({ ...prev, payment: { ...prev.payment, installmentsValue: val } }));
        }
    };

    const formatCurrency = (val: number | string) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);

    const formatDate = (d: string) => {
        if (!d) return '__/__/____';
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    };

    const numberToWords = (num: number) => {
        const ones = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
            'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
        const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
        if (num === 0) return 'zero';
        if (num < 20) return ones[num];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' e ' + ones[num % 10] : '');
        if (num < 1000) return (num === 100 ? 'cem' : (['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'][Math.floor(num / 100)])) + (num % 100 ? ' e ' + numberToWords(num % 100) : '');
        return `${Math.floor(num / 1000)} mil` + (num % 1000 ? ' e ' + numberToWords(num % 1000) : '');
    };

    const currencyInWords = (val: number | string) => {
        const n = Math.round(Number(val) * 100);
        const reais = Math.floor(n / 100);
        const centavos = n % 100;
        let s = '';
        if (reais > 0) s += `${numberToWords(reais)} ${reais === 1 ? 'real' : 'reais'}`;
        if (centavos > 0) s += (s ? ' e ' : '') + `${numberToWords(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`;
        return s || 'zero reais';
    };

    // ── Success Screen ────────────────────────────────────────────────────────
    if (saveSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-green-600">check_circle</span>
                </div>
                <h2 className="text-2xl font-display font-bold text-text-main">Contrato Salvo!</h2>
                <p className="text-text-muted text-center max-w-sm">O contrato de <strong>{data.client.name}</strong> foi registrado com sucesso no sistema.</p>
                <div className="flex flex-wrap gap-3 justify-center">
                    <button
                        onClick={handlePrintFromSuccess}
                        className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold shadow-sm transition-colors" style={{ background: C.navy }}>
                        <span className="material-symbols-outlined">print</span> Imprimir Contrato
                    </button>
                    <button onClick={handlePrintQuote} className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-bold shadow-sm transition-colors" style={{ background: C.primary }}>
                        <span className="material-symbols-outlined">request_quote</span> Gerar Orçamento
                    </button>
                    <button onClick={() => navigate(`/admin/nota-fiscal?contract_id=${newContractId}&client_name=${encodeURIComponent(data.client.name)}&total_value=${data.payment.totalValue}&deposit_value=${data.payment.deposit}&source=contract_success`)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl font-bold shadow-sm hover:bg-green-700 transition-colors">
                        <span className="material-symbols-outlined">receipt_long</span> Recibos e NF
                    </button>
                    <button onClick={() => { setSaveSuccess(false); setData(INITIAL_DATA); setStep(0); navigate('/admin/contratos/novo'); }}
                        className="px-5 py-2.5 bg-white border text-text-muted rounded-xl font-bold hover:bg-surface-soft transition-colors" style={{ borderColor: C.border }}>
                        Novo Contrato
                    </button>
                    <button onClick={() => navigate('/admin/contratos')} className="px-5 py-2.5 bg-white border text-text-muted rounded-xl font-bold hover:bg-surface-soft transition-colors" style={{ borderColor: C.border }}>
                        Ver Contratos
                    </button>
                </div>
            </div>
        );
    }

    // ── Quote Print Template ──────────────────────────────────────────────────
    const PrintQuote = () => {
        const total = Number(data.payment.totalValue) || 0;
        const deposit = Number(data.payment.deposit) || 0;
        const installments = Number(data.payment.installments) || 0;
        const installmentsValue = Number(data.payment.installmentsValue) || 0;
        const quoteDate = data.quote?.date || data.contractDate;
        const validityDays = Number(data.quote?.validityDays || 15);
        const quoteNumber = data.quote?.number || 'ORC-2026-001';

        // Compute validity date
        const validDate = (() => {
            if (!quoteDate) return '';
            const d = new Date(quoteDate + 'T12:00:00');
            d.setDate(d.getDate() + validityDays);
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        })();

        const eqItems: QuoteItem[] = data.quote?.equipmentItems || [];
        const svItems: QuoteItem[] = data.quote?.serviceItems || [];
        const allItems = [...eqItems, ...svItems];
        let globalIdx = 0;

        const fmtVal = (v: number | string) => {
            if (v === 'Incluso' || v === '') return String(v || 'Incluso');
            const n = Number(v);
            return isNaN(n) ? String(v) : formatCurrency(n);
        };
        const rowTotal = (item: QuoteItem) => {
            if (item.unitValue === 'Incluso' || item.unitValue === '') return item.unitValue === 'Incluso' ? 'Incluso' : '';
            return formatCurrency(Number(item.qty || 0) * Number(item.unitValue || 0));
        };

        const tdStyle = (align: 'left' | 'center' | 'right' = 'left', extra?: React.CSSProperties): React.CSSProperties => ({
            padding: '6px 8px', textAlign: align, borderBottom: '1px solid #D0DCF0', fontSize: '9pt', ...extra
        });

        return (
            <div style={{ fontFamily: 'Arial, sans-serif', color: '#111', background: 'white', maxWidth: '800px', margin: '0 auto', fontSize: '10pt' }}>

                {/* ── HEADER ── */}
                <div style={{ display: 'flex', background: '#1565C0', color: 'white', padding: '0' }}>
                    {/* Logo block */}
                    <div style={{ background: 'white', padding: '12px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '160px' }}>
                        <img src={LOGO_BASE64} alt="RVGS" style={{ height: '52px', width: 'auto' }} />
                        <div style={{ fontSize: '7pt', fontWeight: 700, color: '#1565C0', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>ELÉTRICA FOTOVOLTAICA</div>
                    </div>
                    {/* Title block */}
                    <div style={{ flex: 1, background: '#F5A000', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 20px' }}>
                        <div style={{ fontSize: '18pt', fontWeight: 900, color: 'white', letterSpacing: '1px' }}>PROPOSTA COMERCIAL</div>
                        <div style={{ fontSize: '10pt', color: 'white', fontWeight: 600 }}>Sistema de Microgeração Solar Fotovoltaica</div>
                        <div style={{ fontSize: '8pt', color: 'rgba(255,255,255,0.85)', marginTop: '2px' }}>CNPJ: 64.976.735/0001-38 &nbsp;|&nbsp; Tel: (61) 99380-1434</div>
                    </div>
                </div>

                {/* ── QUOTE META ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '2px solid #E0E8F5', marginBottom: '16px' }}>
                    {[['Nº DO ORÇAMENTO', quoteNumber], ['DATA DE EMISSÃO', formatDate(quoteDate)], [`VALIDADE DA PROPOSTA`, `${validDate} (${validityDays} dias)`]].map(([label, value]) => (
                        <div key={label} style={{ padding: '10px 16px', borderRight: '1px solid #E0E8F5' }}>
                            <div style={{ fontSize: '8pt', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
                            <div style={{ fontSize: '11pt', fontWeight: 700, color: '#F5A000', marginTop: '2px' }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* ── 1. DADOS DO CLIENTE ── */}
                <div style={{ marginBottom: '16px', padding: '0 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '11pt', color: '#1565C0', borderBottom: '2px solid #F5A000', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase' }}>1. Dados do Cliente</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #D0DCF0', fontSize: '9pt' }}>
                        <tbody>
                            <tr>
                                <td style={{ padding: '6px 10px', width: '60%', borderRight: '1px solid #D0DCF0', borderBottom: '1px solid #D0DCF0' }}>
                                    <div style={{ fontSize: '8pt', color: '#888' }}>Cliente:</div>
                                    <div style={{ fontWeight: 600 }}>{data.client.name || '—'}</div>
                                </td>
                                <td style={{ padding: '6px 10px', borderBottom: '1px solid #D0DCF0' }}>
                                    <div style={{ fontSize: '8pt', color: '#888' }}>CPF:</div>
                                    <div style={{ fontWeight: 600 }}>{data.client.cpf || '—'}</div>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ padding: '6px 10px', borderBottom: '1px solid #D0DCF0' }}>
                                    <div style={{ fontSize: '8pt', color: '#888' }}>Endereço de Instalação:</div>
                                    <div style={{ fontWeight: 600 }}>{data.system.installLocation || data.client.address}{data.client.neighborhood ? `, ${data.client.neighborhood}` : ''}{data.client.city ? `, ${data.client.city}/${data.client.state}` : ''}{data.client.zipCode ? ` — CEP ${data.client.zipCode}` : ''}</div>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '6px 10px', borderRight: '1px solid #D0DCF0' }}>
                                    <div style={{ fontSize: '8pt', color: '#888' }}>Telefone:</div>
                                    <div style={{ fontWeight: 600 }}>{data.client.phone || '(XX) XXXXX-XXXX'}</div>
                                </td>
                                <td style={{ padding: '6px 10px' }}>
                                    <div style={{ fontSize: '8pt', color: '#888' }}>E-mail:</div>
                                    <div style={{ fontWeight: 600 }}>{data.client.email || '—'}</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ── 2. DESCRIÇÃO DO SERVIÇO / TABELA DE VALORES ── */}
                <div style={{ marginBottom: '16px', padding: '0 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '11pt', color: '#1565C0', borderBottom: '2px solid #F5A000', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase' }}>2. Descrição do Serviço / Tabela de Valores</div>
                    <div style={{ fontWeight: 600, fontSize: '9pt', marginBottom: '6px' }}>Sistema de Microgeração Solar Fotovoltaica – Potência Nominal: <strong>{data.system.power || '__'} kWp</strong></div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #D0DCF0', fontSize: '9pt' }}>
                        <thead>
                            <tr style={{ background: '#1565C0', color: 'white' }}>
                                <th style={{ padding: '7px 8px', textAlign: 'center', width: '32px' }}>Item</th>
                                <th style={{ padding: '7px 8px', textAlign: 'left' }}>Descrição do Produto / Serviço</th>
                                <th style={{ padding: '7px 8px', textAlign: 'center', width: '40px' }}>Qtd.</th>
                                <th style={{ padding: '7px 8px', textAlign: 'center', width: '50px' }}>Unid.</th>
                                <th style={{ padding: '7px 8px', textAlign: 'right', width: '90px' }}>Valor Unit.</th>
                                <th style={{ padding: '7px 8px', textAlign: 'right', width: '90px' }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Equipment section header */}
                            {eqItems.length > 0 && (
                                <tr style={{ background: '#FFF3E0' }}>
                                    <td colSpan={6} style={{ padding: '4px 8px', fontWeight: 700, color: '#F5A000', fontSize: '8.5pt', borderBottom: '1px solid #D0DCF0' }}>EQUIPAMENTOS</td>
                                </tr>
                            )}
                            {eqItems.map((item, i) => {
                                globalIdx++;
                                const idx = globalIdx;
                                return (
                                    <tr key={`eq-${i}`} style={{ background: i % 2 === 0 ? '#fff' : '#FAFCFF' }}>
                                        <td style={tdStyle('center')}>{String(idx).padStart(2, '0')}</td>
                                        <td style={tdStyle('left')}>{item.description}</td>
                                        <td style={tdStyle('center')}>{item.qty}</td>
                                        <td style={tdStyle('center')}>{item.unit}</td>
                                        <td style={tdStyle('right')}>{fmtVal(item.unitValue)}</td>
                                        <td style={tdStyle('right', { fontWeight: 600 })}>{rowTotal(item)}</td>
                                    </tr>
                                );
                            })}
                            {/* Services section header */}
                            {svItems.length > 0 && (
                                <tr style={{ background: '#FFF3E0' }}>
                                    <td colSpan={6} style={{ padding: '4px 8px', fontWeight: 700, color: '#F5A000', fontSize: '8.5pt', borderBottom: '1px solid #D0DCF0' }}>SERVIÇOS</td>
                                </tr>
                            )}
                            {svItems.map((item, i) => {
                                globalIdx++;
                                const idx = globalIdx;
                                return (
                                    <tr key={`sv-${i}`} style={{ background: i % 2 === 0 ? '#fff' : '#FAFCFF' }}>
                                        <td style={tdStyle('center')}>{String(idx).padStart(2, '0')}</td>
                                        <td style={tdStyle('left')}>{item.description}</td>
                                        <td style={tdStyle('center')}>{item.qty}</td>
                                        <td style={tdStyle('center')}>{item.unit}</td>
                                        <td style={tdStyle('right')}>{fmtVal(item.unitValue)}</td>
                                        <td style={tdStyle('right', { fontWeight: 600 })}>{rowTotal(item)}</td>
                                    </tr>
                                );
                            })}
                            {/* Total row */}
                            <tr style={{ background: '#1A2340', color: 'white' }}>
                                <td colSpan={5} style={{ padding: '9px 8px', fontWeight: 700, fontSize: '10pt', textAlign: 'right' }}>VALOR TOTAL DO PROJETO:</td>
                                <td style={{ padding: '9px 8px', fontWeight: 700, fontSize: '10pt', textAlign: 'right' }}>{formatCurrency(total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ── 3. CONDIÇÕES / PRAZO / GARANTIAS ── */}
                <div style={{ marginBottom: '16px', padding: '0 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '11pt', color: '#1565C0', borderBottom: '2px solid #F5A000', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase' }}>3. Prazo de Execução, Condições de Pagamento e Garantias</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #D0DCF0', fontSize: '9pt' }}>
                        <thead>
                            <tr style={{ background: '#1565C0', color: 'white' }}>
                                <th style={{ padding: '7px 10px', textAlign: 'left', width: '34%' }}>CONDIÇÕES DE PAGAMENTO</th>
                                <th style={{ padding: '7px 10px', textAlign: 'left', width: '33%', borderLeft: '1px solid rgba(255,255,255,0.3)' }}>PRAZO DE EXECUÇÃO</th>
                                <th style={{ padding: '7px 10px', textAlign: 'left', borderLeft: '1px solid rgba(255,255,255,0.3)' }}>GARANTIAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ verticalAlign: 'top' }}>
                                <td style={{ padding: '10px', borderRight: '1px solid #D0DCF0', lineHeight: 1.7 }}>
                                    {deposit > 0 && <div><span style={{ color: '#F5A000', fontWeight: 600 }}>PIX (entrada):</span><br /><span style={{ color: '#F5A000' }}>{formatCurrency(deposit)} ({Math.round(deposit / total * 100)}%)</span></div>}
                                    {installments > 0 && <div style={{ marginTop: '4px' }}><span style={{ fontWeight: 600 }}>Cartão de Crédito:</span><br />{formatCurrency(Number(data.payment.totalValue) - deposit)} em {installments}x</div>}
                                </td>
                                <td style={{ padding: '10px', borderRight: '1px solid #D0DCF0' }}>
                                    <div style={{ color: '#F5A000', fontWeight: 700, fontSize: '12pt' }}>{data.services.deliveryDays} dias corridos</div>
                                    <div style={{ fontSize: '8.5pt', color: '#555', marginTop: '4px' }}>a partir da confirmação do pagamento e assinatura do contrato.</div>
                                </td>
                                <td style={{ padding: '10px', lineHeight: 1.8, fontSize: '8.5pt' }}>
                                    <div>Instalação: 12 meses</div>
                                    <div>Módulos: 12 anos (defeito) / 25 anos (eficiência)</div>
                                    <div>Inversor: 10 anos (fabricante)</div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ── 4. OBSERVAÇÕES ── */}
                <div style={{ marginBottom: '20px', padding: '0 16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '11pt', color: '#1565C0', borderBottom: '2px solid #F5A000', paddingBottom: '4px', marginBottom: '10px', textTransform: 'uppercase' }}>4. Observações</div>
                    <div style={{ background: '#1A2340', color: 'white', padding: '8px 12px', fontWeight: 700, fontSize: '9pt', marginBottom: '0' }}>OBSERVAÇÕES IMPORTANTES</div>
                    <div style={{ border: '1px solid #D0DCF0', borderTop: 'none', padding: '10px 12px', fontSize: '8.5pt', lineHeight: 1.8 }}>
                        <div>1. Esta proposta tem validade de {validityDays} (quinze) dias a contar da data de emissão, podendo sofrer reajuste após este prazo.</div>
                        <div>2. Os valores apresentados incluem fornecimento dos equipamentos, instalação, projeto de engenharia (ART/CREA-DF) e homologação junto à concessionária Neoenergia.</div>
                        <div>3. O prazo de execução poderá ser prorrogado por caso fortuito, força maior, necessidade de adequações na rede da concessionária ou solicitação de alterações pelo contratante.</div>
                        <div>4. O sistema está dimensionado com base no histórico de consumo informado. Eventuais ampliações deverão ser objeto de aditivo contratual.</div>
                        <div>5. Não estão incluídos: adequação de rede elétrica interna, obras civis ou qualquer outro serviço não especificado nesta proposta.</div>
                        {data.payment.observations ? <div style={{ marginTop: '6px' }}>6. {data.payment.observations}</div> : null}
                    </div>
                </div>

                {/* ── ASSINATURAS ── */}
                <div style={{ padding: '0 16px', marginBottom: '20px' }}>
                    <p style={{ textAlign: 'center', marginBottom: '36px', fontSize: '10pt' }}>
                        {data.contractCity || 'Brasília'} – DF, ______ de ________________________ de {new Date(quoteDate + 'T12:00:00').getFullYear()}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
                                <div style={{ fontWeight: 700, fontSize: '10pt' }}>RVGS ELÉTRICA FOTOVOLTAICA LTDA</div>
                                <div style={{ color: '#555', fontSize: '9pt' }}>CNPJ: 64.976.735/0001-38</div>
                                <div style={{ color: '#555', fontSize: '9pt' }}>Ricardo Vieira Gonçalves Sousa</div>
                                <div style={{ color: '#555', fontSize: '9pt' }}>Representante Legal</div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
                                <div style={{ fontWeight: 700, fontSize: '10pt' }}>CONTRATANTE</div>
                                <div style={{ color: '#555', fontSize: '9pt' }}>{data.client.name || '—'}</div>
                                {data.client.cpf && <div style={{ color: '#555', fontSize: '9pt' }}>CPF: {data.client.cpf}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RODAPÉ ── */}
                <div style={{ background: '#1565C0', color: 'white', padding: '8px 16px', fontSize: '8pt', textAlign: 'center' }}>
                    RVGS ELÉTRICA FOTOVOLTAICA LTDA. | (61) 99380-1434. | CNPJ: 64.976.735/0001-38<br />
                    Condomínio Alto da Boa Vista, Quadra 208, Conjunto 03, Lote 19 – Sobradinho/DF
                </div>
            </div>
        );
    };

    // ── Print Template ────────────────────────────────────────────────────────
    const PrintContract = () => (
        <div ref={printRef} style={{ fontFamily: 'Georgia, serif', color: '#111', lineHeight: 1.7, padding: '40px 60px', maxWidth: '800px', margin: '0 auto', fontSize: '12pt' }}>
            {/* Capa do Contrato */}
            <div style={{ height: '900px', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ marginBottom: '60px' }}>
                    <img src={LOGO_BASE64} alt="RVGS Logo" style={{ height: '120px', width: 'auto', marginBottom: '20px' }} />
                    <div style={{ fontFamily: 'Arial, sans-serif', fontWeight: 700, fontSize: '24pt', color: '#F5A000' }}>RVGS <span style={{ color: '#1565C0' }}>ELÉTRICA</span></div>
                    <div style={{ fontSize: '12pt', color: '#555', letterSpacing: '2px', textTransform: 'uppercase' }}>FOTOVOLTAICA LTDA</div>
                </div>

                <h2 style={{ fontSize: '18pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#1A2340', borderTop: '2px solid #F5A000', borderBottom: '2px solid #F5A000', padding: '40px 0', margin: '40px 0' }}>
                    Instrumento Particular de Prestação de Serviços<br />e Instalação de Sistema de Microgeração Solar Fotovoltaica
                </h2>

                <div style={{ marginTop: 'auto', fontSize: '12pt', color: '#555' }}>
                    {data.contractCity || 'Brasília'}-DF, {formatDate(data.contractDate)}
                </div>
            </div>

            {/* === PAGE BREAK: Conteúdo começa na página 2 === */}
            <div style={{ pageBreakBefore: 'always', paddingTop: '20px' }}>
                {/* Partes */}
                <p style={{ marginBottom: '12px' }}><strong>CONTRATADA:</strong> RVGS ELÉTRICA FOTOVOLTAICA LTDA, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº 64.976.735/0001-38, representada por Sr. Ricardo Vieira Gonçalves Sousa, CPF nº 073.598.057-83.</p>
                <p style={{ marginBottom: '32px' }}><strong>CONTRATANTE:</strong> {data.client.name || '___________________'}, {data.client.cpf ? `portador(a) do CPF nº ${data.client.cpf}` : 'CPF: _______________'}, residente em {data.client.address}{data.client.neighborhood ? `, ${data.client.neighborhood}` : ''}, {data.client.city}/{data.client.state}.{data.client.zipCode ? ` CEP: ${data.client.zipCode}.` : ''}</p>

                {/* Cláusula 1 */}
                <p><strong>CLÁUSULA PRIMEIRA – DO OBJETO</strong></p>
                <p style={{ marginBottom: '4px' }}>Fornecimento e instalação de Sistema de Microgeração Solar Fotovoltaica com potência de <strong>{data.system.power || '___'} kWp</strong>.</p>
                <p style={{ marginBottom: '24px' }}><strong>Local de Instalação:</strong> {data.system.installLocation || data.client.address || '___________________'}{data.client.city ? `, ${data.client.city}/${data.client.state}` : ''}.</p>

                {/* Cláusula 2 */}
                <p><strong>CLÁUSULA SEGUNDA – DOS EQUIPAMENTOS E SERVIÇOS</strong></p>
                <p><strong>I. Equipamentos:</strong></p>
                <ul style={{ marginLeft: '24px', marginBottom: '12px' }}>
                    {data.system.modulesQty && <li>{data.system.modulesQty} módulo(s) fotovoltaico(s){data.system.modulesBrand ? ` ${data.system.modulesBrand}` : ''}{data.system.modulesModel ? ` (${data.system.modulesModel})` : ''}{data.system.modulesWatts ? ` de ${data.system.modulesWatts} W` : ''}.</li>}
                    {data.system.inverterBrand && <li>Inversor {data.system.inverterBrand}{data.system.inverterModel ? ` (${data.system.inverterModel})` : ''}{data.system.inverterPower ? ` de ${data.system.inverterPower} kW` : ''}.</li>}
                    <li>Estrutura de suporte em {data.system.structureType || 'alumínio'} ({data.system.roofType || 'laje'}), cabeamento {data.system.cableSpec || '6mm²'} e conectores MC4.</li>
                </ul>
                <p><strong>II. Serviços Inclusos:</strong></p>
                <ul style={{ marginLeft: '24px', marginBottom: '24px' }}>
                    {data.services.includes.map((s, i) => <li key={i}>{s}.</li>)}
                    {data.services.observations && <li>{data.services.observations}</li>}
                </ul>

                {/* Cláusula 3 */}
                <p><strong>CLÁUSULA TERCEIRA – DO PREÇO E CONDIÇÕES DE PAGAMENTO</strong></p>
                <p><strong>Valor Global: {formatCurrency(data.payment.totalValue)}</strong> ({currencyInWords(data.payment.totalValue)}).</p>
                <ul style={{ marginLeft: '24px', marginBottom: '12px' }}>
                    {Number(data.payment.deposit) > 0 && (
                        <li>Entrada de {formatCurrency(data.payment.deposit)}{data.payment.depositDate ? ` até ${formatDate(data.payment.depositDate)}` : ''}.</li>
                    )}
                    {Number(data.payment.installments) > 0 && Number(data.payment.installmentsValue) > 0 && (
                        <li>Saldo de {formatCurrency(Number(data.payment.totalValue) - Number(data.payment.deposit))} parcelado em {data.payment.installments}x de {formatCurrency(data.payment.installmentsValue)} no {data.payment.method}.</li>
                    )}
                </ul>
                <p style={{ marginBottom: '4px' }}><strong>Dados Bancários:</strong> {data.payment.bankName}, Ag: {data.payment.bankAgency}, CC: {data.payment.bankAccount}.</p>
                <p style={{ marginBottom: '24px' }}>PIX: {data.payment.pixKey}</p>
                {data.payment.observations && <p style={{ marginBottom: '24px' }}>{data.payment.observations}</p>}

                {/* Cláusula 4 */}
                <p><strong>CLÁUSULA QUARTA – DOS PRAZOS</strong></p>
                <p style={{ marginBottom: '24px' }}>O prazo para instalação é de {data.services.deliveryDays || '35'} (dias) corridos após o pagamento da entrada.</p>

                {/* Cláusula 5 */}
                <p><strong>CLÁUSULA QUINTA – DAS OBRIGAÇÕES DA CONTRATADA</strong></p>
                <p style={{ marginBottom: '24px' }}>A CONTRATADA se obriga a: a) fornecer os equipamentos especificados com qualidade e dentro do prazo; b) executar a instalação conforme normas técnicas ABNT NBR 5410 e NBR 16690; c) elaborar o projeto e obter a ART (Anotação de Responsabilidade Técnica); d) realizar a homologação junto à concessionária de energia.</p>

                {/* Cláusula 6 */}
                <p><strong>CLÁUSULA SEXTA – DAS OBRIGAÇÕES DO CONTRATANTE</strong></p>
                <p style={{ marginBottom: '24px' }}>O CONTRATANTE se obriga a: a) realizar os pagamentos nos prazos e formas acordadas; b) garantir acesso ao local de instalação; c) informar eventuais restrições estruturais; d) não realizar modificações no sistema sem autorização técnica prévia da CONTRATADA.</p>

                {/* Cláusula 7 */}
                <p><strong>CLÁUSULA SÉTIMA – DAS GARANTIAS</strong></p>
                <ul style={{ marginLeft: '24px', marginBottom: '24px' }}>
                    <li><strong>Instalação:</strong> 12 (doze) meses contra defeitos de instalação.</li>
                    <li><strong>Módulos Fotovoltaicos:</strong> 12 (doze) anos contra defeitos de fabricação e 25 (vinte e cinco) anos de eficiência mínima de 80%.</li>
                    <li><strong>Inversor:</strong> 10 (dez) anos conforme fabricante.</li>
                </ul>

                {/* Cláusula 8 */}
                <p><strong>CLÁUSULA OITAVA – DA RESCISÃO</strong></p>
                <p style={{ marginBottom: '24px' }}>Em caso de rescisão por qualquer das partes, sem justa causa, será devida multa de 10% (dez por cento) sobre o valor global do contrato, além do ressarcimento de custos já incorridos.</p>

                {/* Cláusula 9 */}
                <p><strong>CLÁUSULA NONA – DO FORO</strong></p>
                <p style={{ marginBottom: '32px' }}>As partes elegem o foro da Comarca de {data.contractCity || 'Brasília'}, Distrito Federal, para dirimir quaisquer controvérsias decorrentes deste contrato, com renúncia expressa a qualquer outro.</p>

                {/* Assinaturas */}
                <p style={{ textAlign: 'center', marginBottom: '40px' }}>{data.contractCity || 'Brasília'}-DF, {formatDate(data.contractDate)}.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginTop: '16px' }}>
                    <div>
                        <div style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '10pt' }}>Ricardo Vieira Gonçalves Sousa</p>
                            <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>RVGS Elétrica Fotovoltaica LTDA</p>
                            <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>CPF: 073.598.057-83</p>
                        </div>
                    </div>
                    <div>
                        <div style={{ borderTop: '1px solid #333', paddingTop: '8px' }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: '10pt' }}>{data.client.name || 'CONTRATANTE'}</p>
                            <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>Contratante</p>
                            {data.client.cpf && <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>CPF: {data.client.cpf}</p>}
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '48px', borderTop: '1px solid #ddd', paddingTop: '16px', textAlign: 'center' }}>
                    <img src={LOGO_BASE64} alt="RVGS" style={{ height: '40px', opacity: 0.3 }} />
                </div>
            </div>{/* end pageBreakBefore clauses wrapper */}
        </div>
    );


    // ─── Main Render ──────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full -m-8" style={{ background: C.bg }}>
            {/* Print-only contract */}
            {printMode === 'contract' && (
                <div className="print-only" style={{ display: 'none' }}>
                    <PrintContract />
                </div>
            )}

            {/* Header */}
            <div className="no-print text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-20" style={{ background: C.navy }}>
                <div className="flex items-center gap-3">
                    <img src={LOGO_BASE64} alt="RVGS" style={{ height: '36px', width: 'auto', filter: 'brightness(0) invert(1)' }} />
                    <div>
                        <div className="font-bold text-lg leading-none" style={{ color: C.primary }}>RVGS <span style={{ color: '#fff' }}>ELÉTRICA</span></div>
                        <div className="text-[10px] uppercase tracking-widest opacity-70">Gerador de Contrato</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-6 overflow-x-auto no-scrollbar">
                    {STEPS.map((s, i) => (
                        <button key={s.id} onClick={() => i < step ? setStep(i) : undefined} className="flex items-center gap-2 shrink-0">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i <= step ? 'text-white shadow-md' : 'bg-white/10 text-white/50 border border-white/20'}`}
                                style={i <= step ? { background: C.primary } : {}}>
                                {i < step ? '✓' : i + 1}
                            </div>
                            <span className={`text-[11px] font-bold uppercase tracking-tight hidden sm:block ${i <= step ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
                            {i < STEPS.length - 1 && <div className="hidden md:block w-6 h-px bg-white/20" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden no-print">
                {/* Form */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-2xl mx-auto pb-24">

                        {/* ── STEP 0: Cliente ── */}
                        {step === 0 && (
                            <div className="animate-fade-in space-y-6">
                                <div>
                                    <h3 className="text-3xl font-display font-bold mb-1" style={{ color: C.text }}>Dados do Cliente</h3>
                                    <p className="text-sm border-b pb-4" style={{ color: C.muted, borderColor: C.border }}>Informações pessoais do contratante</p>
                                </div>
                                <div><label className={labelCls}>Nome Completo *</label><input className={inputCls} placeholder="Ex: Ana Paula Ferreira" value={data.client.name} onChange={e => updateData('client', 'name', e.target.value)} /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div><label className={labelCls}>CPF / CNPJ *</label><input className={inputCls} placeholder="000.000.000-00" value={data.client.cpf} onChange={e => updateData('client', 'cpf', e.target.value)} /></div>
                                    <div><label className={labelCls}>Telefone / WhatsApp *</label><input className={inputCls} placeholder="(61) 99999-0000" value={data.client.phone} onChange={e => updateData('client', 'phone', e.target.value)} /></div>
                                </div>
                                <div><label className={labelCls}>E-mail</label><input className={inputCls} type="email" placeholder="email@exemplo.com" value={data.client.email} onChange={e => updateData('client', 'email', e.target.value)} /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div><label className={labelCls}>Logradouro (Rua, Nº, Compl.)</label><input className={inputCls} placeholder="Ex: SHIS QL 24, Conj 9, Lote 8" value={data.client.address} onChange={e => updateData('client', 'address', e.target.value)} /></div>
                                    <div><label className={labelCls}>Bairro / Região</label><input className={inputCls} placeholder="Ex: Lago Sul" value={data.client.neighborhood} onChange={e => updateData('client', 'neighborhood', e.target.value)} /></div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div><label className={labelCls}>CEP</label><input className={inputCls} placeholder="70000-000" value={data.client.zipCode} onChange={e => updateData('client', 'zipCode', e.target.value)} /></div>
                                    <div className="col-span-2"><label className={labelCls}>Cidade</label><input className={inputCls} placeholder="Brasília" value={data.client.city} onChange={e => updateData('client', 'city', e.target.value)} /></div>
                                    <div><label className={labelCls}>UF</label><input className={inputCls} placeholder="DF" maxLength={2} value={data.client.state} onChange={e => updateData('client', 'state', e.target.value.toUpperCase())} /></div>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 1: Sistema ── */}
                        {step === 1 && (
                            <div className="animate-fade-in space-y-6">
                                <div>
                                    <h3 className="text-3xl font-display font-bold mb-1" style={{ color: C.text }}>Sistema Fotovoltaico</h3>
                                    <p className="text-sm border-b pb-4" style={{ color: C.muted, borderColor: C.border }}>Especificações técnicas do sistema a ser instalado</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div><label className={labelCls}>Potência Total (kWp) *</label><input className={inputCls} placeholder="Ex: 30,8" value={data.system.power} onChange={e => updateData('system', 'power', e.target.value)} /></div>
                                    <div><label className={labelCls}>Local de Instalação</label><input className={inputCls} placeholder="Endereço da instalação" value={data.system.installLocation} onChange={e => updateData('system', 'installLocation', e.target.value)} /></div>
                                </div>
                                <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: C.border }}>
                                    <h4 className="font-bold text-sm" style={{ color: C.navy }}>☀️ Módulos Fotovoltaicos</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div><label className={labelCls}>Quantidade</label><input className={inputCls} type="number" placeholder="0" value={data.system.modulesQty} onChange={e => updateData('system', 'modulesQty', e.target.value)} /></div>
                                        <div><label className={labelCls}>Potência (W)</label><input className={inputCls} type="number" placeholder="700" value={data.system.modulesWatts} onChange={e => updateData('system', 'modulesWatts', e.target.value)} /></div>
                                        <div><label className={labelCls}>Marca</label><input className={inputCls} placeholder="Ex: JA Solar" value={data.system.modulesBrand} onChange={e => updateData('system', 'modulesBrand', e.target.value)} /></div>
                                        <div><label className={labelCls}>Modelo</label><input className={inputCls} placeholder="Ex: JAM72S30" value={data.system.modulesModel} onChange={e => updateData('system', 'modulesModel', e.target.value)} /></div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: C.border }}>
                                    <h4 className="font-bold text-sm" style={{ color: C.navy }}>⚡ Inversor</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className={labelCls}>Marca</label><input className={inputCls} placeholder="Ex: DEYE" value={data.system.inverterBrand} onChange={e => updateData('system', 'inverterBrand', e.target.value)} /></div>
                                        <div><label className={labelCls}>Modelo</label><input className={inputCls} placeholder="Ex: SUN-25K-G05" value={data.system.inverterModel} onChange={e => updateData('system', 'inverterModel', e.target.value)} /></div>
                                        <div><label className={labelCls}>Potência (kW)</label><input className={inputCls} placeholder="Ex: 25" value={data.system.inverterPower} onChange={e => updateData('system', 'inverterPower', e.target.value)} /></div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: C.border }}>
                                    <h4 className="font-bold text-sm" style={{ color: C.navy }}>🔩 Estrutura e Cabeamento</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className={labelCls}>Tipo de Estrutura</label>
                                            <select className={inputCls} value={data.system.structureType} onChange={e => updateData('system', 'structureType', e.target.value)}>
                                                <option>Alumínio</option><option>Metálica</option><option>Cerâmica</option>
                                            </select>
                                        </div>
                                        <div><label className={labelCls}>Tipo de Telhado</label>
                                            <select className={inputCls} value={data.system.roofType} onChange={e => updateData('system', 'roofType', e.target.value)}>
                                                <option>Laje</option><option>Telha cerâmica</option><option>Telha metálica</option><option>Fibrocimento</option>
                                            </select>
                                        </div>
                                        <div><label className={labelCls}>Especificação do Cabo</label><input className={inputCls} placeholder="6mm²" value={data.system.cableSpec} onChange={e => updateData('system', 'cableSpec', e.target.value)} /></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── STEP 2: Serviços ── */}
                        {step === 2 && (
                            <div className="animate-fade-in space-y-6">
                                <div>
                                    <h3 className="text-3xl font-display font-bold mb-1" style={{ color: C.text }}>Serviços Inclusos</h3>
                                    <p className="text-sm border-b pb-4" style={{ color: C.muted, borderColor: C.border }}>Selecione os serviços incluídos no contrato</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {SERVICES_OPTIONS.map(item => (
                                        <button key={item} onClick={() => toggleService(item)}
                                            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all font-medium text-sm ${data.services.includes.includes(item) ? 'border-[#F5A000] bg-[#FFF8EC] text-[#1A2340]' : 'border-[#D0DCF0] bg-white text-[#5A6A8A] hover:border-[#F5A000]/40'}`}>
                                            <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${data.services.includes.includes(item) ? 'bg-[#F5A000]' : 'border border-[#D0DCF0] bg-white'}`}>
                                                {data.services.includes.includes(item) && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                            </div>
                                            {item}
                                        </button>
                                    ))}
                                </div>
                                <div><label className={labelCls}>Prazo de Conclusão (dias corridos após entrada)</label>
                                    <input className={inputCls} type="number" placeholder="35" value={data.services.deliveryDays} onChange={e => updateData('services', 'deliveryDays', e.target.value)} />
                                </div>
                                <div><label className={labelCls}>Observações adicionais</label>
                                    <textarea className={`${inputCls} h-24 resize-none`} placeholder="Itens específicos não listados acima..." value={data.services.observations} onChange={e => updateData('services', 'observations', e.target.value)} />
                                </div>
                            </div>
                        )}

                        {/* ── STEP 3: Pagamento ── */}
                        {step === 3 && (
                            <div className="animate-fade-in space-y-6">
                                <div>
                                    <h3 className="text-3xl font-display font-bold mb-1" style={{ color: C.text }}>Valores e Pagamento</h3>
                                    <p className="text-sm border-b pb-4" style={{ color: C.muted, borderColor: C.border }}>Defina os valores e condições de pagamento</p>
                                </div>

                                {/* Orçamento meta */}
                                <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: C.border }}>
                                    <h4 className="font-bold text-sm" style={{ color: C.navy }}>📄 Dados do Orçamento</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className={labelCls}>Nº do Orçamento</label><input className={inputCls} placeholder="ORC-2026-001" value={data.quote?.number || ''} onChange={e => setData(p => ({ ...p, quote: { ...p.quote, number: e.target.value } }))} /></div>
                                        <div><label className={labelCls}>Data de Emissão</label><input className={inputCls} type="date" value={data.quote?.date || data.contractDate} onChange={e => setData(p => ({ ...p, quote: { ...p.quote, date: e.target.value } }))} /></div>
                                        <div><label className={labelCls}>Validade (dias)</label><input className={inputCls} type="number" placeholder="15" value={data.quote?.validityDays || 15} onChange={e => setData(p => ({ ...p, quote: { ...p.quote, validityDays: e.target.value } }))} /></div>
                                    </div>
                                </div>

                                {/* Equipamentos do orçamento */}
                                <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: C.border }}>
                                    <h4 className="font-bold text-sm" style={{ color: C.navy }}>🔧 Equipamentos (itens do orçamento)</h4>
                                    {(data.quote?.equipmentItems || []).map((item, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-2 items-end border-b pb-3" style={{ borderColor: C.border }}>
                                            <div className="col-span-5"><label className={labelCls}>Descrição</label><input className={inputCls} value={item.description} onChange={e => { const arr = [...(data.quote.equipmentItems)]; arr[i] = { ...arr[i], description: e.target.value }; setData(p => ({ ...p, quote: { ...p.quote, equipmentItems: arr } })); }} /></div>
                                            <div className="col-span-2"><label className={labelCls}>Qtd</label><input className={inputCls} type="number" value={item.qty} onChange={e => { const arr = [...(data.quote.equipmentItems)]; arr[i] = { ...arr[i], qty: e.target.value }; setData(p => ({ ...p, quote: { ...p.quote, equipmentItems: arr } })); }} /></div>
                                            <div className="col-span-2"><label className={labelCls}>Unid.</label><input className={inputCls} placeholder="un" value={item.unit} onChange={e => { const arr = [...(data.quote.equipmentItems)]; arr[i] = { ...arr[i], unit: e.target.value }; setData(p => ({ ...p, quote: { ...p.quote, equipmentItems: arr } })); }} /></div>
                                            <div className="col-span-2"><label className={labelCls}>Valor Unit. (R$)</label><input className={inputCls} placeholder="0.00" value={item.unitValue} onChange={e => { const arr = [...(data.quote.equipmentItems)]; arr[i] = { ...arr[i], unitValue: e.target.value }; setData(p => ({ ...p, quote: { ...p.quote, equipmentItems: arr } })); }} /></div>
                                            <div className="col-span-1"><button onClick={() => { const arr = data.quote.equipmentItems.filter((_, j) => j !== i); setData(p => ({ ...p, quote: { ...p.quote, equipmentItems: arr } })); }} className="w-full h-10 rounded-xl text-red-400 border border-red-200 hover:bg-red-50 text-sm">✕</button></div>
                                        </div>
                                    ))}
                                    <button onClick={() => setData(p => ({ ...p, quote: { ...p.quote, equipmentItems: [...p.quote.equipmentItems, { description: '', qty: 1, unit: 'un', unitValue: '' }] } }))} className="text-sm font-bold px-4 py-2 rounded-xl border" style={{ color: C.navy, borderColor: C.border }}>+ Adicionar Equipamento</button>
                                </div>

                                {/* Serviços do orçamento */}
                                <div className="bg-white rounded-2xl border p-5 space-y-3" style={{ borderColor: C.border }}>
                                    <h4 className="font-bold text-sm" style={{ color: C.navy }}>🛠️ Serviços (itens do orçamento)</h4>
                                    {(data.quote?.serviceItems || []).map((item, i) => (
                                        <div key={i} className="grid grid-cols-12 gap-2 items-end border-b pb-3" style={{ borderColor: C.border }}>
                                            <div className="col-span-5"><label className={labelCls}>Descrição</label><input className={inputCls} value={item.description} onChange={e => { const arr = [...(data.quote.serviceItems)]; arr[i] = { ...arr[i], description: e.target.value }; setData(p => ({ ...p, quote: { ...p.quote, serviceItems: arr } })); }} /></div>
                                            <div className="col-span-2"><label className={labelCls}>Qtd</label><input className={inputCls} type="number" value={item.qty} onChange={e => { const arr = [...(data.quote.serviceItems)]; arr[i] = { ...arr[i], qty: e.target.value }; setData(p => ({ ...p, quote: { ...p.quote, serviceItems: arr } })); }} /></div>
                                            <div className="col-span-2"><label className={labelCls}>Unid.</label><input className={inputCls} placeholder="sv" value={item.unit} onChange={e => { const arr = [...(data.quote.serviceItems)]; arr[i] = { ...arr[i], unit: e.target.value }; setData(p => ({ ...p, quote: { ...p.quote, serviceItems: arr } })); }} /></div>
                                            <div className="col-span-2"><label className={labelCls}>Valor (R$ ou "Incluso")</label><input className={inputCls} placeholder="Incluso" value={item.unitValue} onChange={e => { const arr = [...(data.quote.serviceItems)]; arr[i] = { ...arr[i], unitValue: e.target.value }; setData(p => ({ ...p, quote: { ...p.quote, serviceItems: arr } })); }} /></div>
                                            <div className="col-span-1"><button onClick={() => { const arr = data.quote.serviceItems.filter((_, j) => j !== i); setData(p => ({ ...p, quote: { ...p.quote, serviceItems: arr } })); }} className="w-full h-10 rounded-xl text-red-400 border border-red-200 hover:bg-red-50 text-sm">✕</button></div>
                                        </div>
                                    ))}
                                    <button onClick={() => setData(p => ({ ...p, quote: { ...p.quote, serviceItems: [...p.quote.serviceItems, { description: '', qty: 1, unit: 'sv', unitValue: 'Incluso' }] } }))} className="text-sm font-bold px-4 py-2 rounded-xl border" style={{ color: C.navy, borderColor: C.border }}>+ Adicionar Serviço</button>
                                </div>

                                <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: C.border }}>
                                    <h4 className="font-bold text-sm" style={{ color: C.navy }}>💰 Valores Totais</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div><label className={labelCls}>Valor Total do Contrato (R$) *</label><input className={`${inputCls} font-bold text-lg`} type="number" step="0.01" placeholder="45859.00" value={data.payment.totalValue} onChange={e => {
                                            updateData('payment', 'totalValue', e.target.value);
                                            autoCalcInstallment(e.target.value, data.payment.deposit, data.payment.installments);
                                        }} /></div>
                                        <div><label className={labelCls}>Valor da Entrada (R$) *</label><input className={inputCls} type="number" step="0.01" value={data.payment.deposit} onChange={e => {
                                            updateData('payment', 'deposit', e.target.value);
                                            autoCalcInstallment(data.payment.totalValue, e.target.value, data.payment.installments);
                                        }} /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className={labelCls}>Data da Entrada</label><input className={inputCls} type="date" value={data.payment.depositDate} onChange={e => updateData('payment', 'depositDate', e.target.value)} /></div>
                                        <div><label className={labelCls}>Parcelamento (x)</label><input className={inputCls} type="number" placeholder="4" value={data.payment.installments} onChange={e => {
                                            updateData('payment', 'installments', e.target.value);
                                            autoCalcInstallment(data.payment.totalValue, data.payment.deposit, e.target.value);
                                        }} /></div>
                                        <div><label className={labelCls}>Valor p/ Parcela (R$) <span style={{ color: '#22C55E', fontSize: '10px' }}>• auto</span></label><input className={`${inputCls} bg-green-50`} type="number" step="0.01" placeholder="calculado auto" value={data.payment.installmentsValue} onChange={e => updateData('payment', 'installmentsValue', e.target.value)} /></div>
                                    </div>
                                    {Number(data.payment.totalValue) > 0 && (
                                        <div className="p-3 rounded-xl text-sm font-bold" style={{ background: '#F0F8FF', color: C.navy }}>
                                            Saldo a parcelar: {formatCurrency(Number(data.payment.totalValue) - Number(data.payment.deposit || 0))}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: C.border }}>
                                    <h4 className="font-bold text-sm" style={{ color: C.navy }}>🏦 Forma de Pagamento e Dados Bancários</h4>
                                    <div><label className={labelCls}>Método de Pagamento</label><input className={inputCls} placeholder="Ex: PIX + Cartão de Crédito" value={data.payment.method} onChange={e => updateData('payment', 'method', e.target.value)} /></div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><label className={labelCls}>Banco</label><input className={inputCls} placeholder="C6 Bank (336)" value={data.payment.bankName} onChange={e => updateData('payment', 'bankName', e.target.value)} /></div>
                                        <div><label className={labelCls}>Agência</label><input className={inputCls} placeholder="0001" value={data.payment.bankAgency} onChange={e => updateData('payment', 'bankAgency', e.target.value)} /></div>
                                        <div><label className={labelCls}>Conta Corrente</label><input className={inputCls} placeholder="41336974-9" value={data.payment.bankAccount} onChange={e => updateData('payment', 'bankAccount', e.target.value)} /></div>
                                    </div>
                                    <div><label className={labelCls}>Chave PIX</label><input className={inputCls} placeholder="64.976.735/0001-38 (CNPJ)" value={data.payment.pixKey} onChange={e => updateData('payment', 'pixKey', e.target.value)} /></div>
                                </div>
                                <div className="bg-white rounded-2xl border p-5 space-y-4" style={{ borderColor: C.border }}>
                                    <h4 className="font-bold text-sm" style={{ color: C.navy }}>📅 Data e Local do Contrato</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div><label className={labelCls}>Data do Contrato</label><input className={inputCls} type="date" value={data.contractDate} onChange={e => setData(p => ({ ...p, contractDate: e.target.value }))} /></div>
                                        <div><label className={labelCls}>Cidade</label><input className={inputCls} placeholder="Brasília" value={data.contractCity} onChange={e => setData(p => ({ ...p, contractCity: e.target.value }))} /></div>
                                    </div>
                                </div>
                                <div><label className={labelCls}>Observações do Pagamento</label><textarea className={`${inputCls} h-20 resize-none`} placeholder="Condições especiais, negociações..." value={data.payment.observations} onChange={e => updateData('payment', 'observations', e.target.value)} /></div>
                            </div>
                        )}

                        {/* ── STEP 4: Revisão ── */}
                        {step === 4 && (
                            <div className="animate-fade-in space-y-4">
                                <div>
                                    <h3 className="text-3xl font-display font-bold mb-1" style={{ color: C.text }}>Revisão do Contrato</h3>
                                    <p className="text-sm border-b pb-4" style={{ color: C.muted, borderColor: C.border }}>Confira os dados antes de salvar e imprimir</p>
                                </div>
                                {/* Summary cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { title: '👤 Cliente', rows: [['Nome', data.client.name], ['CPF', data.client.cpf], ['Telefone', data.client.phone], ['Endereço', `${data.client.address}, ${data.client.city}/${data.client.state}`]] },
                                        { title: '⚡ Sistema', rows: [['Potência', `${data.system.power} kWp`], ['Módulos', `${data.system.modulesQty}x ${data.system.modulesBrand} ${data.system.modulesWatts}W`], ['Inversor', `${data.system.inverterBrand} ${data.system.inverterPower}kW`], ['Estrutura', `${data.system.structureType} em ${data.system.roofType}`]] },
                                        { title: '🛠️ Serviços', rows: data.services.includes.slice(0, 4).map(s => ['✓', s]) },
                                        { title: '💰 Pagamento', rows: [['Total', formatCurrency(data.payment.totalValue)], ['Entrada', formatCurrency(data.payment.deposit)], ['Parcelamento', `${data.payment.installments}x de ${formatCurrency(data.payment.installmentsValue)}`], ['Prazo', `${data.services.deliveryDays} dias`]] },
                                    ].map(card => (
                                        <div key={card.title} className="bg-white rounded-2xl border p-5" style={{ borderColor: C.border }}>
                                            <h4 className="font-bold text-sm mb-3" style={{ color: C.navy }}>{card.title}</h4>
                                            {card.rows.map(([k, v]) => (
                                                <div key={k} className="flex text-sm mb-1">
                                                    <span className="text-xs font-bold uppercase w-32 shrink-0" style={{ color: C.muted }}>{k}</span>
                                                    <span style={{ color: C.text }}>{v || '—'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white rounded-2xl border overflow-hidden mt-4" style={{ borderColor: C.border }}>
                                    <div className="p-4 flex justify-between items-center" style={{ background: '#F0F4FA' }}>
                                        <span className="font-bold text-sm" style={{ color: C.navy }}>📄 Prévia do Contrato</span>
                                        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold" style={{ background: C.navy }}>
                                            <span className="material-symbols-outlined text-sm">print</span>Imprimir
                                        </button>
                                    </div>
                                    <div className="p-4 max-h-[500px] overflow-y-auto" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
                                        <PrintContract />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Nav */}
                <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4 flex justify-between items-center shadow-lg z-10" style={{ borderColor: C.border }}>
                    <button onClick={() => navigate('/admin/contratos')} className="px-4 py-2 text-sm font-bold rounded-xl border transition-all" style={{ color: C.muted, borderColor: C.border }}>
                        ← Voltar à Lista
                    </button>
                    <div className="flex gap-3">
                        {step > 0 && (
                            <button onClick={() => setStep(s => s - 1)} className="px-5 py-2 text-sm font-bold rounded-xl border transition-all" style={{ color: C.muted, borderColor: C.border }}>
                                Anterior
                            </button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <button onClick={() => setStep(s => s + 1)} className="px-6 py-2 text-sm font-bold rounded-xl text-white shadow-sm transition-all" style={{ background: C.primary }}>
                                Próximo →
                            </button>
                        ) : (
                            <>
                                <button onClick={handlePrintQuote} className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-xl text-white shadow-sm transition-all" style={{ background: C.primary }}>
                                    <span className="material-symbols-outlined text-sm">request_quote</span>
                                    Gerar Orçamento
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 text-sm font-bold rounded-xl text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-2" style={{ background: '#16A34A' }}>
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    {isSaving ? 'Salvando...' : 'Salvar Contrato'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Print-only quote */}
            {printMode === 'quote' && (
                <div className="print-only" style={{ display: 'none' }}><PrintQuote /></div>
            )}

            {/* Print styles */}
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white; margin: 0; }
                }
            `}</style>
        </div>
    );
};

export default ContractGenerator;

