import type { Metadata } from "next";
import { ProductsClient } from "@/app/products/products-client";
import { buildPageMetadata } from "@/lib/metadata";
import { getProducts, productCategories } from "@/lib/products-db";
import { getRequestLocaleContext } from "@/lib/request-locale";
import { company } from "@/lib/site-data";

export const revalidate = 60;

const pageTitle = `Products | ${company.brand}`;
const pageDescription = "Explore Wanfan cable-management, structural-support, conduit, and stainless-component product families.";
export async function generateMetadata(): Promise<Metadata> {
  const { locale, supportedLocales } = await getRequestLocaleContext();
  return buildPageMetadata({
    title: pageTitle,
    description: pageDescription,
    path: "/products",
    locale,
    supportedLocales,
  });
}

export default async function ProductsPage() {
  const { locale } = await getRequestLocaleContext();
  const products = await getProducts(locale);

  return (
    <main className="products-page">
      <section className="inner-page-hero inner-page-hero--products" aria-labelledby="products-title">
        <div className="page-container inner-page-hero__grid">
          <div><p className="eyebrow">Products</p><h1 id="products-title">Cable-management product systems</h1></div>
          <p>Explore all verified Wanfan product families. Filter by system type, then bring drawings, dimensions, quantity, and application requirements into the inquiry workflow.</p>
        </div>
      </section>
      <section className="content-section product-catalog" aria-label="Product catalog">
        <div className="page-container">
          <ProductsClient categories={productCategories} locale={locale} products={products} />
        </div>
      </section>
    </main>
  );
}
