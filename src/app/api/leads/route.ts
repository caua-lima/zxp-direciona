import { after } from "next/server";
import {
  normalizarLead,
  validarLead,
  whatsappInternacional,
  mascaraWhatsapp,
  type Lead,
} from "@/lib/lead";
import { supabaseFetch, supabaseConfigurado } from "@/lib/supabase";
import { verificarLimite, ipDaRequisicao } from "@/lib/rateLimit";
import {
  sanitizarAtribuicao,
  atribuicaoParaColunas,
  type Atribuicao,
} from "@/lib/atribuicao";

/**
 * Recebe o cadastro da LP: valida, grava no Supabase (de forma idempotente)
 * e avisa por e-mail em segundo plano.
 *
 * Sem SDK de propósito. Tanto o Supabase quanto o Resend são um POST HTTP
 * simples, e evitar as duas bibliotecas mantém o projeto em poucas
 * dependências e o cold start da função curto.
 */

export const runtime = "nodejs";
// Nunca cachear: cada POST é único e precisa chegar no banco.
export const dynamic = "force-dynamic";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const LEAD_NOTIFY_TO = process.env.LEAD_NOTIFY_TO;
const LEAD_NOTIFY_FROM = process.env.LEAD_NOTIFY_FROM;

// Generoso pro maior payload plausível (nome+whatsapp+email+contexto de 400
// chars + folga), mas fecha a porta pra alguém mandar um corpo de megabytes
// só pra gastar CPU/memória da função.
const TAMANHO_MAXIMO_BODY = 20_000; // bytes

export async function POST(request: Request) {
  // 1) Content-Type precisa ser JSON de verdade. Isso sozinho já barra o
  // vetor mais simples de POST cross-site: um <form> em outro site só
  // consegue mandar text/plain, x-www-form-urlencoded ou multipart sem
  // disparar preflight — nunca application/json.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return Response.json(
      { erro: "Content-Type precisa ser application/json." },
      { status: 415 },
    );
  }

  // 2) Origin, quando o navegador manda (nem toda requisição manda — curl e
  // chamada server-to-server não mandam, e isso é normal). Se veio e não
  // bate com o host da própria requisição, rejeita. Isto é uma defesa
  // COMPLEMENTAR, não autenticação: um bot fora do navegador forja qualquer
  // header que quiser.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return Response.json({ erro: "Origem não permitida." }, { status: 403 });
      }
    } catch {
      return Response.json({ erro: "Origem inválida." }, { status: 403 });
    }
  }

  // 3) Tamanho do corpo, lido como texto antes de tentar JSON.parse — um
  // Content-Length maior que o limite já rejeita sem nem ler o corpo; sem
  // esse header (alguns clientes omitem), o corte pelo tamanho real do texto
  // lido cobre o caso mesmo assim.
  const tamanhoDeclarado = Number(request.headers.get("content-length") ?? 0);
  if (tamanhoDeclarado > TAMANHO_MAXIMO_BODY) {
    return Response.json({ erro: "Corpo da requisição muito grande." }, { status: 413 });
  }

  const bruto = await request.text();
  if (bruto.length > TAMANHO_MAXIMO_BODY) {
    return Response.json({ erro: "Corpo da requisição muito grande." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(bruto);
  } catch {
    return Response.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  // 4) Rate limit — depois dos checks baratos acima, antes de qualquer
  // trabalho de verdade (honeypot, validação, banco).
  const ip = ipDaRequisicao(request);
  const limite = await verificarLimite(ip);
  if (!limite.permitido) {
    return Response.json(
      { erro: "Muitas tentativas. Espera um pouco e tenta de novo." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSegundos) } },
    );
  }

  // Armadilha anti-bot: campo invisível pra gente, irresistível pra robô.
  // Se veio preenchido, respondemos 200 pra não ensinar o bot a burlar,
  // mas não gravamos nada nem contamos como lead.
  const corpo = body as Record<string, unknown>;
  const honeypot = corpo?.empresa;
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return Response.json({ ok: true });
  }

  const lead = normalizarLead(body);
  // O cliente manda a origem da campanha, mas o servidor não confia nela:
  // allowlist de chaves, tamanho limitado, sem query string inteira.
  const atribuicao = sanitizarAtribuicao(corpo.atribuicao);
  const erros = validarLead(lead);

  if (Object.keys(erros).length > 0) {
    return Response.json({ erros }, { status: 422 });
  }

  // Chave de idempotência: o cliente gera uma vez por sessão de formulário e
  // reusa em toda tentativa/retry dessa MESMA submissão. Opcional — cliente
  // antigo (bundle em cache) que não manda nada continua funcionando, só
  // sem a proteção de duplicata.
  const idempotencyKey =
    typeof corpo.idempotencyKey === "string" && corpo.idempotencyKey.length <= 100
      ? corpo.idempotencyKey
      : null;

  if (!supabaseConfigurado) {
    console.error("[leads] Supabase não configurado.");
    return Response.json(
      { erro: "Cadastro indisponível no momento." },
      { status: 503 },
    );
  }

  // 1) Gravar primeiro. Se isso falhar de verdade, a pessoa PRECISA saber,
  // porque o cadastro se perdeu.
  let leadId: string | null = null;
  let jaExistia = false;

  try {
    // on_conflict é explícito de propósito — o comportamento de upsert do
    // PostgREST depende de saber exatamente qual constraint usar, e isso não
    // é algo pra deixar por conta de inferência automática.
    const resposta = await supabaseFetch("/rest/v1/leads?on_conflict=idempotency_key", {
      method: "POST",
      preferir: "return=representation,resolution=ignore-duplicates",
      body: JSON.stringify({
        nome: lead.nome,
        whatsapp: lead.whatsapp,
        email: lead.email,
        idade: lead.idade,
        peso: lead.peso,
        contexto: lead.contexto || null,
        consentimento_em: new Date().toISOString(),
        confirmacao_responsavel: lead.confirmacaoResponsavel,
        idempotency_key: idempotencyKey,
        ...atribuicaoParaColunas(atribuicao),
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      console.error("[leads] Supabase recusou:", resposta.status, detalhe.slice(0, 300));
      return Response.json(
        { erro: "Não consegui salvar seu cadastro." },
        { status: 502 },
      );
    }

    // `resolution=ignore-duplicates` faz o Postgres tratar um conflito de
    // idempotency_key como no-op em vez de erro — a resposta vem OK mas
    // pode vir vazia (nada foi inserido de novo). É assim que distinguimos
    // "gravei agora" de "essa chave já tinha sido gravada antes": corpo
    // vazio = já existia, então não repetimos o e-mail.
    const linhas = (await resposta.json().catch(() => [])) as Array<{ id: string }>;
    if (linhas.length > 0) {
      leadId = linhas[0].id;
    } else {
      jaExistia = true;
    }
  } catch (erro) {
    console.error("[leads] Falha de rede/timeout ao gravar:", erro);
    // Resultado INCERTO (pode ter gravado e a resposta se perdeu) — não dá
    // pra dizer "não foi salvo" com certeza. Como o cliente reenvia com a
    // MESMA chave de idempotência, o retry natural resolve isso sem
    // duplicar: se já tinha gravado, cai no ramo `jaExistia` acima.
    return Response.json(
      { erro: "Não consegui confirmar seu cadastro — tenta de novo." },
      { status: 502 },
    );
  }

  // 2) Avisar depois, fora do tempo de resposta — usando `after()` (Next.js
  // 16), que roda depois do response ser enviado mas antes da função
  // serverless encerrar de vez (via waitUntil, nativo da Vercel). Só na
  // gravação NOVA: se a chave já existia, o aviso já foi tentado na
  // primeira vez, e reenviar aqui duplicaria e-mail num simples retry.
  if (!jaExistia) {
    after(() =>
      notificar(lead, atribuicao).catch((erro) =>
        console.error(
          `[leads] Lead ${leadId ?? "?"} salvo, mas o aviso falhou:`,
          erro instanceof Error ? erro.message : erro,
        ),
      ),
    );
  }

  // O recibo só existe neste caminho — gravação nova OU chave que já estava
  // gravada (retry depois de resposta perdida). O descarte do honeypot acima
  // responde ok SEM recibo, e é isso que impede um robô de virar conversão
  // no tracking do cliente. É a própria chave de idempotência devolvida:
  // opaca, sem dado pessoal, e estável entre retries — então o evento de
  // conversão tem sempre o mesmo id, não importa quantas vezes a resposta
  // chegue.
  return Response.json(
    idempotencyKey ? { ok: true, recibo: idempotencyKey } : { ok: true },
  );
}

async function notificar(lead: Lead, atribuicao: Atribuicao) {
  if (!RESEND_API_KEY || !LEAD_NOTIFY_TO || !LEAD_NOTIFY_FROM) {
    console.warn("[leads] Notificação por e-mail não configurada — pulando.");
    return;
  }

  // Link que abre a conversa já endereçada: é o que faz você responder rápido.
  const saudacao = encodeURIComponent(
    `Oi, ${lead.nome.split(" ")[0]}! Aqui é da ZXP Direciona. Vi seu cadastro e quero marcar sua call de diagnóstico.`,
  );
  const linkWhatsapp = `https://wa.me/${whatsappInternacional(lead.whatsapp)}?text=${saudacao}`;

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: LEAD_NOTIFY_FROM,
      to: [LEAD_NOTIFY_TO],
      reply_to: lead.email,
      subject: `ZXP Direciona: ${lead.nome} (${lead.idade}) — ${lead.peso}`,
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#10100E">
          <h2 style="margin:0 0 16px">Novo cadastro na ZXP Direciona</h2>
          <p style="margin:0 0 4px"><strong>Nome:</strong> ${escapar(lead.nome)}</p>
          <p style="margin:0 0 4px"><strong>Idade:</strong> ${escapar(lead.idade)} anos</p>
          <p style="margin:0 0 4px"><strong>WhatsApp:</strong> ${escapar(mascaraWhatsapp(lead.whatsapp))}</p>
          <p style="margin:0 0 4px"><strong>E-mail:</strong> ${escapar(lead.email)}</p>
          <p style="margin:0 0 4px"><strong>O que mais pesa:</strong> ${escapar(lead.peso)}</p>
          ${origemEmTexto(atribuicao)}
          ${
            lead.contexto
              ? `<p style="margin:16px 0 4px"><strong>Contexto:</strong><br>${escapar(lead.contexto)}</p>`
              : ""
          }
          <p style="margin:24px 0 0">
            <a href="${linkWhatsapp}"
               style="background:#F4B942;color:#10100E;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
              Responder no WhatsApp
            </a>
          </p>
        </div>
      `,
    }),
  });

  if (!resposta.ok) {
    // Só status + início do corpo (não o corpo bruto inteiro): o erro do
    // provedor pode ecoar dado pessoal do lead de volta na mensagem.
    const detalhe = await resposta.text().catch(() => "");
    throw new Error(`Resend ${resposta.status}: ${detalhe.slice(0, 200)}`);
  }
}

/** Uma linha só com de onde o lead veio, ou vazio se veio direto. Passa por
 * escapar(): utm_* vem da URL, ou seja, de quem quiser montar um link. */
function origemEmTexto(a: Atribuicao): string {
  const partes = [a.utm_source, a.utm_medium, a.utm_campaign, a.referrer_host].filter(
    (p): p is string => Boolean(p),
  );
  if (partes.length === 0) return "";
  return `<p style="margin:0 0 4px"><strong>Origem:</strong> ${escapar(partes.join(" / "))}</p>`;
}

/** Evita que um lead com "<" no texto quebre (ou injete) o HTML do e-mail. */
function escapar(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
