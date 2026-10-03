import type { MetadataRoute } from "next";
import { privacidadePublicada, site } from "@/config/site";

// Só as rotas que existem de fato: a LP e, quando publicada, a de privacidade.
export default function sitemap(): MetadataRoute.Sitemap {
  const rotas: MetadataRoute.Sitemap = [
    {
      url: site.urlPublica,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
  if (privacidadePublicada) {
    rotas.push({
      url: `${site.urlPublica}/privacidade`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    });
  }
  return rotas;
}
