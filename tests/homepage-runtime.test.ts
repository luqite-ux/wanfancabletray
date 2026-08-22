import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

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
