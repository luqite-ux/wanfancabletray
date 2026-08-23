"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { SiteLocale } from "@/lib/localization";
import type { ProductCategory, ProductView } from "@/lib/products-db";

interface ProductsClientProps {
  categories: ProductCategory[];
  products: ProductView[];
  locale: SiteLocale;
}

export function ProductsClient({ categories, products, locale }: ProductsClientProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const visibleProducts = useMemo(
    () => activeCategory === "all" ? products : products.filter((product) => product.categorySlug === activeCategory),
    [activeCategory, products],
  );

  return (
    <div>
      <div className="product-filters" aria-label="Filter products by category" role="group">
        <button aria-controls="product-results" aria-pressed={activeCategory === "all"} onClick={() => setActiveCategory("all")} type="button">
          <span>All products</span><span>{products.length}</span>
        </button>
        {categories.map((category) => {
          const count = products.filter((product) => product.categorySlug === category.slug).length;
          return (
            <button aria-controls="product-results" aria-pressed={activeCategory === category.slug} key={category.slug} onClick={() => setActiveCategory(category.slug)} type="button">
              <span>{category.label}</span><span>{count}</span>
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="product-results-status">Showing {visibleProducts.length} {visibleProducts.length === 1 ? "product family" : "product families"}.</p>
      <div className="product-grid product-catalog__grid" id="product-results">
        {visibleProducts.map((product) => <ProductCard key={product.slug} locale={locale} product={product} />)}
      </div>
    </div>
  );
}
