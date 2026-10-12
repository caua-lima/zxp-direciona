/**
 * Lê o corpo de uma requisição com teto em BYTES, parando assim que o teto
 * é ultrapassado.
 *
 * Por que não `request.text()` seguido de uma checagem: aí o corpo inteiro
 * já foi lido e alocado antes de qualquer limite valer, e `string.length`
 * conta unidades UTF-16, não bytes — "é" tem length 1 e ocupa 2 bytes, um
 * emoji tem length 2 e ocupa 4. O `Content-Length` também não serve sozinho:
 * pode estar ausente (envio em pedaços) ou mentir.
 *
 * Aqui os pedaços são somados conforme chegam; passou do teto, a leitura é
 * cancelada na hora e o que sobrou do corpo nem é recebido.
 */
export type CorpoLido =
  | { ok: true; texto: string }
  | { ok: false; motivo: "grande" | "invalido" };

export async function lerCorpoLimitado(
  request: Request,
  maximoBytes: number,
): Promise<CorpoLido> {
  // Atalho barato: se o cabeçalho JÁ declara mais que o teto, nem começa a
  // ler. Declarar menos não ajuda quem envia — a contagem real vem abaixo.
  const declarado = Number(request.headers.get("content-length"));
  if (Number.isFinite(declarado) && declarado > maximoBytes) {
    return { ok: false, motivo: "grande" };
  }

  if (!request.body) return { ok: true, texto: "" };

  const leitor = request.body.getReader();
  const pedacos: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      total += value.byteLength;
      if (total > maximoBytes) {
        await leitor.cancel().catch(() => {});
        return { ok: false, motivo: "grande" };
      }
      pedacos.push(value);
    }
  } catch {
    return { ok: false, motivo: "invalido" };
  }

  const bytes = new Uint8Array(total);
  let posicao = 0;
  for (const pedaco of pedacos) {
    bytes.set(pedaco, posicao);
    posicao += pedaco.byteLength;
  }

  try {
    // fatal: sequência que não é UTF-8 válido é recusada, em vez de virar
    // caractere de substituição e seguir adiante como se fosse texto.
    return { ok: true, texto: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, motivo: "invalido" };
  }
}
