import type { MetadataRoute } from "next";
import { site } from "@/config/site";

// A LP é uma página só — sitemap de uma linha só é a coisa certa aqui, sem
// inventar rotas que não existem.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: site.urlPublica,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
