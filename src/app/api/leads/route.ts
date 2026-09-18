import {
  normalizarLead,
  validarLead,
  whatsappInternacional,
  mascaraWhatsapp,
  type Lead,
} from "@/lib/lead";

/**
 * Recebe o cadastro da LP: valida, grava no Supabase e avisa por e-mail.
 *
 * Sem SDK de propósito. Tanto o Supabase quanto o Resend são um POST HTTP
 * simples, e evitar as duas bibliotecas mantém o projeto em 3 dependências
 * e o cold start da função curto.
 */

export const runtime = "nodejs";
// Nunca cachear: cada POST é único e precisa chegar no banco.
export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const LEAD_NOTIFY_TO = process.env.LEAD_NOTIFY_TO;
const LEAD_NOTIFY_FROM = process.env.LEAD_NOTIFY_FROM;

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  // Armadilha anti-bot: campo invisível pra gente, irresistível pra robô.
  // Se veio preenchido, respondemos 200 pra não ensinar o bot a burlar,
  // mas não gravamos nada.
  const honeypot = (body as Record<string, unknown>)?.empresa;
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return Response.json({ ok: true });
  }

  const lead = normalizarLead(body);
  const erros = validarLead(lead);

  if (Object.keys(erros).length > 0) {
    return Response.json({ erros }, { status: 422 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "[leads] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados.",
    );
    return Response.json(
      { erro: "Cadastro indisponível no momento." },
      { status: 503 },
    );
  }

  // 1) Gravar primeiro. Se isso falhar, a pessoa PRECISA saber, porque o
  //    cadastro se perdeu de verdade.
  try {
    const resposta = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        nome: lead.nome,
        whatsapp: lead.whatsapp,
        email: lead.email,
        idade: lead.idade,
        peso: lead.peso,
        contexto: lead.contexto || null,
        consentimento_em: new Date().toISOString(),
        confirmacao_responsavel: lead.confirmacaoResponsavel,
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      console.error("[leads] Supabase recusou:", resposta.status, detalhe);
      return Response.json(
        { erro: "Não consegui salvar seu cadastro." },
        { status: 502 },
      );
    }
  } catch (erro) {
    console.error("[leads] Falha de rede ao gravar:", erro);
    return Response.json(
      { erro: "Não consegui salvar seu cadastro." },
      { status: 502 },
    );
  }

  // 2) Avisar depois. Se o e-mail falhar, o lead já está salvo — não faz
  //    sentido mostrar erro pra pessoa por causa disso.
  await notificar(lead).catch((erro) =>
    console.error("[leads] Lead salvo, mas o aviso falhou:", erro),
  );

  return Response.json({ ok: true });
}

async function notificar(lead: Lead) {
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
    throw new Error(`Resend ${resposta.status}: ${await resposta.text()}`);
  }
}

/** Evita que um lead com "<" no texto quebre (ou injete) o HTML do e-mail. */
function escapar(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
