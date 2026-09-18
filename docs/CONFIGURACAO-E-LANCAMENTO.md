# Configuração e lançamento

Onde cada coisa se configura, e como saber o que falta antes de anunciar.

```bash
npm run check:launch
```

Roda local, não é uma rota publicada — lê `.env.local` e os arquivos de
config em `src/config/`, e imprime três listas:

- 🔴 **Bloqueia tráfego** — o cadastro ou a página não funciona direito assim.
- 🟡 **Aviso** — funciona, mas devia resolver antes de anunciar.
- 🔵 **Verificação manual** — o script não consegue confirmar sozinho (ex: se
  o domínio realmente resolve, se o Supabase está pausado).

Sai com código `1` se houver bloqueio — dá pra plugar num CI depois, se
quiser.

---

## Onde cada config mora

| O quê | Arquivo | Tipo |
| --- | --- | --- |
| Nome da marca, URL pública | `src/config/site.ts` → `site` | Conteúdo (editar o arquivo) |
| WhatsApp comercial | `src/config/site.ts` → `contatoComercial` | Conteúdo |
| Dados de privacidade (controlador, canal de contato) | `src/config/site.ts` → `dadosPrivacidade` | Conteúdo |
| Bio de quem conduz | `src/config/mentor.ts` → `mentor` | Conteúdo |
| Nome e textos do plano | `src/config/plano.ts` → `plano` | Conteúdo |
| Credenciais (Supabase, Resend) | `.env.local` / Vercel | **Segredo** |

**Conteúdo** (nome, WhatsApp, textos) fica em arquivos `.ts` versionados —
mesma lógica de `mentor.ts`: editar o arquivo, commitar, é isso. Não são
segredos, não precisam de variável de ambiente.

**Segredo** só existe em `.env.local` (local) / Vercel → Environment
Variables (produção). Nenhuma delas tem prefixo `NEXT_PUBLIC_` — qualquer
coisa com esse prefixo vai embutida no JavaScript que o visitante baixa, e a
`service_role` do Supabase dá acesso total ao banco.

> Isso não quer dizer que TODA variável `NEXT_PUBLIC_` seja proibida — um ID
> público de analytics (Google Analytics, Meta Pixel), por exemplo, não é
> segredo. Hoje o projeto não usa nenhuma; quando a seção de
> atribuição/analytics for implementada, o padrão muda.

---

## Variáveis de ambiente

Ver `.env.example` pra lista completa com onde obter cada uma. Resumo:

| Variável | Obrigatória? | Exige novo build ao mudar? |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Sim — sem isso `/api/leads` responde 503 | Não (lida em runtime) |
| `RESEND_API_KEY`, `LEAD_NOTIFY_TO`, `LEAD_NOTIFY_FROM` | Não — cadastro funciona sem, só sem aviso por e-mail | Não |
| `RATE_LIMIT_PEPPER` | Não — rate limit funciona sem, hash de IP mais fraco | Não |

Nenhuma variável de ambiente deste projeto precisa de rebuild pra mudar —
todas são lidas em `runtime` (dentro da Route Handler), não em build time.

---

## Passo a passo — do zero até "pronto pra tráfego"

1. `npm install`
2. Copie `.env.example` → `.env.local`, preencha Supabase (obrigatório)
3. Rode `supabase/schema.sql` (projeto novo) ou as migrações em
   `supabase/migrations/`, em ordem (projeto que já tinha a tabela `leads`)
4. `npm run check:launch` — resolva os 🔴, veja os 🟡
5. Preencha `src/config/mentor.ts`, `src/config/site.ts` com dados reais
6. `npm run check:launch` de novo — confirme que os bloqueios sumiram
7. `npm run dev`, teste o formulário local de ponta a ponta
8. Confirme as variáveis também em Vercel → Settings → Environment Variables
9. Depois do deploy, teste em produção — um lead de teste real, apagado
   depois
10. Confirme os itens 🔵 (verificação manual) contra o ambiente real

O script não substitui esse último passo — ele confirma que os *dados*
existem, não que o *sistema* (Supabase ativo, domínio resolvendo, Resend
verificado) está funcionando neste exato momento.
