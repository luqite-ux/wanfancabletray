import assert from "node:assert/strict";
import test from "node:test";
import {
  localizePath,
  resolveLocaleHeader,
  resolveLocaleRoute,
} from "../lib/locale-routing";

const supportedLocales = ["en", "zh"];

test("configured non-default locale prefixes rewrite to the existing route tree", () => {
  const expectedRoutes = new Map([
    ["/zh/products", "/products"],
    ["/zh/products/cable-tray-systems", "/products/cable-tray-systems"],
    ["/zh/news", "/news"],
    ["/zh/news/locale-routing-update", "/news/locale-routing-update"],
  ]);

  for (const [publicPath, internalPath] of expectedRoutes) {
    assert.deepEqual(resolveLocaleRoute(publicPath, supportedLocales, "en"), {
      kind: "rewrite",
      locale: "zh",
      pathname: internalPath,
    });
  }
});

test("default, prefixed-default and unsupported locale paths cannot create duplicate locale pages", () => {
  assert.deepEqual(resolveLocaleRoute("/products", supportedLocales, "en"), {
    kind: "next",
    locale: "en",
    pathname: "/products",
  });
  assert.deepEqual(resolveLocaleRoute("/en/products", supportedLocales, "en"), {
    kind: "redirect",
    locale: "en",
    pathname: "/products",
  });
  assert.deepEqual(resolveLocaleRoute("/xx/products", supportedLocales, "en"), {
    kind: "reject",
    locale: null,
    pathname: "/xx/products",
  });
});

test("request locale headers are allow-listed and locale paths keep English unprefixed", () => {
  assert.equal(resolveLocaleHeader("zh", supportedLocales, "en"), "zh");
  assert.equal(resolveLocaleHeader("xx", supportedLocales, "en"), "en");
  assert.equal(localizePath("/products", "en", "en"), "/products");
  assert.equal(localizePath("/products", "zh", "en"), "/zh/products");
  assert.equal(localizePath("/", "zh", "en"), "/zh");
});
