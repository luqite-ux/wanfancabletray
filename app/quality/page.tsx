import type { Metadata } from "next";
import { ClipboardList, Eye, PackageCheck, Ruler, ScanSearch, ShieldCheck } from "lucide-react";
import { InquiryCta } from "@/components/inquiry-cta";
import { company } from "@/lib/site-data";

const pageTitle = `Quality Process | ${company.brand}`;
const pageDescription = "Order-specific checks for materials, dimensions, process requirements, and dispatch preparation.";
const pageUrl = `https://${company.domain}/quality`;

export const metadata: Metadata = {
  title: pageTitle,
  description: pageDescription,
  alternates: { canonical: pageUrl },
  openGraph: { title: pageTitle, description: pageDescription, type: "website", url: pageUrl },
};

const checkpoints = [
  { icon: ClipboardList, title: "Requirement record", text: "Keep confirmed drawings, dimensions, materials, surfaces, and quantity visible to the production team." },
  { icon: ScanSearch, title: "Incoming review", text: "Review specified inputs against the confirmed production requirements." },
  { icon: Ruler, title: "Dimensional checks", text: "Compare relevant dimensions with approved drawings or confirmed order specifications." },
  { icon: Eye, title: "Process review", text: "Review visible production and surface details at defined order stages." },
  { icon: ShieldCheck, title: "Final inspection", text: "Check finished output against the confirmed order requirements before dispatch preparation." },
  { icon: PackageCheck, title: "Packing review", text: "Coordinate packing details with product geometry and confirmed shipment requirements." },
];

export default function QualityPage() {
  return (
    <main>
      <section className="inner-page-hero" aria-labelledby="quality-title"><div className="page-container inner-page-hero__grid"><div><p className="eyebrow">Controlled requirements</p><h1 id="quality-title">Quality</h1></div><p>Order-specific checks connect the approved inputs to production, inspection, and dispatch preparation without implying unsupported third-party approvals.</p></div></section>
      <section className="content-section"><div className="page-container"><div className="page-section-heading"><p className="eyebrow">Inspection pathway</p><h2>Order-specific checks at practical production points.</h2><p>The applicable checks are defined by the confirmed product, drawing, material, process, and order requirements.</p></div><div className="capability-grid">{checkpoints.map(({ icon: Icon, title, text }) => <article className="capability-card" key={title}><Icon aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      <section className="process-band" aria-labelledby="quality-record-title"><div className="page-container"><p className="eyebrow">Traceable conversation</p><h2 id="quality-record-title">Confirm the inspection basis before production.</h2><div className="process-band__grid"><p>Approved drawings and specifications define the review basis.</p><p>Material and surface directions remain tied to the confirmed order.</p><p>Inspection scope is discussed for the applicable product requirements.</p></div></div></section>
      <section className="inquiry-banner" aria-labelledby="quality-inquiry-title"><div className="page-container inquiry-banner__inner"><div><p className="eyebrow">Define the review basis</p><h2 id="quality-inquiry-title">Share the checks your project requires.</h2><p>Include drawings, dimensions, material direction, application context, and packing needs.</p></div><InquiryCta /></div></section>
    </main>
  );
}
