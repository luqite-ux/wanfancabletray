import type { Metadata } from "next";
import { ClipboardList, FileUp, Ruler, Send } from "lucide-react";
import { InquiryForm } from "@/components/inquiry-form";
import { buildPageMetadata } from "@/lib/metadata";
import { getProductBySlug, productCategories } from "@/lib/products-db";
import { company } from "@/lib/site-data";

const pageTitle = `Request a Quote | ${company.brand}`;
const pageDescription = `Send ${company.publicName} the product, quantity, drawing and application context for an order-specific review.`;

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/request-a-quote",
});

interface RequestQuotePageProps {
  searchParams?: Promise<{
    product?: string | string[];
    category?: string | string[];
  }>;
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RequestQuotePage({ searchParams = Promise.resolve({}) }: RequestQuotePageProps) {
  const query = await searchParams;
  const productSlug = firstValue(query.product)?.trim() || "";
  const requestedCategory = firstValue(query.category)?.trim() || "";
  const product = productSlug ? await getProductBySlug(productSlug, company.defaultLocale) : null;
  const matchedCategory = productCategories.find(
    ({ slug, label }) => slug === requestedCategory || label.toLowerCase() === requestedCategory.toLowerCase(),
  );
  const initialCategory = product?.family || matchedCategory?.label || "";

  return (
    <main className="inquiry-page request-quote-page">
      <section aria-labelledby="quote-title" className="inner-page-hero inquiry-page__hero">
        <div className="page-container inner-page-hero__grid">
          <div>
            <p className="eyebrow">Project inquiry</p>
            <h1 id="quote-title">Request a Quote</h1>
          </div>
          <p>Bring the product, quantity, size, material, application and delivery context into one requirements-led review.</p>
        </div>
      </section>

      <section aria-labelledby="quote-form-title" className="content-section inquiry-form-section">
        <div className="page-container inquiry-layout">
          <div className="inquiry-layout__intro">
            <ClipboardList aria-hidden="true" />
            <p className="eyebrow">Clear project inputs</p>
            <h2 id="quote-form-title">Share enough context for a practical response.</h2>
            <p>{product ? `${product.name} is already selected from the product page. Add the order-specific details that still need review.` : "Select a product family and add the order-specific details your team has available."}</p>
            <ul className="inquiry-input-list">
              <li><Ruler aria-hidden="true" /><span><strong>Configuration</strong>Size, material and surface direction</span></li>
              <li><FileUp aria-hidden="true" /><span><strong>Reference files</strong>Optional drawing or specification attachment</span></li>
              <li><Send aria-hidden="true" /><span><strong>Project context</strong>Quantity, application and target delivery date</span></li>
            </ul>
          </div>
          <InquiryForm initialCategory={initialCategory} initialProduct={product?.name} />
        </div>
      </section>
    </main>
  );
}
