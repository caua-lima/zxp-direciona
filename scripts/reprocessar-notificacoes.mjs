#!/usr/bin/env node
/**
 * Reenvia o aviso por e-mail dos leads que foram salvos mas NÃO foram
 * avisados (o Resend estava fora, a função morreu no meio, ou ele ainda nem
 * estava configurado quando o lead chegou).
 *
 * Uso:
 *   npm run notificacoes:reprocessar                  lista o que seria enviado (dry-run)
 *   npm run notificacoes:reprocessar -- --enviar      envia de verdade
 *   npm run notificacoes:reprocessar -- --dias 7      janela em dias (padrão 3, máx. 30)
 *
 * Por que é seguro rodar quantas vezes quiser:
 *   - o padrão é DRY-RUN: sem --enviar, nada sai;
 *   - a janela de dias existe pra ligar o Resend NÃO disparar e-mail de todo
 *     cadastro antigo de uma vez;
 *   - usa a mesma reivindicação atômica da rota (src/lib/notificacao.ts): um
 *     lead já avisado, ou em envio por outra função agora, é pulado;
 *   - o Idempotency-Key do Resend (lead-<id>, retido 24h) impede o e-mail
 *     duplicado mesmo se a marcação de "avisado" tiver falhado antes.
 *
 * Não imprime nome, telefone nem e-mail de ninguém: só id e data.
 * Precisa das variáveis do Supabase e do Resend (RESEND_API_KEY, LEAD_NOTIFY_TO,
 * LEAD_NOTIFY_FROM) no .env.local.
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const envLocal = path.join(raiz, ".env.local");
if (existsSync(envLocal)) {
  for (const linha of readFileSync(envLocal, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

// Sai por process.exitCode, nunca por process.exit(): no Windows, chamar
// exit() enquanto uma conexão de rede ainda está fechando aborta o processo
// ("Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)") e um sucesso vira
// código de saída de crash.
async function principal() {
  const argumentos = process.argv.slice(2);
  const enviar = argumentos.includes("--enviar");
  const indiceDias = argumentos.indexOf("--dias");
  const dias = indiceDias >= 0 ? Number(argumentos[indiceDias + 1]) : 3;

  if (!Number.isInteger(dias) || dias < 1 || dias > 30) {
    console.error("--dias precisa ser um inteiro entre 1 e 30.");
    return 1;
  }

  const { supabaseFetch, supabaseConfigurado, resumoDoErro } = await import("@/lib/supabase");
  const { notificarLead, emailConfigurado } = await import("@/lib/notificacao");

  if (!supabaseConfigurado()) {
    console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes no .env.local.");
    return 1;
  }

  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();
  const resposta = await supabaseFetch(
    `/rest/v1/leads?notificado_em=is.null&criado_em=gte.${encodeURIComponent(desde)}` +
      `&select=id,criado_em&order=criado_em.asc&limit=200`,
  );

  if (!resposta.ok) {
    console.error(`Não consegui listar os leads: ${await resumoDoErro(resposta)}`);
    console.error("Se o erro fala em coluna inexistente, rode a migração supabase/migrations/0004_notificacao.sql.");
    return 1;
  }

  const pendentes = await resposta.json();
  console.log(`Leads sem aviso nos últimos ${dias} dia(s): ${pendentes.length}`);
  for (const lead of pendentes) console.log(`  - ${lead.id}  (${lead.criado_em})`);

  if (pendentes.length === 0) return 0;

  if (!enviar) {
    console.log("\nDRY-RUN: nada foi enviado. Rode com --enviar para avisar de verdade.");
    return 0;
  }

  if (!emailConfigurado()) {
    console.error("\nRESEND_API_KEY / LEAD_NOTIFY_TO / LEAD_NOTIFY_FROM incompletos — não há como enviar.");
    return 1;
  }

  const contagem = { enviada: 0, ja_notificada_ou_em_andamento: 0, erro: 0 };
  for (const lead of pendentes) {
    try {
      const resultado = await notificarLead({ id: lead.id });
      contagem[resultado === "enviada" ? "enviada" : "ja_notificada_ou_em_andamento"]++;
    } catch (erro) {
      contagem.erro++;
      // Só o tipo do erro — a mensagem pode citar dados.
      console.error(`  falhou ${lead.id}: ${erro instanceof Error ? erro.name : "erro"}`);
    }
    // O Resend limita a taxa de envio; uma folga curta evita 429.
    await new Promise((r) => setTimeout(r, 600));
  }

  console.log(
    `\nEnviados: ${contagem.enviada} · pulados (já avisados/em andamento): ${contagem.ja_notificada_ou_em_andamento} · com erro: ${contagem.erro}`,
  );
  return contagem.erro > 0 ? 1 : 0;
}

process.exitCode = await principal();
