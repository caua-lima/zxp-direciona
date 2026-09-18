process.env.SUPABASE_URL = "https://falso.supabase.test";
process.env.SUPABASE_SERVICE_ROLE_KEY = "chave-falsa-de-teste";
process.env.RESEND_API_KEY = "re_falsa";
process.env.LEAD_NOTIFY_TO = "dono@exemplo.com";
process.env.LEAD_NOTIFY_FROM = "ZXP Direciona <aviso@exemplo.com>";

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { esperarTarefasAposResposta } from "next/server";
import { instalarServicos, type Opcoes, type Servicos } from "./helpers/servicos-falsos";

const { POST } = await import("@/app/api/leads/route");

// ── Dados de teste — repare que são inconfundíveis, pra a varredura de log
// achar qualquer vazamento sem falso positivo.
const NOME = "Fulana Sobrenomeraro";
const EMAIL = "fulana.rara@exemplo.com";
const CONTEXTO = "texto-livre-muito-pessoal-xyz";
const leadBase = {
  nome: NOME,
  whatsapp: "(11) 91234-5678",
  email: EMAIL,
  idade: "18 a 21",
  peso: "Outro",
  contexto: CONTEXTO,
  consentimento: true,
};

let s: Servicos;
let n = 0;

function montar(opcoes: Opcoes = {}) {
  s = instalarServicos(opcoes);
}
beforeEach(() => montar());
afterEach(() => s.restaurar());

function requisicao(corpo: unknown, headers: Record<string, string> = {}, bruto?: string) {
  return new Request("http://localhost/api/leads", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "1.2.3.4", ...headers },
    body: bruto ?? JSON.stringify(corpo),
  });
}
const enviar = (corpo: unknown, headers?: Record<string, string>) => POST(requisicao(corpo, headers));
const chave = () => `chave-${++n}`;
const nenhumaChamadaAoBancoOuResend = () =>
  s.chamadas.filter((c) => !c.caminho.includes("rate_limit")).length === 0;

function semPII(logs: string[]) {
  const tudo = logs.join("\n");
  for (const proibido of [NOME, EMAIL, CONTEXTO, "91234", "11912345678", "Sobrenomeraro"]) {
    assert.ok(!tudo.includes(proibido), `dado pessoal vazou pro log: "${proibido}"\n${tudo}`);
  }
}

describe("portões de entrada", () => {
  test("Content-Type que não é JSON → 415, sem tocar em nada", async () => {
    const r = await POST(requisicao(null, { "content-type": "text/plain" }, JSON.stringify(leadBase)));
    assert.equal(r.status, 415);
    assert.ok(nenhumaChamadaAoBancoOuResend());
  });

  test("Origin de outro site → 403; do próprio site passa", async () => {
    const ruim = await POST(requisicao(leadBase, { origin: "https://malicioso.com", host: "site.com" }));
    assert.equal(ruim.status, 403);
    const bom = await POST(requisicao({ ...leadBase, idempotencyKey: chave() }, { origin: "https://site.com", host: "site.com" }));
    assert.equal(bom.status, 200);
  });

  test("corpo grande demais → 413 (declarado no header OU só no tamanho real)", async () => {
    const declarado = await POST(requisicao(leadBase, { "content-length": "50000" }));
    assert.equal(declarado.status, 413);
    const real = await POST(requisicao(null, {}, JSON.stringify({ ...leadBase, lixo: "x".repeat(30_000) })));
    assert.equal(real.status, 413);
    assert.ok(nenhumaChamadaAoBancoOuResend());
  });

  test("JSON quebrado → 400", async () => {
    assert.equal((await POST(requisicao(null, {}, "isso não é json"))).status, 400);
  });

  test("JSON válido mas de tipo inesperado (null, array, número, texto) → 422, nunca 500", async () => {
    for (const corpo of ["null", "[]", "42", '"texto"', "true"]) {
      const r = await POST(requisicao(null, {}, corpo));
      assert.equal(r.status, 422, corpo);
    }
    assert.equal(s.insercoes.length, 0);
  });

  test("campos de tipo errado dentro de um objeto → 422", async () => {
    const r = await enviar({ nome: 123, whatsapp: {}, email: ["a@b.com"], idade: null, peso: false, consentimento: "true" });
    assert.equal(r.status, 422);
  });
});

describe("validação", () => {
  test("lead inválido → 422 com erros por campo, sem gravar nem avisar", async () => {
    const r = await enviar({ ...leadBase, whatsapp: "00000000000", idempotencyKey: chave() });
    assert.equal(r.status, 422);
    assert.ok((await r.json()).erros.whatsapp);
    assert.equal(s.insercoes.length, 0);
    assert.equal(s.emails.length, 0);
  });

  test("menor de idade sem confirmação do responsável → 422 (o servidor também barra)", async () => {
    const r = await enviar({ ...leadBase, idade: "16 a 17", idempotencyKey: chave() });
    assert.equal(r.status, 422);
    assert.ok((await r.json()).erros.confirmacaoResponsavel);
  });
});

describe("honeypot", () => {
  test("responde ok SEM recibo, não grava, não avisa", async () => {
    const r = await enviar({ ...leadBase, empresa: "spam-ltda", idempotencyKey: chave() });
    assert.equal(r.status, 200);
    const corpo = await r.json();
    assert.deepEqual(corpo, { ok: true });
    assert.equal("recibo" in corpo, false, "recibo permitiria contar robô como lead");
    assert.equal(s.insercoes.length, 0);
    await esperarTarefasAposResposta();
    assert.equal(s.emails.length, 0);
  });
});

describe("rate limit", () => {
  test("no limite → 429 com Retry-After, sem gravar", async () => {
    s.restaurar();
    montar({ hitsIniciais: 5 });
    const r = await enviar({ ...leadBase, idempotencyKey: chave() });
    assert.equal(r.status, 429);
    assert.equal(r.headers.get("retry-after"), "600");
    assert.equal(s.insercoes.length, 0);
  });

  test("abaixo do limite passa, e a tentativa é contada", async () => {
    await enviar({ ...leadBase, idempotencyKey: chave() });
    assert.equal(s.hitsRateLimit, 1);
  });

  test("limitador fora do ar falha ABERTO: o cadastro legítimo não é derrubado", async () => {
    s.restaurar();
    montar({ rateLimitCaido: true });
    const r = await enviar({ ...leadBase, idempotencyKey: chave() });
    assert.equal(r.status, 200);
    assert.equal(s.insercoes.length, 1);
  });
});

describe("configuração", () => {
  test("sem Supabase → 503 com ref, sem gravar", async () => {
    const guardado = process.env.SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    try {
      const r = await enviar({ ...leadBase, idempotencyKey: chave() });
      assert.equal(r.status, 503);
      assert.ok((await r.json()).ref);
      assert.equal(s.insercoes.length, 0);
    } finally {
      process.env.SUPABASE_URL = guardado;
    }
  });
});

describe("gravação bem-sucedida", () => {
  test("responde 200 com recibo igual à chave de idempotência", async () => {
    const k = chave();
    const r = await enviar({ ...leadBase, idempotencyKey: k });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true, recibo: k });
  });

  test("grava o telefone em formato canônico e os campos certos", async () => {
    await enviar({ ...leadBase, whatsapp: "+55 (11) 91234-5678", email: "  FULANA.RARA@Exemplo.com ", idempotencyKey: chave() });
    const gravado = s.insercoes[0];
    assert.equal(gravado.whatsapp, "11912345678");
    assert.equal(gravado.email, "fulana.rara@exemplo.com");
    assert.equal(gravado.confirmacao_responsavel, false);
    assert.match(String(gravado.consentimento_em), /^\d{4}-\d{2}-\d{2}T/);
    assert.equal("atribuicao" in gravado, false, "o objeto bruto do cliente não vai pro banco");
  });

  test("sem chave de idempotência (cliente antigo) ainda grava, mas sem recibo", async () => {
    const r = await enviar(leadBase);
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
    assert.equal(s.insercoes.length, 1);
  });

  test("origem: só colunas com valor, sanitizadas; chaves fora da allowlist morrem", async () => {
    await enviar({
      ...leadBase,
      idempotencyKey: chave(),
      atribuicao: { utm_source: "ig", utm_campaign: "a\nb", referrer_host: "https://x.com/caminho", email: "vaza@x.com", gclid: "abc" },
    });
    const g = s.insercoes[0];
    assert.equal(g.utm_source, "ig");
    assert.equal(g.utm_campaign, "ab");
    assert.ok(!("referrer_host" in g), "referrer com caminho é descartado, não gravado");
    assert.ok(!("utm_medium" in g), "coluna sem valor não é enviada");
    assert.ok(!JSON.stringify(g).includes("vaza@x.com"));
    assert.ok(!JSON.stringify(g).includes("gclid"));
  });

  test("acesso direto não manda nenhuma coluna de origem", async () => {
    await enviar({ ...leadBase, idempotencyKey: chave() });
    assert.ok(!Object.keys(s.insercoes[0]).some((c) => c.startsWith("utm_") || c === "referrer_host"));
  });
});

describe("notificação por e-mail", () => {
  test("sai UM e-mail, montado do que foi salvo, com Idempotency-Key e WhatsApp certo", async () => {
    await enviar({ ...leadBase, idempotencyKey: chave(), atribuicao: { utm_source: "instagram", utm_campaign: "setembro" } });
    await esperarTarefasAposResposta();

    assert.equal(s.emails.length, 1);
    const { headers, corpo } = s.emails[0];
    assert.match(headers["idempotency-key"], /^lead-lead-\d+$/);
    assert.equal(corpo.reply_to, "fulana.rara@exemplo.com");
    const html = String(corpo.html);
    assert.match(html, /wa\.me\/5511912345678/);
    assert.match(html, /instagram \/ setembro/);
  });

  test("o texto livre do lead NÃO é copiado pro e-mail (só o aviso de que existe)", async () => {
    await enviar({ ...leadBase, idempotencyKey: chave() });
    await esperarTarefasAposResposta();
    const html = String(s.emails[0].corpo.html);
    assert.ok(!html.includes(CONTEXTO), "contexto pessoal vazou pro e-mail");
    assert.match(html, /contexto pessoal/);
  });

  test("nome hostil não injeta HTML no e-mail", async () => {
    await enviar({ ...leadBase, nome: '<img src=x onerror="alert(1)">', idempotencyKey: chave() });
    await esperarTarefasAposResposta();
    const html = String(s.emails[0].corpo.html);
    assert.ok(!html.includes("<img"), "tag não escapada no e-mail");
    assert.ok(html.includes("&lt;img"));
  });

  test("a RESPOSTA não espera o Resend (aviso lento não atrasa o cadastro)", async () => {
    s.restaurar();
    let liberar!: () => void;
    montar({ resendGate: new Promise<void>((r) => (liberar = r)) });

    const k = chave();
    const r = await enviar({ ...leadBase, idempotencyKey: k });
    assert.equal(r.status, 200, "respondeu enquanto o Resend ainda está pendente");
    assert.equal(s.emails.length, 0, "o e-mail ainda não terminou");

    liberar();
    await esperarTarefasAposResposta();
    assert.equal(s.emails.length, 1);
  });

  test("Resend fora do ar: o cadastro segue 200, a reivindicação é liberada e o log não tem PII", async () => {
    s.restaurar();
    montar({ resendStatus: 500 });
    const r = await enviar({ ...leadBase, idempotencyKey: chave() });
    await esperarTarefasAposResposta();

    assert.equal(r.status, 200);
    assert.equal(s.banco.size, 1);
    const linha = [...s.banco.values()][0];
    assert.equal(linha.notificado_em, null, "não pode constar como avisado");
    assert.equal(linha.notificacao_reivindicada_em, null, "reivindicação liberada pra nova tentativa");
    assert.match(s.logs.join("\n"), /o aviso falhou/);
    semPII(s.logs);
  });

  test("e-mail não configurado: cadastro funciona e nem tenta reivindicar", async () => {
    const guardado = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    try {
      const r = await enviar({ ...leadBase, idempotencyKey: chave() });
      await esperarTarefasAposResposta();
      assert.equal(r.status, 200);
      assert.equal(s.emails.length, 0);
      assert.ok(!s.chamadas.some((c) => c.metodo === "PATCH"));
    } finally {
      process.env.RESEND_API_KEY = guardado;
    }
  });
});

describe("idempotência e concorrência", () => {
  test("retry sequencial com a mesma chave: 1 linha, 2 respostas iguais, 1 e-mail", async () => {
    const k = chave();
    const a = await enviar({ ...leadBase, idempotencyKey: k });
    const b = await enviar({ ...leadBase, idempotencyKey: k });
    await esperarTarefasAposResposta();

    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.deepEqual(await a.json(), await b.json());
    assert.equal(s.banco.size, 1);
    assert.equal(s.emails.length, 1);
  });

  test("5 envios idênticos SIMULTÂNEOS: 1 gravação, 1 e-mail, todos recebem o mesmo recibo", async () => {
    const k = chave();
    const respostas = await Promise.all(
      Array.from({ length: 5 }, () => enviar({ ...leadBase, idempotencyKey: k })),
    );
    await esperarTarefasAposResposta();

    assert.deepEqual(respostas.map((r) => r.status), [200, 200, 200, 200, 200]);
    for (const r of respostas) assert.deepEqual(await r.json(), { ok: true, recibo: k });
    assert.equal(s.banco.size, 1, "uma gravação só");
    assert.equal(s.emails.length, 1, "um trabalho de notificação só");
  });

  test("chaves diferentes = leads diferentes (não deduplica pessoas, só tentativas)", async () => {
    await enviar({ ...leadBase, idempotencyKey: chave() });
    await enviar({ ...leadBase, idempotencyKey: chave() });
    assert.equal(s.banco.size, 2);
  });
});

describe("o caso crítico: o banco gravou mas a rota nunca soube", () => {
  test("1ª tentativa → 502 sem recibo (mas a linha existe); retry → 200 e o aviso SAI, uma vez", async () => {
    s.restaurar();
    montar({ gravarMasPerderResposta: true });
    const k = chave();

    const primeira = await enviar({ ...leadBase, idempotencyKey: k });
    await esperarTarefasAposResposta();
    assert.equal(primeira.status, 502);
    const corpo1 = await primeira.json();
    assert.equal("recibo" in corpo1, false, "nunca dar recibo de algo que a rota não confirmou");
    assert.ok(corpo1.ref);
    assert.equal(s.banco.size, 1, "o banco de fato gravou");
    assert.equal(s.emails.length, 0, "e ninguém foi avisado ainda");

    const retry = await enviar({ ...leadBase, idempotencyKey: k });
    await esperarTarefasAposResposta();
    assert.equal(retry.status, 200);
    assert.deepEqual(await retry.json(), { ok: true, recibo: k });
    assert.equal(s.banco.size, 1, "sem duplicar o lead");
    assert.equal(s.emails.length, 1, "o aviso que ficou pendente finalmente saiu — uma vez só");
  });
});

describe("retry com dados diferentes (a pessoa corrigiu algo)", () => {
  test("mesma chave + telefone corrigido → 409, o cadastro antigo NÃO é sobrescrito, nada é avisado", async () => {
    const k = chave();
    await enviar({ ...leadBase, whatsapp: "(11) 91111-1111", idempotencyKey: k });
    await esperarTarefasAposResposta();
    const emailsAntes = s.emails.length;

    const r = await enviar({ ...leadBase, whatsapp: "(11) 92222-2222", idempotencyKey: k });
    await esperarTarefasAposResposta();

    assert.equal(r.status, 409);
    assert.deepEqual(await r.json(), { erro: "chave_reutilizada" });
    assert.equal(s.banco.size, 1);
    assert.equal([...s.banco.values()][0].whatsapp, "11911111111", "nunca sobrescreve");
    assert.equal(s.emails.length, emailsAntes);
  });

  test("com chave nova o cadastro corrigido entra normalmente", async () => {
    await enviar({ ...leadBase, whatsapp: "(11) 91111-1111", idempotencyKey: chave() });
    const r = await enviar({ ...leadBase, whatsapp: "(11) 92222-2222", idempotencyKey: chave() });
    assert.equal(r.status, 200);
    assert.equal(s.banco.size, 2);
  });

  test("não dá pra conferir o cadastro existente → 502, sem recibo", async () => {
    s.restaurar();
    montar({ conferenciaIndisponivel: true });
    const k = chave();
    await enviar({ ...leadBase, idempotencyKey: k });
    const r = await enviar({ ...leadBase, idempotencyKey: k });
    assert.equal(r.status, 502);
    assert.equal("recibo" in (await r.json()), false);
  });
});

describe("falhas do banco", () => {
  test("banco recusa → 502 sem recibo, sem aviso, e o log NÃO tem os dados da linha", async () => {
    s.restaurar();
    montar({ gravacaoRecusada: true });
    const r = await enviar({ ...leadBase, idempotencyKey: chave() });
    await esperarTarefasAposResposta();

    assert.equal(r.status, 502);
    const corpo = await r.json();
    assert.equal("recibo" in corpo, false);
    assert.equal(s.emails.length, 0);

    const log = s.logs.join("\n");
    assert.match(log, /23502/, "o código do erro é útil e seguro");
    assert.match(log, new RegExp(corpo.ref), "o mesmo ref está na resposta e no log");
    // O Postgres pôs os valores da linha em `details`. Isso não pode ir pro log:
    semPII(s.logs);
  });

  test("falha de rede ao gravar → 502 sem recibo, log só com o tipo do erro", async () => {
    s.restaurar();
    montar({ gravacaoFalhaDeRede: true });
    const r = await enviar({ ...leadBase, idempotencyKey: chave() });
    assert.equal(r.status, 502);
    assert.equal("recibo" in (await r.json()), false);
    assert.equal(s.banco.size, 0);
    assert.match(s.logs.join("\n"), /TypeError ECONNRESET/);
    semPII(s.logs);
  });
});
