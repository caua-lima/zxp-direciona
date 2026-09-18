/**
 * ⚠️ PLACEHOLDER — PREENCHA ANTES DE PUBLICAR
 *
 * Os dados reais (nome, trajetória, credenciais) não foram fornecidos, então
 * nada aqui é verdadeiro. Nenhum número, resultado ou depoimento foi inventado
 * de propósito — troque os campos abaixo pelos dados reais.
 *
 * Para usar uma foto: coloque o arquivo em `public/` (ex: public/mentor.jpg),
 * preencha `photoUrl` com "/mentor.jpg" e o componente passa a exibi-la
 * automaticamente no lugar do placeholder.
 */
export const mentor = {
  name: "[Nome do mentor]",
  role: "[Como se apresenta — ex: Fundador da ZXP Direciona]",

  /** Caminho da foto em /public. Deixe null pra manter o placeholder. */
  photoUrl: null as string | null,

  bio: "[Bio curta: sua trajetória, o que te credencia a conduzir esse processo e por que você criou a ZXP Direciona. 3-4 frases, sem números inventados.]",

  /** Credenciais reais — remova as que não usar. */
  highlights: [
    "[Credencial real #1]",
    "[Credencial real #2]",
    "[Credencial real #3]",
  ],
};

/**
 * True só quando `name` e `bio` de fato foram preenchidos (não começam com
 * "[", a convenção de placeholder usada acima). Usado por Authority.tsx pra
 * decidir se a seção aparece pro público.
 *
 * Publicar "[Nome do mentor]" e "Bio curta:..." pra um visitante de verdade
 * é pior do que não ter a seção — planta desconfiança logo na parte da
 * página que deveria construir confiança. Enquanto isso for true, a seção
 * fica fora do ar; não é um bug, é a checagem de lançamento funcionando.
 */
export const mentorPreenchido =
  !mentor.name.startsWith("[") && !mentor.bio.startsWith("[");

/* PLACEHOLDER OPCIONAL — DEPOIMENTOS
 *
 * Nenhum depoimento foi fornecido, então a seção não existe na página.
 * Quando tiver provas reais (com autorização de quem falou), crie o array
 * abaixo e monte a seção — não publique depoimento inventado.
 *
 * export const depoimentos = [
 *   { nome: "", idade: "", texto: "", contexto: "" },
 * ];
 */
