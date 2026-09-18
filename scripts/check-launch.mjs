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
 *   VERIFICAR  — este script não consegue confirmar sozinho (ex: "o domínio
 *                realmente resolve?", "testou um lead de verdade?").
 *
 * Uso: npm run check:launch
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// import() dinâmico exige URL file:// de verdade no Windows — um caminho
// cru tipo "C:\..." não é aceito.
const importar = (relativo) => import(pathToFileURL(path.join(raiz, relativo)));

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

function bloqueio(msg) {
  bloqueios.push(msg);
}
function aviso(msg) {
  avisos.push(msg);
}
function precisaVerificar(msg) {
  verificar.push(msg);
}

// ── Config de negócio (importa os .ts direto — Node 24 faz type-stripping
// nativo, sem precisar buildar nada) ───────────────────────────────────────
const { mentor, mentorPreenchido } = await importar("src/config/mentor.ts");
const { site, contatoComercial, dadosPrivacidade } =
  await importar("src/config/site.ts");

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
precisaVerificar(
  `Confirme que ${site.urlPublica} resolve e serve a página (curl/navegador) — este script não faz requisição de rede.`,
);

// ── Privacidade ──────────────────────────────────────────────────────────
if (!dadosPrivacidade.controlador || !dadosPrivacidade.canalContato) {
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
} else {
  precisaVerificar(
    "Supabase configurado — confirme que o projeto está ATIVO (não pausado) e que as migrações em supabase/migrations/ foram todas aplicadas (npm run check:launch não consulta o banco).",
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
console.log("Verificação de lançamento — ZXP Direciona");
console.log("═".repeat(70));

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
