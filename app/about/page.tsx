import type { Metadata } from "next";
import Image from "next/image";
import { Factory, FileCheck2, MapPin, MessagesSquare } from "lucide-react";
import { InquiryCta } from "@/components/inquiry-cta";
import { company, formatTrademarkRegistrations, productionFacts, trademarkRegistrations } from "@/lib/site-data";

const pageTitle = `About Wanfan | ${company.brand}`;
const pageDescription = `Learn about ${company.publicName} and its project-focused manufacturing approach.`;
const pageUrl = `https://${company.domain}/about`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: pageUrl },
  openGraph: { title: pageTitle, description: pageDescription, type: "website", url: pageUrl },
};

export default function AboutPage() {
  return (
    <main>
      <section className="inner-page-hero" aria-labelledby="about-title"><div className="page-container inner-page-hero__grid"><div><p className="eyebrow">Company profile</p><h1 id="about-title">About Wanfan</h1></div><p>{company.publicName} supports cable-management and structural-support requirements through drawing-led coordination and order-specific manufacturing.</p></div></section>
      <section className="content-section"><div className="page-container about-story"><div><p className="eyebrow">Nanjing, Jiangsu, China</p><h2>Project inputs guide the production conversation.</h2><p>Wanfan works across cable tray systems, structural supports, conduit systems, and stainless-steel components. The team reviews drawings, dimensions, material direction, surface requirements, quantity, and application context before confirming an order.</p><div className="about-facts"><div><Factory aria-hidden="true" /><strong>{productionFacts.facilityArea.display}</strong><span>facility area</span></div><div><FileCheck2 aria-hidden="true" /><strong>{productionFacts.machineCount.display}</strong><span>production machines</span></div><div><MessagesSquare aria-hidden="true" /><strong>{productionFacts.productionWindow.days}</strong><span>typical production window, {productionFacts.productionWindow.qualifier}</span></div></div></div><div className="about-story__image"><Image alt="Wanfan manufacturing workshop and finished cable tray products" fill sizes="(max-width: 860px) 100vw, 46vw" src="/assets/factory/workshop-05.jpg" style={{ objectFit: "cover" }} /></div></div></section>
      <section className="content-section about-identity"><div className="page-container detail-card-grid detail-card-grid--two"><article className="detail-card"><MapPin aria-hidden="true" /><h2>Company identity</h2><dl className="identity-list"><div><dt>Public English name</dt><dd>{company.publicName}</dd></div><div><dt>Legal Chinese name</dt><dd lang="zh-CN">{company.legalNameZh}</dd></div><div><dt>Address</dt><dd>{company.address}</dd></div></dl></article><article className="detail-card"><FileCheck2 aria-hidden="true" /><h2>Registered Trademarks</h2><p>{formatTrademarkRegistrations(trademarkRegistrations)}.</p><p>These registrations identify the word and device marks. They are not presented as product testing or product approval.</p></article></div></section>
      <section className="inquiry-banner" aria-labelledby="about-inquiry-title"><div className="page-container inquiry-banner__inner"><div><p className="eyebrow">Talk with Wanfan</p><h2 id="about-inquiry-title">Start with your project requirements.</h2><p>Share the product family, drawings, quantity, and application context your team needs reviewed.</p></div><InquiryCta /></div></section>
    </main>
  );
}
