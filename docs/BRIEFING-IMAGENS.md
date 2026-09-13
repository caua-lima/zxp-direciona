# Briefing de imagens — ZXP Direciona

Use este documento como prompt para uma IA de imagem (Midjourney, DALL·E,
Ideogram) ou como brief para um designer. Está dividido por peça, com o
tamanho exato e onde cada arquivo entra no código.

---

## Sistema de marca (repita em todo prompt de imagem)

```
Marca: ZXP Direciona, mentoria de direção profissional para jovens de 16 a 25 anos.
Paleta obrigatória:
  Onyx  #10100E — fundo dominante, quase preto
  Dourado #F4B942 — cor de destaque/ação, usar com moderação
  Marfim #F6F3E8 — branco quente, nunca branco puro
Proibido: azul/navy em qualquer tom (pertence a outra marca do mesmo grupo).
Estilo: minimalista, geométrico, premium, escuro, bastante espaço negativo.
Tipografia de referência: Space Grotesk (títulos, bold), Inter (corpo).
Tom: confiante e direto — nunca "coach de Instagram", nunca clichê motivacional
piegas, nunca stock photo de sorriso forçado.
Elemento gráfico permitido: um "Z" anguloso, sólido, geometria reta (sem curvas),
usado como marca d'água discreta — nunca como protagonista da imagem.
```

---

## 1. Ícone / favicon (essencial)

Hoje o site usa o favicon genérico padrão do Next.js — precisa trocar.

**O que gerar:** um mark quadrado, funciona em tamanho minúsculo (vai aparecer
como 16px na aba do navegador). Duas opções, escolha uma:

- (a) manter o "Z" anguloso já usado no site (mais consistente com o resto do
  ecossistema ZXP — Market, Vazxpress); ou
- (b) evoluir para um motivo de "direção" (seta, agulha de bússola, vetor) no
  mesmo estilo geométrico anguloso, exclusivo da ZXP Direciona.

**Prompt sugerido:**

```
Minimalist geometric app icon, single bold angular arrow pointing diagonally
up-right (or a stylized letter Z, sharp corners, no curves), solid #F4B942
gold mark on a solid #10100E near-black background, flat design, no gradient,
no shadow, no text, centered, generous padding, vector-style, high contrast,
works at very small sizes
```

**Entregáveis e onde colocar:**

| Arquivo | Tamanho | Formato | Caminho no repo |
| --- | --- | --- | --- |
| `icon.png` | 512×512 (Next reduz sozinho) | PNG, fundo sólido onyx (não transparente — ícone de aba fica melhor com fundo) | `src/app/icon.png` |
| `apple-icon.png` | 180×180 | PNG, fundo sólido onyx | `src/app/apple-icon.png` |

O Next.js 16 detecta esses nomes de arquivo automaticamente e gera as tags
`<link>` sozinho — não precisa editar nenhum código. Pode apagar o
`src/app/favicon.ico` antigo depois de colocar os dois acima.

---

## 2. Logo em imagem (opcional)

O logo do site (header/footer) é texto+SVG renderizado em CSS — não precisa de
imagem. Só gere uma versão em arquivo se for usar em local que não roda
HTML/CSS: assinatura de e-mail, PDF, post de rede social, apresentação.

**Prompt sugerido:**

```
Wordmark logo lockup for "ZXP DIRECIONA". Two-line composition: small bold
tracked-out "ZXP" in #F4B942 gold on top, larger bold "DIRECIONA" in #F6F3E8
warm white below, both in a geometric sans-serif (Space Grotesk style),
paired with a small angular Z icon mark to the left. Transparent background.
Flat vector design, no shadows, no gradients.
```

**Entregável:** SVG (preferível, escala sem perda) + PNG @2x como alternativa,
1600×480px, fundo transparente.

---

## 3. Foto de quem conduz a mentoria (essencial — use foto REAL)

Este é o slot em `src/config/mentor.ts` (`photoUrl`), exibido em
`src/components/Authority.tsx` num quadrado de 112×112px na tela (então precisa
de resolução bem maior que isso pra não pixelizar em telas retina).

> ⚠️ **Não gere isso com IA.** Essa seção existe pra provar que existe uma
> pessoa real por trás da mentoria — é a seção de autoridade/confiança da
> página. Um rosto gerado por IA aqui é o tipo de coisa que, se descoberta,
> destrói a credibilidade que a seção deveria construir. Use uma foto real,
> tirada de verdade.

**Direção para a foto (não é prompt de IA, é briefing de produção real):**

```
Foto de retrato, enquadramento quadrado (1:1), plano peito pra cima.
Fundo escuro e liso (tecido ou parede onyx #10100E, ou desfoque forte).
Iluminação lateral suave e quente — evite luz de teto dura.
Expressão confiante e acessível, olhando pra câmera.
Roupa: cores sóbrias, sem estampa grande, sem logo de outra marca visível.
Sem filtro colorido — cor natural de pele, sem preset de rede social.
```

**Entregável:** JPG ou WebP, mínimo **800×800px**, quadrado, menos de 500KB
depois de otimizado. Salve em `public/mentor.jpg` e aponte
`photoUrl: "/mentor.jpg"` em `src/config/mentor.ts`.

---

## 4. Visual de fundo do Hero (opcional — o site já funciona sem isso)

Hoje o topo da página usa só CSS (brilho dourado radial + textura de grão) e já
tem uma aparência premium. Isso aqui é um "nice to have" pra quem quiser dar
mais textura visual — **não é obrigatório**, e a página não perde nada sem.

**Prompt sugerido:**

```
Abstract dark background, almost black (#10100E), with a single soft warm
golden light source glowing from the top edge, subtle film grain texture,
extremely minimal, no recognizable objects, no people, no text — pure
atmospheric lighting and texture. Optional subtle geometric line suggesting
direction/movement (a faint angular path or vector line in low-opacity gold).
Cinematic, moody, premium tech-brand aesthetic. Horizontal composition.
```

**Entregável:** WebP, **2400×1350px** (16:9, cobre retina em telas largas),
otimizado para menos de 400KB. Importante: a parte de cima/centro da imagem
precisa ficar escura o bastante pra manter o texto branco/dourado do hero
legível por cima — gere pensando em texto sobreposto na área central-esquerda.

---

## 5. Imagem de compartilhamento (OG/redes sociais) — já resolvido, não precisa gerar

Quando você manda o link no WhatsApp ou alguém compartilha no Twitter/LinkedIn,
a imagem de preview (1200×630) já é **gerada automaticamente pelo código**, em
`src/app/opengraph-image.tsx` — ela lê a headline e o nome da marca direto do
código, então nunca fica desatualizada. Não gere uma imagem estática pra isso
a menos que você queira uma versão totalmente ilustrada em vez do texto atual
— nesse caso me avise, porque aí a imagem passaria a precisar de atualização
manual toda vez que a copy mudar.

---

## Checklist de entrega

Quando gerar as imagens, me manda:

- [ ] `icon.png` (512×512)
- [ ] `apple-icon.png` (180×180)
- [ ] Logo em SVG ou PNG @2x (se for usar fora do site)
- [ ] Foto real do mentor/mentora (800×800 mínimo) — **não gerada por IA**
- [ ] Fundo do hero (2400×1350) — opcional

Eu cuido de otimizar, colocar nos caminhos certos e ajustar o código onde
precisar (ex: trocar o placeholder "Foto aqui" pela foto real).
