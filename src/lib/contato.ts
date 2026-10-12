import { contatoComercial } from "@/config/site";
import { whatsappInternacional } from "@/lib/lead";

/**
 * Link que abre a conversa com o Cauã no WhatsApp.
 *
 * O número vem só de `contatoComercial.whatsapp` (src/config/site.ts). A
 * mensagem é FIXA: nada do que a pessoa digitou (relato, e-mail, telefone,
 * id do cadastro) entra na URL — o link passa por histórico do navegador e
 * por servidores de terceiros.
 *
 * O link apenas ABRE a conversa com o texto preenchido; quem envia é a
 * pessoa. Nenhuma tela deve dizer que a mensagem "foi enviada".
 */
export const MENSAGENS_WHATSAPP = {
  /** Depois do cadastro confirmado. */
  sucesso:
    "Oi, Cauã! Enviei meu contexto pelo site da ZXP Direciona e gostaria de combinar a conversa inicial.",
  /** Contingência: o envio falhou ou o formulário não funciona (sem JS). */
  contingencia:
    "Oi, Cauã! Tentei enviar meu contexto pelo site da ZXP Direciona e não consegui. Gostaria de combinar a conversa inicial.",
} as const;

export type MotivoWhatsapp = keyof typeof MENSAGENS_WHATSAPP;

/** `null` enquanto não houver número configurado — o botão some da tela. */
export function linkWhatsapp(motivo: MotivoWhatsapp): string | null {
  if (!contatoComercial.whatsapp) return null;
  const numero = whatsappInternacional(contatoComercial.whatsapp);
  return `https://wa.me/${numero}?text=${encodeURIComponent(MENSAGENS_WHATSAPP[motivo])}`;
}
