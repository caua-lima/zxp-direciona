import { supabaseFetch, resumoDoErro } from "./supabase";
import { mascaraWhatsapp, whatsappInternacional } from "./lead";

/**
 * Aviso por e-mail de um lead novo — com reivindicação atômica.
 *
 * O problema que isto resolve: o aviso roda DEPOIS da resposta (after()), em
 * segundo plano, e pode falhar ou nem chegar a rodar (a função serverless
 * morre, o Resend cai, a rota perdeu a resposta do banco e devolveu 502 ainda
 * que o lead tenha sido gravado). Sem registro de "já avisei", só há dois
 * jeitos de errar: nunca avisar (lead salvo, ninguém sabe) ou avisar em dobro.
 *
 * Solução, sem fila nem infraestrutura nova: duas colunas em `leads`.
 *   notificado_em                — quando o e-mail saiu de verdade.
 *   notificacao_reivindicada_em  — "alguém está enviando isto agora" (lease).
 *
 * Reivindicar é um UPDATE ... WHERE notificado_em IS NULL AND (sem lease OU
 * lease vencida) — atômico por linha no Postgres: de N tentativas
 * simultâneas, só uma recebe a linha de volta e envia. Se o envio falha, a
 * reivindicação é liberada e qualquer retry (ou o script de reprocessar)
 * tenta de novo. Se a função morre no meio, a lease vence em 5 minutos.
 *
 * O e-mail é montado a partir da LINHA DO BANCO, não do corpo da requisição:
 * o que se avisa é o que foi de fato salvo.
 */

const LEASE_MS = 5 * 60 * 1000;

export type FiltroLead = { id: string } | { chave: string };

export type ResultadoNotificacao =
  | "enviada"
  | "ja_notificada_ou_em_andamento"
  | "email_nao_configurado";

type LinhaCompleta = {
  id: string;
  nome: string;
  whatsapp: string;
  email: string;
  idade: string;
  peso: string;
  contexto: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer_host?: string | null;
};

export function emailConfigurado(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY &&
      process.env.LEAD_NOTIFY_TO &&
      process.env.LEAD_NOTIFY_FROM,
  );
}

function filtroQuery(filtro: FiltroLead): string {
  return "id" in filtro
    ? `id=eq.${encodeURIComponent(filtro.id)}`
    : `idempotency_key=eq.${encodeURIComponent(filtro.chave)}`;
}

export async function notificarLead(filtro: FiltroLead): Promise<ResultadoNotificacao> {
  if (!emailConfigurado()) return "email_nao_configurado";

  const agora = new Date().toISOString();
  const leaseVencidaAntesDe = new Date(Date.now() - LEASE_MS).toISOString();

  const reivindicacao = await supabaseFetch(
    `/rest/v1/leads?${filtroQuery(filtro)}` +
      `&notificado_em=is.null` +
      `&or=(notificacao_reivindicada_em.is.null,notificacao_reivindicada_em.lt.${encodeURIComponent(leaseVencidaAntesDe)})`,
    {
      method: "PATCH",
      preferir: "return=representation",
      body: JSON.stringify({ notificacao_reivindicada_em: agora }),
    },
    6000,
  );
  if (!reivindicacao.ok) {
    throw new Error(`reivindicar notificação: ${await resumoDoErro(reivindicacao)}`);
  }

  const linhas = (await reivindicacao.json().catch(() => [])) as LinhaCompleta[];
  if (linhas.length === 0) return "ja_notificada_ou_em_andamento";
  const linha = linhas[0];

  try {
    await enviarEmail(linha);
  } catch (erro) {
    // Libera pra outra tentativa (retry, ou o script de reprocessar).
    await supabaseFetch(
      `/rest/v1/leads?id=eq.${encodeURIComponent(linha.id)}`,
      {
        method: "PATCH",
        preferir: "return=minimal",
        body: JSON.stringify({ notificacao_reivindicada_em: null }),
      },
      4000,
    ).catch(() => {});
    throw erro;
  }

  const marca = await supabaseFetch(
    `/rest/v1/leads?id=eq.${encodeURIComponent(linha.id)}`,
    {
      method: "PATCH",
      preferir: "return=minimal",
      body: JSON.stringify({ notificado_em: new Date().toISOString() }),
    },
    4000,
  ).catch(() => null);

  if (!marca?.ok) {
    // O e-mail JÁ saiu; só a marcação falhou. Se este lead for reprocessado
    // depois, o Idempotency-Key do Resend (lead-<id>, 24h) impede o e-mail
    // duplicado. Só registra — sem dado pessoal.
    console.warn(`[notificacao] e-mail enviado, mas não consegui marcar notificado_em (lead ${linha.id}).`);
  }

  return "enviada";
}

async function enviarEmail(linha: LinhaCompleta): Promise<void> {
  const chave = process.env.RESEND_API_KEY!;

  // Link que abre a conversa já endereçada: é o que faz você responder rápido.
  const saudacao = encodeURIComponent(
    `Oi, ${linha.nome.split(" ")[0]}! Aqui é da ZXP Direciona. Vi seu cadastro e quero marcar sua call de diagnóstico.`,
  );
  const linkWhatsapp = `https://wa.me/${whatsappInternacional(linha.whatsapp)}?text=${saudacao}`;

  const resposta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(8000),
    headers: {
      Authorization: `Bearer ${chave}`,
      "Content-Type": "application/json",
      // Mesma linha => mesma chave => o Resend não envia duas vezes (retém 24h).
      "Idempotency-Key": `lead-${linha.id}`,
    },
    body: JSON.stringify({
      from: process.env.LEAD_NOTIFY_FROM,
      to: [process.env.LEAD_NOTIFY_TO],
      reply_to: linha.email,
      subject: `ZXP Direciona: ${linha.nome} (${linha.idade}) — ${linha.peso}`,
      html: montarHtml(linha, linkWhatsapp),
    }),
  });

  if (!resposta.ok) {
    // Só o status e o NOME do erro do Resend — o corpo pode citar campos.
    let nome = "";
    try {
      const corpo = (await resposta.json()) as { name?: unknown };
      if (typeof corpo.name === "string") nome = corpo.name.slice(0, 60);
    } catch {
      // sem corpo JSON
    }
    throw new Error(`Resend HTTP ${resposta.status}${nome ? ` · ${nome}` : ""}`);
  }
}

export function montarHtml(linha: LinhaCompleta, linkWhatsapp: string): string {
  const origem = [linha.utm_source, linha.utm_medium, linha.utm_campaign, linha.referrer_host]
    .filter((p): p is string => Boolean(p))
    .join(" / ");

  return `
    <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#10100E">
      <h2 style="margin:0 0 16px">Novo cadastro na ZXP Direciona</h2>
      <p style="margin:0 0 4px"><strong>Nome:</strong> ${escapar(linha.nome)}</p>
      <p style="margin:0 0 4px"><strong>Idade:</strong> ${escapar(linha.idade)} anos</p>
      <p style="margin:0 0 4px"><strong>WhatsApp:</strong> ${escapar(mascaraWhatsapp(linha.whatsapp))}</p>
      <p style="margin:0 0 4px"><strong>E-mail:</strong> ${escapar(linha.email)}</p>
      <p style="margin:0 0 4px"><strong>O que mais pesa:</strong> ${escapar(linha.peso)}</p>
      ${origem ? `<p style="margin:0 0 4px"><strong>Origem:</strong> ${escapar(origem)}</p>` : ""}
      ${
        linha.contexto
          ? `<p style="margin:16px 0 4px;color:#555"><em>A pessoa escreveu um contexto pessoal. Ele fica só no banco — não é copiado pro e-mail, porque e-mail é o lugar onde texto livre (de adolescentes, aqui) mais se espalha.</em></p>`
          : ""
      }
      <p style="margin:24px 0 0">
        <a href="${escapar(linkWhatsapp)}"
           style="background:#F4B942;color:#10100E;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
          Responder no WhatsApp
        </a>
      </p>
    </div>
  `;
}

/** Evita que texto com "<" ou aspas quebre (ou injete) o HTML do e-mail. */
export function escapar(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
