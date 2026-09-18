import type { MetadataRoute } from "next";
import { site } from "@/config/site";

// Mesma lógica do robots da metadata em layout.tsx: só produção de verdade
// é rastreável. Preview de PR ou build local não deveriam aparecer indexados
// em lugar nenhum.
const emProducao = process.env.VERCEL_ENV === "production";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: emProducao
      ? { userAgent: "*", allow: "/" }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${site.urlPublica}/sitemap.xml`,
  };
}
