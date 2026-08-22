import { ProductCard } from "@/components/product-card";
import { homepageProducts } from "@/lib/home-content";

export default function ProductsPage() {
  return (
    <main className="products-page">
      <section className="content-section product-section" aria-labelledby="products-title">
        <div className="page-container">
          <p className="eyebrow">Products</p>
          <h1 id="products-title">Cable-management product systems</h1>
          <p className="products-page__intro">Explore verified Wanfan product families, then share drawings and project requirements through the inquiry workflow.</p>
          <div className="product-grid">{homepageProducts.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
        </div>
      </section>
    </main>
  );
}
