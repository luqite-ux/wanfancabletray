# Wanfan Cable Tray Delivery Record

Date: 2026-08-23

Customer: 南京万帆电气设备有限公司 / Nanjing Wanfan Electrical Equipment Co., Ltd.

Public domain target: `wanfancabletray.com`

## Scope and evidence

This record captures the verified local release candidate and the remaining external delivery work. The source of truth is `docs/superpowers/specs/2026-08-22-wanfancabletray-design.md`, which consolidates the verified customer brief, supplied logo, 13 workshop photographs, processed workshop video/poster, registered Class 6 trademark facts, confirmed company/contact details, and compliance rewrites. The blocked 1688 offer and password-protected reference-case library were not used as factual sources.

The local media set contains three brand/icon assets, ten product illustrations, thirteen workshop photographs, one video poster, and one production clip. The R2 upload plan therefore contains 28 objects. No unverified SKU, price, certification, article, warranty, guarantee, or service-life claim is included.

## Delivery identities and current status

| Item | Required identity or value | Status at this record |
| --- | --- | --- |
| GitHub owner/repository | `luqite-ux/wanfancabletray` | Pending external verification, repository creation if absent, push, and remote `main` SHA comparison. No GitHub request or mutation was made in this local-only task. |
| Vercel team | `team_v0pxRIIzSUGJleUTRNSz6GS4` | Fixed delivery target; not mutated. |
| Vercel project | `wanfancabletray` | Pending company-project create/link and readback. |
| Production domains | `wanfancabletray.com`, `www.wanfancabletray.com` | Pending attachment, HTTPS, redirect, canonical, and live sitemap verification. |
| Production deployment | Company Vercel Production from repository `main` | Pending. No deployment URL or production SHA exists in this local record. |
| Tenant ID | A newly created, explicit UUID for this customer | Pending external creation/readback; intentionally not invented or copied from another customer. |
| Tenant display name | `南京万帆电气设备有限公司` | Prepared in the seed plan; pending tenant-scoped apply/readback. |
| Tenant language/group | `default_language = en`, `supported_languages = [en]`, `admin_group = 2` | Prepared in the seed plan; pending apply/readback. |
| R2 public-media prefix | `tenants/<tenant-id>/wanfancabletray/` | Deterministic 28-object plan verified locally; upload and URL readback pending. |
| Inquiry attachment storage | Supabase bucket `inquiry-attachments`, object path `<tenant-id>/<correlation-id>/<safe-filename>` | Code and tests verified locally; live insertion/readback/cleanup pending. |
| Shared admin | `https://admin.globle-trade.com` | Customer-site proxy/login and multilingual JSON paths are implemented. A separate shared-admin Production commit containing both Wanfan origins remains required before Vercel apply. |

Secrets are not recorded in this document. GitHub, Vercel, Supabase, R2, and admin credentials must remain in approved environment sources and must not be written into source, Git configuration, remotes, logs, or delivery notes.

## Local release verification

- Production build: `pnpm build` completed with all public routes, ten product detail routes, `robots.txt`, and `sitemap.xml` generated.
- Unit/integration/contract suite: the final `pnpm test` run passed 108/108 tests.
- Static analysis: `pnpm lint` and `pnpm typecheck` passed.
- Browser suite: the final Playwright run passed 12/12 tests in 45.4 seconds using desktop Chromium at 1440×1000 and Pixel 7 mobile flows against `next start` on `127.0.0.1:4173`.
- Browser coverage: explicit Home navigation/logo, desktop/mobile menu, three carousel selectors, previous/next controls, keyboard arrows, mobile touch swipe, manual pause, reduced-motion stability, all independent routes, sitemap resolution, empty-news behavior, client validation, prefilled quote context, locally intercepted submission error state, and browser console/page-error cleanliness.
- Accessibility: axe WCAG 2 A/AA and 2.1 A/AA checks report no serious or critical violations on the representative homepage flow; route tests also reject a Next.js runtime error overlay.
- Product imagery: all ten product-list images and every product-detail gallery load with non-zero intrinsic dimensions, `object-fit: contain`, and bounds inside their containers on desktop and mobile.
- Compliance: the centralized fallback/site-content scan found zero prohibited promise terms; public source scans found zero publishable warranty/guarantee or commerce terms; every locally rendered sitemap URL passed the prohibited-term scan.
- Inquiry safety: browser submission is intercepted locally and never reaches `/api/inquiries`; live persistence is intentionally not claimed.

Screenshots are retained under `output/playwright/` for desktop and mobile Home, Products, Product Detail, and Request a Quote views. They were captured from the production-like server with animations disabled for stable review.

## External completion checklist

The following items remain pending because this task was explicitly local-only and authorized no external mutation:

1. Follow the company-token identity flow, confirm `GET /user` returns exactly `luqite-ux`, verify/create `luqite-ux/wanfancabletray`, push the reviewed commit, and compare remote `main` SHA.
2. Complete the separate shared-admin origin change and verify its exact commit is the latest READY Production deployment in the approved shared-admin Vercel project.
3. Create an explicit tenant UUID, upload all 28 media objects to the tenant R2 prefix, apply the seed, and read back the tenant, `admin_group = 2`, initialized settings, four categories, ten products, zero articles, administrator, and R2 URLs.
4. Link/create the company Vercel project, apply required environment variables without printing their values, deploy repository `main` to Production, and attach both domains.
5. Verify HTTPS, canonical/Open Graph/JSON-LD consistency, robots/sitemap, all public/product routes, desktop/mobile screenshots, and live prohibited-term scans.
6. Submit one authorized real inquiry and read it back under the exact tenant; then create/edit a product and article in the shared admin, trigger manual translation after enabling a target locale, save an edit, and reopen it to prove multilingual persistence.

External delivery must not be marked complete until every item above has durable readback evidence.
