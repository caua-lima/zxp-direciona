/**
 * Quem conduz a mentoria. Dados informados pelo dono — nada aqui é inventado.
 *
 * A foto é real (public/mentor.jpg), só com fundo e recorte tratados. Não
 * troque por imagem gerada. Credenciais em `highlights`: só as verdadeiras;
 * com a lista vazia, a linha de credenciais some da página.
 */
export const mentor = {
  name: "Cauã Lima",
  role: "À frente da ZXP Direciona",

  /** Caminho da foto em /public. Com null, a seção mostra um placeholder. */
  photoUrl: "/mentor.jpg" as string | null,

  /** Hoje é uma frase dele, em primeira pessoa — por isso `bioEhCitacao`. */
  bio: "Sempre dei o próximo passo antes de enxergar o chão inteiro. E Deus nunca deixou faltar onde pisar.",
  bioEhCitacao: true,

  /** Credenciais reais. Vazio = a lista não aparece. */
  highlights: [] as string[],
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
