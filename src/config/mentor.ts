/**
 * Quem conversa com o visitante. Tudo aqui foi informado pelo dono — nada é
 * inventado, e nada deve ser acrescentado pra "encher" a apresentação:
 * trajetória, credencial, certificação ou resultado só entram quando ele
 * confirmar, numa fonte atual.
 *
 * A foto é real (public/mentor.jpg, 800×800), só com fundo e recorte
 * tratados. Não troque por imagem gerada nem amplie além disso.
 */
export const mentor = {
  name: "Cauã Lima",

  /** Legenda da foto. Sem cargo nem certificação. */
  assinatura: "Cauã Lima • ZXP Direciona",

  /** Informado pelo dono. Aparece só na seção "quem conduz". */
  role: "Fundador da ZXP Solutions",

  /** Caminho da foto em /public. */
  photoUrl: "/mentor.jpg" as string | null,
  photoAlt: "Cauã Lima falando ao microfone",

  /** Apresentação factual: o papel dele e o que acontece na conversa. */
  apresentacao:
    "Estou à frente da ZXP Direciona e conduzo pessoalmente as conversas iniciais. Quero conhecer o que você está vivendo, qual decisão precisa tomar e o que espera desse próximo passo. Na call, apresento a proposta da mentoria para avaliarmos se ela faz sentido para o seu caso.",

  /** Frase pessoal dele. Nota secundária — não é a apresentação. */
  frase:
    "Sempre dei o próximo passo antes de enxergar o chão inteiro. E Deus nunca deixou faltar onde pisar.",
};

/** Usado pelo check:launch. Sem nome ou apresentação, a oferta não tem rosto. */
export const mentorPreenchido = Boolean(mentor.name && mentor.apresentacao);
