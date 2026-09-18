/**
 * Dublê de "next/server" pros testes. O `after()` de verdade só funciona
 * dentro do servidor do Next (fora dele lança erro). Este guarda a tarefa e
 * a dispara em segundo plano — igual ao contrato real: a resposta NÃO espera
 * por ela. O teste chama `esperarTarefasAposResposta()` pra observar o efeito.
 */
const pendentes: Promise<unknown>[] = [];

export function after(tarefa: () => unknown): void {
  pendentes.push(
    Promise.resolve().then(tarefa).catch(() => {
      // Igual ao Next: erro em after() não afeta a resposta já enviada.
    }),
  );
}

export async function esperarTarefasAposResposta(): Promise<void> {
  await Promise.allSettled(pendentes.splice(0));
}
