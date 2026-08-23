import type { Metadata } from "next";
import { Building2, Factory, GraduationCap, Landmark, Network, SunMedium } from "lucide-react";
import { InquiryCta } from "@/components/inquiry-cta";
import { buildPageMetadata } from "@/lib/metadata";
import { getRequestLocaleContext } from "@/lib/request-locale";
import { company } from "@/lib/site-data";

const pageTitle = `Application Solutions | ${company.brand}`;
const pageDescription = "Application pathways for cable-management and structural-support project requirements.";
export async function generateMetadata(): Promise<Metadata> {
  const { locale, supportedLocales } = await getRequestLocaleContext();
  return buildPageMetadata({ title: pageTitle, description: pageDescription, path: "/solutions", locale, supportedLocales });
}

const applications = [
  { icon: Building2, title: "Commercial buildings", text: "Coordinate cable-management routes with drawings, installation zones, and material requirements." },
  { icon: SunMedium, title: "Solar projects", text: "Review structural components against project drawings, site context, and confirmed specifications." },
  { icon: Factory, title: "Industrial facilities", text: "Plan routing and support components around equipment layouts and installation requirements." },
  { icon: Network, title: "Infrastructure corridors", text: "Develop support and cable-routing configurations for utility tunnels and coordinated corridors." },
  { icon: GraduationCap, title: "Schools", text: "Support organized cable routes for education facilities through project-specific review." },
  { icon: Landmark, title: "Public facilities", text: "Align material, dimensions, and installation context before order confirmation." },
];

export default async function SolutionsPage() {
  const { locale } = await getRequestLocaleContext();
  return (
    <main>
      <section className="inner-page-hero" aria-labelledby="solutions-title"><div className="page-container inner-page-hero__grid"><div><p className="eyebrow">Application pathways</p><h1 id="solutions-title">Solutions</h1></div><p>Start with the application context, then coordinate product family, material direction, dimensions, and production requirements.</p></div></section>
      <section className="content-section"><div className="page-container"><div className="page-section-heading"><p className="eyebrow">Application pathways</p><h2>Six project contexts, one requirements-led process.</h2><p>Each pathway begins with verified project inputs rather than a fixed off-the-shelf configuration.</p></div><div className="capability-grid">{applications.map(({ icon: Icon, title, text }) => <article className="capability-card" key={title}><Icon aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
      <section className="process-band" aria-labelledby="solution-process-title"><div className="page-container"><p className="eyebrow">Coordination sequence</p><h2 id="solution-process-title">Application → drawings → configuration → confirmation.</h2><div className="process-band__grid"><p>Share the installation environment and performance requirements.</p><p>Review drawings, routes, interfaces, and available space.</p><p>Confirm product family, material, surface, dimensions, and quantity.</p></div></div></section>
      <section className="inquiry-banner" aria-labelledby="solution-inquiry-title"><div className="page-container inquiry-banner__inner"><div><p className="eyebrow">Plan an application</p><h2 id="solution-inquiry-title">Bring the project context into one inquiry.</h2><p>Tell us where the system will be installed and which requirements need review.</p></div><InquiryCta locale={locale} /></div></section>
    </main>
  );
}
