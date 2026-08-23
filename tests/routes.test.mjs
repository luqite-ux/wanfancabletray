import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
async function renderPage(Page, props) {
  return renderToStaticMarkup(await Page(props));
}

test("products page renders complete category filters and all verified families without prices", async () => {
  const { default: ProductsPage } = await import("../app/products/page.tsx");
  const html = await renderPage(ProductsPage);

  for (const label of ["All products", "Cable management", "Structural supports", "Conduit systems", "Stainless components"]) {
    assert.match(html, new RegExp(`>${label}<`, "i"));
  }
  assert.equal((html.match(/class="product-card"/g) ?? []).length, 10);
  assert.doesNotMatch(html, /\b(?:price|cart|payment)\b/i);
});

test("product detail renders the full decision path and prefilled inquiry CTA", async () => {
  const { default: ProductDetailPage, generateMetadata } = await import("../app/products/[slug]/page.tsx");
  const routeProps = {
    params: Promise.resolve({ slug: "cable-tray-systems" }),
  };
  const html = await renderPage(ProductDetailPage, {
    params: Promise.resolve({ slug: "cable-tray-systems" }),
  });
  const metadata = await generateMetadata(routeProps);

  for (const heading of ["Overview", "Materials and surfaces", "Specifications", "Applications", "Customization flow", "Related products"]) {
    assert.match(html, new RegExp(heading, "i"));
  }
  assert.equal((html.match(/href="\/request-a-quote\?product=cable-tray-systems"/g) ?? []).length, 3);
  assert.doesNotMatch(html, /href="mailto:/i);
  assert.match(metadata.openGraph.images[0].url, /^https:\/\/wanfancabletray\.com\//);
  const jsonLdSource = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1];
  assert.ok(jsonLdSource, "Product JSON-LD should be rendered");
  const jsonLd = JSON.parse(jsonLdSource);
  assert.equal(jsonLd.image.length > 0, true);
  assert.equal(jsonLd.image.every((url) => /^https:\/\/wanfancabletray\.com\//.test(url)), true);
  assert.doesNotMatch(html, /\b(?:price|cart|payment|warrant(?:y|ies)|guarantee(?:d|s)?)\b/i);
});

test("solution and company routes render independent, unique primary content", async () => {
  const [
    { default: SolutionsPage },
    { default: ManufacturingPage },
    { default: QualityPage },
    { default: AboutPage },
    { default: FaqPage },
  ] = await Promise.all([
    import("../app/solutions/page.tsx"),
    import("../app/manufacturing/page.tsx"),
    import("../app/quality/page.tsx"),
    import("../app/about/page.tsx"),
    import("../app/faq/page.tsx"),
  ]);
  const pages = [
    [SolutionsPage, "Solutions", "Application pathways"],
    [ManufacturingPage, "Manufacturing", "Drawing review"],
    [QualityPage, "Quality", "Order-specific checks"],
    [AboutPage, "About Wanfan", "Nanjing Wanfan Electrical Equipment Co., Ltd."],
    [FaqPage, "Frequently asked questions", "0.5–3.0 mm"],
  ];

  const rendered = await Promise.all(pages.map(async ([Page, heading, evidence]) => {
    const html = await renderPage(Page);
    assert.match(html, new RegExp(`<h1[^>]*>${heading}</h1>`, "i"));
    assert.match(html, new RegExp(evidence, "i"));
    assert.match(html, /href="\/request-a-quote"/);
    return html;
  }));

  assert.equal(new Set(rendered).size, pages.length);
  assert.doesNotMatch(rendered.join("\n"), /\b(?:price|cart|payment|warrant(?:y|ies)|guarantee(?:d|s)?|certified)\b/i);
});

test("independent listing and company routes expose unique canonical and Open Graph metadata", async () => {
  const routeNames = ["products", "solutions", "manufacturing", "quality", "about", "faq"];
  const modules = await Promise.all([
    import("../app/products/page.tsx"),
    import("../app/solutions/page.tsx"),
    import("../app/manufacturing/page.tsx"),
    import("../app/quality/page.tsx"),
    import("../app/about/page.tsx"),
    import("../app/faq/page.tsx"),
  ]);

  const titles = [];
  for (const [index, routeModule] of modules.entries()) {
    const expectedUrl = `https://wanfancabletray.com/${routeNames[index]}`;
    assert.equal(routeModule.metadata.alternates.canonical, expectedUrl);
    assert.equal(routeModule.metadata.openGraph.url, expectedUrl);
    assert.equal(routeModule.metadata.openGraph.title, routeModule.metadata.title);
    assert.equal(routeModule.metadata.openGraph.description, routeModule.metadata.description);
    titles.push(routeModule.metadata.title);
  }

  assert.equal(new Set(titles).size, routeNames.length);
});

test("public manufacturing views render production facts from shared site data", async () => {
  const [{ default: HomePage }, { default: AboutPage }, { default: ManufacturingPage }, { productionFacts }] = await Promise.all([
    import("../app/page.tsx"),
    import("../app/about/page.tsx"),
    import("../app/manufacturing/page.tsx"),
    import("../lib/site-data.ts"),
  ]);
  const original = {
    area: productionFacts.facilityArea.display,
    machines: productionFacts.machineCount.display,
    days: productionFacts.productionWindow.days,
    qualifier: productionFacts.productionWindow.qualifier,
    display: productionFacts.productionWindow.display,
  };

  productionFacts.facilityArea.display = "≈4,321 m²";
  productionFacts.machineCount.display = "≈76";
  productionFacts.productionWindow.days = "7–9 days";
  productionFacts.productionWindow.qualifier = "subject to test confirmation";
  productionFacts.productionWindow.display = "7–9 days, subject to test confirmation";

  try {
    const home = await renderPage(HomePage);
    const about = await renderPage(AboutPage);
    const manufacturing = await renderPage(ManufacturingPage);
    for (const html of [home, about, manufacturing]) {
      assert.match(html, /≈4,321 m²/);
      assert.match(html, /≈76/);
      assert.match(html, /7–9 days/);
    }
    assert.match(manufacturing, /subject to test confirmation/);
  } finally {
    productionFacts.facilityArea.display = original.area;
    productionFacts.machineCount.display = original.machines;
    productionFacts.productionWindow.days = original.days;
    productionFacts.productionWindow.qualifier = original.qualifier;
    productionFacts.productionWindow.display = original.display;
  }
});
