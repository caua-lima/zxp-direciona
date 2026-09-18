# ZXP Direciona — Landing page de captação

LP da **ZXP Direciona**, mentoria de direção profissional da ZXP Solutions.
Renomeada em 2026-09-13 (antigo nome: RUMO).

O objetivo da página é captar inscrições para a **call de diagnóstico** — não é
página de venda. O fechamento acontece na conversa, e por isso o preço não
aparece aqui.

Stack: Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase.

> O aviso que esteve aqui (projeto Supabase pausado, captação fora do ar) foi
> resolvido em 18/09/2026 — o Cauã reativou o projeto no dashboard. Testado
> de ponta a ponta contra o banco real: cadastro grava, idempotência não
> duplica em retry (3 tentativas com a mesma chave → 1 linha só), rate limit
> barra na 6ª tentativa em 10 min. `RESEND_API_KEY` segue vazia em
> `.env.local` — o aviso por e-mail está desligado até isso ser preenchido
> (o cadastro em si não depende disso).

---

## Rodando local

```bash
npm install
npm run dev
```

Abre em http://localhost:3000.

Outros comandos: `npm test` (testes, sem dependência nova), `npm run check:launch` /
`check:launch:online` (o que falta antes de anunciar) e
`npm run notificacoes:reprocessar` (reenvia avisos que não saíram).

## Onde editar o conteúdo

| O quê | Arquivo |
| --- | --- |
| Marca, URL pública, WhatsApp comercial, privacidade | `src/config/site.ts` |
| Nome e textos do plano | `src/config/plano.ts` |
| Bio de quem conduz a mentoria | `src/config/mentor.ts` |
| Regras de validação do lead | `src/lib/lead.ts` |
| Seções da página | `src/components/` |

> ⚠️ `src/config/mentor.ts` e partes de `src/config/site.ts` ainda estão com
> **placeholders**. Nenhum número, resultado ou depoimento foi inventado —
> preencha com os dados reais antes de divulgar a página. Rode
> `npm run check:launch` (ou `check:launch:online`, que também consulta o banco e o
> site publicado) pra ver exatamente o que falta (ver
> [`docs/CONFIGURACAO-E-LANCAMENTO.md`](docs/CONFIGURACAO-E-LANCAMENTO.md)).

---

## Para onde vai o cadastro

`Formulário → POST /api/leads → tabela no Supabase → e-mail de aviso`

A rota fica em `src/app/api/leads/route.ts` e faz, nesta ordem:

1. **Valida no servidor** com as mesmas regras do cliente (`src/lib/lead.ts`).
   Validação só no navegador dá pra burlar com um `curl`.
2. **Grava no Supabase.** Se falhar, a pessoa vê o erro — nunca um "recebido"
   falso que faria o lead sumir em silêncio.
3. **Avisa por e-mail** (Resend), com um botão que abre o WhatsApp da pessoa
   com a mensagem já escrita. Se o e-mail falhar, o lead continua salvo.

### Configuração (uma vez)

**1. Supabase**

- Crie um projeto em [supabase.com](https://supabase.com).
- No **SQL Editor**, rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
- Em **Project Settings → API**, copie a URL e a chave `service_role`.

**2. Resend** (opcional — sem isso o lead salva, você só não recebe aviso)

- Crie uma conta em [resend.com](https://resend.com), verifique um domínio e
  gere uma API key.

**3. Variáveis de ambiente**

Copie `.env.example` para `.env.local` e preencha. Em produção, cadastre as
mesmas em **Vercel → Settings → Environment Variables**.

> Variáveis **secretas** (Supabase, Resend) nunca levam `NEXT_PUBLIC_` no nome:
> qualquer coisa com esse prefixo vai embutida no JavaScript que o visitante
> baixa, e a `service_role` dá acesso total ao banco. Já os IDs **públicos** de
> medição (GA4, Meta, GTM — opcionais, desligados por padrão) usam
> `NEXT_PUBLIC_` e exigem novo build ao mudar. Ver
> [`docs/CONFIGURACAO-E-LANCAMENTO.md`](docs/CONFIGURACAO-E-LANCAMENTO.md).

### Testando a rota sem preencher o formulário

```bash
curl -i -X POST http://localhost:3000/api/leads -H "Content-Type: application/json" -d '{"nome":"Teste","whatsapp":"(11) 91234-5678","email":"t@e.com","idade":"18 a 21","peso":"Outro","consentimento":true}'
```

Respostas esperadas: `200` sucesso · `422` dados inválidos · `503` Supabase não
configurado · `502` banco recusou.

---

## Privacidade dos leads

O público é de 16 a 25 anos, então **entra dado de menor de idade** — nome,
telefone e um texto livre sobre o que está pesando na vida da pessoa. O projeto
trata isso assim:

- **Consentimento explícito** no formulário, com data gravada em
  `consentimento_em` (LGPD).
- **RLS ligado sem nenhuma policy** na tabela: as chaves públicas do Supabase
  não leem nada. Só o servidor, com a `service_role`, acessa.
- **Coleta mínima**: o cadastro não grava IP nem user-agent. O rate limit usa um
  hash do IP (com a data), nunca o IP em texto puro. Da origem da campanha
  guarda só `utm_*` e o host do referrer — nunca a query inteira nem a URL de
  origem.
- **Medição de terceiros é opt-in e desligada por padrão**: só existe se você
  configurar um ID, e mesmo assim nada carrega antes de o visitante aceitar no
  banner. Recusar não afeta o cadastro.

Se um dia expor um painel de leads, ele precisa de autenticação de verdade —
não basta uma URL difícil de adivinhar.

---

## Deploy

Deploy na Vercel a partir da branch `main`. Lembre de cadastrar as variáveis de
ambiente lá também — sem elas a rota responde `503` e nenhum cadastro é salvo.
