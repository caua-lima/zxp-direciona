/**
 * Ensina o Node (que já executa TypeScript direto) a resolver o que o Next
 * resolve por conta própria: o alias "@/" e imports sem extensão. Usado pelos
 * testes e pelo script de reprocessar notificações — assim eles rodam o MESMO
 * código de src/, sem build e sem dependência nova (nada de ts-node/vitest/jest).
 *
 * Uso: node --import ./scripts/ts-resolver.mjs ...
 */

import { registerHooks } from "node:module";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const raiz = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const EXTENSOES = [".ts", ".tsx", ".mjs", ".js"];

// `after()` do Next só existe dentro de uma requisição do servidor do Next.
// Nos testes, um dublê que guarda a tarefa e deixa o teste esperá-la.
const DUBLES = {
  "next/server": path.join(raiz, "test/dubles/next-server.ts"),
};

function comoArquivo(base) {
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of EXTENSOES) if (existsSync(base + ext)) return base + ext;
  for (const ext of EXTENSOES) {
    const indice = path.join(base, `index${ext}`);
    if (existsSync(indice)) return indice;
  }
  return null;
}

registerHooks({
  resolve(especificador, contexto, proximo) {
    if (DUBLES[especificador]) {
      return { url: pathToFileURL(DUBLES[especificador]).href, shortCircuit: true };
    }

    let base = null;
    if (especificador.startsWith("@/")) {
      base = path.join(raiz, "src", especificador.slice(2));
    } else if (
      (especificador.startsWith("./") || especificador.startsWith("../")) &&
      contexto.parentURL?.startsWith("file:")
    ) {
      base = path.resolve(
        path.dirname(fileURLToPath(contexto.parentURL)),
        especificador,
      );
    }

    if (base) {
      const arquivo = comoArquivo(base);
      if (arquivo) {
        return { url: pathToFileURL(arquivo).href, shortCircuit: true };
      }
    }
    return proximo(especificador, contexto);
  },
});
