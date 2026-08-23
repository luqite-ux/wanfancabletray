import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { InquiryCta } from "@/components/inquiry-cta";
import type { ProductView } from "@/lib/products-db";

export type ProductCardView = Pick<ProductView, "slug" | "name" | "family" | "description" | "image" | "imageAlt">;

export function ProductCard({ product }: { product: ProductCardView }) {
  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        <Image alt={product.imageAlt} fill sizes="(max-width: 720px) 100vw, (max-width: 1080px) 50vw, 33vw" src={product.image} style={{ objectFit: "contain" }} />
      </div>
      <div className="product-card__content">
        <p className="product-card__family">{product.family}</p>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="product-card__actions">
          <Link className="text-link" href={`/products/${product.slug}`}>
            View Details <ArrowUpRight aria-hidden="true" size={17} />
          </Link>
          <InquiryCta label="Get a Quote" productSlug={product.slug} />
        </div>
      </div>
    </article>
  );
}
