import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("product gallery exposes each image as a keyboard-operable selection button", async () => {
  const galleryModule = await import("../components/product-gallery.tsx").catch(() => null);
  assert.equal(typeof galleryModule?.ProductGallery, "function", "ProductGallery component should exist");

  const html = renderToStaticMarkup(createElement(galleryModule.ProductGallery, {
    images: [
      { src: "/first.svg", alt: "First product view" },
      { src: "/second.svg", alt: "Second product view" },
    ],
    productName: "Test Product",
  }));

  assert.match(html, /role="group"/);
  assert.equal((html.match(/type="button"/g) ?? []).length, 2);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, 1);
  assert.match(html, /aria-label="Show First product view"/);
  assert.match(html, /aria-label="Show Second product view"/);
});
