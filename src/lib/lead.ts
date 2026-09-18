/**
 * Regras de lead compartilhadas entre o formulário (cliente) e a API (servidor).
 *
 * Ficam no mesmo lugar de propósito: validação só no cliente é enfeite — dá pra
 * burlar com um curl. O servidor revalida tudo usando exatamente estas funções,
 * então as regras não podem divergir com o tempo.
 */

// "16 a 17" fica isolada de propósito: é a única faixa de menor de idade, e
// precisa disparar a confirmação extra de responsável abaixo. Juntar menor e
// maior numa faixa só ("16 a 18", como era antes) impedia aplicar qualquer
// regra diferente por faixa.
export const faixasIdade = [
  "16 a 17",
  "18 a 21",
  "22 a 25",
  "26 ou mais",
] as const;

export function ehMenorDeIdade(faixa: string): boolean {
  return faixa === "16 a 17";
}

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
  /**
   * Só é exigido (e só faz sentido) quando `idade` é "16 a 17" — confirmação
   * de que um responsável está ciente do cadastro. Pra 18+ fica sempre false
   * e não bloqueia nada.
   */
  confirmacaoResponsavel: boolean;
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
  confirmacaoResponsavel: false,
};

/**
 * Extrai o número NACIONAL (DDD + assinante, 10 ou 11 dígitos), removendo um
 * DDI +55 quando ele existir.
 *
 * O DDD 55 é real (Caxias do Sul/RS) — não dá pra distinguir "DDI 55" de
 * "DDD 55" olhando só os dois primeiros dígitos. A distinção é o
 * COMPRIMENTO: um número nacional puro tem no máximo 11 dígitos; só cortamos
 * o "55" da frente quando sobram 12-13 dígitos no total, o que só acontece
 * quando ele é mesmo um DDI.
 *
 * Limitação conhecida e aceita: se a pessoa digitar o DDI manualmente dígito
 * por dígito (em vez de colar o número completo de uma vez), a máscara só
 * reconhece o DDI a partir do 12º dígito. Colar o número (o caso real que
 * gerava o bug) funciona corretamente porque chega tudo de uma vez.
 */
export function extrairDigitosNacionais(valor: string): string {
  const digitos = valor.replace(/\D/g, "");

  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) {
    return digitos.slice(2);
  }

  return digitos;
}

/** Formata o número como (00) 00000-0000 enquanto a pessoa digita. */
export function mascaraWhatsapp(valor: string) {
  const digitos = extrairDigitosNacionais(valor).slice(0, 11);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10)
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

/** Só os dígitos, no formato que o link do WhatsApp espera (55 + DDD + número). */
export function whatsappInternacional(valor: string) {
  return `55${extrairDigitosNacionais(valor)}`;
}

export function validarLead(campos: Lead): ErrosLead {
  const erros: ErrosLead = {};

  if (campos.nome.trim().length < 2) {
    erros.nome = "Escreve seu nome pra gente saber como te chamar.";
  } else if (campos.nome.trim().length > 120) {
    erros.nome = "Nome muito longo.";
  }

  const nacional = extrairDigitosNacionais(campos.whatsapp);
  const ddd = Number(nacional.slice(0, 2));
  // Nono dígito "9" é obrigatório em número de celular (11 dígitos); número
  // fixo tem 10. Checagem de formato plausível — não confirma que a conta
  // WhatsApp existe ou está ativa.
  const formatoPlausivel =
    (nacional.length === 10 || nacional.length === 11) &&
    ddd >= 11 &&
    ddd <= 99 &&
    !(nacional.length === 11 && nacional[2] !== "9") &&
    new Set(nacional).size > 1;

  if (!formatoPlausivel) {
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

  if (ehMenorDeIdade(campos.idade) && !campos.confirmacaoResponsavel) {
    erros.confirmacaoResponsavel =
      "Pra quem tem 16-17 anos, precisamos que um responsável esteja ciente.";
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
    // Canônico (só dígitos nacionais) — a formatação "(11) 91234-5678" é
    // responsabilidade só da UI, pra não gravar o mesmo telefone de formas
    // diferentes no banco dependendo de como a pessoa digitou.
    whatsapp: extrairDigitosNacionais(texto(b.whatsapp)),
    email: texto(b.email).toLowerCase(),
    idade: texto(b.idade),
    peso: texto(b.peso),
    contexto: texto(b.contexto),
    consentimento: b.consentimento === true,
    confirmacaoResponsavel: b.confirmacaoResponsavel === true,
  };
}
