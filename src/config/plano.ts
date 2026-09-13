/**
 * O plano da ZXP Direciona.
 *
 * Por decisão de posicionamento existe UM único plano — sem Gold/Platinum,
 * sem níveis. Nome de nível ("Gold", "Pro", "Premium") sempre sugere que
 * existe algo melhor logo acima e faz a pessoa hesitar esperando a versão
 * superior.
 *
 * Antes do rebrand (era "RUMO"), o plano tinha nome próprio ("RUMO Norte")
 * pra se diferenciar do nome da mentoria. Agora que a mentoria se chama ZXP
 * Direciona — já um nome de produto, não uma marca genérica — criar um
 * segundo nome só pro plano vira redundância. Por isso `nome` repete o nome
 * do produto: é o único SKU que existe.
 *
 * Pra trocar, mude só aqui — nada na lógica depende dessa string.
 */
export const plano = {
  nome: "ZXP Direciona",
  chamada: "O plano",
  descricao:
    "Não existe versão básica nem versão premium. Existe um plano só, completo, porque direção não se vende pela metade.",

  /** Aparece abaixo da lista, mantendo a venda na conversa e não na página. */
  notaInvestimento:
    "O investimento é apresentado na call de diagnóstico, depois de entender o seu caso.",
};
