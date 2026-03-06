-- =========================================
-- RVGS ELÉTRICA — Migração Solar v2
-- Cole este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/pwexfesuraqskwgkhyhp/sql/new
-- =========================================

-- 1. Adicionar campos solares à tabela leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT 'Residencial',
  ADD COLUMN IF NOT EXISTS bill_value NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_consumption NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS roof_type TEXT DEFAULT 'Cerâmica',
  ADD COLUMN IF NOT EXISTS estimated_kwp NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quote_value NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Site',
  ADD COLUMN IF NOT EXISTS guests INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS package_id UUID,
  ADD COLUMN IF NOT EXISTS contract_url TEXT DEFAULT '';

-- 2. Criar tabela de clientes instalados
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  system_kwp NUMERIC(8,2) DEFAULT 0,
  panels_qty INTEGER DEFAULT 0,
  inverter_model TEXT DEFAULT '',
  install_date DATE,
  contract_value NUMERIC(12,2) DEFAULT 0,
  install_status TEXT DEFAULT 'Aguardando',
  contract_ref TEXT DEFAULT '',
  warranty_until DATE,
  next_maintenance DATE,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated full access on clients" ON public.clients;
CREATE POLICY "Allow authenticated full access on clients"
  ON public.clients FOR ALL USING (auth.role() = 'authenticated');

-- Verificar se foi criado corretamente
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('leads', 'clients', 'contracts');
