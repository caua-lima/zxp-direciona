import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { linkWhatsapp, MENSAGENS_WHATSAPP } from "@/lib/contato";
import { contatoComercial } from "@/config/site";

describe("link do WhatsApp do Cauã", () => {
  test("usa o número de site.ts, com código do país, e a mensagem fixa codificada", () => {
    const url = new URL(linkWhatsapp("sucesso")!);
    assert.equal(url.origin, "https://wa.me");
    assert.equal(url.pathname, `/55${contatoComercial.whatsapp}`);
    assert.equal(url.searchParams.get("text"), MENSAGENS_WHATSAPP.sucesso);
    // Acento e espaço não podem ir crus na URL.
    assert.ok(!/[ ãçé,]/.test(linkWhatsapp("sucesso")!), "mensagem não codificada");
  });

  test("a mensagem cita o Cauã e não afirma que algo já foi agendado", () => {
    assert.match(MENSAGENS_WHATSAPP.sucesso, /^Oi, Cauã!/);
    assert.ok(!/agendad|marcad|confirmad/i.test(MENSAGENS_WHATSAPP.sucesso));
  });

  test("a contingência não diz que o contexto foi enviado", () => {
    assert.match(MENSAGENS_WHATSAPP.contingencia, /não consegui/);
    assert.ok(!MENSAGENS_WHATSAPP.contingencia.startsWith(MENSAGENS_WHATSAPP.sucesso));
  });

  test("nenhum dado da pessoa cabe na URL: a função só aceita o motivo", () => {
    assert.equal(linkWhatsapp.length, 1);
    for (const motivo of ["sucesso", "contingencia"] as const) {
      const url = new URL(linkWhatsapp(motivo)!);
      assert.deepEqual([...url.searchParams.keys()], ["text"]);
      assert.ok(!url.search.includes("%40"), "e-mail na URL");
    }
  });
});
