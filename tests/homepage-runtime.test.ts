import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("hero carousel exposes a named carousel region", async () => {
  const { HeroCarousel } = await import("../components/hero-carousel");
  const markup = renderToStaticMarkup(createElement(HeroCarousel));
  const carouselTag = markup.match(/<div[^>]*aria-roledescription="carousel"[^>]*>/)?.[0] ?? "";

  assert.match(carouselTag, /role="region"/);
  assert.match(carouselTag, /aria-label="Featured Wanfan capabilities"/);
});

test("factory video renders the first item from the supplied workshop playlist", async () => {
  const { FactoryVideo } = await import("../components/factory-video");
  const markup = renderToStaticMarkup(createElement(FactoryVideo, {
    poster: "/assets/factory/production-poster.jpg",
    sources: [
      "/assets/factory/workshop-video-1.mp4",
      "/assets/factory/workshop-video-2.mp4",
    ],
  }));

  assert.match(markup, /<video[^>]*>/);
  assert.match(markup, /src="\/assets\/factory\/workshop-video-1\.mp4"/);
});

test("hero uses three generated industrial banners without Chinese copy", async () => {
  const source = await readFile(new URL("../components/hero-carousel.tsx", import.meta.url), "utf8");
  assert.match(source, /hero-product-systems-v2\.png/);
  assert.match(source, /hero-production-line-v2\.png/);
  assert.match(source, /hero-quality-control-v2\.png/);
  assert.doesNotMatch(source, /万帆/);
});

test("homepage visual system includes textured cards and reduced-motion-safe view animation", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /--engineering-grid:/);
  assert.match(css, /animation-timeline:\s*view\(\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.site-logo img \{[^}]*width:\s*56px/);
});

test("material mapping provides a unique icon, explicit mark, and accessible label for every option", async () => {
  const { materialOptions } = await import("../lib/home-content");

  assert.equal(materialOptions.length, 5);
  assert.deepEqual(materialOptions.map((option) => option.mark), ["Zn", "PC", "Zn–Al–Mg", "201 / 304 / 316", "Al"]);
  assert.equal(new Set(materialOptions.map((option) => option.iconName)).size, materialOptions.length);
  assert.equal(new Set(materialOptions.map((option) => option.accessibleLabel)).size, materialOptions.length);
  for (const option of materialOptions) {
    assert.match(option.accessibleLabel, new RegExp(option.title));
    assert.match(option.accessibleLabel, new RegExp(option.mark.replace(/[–/]/g, "\\$&")));
  }
});

test("products route renders an independent heading and the reusable product cards", async () => {
  const { default: ProductsPage } = await import("../app/products/page");
  const markup = renderToStaticMarkup(await ProductsPage());

  assert.match(markup, /<h1[^>]*>Cable-management product systems<\/h1>/);
  assert.match(markup, /Cable Tray Systems/);
  assert.match(markup, /Utility-Tunnel Supports/);
  assert.match(markup, /Solar Mounting Structures/);
  assert.match(markup, /Get a Quote/);
});

test("homepage renders every material label, mark, and semantic icon into the materials section", async () => {
  const { default: HomePage } = await import("../app/page");
  const { materialOptions } = await import("../lib/home-content");
  const markup = renderToStaticMarkup(await HomePage());
  const materialsMarkup = markup.match(/<section[^>]*id="materials"[\s\S]*?<\/section>/)?.[0] ?? "";

  assert.notEqual(materialsMarkup, "");
  assert.equal(new Set(materialOptions.map((option) => option.mark)).size, materialOptions.length);
  assert.equal(new Set(materialOptions.map((option) => option.iconName)).size, materialOptions.length);

  for (const option of materialOptions) {
    assert.match(materialsMarkup, new RegExp(`aria-label="${option.accessibleLabel}"`));
    assert.match(materialsMarkup, new RegExp(`<span[^>]*class="material-card__mark"[^>]*>${option.mark}<\/span>`));
    assert.match(materialsMarkup, new RegExp(`lucide-${option.iconName}`));
  }
});
