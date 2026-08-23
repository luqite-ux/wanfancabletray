import type { MetadataRoute } from "next";
import { absoluteUrl, siteOrigin } from "@/lib/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteOrigin,
  };
}
