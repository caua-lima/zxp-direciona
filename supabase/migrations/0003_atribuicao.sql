-- Migração 0003 — origem do lead (de qual campanha ele veio).
--
-- Quando rodar: uma vez, no SQL Editor do Supabase, se a tabela `leads` já
-- existir (instalação nova? já está em supabase/schema.sql). Idempotente —
-- pode rodar de novo sem erro.
--
-- ⚠️ ORDEM: rode ANTES de publicar o código que grava estas colunas. Sem as
-- colunas, todo cadastro que chegar com origem (utm_* ou referrer) é
-- recusado pelo banco — justamente o tráfego de campanha, o mais valioso.
--
-- Todas nullable, sem default: lead antigo e acesso direto ficam com NULL, e
-- isso é a resposta certa ("origem desconhecida"), não um dado faltando.
--
-- O que NÃO se guarda, de propósito: query string completa, URL do referrer
-- (só o host), gclid/fbclid. Ver src/lib/atribuicao.ts.

alter table public.leads
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists referrer_host text;
