import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Lead {
    id: string;
    name: string;
    phone: string;
    city: string;
    address: string;
    property_type: string;
    bill_value: number;
    avg_consumption: number;
    roof_type: string;
    estimated_kwp: number;
    quote_value: number;
    source: string;
    status: 'Novo' | 'Em Visita' | 'Proposta Enviada' | 'Fechado' | 'Perdido';
    notes: string;
    created_at: string;
}

const STATUS_OPTIONS = ['Novo', 'Em Visita', 'Proposta Enviada', 'Fechado', 'Perdido'] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    'Novo': { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' },
    'Em Visita': { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
    'Proposta Enviada': { bg: '#FEFCE8', text: '#854D0E', dot: '#EAB308' },
    'Fechado': { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
    'Perdido': { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
};

const SOURCE_OPTIONS = ['Site', 'WhatsApp', 'Indicação', 'Instagram', 'Facebook', 'Visita Presencial', 'Outro'];
const PROPERTY_TYPES = ['Residencial', 'Comercial', 'Rural', 'Industrial'];
const ROOF_TYPES = ['Cerâmica', 'Metálico', 'Laje', 'Solo (ground mount)', 'Fibrocimento'];

const WHATSAPP = '5561993801434';

const emptyLead: Partial<Lead> = {
    name: '', phone: '', city: '', address: '',
    property_type: 'Residencial', bill_value: 0, avg_consumption: 0,
    roof_type: 'Cerâmica', estimated_kwp: 0, quote_value: 0,
    source: 'WhatsApp', status: 'Novo', notes: '',
};

const AdminLeads: React.FC = () => {
    const navigate = useNavigate();
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Partial<Lead> | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
            if (filterStatus !== 'Todos') query = query.eq('status', filterStatus);
            const { data, error } = await query;
            if (error) throw error;
            setLeads(data || []);
        } catch (err) {
            console.error('Erro ao buscar leads:', err);
        } finally {
            setLoading(false);
        }
    };

    const quickChangeStatus = async (leadId: string, newStatus: string) => {
        setStatusDropdownId(null);
        try {
            const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
            if (error) throw error;
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as Lead['status'] } : l));
        } catch (err: any) {
            alert(`Erro ao atualizar status: ${err.message}`);
        }
    };

    useEffect(() => { fetchLeads(); }, [filterStatus]);

    const filtered = leads.filter(l =>
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.phone?.includes(search) ||
        l.city?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLead) return;
        setSaving(true);
        try {
            const payload = {
                name: selectedLead.name,
                phone: selectedLead.phone,
                city: selectedLead.city || '',
                address: selectedLead.address || '',
                property_type: selectedLead.property_type || 'Residencial',
                bill_value: selectedLead.bill_value || 0,
                avg_consumption: selectedLead.avg_consumption || 0,
                roof_type: selectedLead.roof_type || 'Cerâmica',
                estimated_kwp: selectedLead.estimated_kwp || 0,
                quote_value: selectedLead.quote_value || 0,
                source: selectedLead.source || 'WhatsApp',
                status: selectedLead.status || 'Novo',
                notes: selectedLead.notes || '',
            };
            if (selectedLead.id) {
                const { error } = await supabase.from('leads').update(payload).eq('id', selectedLead.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('leads').insert([payload]);
                if (error) throw error;
            }
            setShowModal(false);
            fetchLeads();
        } catch (err: any) {
            alert(`Erro ao salvar: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const openWhatsApp = (lead: Lead) => {
        const phone = lead.phone.replace(/\D/g, '');
        const num = phone.length === 11 ? `55${phone}` : phone.startsWith('55') ? phone : `55${phone}`;
        const msg = encodeURIComponent(
            `Olá ${lead.name}! Aqui é da RVGS Elétrica. ` +
            `Recebi sua solicitação de orçamento para energia solar e gostaria de apresentar nosso estudo personalizado para seu imóvel em ${lead.city || 'sua cidade'}.`
        );
        window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
    };

    const handleGenerateQuote = (lead: Lead) => {
        // Navigate to ContractGenerator with lead data pre-filled for quote generation
        navigate('/admin/contratos', {
            state: {
                mode: 'quote',
                lead: {
                    name: lead.name,
                    phone: lead.phone,
                    city: lead.city,
                    property_type: lead.property_type,
                    bill_value: lead.bill_value,
                    estimated_kwp: lead.estimated_kwp,
                    quote_value: lead.quote_value,
                    roof_type: lead.roof_type,
                }
            }
        });
    };

    const handleGenerateContract = (lead: Lead) => {
        navigate('/admin/contratos', {
            state: {
                mode: 'contract',
                lead: {
                    name: lead.name,
                    phone: lead.phone,
                    city: lead.city,
                    property_type: lead.property_type,
                    quote_value: lead.quote_value,
                    lead_id: lead.id,
                }
            }
        });
    };

    const formatCurrency = (v?: number) =>
        v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';

    const formatDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-text-main">Orçamentos</h1>
                    <p className="text-sm text-text-muted">Pipeline de prospecção solar — leads e propostas.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-56">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">search</span>
                        <input
                            type="text"
                            placeholder="Buscar lead..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-primary/10 focus:border-primary outline-none text-sm bg-white shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => { setSelectedLead({ ...emptyLead }); setShowModal(true); }}
                        className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-primary-dark transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Novo Orçamento
                    </button>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-secondary/10 overflow-x-auto gap-1">
                {['Todos', ...STATUS_OPTIONS].map(status => {
                    const count = status === 'Todos' ? leads.length : leads.filter(l => l.status === status).length;
                    const sc = STATUS_COLORS[status];
                    return (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${filterStatus === status ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-surface-soft hover:text-primary'}`}
                        >
                            {sc && (
                                <span style={{
                                    width: '7px', height: '7px', borderRadius: '50%',
                                    background: filterStatus === status ? '#fff' : sc.dot,
                                    display: 'inline-block', flexShrink: 0,
                                }} />
                            )}
                            {status}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filterStatus === status ? 'bg-white/20 text-white' : 'bg-surface-soft text-text-muted'}`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-secondary bg-surface-soft uppercase tracking-wider">
                                <th className="px-4 py-3 font-bold border-b border-primary/10">Cliente</th>
                                <th className="px-4 py-3 font-bold border-b border-primary/10">Dados Técnicos</th>
                                <th className="px-4 py-3 font-bold border-b border-primary/10">Valor</th>
                                <th className="px-4 py-3 font-bold border-b border-primary/10">Status</th>
                                <th className="px-4 py-3 font-bold border-b border-primary/10 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-text-muted divide-y divide-primary/5">
                            {loading ? (
                                <tr><td colSpan={5} className="px-4 py-10 text-center">
                                    <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-14 text-center">
                                    <div className="flex flex-col items-center gap-2 text-text-muted">
                                        <span className="material-symbols-outlined text-4xl opacity-30">receipt_long</span>
                                        <p>Nenhum orçamento encontrado.</p>
                                    </div>
                                </td></tr>
                            ) : (
                                filtered.map(lead => {
                                    const sc = STATUS_COLORS[lead.status] || STATUS_COLORS['Novo'];
                                    return (
                                        <tr key={lead.id} className="hover:bg-surface-cream transition-colors group">
                                            {/* Cliente col — name, phone, city, property, roof */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-text-main text-sm">{lead.name}</span>
                                                    <span className="text-xs text-text-muted flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[11px]">call</span>
                                                        {lead.phone}
                                                    </span>
                                                    {(lead.city || lead.property_type) && (
                                                        <span className="text-[11px] text-secondary/70 mt-0.5">
                                                            {[lead.city, lead.property_type, lead.roof_type].filter(Boolean).join(' · ')}
                                                        </span>
                                                    )}
                                                    {lead.source && (
                                                        <span className="text-[10px] text-primary/60">📥 {lead.source}</span>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Dados técnicos — bill, kwp */}
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    {lead.bill_value > 0 && <span className="text-xs font-bold text-red-500">💡 R$ {lead.bill_value}/mês</span>}
                                                    {lead.avg_consumption > 0 && <span className="text-xs text-text-muted">{lead.avg_consumption} kWh/mês</span>}
                                                    {lead.estimated_kwp > 0 && <span className="text-xs text-primary font-bold">⚡ {lead.estimated_kwp} kWp</span>}
                                                </div>
                                            </td>
                                            {/* Valor orçado */}
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-text-main text-sm">{formatCurrency(lead.quote_value)}</span>
                                            </td>
                                            {/* Status — native select */}
                                            <td className="px-4 py-3">
                                                <select
                                                    value={lead.status}
                                                    onChange={e => quickChangeStatus(lead.id, e.target.value)}
                                                    className="text-xs font-bold rounded-full px-2.5 py-1 border-0 outline-none cursor-pointer appearance-none pr-5 bg-no-repeat"
                                                    style={{
                                                        background: `${sc.bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%236b7280'/%3E%3C/svg%3E") no-repeat right 8px center`,
                                                        color: sc.text,
                                                        paddingRight: '24px',
                                                    }}
                                                    title="Mudar status"
                                                >
                                                    {STATUS_OPTIONS.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* WhatsApp */}
                                                    <button
                                                        onClick={() => openWhatsApp(lead)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Abrir WhatsApp"
                                                    >
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                                    </button>
                                                    {/* Gerar Orçamento PDF */}
                                                    <button
                                                        onClick={() => handleGenerateQuote(lead)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Gerar Orçamento PDF"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                                                    </button>
                                                    {/* Gerar Contrato (só se Fechado) */}
                                                    {lead.status === 'Fechado' && (
                                                        <button
                                                            onClick={() => handleGenerateContract(lead)}
                                                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                            title="Gerar Contrato"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">contract</span>
                                                        </button>
                                                    )}
                                                    {/* Editar */}
                                                    <button
                                                        onClick={() => { setSelectedLead(lead); setShowModal(true); }}
                                                        className="p-1.5 text-secondary hover:text-primary hover:bg-surface-soft rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">edit</span>
                                                    </button>
                                                    {/* Excluir */}
                                                    <button
                                                        onClick={() => setConfirmDeleteId(lead.id)}
                                                        disabled={deletingId === lead.id}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">
                                                            {deletingId === lead.id ? 'hourglass_empty' : 'delete'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-primary/10 p-4 flex justify-between items-center text-sm text-text-muted bg-surface-cream">
                    <span>Mostrando {filtered.length} de {leads.length} registros</span>
                </div>
            </div>

            {/* ── Edit / Create Modal ── */}
            {showModal && selectedLead && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-surface-cream shrink-0">
                            <h3 className="font-display text-xl font-bold text-text-main">
                                {selectedLead.id ? 'Editar Orçamento' : 'Novo Orçamento'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-primary">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                            {/* Dados pessoais */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Nome *</label>
                                    <input required type="text" value={selectedLead.name || ''} onChange={e => setSelectedLead({ ...selectedLead, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">WhatsApp *</label>
                                    <input required type="tel" value={selectedLead.phone || ''} onChange={e => setSelectedLead({ ...selectedLead, phone: e.target.value })}
                                        placeholder="(61) 9 9999-9999"
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Cidade / Bairro</label>
                                    <input type="text" value={selectedLead.city || ''} onChange={e => setSelectedLead({ ...selectedLead, city: e.target.value })}
                                        placeholder="Ex: Brasília, Gama, Taguatinga..."
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Origem</label>
                                    <select value={selectedLead.source || 'WhatsApp'} onChange={e => setSelectedLead({ ...selectedLead, source: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm bg-white">
                                        {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Dados técnicos */}
                            <div className="pt-3 border-t border-primary/5">
                                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">⚡ Dados Técnicos</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Tipo de Imóvel</label>
                                        <select value={selectedLead.property_type || 'Residencial'} onChange={e => setSelectedLead({ ...selectedLead, property_type: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm bg-white">
                                            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Tipo de Telhado</label>
                                        <select value={selectedLead.roof_type || 'Cerâmica'} onChange={e => setSelectedLead({ ...selectedLead, roof_type: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm bg-white">
                                            {ROOF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Valor médio conta (R$/mês)</label>
                                        <input type="number" step="0.01" min="0" value={selectedLead.bill_value || ''} onChange={e => setSelectedLead({ ...selectedLead, bill_value: parseFloat(e.target.value) || 0 })}
                                            placeholder="Ex: 350"
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Consumo médio (kWh/mês)</label>
                                        <input type="number" step="1" min="0" value={selectedLead.avg_consumption || ''} onChange={e => setSelectedLead({ ...selectedLead, avg_consumption: parseFloat(e.target.value) || 0 })}
                                            placeholder="Ex: 400"
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Potência estimada (kWp)</label>
                                        <input type="number" step="0.01" min="0" value={selectedLead.estimated_kwp || ''} onChange={e => setSelectedLead({ ...selectedLead, estimated_kwp: parseFloat(e.target.value) || 0 })}
                                            placeholder="Ex: 5.5"
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Valor do orçamento (R$)</label>
                                        <input type="number" step="0.01" min="0" value={selectedLead.quote_value || ''} onChange={e => setSelectedLead({ ...selectedLead, quote_value: parseFloat(e.target.value) || 0 })}
                                            placeholder="Ex: 25000"
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="pt-3 border-t border-primary/5">
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Status do Pipeline</label>
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTIONS.map(s => {
                                        const sc = STATUS_COLORS[s];
                                        const active = selectedLead.status === s;
                                        return (
                                            <button key={s} type="button"
                                                onClick={() => setSelectedLead({ ...selectedLead, status: s as any })}
                                                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                                                style={{
                                                    background: active ? sc.bg : 'transparent',
                                                    color: active ? sc.text : '#9ca3af',
                                                    borderColor: active ? sc.dot : '#e5e7eb',
                                                }}
                                            >
                                                <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: active ? sc.dot : '#d1d5db', marginRight: '6px' }} />
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Observações</label>
                                <textarea rows={3} value={selectedLead.notes || ''} onChange={e => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                                    placeholder="Detalhes da visita, preferências do cliente, próximos passos..."
                                    className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm resize-none" />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-text-muted hover:bg-surface-soft rounded-lg font-medium text-sm">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-dark disabled:opacity-70 text-sm">
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-red-500">delete_forever</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Excluir Orçamento</h3>
                                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Tem certeza que deseja excluir o orçamento de <strong>{leads.find(l => l.id === confirmDeleteId)?.name}</strong>?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setConfirmDeleteId(null)}
                                className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    const id = confirmDeleteId;
                                    setConfirmDeleteId(null);
                                    setDeletingId(id);
                                    try {
                                        const { error } = await supabase.from('leads').delete().eq('id', id);
                                        if (error) alert(`Erro ao excluir: ${error.message}`);
                                        else fetchLeads();
                                    } catch (err: any) {
                                        alert(`Erro: ${err.message}`);
                                    } finally {
                                        setDeletingId(null);
                                    }
                                }}
                                className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">delete</span>
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLeads;
