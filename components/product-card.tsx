import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { InquiryCta } from "@/components/inquiry-cta";
import type { SiteLocale } from "@/lib/localization";
import { localizePath } from "@/lib/locale-routing";
import type { ProductView } from "@/lib/products-db";
import { company } from "@/lib/site-data";

export type ProductCardView = Pick<ProductView, "slug" | "name" | "family" | "description" | "image" | "imageAlt">;

export function ProductCard({ product, locale = company.defaultLocale }: { product: ProductCardView; locale?: SiteLocale }) {
  const detailHref = localizePath(`/products/${product.slug}`, locale, company.defaultLocale);
  return (
    <article className="product-card">
      <Link aria-label={`View ${product.name}`} className="product-card__image-link" href={detailHref}>
        <div className="product-card__image-wrap">
          <Image alt={product.imageAlt} fill sizes="(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 33vw" src={product.image} style={{ objectFit: "contain" }} />
        </div>
      </Link>
      <div className="product-card__content">
        <p className="product-card__family">{product.family}</p>
        <h3><Link className="product-card__title-link" href={detailHref}>{product.name}</Link></h3>
        <p>{product.description}</p>
        <div className="product-card__actions">
          <Link className="text-link" href={detailHref}>
            View Details <ArrowUpRight aria-hidden="true" size={17} />
          </Link>
          <InquiryCta label="Get a Quote" locale={locale} productSlug={product.slug} />
        </div>
      </div>
    </article>
  );
}
