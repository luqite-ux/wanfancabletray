# Wanfan Cable Tray Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deliver the bright, animated, English-first Wanfan B2B inquiry website with independent routes, Supabase-ready localized content, verified customer media, SEO, and a real inquiry workflow.

**Architecture:** Use Next.js 16 App Router with async Server Components for product/article/settings reads and small Client Components for carousel, navigation, filters, video, and inquiry interaction. Keep verified fallback content in focused modules and switch to tenant-scoped Supabase data when environment variables exist. Store all user-facing content in locale-aware shapes and centralize company/contact/compliance facts.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.7, Tailwind CSS 4, Lucide React, Supabase JS, Zod, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-22-wanfancabletray-design.md`

## Global Constraints

- The launch language is English; locale-aware data interfaces and fallback remain present for future languages.
- The header explicitly shows Home and the logo links to `/`.
- The site never displays price, cart, payment, warranty/guarantee language, unsupported certifications, or fictional news.
- All inquiry CTAs use the same real Supabase-backed inquiry contract.
- Product images use complete-subject rendering with clean continuous backgrounds.
- Customer website files live only in the independent `wanfancabletray` repository.
- All Supabase keys, tenant ID, R2 values, and deployment credentials come from environment variables.

---

### Task 1: Repository foundation and verified content contract

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `lib/site-data.ts`, `lib/localization.ts`
- Test: `tests/localization.test.mjs`, `tests/compliance.test.mjs`

**Interfaces:**
- Produces `SiteLocale`, `LocalizedText`, `resolveLocalizedText()`, `company`, `productFamilies`, `faqItems`, and `scanProhibitedTerms()`.
- Consumers use verified facts only and never duplicate contact or legal-name strings.

- [ ] Write localization and prohibited-term tests using literal fixtures; verify they fail because modules are absent.
- [ ] Implement minimal locale fallback and compliance scanner; verify focused tests pass.
- [ ] Add Next.js/Tailwind foundation and the server-rendered homepage shell.
- [ ] Run all tests, ESLint, and TypeScript checks.
- [ ] Commit the foundation with exact files staged.

### Task 2: Brand assets and responsive site chrome

**Files:**
- Create: `public/assets/brand/logo.png`, favicon assets, optimized workshop assets, and video poster/clip
- Create: `components/site-header.tsx`, `components/mobile-navigation.tsx`, `components/site-footer.tsx`, `components/inquiry-cta.tsx`
- Modify: `app/layout.tsx`, `app/globals.css`
- Test: `tests/site-data.test.mjs`

**Interfaces:**
- `SiteHeader` consumes the centralized navigation array.
- `InquiryCta` accepts `{ productSlug?: string; label?: string; className?: string }` and links to `/request-a-quote` with encoded context.
- `SiteFooter` reads centralized company data and computes the current year at runtime.

- [ ] Write tests for explicit Home navigation, normalized copyright, contact consistency, and prohibited copy; verify expected failure.
- [ ] Copy and optimize supplied media without altering product geometry or factual factory details.
- [ ] Implement responsive header, accessible mobile menu, footer, focus states, and CTA.
- [ ] Run tests, lint, typecheck, and asset-dimension inspection.
- [ ] Commit brand and chrome changes.

### Task 3: Accessible animated homepage

**Files:**
- Create: `components/hero-carousel.tsx`, `components/animated-metric.tsx`, `components/section-heading.tsx`, `components/product-card.tsx`, `components/factory-video.tsx`
- Modify: `app/page.tsx`, `app/globals.css`
- Test: `tests/home-content.test.mjs`

**Interfaces:**
- `HeroCarousel` consumes the three literal `heroSlides` and exposes pause, previous, next, and slide selectors.
- `ProductCard` consumes `ProductView` and never renders pricing.
- `FactoryVideo` accepts poster/video source and renders controls plus a no-autoplay reduced-motion path.

- [ ] Write tests for exactly three differentiated slides, two CTA targets per slide, verified metrics, semantic icons, and no prohibited claims; verify failure.
- [ ] Implement carousel behavior with seven-second timing, focus/hover pause, keyboard controls, and reduced-motion support.
- [ ] Implement all nine homepage sections and conditional News rendering.
- [ ] Run tests, lint, typecheck, and production build.
- [ ] Commit homepage work.

### Task 4: Product and solution routes

**Files:**
- Create: `lib/supabase.ts`, `lib/products-db.ts`
- Create: `app/products/page.tsx`, `app/products/products-client.tsx`, `app/products/[slug]/page.tsx`
- Create: `app/solutions/page.tsx`, `app/manufacturing/page.tsx`, `app/quality/page.tsx`, `app/about/page.tsx`, `app/faq/page.tsx`
- Test: `tests/products.test.mjs`, `tests/routes.test.mjs`

**Interfaces:**
- `getProducts(locale?: SiteLocale): Promise<ProductView[]>` reads tenant-scoped multilingual rows and falls back to verified static data.
- `getProductBySlug(slug, locale?)` returns one `ProductView | null`.
- Product detail CTA passes `productSlug` into the shared inquiry route.

- [ ] Write tests for locale fallback, product family completeness, absent pricing, and unique independent routes; verify failure.
- [ ] Implement Supabase client and product mapper with request → default → first non-empty fallback.
- [ ] Implement product listing/filtering, product details, and five independent company/solution routes.
- [ ] Run tests, lint, typecheck, and production build.
- [ ] Commit product and capability routes.

### Task 5: News data flow and SEO

**Files:**
- Create: `lib/articles-db.ts`, `lib/metadata.ts`
- Create: `app/news/page.tsx`, `app/news/[slug]/page.tsx`
- Create: `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`
- Modify: all page metadata exports
- Test: `tests/articles.test.mjs`, `tests/seo.test.mjs`

**Interfaces:**
- `listPublishedArticles(locale, limit?)` returns only published articles and an empty array without seeded fiction.
- `getPublishedArticleBySlug(slug, locale)` returns localized published content or `null`.
- `buildPageMetadata()` uses the same company/domain facts as JSON-LD and footer.

- [ ] Write tests for empty news state, published date/title presence, locale fallback, canonical URLs, and sitemap exclusions; verify failure.
- [ ] Implement article data access and independent list/detail routes.
- [ ] Implement metadata, Organization/Product JSON-LD without Offer/pricing, robots, sitemap, and Open Graph image.
- [ ] Run tests, lint, typecheck, and production build.
- [ ] Commit news and SEO work.

### Task 6: Real inquiry workflow

**Files:**
- Create: `lib/inquiry.ts`, `app/api/inquiries/route.ts`
- Create: `components/inquiry-form.tsx`, `app/contact/page.tsx`, `app/request-a-quote/page.tsx`
- Test: `tests/inquiry.test.mjs`

**Interfaces:**
- `inquirySchema` validates full name, company, business email, country/region, category, estimated quantity, message, and optional project fields.
- `POST /api/inquiries` inserts a tenant-scoped row and returns `{ ok: true, inquiryId }` or `{ ok: false, error }`.
- `InquiryForm` accepts initial product/category context and announces accessible submission status.

- [ ] Write validation and payload-normalization tests for valid, empty, malformed, and optional inputs; verify failure.
- [ ] Implement schema, payload normalization, and tenant-scoped API route without simulated submission.
- [ ] Implement shared form, product prefill, contact details, and accessible states.
- [ ] Run tests, lint, typecheck, and production build.
- [ ] Commit inquiry workflow.

### Task 7: Admin integration and delivery scripts

**Files:**
- Create: `scripts/seed-wanfancabletray.mjs`, `scripts/upload-wanfan-media-to-r2.mjs`, `scripts/setup-vercel-project.mjs`
- Create: `app/admin/login/page.tsx`, `app/api/auth/login/route.ts`
- Modify: `next.config.mjs`
- Test: `tests/seed-contract.test.mjs`, `tests/admin-login.test.mjs`

**Interfaces:**
- Seed script requires explicit `NEXT_PUBLIC_TENANT_ID`, writes only that tenant, uses multilingual JSON fields, sets `admin_group = 2`, and initializes verified site settings.
- R2 uploader maps local media to stable public URLs before database insertion.
- Admin login uses a Route Handler with native `303` navigation to `/admin`, never a cross-application Server Action redirect.

- [ ] Write tests that execute dry-run script paths and assert tenant scoping, multilingual payloads, group 2, and no local image paths; verify failure.
- [ ] Implement dry-run-safe seed, R2 upload, Vercel setup, and admin proxy/login contract.
- [ ] Run tests, lint, typecheck, build, and dry-run scripts.
- [ ] Commit integration tooling.

### Task 8: End-to-end verification and external delivery

**Files:**
- Create: `tests/e2e/site.spec.ts`, `playwright.config.ts`, `docs/delivery/2026-08-22-wanfancabletray-delivery.md`
- Modify only files implicated by verified failures.

**Interfaces:**
- Browser tests verify navigation, carousel controls, complete product images, inquiry validation/submission state, console cleanliness, and responsive layouts.
- Delivery record lists source evidence, tenant ID, repository, Vercel project, domain, deployment, R2 prefixes, and verification results without secrets.

- [ ] Start the production-like server and run Playwright desktop/mobile flows, axe-compatible checks, and screenshot capture.
- [ ] Run source/fallback/database/live-URL prohibited-term scans and product-image completeness checks.
- [ ] Create or verify `luqite-ux/wanfancabletray` using the mandated company-token identity flow, push the verified branch, and compare remote main SHA.
- [ ] Create/link the company Vercel project, set environment variables, deploy Production, attach `wanfancabletray.com`, and verify HTTPS/canonical behavior.
- [ ] Create/read back the tenant, admin group, settings, content, R2 assets, inquiry insertion, and admin translation extension path.
- [ ] Run final full tests, lint, typecheck, production build, browser audit, and deployment smoke test; record exact evidence.
- [ ] Commit the delivery record and clean any temporary branch/worktree only after all durable results are present in the customer repository.
