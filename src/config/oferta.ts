/**
 * O que a página afirma sobre o serviço.
 *
 * Decisão do dono: a lista de entregas NÃO fica na página (ainda não está
 * 100% definida) e o método só é apresentado dentro da conversa inicial. Por
 * isso não existe mais lista de entregáveis aqui. Se um dia voltar, volta com
 * o que estiver de fato definido — nada de reaproveitar a lista antiga.
 */

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
