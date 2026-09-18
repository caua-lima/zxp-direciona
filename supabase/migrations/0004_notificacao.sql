-- Migração 0004 — controle do aviso por e-mail (quem já foi avisado).
--
-- Quando rodar: uma vez, no SQL Editor do Supabase, se a tabela `leads` já
-- existir. Instalação nova? Já está em supabase/schema.sql. Idempotente.
--
-- Diferente da 0003, esta NÃO é pré-requisito pra o cadastro funcionar: o
-- INSERT não toca nestas colunas. Sem elas, o lead é salvo normalmente e só
-- o AVISO por e-mail falha (fica registrado no log da função). Rode antes de
-- ligar o Resend.
--
-- notificado_em                — quando o e-mail de verdade saiu. NULL = ainda
--                                não avisamos (ou o aviso falhou).
-- notificacao_reivindicada_em  — "alguém está enviando isto agora" (lease de
--                                5 min). Impede dois envios simultâneos do
--                                mesmo lead e se libera sozinha se a função
--                                morrer no meio. Ver src/lib/notificacao.ts.
--
-- Leads que já existem ficam com NULL nas duas — de propósito, sem backfill:
-- marcar como "notificado" um lead que nunca foi avisado seria mentir. O
-- script `npm run notificacoes:reprocessar` lista e (só com --enviar) avisa,
-- limitado a uma janela de dias, então ligar o Resend não dispara e-mail de
-- cadastro antigo.

alter table public.leads
  add column if not exists notificado_em timestamptz,
  add column if not exists notificacao_reivindicada_em timestamptz;
