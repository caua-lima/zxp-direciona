-- Migração 0005 — limite de envios atômico.
--
-- Quando rodar: uma vez, no SQL Editor do Supabase. Idempotente (pode rodar de
-- novo). É ADITIVA: não altera nem apaga dado nenhum de `leads`.
--
-- Por que existe: o limite contava as tentativas (uma requisição) e só depois
-- registrava a nova (outra requisição). Entre as duas, várias chamadas
-- simultâneas liam o mesmo total e todas passavam. Aqui contar e registrar
-- acontecem dentro de UMA transação, com uma trava por bucket: a segunda
-- chamada só conta depois que a primeira registrou.
--
-- ORDEM: pode rodar antes OU depois do deploy. Enquanto a função não existir,
-- o código usa o caminho antigo (não atômico, mas com status verificado) e o
-- `npm run check:launch:online` avisa.
--
-- Desfazer (rollback):
--   drop function if exists public.registrar_tentativa(text, integer, integer);

create or replace function public.registrar_tentativa(
  p_bucket text,
  p_janela_segundos integer,
  p_limite integer
)
returns table (permitido boolean, tentativas integer, aguardar_segundos integer)
language plpgsql
security invoker
set search_path = public
as $$
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
$$;

-- Só o servidor (service_role) chama. Visitante nenhum tem acesso à função,
-- do mesmo jeito que não tem à tabela.
revoke all on function public.registrar_tentativa(text, integer, integer) from public;
revoke all on function public.registrar_tentativa(text, integer, integer) from anon, authenticated;
grant execute on function public.registrar_tentativa(text, integer, integer) to service_role;
