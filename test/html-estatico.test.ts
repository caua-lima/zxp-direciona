import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { dadosPrivacidade, site } from "@/config/site";

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

  test("o método e a lista de entregas não aparecem na página (são da conversa inicial)", () => {
    const proibidos = [
      "Método APE", ">Analisar<", ">Pensar<", ">Executar<", "Você sai com",
      "O que a mentoria inclui", "Duas conversas individuais", "duas conversas individuais",
      "Plano de ação", "plano de ação", "treinadora comportamental", "ideia de empreendimento",
    ];
    for (const p of proibidos) assert.ok(!html.includes(p), `voltou pra página: ${p}`);
  });

  test("a página não afirma preço, duração nem prazo que ninguém confirmou", () => {
    assert.ok(!/R\$\s?\d/.test(html), "preço no HTML");
    assert.ok(!/\d+\s*(meses|mês)/i.test(html), "duração afirmada no HTML");
    assert.ok(!/em até \d+|responderemos em/i.test(html), "prazo de retorno afirmado no HTML");
  });

  test("a seção 'Como funciona' existe uma vez e o hero aponta pra ela", () => {
    assert.equal((html.match(/\sid="como-funciona"/g) ?? []).length, 1);
    assert.match(html, /href="#como-funciona"/);
  });

  test("idioma, título, canonical e descrição corretos", () => {
    assert.match(html, /<html[^>]*lang="pt-BR"/);
    assert.match(html, /<title>ZXP Direciona — Mentoria de Direção Profissional<\/title>/);
    assert.ok(html.includes(`rel="canonical" href="${site.urlPublica}`), "canonical fora de sincronia com site.urlPublica");
    // Comparar só com site.urlPublica passava mesmo com o domínio errado na
    // config. Este é o domínio de publicação pretendido; mudou de domínio?
    // Mude aqui de propósito.
    assert.equal(site.urlPublica, "https://zxp-direciona.vercel.app");
    assert.ok(html.includes('property="og:url" content="https://zxp-direciona.vercel.app'), "og:url fora do domínio de publicação");
    assert.ok(!html.includes("rumo-lp"), "domínio antigo ainda no HTML");
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

  test("campos obrigatórios declaram isso pra leitor de tela, e o relato tem ajuda, limites e contador", () => {
    for (const id of ["nome", "idade", "whatsapp", "email", "peso", "contexto", "consentimento"]) {
      const tag = html.match(new RegExp(`<(?:input|select|textarea)[^>]*\\sid="${id}"[^>]*>`))?.[0] ?? "";
      assert.match(tag, /\srequired(=""|\s|>)/, `#${id} sem required`);
      assert.match(tag, /aria-required="true"/, `#${id} sem aria-required`);
    }
    const relato = html.match(/<textarea[^>]*\sid="contexto"[^>]*>/)?.[0] ?? "";
    assert.match(relato, /minLength="60"|minlength="60"/);
    assert.match(relato, /maxLength="1500"|maxlength="1500"/);
    assert.match(relato, /aria-describedby="contexto-ajuda contexto-nota contexto-contador"/);
    for (const id of ["contexto-ajuda", "contexto-nota", "contexto-contador"]) {
      assert.match(html, new RegExp(`\\sid="${id}"`), `faltou #${id}`);
    }
  });

  test("o WhatsApp de depois do envio não está no HTML inicial; só a contingência sem JS", () => {
    assert.ok(!html.includes('data-whatsapp="sucesso"'), "botão de sucesso antes de qualquer envio");
    const links = [...html.matchAll(/href="(https:\/\/wa\.me\/[^"]+)"/g)].map((m) => m[1]);
    assert.equal(links.length, 1, "esperava só o link de contingência do <noscript>");
    assert.match(html, /<noscript>[\s\S]*wa\.me[\s\S]*<\/noscript>/);
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

const caminhoPrivacidade = path.join(process.cwd(), ".next", "server", "app", "privacidade.html");
const existePrivacidade = existsSync(caminhoPrivacidade);
const htmlPrivacidade = existePrivacidade ? readFileSync(caminhoPrivacidade, "utf8") : "";

describe(
  "Página de privacidade gerada pelo build",
  existePrivacidade ? {} : { skip: "sem .next/server/app/privacidade.html (rode `npm run build`; a página só existe com dadosPrivacidade preenchido)" },
  () => {
    test("diz quem é o responsável e dá o canal de contato de site.ts", () => {
      assert.ok(dadosPrivacidade.controlador && dadosPrivacidade.canalContato);
      assert.ok(htmlPrivacidade.includes(dadosPrivacidade.controlador));
      assert.ok(htmlPrivacidade.includes(`mailto:${dadosPrivacidade.canalContato}`));
    });

    test("tem um único h1, canonical próprio e nenhum placeholder", () => {
      assert.equal((htmlPrivacidade.match(/<h1[\s>]/g) ?? []).length, 1);
      assert.ok(htmlPrivacidade.includes(`rel="canonical" href="${site.urlPublica}/privacidade"`));
      assert.ok(!/\[[A-Z][^\]]{2,40}\]/.test(htmlPrivacidade.replace(/<script[\s\S]*?<\/script>/g, "")), "placeholder na página");
    });

    test("não promete o que ninguém verificou", () => {
      for (const proibido of ["100% segur", "totalmente segur", "conformidade total", "nunca compartilh", "não vendemos"]) {
        assert.ok(!htmlPrivacidade.toLowerCase().includes(proibido), `promessa não verificável: ${proibido}`);
      }
    });

    test("a página principal aponta pra ela (rodapé e formulário)", () => {
      assert.ok((html.match(/href="\/privacidade"/g) ?? []).length >= 2);
    });
  },
);
