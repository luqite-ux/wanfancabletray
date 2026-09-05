import type { Metadata } from "next";
import { Mail, MapPin, MessageSquareText, Phone } from "lucide-react";
import { InquiryForm } from "@/components/inquiry-form";
import { buildPageMetadata } from "@/lib/metadata";
import { getRequestLocaleContext } from "@/lib/request-locale";
import { company, publicCopy } from "@/lib/site-data";

const pageTitle = `Contact | ${company.brand}`;
const pageDescription = `Contact ${company.publicName} about cable-management and structural-support project requirements.`;

export async function generateMetadata(): Promise<Metadata> {
  const { locale, supportedLocales } = await getRequestLocaleContext();
  return buildPageMetadata({
    title: pageTitle,
    description: pageDescription,
    path: "/contact",
    locale,
    supportedLocales,
  });
}

export default function ContactPage() {
  return (
    <main className="inquiry-page">
      <section aria-labelledby="contact-title" className="inner-page-hero inquiry-page__hero">
        <div className="page-container inner-page-hero__grid">
          <div>
            <p className="eyebrow">Contact</p>
            <h1 id="contact-title">Contact Wanfan</h1>
          </div>
          <p>Share a project question, product requirement or drawing context. The same secure inquiry workflow connects your details with our team.</p>
        </div>
      </section>

      <section aria-labelledby="contact-details-title" className="content-section contact-details-section">
        <div className="page-container">
          <div className="page-section-heading">
            <p className="eyebrow">Direct details</p>
            <h2 id="contact-details-title">Choose the contact path that fits your project.</h2>
            <p>Use the form for complete technical context, or contact Wanfan directly with a concise introduction.</p>
          </div>
          <div className="contact-details-grid">
            <article className="contact-detail-card">
              <Mail aria-hidden="true" />
              <h3>Business email</h3>
              <a href={`mailto:${publicCopy.contact.email}`}>{publicCopy.contact.email}</a>
            </article>
            <article className="contact-detail-card">
              <Phone aria-hidden="true" />
              <h3>Phone</h3>
              <a href={`tel:${company.phone.replace(/\s/g, "")}`}>{publicCopy.contact.phone}</a>
            </article>
            <article className="contact-detail-card">
              <MapPin aria-hidden="true" />
              <h3>Address</h3>
              <address>{publicCopy.contact.address}</address>
            </article>
          </div>
        </div>
      </section>

      <section aria-labelledby="contact-form-title" className="content-section inquiry-form-section">
        <div className="page-container inquiry-layout">
          <div className="inquiry-layout__intro">
            <MessageSquareText aria-hidden="true" />
            <p className="eyebrow">Start an inquiry</p>
            <h2 id="contact-form-title">Tell us what needs review.</h2>
            <p>Include the product family, estimated quantity, installation context and any drawing or specification that will help frame the discussion.</p>
          </div>
          <InquiryForm />
        </div>
      </section>
    </main>
  );
}
