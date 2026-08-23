import type { Metadata } from "next";
import Image from "next/image";
import { Boxes, ClipboardCheck, Factory, FileSearch, PackageCheck, Settings2 } from "lucide-react";
import { InquiryCta } from "@/components/inquiry-cta";
import { company } from "@/lib/site-data";

const pageTitle = `Manufacturing | ${company.brand}`;
const pageDescription = "Drawing-led manufacturing coordination for Wanfan cable-management and structural-support products.";
const pageUrl = `https://${company.domain}/manufacturing`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: pageUrl },
  openGraph: { title: pageTitle, description: pageDescription, type: "website", url: pageUrl },
};

const steps = [
  { icon: FileSearch, title: "Drawing review", text: "Review geometry, interfaces, quantity, and application requirements." },
  { icon: Settings2, title: "Material selection", text: "Confirm material and surface direction for the order." },
  { icon: Boxes, title: "Sample confirmation", text: "Coordinate a sample when the confirmed order process requires one." },
  { icon: Factory, title: "Production", text: "Schedule order-specific work after requirements are confirmed." },
  { icon: ClipboardCheck, title: "Inspection", text: "Check output against the agreed order requirements." },
  { icon: PackageCheck, title: "Shipment", text: "Coordinate packing and dispatch details for the confirmed order." },
];

export default function ManufacturingPage() {
  return (
    <main>
      <section className="inner-page-hero" aria-labelledby="manufacturing-title"><div className="page-container inner-page-hero__grid"><div><p className="eyebrow">Drawing-led production</p><h1 id="manufacturing-title">Manufacturing</h1></div><p>A practical sequence keeps drawings, materials, production inputs, and inspection points visible from review through dispatch.</p></div></section>
      <section className="content-section"><div className="page-container"><div className="page-section-heading"><p className="eyebrow">Production flow</p><h2>Drawing review starts the manufacturing conversation.</h2><p>Requirements are confirmed before order-specific production is scheduled.</p></div><ol className="route-flow">{steps.map(({ icon: Icon, title, text }, index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><Icon aria-hidden="true" /><h3>{title}</h3><p>{text}</p></li>)}</ol></div></section>
      <section className="content-section manufacturing-evidence"><div className="page-container manufacturing-evidence__grid"><div className="manufacturing-evidence__image"><Image alt="Wide view of the Wanfan manufacturing workshop" fill sizes="(max-width: 860px) 100vw, 48vw" src="/assets/factory/workshop-01.jpg" style={{ objectFit: "cover" }} /></div><div><p className="eyebrow">Verified production context</p><h2>Approximately 3,000 m² and approximately 50 machines.</h2><p>The typical production window is 5–15 days, subject to order confirmation. Scheduling depends on confirmed configuration, quantity, and current production planning.</p><dl className="fact-list"><div><dt>Facility area</dt><dd>≈3,000 m²</dd></div><div><dt>Production equipment</dt><dd>≈50 machines</dd></div><div><dt>Typical window</dt><dd>5–15 days, subject to confirmation</dd></div></dl></div></div></section>
      <section className="inquiry-banner" aria-labelledby="manufacturing-inquiry-title"><div className="page-container inquiry-banner__inner"><div><p className="eyebrow">Start with requirements</p><h2 id="manufacturing-inquiry-title">Send a drawing for production review.</h2><p>Include dimensions, material direction, quantity, application, and target delivery context.</p></div><InquiryCta /></div></section>
    </main>
  );
}
