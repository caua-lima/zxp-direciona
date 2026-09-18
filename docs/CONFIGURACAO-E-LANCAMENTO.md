# Configuração e lançamento

Onde cada coisa se configura, e como saber o que falta antes de anunciar.

```bash
npm run check:launch          # offline: só lê arquivos e .env.local
npm run check:launch:online   # também consulta o banco e o site publicado
```

Roda local, não é uma rota publicada — lê `.env.local` e os arquivos de
config em `src/config/`. **Use o `:online` antes de cada deploy**: ele faz
requisição de verdade e pega o que o modo offline só pode mandar você
conferir na mão — banco pausado, migração que faltou rodar (ele acusa a
coluna que não existe), domínio fora do ar. Imprime quatro listas:

- 🟢 **Confirmado agora** — (só no `:online`) verificado por requisição real.

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
Variables (produção), e **nunca** com prefixo `NEXT_PUBLIC_` — qualquer coisa
com esse prefixo vai embutida no JavaScript que o visitante baixa, e a
`service_role` do Supabase dá acesso total ao banco.

**ID público** (Google Analytics, Meta Pixel, GTM) é a exceção legítima: não
é segredo — aparece no HTML de qualquer site que usa essas ferramentas — e
precisa do prefixo `NEXT_PUBLIC_` pra chegar no navegador. A diferença
prática está na tabela abaixo: esses exigem **novo build** ao mudar.

---

## Variáveis de ambiente

Ver `.env.example` pra lista completa com onde obter cada uma. Resumo:

| Variável | Obrigatória? | Exige novo build ao mudar? |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Sim — sem isso `/api/leads` responde 503 | Não (lida em runtime) |
| `RESEND_API_KEY`, `LEAD_NOTIFY_TO`, `LEAD_NOTIFY_FROM` | Não — cadastro funciona sem, só sem aviso por e-mail | Não |
| `RATE_LIMIT_PEPPER` | Não — rate limit funciona sem, hash de IP mais fraco | Não |
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` (`G-XXXX`) | Não — medição desligada sem | **Sim** |
| `NEXT_PUBLIC_META_PIXEL_ID` (só dígitos) | Não — pixel desligado sem | **Sim** |
| `NEXT_PUBLIC_GTM_ID` (`GTM-XXXX`) | Não — se definido, vira o único dono das tags | **Sim** |

As variáveis sem `NEXT_PUBLIC_` são lidas em runtime (dentro da Route
Handler) — mudar na Vercel e reiniciar/redeployar basta. As `NEXT_PUBLIC_` são
**substituídas no bundle durante o build**: trocar um ID sem fazer novo build
não muda nada no site publicado.

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

---

## Medição, atribuição e consentimento

**Estado padrão (sem nenhum ID): tudo desligado.** O site não carrega script de
terceiro, não mostra banner e não guarda nada no aparelho do visitante.
Confirmado no HTML servido.

### Origem de cada lead (funciona SEM nenhuma ferramenta de medição)

Cada cadastro grava, se existirem: `utm_source`, `utm_medium`, `utm_campaign`,
`utm_content`, `utm_term` e `referrer_host` (só o host de onde a pessoa veio,
ex: `l.instagram.com`). Nas suas campanhas, monte o link com UTMs:

```
https://SEU-DOMINIO/?utm_source=instagram&utm_medium=paid&utm_campaign=setembro
```

O que **não** se guarda, de propósito: a query string inteira (pode conter
qualquer coisa), a URL completa do referrer, gclid/fbclid. Os valores são
lidos da URL da visita (a query sobrevive a um reload) e viajam com o
cadastro — **nada é armazenado no aparelho**.

> **Migração obrigatória antes do deploy:** `supabase/migrations/0003_atribuicao.sql`.
> Sem as colunas, todo cadastro que chega com UTM ou referrer é recusado pelo
> banco (HTTP 400 `PGRST204`) — justamente o tráfego de campanha.
> `npm run check:launch:online` acusa se faltar.

### Ligando GA4 / Meta / GTM

1. Defina os IDs (Vercel → Environment Variables, e `.env.local` pra testar):
   `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID` e/ou
   `NEXT_PUBLIC_GTM_ID`. O formato é conferido antes de virar URL de script;
   valor malformado é ignorado e `check:launch` avisa.
2. **Faça um novo deploy** (o ID é embutido no build).
3. Preencha `dadosPrivacidade` em `src/config/site.ts` — com medição ligada e
   isso vazio, `check:launch` **bloqueia**.

**Um dono só:** se `NEXT_PUBLIC_GTM_ID` existe, o GTM é o dono e os IDs diretos
são ignorados (carregar os dois contaria cada evento em dobro). Google Ads não
tem tag própria: importe a conversão a partir do evento `generate_lead` do GA4
(ou configure dentro do GTM) — **um único caminho**, senão o mesmo cadastro
conta duas vezes.

### Consentimento

Com algum ID configurado, um banner pergunta ao visitante — **nada carrega
antes da resposta**. Duas escolhas separadas (medição de visitas / publicidade),
nenhuma pré-marcada, "Recusar tudo" e "Aceitar tudo" com o mesmo peso visual.
Recusar não muda nada no site e **nunca** bloqueia o cadastro. O rodapé tem
"Preferências de medição" pra revogar a qualquer momento (o Consent Mode do
Google recebe `denied` e o Meta recebe `consent revoke`, sem recarregar).

Se você mudar o texto do banner ou passar a usar um fornecedor novo, suba
`versaoConsentimento` em `src/config/tracking.ts`: quem já escolheu é
perguntado de novo.

### Eventos

| Evento | Quando | Vai pra |
| --- | --- | --- |
| `cta_click` (`cta_position`: header/hero/meio/mobile_fixo) | Clique num CTA | GA4 / GTM |
| `lead_form_start` | 1ª interação com o formulário | GA4 / GTM |
| `lead_form_error` (`error_fields`: só os NOMES dos campos) | Erro de validação | GA4 / GTM |
| `generate_lead` | **Só** depois de o servidor confirmar a gravação (recibo) | GA4 / GTM, e `Lead` no Meta |
| `whatsapp_click` (`click_origin`: sucesso/falha) | Clique no WhatsApp comercial | GA4 / GTM |

- **`lead_form_*` e não `form_start`:** `form_start` e `form_submit` são eventos
  **automáticos** do GA4 (Medição otimizada → Interações com formulários). Um
  `form_start` manual contaria em dobro.
- **`generate_lead` só com recibo.** Não conta: HTTP 200 sozinho, honeypot,
  erro de validação (422), rate limit (429), falha do banco, nem clique em
  "enviar". Sai uma vez por recibo, mesmo com clique duplo (testado).
- **Sem `value`/`currency`:** o GA4 exige `currency` quando há `value`, e não
  existe um valor real de lead pra informar. Não inventamos um.
- **Nenhum dado pessoal sai** — nome, e-mail, telefone, idade, "o que pesa" e
  o texto livre nem existem nos tipos dos eventos.
- Evento rejeitado por falta de consentimento **não fica em fila** e não é
  reenviado se a pessoa aceitar depois.

### Como validar (código instalado ≠ evento validado ≠ conversão em uso)

`check:launch` confirma o **código**. Três coisas dependem de você, nas contas:

1. **GA4:** Admin → DebugView. Abra o site com o banner aceito, preencha um
   cadastro de teste e confira `generate_lead`.
2. **Meta:** Gerenciador de Eventos → Testar eventos. Confira `Lead`.
3. **Campanha:** escolha **uma** conversão primária de cadastro no Google Ads
   (importada do GA4) e só então otimize por ela.

### Não implementado (decisões conscientes)

- **Primeira origem entre visitas** (first-touch com validade). Exigiria guardar
  algo no navegador do visitante e passaria a depender do consentimento — uma
  decisão de privacidade que é sua. Hoje a origem é a da visita em que o
  cadastro foi feito.
- **gclid / fbclid** (identificadores de clique) e **API de Conversões / conversão
  offline.** Não eram pré-requisito; exigem regras próprias de consentimento e
  deduplicação. O `event_id` já vai no `generate_lead` pra facilitar depois.
- **Link da política de privacidade no banner:** a página ainda não existe
  (depende dos dados jurídicos em `dadosPrivacidade`).
