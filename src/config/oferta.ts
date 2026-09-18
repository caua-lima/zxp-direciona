/**
 * O que a mentoria entrega — e o que AINDA NÃO foi confirmado.
 *
 * Regra: só vai pra página o que está `publicado: true`. Um item nunca é
 * apagado por estar pendente: fica aqui com a `pendencia` escrita, aparece no
 * `npm run check:launch`, e volta pra página trocando uma linha.
 *
 * Todo texto abaixo vem da lista que você deu (duas conversas por mês,
 * suporte por WhatsApp, plano de ação, acompanhamento, apoio em decisões,
 * ideia de empreendimento). Descrições que eu tinha inventado por cima
 * ("com prazo e critério de pronto", "cobrança amiga", "do zero") saíram:
 * detalhe de serviço que ninguém confirmou não pode virar promessa pública.
 */

export type Entregavel = {
  titulo: string;
  publicado: boolean;
  /** Por que está fora da página e o que falta pra voltar. */
  pendencia?: string;
};

export type GrupoEntregaveis = {
  titulo: string;
  itens: Entregavel[];
};

export const gruposEntregaveis: GrupoEntregaveis[] = [
  {
    titulo: "Acompanhamento",
    itens: [
      { titulo: "Duas conversas individuais por mês", publicado: true },
      { titulo: "Suporte por WhatsApp entre as conversas", publicado: true },
      { titulo: "Acompanhamento contínuo da execução", publicado: true },
    ],
  },
  {
    titulo: "O que você leva",
    itens: [
      { titulo: "Plano de ação personalizado", publicado: true },
      { titulo: "Apoio nas suas decisões acadêmicas e profissionais", publicado: true },
      {
        titulo: "Construção de uma ideia de empreendimento de baixo investimento",
        publicado: true,
      },
    ],
  },
  {
    titulo: "Sessão complementar",
    itens: [
      {
        // Corrigido pelo dono: NÃO é terapeuta, é treinadora comportamental.
        // Com isso não há mais contradição com o "Não é terapia" da página.
        // Não escreva credencial, certificação ou método daqui sem o dono
        // confirmar — a página só afirma o que ele disse.
        titulo: "Uma conversa com treinadora comportamental",
        publicado: true,
      },
    ],
  },
];

/** Só os grupos que têm ao menos um item publicado, e só os itens publicados. */
export function gruposPublicados(): GrupoEntregaveis[] {
  return gruposEntregaveis
    .map((g) => ({ ...g, itens: g.itens.filter((i) => i.publicado) }))
    .filter((g) => g.itens.length > 0);
}

/** Itens fora da página, com o motivo — usado pelo check:launch. */
export function entregaveisPendentes(): Array<{ titulo: string; pendencia: string }> {
  return gruposEntregaveis
    .flatMap((g) => g.itens)
    .filter((i) => !i.publicado)
    .map((i) => ({ titulo: i.titulo, pendencia: i.pendencia ?? "sem motivo registrado" }));
}

/**
 * Fatos comerciais que ninguém informou. `null` = a página NÃO afirma nada
 * sobre isso (e diz que os detalhes vêm na conversa inicial). Preencha só com
 * o que é verdade e você consegue cumprir.
 */
export const termos = {
  /** Ex: "6 meses". Enquanto null, a duração não é afirmada em lugar nenhum. */
  duracaoDaMentoria: null as string | null,
  /** Ex: "até 1 dia útil". Enquanto null, nenhum prazo de retorno é prometido. */
  prazoDeRetorno: null as string | null,
};
