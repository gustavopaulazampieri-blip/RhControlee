-- Amplia o registro de ocorrências com a categoria "Outros" e jornada de hora extra.
ALTER TYPE public.ocorrencia_tipo ADD VALUE IF NOT EXISTS 'outros';

ALTER TABLE public.ocorrencias
  ADD COLUMN IF NOT EXISTS horario_entrada TIME,
  ADD COLUMN IF NOT EXISTS horario_saida TIME;

COMMENT ON COLUMN public.ocorrencias.horario_entrada IS 'Horário inicial da hora extra';
COMMENT ON COLUMN public.ocorrencias.horario_saida IS 'Horário final da hora extra';
