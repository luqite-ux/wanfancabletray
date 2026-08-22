import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homePage = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
const globalCss = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

async function componentSource(name) {
  try {
    return await readFile(new URL(`../components/${name}`, import.meta.url), "utf8");
  } catch {
    return "";
  }
}

async function projectSource(path) {
  try {
    return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  } catch {
    return "";
  }
}

test("homepage composes exactly three differentiated hero slides with two CTA targets", async () => {
  const source = await componentSource("hero-carousel.tsx");

  assert.match(source, /export const heroSlides\s*=\s*\[/);
  assert.equal((source.match(/title:\s*"/g) ?? []).length, 3);
  assert.match(source, /Engineered Cable Management for Demanding Projects\./);
  assert.match(source, /Flexible Manufacturing, Built Around Your Drawings\./);
  assert.match(source, /Registered Brand\. Controlled Production\. Project-Ready Support\./);
  assert.equal((source.match(/primaryCta:/g) ?? []).length, 3);
  assert.equal((source.match(/secondaryCta:/g) ?? []).length, 3);
  assert.match(source, /CAROUSEL_INTERVAL_MS/);
  assert.match(source, /onMouseEnter/);
  assert.match(source, /onFocusCapture/);
  assert.match(source, /isUserPaused/);
  assert.match(source, /isInteracting/);
  assert.match(source, /ArrowLeft/);
  assert.match(source, /ArrowRight/);
  assert.match(source, /prefers-reduced-motion/);
});

test("homepage contains all nine substantive sections and verified manufacturing facts", () => {
  for (const sectionId of [
    "hero",
    "metrics",
    "product-systems",
    "solutions",
    "manufacturing-flow",
    "factory",
    "materials",
    "faq",
    "inquiry",
  ]) {
    assert.match(homePage, new RegExp(`id=["']${sectionId}["']`));
  }

  assert.match(homePage, /≈3,000 m²/);
  assert.match(homePage, /≈50/);
  assert.match(homePage, /5–15 days/);
  assert.match(homePage, /Drawing-based customization/);
});

test("homepage uses semantic Lucide icons, clean product rendering, and conditional news", async () => {
  const productCard = await componentSource("product-card.tsx");
  const heroCarousel = await componentSource("hero-carousel.tsx");

  assert.match(homePage, /from "lucide-react"/);
  assert.match(homePage, /publishedArticles\.length > 0/);
  assert.match(productCard, /objectFit:\s*["']contain["']/);
  assert.match(heroCarousel, /aria-live/);

  const publicSource = [homePage, productCard, heroCarousel, await componentSource("factory-video.tsx")].join("\n");
  assert.doesNotMatch(publicSource, /warrant(?:y|ies|ied)|guarantee(?:d|s)?|price|cart|payment/iu);
});

test("server homepage sends serializable metric icon names to the client metric component", async () => {
  const metric = await componentSource("animated-metric.tsx");

  assert.match(metric, /iconName:\s*"factory"\s*\|\s*"machines"\s*\|\s*"schedule"\s*\|\s*"drawing"/);
  assert.doesNotMatch(metric, /icon:\s*LucideIcon/);
  assert.match(homePage, /iconName="factory"/);
  assert.match(homePage, /iconName="machines"/);
  assert.match(homePage, /iconName="schedule"/);
  assert.match(homePage, /iconName="drawing"/);
});

test("carousel derives both its interval and progress from one resettable timing clock", async () => {
  const carousel = await componentSource("hero-carousel.tsx");
  const timing = await projectSource("lib/carousel-timing.ts");

  assert.match(timing, /CAROUSEL_INTERVAL_MS\s*=\s*7000/);
  assert.match(timing, /resetCarouselClock/);
  assert.match(timing, /pauseCarouselClock/);
  assert.match(timing, /getCarouselProgress/);
  assert.match(carousel, /resetCarouselClock/);
  assert.match(carousel, /isPaused \|\| reducedMotion\s*\?\s*pauseCarouselClock\(resetCarouselClock/);
  assert.match(carousel, /style=\{\{ transform: `scaleX\(\$\{progress\}\)` \}\}/);
  assert.doesNotMatch(globalCss, /animation:\s*carousel-progress/);
});

test("carousel exposes its actual paused state for interaction and manual pause", async () => {
  const carousel = await componentSource("hero-carousel.tsx");

  assert.match(carousel, /const isPaused = isUserPaused \|\| isInteracting/);
  assert.match(carousel, /Paused while you are interacting/);
  assert.match(carousel, /aria-live="polite"/);
});

test("product cards use verified-family engineering visuals instead of workshop views", async () => {
  const productData = homePage.match(/const products:[\s\S]+?\n\];/)?.[0] ?? "";
  const cableTrayVisual = await projectSource("public/assets/products/cable-tray-system.svg");
  const tunnelSupportVisual = await projectSource("public/assets/products/utility-tunnel-support.svg");
  const solarVisual = await projectSource("public/assets/products/solar-mounting-structure.svg");

  assert.doesNotMatch(productData, /workshop-/);
  assert.match(productData, /\/assets\/products\/cable-tray-system\.svg/);
  assert.match(productData, /\/assets\/products\/utility-tunnel-support\.svg/);
  assert.match(productData, /\/assets\/products\/solar-mounting-structure\.svg/);
  for (const source of [cableTrayVisual, tunnelSupportVisual, solarVisual]) {
    assert.match(source, /<svg/);
    assert.match(source, /<title(?:\s|>)/);
  }
});

test("material identifiers are distinct and purposeful, and homepage links have matching labels", () => {
  assert.match(homePage, /Shield/);
  assert.match(homePage, /Paintbrush/);
  assert.match(homePage, /Layers3/);
  assert.match(homePage, /Fingerprint/);
  assert.match(homePage, /PanelsTopLeft/);
  assert.match(homePage, /<Link className="inquiry-cta" href="\/products">Explore All Product Families<\/Link>/);
  assert.match(homePage, /<SectionHeading eyebrow="News" id="news-heading" title="Updates from Wanfan"/);
});
