import type { Metadata } from "next";
import { HelpCircle, Mail } from "lucide-react";
import { InquiryCta } from "@/components/inquiry-cta";
import { resolveLocalizedText } from "@/lib/localization";
import { buildPageMetadata } from "@/lib/metadata";
import { cableTrayMaterials, company, faqItems } from "@/lib/site-data";

const pageTitle = `Frequently Asked Questions | ${company.brand}`;
const pageDescription = "Verified answers about Wanfan materials, thicknesses, drawings, production timing, and inquiry preparation.";
export const metadata: Metadata = buildPageMetadata({
  title: pageTitle,
  description: pageDescription,
  path: "/faq",
});

const additionalFaqs = [
  { question: "Which details should I include in an inquiry?", answer: "Include the product category, estimated quantity, application, available drawings or dimensions, material direction, surface requirement, and target delivery context." },
  { question: "Which product families can be discussed?", answer: "Wanfan supports cable tray systems, solar mounting structures, seismic and utility-tunnel supports, aluminum cable trunking, conduit systems, rainwater outlets, hose clamps, and fasteners." },
  { question: "Are registered trademarks product approvals?", answer: "No. The Class 6 word and device mark registrations identify the Wanfan marks and are not presented as product testing or approval." },
];

export default function FaqPage() {
  const questions = [
    ...faqItems.map((item) => ({
      question: resolveLocalizedText(item.question, company.defaultLocale, company.defaultLocale),
      answer: resolveLocalizedText(item.answer, company.defaultLocale, company.defaultLocale),
    })),
    ...additionalFaqs,
  ];

  return (
    <main>
      <section className="inner-page-hero" aria-labelledby="faq-title"><div className="page-container inner-page-hero__grid"><div><p className="eyebrow">Verified project answers</p><h1 id="faq-title">Frequently asked questions</h1></div><p>Review confirmed information about the 0.5–3.0 mm cable-tray thickness range, available materials, drawings, timing, and inquiry inputs.</p></div></section>
      <section className="content-section"><div className="page-container faq-page-layout"><div><HelpCircle aria-hidden="true" /><p className="eyebrow">Project preparation</p><h2>Answers grounded in supplied company information.</h2><p>Material options include {cableTrayMaterials.en.join(", ")}.</p><a className="text-link" href={`mailto:${company.email}`}><Mail aria-hidden="true" size={18} /> {company.email}</a></div><div className="faq-list">{questions.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></div></section>
      <section className="inquiry-banner" aria-labelledby="faq-inquiry-title"><div className="page-container inquiry-banner__inner"><div><p className="eyebrow">Need a project-specific answer?</p><h2 id="faq-inquiry-title">Bring the open questions into your inquiry.</h2><p>Share drawings, quantity, application, and configuration context for review.</p></div><InquiryCta /></div></section>
    </main>
  );
}
