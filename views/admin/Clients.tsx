import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Client {
    id: string;
    lead_id?: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    system_kwp: number;
    panels_qty: number;
    inverter_model: string;
    install_date?: string;
    contract_value: number;
    install_status: 'Aguardando' | 'Em andamento' | 'Concluída';
    contract_ref: string;
    warranty_until?: string;
    next_maintenance?: string;
    notes: string;
    created_at: string;
}

const INSTALL_STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    'Aguardando': { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
    'Em andamento': { bg: '#FEFCE8', text: '#854D0E', dot: '#EAB308' },
    'Concluída': { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
};

const emptyClient: Partial<Client> = {
    name: '', phone: '', address: '', city: '',
    system_kwp: 0, panels_qty: 0, inverter_model: '',
    contract_value: 0, install_status: 'Aguardando',
    contract_ref: '', notes: '',
};

const AdminClients: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Partial<Client> | null>(null);
    const [saving, setSaving] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState('Todos');

    const fetchClients = async () => {
        setLoading(true);
        try {
            let query = supabase.from('clients').select('*').order('created_at', { ascending: false });
            if (filterStatus !== 'Todos') query = query.eq('install_status', filterStatus);
            const { data, error } = await query;
            if (error) {
                // Table might not exist yet
                if (error.message?.includes('does not exist') || error.code === '42P01') {
                    console.warn('Tabela clients não existe. Execute o script solar_v2.sql no Supabase.');
                    setClients([]);
                    return;
                }
                throw error;
            }
            setClients(data || []);
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchClients(); }, [filterStatus]);

    const filtered = clients.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.city?.toLowerCase().includes(search.toLowerCase())
    );

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;
        setSaving(true);
        try {
            const payload = {
                name: selectedClient.name,
                phone: selectedClient.phone || '',
                address: selectedClient.address || '',
                city: selectedClient.city || '',
                system_kwp: selectedClient.system_kwp || 0,
                panels_qty: selectedClient.panels_qty || 0,
                inverter_model: selectedClient.inverter_model || '',
                install_date: selectedClient.install_date || null,
                contract_value: selectedClient.contract_value || 0,
                install_status: selectedClient.install_status || 'Aguardando',
                contract_ref: selectedClient.contract_ref || '',
                warranty_until: selectedClient.warranty_until || null,
                next_maintenance: selectedClient.next_maintenance || null,
                notes: selectedClient.notes || '',
            };
            if (selectedClient.id) {
                const { error } = await supabase.from('clients').update(payload).eq('id', selectedClient.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('clients').insert([payload]);
                if (error) throw error;
            }
            setShowModal(false);
            fetchClients();
        } catch (err: any) {
            alert(`Erro ao salvar: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const openWhatsApp = (client: Client) => {
        const phone = client.phone.replace(/\D/g, '');
        const num = phone.startsWith('55') ? phone : `55${phone}`;
        const msg = encodeURIComponent(`Olá ${client.name}! Aqui é da RVGS Elétrica. Como está seu sistema solar?`);
        window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
    };

    const isMaintenanceSoon = (date?: string) => {
        if (!date) return false;
        const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
    };

    const isMaintenanceOverdue = (date?: string) => {
        if (!date) return false;
        return new Date(date).getTime() < Date.now();
    };

    const formatDate = (s?: string) => s ? new Date(s + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
    const formatCurrency = (v?: number) => v ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';

    const statusCounts = {
        'Aguardando': clients.filter(c => c.install_status === 'Aguardando').length,
        'Em andamento': clients.filter(c => c.install_status === 'Em andamento').length,
        'Concluída': clients.filter(c => c.install_status === 'Concluída').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-text-main">Clientes</h1>
                    <p className="text-sm text-text-muted">Clientes com sistemas instalados ou em andamento.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-56">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">search</span>
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-primary/10 focus:border-primary outline-none text-sm bg-white shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => { setSelectedClient({ ...emptyClient }); setShowModal(true); }}
                        className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-primary-dark transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Novo Cliente
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                {Object.entries(statusCounts).map(([status, count]) => {
                    const sc = INSTALL_STATUS_COLORS[status];
                    return (
                        <div key={status} className="bg-white rounded-xl p-4 border border-secondary/10 shadow-sm flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: sc.bg }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-text-main">{count}</div>
                                <div className="text-xs text-text-muted">{status}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Status Filter */}
            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-secondary/10 overflow-x-auto gap-1">
                {['Todos', 'Aguardando', 'Em andamento', 'Concluída'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filterStatus === s ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-surface-soft hover:text-primary'}`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs text-secondary bg-surface-soft uppercase tracking-wider">
                                <th className="px-5 py-4 font-bold border-b border-primary/10">Cliente</th>
                                <th className="px-5 py-4 font-bold border-b border-primary/10">Localização</th>
                                <th className="px-5 py-4 font-bold border-b border-primary/10">Sistema</th>
                                <th className="px-5 py-4 font-bold border-b border-primary/10">Contrato</th>
                                <th className="px-5 py-4 font-bold border-b border-primary/10">Manutenção</th>
                                <th className="px-5 py-4 font-bold border-b border-primary/10">Status</th>
                                <th className="px-5 py-4 font-bold border-b border-primary/10 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-text-muted divide-y divide-primary/5">
                            {loading ? (
                                <tr><td colSpan={7} className="px-5 py-10 text-center">
                                    <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="px-5 py-14 text-center">
                                    <div className="flex flex-col items-center gap-2 text-text-muted">
                                        <span className="material-symbols-outlined text-4xl opacity-30">solar_power</span>
                                        <p className="font-medium">Nenhum cliente instalado ainda.</p>
                                        <p className="text-xs opacity-60 max-w-xs text-center mt-1">
                                            Quando uma instalação for concluída, clique em <strong>"Novo Cliente"</strong> para cadastrá-lo aqui.
                                        </p>
                                    </div>
                                </td></tr>
                            ) : (
                                filtered.map(client => {
                                    const sc = INSTALL_STATUS_COLORS[client.install_status] || INSTALL_STATUS_COLORS['Aguardando'];
                                    const maintenanceSoon = isMaintenanceSoon(client.next_maintenance);
                                    const maintenanceOverdue = isMaintenanceOverdue(client.next_maintenance);
                                    return (
                                        <tr key={client.id} className="hover:bg-surface-cream transition-colors group">
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-text-main">{client.name}</span>
                                                    <span className="text-xs flex items-center gap-1 mt-0.5">
                                                        <span className="material-symbols-outlined text-[11px]">call</span>
                                                        {client.phone}
                                                    </span>
                                                    {client.install_date && (
                                                        <span className="text-[10px] text-text-muted mt-0.5">
                                                            📅 Instalado em {formatDate(client.install_date)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{client.city || '—'}</span>
                                                    {client.address && <span className="text-xs opacity-60 mt-0.5">{client.address}</span>}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    {client.system_kwp > 0 && (
                                                        <span className="text-xs font-bold text-primary">⚡ {client.system_kwp} kWp</span>
                                                    )}
                                                    {client.panels_qty > 0 && (
                                                        <span className="text-xs">☀️ {client.panels_qty} painéis</span>
                                                    )}
                                                    {client.inverter_model && (
                                                        <span className="text-xs opacity-60">{client.inverter_model}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-text-main">{formatCurrency(client.contract_value)}</span>
                                                    {client.contract_ref && <span className="text-xs opacity-60">Nº {client.contract_ref}</span>}
                                                    {client.warranty_until && (
                                                        <span className="text-[10px] text-green-600">🛡️ Garantia até {formatDate(client.warranty_until)}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {client.next_maintenance ? (
                                                    <span className={`text-xs font-bold flex items-center gap-1 ${maintenanceOverdue ? 'text-red-600' : maintenanceSoon ? 'text-orange-500' : 'text-text-muted'}`}>
                                                        {maintenanceOverdue ? '🚨' : maintenanceSoon ? '⚠️' : '🔧'}
                                                        {formatDate(client.next_maintenance)}
                                                    </span>
                                                ) : <span className="text-xs opacity-40">—</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit whitespace-nowrap"
                                                    style={{ background: sc.bg, color: sc.text }}>
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                                                    {client.install_status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openWhatsApp(client)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                                    </button>
                                                    <button onClick={() => { setSelectedClient(client); setShowModal(true); }}
                                                        className="p-1.5 text-secondary hover:text-primary hover:bg-surface-soft rounded-lg transition-colors" title="Editar">
                                                        <span className="material-symbols-outlined text-lg">edit</span>
                                                    </button>
                                                    <button onClick={() => setConfirmDeleteId(client.id)}
                                                        disabled={deletingId === client.id}
                                                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40" title="Excluir">
                                                        <span className="material-symbols-outlined text-lg">
                                                            {deletingId === client.id ? 'hourglass_empty' : 'delete'}
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
                    <span>Mostrando {filtered.length} de {clients.length} clientes</span>
                </div>
            </div>

            {/* ── Edit / Create Modal ── */}
            {showModal && selectedClient && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-primary/10 flex justify-between items-center bg-surface-cream shrink-0">
                            <h3 className="font-display text-xl font-bold text-text-main">
                                {selectedClient.id ? 'Editar Cliente' : 'Novo Cliente'}
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
                                    <input required type="text" value={selectedClient.name || ''} onChange={e => setSelectedClient({ ...selectedClient, name: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">WhatsApp</label>
                                    <input type="tel" value={selectedClient.phone || ''} onChange={e => setSelectedClient({ ...selectedClient, phone: e.target.value })}
                                        placeholder="(61) 9 9999-9999"
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Cidade</label>
                                    <input type="text" value={selectedClient.city || ''} onChange={e => setSelectedClient({ ...selectedClient, city: e.target.value })}
                                        placeholder="Ex: Brasília, Gama..."
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Endereço de instalação</label>
                                    <input type="text" value={selectedClient.address || ''} onChange={e => setSelectedClient({ ...selectedClient, address: e.target.value })}
                                        placeholder="Rua, número, bairro..."
                                        className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                </div>
                            </div>

                            {/* Sistema instalado */}
                            <div className="pt-3 border-t border-primary/5">
                                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">⚡ Sistema Instalado</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Potência (kWp)</label>
                                        <input type="number" step="0.01" min="0" value={selectedClient.system_kwp || ''} onChange={e => setSelectedClient({ ...selectedClient, system_kwp: parseFloat(e.target.value) || 0 })}
                                            placeholder="Ex: 5.5"
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Qtd. Painéis</label>
                                        <input type="number" min="0" value={selectedClient.panels_qty || ''} onChange={e => setSelectedClient({ ...selectedClient, panels_qty: parseInt(e.target.value) || 0 })}
                                            placeholder="Ex: 14"
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Modelo do Inversor</label>
                                        <input type="text" value={selectedClient.inverter_model || ''} onChange={e => setSelectedClient({ ...selectedClient, inverter_model: e.target.value })}
                                            placeholder="Ex: Growatt 5KTL-X, Deye 6kW..."
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Data de instalação</label>
                                        <input type="date" value={selectedClient.install_date || ''} onChange={e => setSelectedClient({ ...selectedClient, install_date: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Valor do contrato (R$)</label>
                                        <input type="number" step="0.01" min="0" value={selectedClient.contract_value || ''} onChange={e => setSelectedClient({ ...selectedClient, contract_value: parseFloat(e.target.value) || 0 })}
                                            placeholder="Ex: 28000"
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Nº do Contrato</label>
                                        <input type="text" value={selectedClient.contract_ref || ''} onChange={e => setSelectedClient({ ...selectedClient, contract_ref: e.target.value })}
                                            placeholder="Ex: CT-2024-001"
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Garantia até</label>
                                        <input type="date" value={selectedClient.warranty_until || ''} onChange={e => setSelectedClient({ ...selectedClient, warranty_until: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">Próxima manutenção</label>
                                        <input type="date" value={selectedClient.next_maintenance || ''} onChange={e => setSelectedClient({ ...selectedClient, next_maintenance: e.target.value })}
                                            className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm" />
                                    </div>
                                </div>
                            </div>

                            {/* Status de instalação */}
                            <div className="pt-3 border-t border-primary/5">
                                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">Status da Instalação</label>
                                <div className="flex gap-3">
                                    {(['Aguardando', 'Em andamento', 'Concluída'] as const).map(s => {
                                        const sc = INSTALL_STATUS_COLORS[s];
                                        const active = selectedClient.install_status === s;
                                        return (
                                            <button key={s} type="button"
                                                onClick={() => setSelectedClient({ ...selectedClient, install_status: s })}
                                                className="px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all"
                                                style={{
                                                    background: active ? sc.bg : 'transparent',
                                                    color: active ? sc.text : '#9ca3af',
                                                    borderColor: active ? sc.dot : '#e5e7eb',
                                                }}>
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
                                <textarea rows={3} value={selectedClient.notes || ''} onChange={e => setSelectedClient({ ...selectedClient, notes: e.target.value })}
                                    placeholder="Observações sobre a instalação, histórico de manutenções..."
                                    className="w-full px-4 py-2 rounded-xl border border-primary/20 focus:border-primary outline-none text-sm resize-none" />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-text-muted hover:bg-surface-soft rounded-lg font-medium text-sm">Cancelar</button>
                                <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-dark disabled:opacity-70 text-sm">
                                    {saving ? 'Salvando...' : 'Salvar Cliente'}
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
                                <span className="material-symbols-outlined text-red-500">person_off</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Excluir Cliente</h3>
                                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Tem certeza que deseja excluir <strong>{clients.find(c => c.id === confirmDeleteId)?.name}</strong>?
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
                                        const { error } = await supabase.from('clients').delete().eq('id', id);
                                        if (error) alert(`Erro ao excluir: ${error.message}`);
                                        else fetchClients();
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

export default AdminClients;
