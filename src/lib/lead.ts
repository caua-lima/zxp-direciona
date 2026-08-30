/**
 * Regras de lead compartilhadas entre o formulário (cliente) e a API (servidor).
 *
 * Ficam no mesmo lugar de propósito: validação só no cliente é enfeite — dá pra
 * burlar com um curl. O servidor revalida tudo usando exatamente estas funções,
 * então as regras não podem divergir com o tempo.
 */

export const faixasIdade = [
  "16 a 18",
  "19 a 21",
  "22 a 25",
  "26 ou mais",
] as const;

export const opcoesPeso = [
  "Não sei qual curso ou carreira escolher",
  "Escolhi, mas não me identifico mais",
  "Preciso decidir entre trabalhar, empreender ou estudar",
  "A pressão da minha família por uma decisão",
  "Sei o que quero, mas não sei como começar",
  "Outro",
] as const;

export type Lead = {
  nome: string;
  whatsapp: string;
  email: string;
  idade: string;
  peso: string;
  contexto: string;
  consentimento: boolean;
};

export type ErrosLead = Partial<Record<keyof Lead, string>>;

export const leadVazio: Lead = {
  nome: "",
  whatsapp: "",
  email: "",
  idade: "",
  peso: "",
  contexto: "",
  consentimento: false,
};

/** Formata o número como (00) 00000-0000 enquanto a pessoa digita. */
export function mascaraWhatsapp(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10)
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

/** Só os dígitos, no formato que o link do WhatsApp espera (55 + DDD + número). */
export function whatsappInternacional(valor: string) {
  return `55${valor.replace(/\D/g, "")}`;
}

export function validarLead(campos: Lead): ErrosLead {
  const erros: ErrosLead = {};

  if (campos.nome.trim().length < 2) {
    erros.nome = "Escreve seu nome pra gente saber como te chamar.";
  } else if (campos.nome.trim().length > 120) {
    erros.nome = "Nome muito longo.";
  }

  const digitos = campos.whatsapp.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 11) {
    erros.whatsapp = "Coloca o WhatsApp com DDD, ex: (11) 91234-5678.";
  }

  const email = campos.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 200) {
    erros.email = "Confere o e-mail — parece que faltou alguma coisa.";
  }

  if (!faixasIdade.includes(campos.idade as (typeof faixasIdade)[number])) {
    erros.idade = "Escolhe sua faixa de idade.";
  }

  if (!opcoesPeso.includes(campos.peso as (typeof opcoesPeso)[number])) {
    erros.peso = "Escolhe a opção que mais se parece com você.";
  }

  if (campos.contexto.length > 400) {
    erros.contexto = "Tenta resumir em até 400 caracteres.";
  }

  if (!campos.consentimento) {
    erros.consentimento = "Precisa autorizar o contato pra gente conversar.";
  }

  return erros;
}

/**
 * Converte um body desconhecido (veio da rede) num Lead com tipos garantidos.
 * Nunca confia no formato: qualquer campo ausente ou de tipo errado vira vazio
 * e é reprovado na validação logo em seguida.
 */
export function normalizarLead(body: unknown): Lead {
  const b = (body ?? {}) as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  return {
    nome: texto(b.nome),
    whatsapp: texto(b.whatsapp),
    email: texto(b.email).toLowerCase(),
    idade: texto(b.idade),
    peso: texto(b.peso),
    contexto: texto(b.contexto),
    consentimento: b.consentimento === true,
  };
}
