import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, ClipboardCheck, Layers3, Ruler, Settings2 } from "lucide-react";
import { InquiryCta } from "@/components/inquiry-cta";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { buildPageMetadata, buildProductJsonLd } from "@/lib/metadata";
import { getProductBySlug, getProducts } from "@/lib/products-db";
import { company } from "@/lib/site-data";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;
export const dynamicParams = true;
export async function generateStaticParams() {
  const products = await getProducts(company.defaultLocale);
  return products.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug, company.defaultLocale);

  if (!product) return { title: "Product not found" };

  return buildPageMetadata({
    title: `${product.name} | ${company.brand}`,
    description: product.description,
    path: `/products/${product.slug}`,
    image: product.image,
    imageAlt: product.imageAlt,
  });
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const products = await getProducts(company.defaultLocale);
  const product = products.find((candidate) => candidate.slug === slug) || null;

  if (!product) notFound();

  const relatedProducts = products
    .filter((candidate) => candidate.slug !== product.slug && candidate.categorySlug === product.categorySlug)
    .slice(0, 3);
  const fallbackRelated = relatedProducts.length
    ? relatedProducts
    : products.filter((candidate) => candidate.slug !== product.slug).slice(0, 3);
  const productJsonLd = buildProductJsonLd(product);

  return (
    <main className="product-detail-page">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <section className="product-detail-hero" aria-labelledby="product-title">
        <div className="page-container">
          <Link className="back-link" href="/products"><ArrowLeft aria-hidden="true" size={18} /> Back to products</Link>
          <div className="product-detail-hero__grid">
            <ProductGallery images={product.gallery} productName={product.name} />
            <div className="product-detail-hero__copy">
              <p className="eyebrow">{product.family}</p>
              <h1 id="product-title">{product.name}</h1>
              <p>{product.description}</p>
              <div className="product-detail-hero__actions">
                <InquiryCta label="Request a Product Quote" productSlug={product.slug} />
                <InquiryCta className="secondary-light-cta" label="Discuss Product Requirements" productSlug={product.slug} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-section detail-section" aria-labelledby="overview-heading">
        <div className="page-container detail-split">
          <div><p className="eyebrow">Overview</p><h2 id="overview-heading">Overview</h2></div>
          <div><p className="detail-lead">{product.overview}</p><ul className="check-list">{product.features.map((feature) => <li key={feature}><Check aria-hidden="true" size={18} />{feature}</li>)}</ul></div>
        </div>
      </section>

      <section className="content-section detail-section detail-section--mist" aria-labelledby="materials-heading">
        <div className="page-container">
          <div className="detail-heading"><Layers3 aria-hidden="true" /><div><p className="eyebrow">Configuration</p><h2 id="materials-heading">Materials and surfaces</h2></div></div>
          <div className="detail-card-grid detail-card-grid--two">
            <article className="detail-card"><h3>Material directions</h3><ul>{product.materials.map((material) => <li key={material}>{material}</li>)}</ul></article>
            <article className="detail-card"><h3>Surface options</h3><ul>{product.surfaces.map((surface) => <li key={surface}>{surface}</li>)}</ul></article>
          </div>
        </div>
      </section>

      <section className="content-section detail-section" aria-labelledby="specifications-heading">
        <div className="page-container detail-split">
          <div className="detail-heading"><Ruler aria-hidden="true" /><div><p className="eyebrow">Technical review</p><h2 id="specifications-heading">Specifications</h2></div></div>
          <dl className="specification-list">{product.specifications.map((specification) => <div key={`${specification.label}-${specification.value}`}><dt>{specification.label}</dt><dd>{specification.value}</dd></div>)}</dl>
        </div>
      </section>

      <section className="content-section detail-section detail-section--mist" aria-labelledby="applications-heading">
        <div className="page-container detail-split">
          <div className="detail-heading"><Settings2 aria-hidden="true" /><div><p className="eyebrow">Project context</p><h2 id="applications-heading">Applications</h2></div></div>
          <div className="detail-card-grid">{product.applications.map((application) => <article className="detail-card detail-card--compact" key={application}><h3>{application}</h3><p>Configuration is reviewed against the confirmed installation and project requirements.</p></article>)}</div>
        </div>
      </section>

      <section className="content-section detail-section" aria-labelledby="customization-heading">
        <div className="page-container">
          <div className="detail-heading"><ClipboardCheck aria-hidden="true" /><div><p className="eyebrow">From requirements to dispatch</p><h2 id="customization-heading">Customization flow</h2></div></div>
          <ol className="detail-flow">{product.customization.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol>
        </div>
      </section>

      <section className="content-section related-products" aria-labelledby="related-heading">
        <div className="page-container">
          <p className="eyebrow">Continue exploring</p><h2 id="related-heading">Related products</h2>
          <div className="product-grid">{fallbackRelated.map((related) => <ProductCard key={related.slug} product={related} />)}</div>
        </div>
      </section>

      <section className="inquiry-banner" aria-labelledby="product-inquiry-heading"><div className="page-container inquiry-banner__inner"><div><p className="eyebrow">Discuss this product</p><h2 id="product-inquiry-heading">Share drawings, dimensions, quantity, and application details.</h2><p>Product context will be included when you open the inquiry form.</p></div><InquiryCta label="Request a Product Quote" productSlug={product.slug} /></div></section>
    </main>
  );
}
