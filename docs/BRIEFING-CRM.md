# Briefing — micro-CRM da ZXP Direciona (Fase 2)

Documento de contexto para quem vai construir o painel de leads. Leia inteiro
antes de escrever código.

> **Nota de histórico:** este projeto se chamava **RUMO** até 13/09/2026, quando
> foi renomeado para **ZXP Direciona**. O repositório GitHub e a pasta local
> também foram renomeados de `rumo-lp` para `zxp-direciona`. Se encontrar
> "RUMO" em algum lugar do código, do Supabase ou de um e-mail antigo, é
> resquício do nome anterior — corrija para ZXP Direciona ao esbarrar nisso.

---

## 1. O projeto

**ZXP Direciona** é uma mentoria de direção profissional 1:1, para jovens de 16
a 25 anos travados entre faculdade, carreira e futuro. É um produto da **ZXP
Solutions**.

Este repositório é a **landing page de captação**. Ela não vende: capta
inscrições para uma **call de diagnóstico** gratuita, e o fechamento acontece na
conversa. Por isso não existe preço na página nem botão de compra.

O plano é **único** — o próprio "ZXP Direciona" (não existe Gold/Platinum e não
se deve criar níveis). Ver `src/config/plano.ts`.

Stack: **Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase**.
Deploy na Vercel, branch `main`. A URL de produção pode continuar em
`rumo-lp.vercel.app` (renomear o projeto na Vercel é manual, no dashboard) —
não assuma que a URL bate com o nome atual do produto.

> ⚠️ **PRONIX é outra empresa do mesmo dono** (produtos "Pronix Performance" e
> "Acelera"). A ZXP Direciona **não** pertence à PRONIX — o nome só *imita o
> estilo* de nomenclatura da PRONIX (marca-mãe + palavra de ação), por escolha
> de gosto do dono, não por vínculo societário. Não misture as marcas.

---

## 2. Estado atual

### O que já existe e funciona

| Arquivo | O que é |
| --- | --- |
| `src/app/page.tsx` | A landing page, 9 seções |
| `src/components/` | Componentes de seção (Hero, Faq, LeadForm, etc.) |
| `src/config/plano.ts` | Nome e textos do plano |
| `src/config/mentor.ts` | Bio de quem conduz — **ainda com placeholders** |
| `src/lib/lead.ts` | Tipos + validação do lead (cliente **e** servidor) |
| `src/app/api/leads/route.ts` | Recebe o cadastro, grava no Supabase, avisa por e-mail |
| `supabase/schema.sql` | DDL da tabela `leads` |
| `.env.example` | Template das variáveis |

### O que está quebrado agora (resolver PRIMEIRO)

A rota `/api/leads` está **no ar sem variáveis de ambiente configuradas**. Hoje
o formulário em produção responde `503` e mostra à pessoa uma mensagem honesta
de falha. Ou seja: **a captação está parada.**

Nenhum lead foi salvo até hoje. Antes disso, o formulário era um mock com
`setTimeout` que fingia sucesso — todo cadastro feito antes de 30/08/2026 se
perdeu.

**Consequência prática:** não faz sentido construir um painel de leads antes de
existir um lead. A Fase 1 (seção 3) vem primeiro, sem exceção.

---

## 3. FASE 1 — colocar a captação no ar (faça antes de tudo)

O código já está pronto. Falta configuração, e ela depende do dono do projeto.
**Guie-o por estes passos, um de cada vez, confirmando cada um antes de seguir.**

### 3.1 Criar o projeto no Supabase

1. Criar conta / projeto em https://supabase.com
2. Abrir **SQL Editor** e rodar o conteúdo de `supabase/schema.sql` (cria a
   tabela `leads`, os índices e liga o RLS)
3. Em **Project Settings → API**, copiar:
   - **Project URL** → `SUPABASE_URL`
   - chave **`service_role`** (não a `anon`) → `SUPABASE_SERVICE_ROLE_KEY`

### 3.2 Resend (opcional, mas recomendado)

Sem isso o lead ainda é salvo — ele só não recebe aviso.

1. Conta em https://resend.com
2. Verificar um domínio (ou usar o domínio de teste do Resend no começo)
3. Gerar API key → `RESEND_API_KEY`
4. `LEAD_NOTIFY_FROM` precisa ser um endereço do domínio verificado
5. `LEAD_NOTIFY_TO` é o e-mail dele: `caualm4@gmail.com`

### 3.3 Variáveis de ambiente

- Local: copiar `.env.example` para `.env.local` e preencher
- Produção: **Vercel → Settings → Environment Variables**, as mesmas chaves

> Nenhuma variável pode ter prefixo `NEXT_PUBLIC_`. Qualquer coisa com esse
> prefixo é embutida no JavaScript que o visitante baixa, e a `service_role` dá
> acesso total ao banco.

### 3.4 Validar que funciona

```bash
curl -i -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","whatsapp":"(11) 91234-5678","email":"t@e.com","idade":"19 a 21","peso":"Outro","consentimento":true}'
```

Esperado: `200 {"ok":true}`, uma linha nova na tabela `leads` do Supabase e um
e-mail na caixa dele. Depois testar pelo formulário real, e por fim confirmar em
produção.

**Só siga para a Fase 2 quando um lead de teste tiver aparecido na tabela.**

---

## 4. A tabela `leads`

Já criada por `supabase/schema.sql`. As colunas de CRM **já existem** — não é
preciso migração.

```
id                uuid        pk, default gen_random_uuid()
criado_em         timestamptz default now()
nome              text        not null
whatsapp          text        not null   -- formatado: (11) 91234-5678
email             text        not null
idade             text        not null   -- "16 a 18" | "19 a 21" | "22 a 25" | "26 ou mais"
peso              text        not null   -- opção escolhida no formulário
contexto          text        nullable   -- texto livre, opcional, até 400 chars
consentimento_em  timestamptz not null   -- prova de consentimento (LGPD)
status            text        default 'novo'
                              check in: novo | contatado | call_marcada |
                                        call_feita | fechado | perdido
observacoes       text        nullable   -- anotações dele sobre o lead
```

**RLS está ligado e não existe nenhuma policy.** Isso é proposital: as chaves
públicas (`anon`) não leem nada, mesmo vazando no navegador. Só a `service_role`,
usada no servidor, acessa. **Não crie policies** para "facilitar" o acesso do
painel — o painel deve acessar pelo servidor, com a `service_role`.

---

## 5. FASE 2 — o que construir

Um **painel de leads**, não um CRM completo.

### Escopo

**Rota `/admin` protegida por senha:**

- **Login**: uma senha só (é um usuário só). Cookie de sessão assinado,
  `httpOnly`, `secure`, `sameSite=lax`. Nova variável: `ADMIN_PASSWORD` e um
  `AUTH_SECRET` para assinar.
- **Lista**: leads mais recentes primeiro, mostrando nome, idade, o que pesa,
  status e quando chegou. Filtro por status.
- **Detalhe**: todos os campos, o texto de contexto, botão que abre o WhatsApp
  com mensagem pré-escrita, seletor de status e campo de observações.
- **Mobile-first.** Ele vai usar isso pelo celular, entre uma call e outra.

### Fora de escopo (não construa)

Kanban arrastável, automação de e-mail, dashboard de métricas, múltiplos
usuários, integração com calendário, exportação. É onde projeto assim morre.
Se ele pedir, construa **depois** que o básico estiver rodando.

### Segurança — inegociável

O painel lista **nome, telefone e um relato pessoal de adolescentes de 16-17
anos**. Isso muda o nível de cuidado:

- Autenticação de verdade. URL difícil de adivinhar **não é** proteção.
- A senha nunca no código nem em `NEXT_PUBLIC_`. Compare com tempo constante.
- O painel roda no servidor e usa a `service_role`; a chave nunca chega ao
  navegador.
- `noindex` no `/admin`.
- Rate limit no login, ou ao menos atraso progressivo, contra força bruta.

---

## 6. Regras do projeto (não re-litigar)

### Técnicas

- **`AGENTS.md` na raiz manda ler `node_modules/next/dist/docs/` antes de
  escrever código.** Next.js 16 tem mudanças que quebram o que você "sabe".
  Leia de verdade — Route Handlers, Server/Client Components, metadata.
- **Tailwind v4**: não existe `tailwind.config.js`. Tokens ficam em
  `@theme inline` dentro de `src/app/globals.css`.
- **Validação sempre nos dois lados.** As regras vivem em `src/lib/lead.ts` e
  são importadas por cliente e servidor. Não duplique.
- **Conteúdo nunca depende de JS pra ser visível.** Veja `src/components/
  Reveal.tsx`: o HTML sai do servidor visível, e o estado animado só é aplicado
  no cliente, em elementos fora da tela.

### Visuais

- Cores: Onyx `#10100E` (fundo), Dourado `#F4B942` (ação), Marfim `#F6F3E8`
  (texto). **Nunca azul/navy** — é da VAZXPRESS, outro braço.
- Fontes: Space Grotesk (`font-display`) para títulos, Inter para corpo.
- Utilitários prontos em `globals.css`: `.card-destaque`, `.grain`,
  `.glow-dourado`, `.text-gradient-dourado`, `.reveal`.
- Classes de cor: `bg-onyx`, `bg-onyx-raised`, `border-onyx-line`,
  `text-dourado`, `text-marfim`.
- Alvos de toque ≥ 44px. Respeitar `prefers-reduced-motion`.

### Conteúdo

- Português do Brasil, tom direto, frases curtas.
- **Nunca invente** números, depoimentos, resultados ou credenciais. Se faltar
  dado real, deixe placeholder explícito.
- CTA sempre em torno de "conversar"/"diagnóstico", nunca "comprar"/"assinar".

### Fluxo de trabalho

- **Deixe o commit pronto, mas não dê `push`.** Ele mesmo roda
  `git push origin main`. Sempre.
- Verifique o que fez antes de dizer que funciona: rode `npm run lint`,
  `npm run build`, e teste no browser de verdade.

---

## 7. Critério de pronto

1. Um lead enviado pelo formulário em produção aparece na tabela do Supabase
2. Ele recebe o e-mail de aviso com o botão de WhatsApp funcionando
3. `/admin` pede senha e não abre sem ela
4. A lista mostra os leads, dá pra mudar status e escrever observação
5. Funciona bem no celular
6. `npm run lint` e `npm run build` limpos
7. Commit pronto, sem push
