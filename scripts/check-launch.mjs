#!/usr/bin/env node
/**
 * Verificação de lançamento — não é uma rota HTTP de propósito. Isso roda
 * localmente (ou em CI), nunca fica publicado: um endpoint público que
 * dissesse "isto está mal configurado" seria um mapa pra atacante, e um que
 * confirmasse segredos configurados vazaria informação sensível.
 *
 * Três categorias, como a auditoria pediu — não são a mesma coisa:
 *   BLOQUEIO   — o cadastro ou a página não funciona direito assim.
 *   AVISO      — funciona, mas devia ser resolvido antes de tráfego pago.
 *   VERIFICAR  — este script não consegue confirmar sozinho (ex: "a
 *                conversão está validada na conta de anúncios?").
 *
 * Uso:
 *   npm run check:launch          (offline: só lê arquivos e .env.local)
 *   npm run check:launch:online   (também consulta o banco e o site publicado)
 *
 * O modo --online faz requisição de rede DE VERDADE (Supabase e a URL
 * pública) e por isso transforma em resultado automático o que no modo
 * offline vira "verificação manual": banco pausado, migração faltando,
 * domínio fora do ar. Nunca imprime chave, URL do banco ou qualquer segredo.
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// import() dinâmico exige URL file:// de verdade no Windows — um caminho
// cru tipo "C:\..." não é aceito.
const importar = (relativo) => import(pathToFileURL(path.join(raiz, relativo)));

const online = process.argv.includes("--online");

// ── Carrega .env.local manualmente (sem dependência nova) ─────────────────
const envLocal = path.join(raiz, ".env.local");
if (existsSync(envLocal)) {
  for (const linha of readFileSync(envLocal, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const bloqueios = [];
const avisos = [];
const verificar = [];
const confirmados = [];

const bloqueio = (msg) => bloqueios.push(msg);
const aviso = (msg) => avisos.push(msg);
const precisaVerificar = (msg) => verificar.push(msg);
const confirmado = (msg) => confirmados.push(msg);

// ── Config de negócio (importa os .ts direto — Node 24 faz type-stripping
// nativo, sem precisar buildar nada) ───────────────────────────────────────
const { mentor, mentorPreenchido } = await importar("src/config/mentor.ts");
const { site, contatoComercial, dadosPrivacidade } =
  await importar("src/config/site.ts");
const { diagnosticoTracking, trackingAtivo } = await importar(
  "src/config/tracking.ts",
);

// ── Mentor / autoridade ─────────────────────────────────────────────────
if (!mentorPreenchido) {
  bloqueio(
    "Mentor não preenchido (src/config/mentor.ts) — a seção de autoridade " +
      "fica escondida da página (correto, ver Authority.tsx), mas a oferta " +
      "não tem quem a sustente até isso ser preenchido de verdade.",
  );
} else if (!mentor.photoUrl) {
  aviso(
    "Mentor preenchido, mas sem foto (photoUrl em src/config/mentor.ts) — " +
      "a seção aparece com um placeholder de foto vazio.",
  );
}

// ── Contato comercial ───────────────────────────────────────────────────
if (!contatoComercial.whatsapp) {
  aviso(
    "WhatsApp comercial não preenchido (src/config/site.ts) — as telas de " +
      "sucesso/falha do formulário não oferecem um jeito de falar com vocês " +
      "além do número que a própria pessoa digitou.",
  );
}

// ── Domínio público ──────────────────────────────────────────────────────
const dominiosDeExemplo = ["exemplo.com", "seudominio", "SEU-PROJETO", "example.com"];
if (dominiosDeExemplo.some((d) => site.urlPublica.includes(d))) {
  bloqueio(
    `urlPublica em src/config/site.ts ainda é um placeholder ("${site.urlPublica}") — canonical/OG vão apontar pra um domínio que não existe.`,
  );
} else if (site.urlPublica.includes("vercel.app")) {
  aviso(
    `urlPublica ainda é o domínio padrão da Vercel (${site.urlPublica}) — funciona, mas considere registrar um domínio próprio antes de anunciar.`,
  );
}
if (!online) {
  precisaVerificar(
    `Confirme que ${site.urlPublica} resolve e serve a página (ou rode com --online).`,
  );
}

// ── Privacidade ──────────────────────────────────────────────────────────
const privacidadeIncompleta =
  !dadosPrivacidade.controlador || !dadosPrivacidade.canalContato;
if (privacidadeIncompleta) {
  aviso(
    "Dados de privacidade incompletos (src/config/site.ts: controlador/" +
      "canalContato) — a página de privacidade ainda não existe no site; " +
      "isto é pré-requisito pra criá-la de forma verdadeira, não invente.",
  );
}

// ── Supabase (captação) ─────────────────────────────────────────────────
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  bloqueio(
    "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes — /api/leads responde 503 pra todo mundo, nenhum cadastro é salvo.",
  );
} else if (!online) {
  precisaVerificar(
    "Supabase configurado — confirme que o projeto está ATIVO (não pausado) e que TODAS as migrações em supabase/migrations/ foram aplicadas (ou rode o modo online, que confere isso).",
  );
}

// ── Resend (notificação por e-mail — opcional) ──────────────────────────
if (!process.env.RESEND_API_KEY || !process.env.LEAD_NOTIFY_TO || !process.env.LEAD_NOTIFY_FROM) {
  aviso(
    "Notificação por e-mail desligada (RESEND_API_KEY/LEAD_NOTIFY_TO/LEAD_NOTIFY_FROM incompletos em .env.local) — cadastro funciona normalmente, você só não é avisado.",
  );
} else {
  precisaVerificar(
    "Resend configurado — confirme que o domínio de LEAD_NOTIFY_FROM está verificado na conta Resend (senão o envio falha silenciosamente, só logado no servidor).",
  );
}

// ── Rate limit (opcional) ───────────────────────────────────────────────
if (!process.env.RATE_LIMIT_PEPPER) {
  aviso(
    "RATE_LIMIT_PEPPER não definido — rate limiting funciona mesmo assim, só com hash de IP um pouco mais fraco.",
  );
}

// ── Medição e anúncios (tudo opcional, desligado por padrão) ─────────────
for (const problema of diagnosticoTracking.problemas) aviso(problema);

if (diagnosticoTracking.conflitoGtmComDiretos) {
  aviso(
    "NEXT_PUBLIC_GTM_ID e IDs diretos (GA4/Meta) estão todos definidos — o GTM vira o único dono das tags e os IDs diretos são IGNORADOS de propósito, pra não contar cada evento em dobro. Remova os diretos se for isso mesmo que você quer.",
  );
}

if (!trackingAtivo) {
  aviso(
    "Nenhuma medição configurada (NEXT_PUBLIC_GA4_MEASUREMENT_ID / NEXT_PUBLIC_META_PIXEL_ID / NEXT_PUBLIC_GTM_ID). O site funciona, mas você não vai conseguir otimizar campanha por cadastro. A origem (utm_*) continua sendo gravada em cada lead.",
  );
} else {
  if (privacidadeIncompleta) {
    bloqueio(
      "Medição ligada, mas os dados de privacidade estão incompletos (src/config/site.ts). Coletar dado de visitante (adolescentes inclusive) sem dizer quem é o responsável nem como exercer direitos não é algo pra publicar.",
    );
  }
  precisaVerificar(
    "Medição configurada NO CÓDIGO não é o mesmo que evento validado NA CONTA, nem que conversão usada NA CAMPANHA. Valide generate_lead no GA4 (Admin > DebugView) e/ou no Meta (Gerenciador de Eventos > Testar eventos); depois escolha UMA conversão primária de cadastro no Google Ads (importada do GA4, não as duas). Este script não acessa suas contas.",
  );
  precisaVerificar(
    "NEXT_PUBLIC_* é embutido no build: confirme que os mesmos IDs estão em Vercel > Environment Variables e que houve um novo deploy depois de defini-los.",
  );
}

// ── Online (só com --online) ─────────────────────────────────────────────
// Colunas que o código grava. Se o banco não tem alguma, o cadastro falha
// com 502 — foi exatamente o que aconteceu antes de a migração 0003 rodar.
const COLUNAS_LEADS = [
  "id", "nome", "whatsapp", "email", "idade", "peso", "contexto",
  "consentimento_em", "confirmacao_responsavel", "status", "observacoes",
  "idempotency_key", "utm_source", "utm_medium", "utm_campaign",
  "utm_content", "utm_term", "referrer_host",
];

async function verificarOnline() {
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && chave) {
    const cabecalhos = { apikey: chave, Authorization: `Bearer ${chave}` };
    try {
      // limit=0: só valida que a tabela e TODAS as colunas existem, sem ler dado.
      const leads = await fetch(
        `${url}/rest/v1/leads?select=${COLUNAS_LEADS.join(",")}&limit=0`,
        { headers: cabecalhos, signal: AbortSignal.timeout(10000) },
      );
      if (leads.ok) {
        confirmado("Supabase ativo; tabela leads tem todas as colunas que o código grava.");
      } else {
        const corpo = await leads.json().catch(() => ({}));
        bloqueio(
          `Banco responde, mas a tabela leads não bate com o código (HTTP ${leads.status}: ${String(corpo.message ?? "sem detalhe").slice(0, 140)}). Rode as migrações de supabase/migrations/ em ordem.`,
        );
      }

      const limite = await fetch(`${url}/rest/v1/rate_limit_hits?select=bucket&limit=0`, {
        headers: cabecalhos,
        signal: AbortSignal.timeout(10000),
      });
      if (limite.ok) confirmado("Tabela rate_limit_hits existe.");
      else
        aviso(
          "Tabela rate_limit_hits ausente — o rate limit falha aberto (não bloqueia ninguém). Rode a migração 0002.",
        );
    } catch (erro) {
      bloqueio(
        `Não consegui falar com o Supabase (${erro.cause?.code ?? erro.name}). Projeto pausado, deletado ou URL errada? Confira no dashboard.`,
      );
    }
  }

  try {
    const resposta = await fetch(site.urlPublica, {
      signal: AbortSignal.timeout(10000),
      redirect: "follow",
    });
    if (resposta.ok) confirmado(`${site.urlPublica} respondeu HTTP ${resposta.status}.`);
    else bloqueio(`${site.urlPublica} respondeu HTTP ${resposta.status}.`);
  } catch (erro) {
    bloqueio(`${site.urlPublica} não respondeu (${erro.cause?.code ?? erro.name}).`);
  }
}

if (online) await verificarOnline();

// ── Relatório ────────────────────────────────────────────────────────────
function secao(titulo, itens, vazio) {
  console.log(`\n${titulo} (${itens.length})`);
  if (itens.length === 0) {
    console.log(`  ${vazio}`);
    return;
  }
  for (const item of itens) console.log(`  - ${item}`);
}

console.log("═".repeat(70));
console.log(`Verificação de lançamento — ZXP Direciona${online ? "  [online]" : ""}`);
console.log("═".repeat(70));

if (online) secao("🟢 CONFIRMADO agora, por requisição real", confirmados, "Nada confirmado.");
secao("🔴 BLOQUEIA tráfego", bloqueios, "Nenhum. 🎉");
secao("🟡 AVISO — resolva antes de anunciar", avisos, "Nenhum.");
secao("🔵 VERIFICAÇÃO MANUAL — este script não consegue confirmar", verificar, "—");

console.log("\n" + "═".repeat(70));
if (bloqueios.length > 0) {
  console.log(`❌ ${bloqueios.length} bloqueio(s). Não ligue tráfego pago ainda.`);
  process.exit(1);
} else {
  console.log("✅ Sem bloqueios conhecidos. Ainda assim, resolva os avisos e confirme as verificações manuais antes de anunciar.");
  process.exit(0);
}
