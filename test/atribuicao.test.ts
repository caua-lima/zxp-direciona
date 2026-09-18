import { test, describe, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  sanitizarAtribuicao,
  atribuicaoParaColunas,
  capturarAtribuicao,
  limparTexto,
  atribuicaoVazia,
} from "@/lib/atribuicao";

describe("sanitizarAtribuicao — o servidor não confia no cliente", () => {
  test("só a allowlist passa; qualquer outra chave (inclusive dado pessoal) é descartada", () => {
    const s = sanitizarAtribuicao({
      utm_source: "instagram",
      utm_campaign: "set2026",
      email: "fulana@exemplo.com",
      nome: "Fulana",
      whatsapp: "11912345678",
      gclid: "abc",
      fbclid: "def",
      query: "?tudo=aqui",
    });
    assert.deepEqual(Object.keys(s).sort(), [
      "referrer_host", "utm_campaign", "utm_content", "utm_medium", "utm_source", "utm_term",
    ]);
    assert.equal(s.utm_source, "instagram");
    assert.equal(s.utm_campaign, "set2026");
    assert.ok(!JSON.stringify(s).includes("fulana"));
    assert.ok(!JSON.stringify(s).includes("abc"));
  });

  test("valor limpo: sem caractere de controle nem quebra de linha, no máximo 100", () => {
    assert.equal(limparTexto("abc\ndef\x00\x1fghi\x7f"), "abcdefghi");
    assert.equal(limparTexto("x".repeat(500))?.length, 100);
    assert.equal(limparTexto("   "), null);
    assert.equal(limparTexto(""), null);
  });

  test("tipo errado vira null, nunca exceção", () => {
    for (const v of [123, {}, [], null, undefined, true]) {
      assert.equal(limparTexto(v), null);
    }
  });

  test("acento e emoji são preservados", () => {
    assert.equal(limparTexto("promoção 🎓"), "promoção 🎓");
  });

  test("referrer_host aceita hostname, normaliza caixa e REJEITA URL/caminho/query", () => {
    assert.equal(sanitizarAtribuicao({ referrer_host: "L.Instagram.com" }).referrer_host, "l.instagram.com");
    assert.equal(sanitizarAtribuicao({ referrer_host: "https://l.instagram.com/?u=fulana@x.com" }).referrer_host, null);
    assert.equal(sanitizarAtribuicao({ referrer_host: "site.com/perfil/fulana" }).referrer_host, null);
    assert.equal(sanitizarAtribuicao({ referrer_host: "site.com?q=1" }).referrer_host, null);
    assert.equal(sanitizarAtribuicao({ referrer_host: "-invalido.com" }).referrer_host, null);
  });

  test("entrada que não é objeto vira tudo null", () => {
    for (const entrada of [null, undefined, "texto", 42, [1, 2], true]) {
      assert.deepEqual(sanitizarAtribuicao(entrada), atribuicaoVazia);
    }
  });
});

describe("atribuicaoParaColunas", () => {
  test("só manda coluna que tem valor (acesso direto não escreve nada)", () => {
    assert.deepEqual(atribuicaoParaColunas(sanitizarAtribuicao({ utm_source: "meta" })), {
      utm_source: "meta",
    });
    assert.deepEqual(atribuicaoParaColunas(atribuicaoVazia), {});
  });
});

describe("capturarAtribuicao — lê só o que vale da visita atual", () => {
  const g = globalThis as Record<string, unknown>;

  function simularNavegador(search: string, referrer: string, hostname = "site.com") {
    g.window = { location: { search, hostname } };
    g.document = { referrer };
  }

  afterEach(() => {
    delete g.window;
    delete g.document;
  });

  test("no servidor (sem window) devolve vazio, sem quebrar", () => {
    assert.deepEqual(capturarAtribuicao(), atribuicaoVazia);
  });

  test("lê as 5 utm_ e ignora todo o resto da query", () => {
    simularNavegador(
      "?utm_source=ig&utm_medium=paid&utm_campaign=set&utm_content=a1&utm_term=carreira&fbclid=XYZ&email=f@x.com&token=segredo",
      "",
    );
    const a = capturarAtribuicao();
    assert.equal(a.utm_source, "ig");
    assert.equal(a.utm_term, "carreira");
    const tudo = JSON.stringify(a);
    for (const proibido of ["XYZ", "f@x.com", "segredo"]) {
      assert.ok(!tudo.includes(proibido), `vazou ${proibido}`);
    }
  });

  test("referrer vira só o HOST — o caminho e a query da página anterior não passam", () => {
    simularNavegador("", "https://l.instagram.com/redir?u=https%3A%2F%2Fx.com&perfil=fulana");
    const a = capturarAtribuicao();
    assert.equal(a.referrer_host, "l.instagram.com");
    assert.ok(!JSON.stringify(a).includes("fulana"));
    assert.ok(!JSON.stringify(a).includes("redir"));
  });

  test("referrer do próprio site não é origem", () => {
    simularNavegador("", "https://site.com/outra-pagina", "site.com");
    assert.equal(capturarAtribuicao().referrer_host, null);
  });

  test("referrer malformado é ignorado, sem exceção", () => {
    simularNavegador("", "isso não é uma url");
    assert.equal(capturarAtribuicao().referrer_host, null);
  });

  test("acesso direto = tudo null", () => {
    simularNavegador("", "");
    assert.deepEqual(capturarAtribuicao(), atribuicaoVazia);
  });
});
