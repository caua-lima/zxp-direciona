"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Reveal } from "./Reveal";
import {
  faixasIdade,
  opcoesPeso,
  mascaraWhatsapp,
  whatsappInternacional,
  validarLead,
  leadVazio,
  ehMenorDeIdade,
  type Lead,
  type ErrosLead,
} from "@/lib/lead";
import { contatoComercial } from "@/config/site";
import { capturarAtribuicao, type Atribuicao } from "@/lib/atribuicao";
import { track } from "@/lib/tracking/events";

// null enquanto o WhatsApp comercial não for preenchido em
// src/config/site.ts — nesse caso o link some das telas abaixo em vez de
// apontar pra um número que não existe.
const linkWhatsappComercial = contatoComercial.whatsapp
  ? `https://wa.me/${whatsappInternacional(contatoComercial.whatsapp)}`
  : null;

const inputBase =
  "w-full rounded-xl border bg-onyx px-4 py-3.5 text-marfim transition placeholder:text-marfim/45 focus:outline-none";

function classesCampo(temErro: boolean) {
  return `${inputBase} ${
    temErro ? "border-dourado/60" : "border-onyx-line focus:border-dourado"
  }`;
}

export function LeadForm() {
  const [campos, setCampos] = useState<Lead>(leadVazio);
  const [honeypot, setHoneypot] = useState("");
  const [erros, setErros] = useState<ErrosLead>({});
  const [falhaEnvio, setFalhaEnvio] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  // Uma chave por "sessão" desta submissão — gerada uma vez (inicializador
  // preguiçoso do useState, não recria a cada render) e reusada em todo
  // retry, pra um reenvio depois de falha nunca virar um segundo lead.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  // Origem lida da URL assim que o formulário monta (a query sobrevive a
  // reload; nada é guardado no aparelho). Se por algum motivo ainda for null
  // no envio, captura na hora.
  const atribuicaoRef = useRef<Atribuicao | null>(null);
  // Dispara lead_form_start uma vez só, na primeira interação de verdade.
  const iniciouRef = useRef(false);

  useEffect(() => {
    atribuicaoRef.current = capturarAtribuicao();
  }, []);

  function aoFocarFormulario() {
    if (iniciouRef.current) return;
    iniciouRef.current = true;
    track({ nome: "lead_form_start" });
  }

  function atualizar<C extends keyof Lead>(campo: C, valor: Lead[C]) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
    setFalhaEnvio(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const novosErros = validarLead(campos);
    setErros(novosErros);

    if (Object.keys(novosErros).length > 0) {
      // Só os NOMES dos campos com erro — nunca o que foi digitado.
      track({ nome: "lead_form_error", campos: Object.keys(novosErros) });
      document.getElementById(Object.keys(novosErros)[0])?.focus();
      return;
    }

    setEnviando(true);
    setFalhaEnvio(null);

    try {
      const resposta = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          ...campos,
          empresa: honeypot,
          idempotencyKey,
          atribuicao: atribuicaoRef.current ?? capturarAtribuicao(),
        }),
      });

      if (resposta.status === 422) {
        // O servidor revalida com as mesmas regras; se reprovou aqui, é porque
        // algo passou pelo cliente. Mostra os erros dele e não perde o que foi
        // digitado.
        const { erros: errosServidor } = await resposta.json();
        setErros(errosServidor ?? {});
        track({ nome: "lead_form_error", campos: Object.keys(errosServidor ?? {}) });
        setEnviando(false);
        return;
      }

      if (resposta.status === 429) {
        setFalhaEnvio(
          "Muitas tentativas em pouco tempo. Espera alguns minutos e tenta de novo.",
        );
        setEnviando(false);
        return;
      }

      if (resposta.status === 503) {
        setFalhaEnvio(
          "O cadastro está temporariamente indisponível. Tenta de novo em instantes — se continuar, me chama direto no WhatsApp.",
        );
        setEnviando(false);
        return;
      }

      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

      const dados = await resposta.json().catch(() => null);
      if (!dados?.ok) throw new Error("Resposta inesperada do servidor.");

      // O evento de conversão sai AQUI, não num useEffect que observa
      // `enviado` — efeito re-executa em remount/StrictMode, chamada direta
      // não. E só com recibo: o servidor devolve `recibo` apenas depois de
      // confirmar a gravação (o descarte do honeypot responde ok SEM recibo,
      // então um robô nunca vira conversão). HTTP 200 sozinho não basta.
      if (dados.recibo === idempotencyKey) {
        track({ nome: "generate_lead", recibo: dados.recibo });
      }

      setEnviado(true);
    } catch {
      // Não dá pra saber com certeza se chegou a gravar (pode ter sido só a
      // resposta que se perdeu) — mas como reenviar usa a MESMA chave de
      // idempotência, tentar de novo é seguro: nunca cria um segundo lead.
      setFalhaEnvio(
        "Não consegui confirmar seu cadastro. Tenta de novo — é seguro, não vai duplicar. Se continuar, me chama direto no WhatsApp.",
      );
    } finally {
      setEnviando(false);
    }
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
              <p className="mt-4 text-sm text-marfim/55">
                Se preferir, deixe o número salvo — a conversa começa por lá.
              </p>
              {linkWhatsappComercial && (
                <a
                  href={linkWhatsappComercial}
                  data-whatsapp="sucesso"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-block text-sm font-semibold text-dourado underline underline-offset-4"
                >
                  Ou chama a gente primeiro, no WhatsApp
                </a>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              onFocus={aoFocarFormulario}
              noValidate
              className="flex flex-col gap-5 rounded-2xl border border-onyx-line bg-onyx-raised p-6 sm:p-8"
            >
              {/* Armadilha anti-bot: fora da tela, invisível pra leitor de tela
                  e fora da navegação por teclado. Só robô preenche. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
              >
                <label htmlFor="empresa">Empresa</label>
                <input
                  id="empresa"
                  name="empresa"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <Campo id="nome" label="Nome" erro={erros.nome}>
                <input
                  id="nome"
                  type="text"
                  autoComplete="name"
                  enterKeyHint="next"
                  placeholder="Como você se chama?"
                  value={campos.nome}
                  onChange={(e) => atualizar("nome", e.target.value)}
                  aria-invalid={!!erros.nome}
                  aria-describedby={erros.nome ? "nome-erro" : undefined}
                  className={classesCampo(!!erros.nome)}
                />
              </Campo>

              <Campo id="whatsapp" label="WhatsApp" erro={erros.whatsapp}>
                <input
                  id="whatsapp"
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
                  aria-describedby={erros.whatsapp ? "whatsapp-erro" : undefined}
                  className={classesCampo(!!erros.whatsapp)}
                />
              </Campo>

              <Campo id="email" label="E-mail" erro={erros.email}>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  enterKeyHint="next"
                  placeholder="seuemail@exemplo.com"
                  value={campos.email}
                  onChange={(e) => atualizar("email", e.target.value)}
                  aria-invalid={!!erros.email}
                  aria-describedby={erros.email ? "email-erro" : undefined}
                  className={classesCampo(!!erros.email)}
                />
              </Campo>

              <Campo id="idade" label="Sua idade" erro={erros.idade}>
                <select
                  id="idade"
                  value={campos.idade}
                  onChange={(e) => {
                    atualizar("idade", e.target.value);
                    // Troca de faixa reseta a confirmação de responsável —
                    // evita carregar um "sim" que valia pra outra faixa.
                    atualizar("confirmacaoResponsavel", false);
                  }}
                  aria-invalid={!!erros.idade}
                  aria-describedby={erros.idade ? "idade-erro" : undefined}
                  className={`${classesCampo(!!erros.idade)} ${
                    campos.idade ? "text-marfim" : "text-marfim/55"
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
              </Campo>

              <Campo
                id="peso"
                label="O que mais pesa pra você agora?"
                erro={erros.peso}
              >
                <select
                  id="peso"
                  value={campos.peso}
                  onChange={(e) => atualizar("peso", e.target.value)}
                  aria-invalid={!!erros.peso}
                  aria-describedby={erros.peso ? "peso-erro" : undefined}
                  className={`${classesCampo(!!erros.peso)} ${
                    campos.peso ? "text-marfim" : "text-marfim/55"
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
              </Campo>

              <Campo
                id="contexto"
                label="Quer contar mais?"
                opcional
                erro={erros.contexto}
              >
                <textarea
                  id="contexto"
                  rows={3}
                  maxLength={400}
                  enterKeyHint="done"
                  placeholder="Em uma ou duas frases, o que está acontecendo agora."
                  value={campos.contexto}
                  onChange={(e) => atualizar("contexto", e.target.value)}
                  aria-invalid={!!erros.contexto}
                  aria-describedby={erros.contexto ? "contexto-erro" : undefined}
                  className={`${classesCampo(!!erros.contexto)} resize-none`}
                />
              </Campo>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="consentimento"
                  className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-marfim/70"
                >
                  <input
                    id="consentimento"
                    type="checkbox"
                    checked={campos.consentimento}
                    onChange={(e) =>
                      atualizar("consentimento", e.target.checked)
                    }
                    aria-invalid={!!erros.consentimento}
                    aria-describedby={
                      erros.consentimento ? "consentimento-erro" : undefined
                    }
                    className="mt-0.5 h-5 w-5 shrink-0 accent-dourado"
                  />
                  <span>
                    Autorizo o contato da ZXP Direciona por WhatsApp e e-mail
                    sobre a call de diagnóstico.
                  </span>
                </label>
                {erros.consentimento && (
                  <p
                    id="consentimento-erro"
                    role="alert"
                    className="text-sm text-dourado"
                  >
                    {erros.consentimento}
                  </p>
                )}
              </div>

              {ehMenorDeIdade(campos.idade) && (
                <div className="flex flex-col gap-2 rounded-xl border border-dourado/25 bg-dourado/[0.05] p-4">
                  <label
                    htmlFor="confirmacaoResponsavel"
                    className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-marfim/80"
                  >
                    <input
                      id="confirmacaoResponsavel"
                      type="checkbox"
                      checked={campos.confirmacaoResponsavel}
                      onChange={(e) =>
                        atualizar("confirmacaoResponsavel", e.target.checked)
                      }
                      aria-invalid={!!erros.confirmacaoResponsavel}
                      aria-describedby={
                        erros.confirmacaoResponsavel
                          ? "confirmacaoResponsavel-erro"
                          : undefined
                      }
                      className="mt-0.5 h-5 w-5 shrink-0 accent-dourado"
                    />
                    <span>
                      Como você tem 16 ou 17 anos, confirmo que um responsável
                      está ciente deste cadastro e de acordo com o contato.
                    </span>
                  </label>
                  {erros.confirmacaoResponsavel && (
                    <p
                      id="confirmacaoResponsavel-erro"
                      role="alert"
                      className="text-sm text-dourado"
                    >
                      {erros.confirmacaoResponsavel}
                    </p>
                  )}
                </div>
              )}

              {falhaEnvio && (
                <div
                  role="alert"
                  className="rounded-xl border border-dourado/40 bg-dourado/[0.07] p-4 text-sm leading-relaxed text-marfim"
                >
                  <p>{falhaEnvio}</p>
                  {linkWhatsappComercial && (
                    <a
                      href={linkWhatsappComercial}
                      data-whatsapp="falha"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block font-semibold text-dourado underline underline-offset-4"
                    >
                      Chamar direto no WhatsApp
                    </a>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="mt-1 rounded-xl bg-dourado px-8 py-4 text-base font-bold text-onyx shadow-lg shadow-dourado/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? "Enviando…" : "Quero conversar"}
              </button>

              <p className="text-center text-xs leading-relaxed text-marfim/55">
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
  children,
}: {
  id: string;
  label: string;
  erro?: string;
  opcional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-semibold text-marfim/80"
      >
        {label}
        {opcional && (
          <span className="text-xs font-normal text-marfim/55">(opcional)</span>
        )}
      </label>
      {children}
      {erro && (
        <p id={`${id}-erro`} role="alert" className="text-sm text-dourado">
          {erro}
        </p>
      )}
    </div>
  );
}
