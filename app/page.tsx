import Link from "next/link";
import { company } from "@/lib/site-data";

const foundationFacts = [
  ["≈3,000 m²", "Factory area"],
  ["≈50", "Production machines"],
  ["5–15 days", "Typical window, subject to order confirmation"],
];

export default function HomePage() {
  return (
    <div className="site-shell">
      <header className="foundation-header">
        <Link className="brand-mark" href="/" aria-label={`${company.brand} home`}>
          {company.brand}
        </Link>
        <Link className="home-link" href="/">Home</Link>
      </header>
      <main className="foundation-main">
        <section className="foundation-content" aria-labelledby="home-title">
          <span className="eyebrow">Cable management &amp; structural support</span>
          <h1 id="home-title">Engineered cable management for demanding projects.</h1>
          <p>
            {company.publicName} supports drawing-based manufacturing for cable-management and structural-support requirements.
          </p>
          <div className="fact-grid" aria-label="Verified manufacturing facts">
            {foundationFacts.map(([value, label]) => (
              <article className="fact-card" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
