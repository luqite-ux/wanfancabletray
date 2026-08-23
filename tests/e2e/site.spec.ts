import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const independentRoutes = [
  ["/", "Engineered Cable Management for Demanding Projects."],
  ["/products", "Cable-management product systems"],
  ["/solutions", "Solutions"],
  ["/manufacturing", "Manufacturing"],
  ["/quality", "Quality"],
  ["/about", "About Wanfan"],
  ["/news", "News"],
  ["/contact", "Contact Wanfan"],
  ["/request-a-quote", "Request a Quote"],
  ["/faq", "Frequently asked questions"],
] as const;

const prohibitedRenderedTerms = [
  /\bwarrant(?:y|ies|ied|ed)\b/i,
  /\bguarantee(?:s|d|ing)?\b/i,
  /质保|保修|质量保证/,
  /\b(?:price|shopping cart|online payment)\b/i,
];

function monitorRuntime(page: Page) {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

async function expectImagesComplete(page: Page, selector: string) {
  const images = page.locator(selector);
  expect(await images.count()).toBeGreaterThan(0);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(async () => image.evaluate((node) => {
      const element = node as HTMLImageElement;
      return element.complete && element.naturalWidth > 0 && element.naturalHeight > 0;
    })).toBe(true);
    await expect(image).toHaveCSS("object-fit", "contain");
    const fitsContainer = await image.evaluate((node) => {
      const imageRect = node.getBoundingClientRect();
      const parentRect = node.parentElement?.getBoundingClientRect();
      return Boolean(parentRect)
        && imageRect.left >= parentRect!.left - 1
        && imageRect.top >= parentRect!.top - 1
        && imageRect.right <= parentRect!.right + 1
        && imageRect.bottom <= parentRect!.bottom + 1;
    });
    expect(fitsContainer).toBe(true);
  }
}

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    animations: "disabled",
    fullPage: true,
    path: `output/playwright/${testInfo.project.name}-${name}.png`,
  });
}

test("Home navigation and all three carousel slides remain operable", async ({ page }, testInfo) => {
  const runtimeProblems = monitorRuntime(page);
  await page.goto("/");

  const primaryNavigation = page.getByRole("navigation", { name: "Primary navigation" });
  if (testInfo.project.name.startsWith("mobile")) {
    await page.getByRole("button", { name: "Open navigation menu" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile primary navigation" }).getByRole("link", { name: "Home", exact: true })).toHaveAttribute("href", "/");
    await page.getByRole("button", { name: "Close navigation menu" }).click();
  } else {
    await expect(primaryNavigation.getByRole("link", { name: "Home", exact: true })).toHaveAttribute("href", "/");
  }
  await expect(page.getByRole("banner").getByRole("link", { name: "Wanfan home" })).toHaveAttribute("href", "/");

  const carousel = page.getByRole("region", { name: "Featured Wanfan capabilities" });
  await expect(carousel.getByRole("button", { name: /^Show slide / })).toHaveCount(3);
  await carousel.getByRole("button", { name: /^Show slide 2:/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Flexible Manufacturing, Built Around Your Drawings.");
  await carousel.getByRole("button", { name: "Next slide" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Registered Brand. Controlled Production. Project-Ready Support.");
  await carousel.getByRole("button", { name: "Previous slide" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Flexible Manufacturing, Built Around Your Drawings.");
  await carousel.focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Engineered Cable Management for Demanding Projects.");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Flexible Manufacturing, Built Around Your Drawings.");
  if (testInfo.project.name.startsWith("mobile")) {
    const box = await carousel.boundingBox();
    expect(box).not.toBeNull();
    const client = await page.context().newCDPSession(page);
    const y = box!.y + Math.min(120, box!.height / 2);
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: box!.x + box!.width - 40, y }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: box!.x + 40, y }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await client.detach();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Registered Brand. Controlled Production. Project-Ready Support.");
    await carousel.getByRole("button", { name: "Previous slide" }).click();
  }
  await carousel.getByRole("button", { name: /Keep automatic slides paused/ }).click();
  await expect(carousel.getByText("Paused", { exact: true })).toBeVisible();

  await expectNoSeriousAccessibilityViolations(page);
  await capture(page, testInfo, "home");
  expect(runtimeProblems).toEqual([]);
});

test("reduced motion keeps carousel content stable", async ({ page }) => {
  const runtimeProblems = monitorRuntime(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const heading = page.getByRole("heading", { level: 1 });
  const initialHeading = await heading.textContent();
  await expect(page.getByText("Paused because reduced motion is enabled", { exact: true })).toBeVisible();
  await page.waitForTimeout(7_250);
  await expect(heading).toHaveText(initialHeading ?? "");
  expect(runtimeProblems).toEqual([]);
});

test("all independent routes render unique primary content without runtime errors", async ({ page }, testInfo) => {
  const runtimeProblems = monitorRuntime(page);
  for (const [route, heading] of independentRoutes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
    await expect(page.locator("nextjs-portal")).toHaveCount(0);
  }
  await page.goto("/request-a-quote");
  await expect(page).toHaveURL("/request-a-quote");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Request a Quote");
  await capture(page, testInfo, "request-a-quote");
  expect(runtimeProblems).toEqual([]);
});

test("product list and detail galleries keep every product image complete", async ({ page }, testInfo) => {
  const runtimeProblems = monitorRuntime(page);
  await page.goto("/products");
  await expectImagesComplete(page, ".product-card__image-wrap img");
  const productDetailPaths = await page.getByRole("link", { name: /View Details/ }).evaluateAll((links) =>
    [...new Set(links.map((link) => (link as HTMLAnchorElement).pathname))],
  );
  expect(productDetailPaths.length).toBeGreaterThan(0);
  await capture(page, testInfo, "products");

  await page.getByRole("link", { name: /View Details/ }).first().click();
  await expect(page).toHaveURL(/\/products\/cable-tray-systems$/);
  await expectImagesComplete(page, ".product-gallery__main img, .product-gallery__thumb img");
  await expect(page.getByRole("group", { name: /image gallery$/ })).toBeVisible();
  await capture(page, testInfo, "product-detail");

  for (const path of productDetailPaths.slice(1)) {
    await page.goto(path);
    await expect(page.locator("nextjs-portal")).toHaveCount(0);
    await expect(page.getByRole("group", { name: /image gallery$/ })).toBeVisible();
    await expectImagesComplete(page, ".product-gallery__main img, .product-gallery__thumb img");
  }
  expect(runtimeProblems).toEqual([]);
});

test("news empty state and inquiry validation stay honest without live credentials", async ({ page }) => {
  const runtimeProblems = monitorRuntime(page);
  await page.goto("/news");
  await expect(page.getByRole("status")).toContainText("No published updates yet");

  await page.goto("/contact");
  await page.getByRole("button", { name: "Submit Inquiry" }).click();
  await expect(page.getByLabel("Full name")).toHaveJSProperty("validity.valid", false);

  await page.goto("/request-a-quote?product=cable-tray-systems");
  await expect(page.getByLabel("Product", { exact: true })).toHaveValue("Cable Tray Systems");
  await page.getByRole("textbox", { name: "Full name", exact: true }).fill("Local Verification User");
  await page.getByRole("textbox", { name: "Company", exact: true }).fill("Local Verification Company");
  await page.getByRole("textbox", { name: "Business email", exact: true }).fill("verification@example.com");
  await page.getByRole("textbox", { name: "Country / region", exact: true }).fill("China");
  await expect(page.getByRole("combobox", { name: "Product category", exact: true })).toHaveValue(/Cable management/i);
  await page.getByRole("textbox", { name: "Estimated quantity", exact: true }).fill("100 m");
  await page.getByRole("textbox", { name: "Project message", exact: true }).fill("Local browser verification only; no external submission is allowed.");

  let interceptedSubmissions = 0;
  await page.route("**/api/inquiries", async (route) => {
    interceptedSubmissions += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: false, error: "Local verification mode: submission was not sent." }) });
  });
  await page.getByRole("button", { name: "Submit Inquiry" }).click();
  await expect(page.locator(".inquiry-form").getByRole("alert")).toHaveText("Local verification mode: submission was not sent.");
  expect(interceptedSubmissions).toBe(1);
  expect(runtimeProblems).toEqual([]);
});

test("sitemap URLs resolve locally and rendered pages contain no prohibited terms", async ({ page, request }) => {
  test.setTimeout(120_000);
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBe(true);
  const sitemap = await sitemapResponse.text();
  const URLs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]));
  expect(URLs.length).toBeGreaterThan(independentRoutes.length);

  for (const url of URLs) {
    const response = await request.get(`${url.pathname}${url.search}`);
    expect(response.ok(), `${url.pathname} should resolve locally`).toBe(true);
    await page.goto(`${url.pathname}${url.search}`);
    const renderedText = await page.locator("body").innerText();
    for (const term of prohibitedRenderedTerms) {
      expect(renderedText, `${url.pathname} contains ${term}`).not.toMatch(term);
    }
  }
});
