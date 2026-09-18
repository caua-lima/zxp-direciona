import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { site } from "@/config/site";

/**
 * Testa o HTML que o Next de fato gerou (`next build`) — não o JSX. É o que o
 * visitante e o Google recebem antes de qualquer JavaScript rodar.
 *
 * Sem `npm run build` antes, estes testes são pulados (com o motivo à vista),
 * em vez de falhar por um arquivo que ainda não existe.
 */
const caminho = path.join(process.cwd(), ".next", "server", "app", "index.html");
const existe = existsSync(caminho);
const opcoes = existe ? {} : { skip: "rode `npm run build` antes (não há .next/server/app/index.html)" };
const html = existe ? readFileSync(caminho, "utf8") : "";

describe("HTML gerado pelo build", opcoes, () => {
  test("todo link de âncora (#algo) aponta pra um id que existe", () => {
    const alvos = new Set([...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]));
    assert.ok(alvos.size >= 2, "esperava ao menos as âncoras principais");
    for (const alvo of alvos) {
      assert.ok(
        new RegExp(`\\sid="${alvo}"`).test(html),
        `href="#${alvo}" não tem um elemento com id="${alvo}"`,
      );
    }
  });

  test("os CTAs principais levam ao formulário e estão marcados pra medição", () => {
    for (const posicao of ["header", "hero", "meio", "mobile_fixo"]) {
      const re = new RegExp(`<a[^>]*href="#formulario"[^>]*data-cta="${posicao}"|<a[^>]*data-cta="${posicao}"[^>]*href="#formulario"`);
      assert.match(html, re, `faltou o CTA "${posicao}" apontando pro formulário`);
    }
  });

  test("nenhum placeholder de conteúdo chega ao visitante", () => {
    for (const proibido of ["[Nome do mentor]", "[Cargo", "[Bio curta", "[Credencial", "Foto aqui", "aqui]"]) {
      assert.ok(!html.includes(proibido), `placeholder publicado: ${proibido}`);
    }
  });

  test("idioma, título, canonical e descrição corretos", () => {
    assert.match(html, /<html[^>]*lang="pt-BR"/);
    assert.match(html, /<title>ZXP Direciona — Mentoria de Direção Profissional<\/title>/);
    assert.ok(html.includes(`rel="canonical" href="${site.urlPublica}`), "canonical fora de sincronia com site.urlPublica");
    assert.match(html, /<meta name="description" content="[^"]{60,}"/);
  });

  test("um único h1", () => {
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
  });

  test("todo campo do formulário tem um <label> associado", () => {
    const ids = [...html.matchAll(/<(?:input|select|textarea)[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(ids.length >= 7, "esperava os campos do formulário");
    for (const id of ids) {
      assert.match(html, new RegExp(`for="${id}"`), `campo #${id} sem label`);
    }
  });

  test("link de pular pro conteúdo existe", () => {
    assert.match(html, /Pular para o formulário/);
  });

  test("build padrão (sem IDs) não carrega nenhum script de terceiro nem mostra UI de consentimento", () => {
    for (const terceiro of ["googletagmanager", "google-analytics", "fbevents", "connect.facebook"]) {
      assert.ok(!html.includes(terceiro), `referência a terceiro no HTML: ${terceiro}`);
    }
    assert.ok(!html.includes("Preferências de medição"));
    assert.ok(!html.includes("Medição e anúncios"));
  });

  test("nenhuma chave secreta ou variável privada aparece no HTML", () => {
    for (const segredo of ["SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "service_role"]) {
      assert.ok(!html.includes(segredo), `vazou: ${segredo}`);
    }
  });
});
