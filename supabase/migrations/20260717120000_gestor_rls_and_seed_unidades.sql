-- ============================================================
-- Fix: tabela unidades só tinha GRANT SELECT — Admin/RH precisam
-- criar/editar/remover unidades pela tela de gestão.
-- ============================================================
GRANT INSERT, UPDATE, DELETE ON public.unidades TO authenticated;

CREATE POLICY "Admin/RH gerenciam unidades" ON public.unidades FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'rh'));

-- ============================================================
-- Fix: gestor precisa editar/excluir ocorrências e colaboradores
-- da própria unidade, não só ver (SELECT).
-- ============================================================

-- Ocorrências: gestor pode UPDATE dentro da própria unidade
CREATE POLICY "Gestor atualiza ocorrências da sua unidade" ON public.ocorrencias FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor')
  AND colaborador_id IN (
    SELECT c.id FROM public.colaboradores c
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.unidade_id = p.unidade_id
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'gestor')
  AND colaborador_id IN (
    SELECT c.id FROM public.colaboradores c
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.unidade_id = p.unidade_id
  )
);

-- Ocorrências: gestor pode DELETE dentro da própria unidade
CREATE POLICY "Gestor deleta ocorrências da sua unidade" ON public.ocorrencias FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor')
  AND colaborador_id IN (
    SELECT c.id FROM public.colaboradores c
    JOIN public.profiles p ON p.id = auth.uid()
    WHERE c.unidade_id = p.unidade_id
  )
);

-- Colaboradores: gestor pode INSERT/UPDATE dentro da própria unidade
-- (a policy de SELECT já existia; esta cobre escrita)
CREATE POLICY "Gestor gerencia colaboradores da sua unidade" ON public.colaboradores FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'gestor')
  AND unidade_id IN (SELECT unidade_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'gestor')
  AND unidade_id IN (SELECT unidade_id FROM public.profiles WHERE id = auth.uid())
);

-- ============================================================
-- Seed: unidades da operação Sodexo / Electrolux Curitiba
-- ON CONFLICT evita duplicar se a migration rodar mais de uma vez
-- ============================================================
INSERT INTO public.unidades (codigo, nome) VALUES
  ('FM',       'Facilities Management'),
  ('FOOD',     'Food Service'),
  ('HARD',     'Hard Services'),
  ('RETAIL',   'Retail'),
  ('COP',      'COP'),
  ('DISC',     'DISC'),
  ('VB',       'VB — São Paulo'),
  ('COP HARD', 'COP Hard Services')
ON CONFLICT (codigo) DO NOTHING;
