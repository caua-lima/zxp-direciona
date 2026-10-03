import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/Logo";
import { dadosPrivacidade, site } from "@/config/site";
import { tracking, trackingAtivo } from "@/config/tracking";

/**
 * Página de privacidade.
 *
 * Regra: cada frase aqui descreve algo que o código faz de fato (ver
 * src/app/api/leads/route.ts, src/lib/atribuicao.ts, src/lib/rateLimit.ts e
 * src/lib/notificacao.ts). Mudou o que o site coleta ou pra onde manda?
 * Mude este texto no mesmo commit e atualize `ATUALIZADA_EM`. Nada de
 * "conformidade total" nem promessa que ninguém verificou.
 */
const ATUALIZADA_EM = "3 de outubro de 2026";

export const metadata: Metadata = {
  title: `Privacidade — ${site.nome}`,
  description: `Quais dados a ${site.nome} coleta no formulário, pra quê, onde ficam e como pedir acesso, correção ou exclusão.`,
  alternates: { canonical: "/privacidade" },
};

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-bold text-marfim">{titulo}</h2>
      <div className="mt-3 flex flex-col gap-3 leading-relaxed text-marfim/75">
        {children}
      </div>
    </section>
  );
}

export default function Privacidade() {
  const { controlador, canalContato } = dadosPrivacidade;
  // Sem responsável e canal de contato reais, a página não existe — melhor
  // um 404 do que uma política que não diz a quem recorrer.
  if (!controlador || !canalContato) notFound();

  const fornecedoresMedicao = [
    tracking.gtm && "Google Tag Manager",
    tracking.ga4 && "Google Analytics",
    tracking.metaPixel && "Pixel da Meta",
  ].filter(Boolean) as string[];

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-onyx-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-3">
          <Link
            href="/"
            aria-label="ZXP Direciona — início"
            className="-mx-2 flex min-h-11 items-center rounded-lg px-2"
          >
            <Logo />
          </Link>
          <Link
            href="/"
            className="flex min-h-11 items-center text-sm font-semibold text-marfim/75 underline decoration-marfim/25 underline-offset-4 hover:text-marfim"
          >
            Voltar ao site
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Privacidade
        </h1>
        <p className="mt-3 text-sm text-marfim/60">
          Última atualização: {ATUALIZADA_EM}
        </p>
        <p className="mt-6 leading-relaxed text-marfim/75">
          Esta página explica, em linguagem direta, o que acontece com os dados
          que você envia pelo formulário da {site.nome}.
        </p>

        <Bloco titulo="Quem é o responsável">
          <p>
            O responsável pelo tratamento dos dados (controlador) é{" "}
            <strong className="text-marfim">{controlador}</strong>, à frente da{" "}
            {site.nome}, marca da {site.empresaMae}.
          </p>
          <p>
            Contato para qualquer assunto de privacidade:{" "}
            <a
              href={`mailto:${canalContato}`}
              className="font-semibold text-dourado underline underline-offset-4"
            >
              {canalContato}
            </a>
          </p>
        </Bloco>

        <Bloco titulo="Quais dados coletamos">
          <p>Só o que você preenche no formulário:</p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            <li>nome e número de WhatsApp;</li>
            <li>e-mail, se você informar (é opcional);</li>
            <li>faixa de idade;</li>
            <li>o que mais pesa hoje, entre as opções da lista;</li>
            <li>o texto livre sobre o seu momento, se você escrever (é opcional);</li>
            <li>a data e a hora em que você autorizou o contato.</li>
          </ul>
          <p>
            Junto com o cadastro, guardamos de onde veio a visita: os parâmetros
            de campanha do link (utm) e o endereço do site de origem, sem o
            caminho da página. Isso serve para saber quais divulgações
            funcionam.
          </p>
          <p>
            Para barrar envios automáticos em massa, registramos um código
            derivado do seu endereço IP, que muda a cada dia. O IP em si não é
            gravado no banco de dados.
          </p>
        </Bloco>

        <Bloco titulo="Para que usamos">
          <p>
            Para entrar em contato com você, por WhatsApp ou e-mail, e combinar
            a conversa inicial. Fazemos isso com base na autorização que você
            marca no formulário. Não há decisão automatizada sobre você.
          </p>
        </Bloco>

        <Bloco titulo="Quem tem 16 ou 17 anos">
          <p>
            Pedimos uma confirmação a mais: que um responsável esteja ciente do
            cadastro e de acordo com o contato. O formulário não é destinado a
            menores de 16 anos.
          </p>
        </Bloco>

        <Bloco titulo="Onde os dados ficam">
          <p>
            Os dados ficam em serviços contratados para operar o site, que os
            processam em nosso nome:
          </p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            <li>Supabase, o banco de dados onde o cadastro é guardado;</li>
            <li>Vercel, a hospedagem do site;</li>
            <li>
              Resend, serviço de e-mail usado para avisar a equipe de um novo
              cadastro. O texto livre que você escreve não vai nesse e-mail.
            </li>
          </ul>
          <p>
            Esses serviços podem armazenar dados em servidores fora do Brasil.
          </p>
        </Bloco>

        <Bloco titulo="Medição e anúncios">
          {trackingAtivo ? (
            <>
              <p>
                O site usa {fornecedoresMedicao.join(", ")} para entender de onde
                vêm os visitantes e se os anúncios funcionam. Essas ferramentas
                só são carregadas depois que você aceita no aviso que aparece na
                página. Recusar não muda nada no cadastro.
              </p>
              <p>
                Você pode mudar a sua escolha quando quiser, em “Preferências de
                medição”, no rodapé do site.
              </p>
            </>
          ) : (
            <p>
              Hoje o site não usa ferramentas de medição nem de anúncios de
              terceiros, e não grava cookies de rastreamento. Se isso mudar,
              esta página será atualizada e o site passará a pedir a sua escolha
              antes de carregar qualquer ferramenta.
            </p>
          )}
        </Bloco>

        <Bloco titulo="Por quanto tempo">
          <p>
            Guardamos o seu cadastro enquanto o contato com você estiver em
            andamento ou até você pedir a exclusão.
          </p>
        </Bloco>

        <Bloco titulo="Seus direitos">
          <p>
            Pela Lei Geral de Proteção de Dados (LGPD), você pode pedir a
            qualquer momento:
          </p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            <li>a confirmação de que temos dados seus e uma cópia deles;</li>
            <li>a correção de dados errados ou desatualizados;</li>
            <li>a exclusão do seu cadastro;</li>
            <li>a retirada da autorização de contato.</li>
          </ul>
          <p>
            Basta escrever para{" "}
            <a
              href={`mailto:${canalContato}`}
              className="font-semibold text-dourado underline underline-offset-4"
            >
              {canalContato}
            </a>
            . Você também pode reclamar à Autoridade Nacional de Proteção de
            Dados (ANPD).
          </p>
        </Bloco>
      </main>

      <footer className="border-t border-onyx-line px-6 py-8 text-center text-xs text-marfim/55">
        © {new Date().getFullYear()} {site.empresaMae}
      </footer>
    </div>
  );
}
