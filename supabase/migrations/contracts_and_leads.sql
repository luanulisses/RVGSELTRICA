-- =========================================
-- RVGS ELÉTRICA — Migração: contracts + leads
-- Cole este script no SQL Editor do Supabase
-- (https://supabase.com/dashboard/project/pwexfesuraqskwgkhyhp/editor)
-- =========================================

-- Tabela de Leads / Clientes
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  email TEXT DEFAULT '',
  status TEXT DEFAULT 'Novo',
  notes TEXT DEFAULT '',
  contract_value NUMERIC(12, 2) DEFAULT 0,
  event_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on leads" ON public.leads
  FOR ALL USING (auth.role() = 'authenticated');

-- Tabela de Contratos
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL DEFAULT '',
  client_cpf TEXT DEFAULT '',
  event_date DATE,
  total_value NUMERIC(12, 2) DEFAULT 0,
  contract_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'Ativo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on contracts" ON public.contracts
  FOR ALL USING (auth.role() = 'authenticated');
