import { test } from "node:test";
import assert from "node:assert/strict";
import { validarLead } from "@/lib/lead";
import { after, esperarTarefasAposResposta } from "next/server";

// Prova que a infraestrutura de teste funciona: alias "@/", import sem
// extensão dentro de src/ e o dublê de next/server.
test("resolve o alias @/ e executa TypeScript direto", () => {
  assert.equal(typeof validarLead, "function");
});

test("dublê de after() roda em segundo plano e é esperável", async () => {
  let rodou = false;
  after(() => {
    rodou = true;
  });
  assert.equal(rodou, false, "after() não pode rodar de forma síncrona");
  await esperarTarefasAposResposta();
  assert.equal(rodou, true);
});
