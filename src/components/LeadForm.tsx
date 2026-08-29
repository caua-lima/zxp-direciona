"use client";

import { useState, type FormEvent } from "react";
import { Reveal } from "./Reveal";

const faixasIdade = ["16 a 18", "19 a 21", "22 a 25", "26 ou mais"];

const opcoesPeso = [
  "Não sei qual curso ou carreira escolher",
  "Escolhi, mas não me identifico mais",
  "Preciso decidir entre trabalhar, empreender ou estudar",
  "A pressão da minha família por uma decisão",
  "Sei o que quero, mas não sei como começar",
  "Outro",
];

type Campos = {
  nome: string;
  whatsapp: string;
  email: string;
  idade: string;
  peso: string;
  contexto: string;
};

type Erros = Partial<Record<keyof Campos, string>>;

const inicial: Campos = {
  nome: "",
  whatsapp: "",
  email: "",
  idade: "",
  peso: "",
  contexto: "",
};

/** Formata o número como (00) 00000-0000 enquanto a pessoa digita. */
function mascaraWhatsapp(valor: string) {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);

  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10)
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function validar(campos: Campos): Erros {
  const erros: Erros = {};

  if (campos.nome.trim().length < 2) {
    erros.nome = "Escreve seu nome pra gente saber como te chamar.";
  }

  const digitos = campos.whatsapp.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 11) {
    erros.whatsapp = "Coloca o WhatsApp com DDD, ex: (11) 91234-5678.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(campos.email.trim())) {
    erros.email = "Confere o e-mail — parece que faltou alguma coisa.";
  }

  if (!campos.idade) erros.idade = "Escolhe sua faixa de idade.";
  if (!campos.peso) erros.peso = "Escolhe a opção que mais se parece com você.";

  return erros;
}

const inputBase =
  "w-full rounded-xl border bg-onyx px-4 py-3.5 text-marfim transition placeholder:text-marfim/30 focus:outline-none";

export function LeadForm() {
  const [campos, setCampos] = useState<Campos>(inicial);
  const [erros, setErros] = useState<Erros>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function atualizar(campo: keyof Campos, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    // limpa o erro assim que a pessoa corrige o campo
    setErros((atual) => ({ ...atual, [campo]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const novosErros = validar(campos);
    setErros(novosErros);

    if (Object.keys(novosErros).length > 0) {
      // leva o foco pro primeiro campo com erro
      const primeiro = Object.keys(novosErros)[0];
      document.getElementById(primeiro)?.focus();
      return;
    }

    setEnviando(true);

    // ─────────────────────────────────────────────────────────────────
    // ⚠️ MOCK — não há integração de envio real ainda.
    // Plugue o backend aqui. Opções:
    //   • Route handler próprio:  await fetch("/api/leads", {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify(campos),
    //     });
    //   • Webhook (Zapier / Make / n8n): troque a URL acima pela do webhook.
    //   • Google Sheets: endpoint de um Apps Script publicado como Web App.
    //   • CRM (RD Station, HubSpot, Pipedrive): endpoint da API do CRM.
    // Lembre de tratar o erro de rede e mostrar mensagem pra pessoa.
    // ─────────────────────────────────────────────────────────────────
    await new Promise((resolve) => setTimeout(resolve, 600));

    setEnviando(false);
    setEnviado(true);
  }

  return (
    <section
      id="formulario"
      className="grain relative isolate overflow-hidden px-6 py-20 sm:py-28"
    >
      <div className="glow-dourado absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto max-w-xl">
        <Reveal>
          <div className="mb-8 text-center">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.16em] text-dourado uppercase">
              Próximo passo
            </p>
            <h2 className="font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
              Vamos conversar sobre o seu caso
            </h2>
            <p className="mt-4 text-marfim/60">
              Preencha os campos abaixo e eu chamo você no WhatsApp pra marcar a
              call de diagnóstico. Leva menos de um minuto.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          {enviado ? (
            <div
              role="status"
              className="card-destaque rounded-2xl p-8 text-center"
            >
              <span
                aria-hidden="true"
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-dourado/15 text-2xl text-dourado"
              >
                ✓
              </span>
              <p className="font-display mt-5 text-2xl font-bold text-dourado">
                Recebido, {campos.nome.trim().split(" ")[0]}.
              </p>
              <p className="mt-3 leading-relaxed text-marfim/70">
                Vou te chamar no WhatsApp{" "}
                <strong className="text-marfim">{campos.whatsapp}</strong> pra
                combinar o horário da sua call de diagnóstico.
              </p>
              <p className="mt-4 text-sm text-marfim/40">
                Se preferir, deixe o número salvo — a conversa começa por lá.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-5 rounded-2xl border border-onyx-line bg-onyx-raised p-6 sm:p-8"
            >
              <Campo
                id="nome"
                label="Nome"
                erro={erros.nome}
                input={
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    autoComplete="name"
                    enterKeyHint="next"
                    placeholder="Como você se chama?"
                    value={campos.nome}
                    onChange={(e) => atualizar("nome", e.target.value)}
                    aria-invalid={!!erros.nome}
                    aria-describedby={erros.nome ? "nome-erro" : undefined}
                    className={`${inputBase} ${
                      erros.nome
                        ? "border-dourado/60"
                        : "border-onyx-line focus:border-dourado"
                    }`}
                  />
                }
              />

              <Campo
                id="whatsapp"
                label="WhatsApp"
                erro={erros.whatsapp}
                input={
                  <input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    enterKeyHint="next"
                    placeholder="(11) 91234-5678"
                    value={campos.whatsapp}
                    onChange={(e) =>
                      atualizar("whatsapp", mascaraWhatsapp(e.target.value))
                    }
                    aria-invalid={!!erros.whatsapp}
                    aria-describedby={
                      erros.whatsapp ? "whatsapp-erro" : undefined
                    }
                    className={`${inputBase} ${
                      erros.whatsapp
                        ? "border-dourado/60"
                        : "border-onyx-line focus:border-dourado"
                    }`}
                  />
                }
              />

              <Campo
                id="email"
                label="E-mail"
                erro={erros.email}
                input={
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    enterKeyHint="next"
                    placeholder="seuemail@exemplo.com"
                    value={campos.email}
                    onChange={(e) => atualizar("email", e.target.value)}
                    aria-invalid={!!erros.email}
                    aria-describedby={erros.email ? "email-erro" : undefined}
                    className={`${inputBase} ${
                      erros.email
                        ? "border-dourado/60"
                        : "border-onyx-line focus:border-dourado"
                    }`}
                  />
                }
              />

              <Campo
                id="idade"
                label="Sua idade"
                erro={erros.idade}
                input={
                  <select
                    id="idade"
                    name="idade"
                    value={campos.idade}
                    onChange={(e) => atualizar("idade", e.target.value)}
                    aria-invalid={!!erros.idade}
                    aria-describedby={erros.idade ? "idade-erro" : undefined}
                    className={`${inputBase} ${
                      campos.idade ? "text-marfim" : "text-marfim/30"
                    } ${
                      erros.idade
                        ? "border-dourado/60"
                        : "border-onyx-line focus:border-dourado"
                    }`}
                  >
                    <option value="" disabled>
                      Selecione sua faixa de idade
                    </option>
                    {faixasIdade.map((faixa) => (
                      <option key={faixa} value={faixa} className="text-marfim">
                        {faixa} anos
                      </option>
                    ))}
                  </select>
                }
              />

              <Campo
                id="peso"
                label="O que mais pesa pra você agora?"
                erro={erros.peso}
                input={
                  <select
                    id="peso"
                    name="peso"
                    value={campos.peso}
                    onChange={(e) => atualizar("peso", e.target.value)}
                    aria-invalid={!!erros.peso}
                    aria-describedby={erros.peso ? "peso-erro" : undefined}
                    className={`${inputBase} ${
                      campos.peso ? "text-marfim" : "text-marfim/30"
                    } ${
                      erros.peso
                        ? "border-dourado/60"
                        : "border-onyx-line focus:border-dourado"
                    }`}
                  >
                    <option value="" disabled>
                      Selecione a opção mais parecida
                    </option>
                    {opcoesPeso.map((opcao) => (
                      <option key={opcao} value={opcao} className="text-marfim">
                        {opcao}
                      </option>
                    ))}
                  </select>
                }
              />

              <Campo
                id="contexto"
                label="Quer contar mais?"
                opcional
                input={
                  <textarea
                    id="contexto"
                    name="contexto"
                    rows={3}
                    maxLength={400}
                    enterKeyHint="done"
                    placeholder="Em uma ou duas frases, o que está acontecendo agora."
                    value={campos.contexto}
                    onChange={(e) => atualizar("contexto", e.target.value)}
                    className={`${inputBase} resize-none border-onyx-line focus:border-dourado`}
                  />
                }
              />

              <button
                type="submit"
                disabled={enviando}
                className="mt-1 rounded-xl bg-dourado px-8 py-4 text-base font-bold text-onyx shadow-lg shadow-dourado/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? "Enviando…" : "Quero conversar"}
              </button>

              <p className="text-center text-xs leading-relaxed text-marfim/40">
                Seus dados são usados só pra entrar em contato sobre a call.
                Nada de spam, nada compartilhado com terceiros.
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

function Campo({
  id,
  label,
  erro,
  opcional,
  input,
}: {
  id: string;
  label: string;
  erro?: string;
  opcional?: boolean;
  input: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-semibold text-marfim/80"
      >
        {label}
        {opcional && (
          <span className="text-xs font-normal text-marfim/35">(opcional)</span>
        )}
      </label>
      {input}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-sm text-dourado">
          {erro}
        </p>
      )}
    </div>
  );
}
