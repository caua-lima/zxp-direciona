-- Tabela de leads da RUMO.
-- Rode isto no SQL Editor do Supabase (uma vez só).

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),

  nome text not null,
  whatsapp text not null,
  email text not null,
  idade text not null,
  peso text not null,
  contexto text,

  -- Prova de consentimento (LGPD). O público inclui menor de idade, então
  -- guardar QUANDO a pessoa autorizou o contato não é burocracia: é o que
  -- sustenta o tratamento do dado caso alguém questione.
  consentimento_em timestamptz not null,

  -- Campos do micro-CRM (fase 2). Já existem pra não precisar de migração.
  status text not null default 'novo'
    check (status in ('novo','contatado','call_marcada','call_feita','fechado','perdido')),
  observacoes text
);

create index if not exists leads_criado_em_idx on public.leads (criado_em desc);
create index if not exists leads_status_idx on public.leads (status);

-- ─────────────────────────────────────────────────────────────────────────
-- Segurança: RLS ligado e NENHUMA policy criada.
--
-- Sem policy, as chaves públicas (anon / authenticated) não leem nem escrevem
-- nada — mesmo que a anon key vaze no navegador, a tabela fica inacessível.
-- A service_role key, usada só no servidor (rota /api/leads), ignora RLS por
-- design e continua funcionando.
--
-- Isso importa aqui: a tabela guarda nome, telefone e um texto pessoal de
-- adolescentes. O padrão seguro é ninguém ver, e abrir exceção só quando
-- houver motivo.
-- ─────────────────────────────────────────────────────────────────────────
alter table public.leads enable row level security;
