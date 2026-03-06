-- =========================================
-- RVGS ELÉTRICA — Migração: events + financial_movements
-- Cole este script no SQL Editor do Supabase
-- (https://supabase.com/dashboard/project/pwexfesuraqskwgkhyhp/editor)
-- =========================================

-- Tabela de Eventos (Agenda)
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  type TEXT DEFAULT 'other' CHECK (type IN ('birthday', 'wedding', 'corporate', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on events" ON public.events
  FOR ALL USING (auth.role() = 'authenticated');

-- Tabela de Movimentos Financeiros (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS public.financial_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Receita', 'Despesa')),
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.financial_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access on financial_movements" ON public.financial_movements
  FOR ALL USING (auth.role() = 'authenticated');
