-- Migração 0002 — idempotência de cadastro + rate limiting.
--
-- Quando rodar: uma vez, no SQL Editor do Supabase, se a tabela `leads` já
-- existir no seu projeto (instalação nova? não precisa — já está em
-- supabase/schema.sql). Idempotente — pode rodar mais de uma vez sem erro.

-- Chave gerada pelo cliente, uma por tentativa de submissão. NULL pra leads
-- antigos (gravados antes desta coluna existir) e pra clientes que não
-- mandarem a chave (degrada de forma segura, só sem proteção de duplicata).
-- Postgres não considera NULL igual a NULL, então múltiplos leads sem chave
-- não colidem entre si — só previne duplicata quando a MESMA chave chega
-- duas vezes.
alter table public.leads
  add column if not exists idempotency_key text;

create unique index if not exists leads_idempotency_key_idx
  on public.leads (idempotency_key);

-- Tabela de rate limit. `bucket` é um hash (SHA-256, com pepper opcional) de
-- IP+data — nunca guarda o IP em texto puro. Cada linha "expira" sozinha:
-- passada a janela de tempo, ela para de contar (e é apagada oportunistamente
-- pela própria rota, sem precisar de cron).
create table if not exists public.rate_limit_hits (
  bucket text not null,
  ocorrido_em timestamptz not null default now()
);

create index if not exists rate_limit_hits_bucket_idx
  on public.rate_limit_hits (bucket, ocorrido_em);

alter table public.rate_limit_hits enable row level security;
-- Sem policy, de propósito — mesmo padrão da tabela `leads`: só o servidor,
-- com a service_role, acessa.
