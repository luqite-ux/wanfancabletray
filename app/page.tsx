import Image from "next/image";
import { Building2, CheckCircle2, CircleGauge, ClipboardCheck, Factory, FileSearch, HardHat, Layers3, PackageCheck, PanelsTopLeft, Ruler, School, ShipWheel, SunMedium, Truck, Waypoints } from "lucide-react";
import { AnimatedMetric } from "@/components/animated-metric";
import { FactoryVideo } from "@/components/factory-video";
import { HeroCarousel } from "@/components/hero-carousel";
import { InquiryCta } from "@/components/inquiry-cta";
import { ProductCard, type ProductView } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { cableTrayMaterials, company, faqItems, productFamilies } from "@/lib/site-data";

const products: ProductView[] = [
  { slug: "cable-tray-systems", name: "Cable Tray Systems", family: "Cable management", description: "Adaptable tray systems for coordinated routing across building and industrial projects.", image: "/assets/factory/workshop-09.jpg", imageAlt: "Finished cable tray systems arranged in the Wanfan workshop" },
  { slug: "solar-mounting-structures", name: "Solar Mounting Structures", family: "Structural support", description: "Structural components for solar projects with order-specific material and process options.", image: "/assets/factory/workshop-11.jpg", imageAlt: "Manufactured structural components in the Wanfan workshop" },
  { slug: "seismic-supports", name: "Seismic Supports", family: "Building systems", description: "Support systems prepared for coordinated installation requirements in commercial buildings.", image: "/assets/factory/workshop-07.jpg", imageAlt: "Wanfan support-system production equipment" },
];

const applications = [
  { icon: Building2, title: "Commercial buildings", text: "Organized cable routing and support across coordinated building services." },
  { icon: SunMedium, title: "Solar projects", text: "Structural components for project-specific solar mounting requirements." },
  { icon: Factory, title: "Industrial facilities", text: "Cable-management and support systems for busy production environments." },
  { icon: Waypoints, title: "Infrastructure", text: "Support components for utility corridors and transport-related projects." },
  { icon: School, title: "Schools", text: "Practical cable routing for education facilities and campus upgrades." },
  { icon: HardHat, title: "Public facilities", text: "Coordinated support for public-building electrical installations." },
];

const manufacturingSteps = [
  { icon: FileSearch, title: "Drawing review", text: "Review drawings, dimensions, quantities, and project context together." },
  { icon: Layers3, title: "Material selection", text: "Confirm material and surface options against the order requirements." },
  { icon: CheckCircle2, title: "Sample confirmation", text: "Confirm a representative sample when the project requires one." },
  { icon: Factory, title: "Production", text: "Schedule the agreed manufacturing process after order confirmation." },
  { icon: ClipboardCheck, title: "Inspection", text: "Complete order-specific checks before arranging release." },
  { icon: Truck, title: "Shipment", text: "Coordinate dispatch details and delivery documentation with your team." },
];

const materialOptions = [
  { icon: PanelsTopLeft, title: "Galvanized steel", text: "A practical steel option for cable-management systems." },
  { icon: CircleGauge, title: "Powder-coated steel", text: "A surface option for coordinated project finishes." },
  { icon: Ruler, title: "Zinc-aluminum-magnesium steel", text: "A coated steel option available for confirmed requirements." },
  { icon: PackageCheck, title: "Stainless steel 201 / 304 / 316", text: "Multiple stainless-steel grades for specified applications." },
  { icon: ShipWheel, title: "Aluminum alloy", text: "An aluminum-alloy option for selected cable-routing projects." },
];

const publishedArticles: Array<{ title: string; date: string; excerpt: string }> = [];

export default function HomePage() {
  return (
    <main className="home-page">
      <section id="hero" aria-label="Wanfan introduction"><HeroCarousel /></section>

      <section className="content-section metrics-section" id="metrics" aria-label="Manufacturing facts">
        <div className="page-container">
          <SectionHeading eyebrow="Manufacturing at a glance" title="Built for practical project coordination." description="Verified production facts to help your team start a clear technical conversation." />
          <div className="metrics-grid">
            <AnimatedMetric detail="Approximate working area for cable-management and support production." iconName="factory" label="Facility area" value="≈3,000 m²" />
            <AnimatedMetric detail="Production equipment supporting different fabrication stages." iconName="machines" label="Production machines" value="≈50" />
            <AnimatedMetric detail="Typical production window, subject to order confirmation." iconName="schedule" label="Typical window" value="5–15 days" />
            <AnimatedMetric detail="Bring drawings, dimensions, and requirements into the review." iconName="drawing" label="Customization" value="Drawing-based customization" />
          </div>
        </div>
      </section>

      <section className="content-section product-section" id="product-systems">
        <div className="page-container">
          <SectionHeading eyebrow="Product systems" title="Cable-management systems that keep the full product in view." description="Explore core product families, then bring project dimensions and material requirements into the inquiry process." />
          <div className="product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
          <div className="section-inline-cta"><InquiryCta label="Explore All Product Families" /></div>
        </div>
      </section>

      <section className="content-section solutions-section" id="solutions">
        <div className="page-container">
          <SectionHeading align="center" eyebrow="Application solutions" title="Prepared for the spaces where cable systems have to work." />
          <div className="solutions-grid">{applications.map(({ icon: Icon, title, text }) => <article className="solution-card" key={title}><Icon aria-hidden="true" className="solution-card__icon" strokeWidth={1.8} /><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="content-section flow-section" id="manufacturing-flow">
        <div className="page-container">
          <SectionHeading eyebrow="Custom manufacturing flow" title="A transparent path from drawings to dispatch." description="Each step keeps project requirements visible before work moves to the next stage." />
          <ol className="manufacturing-flow">{manufacturingSteps.map(({ icon: Icon, title, text }, index) => <li key={title}><span aria-hidden="true" className="flow-step__number">0{index + 1}</span><Icon aria-hidden="true" className="flow-step__icon" strokeWidth={1.7} /><h3>{title}</h3><p>{text}</p></li>)}</ol>
        </div>
      </section>

      <section className="content-section factory-section" id="factory">
        <div className="page-container factory-grid">
          <div>
            <SectionHeading eyebrow="Factory and production" title="A workshop view before the first project conversation." description={`${company.brand} supports cable-management and structural-support requirements from its Nanjing production operation.`} />
            <p className="factory-copy">Use the short workshop clip or browse the production imagery to understand the setting behind your order discussion.</p>
            <FactoryVideo poster="/assets/factory/production-poster.jpg" source="/assets/factory/production-clip.mp4" />
          </div>
          <div className="factory-photo-grid">
            <div className="factory-photo factory-photo--large"><Image alt="Wide view of the Wanfan factory workshop" fill sizes="(max-width: 900px) 100vw, 40vw" src="/assets/factory/workshop-01.jpg" style={{ objectFit: "cover" }} /></div>
            <div className="factory-photo factory-photo--small"><Image alt="Cable tray fabrication work at Wanfan" fill sizes="(max-width: 900px) 100vw, 30vw" src="/assets/factory/workshop-05.jpg" style={{ objectFit: "cover" }} /></div>
          </div>
        </div>
      </section>

      <section className="content-section materials-section" id="materials">
        <div className="page-container">
          <SectionHeading align="center" eyebrow="Material and surface options" title="Choose from verified material directions." description={`${cableTrayMaterials.en.length} cable-tray material options are available for confirmed project requirements.`} />
          <div className="materials-grid">{materialOptions.map(({ icon: Icon, title, text }) => <article className="material-card" key={title}><Icon aria-hidden="true" className="material-card__icon" strokeWidth={1.7} /><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section className="content-section faq-section" id="faq">
        <div className="page-container faq-layout">
          <SectionHeading eyebrow="FAQ" title="Answers grounded in the supplied project questionnaire." description="Ask for a quote when your drawing, quantity, or installation context needs a detailed review." />
          <div className="faq-list">{faqItems.map((item) => <details key={item.question.en}><summary>{item.question.en}</summary><p>{item.answer.en}</p></details>)}</div>
        </div>
      </section>

      {publishedArticles.length > 0 ? <section className="content-section news-section" id="news" aria-labelledby="news-heading"><div className="page-container"><SectionHeading eyebrow="News" title="Updates from Wanfan" /><div className="news-grid">{publishedArticles.map((article) => <article className="news-card" key={article.title}><time>{article.date}</time><h3>{article.title}</h3><p>{article.excerpt}</p></article>)}</div></div></section> : null}

      <section className="inquiry-banner" id="inquiry" aria-labelledby="inquiry-heading"><div className="page-container inquiry-banner__inner"><div><p className="eyebrow">Start your project discussion</p><h2 id="inquiry-heading">Bring your drawing, quantity, and target application.</h2><p>Our inquiry workflow is ready for the project details your team needs to share.</p></div><InquiryCta label="Request a Quote" /></div></section>
      <p className="sr-only">Available product families include {productFamilies.map((family) => family.name.en).join(", ")}.</p>
    </main>
  );
}
