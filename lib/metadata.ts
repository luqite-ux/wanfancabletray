import type { Metadata } from "next";
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
}: PageMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const socialImage = image ? absoluteUrl(image) : defaultOpenGraphImage;
  const openGraphBase = {
    description,
    images: [{ alt: imageAlt, url: socialImage }],
    locale: "en_US",
    siteName: company.publicName,
    title,
    url: canonical,
  };

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: canonical,
        "x-default": canonical,
      },
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

export function buildProductJsonLd(product: ProductView) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(`/products/${product.slug}`)}#product`,
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
