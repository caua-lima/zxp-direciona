/**
 * O plano da RUMO.
 *
 * Por decisão de posicionamento existe UM único plano — sem Gold/Platinum,
 * sem níveis. Nome de nível ("Gold", "Pro", "Premium") sempre sugere que
 * existe algo melhor logo acima e faz a pessoa hesitar esperando a versão
 * superior. "Norte" é destino, não degrau: completo em si mesmo.
 *
 * Pra trocar o nome, mude só aqui — nada na lógica depende dessa string.
 */
export const plano = {
  nome: "RUMO Norte",
  chamada: "O plano único da RUMO",
  descricao:
    "Não existe versão básica nem versão premium. Existe um plano só, completo, porque direção não se vende pela metade.",

  /** Aparece abaixo da lista, mantendo a venda na conversa e não na página. */
  notaInvestimento:
    "O investimento é apresentado na call de diagnóstico, depois de entender o seu caso.",
};
