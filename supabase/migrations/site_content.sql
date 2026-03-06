-- =========================================
-- RVGS ELÉTRICA — Migração: site_content
-- Cole este script no SQL Editor do Supabase
-- (https://supabase.com/dashboard/project/pwexfesuraqskwgkhyhp/editor)
-- =========================================

CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT DEFAULT '',
  section TEXT DEFAULT 'general',
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'textarea', 'metrics')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar segurança em nível de linha (RLS)
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Permitir leitura pública (para o site exibir os dados)
CREATE POLICY "Allow public read" ON public.site_content
  FOR SELECT USING (true);

-- Permitir escrita apenas para usuários autenticados (admins)
CREATE POLICY "Allow authenticated write" ON public.site_content
  FOR ALL USING (auth.role() = 'authenticated');

-- Dados iniciais para RVGS Elétrica
INSERT INTO public.site_content (key, value, section, type) VALUES
  ('site_name', 'RVGS Elétrica', 'identidade', 'text'),
  ('hero_title', 'Solar Sistemas', 'hero', 'text'),
  ('hero_subtitle', 'A RVGS Elétrica traz para você o melhor da tecnologia solar. Reduza custos, aumente a sustentabilidade e garanta sua independência energética com quem é especialista.', 'hero', 'textarea'),
  ('hero_badge', 'Excelência em Fotovoltaica', 'hero', 'text'),
  ('hero_cta_primary', 'Solicitar Estudo', 'hero', 'text'),
  ('stat_years', '+10', 'estatisticas', 'text'),
  ('stat_projects', '+500', 'estatisticas', 'text'),
  ('stat_economy', '98%', 'estatisticas', 'text'),
  ('contact_phone', '(61) 99380-1434', 'contato', 'text'),
  ('contact_city', 'Brasília / DF', 'contato', 'text'),
  ('contact_cnpj', '64.976.735/0001-38', 'contato', 'text'),
  ('footer_copyright', '© 2024 RVGS Elétrica. Todos os direitos reservados.', 'rodape', 'text')
ON CONFLICT (key) DO NOTHING;
