"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  faixasIdade,
  opcoesPeso,
  mascaraWhatsapp,
  validarLead,
  leadVazio,
  ehMenorDeIdade,
  tamanhoDoRelato,
  CONTEXTO_MINIMO,
  CONTEXTO_MAXIMO,
  type Lead,
  type ErrosLead,
} from "@/lib/lead";
import { privacidadePublicada } from "@/config/site";
import { linkWhatsapp } from "@/lib/contato";
import { capturarAtribuicao, type Atribuicao } from "@/lib/atribuicao";
import { track } from "@/lib/tracking/events";

const linkSucesso = linkWhatsapp("sucesso");
const linkContingencia = linkWhatsapp("contingencia");

/** Ordem dos campos na tela — é nela que o foco vai pro primeiro erro. */
const ORDEM_DOS_CAMPOS: Array<keyof Lead> = [
  "nome",
  "idade",
  "whatsapp",
  "email",
  "peso",
  "contexto",
  "consentimento",
  "confirmacaoResponsavel",
];

function focarPrimeiroErro(erros: ErrosLead) {
  const primeiro = ORDEM_DOS_CAMPOS.find((campo) => erros[campo]);
  if (primeiro) document.getElementById(primeiro)?.focus();
}

const inputBase =
  "w-full rounded-xl border bg-onyx px-4 py-3.5 text-marfim transition-colors placeholder:text-marfim/60 focus:outline-none disabled:opacity-60";

function classesCampo(temErro: boolean) {
  return `${inputBase} ${
    temErro ? "border-erro" : "border-marfim/25 hover:border-marfim/40 focus:border-dourado"
  }`;
}

type Falha = { mensagem: string; ref?: string };

const FALHA_INCERTA =
  "Não consegui confirmar seu envio. Seus dados continuam aqui: tente de novo. Se você não mudar nada, o reenvio não cria um segundo cadastro.";

export function LeadForm() {
  const [campos, setCampos] = useState<Lead>(leadVazio);
  const [honeypot, setHoneypot] = useState("");
  const [erros, setErros] = useState<ErrosLead>({});
  const [falha, setFalha] = useState<Falha | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  // Uma chave por "sessão" desta submissão — gerada uma vez (inicializador
  // preguiçoso do useState, não recria a cada render) e reusada em todo
  // retry, pra um reenvio depois de falha nunca virar um segundo lead.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  // Origem lida da URL assim que o formulário monta (a query sobrevive a
  // reload; nada é guardado no aparelho). Se por algum motivo ainda for null
  // no envio, captura na hora.
  const atribuicaoRef = useRef<Atribuicao | null>(null);
  // Dispara lead_form_start uma vez só, na primeira interação de verdade.
  const iniciouRef = useRef(false);
  // Trava síncrona contra duplo clique: `enviando` só muda no próximo render.
  const emAndamentoRef = useRef(false);
  const tituloSucessoRef = useRef<HTMLHeadingElement>(null);
  const focoPendenteRef = useRef<ErrosLead | null>(null);

  useEffect(() => {
    atribuicaoRef.current = capturarAtribuicao();
  }, []);

  // O formulário some e o painel de sucesso entra no lugar: sem mover o foco,
  // quem usa teclado ou leitor de tela fica num elemento que não existe mais.
  useEffect(() => {
    if (enviado) tituloSucessoRef.current?.focus();
  }, [enviado]);

  // Erros devolvidos pelo servidor (422): foca o primeiro campo reprovado
  // assim que os campos voltam a estar habilitados.
  useEffect(() => {
    if (enviando || !focoPendenteRef.current) return;
    focarPrimeiroErro(focoPendenteRef.current);
    focoPendenteRef.current = null;
  }, [enviando]);

  function aoFocarFormulario() {
    if (iniciouRef.current) return;
    iniciouRef.current = true;
    track({ nome: "lead_form_start" });
  }

  function atualizar<C extends keyof Lead>(campo: C, valor: Lead[C]) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
    setErros((atual) => ({ ...atual, [campo]: undefined }));
    setFalha(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (emAndamentoRef.current) return;

    const novosErros = validarLead(campos);
    setErros(novosErros);

    if (Object.keys(novosErros).length > 0) {
      // Só os NOMES dos campos com erro — nunca o que foi digitado.
      track({ nome: "lead_form_error", campos: Object.keys(novosErros) });
      focarPrimeiroErro(novosErros);
      return;
    }

    emAndamentoRef.current = true;
    setEnviando(true);
    setFalha(null);

    // Os campos ficam bloqueados enquanto o pedido está no ar (fieldset
    // disabled), então o que foi enviado é exatamente o que está na tela.
    try {
      const enviarCom = (chave: string) =>
        fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            ...campos,
            empresa: honeypot,
            idempotencyKey: chave,
            atribuicao: atribuicaoRef.current ?? capturarAtribuicao(),
          }),
        });

      let chave = idempotencyKey;
      let resposta = await enviarCom(chave);

      // 409 = esta chave já gravou um cadastro com dados DIFERENTES (a pessoa
      // corrigiu algo depois de um erro). O servidor não sobrescreve lead
      // nenhum; aqui trocamos a chave e reenviamos uma vez, sem a pessoa
      // precisar fazer nada. A correção vira um cadastro novo e correto.
      if (resposta.status === 409) {
        chave = crypto.randomUUID();
        setIdempotencyKey(chave);
        resposta = await enviarCom(chave);
      }

      if (resposta.status === 422) {
        // O servidor revalida com as mesmas regras; se reprovou aqui, é porque
        // algo passou pelo cliente. Mostra os erros dele, mantém o que foi
        // digitado e leva o foco ao primeiro campo reprovado.
        const corpo = await resposta.json().catch(() => null);
        const errosServidor: ErrosLead = corpo?.erros ?? {};
        setErros(errosServidor);
        track({ nome: "lead_form_error", campos: Object.keys(errosServidor) });
        // O fieldset ainda está desabilitado aqui e campo desabilitado não
        // recebe foco: o efeito abaixo foca quando o envio termina de fato.
        focoPendenteRef.current = errosServidor;
        return;
      }

      if (resposta.status === 429) {
        const segundos = Number(resposta.headers.get("Retry-After"));
        const minutos =
          Number.isFinite(segundos) && segundos > 0 ? Math.ceil(segundos / 60) : null;
        setFalha({
          mensagem: minutos
            ? `Muitas tentativas em pouco tempo. Seus dados continuam aqui: tente de novo em cerca de ${minutos} ${minutos === 1 ? "minuto" : "minutos"}.`
            : "Muitas tentativas em pouco tempo. Seus dados continuam aqui: tente de novo em alguns minutos.",
        });
        return;
      }

      const dados = await resposta.json().catch(() => null);
      const ref = typeof dados?.ref === "string" ? dados.ref : undefined;

      if (resposta.status === 503) {
        setFalha({
          mensagem:
            "O envio está temporariamente indisponível. Seus dados continuam aqui: tente de novo em instantes.",
          ref,
        });
        return;
      }

      if (!resposta.ok || !dados?.ok) {
        setFalha({ mensagem: FALHA_INCERTA, ref });
        return;
      }

      // O evento de conversão sai AQUI, não num useEffect que observa
      // `enviado` — efeito re-executa em remount/StrictMode, chamada direta
      // não. E só com recibo: o servidor devolve `recibo` apenas depois de
      // confirmar a gravação (o descarte do honeypot responde ok SEM recibo,
      // então um robô nunca vira conversão). HTTP 200 sozinho não basta.
      if (dados.recibo === chave) {
        track({ nome: "generate_lead", recibo: dados.recibo });
      }

      setEnviado(true);
    } catch {
      // Rede caiu ou estourou o tempo: não dá pra saber se chegou a gravar
      // (pode ter sido só a resposta que se perdeu). Reenviar usa a MESMA
      // chave de idempotência, então tentar de novo sem mudar os dados não
      // duplica o cadastro.
      setFalha({ mensagem: FALHA_INCERTA });
    } finally {
      emAndamentoRef.current = false;
      setEnviando(false);
    }
  }

  const relato = tamanhoDoRelato(campos.contexto);
  // Texto que só muda ao cruzar um limite — assim o leitor de tela anuncia o
  // marco, e não um número novo a cada tecla.
  const marcoDoRelato =
    relato >= CONTEXTO_MAXIMO
      ? "Limite de 1.500 caracteres atingido."
      : relato >= CONTEXTO_MINIMO
        ? "Tamanho mínimo atingido."
        : "";

  return (
    <section
      id="formulario"
      className="border-t border-onyx-line bg-onyx-raised/50 px-5 py-14 sm:px-6 sm:py-20"
    >
      {/* Mesma grade das outras seções. Em tela larga: título e introdução à
          esquerda (acompanham a rolagem), formulário à direita. */}
      <div className="mx-auto max-w-[70rem] lg:grid lg:grid-cols-[5fr_7fr] lg:items-start lg:gap-14">
        <div className="mb-8 lg:sticky lg:top-28 lg:mb-0">
          <h2 className="font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            Me conte o que você está vivendo.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-marfim/75">
            Esse contexto me ajuda a chegar à conversa entendendo melhor o seu
            momento. Depois de enviar, você poderá falar comigo no WhatsApp.
          </p>
          <p className="mt-4 text-marfim/75">
            <a
              href="#duvidas"
              className="inline-flex min-h-11 items-center underline decoration-marfim/40 underline-offset-4 hover:text-marfim hover:decoration-dourado"
            >
              Tem dúvidas antes? Veja as respostas
            </a>
          </p>
        </div>

        {enviado ? (
          <div role="status" className="card-destaque rounded-2xl p-6 sm:p-9">
            <h3
              ref={tituloSucessoRef}
              tabIndex={-1}
              className="font-display text-2xl font-bold text-marfim outline-none! sm:text-3xl"
            >
              Contexto recebido.
            </h3>
            <p className="mt-3 text-lg leading-relaxed text-marfim/80">
              Agora você pode falar diretamente comigo no WhatsApp para
              combinarmos a conversa inicial.
            </p>
            {linkSucesso && (
              <a
                href={linkSucesso}
                data-whatsapp="sucesso"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex min-h-13 items-center justify-center rounded-xl bg-dourado px-7 py-4 text-center text-base font-bold text-onyx transition hover:brightness-110 active:brightness-95 sm:inline-flex"
              >
                Falar com Cauã no WhatsApp
              </a>
            )}
            <p className="mt-5 text-sm leading-relaxed text-marfim/70">
              O envio do formulário não agenda a conversa: é pelo WhatsApp que
              combinamos o horário. O botão abre a conversa com uma mensagem
              pronta, e ela só é enviada quando você confirmar.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            onFocus={aoFocarFormulario}
            noValidate
            aria-describedby="formulario-obrigatorios"
            className="rounded-2xl border border-marfim/15 bg-onyx p-5 sm:p-8"
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

            {/* Sem JavaScript o envio não funciona. Em vez de um botão que não
                faz nada, a pessoa recebe um caminho real pra continuar. */}
            <noscript>
              <div className="mb-6 rounded-xl border border-marfim/25 p-4 leading-relaxed text-marfim/85">
                <p>
                  Este formulário precisa de JavaScript para enviar, e ele está
                  desativado no seu navegador. Nada do que você escrever aqui
                  será enviado.
                </p>
                {linkContingencia && (
                  <p className="mt-2">
                    Você pode{" "}
                    <a
                      href={linkContingencia}
                      className="font-semibold text-dourado underline underline-offset-4"
                    >
                      falar comigo no WhatsApp
                    </a>{" "}
                    e contar o seu momento por lá.
                  </p>
                )}
              </div>
            </noscript>

            <p id="formulario-obrigatorios" className="mb-6 text-sm text-marfim/70">
              Todos os campos são obrigatórios.
            </p>

            {/* fieldset desabilitado durante o envio: bloqueia edição e novo
                clique de uma vez, então a tela de sucesso reflete o que foi
                de fato enviado. */}
            <fieldset
              disabled={enviando}
              className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0"
            >
              <legend className="sr-only">Seus dados e o seu momento</legend>

              <div className="grid gap-5 sm:grid-cols-2">
                <Campo id="nome" label="Nome" erro={erros.nome}>
                  <input
                    id="nome"
                    type="text"
                    autoComplete="name"
                    enterKeyHint="next"
                    required
                    aria-required="true"
                    maxLength={120}
                    value={campos.nome}
                    onChange={(e) => atualizar("nome", e.target.value)}
                    aria-invalid={!!erros.nome}
                    aria-describedby={erros.nome ? "nome-erro" : undefined}
                    className={classesCampo(!!erros.nome)}
                  />
                </Campo>

                <Campo id="idade" label="Faixa de idade" erro={erros.idade}>
                  <select
                    id="idade"
                    required
                    aria-required="true"
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
                      campos.idade ? "text-marfim" : "text-marfim/60"
                    }`}
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {faixasIdade.map((faixa) => (
                      <option key={faixa} value={faixa} className="text-marfim">
                        {faixa} anos
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Campo id="whatsapp" label="WhatsApp" erro={erros.whatsapp}>
                  <input
                    id="whatsapp"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    enterKeyHint="next"
                    required
                    aria-required="true"
                    placeholder="(11) 91234-5678"
                    value={campos.whatsapp}
                    onChange={(e) => atualizar("whatsapp", mascaraWhatsapp(e.target.value))}
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
                    required
                    aria-required="true"
                    maxLength={200}
                    value={campos.email}
                    onChange={(e) => atualizar("email", e.target.value)}
                    aria-invalid={!!erros.email}
                    aria-describedby={erros.email ? "email-erro" : undefined}
                    className={classesCampo(!!erros.email)}
                  />
                </Campo>
              </div>

              <Campo
                id="peso"
                label="O que mais pesa na sua decisão agora?"
                erro={erros.peso}
              >
                <select
                  id="peso"
                  required
                  aria-required="true"
                  value={campos.peso}
                  onChange={(e) => atualizar("peso", e.target.value)}
                  aria-invalid={!!erros.peso}
                  aria-describedby={erros.peso ? "peso-erro" : undefined}
                  className={`${classesCampo(!!erros.peso)} ${
                    campos.peso ? "text-marfim" : "text-marfim/60"
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
                label="Conte um pouco mais sobre o seu momento"
                marca="Obrigatório"
                erro={erros.contexto}
                ajuda={
                  <p id="contexto-ajuda" className="text-sm leading-relaxed text-marfim/75">
                    Qual decisão você precisa tomar? O que já tentou e o que está
                    dificultando? Escreva algumas frases, do seu jeito.
                  </p>
                }
              >
                <textarea
                  id="contexto"
                  rows={6}
                  required
                  aria-required="true"
                  minLength={CONTEXTO_MINIMO}
                  maxLength={CONTEXTO_MAXIMO}
                  placeholder="Por exemplo: estou terminando os estudos, penso em dois caminhos e ainda não sei o que considerar para escolher."
                  value={campos.contexto}
                  onChange={(e) => atualizar("contexto", e.target.value)}
                  aria-invalid={!!erros.contexto}
                  aria-describedby={`contexto-ajuda contexto-nota contexto-contador${
                    erros.contexto ? " contexto-erro" : ""
                  }`}
                  className={`${classesCampo(!!erros.contexto)} min-h-40 resize-y leading-relaxed`}
                />
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-sm text-marfim/70">
                  <p id="contexto-nota" className="max-w-md leading-relaxed">
                    Não inclua documentos, senhas, informações de saúde ou dados
                    de outras pessoas.
                  </p>
                  <p id="contexto-contador" className="shrink-0 tabular-nums">
                    {relato < CONTEXTO_MINIMO
                      ? `${relato} de ${CONTEXTO_MINIMO} no mínimo`
                      : `${relato.toLocaleString("pt-BR")} de 1.500`}
                  </p>
                </div>
                <p aria-live="polite" className="sr-only">
                  {marcoDoRelato}
                </p>
              </Campo>

              <Caixa
                id="consentimento"
                marcado={campos.consentimento}
                aoMudar={(v) => atualizar("consentimento", v)}
                erro={erros.consentimento}
              >
                Autorizo o contato de Cauã Lima, da ZXP Direciona, por WhatsApp
                e e-mail sobre a conversa inicial.
              </Caixa>

              {ehMenorDeIdade(campos.idade) && (
                <div className="rounded-xl border border-marfim/25 p-4">
                  {/* É uma declaração de quem preenche, não uma verificação da
                      identidade do responsável — o texto diz exatamente isso. */}
                  <Caixa
                    id="confirmacaoResponsavel"
                    marcado={campos.confirmacaoResponsavel}
                    aoMudar={(v) => atualizar("confirmacaoResponsavel", v)}
                    erro={erros.confirmacaoResponsavel}
                  >
                    Tenho 16 ou 17 anos e declaro que um responsável está ciente
                    deste cadastro e de acordo com o contato.
                  </Caixa>
                </div>
              )}
            </fieldset>

            {falha && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-erro/60 bg-erro/[0.08] p-4 leading-relaxed text-marfim"
              >
                <p>
                  <span aria-hidden="true" className="mr-2 font-bold text-erro">
                    !
                  </span>
                  {falha.mensagem}
                </p>
                {linkContingencia && (
                  <p className="mt-2 text-sm text-marfim/85">
                    Se continuar sem funcionar,{" "}
                    <a
                      href={linkContingencia}
                      data-whatsapp="falha"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-dourado underline underline-offset-4"
                    >
                      fale comigo no WhatsApp
                    </a>
                    .
                  </p>
                )}
                {falha.ref && (
                  <p className="mt-2 text-xs text-marfim/70">
                    Código para suporte: {falha.ref}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              aria-busy={enviando}
              className="mt-6 flex min-h-13 w-full items-center justify-center rounded-xl bg-dourado px-8 py-4 text-base font-bold text-onyx transition hover:brightness-110 active:brightness-95 disabled:cursor-progress disabled:opacity-70"
            >
              {enviando ? "Enviando…" : "Enviar meu contexto"}
            </button>

            <p className="mt-4 text-sm leading-relaxed text-marfim/70">
              O envio não agenda a conversa automaticamente: depois dele, você
              me chama no WhatsApp para combinarmos. Uso seus dados só para esse
              contato; eles ficam guardados nos serviços que operam o site.
              {privacidadePublicada && (
                <>
                  {" "}
                  <a
                    href="/privacidade"
                    className="underline underline-offset-4 hover:text-marfim"
                  >
                    Saiba mais sobre privacidade
                  </a>
                  .
                </>
              )}
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

function Erro({ id, children }: { id: string; children: ReactNode }) {
  // O "!" faz o erro não depender só da cor; role="alert" anuncia ao aparecer.
  return (
    <p id={id} role="alert" className="flex gap-2 text-sm leading-relaxed text-erro">
      <span aria-hidden="true" className="font-bold">
        !
      </span>
      <span>{children}</span>
    </p>
  );
}

function Campo({
  id,
  label,
  marca,
  ajuda,
  erro,
  children,
}: {
  id: string;
  label: string;
  /** Texto curto ao lado do rótulo (ex.: "Obrigatório"). */
  marca?: string;
  /** Ajuda persistente, entre o rótulo e o campo. */
  ajuda?: ReactNode;
  erro?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label
        htmlFor={id}
        className="flex flex-wrap items-baseline gap-x-2 text-base font-semibold text-marfim"
      >
        {label}
        {marca && <span className="text-sm font-normal text-marfim/70">{marca}</span>}
      </label>
      {ajuda}
      {children}
      {erro && <Erro id={`${id}-erro`}>{erro}</Erro>}
    </div>
  );
}

function Caixa({
  id,
  marcado,
  aoMudar,
  erro,
  children,
}: {
  id: string;
  marcado: boolean;
  aoMudar: (valor: boolean) => void;
  erro?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="flex min-h-11 cursor-pointer items-start gap-3 leading-relaxed text-marfim/85"
      >
        <input
          id={id}
          type="checkbox"
          required
          aria-required="true"
          checked={marcado}
          onChange={(e) => aoMudar(e.target.checked)}
          aria-invalid={!!erro}
          aria-describedby={erro ? `${id}-erro` : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 accent-dourado"
        />
        <span>{children}</span>
      </label>
      {erro && <Erro id={`${id}-erro`}>{erro}</Erro>}
    </div>
  );
}
