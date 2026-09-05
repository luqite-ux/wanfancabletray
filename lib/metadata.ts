import type { Metadata } from "next";
import type { SiteLocale } from "@/lib/localization";
import { localizePath, normalizeSupportedLocales, resolveLocaleHeader } from "@/lib/locale-routing";
import type { ProductView } from "@/lib/products-db";
import { company, publicCopy } from "@/lib/site-data";

export const siteOrigin = `https://${company.domain}`;
export const defaultOpenGraphImage = `${siteOrigin}/opengraph-image`;

interface PageMetadataInput {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  publishedTime?: string;
  locale?: SiteLocale;
  supportedLocales?: SiteLocale[];
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${siteOrigin}/`).toString();
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  image,
  imageAlt = `${company.brand} cable-management and structural-support manufacturing`,
  type = "website",
  publishedTime,
  locale = company.defaultLocale,
  supportedLocales = company.supportedLocales,
}: PageMetadataInput): Metadata {
  const normalizedLocales = normalizeSupportedLocales(supportedLocales, company.defaultLocale);
  const resolvedLocale = resolveLocaleHeader(locale, normalizedLocales, company.defaultLocale);
  const canonical = absoluteUrl(localizePath(path, resolvedLocale, company.defaultLocale));
  const socialImage = image ? absoluteUrl(image) : defaultOpenGraphImage;
  const languages = Object.fromEntries(normalizedLocales.map((supportedLocale) => [
    supportedLocale,
    absoluteUrl(localizePath(path, supportedLocale, company.defaultLocale)),
  ]));
  languages["x-default"] = absoluteUrl(path);
  const openGraphBase = {
    description,
    images: [{ alt: imageAlt, url: socialImage }],
    locale: resolvedLocale === "en" ? "en_US" : resolvedLocale === "zh" ? "zh_CN" : resolvedLocale.replace("-", "_"),
    siteName: company.publicName,
    title,
    url: canonical,
  };

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: type === "article"
      ? { ...openGraphBase, type: "article", publishedTime }
      : { ...openGraphBase, type: "website" },
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@id": `${siteOrigin}/#organization`,
    "@type": "Organization",
    name: company.publicName,
    alternateName: company.brand,
    url: siteOrigin,
    logo: absoluteUrl("/assets/brand/logo.png"),
    email: company.email,
    telephone: company.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.address,
    },
    description: publicCopy.companyDescription,
  } as const;
}

export function buildProductJsonLd(product: ProductView, locale: SiteLocale = company.defaultLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(localizePath(`/products/${product.slug}`, locale, company.defaultLocale))}#product`,
    name: product.name,
    description: product.description,
    image: product.gallery.map(({ src }) => absoluteUrl(src)),
    category: product.family,
    brand: { "@type": "Brand", name: company.brand },
    manufacturer: {
      "@id": `${siteOrigin}/#organization`,
      "@type": "Organization",
      name: company.publicName,
    },
  } as const;
}
