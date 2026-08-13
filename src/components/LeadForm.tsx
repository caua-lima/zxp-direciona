"use client";

import { useState, type FormEvent } from "react";
import { Section } from "./Section";

const opcoesPeso = [
  "Não sei qual curso ou carreira escolher",
  "Estou insatisfeito com o que já escolhi",
  "Preciso decidir entre trabalhar, empreender ou estudar",
  "A pressão da família por uma decisão",
  "Outro",
];

export function LeadForm() {
  const [enviado, setEnviado] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // MOCK — sem integração de envio real.
    // Plugue aqui o backend real: webhook (ex: fetch para um endpoint próprio
    // ou Zapier/Make), Google Sheets via Apps Script, ou API de um CRM
    // (RD Station, HubSpot, etc). Exemplo:
    //
    // const formData = new FormData(event.currentTarget);
    // await fetch("/api/leads", { method: "POST", body: formData });

    setEnviado(true);
  }

  return (
    <Section
      id="formulario"
      eyebrow="Próximo passo"
      title="Quero minha call de diagnóstico"
      className="bg-onyx-soft"
    >
      {enviado ? (
        <div className="rounded-xl border border-dourado/30 bg-dourado/[0.06] p-6 text-marfim">
          <p className="font-display text-lg font-bold text-dourado">
            Recebemos seu contato.
          </p>
          <p className="mt-2 text-marfim/80">
            Em breve alguém da RUMO vai chamar você no WhatsApp pra agendar a
            sua call de diagnóstico.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="nome" className="text-sm font-semibold text-marfim/80">
              Nome
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              placeholder="Seu nome completo"
              className="rounded-lg border border-marfim/15 bg-onyx px-4 py-3 text-marfim placeholder:text-marfim/40 focus:border-dourado focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="whatsapp" className="text-sm font-semibold text-marfim/80">
              WhatsApp
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              required
              placeholder="(00) 00000-0000"
              className="rounded-lg border border-marfim/15 bg-onyx px-4 py-3 text-marfim placeholder:text-marfim/40 focus:border-dourado focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-semibold text-marfim/80">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="seuemail@exemplo.com"
              className="rounded-lg border border-marfim/15 bg-onyx px-4 py-3 text-marfim placeholder:text-marfim/40 focus:border-dourado focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="peso" className="text-sm font-semibold text-marfim/80">
              O que mais pesa pra você agora?
            </label>
            <select
              id="peso"
              name="peso"
              required
              defaultValue=""
              className="rounded-lg border border-marfim/15 bg-onyx px-4 py-3 text-marfim focus:border-dourado focus:outline-none"
            >
              <option value="" disabled>
                Selecione uma opção
              </option>
              {opcoesPeso.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="mt-2 rounded-lg bg-dourado px-8 py-4 text-base font-bold text-onyx transition hover:brightness-110"
          >
            Quero conversar
          </button>
        </form>
      )}
    </Section>
  );
}
