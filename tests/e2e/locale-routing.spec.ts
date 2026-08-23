import { expect, test, type Page } from "@playwright/test";

async function expectLocalizedMetadata(page: Page, canonicalPath: string) {
  const origin = "https://wanfancabletray.com";
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${origin}${canonicalPath}`);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wanfancabletray\.com\/(?!en(?:\/|$))/));
  await expect(page.locator('link[rel="alternate"][hreflang="zh"]')).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wanfancabletray\.com\/zh(?:\/|$)/));
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wanfancabletray\.com\/(?!en(?:\/|$))/));
}

test("configured locale prefixes rewrite through one route tree with localized data and SEO", async ({ page, request }) => {
  const localeCases = [
    ["/zh/products", "本地化电缆桥架"],
    ["/zh/products/cable-tray-systems", "本地化电缆桥架"],
    ["/zh/news", "本地化路由更新"],
    ["/zh/news/locale-routing-update", "本地化路由更新"],
  ] as const;

  for (const [path, localizedText] of localeCases) {
    const response = await page.goto(path);
    expect(response?.status(), `${path} should resolve through the generic locale rewrite`).toBe(200);
    await expect(page).toHaveURL(path);
    await expect(page.locator("html")).toHaveAttribute("lang", "zh");
    await expect(page.getByText(localizedText, { exact: true }).first()).toBeVisible();
    await expectLocalizedMetadata(page, path);
  }

  await page.goto("/zh/products");
  await expect(page.getByRole("banner").getByRole("link", { name: "Wanfan home" })).toHaveAttribute("href", "/zh");
  await expect(page.getByRole("navigation", { name: "Footer navigation" }).getByRole("link", { name: "Products", exact: true })).toHaveAttribute("href", "/zh/products");

  await page.goto("/products");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://wanfancabletray.com/products");
  await page.goto("/en/products");
  await expect(page).toHaveURL("/products");

  const unsupported = await request.get("/xx/products", { maxRedirects: 0 });
  expect(unsupported.status()).toBe(404);

  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  const paths = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname));
  for (const [path] of localeCases) {
    expect(paths.has(path), `sitemap should include ${path}`).toBe(true);
    expect((await request.get(path)).status(), `${path} emitted by sitemap should resolve`).toBe(200);
  }
  expect([...paths].some((path) => path.startsWith("/xx/"))).toBe(false);
});
