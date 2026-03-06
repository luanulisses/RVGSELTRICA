import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/landing/Button';
import { supabase } from '../../lib/supabase';

interface ClientData {
    name: string;
    document: string;
    email: string;
    phone: string;
}

interface ServiceData {
    eventType: string;
    eventDate: string;
    description: string;
    serviceCode: string;
    numGuests: number;
    valuePerGuest: number;
    issAliquot: number;
    operationType: string;
    extraObs: string;
}

interface ReceiptData {
    number: string;
    value: number;
    date: string;
    type: string;
    method: string;
    isQuittance: boolean;
}

const NotaFiscal: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dados');
    const [searchParams] = useSearchParams();

    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [paymentInfo, setPaymentInfo] = useState({
        depositValue: 0,
        depositDate: '',
        totalValue: 0,
        contractId: ''
    });

    const [client, setClient] = useState<ClientData>({
        name: '',
        document: '',
        email: '',
        phone: ''
    });

    const [service, setService] = useState<ServiceData>({
        eventType: '',
        eventDate: '',
        description: '',
        serviceCode: '14.01',
        numGuests: 0,
        valuePerGuest: 0,
        issAliquot: 2,
        operationType: '1 - Tributação no Município',
        extraObs: ''
    });

    const [receipt, setReceipt] = useState<ReceiptData>({
        number: `001/${new Date().getFullYear()}`,
        value: 0,
        date: new Date().toISOString().split('T')[0],
        type: 'Sinal / Entrada',
        method: 'PIX',
        isQuittance: false
    });

    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isImported, setIsImported] = useState(false);
    const [receiptHistory, setReceiptHistory] = useState<any[]>([]);
    const [globalReceipts, setGlobalReceipts] = useState<any[]>([]);
    const [globalReceiptsError, setGlobalReceiptsError] = useState<string | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [contracts, setContracts] = useState<any[]>([]);
    const [isContractSelectorOpen, setIsContractSelectorOpen] = useState(false);
    const [isLoadingContracts, setIsLoadingContracts] = useState(false);

    const filteredReceipts = globalReceipts.filter(r => {
        const matchesSearch = (r.client_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
            (r.number?.toLowerCase() || '').includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'Todos' || r.type === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const statusCounts = {
        'Sinal / Entrada': globalReceipts.filter(r => r.type === 'Sinal / Entrada').length,
        'Parcela': globalReceipts.filter(r => r.type === 'Parcela').length,
        'Quitação Total': globalReceipts.filter(r => r.type === 'Quitação Total').length,
    };

    const loadReceiptHistory = async (contractId: string) => {
        if (!contractId) return;
        setIsLoadingHistory(true);
        try {
            const { data, error } = await supabase
                .from('receipt_logs')
                .select('*')
                .eq('contract_id', contractId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReceiptHistory(data || []);
        } catch (err) {
            console.error('Erro ao carregar histórico:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const loadGlobalReceipts = async () => {
        setIsLoadingHistory(true);
        setGlobalReceiptsError(null);
        try {
            const { data, error } = await supabase
                .from('receipt_logs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                    setGlobalReceiptsError('TABLE_MISSING');
                } else {
                    setGlobalReceiptsError(error.message);
                }
                return;
            }
            setGlobalReceipts(data || []);
        } catch (err: any) {
            console.error('Erro ao carregar gestão global:', err);
            setGlobalReceiptsError('Erro de conexão ao carregar os recibos.');
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'historico_global') {
            loadGlobalReceipts();
        }
    }, [activeTab]);

    const loadContractById = async (contractId: string) => {
        if (!contractId) return;
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .eq('id', contractId)
                .single();

            if (error) throw error;
            if (data) {
                setPaymentInfo({
                    depositValue: Number(data.contract_data?.payment?.deposit) || 0,
                    depositDate: data.contract_data?.payment?.depositDate || '',
                    totalValue: Number(data.total_value) || 0,
                    contractId: data.id
                });

                setClient({
                    name: data.client_name || data.contract_data?.client?.name || '',
                    document: data.client_cpf || data.contract_data?.client?.cpf || '',
                    email: data.contract_data?.client?.email || '',
                    phone: data.contract_data?.client?.phone || ''
                });

                setService({
                    eventType: data.contract_data?.event?.type || 'Instalação Solar',
                    eventDate: data.event_date || data.contract_data?.event?.date || '',
                    description: '', // Will be updated by useEffect
                    serviceCode: '14.01',
                    numGuests: 0,
                    valuePerGuest: Number(data.total_value) || 0,
                    issAliquot: 2,
                    operationType: '1 - Tributação no Município',
                    extraObs: ''
                });

                setReceipt(prev => ({
                    ...prev,
                    value: Number(data.contract_data?.payment?.deposit) || Number(data.total_value) || 0,
                    type: data.contract_data?.payment?.deposit ? 'Sinal / Entrada' : 'Quitação Total'
                }));
            }
        } catch (err) {
            console.error('Erro ao buscar contrato pelo ID:', err);
        }
    };

    const loadFinishedContracts = async () => {
        setIsLoadingContracts(true);
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('id, client_name, total_value, event_date')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContracts(data || []);
        } catch (err) {
            console.error('Erro ao carregar contratos:', err);
        } finally {
            setIsLoadingContracts(false);
        }
    };

    const handleImportContract = (contractId: string) => {
        loadContractById(contractId);
        loadReceiptHistory(contractId);
        setIsImported(true);
        setIsContractSelectorOpen(false);
    };

    const handleDeleteReceipt = async (id: string, number: string) => {
        if (!confirm(`Deseja excluir o Recibo Nº ${number}?`)) return;
        try {
            const { error } = await supabase.from('receipt_logs').delete().eq('id', id);
            if (error) throw error;
            loadGlobalReceipts();
        } catch (err) {
            console.error('Erro ao excluir recibo:', err);
        }
    };

    const fetchNextReceiptNumber = async () => {
        const year = new Date().getFullYear();
        try {
            const { count, error } = await supabase
                .from('receipt_logs')
                .select('*', { count: 'exact', head: true })
                .filter('number', 'ilike', `%/${year}%`);
            if (error) throw error;
            const nextNum = (count || 0) + 1;
            setReceipt(prev => ({ ...prev, number: `${String(nextNum).padStart(3, '0')}/${year}` }));
        } catch (err) {
            console.error('Erro ao buscar próximo número:', err);
        }
    };

    const handleSaveReceipt = async () => {
        if (!client.name || receipt.value <= 0) {
            alert('Por favor, preencha o nome do cliente e o valor do recibo antes de visualizar.');
            return false;
        }

        setIsSaving(true);
        try {
            let existingId = null;

            // Check if it already exists to avoid duplicates
            if (paymentInfo.contractId && paymentInfo.contractId.trim() !== '') {
                const { data: existing, error: checkError } = await supabase
                    .from('receipt_logs')
                    .select('id')
                    .eq('contract_id', paymentInfo.contractId)
                    .eq('type', receipt.type)
                    .maybeSingle();

                if (checkError) console.error('Erro ao verificar duplicados:', checkError);
                if (existing) existingId = existing.id;
            } else {
                // For standalone, check by number
                const { data: existing, error: checkError } = await supabase
                    .from('receipt_logs')
                    .select('id')
                    .eq('number', receipt.number)
                    .maybeSingle();

                if (checkError) console.error('Erro ao verificar duplicados (avulso):', checkError);
                if (existing) existingId = existing.id;
            }

            const receiptData = {
                contract_id: (paymentInfo.contractId && paymentInfo.contractId.trim() !== '') ? paymentInfo.contractId : null,
                number: receipt.number,
                value: receipt.value,
                date: receipt.date,
                type: receipt.type,
                method: receipt.method,
                client_name: client.name
            };

            if (existingId) {
                const { error } = await supabase
                    .from('receipt_logs')
                    .update(receiptData)
                    .eq('id', existingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('receipt_logs')
                    .insert([receiptData]);
                if (error) throw error;
            }

            await loadGlobalReceipts();
            return true;
        } catch (err: any) {
            console.error('Erro ao salvar recibo:', err);
            alert(`Erro ao salvar recibo: ${err.message || 'Verifique sua conexão'}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        const el = document.getElementById(`copy-feedback-${id}`);
        if (el) {
            el.style.opacity = '1';
            setTimeout(() => { el.style.opacity = '0'; }, 2000);
        }
    };

    useEffect(() => {
        fetchNextReceiptNumber();
        const cId = searchParams.get('contract_id');
        const clientName = searchParams.get('client_name');
        const totalValue = searchParams.get('total_value');
        const depositValue = searchParams.get('deposit_value');
        const source = searchParams.get('source');

        if (cId) {
            setPaymentInfo({
                depositValue: Number(depositValue) || 0,
                depositDate: '',
                totalValue: Number(totalValue) || 0,
                contractId: cId
            });
            if (clientName) setClient(prev => ({ ...prev, name: decodeURIComponent(clientName) }));
            setReceipt(prev => ({
                ...prev,
                value: Number(depositValue) || Number(totalValue) || 0,
                type: Number(depositValue) > 0 ? 'Sinal / Entrada' : 'Quitação Total'
            }));
            loadContractById(cId);
            loadReceiptHistory(cId);
            setIsImported(source === 'contract_success');
        } else {
            loadGlobalReceipts();
        }
    }, [searchParams]);

    useEffect(() => {
        if (receipt.type === 'Sinal / Entrada' && paymentInfo.depositValue > 0) {
            setReceipt(prev => ({ ...prev, value: paymentInfo.depositValue }));
        } else if (receipt.type === 'Quitação Total' && paymentInfo.totalValue > 0) {
            setReceipt(prev => ({ ...prev, value: paymentInfo.totalValue }));
        }
    }, [receipt.type, paymentInfo.depositValue, paymentInfo.totalValue]);

    useEffect(() => {
        if (service.eventType && service.eventDate) {
            const formattedDate = new Date(service.eventDate + 'T12:00:00').toLocaleDateString('pt-BR');
            const desc = `Prestação de serviços de instalação e manutenção solar para o projeto de ${service.eventType} realizado em ${formattedDate}, conforme especificações técnicas.`;
            setService(prev => ({ ...prev, description: desc }));
        }
    }, [service.eventType, service.eventDate]);

    const renderTabContent = () => {
        switch (activeTab) {
            case 'historico_global':
                if (globalReceiptsError === 'TABLE_MISSING') {
                    return (
                        <div className="p-8 text-center bg-red-50 border border-red-100 rounded-2xl animate-fade-in">
                            <span className="material-symbols-outlined text-4xl text-red-400 mb-4 font-bold">database_off</span>
                            <h3 className="text-lg font-bold text-red-700 mb-2">Configure o Banco de Dados</h3>
                            <p className="text-sm text-red-600 mb-6 max-w-md mx-auto">
                                A tabela de recibos ainda não foi criada. Por favor, execute o comando SQL abaixo no seu painel do Supabase.
                            </p>
                            <div className="bg-gray-900 p-4 rounded-xl text-left font-mono text-[10px] text-green-400 overflow-x-auto mb-6 relative group">
                                <button
                                    onClick={() => handleCopy(`CREATE TABLE public.receipt_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    number TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL DEFAULT 'Sinal / Entrada',
    method TEXT NOT NULL DEFAULT 'PIX',
    client_name TEXT
);

ALTER TABLE public.receipt_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.receipt_logs FOR ALL USING (auth.role() = 'authenticated');`, 'sql')}
                                    className="absolute right-2 top-2 p-1 text-gray-400 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">content_copy</span>
                                    <div id="copy-feedback-sql" className="absolute -top-6 right-0 bg-green-500 text-white text-[8px] px-2 py-1 rounded opacity-0 transition-opacity whitespace-nowrap">COPIADO!</div>
                                </button>
                                <pre className="whitespace-pre">
                                    {`CREATE TABLE public.receipt_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
    number TEXT NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL DEFAULT 'Sinal / Entrada',
    method TEXT NOT NULL DEFAULT 'PIX',
    client_name TEXT
);

ALTER TABLE public.receipt_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.receipt_logs FOR ALL USING (auth.role() = 'authenticated');`}
                                </pre>
                            </div>
                            <a href="https://supabase.com/dashboard/project/pwexfesuraqskwgkhyhp/sql/new" target="_blank" className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all">
                                <span className="material-symbols-outlined">open_in_new</span> ABRIR SQL EDITOR
                            </a>
                        </div>
                    );
                }

                if (globalReceiptsError) {
                    return (
                        <div className="p-12 text-center bg-gray-50 border border-gray-100 rounded-2xl animate-fade-in">
                            <span className="material-symbols-outlined text-4xl text-gray-400 mb-4 font-bold">error_outline</span>
                            <h3 className="text-lg font-bold text-gray-700 mb-2">Erro ao carregar histórico</h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{globalReceiptsError}</p>
                            <button onClick={loadGlobalReceipts} className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto">
                                <span className="material-symbols-outlined text-sm">refresh</span> Tentar Novamente
                            </button>
                        </div>
                    );
                }

                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(statusCounts).map(([status, count]) => (
                                <div key={status} className="bg-white rounded-xl p-4 border border-secondary/10 shadow-sm flex items-center gap-3">
                                    <div className="text-2xl font-bold text-text-main">{count}</div>
                                    <div className="text-xs text-text-muted">{status}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-secondary/10 overflow-x-auto gap-1">
                            {['Todos', 'Sinal / Entrada', 'Parcela', 'Quitação Total'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${filterStatus === s ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:bg-surface-soft'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 overflow-hidden relative min-h-[400px]">
                            {isLoadingHistory ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] z-10">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
                                        <span className="text-sm font-bold text-primary">Carregando Histórico...</span>
                                    </div>
                                </div>
                            ) : null}

                            {filteredReceipts.length === 0 && !isLoadingHistory ? (
                                <div className="p-20 text-center text-text-muted italic">
                                    <span className="material-symbols-outlined text-5xl mb-4 block opacity-20">receipt_long</span>
                                    Nenhum recibo encontrado.
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="text-xs text-secondary bg-surface-soft uppercase border-b">
                                        <tr>
                                            <th className="px-5 py-4">Nº Recibo</th>
                                            <th className="px-5 py-4">Data</th>
                                            <th className="px-5 py-4">Cliente</th>
                                            <th className="px-5 py-4">Tipo</th>
                                            <th className="px-5 py-4 text-right">Valor</th>
                                            <th className="px-5 py-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm divide-y">
                                        {filteredReceipts.map((r, i) => (
                                            <tr key={i} className="hover:bg-surface-cream group">
                                                <td className="px-5 py-4 font-bold">{r.number}</td>
                                                <td className="px-5 py-4">{new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                                <td className="px-5 py-4">{r.client_name || '--'}</td>
                                                <td className="px-5 py-4">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase">
                                                        {r.type}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold">R$ {Number(r.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                                <td className="px-5 py-4 text-right">
                                                    <button onClick={() => handleDeleteReceipt(r.id, r.number)} className="p-1 text-red-400 hover:text-red-600">
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                );
            case 'dados':
                return (
                    <div className="space-y-6 animate-fade-in">
                        {isImported && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between text-green-700 text-sm">
                                <span>Dados importados do contrato com sucesso!</span>
                                <button onClick={() => setIsImported(false)}><span className="material-symbols-outlined text-lg">close</span></button>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">PRESTADOR (VOCÊ)</h3>
                                <div className="space-y-3 text-sm">
                                    <div><label className="block text-gray-500 mb-1">Razão Social</label><input disabled value="RVGS ELÉTRICA" className="w-full p-2 bg-gray-50 border rounded-md" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-gray-500 mb-1">CNPJ</label><input disabled value="50.736.345/0001-86" className="w-full p-2 bg-gray-50 border rounded-md" /></div>
                                        <div><label className="block text-gray-500 mb-1">Inc. Mun.</label><input disabled value="ISENTO" className="w-full p-2 bg-gray-50 border rounded-md" /></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase">TOMADOR (CLIENTE)</h3>
                                    <button
                                        onClick={() => { loadFinishedContracts(); setIsContractSelectorOpen(true); }}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-[11px] font-bold uppercase shadow-sm hover:bg-primary/90 transition-all active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-sm">search</span> Importar Contrato
                                    </button>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div><label className="block text-gray-500 mb-1">Nome Completo</label><input value={client.name} onChange={e => setClient({ ...client, name: e.target.value })} className="w-full p-2 border rounded-md" /></div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-gray-500 mb-1">CPF / CNPJ</label><input value={client.document} onChange={e => setClient({ ...client, document: e.target.value })} className="w-full p-2 border rounded-md" /></div>
                                        <div><label className="block text-gray-500 mb-1">Telefone</label><input value={client.phone} onChange={e => setClient({ ...client, phone: e.target.value })} className="w-full p-2 border rounded-md" /></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">DETALHES DO PROJETO</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div className="md:col-span-3"><label className="block text-gray-500 mb-1">Tipo de Projeto</label><input value={service.eventType} onChange={e => setService({ ...service, eventType: e.target.value })} className="w-full p-2 border rounded-md" /></div>
                                <div><label className="block text-gray-500 mb-1">Data</label><input type="date" value={service.eventDate} onChange={e => setService({ ...service, eventDate: e.target.value })} className="w-full p-2 border rounded-md" /></div>
                                <div className="md:col-span-4"><label className="block text-gray-500 mb-1">Descrição para NF</label><textarea value={service.description} onChange={e => setService({ ...service, description: e.target.value })} rows={3} className="w-full p-2 border rounded-md" /></div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setActiveTab('rascunho')} className="bg-[#78B926] text-white px-6 py-2 rounded-xl font-bold shadow-sm">Gerar Rascunho NF</button>
                            <button onClick={() => setActiveTab('recibo')} className="border border-[#8F4114] text-[#8F4114] px-6 py-2 rounded-xl font-bold">Prévio do Recibo</button>
                        </div>
                    </div>
                );
            case 'rascunho':
                const fields = [
                    { section: 'PRESTADOR', data: [{ l: 'CNPJ', v: '50.736.345/0001-86' }, { l: 'RAZÃO', v: 'RVGS ELÉTRICA' }] },
                    { section: 'TOMADOR', data: [{ l: 'NOME', v: client.name }, { l: 'DOC', v: client.document }] },
                    { section: 'SERVIÇO', data: [{ l: 'CÓDIGO', v: service.serviceCode }, { l: 'DESCRIÇÃO', v: service.description }] }
                ];
                return (
                    <div className="space-y-6 animate-fade-in">
                        {fields.map(s => (
                            <div key={s.section} className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
                                <h3 className="text-xs font-bold text-gray-400 mb-4">{s.section}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {s.data.map((f, i) => (
                                        <div key={i} className="bg-white p-3 border rounded-lg relative">
                                            <div className="text-[10px] text-gray-400 font-bold uppercase">{f.l}</div>
                                            <div className="text-sm pr-10">{f.v || '--'}</div>
                                            <button onClick={() => handleCopy(f.v || '', `${s.section}-${i}`)} className="absolute right-2 top-2 p-1 text-gray-400 hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">content_copy</span></button>
                                            <div id={`copy-feedback-${s.section}-${i}`} className="absolute top-0 right-0 bg-green-500 text-white text-[8px] px-1 rounded opacity-0 transition-opacity">COPIADO</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'recibo':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-lg mx-auto">
                            <h3 className="font-bold text-center mb-6 uppercase tracking-widest text-primary">Configurar Recibo</h3>
                            <div className="space-y-4 text-sm">
                                <div><label className="block font-bold mb-1">Nº Recibo</label><input value={receipt.number} onChange={e => setReceipt({ ...receipt, number: e.target.value })} className="w-full p-2 border rounded-md" /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block font-bold mb-1">Valor (R$)</label><input type="number" step="0.01" value={receipt.value} onChange={e => setReceipt({ ...receipt, value: Number(e.target.value) })} className="w-full p-2 border rounded-md font-bold text-primary" /></div>
                                    <div><label className="block font-bold mb-1">Data</label><input type="date" value={receipt.date} onChange={e => setReceipt({ ...receipt, date: e.target.value })} className="w-full p-2 border rounded-md" /></div>
                                </div>
                                <div>
                                    <label className="block font-bold mb-1">Tipo</label>
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 rounded-xl">
                                        <button
                                            onClick={() => setReceipt({ ...receipt, type: 'Sinal / Entrada' })}
                                            className={`py-2 rounded-lg text-[10px] font-bold transition-all ${receipt.type === 'Sinal / Entrada' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            SINAL / ENTRADA
                                        </button>
                                        <button
                                            onClick={() => setReceipt({ ...receipt, type: 'Quitação Total' })}
                                            className={`py-2 rounded-lg text-[10px] font-bold transition-all ${receipt.type === 'Quitação Total' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:bg-gray-200'}`}
                                        >
                                            QUITAÇÃO TOTAL
                                        </button>
                                    </div>
                                </div>
                                <button
                                    disabled={isSaving}
                                    onClick={async () => {
                                        const saved = await handleSaveReceipt();
                                        if (saved) setIsReceiptModalOpen(true);
                                    }}
                                    className={`w-full bg-primary text-white py-4 rounded-xl font-bold mt-4 shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : 'active:scale-95 hover:bg-primary/90'}`}
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                            SALVANDO...
                                        </>
                                    ) : (
                                        'VISUALIZAR RECIBO'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="font-display text-2xl font-bold text-text-main">
                        {activeTab === 'historico_global' ? 'Gerenciamento de Recibos' : 'Recibo e Nota Fiscal'}
                    </h1>
                    <p className="text-sm text-text-muted">Sistema de faturamento RVGS ELÉTRICA</p>
                </div>
                {activeTab === 'historico_global' && (
                    <div className="flex gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-56">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">search</span>
                            <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border outline-none text-sm bg-white" />
                        </div>
                        <button onClick={() => setActiveTab('dados')} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">add_circle</span> NOVO
                        </button>
                    </div>
                )}
            </div>

            <div className="flex bg-white rounded-xl p-1 shadow-sm border border-secondary/10 overflow-x-auto gap-1">
                {[
                    { id: 'dados', label: 'Dados', icon: 'edit_note' },
                    { id: 'rascunho', label: 'Rascunho', icon: 'inventory' },
                    { id: 'recibo', label: 'Recibo', icon: 'receipt_long' },
                    { id: 'historico_global', label: 'Histórico', icon: 'history' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-primary text-white' : 'text-text-muted hover:bg-surface-soft'}`}
                    >
                        <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-secondary/10 p-6 md:p-8">
                {renderTabContent()}
            </div>

            {isContractSelectorOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                        <div className="p-4 border-b flex justify-between items-center bg-primary/5">
                            <h3 className="font-bold text-primary">Selecionar Contrato Finalizado</h3>
                            <button onClick={() => setIsContractSelectorOpen(false)} className="text-gray-400 hover:text-red-500"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
                            {isLoadingContracts ? (
                                <div className="text-center p-8"><span className="material-symbols-outlined animate-spin text-primary">sync</span></div>
                            ) : contracts.length === 0 ? (
                                <div className="text-center p-8 text-gray-400 italic">Nenhum contrato encontrado.</div>
                            ) : (
                                contracts.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleImportContract(c.id)}
                                        className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-primary hover:bg-primary/5 transition-all flex justify-between items-center group"
                                    >
                                        <div>
                                            <div className="font-bold text-gray-800 group-hover:text-primary">{c.client_name}</div>
                                            <div className="text-[10px] text-gray-400 uppercase">{new Date(c.event_date).toLocaleDateString()} • R$ {Number(c.total_value).toLocaleString()}</div>
                                        </div>
                                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-all">arrow_forward</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {isReceiptModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-white">
                            <button onClick={handlePrintReceipt} className="bg-[#1D7142] text-white flex items-center gap-2 px-6 py-2 rounded-xl font-bold shadow-md"><span className="material-symbols-outlined">print</span> IMPRIMIR / PDF</button>
                            <button onClick={() => setIsReceiptModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined">close</span> FECHAR</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-12 bg-gray-100">
                            <div className="bg-white shadow-lg p-16 mx-auto w-full max-w-xl aspect-[1/1.41] flex flex-col justify-between print:shadow-none print:p-0">
                                <div className="text-center space-y-4">
                                    <h2 className="text-4xl font-black text-primary tracking-tighter">RVGS ELÉTRICA</h2>
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.3em]">Solares & Serviços Elétricos</p>
                                    <div className="h-px bg-gray-200 w-24 mx-auto"></div>
                                    <h3 className="text-xl font-bold uppercase tracking-[0.2em] pt-4">Recibo de Pagamento</h3>
                                    <p className="text-sm font-mono text-gray-400">Nº {receipt.number} | {new Date().toLocaleDateString('pt-BR')}</p>
                                </div>

                                <div className="space-y-8 pt-12">
                                    <div className="text-lg leading-loose text-justify text-gray-700">
                                        Recebemos de <strong className="border-b-2 border-primary/20 pb-0.5">{client.name || '___________________________'}</strong>,
                                        CPF/CNPJ nº <strong>{client.document || '_________________'}</strong>, a importância de
                                        <strong className="text-primary text-2xl px-2">R$ {Number(receipt.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>,
                                        referente a <strong>{receipt.type}</strong> dos serviços de {service.eventType || 'instalação elétrica'}.
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 text-sm pt-8">
                                        <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Pagamento</p>
                                            <p className="font-bold">{receipt.method}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Data</p>
                                            <p className="font-bold">{new Date(receipt.date).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-24 space-y-12">
                                    <div className="text-center">
                                        <div className="w-64 h-px bg-gray-400 mx-auto mb-4"></div>
                                        <p className="text-xs font-bold uppercase tracking-widest">RVGS ELÉTRICA</p>
                                        <p className="text-[10px] text-gray-400 uppercase">CNPJ: 50.736.345/0001-86</p>
                                    </div>
                                    <p className="text-[8px] text-center text-gray-300 italic uppercase">Este documento não substitui a Nota Fiscal de Serviços Eletrônica</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-only, .print-only * { visibility: visible; }
                    .fixed { position: absolute; left: 0; top: 0; width: 100%; height: auto; background: white !important; }
                    .no-print { display: none !important; }
                    .overflow-y-auto { overflow: visible !important; height: auto !important; max-height: none !important; }
                    .bg-gray-100 { background: white !important; }
                }
            `}</style>
        </div>
    );
};

export default NotaFiscal;
