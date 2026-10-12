-- Tabela de leads da ZXP Direciona.
--
-- Instalação NOVA (tabela ainda não existe): rode este arquivo inteiro no SQL
-- Editor do Supabase, uma vez.
--
-- Tabela JÁ EXISTE (você já tem leads gravados): NÃO rode este arquivo de
-- novo — `create table if not exists` não adiciona colunas numa tabela que já
-- existe. Rode as migrações em `supabase/migrations/`, em ordem, uma vez cada.

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

  -- Só é true quando faz sentido (idade = "16 a 17"); pra 18+ fica sempre
  -- false e não significa nada — não é assinatura de responsável, é a
  -- confirmação que a PESSOA que preencheu marcou no formulário.
  confirmacao_responsavel boolean not null default false,

  -- Campos do micro-CRM (fase 2). Já existem pra não precisar de migração.
  status text not null default 'novo'
    check (status in ('novo','contatado','call_marcada','call_feita','fechado','perdido')),
  observacoes text,

  -- Chave gerada pelo cliente por tentativa de submissão — permite reenviar
  -- com segurança depois de uma falha, sem duplicar o lead. NULL é normal
  -- (cliente sem a chave, ou lead antigo); Postgres não considera NULL
  -- igual a NULL, então isso nunca cria falso conflito entre leads sem chave.
  idempotency_key text,

  -- Origem da campanha (ver src/lib/atribuicao.ts). NULL = veio direto ou é
  -- lead antigo. Só o host do referrer, nunca a URL; só utm_*, nunca a query
  -- inteira.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer_host text,

  -- Controle do aviso por e-mail (ver src/lib/notificacao.ts). notificado_em
  -- NULL = ainda não avisamos; a segunda coluna é uma lease de 5 min que
  -- impede dois envios simultâneos do mesmo lead.
  notificado_em timestamptz,
  notificacao_reivindicada_em timestamptz
);

create index if not exists leads_criado_em_idx on public.leads (criado_em desc);
create index if not exists leads_status_idx on public.leads (status);
create unique index if not exists leads_idempotency_key_idx on public.leads (idempotency_key);

-- Rate limit por IP pseudonimizado (hash, nunca texto puro) — ver
-- src/lib/rateLimit.ts.
create table if not exists public.rate_limit_hits (
  bucket text not null,
  ocorrido_em timestamptz not null default now()
);

create index if not exists rate_limit_hits_bucket_idx on public.rate_limit_hits (bucket, ocorrido_em);
alter table public.rate_limit_hits enable row level security;

-- Contar e registrar a tentativa numa transação só (ver migração 0005 e
-- src/lib/rateLimit.ts).
create or replace function public.registrar_tentativa(
  p_bucket text,
  p_janela_segundos integer,
  p_limite integer
)
returns table (permitido boolean, tentativas integer, aguardar_segundos integer)
language plpgsql
security invoker
set search_path = public
as $
declare
  v_desde timestamptz := now() - make_interval(secs => p_janela_segundos);
  v_total integer;
  v_mais_antiga timestamptz;
begin
  -- Trava só este bucket, só até o fim da transação: buckets diferentes
  -- (pessoas diferentes) não esperam uns pelos outros.
  perform pg_advisory_xact_lock(hashtextextended(p_bucket, 0));

  -- Expiração: o que saiu da janela deste bucket vai embora agora, e uma
  -- fatia pequena do resto da tabela também. Sem cron e sem crescer pra sempre.
  delete from public.rate_limit_hits
   where bucket = p_bucket and ocorrido_em < v_desde;

  delete from public.rate_limit_hits
   where ctid in (
     select ctid from public.rate_limit_hits
      where ocorrido_em < now() - interval '1 day'
      limit 200
   );

  select count(*), min(ocorrido_em)
    into v_total, v_mais_antiga
    from public.rate_limit_hits
   where bucket = p_bucket and ocorrido_em >= v_desde;

  if v_total >= p_limite then
    return query select
      false,
      v_total,
      greatest(1, ceil(extract(epoch from (v_mais_antiga + make_interval(secs => p_janela_segundos) - now())))::integer);
    return;
  end if;

  insert into public.rate_limit_hits (bucket) values (p_bucket);
  return query select true, v_total + 1, 0;
end;
$;

-- Só o servidor (service_role) chama. Visitante nenhum tem acesso à função,
-- do mesmo jeito que não tem à tabela.
revoke all on function public.registrar_tentativa(text, integer, integer) from public;
revoke all on function public.registrar_tentativa(text, integer, integer) from anon, authenticated;
grant execute on function public.registrar_tentativa(text, integer, integer) to service_role;

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
