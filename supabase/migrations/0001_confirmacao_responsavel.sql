-- Migração 0001 — confirmação de responsável para menores de idade.
--
-- Quando rodar: uma vez, no SQL Editor do Supabase, se a tabela `leads` já
-- existir no seu projeto (instalação nova? não precisa — já está em
-- supabase/schema.sql).
--
-- O que muda: adiciona a coluna `confirmacao_responsavel`. Idempotente — pode
-- rodar mais de uma vez sem erro (`if not exists`).

alter table public.leads
  add column if not exists confirmacao_responsavel boolean not null default false;

-- Nota sobre dados antigos: a faixa de idade "16 a 18" (usada antes desta
-- mudança) misturava menor e maior de idade num valor só. Leads antigos com
-- essa faixa NÃO são reclassificados aqui — não dá pra saber, olhando só o
-- texto salvo, se a pessoa tinha 16, 17 ou 18 anos. Eles ficam com o valor
-- histórico "16 a 18" (ambíguo, mas verdadeiro) e sem confirmação de
-- responsável (correto: essa confirmação não existia quando foram salvos).
-- Não escreva um UPDATE reinterpretando esses registros.
