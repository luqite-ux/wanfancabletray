# Wanfan Cable Tray Delivery Record

Date: 2026-08-23

Customer: 南京万帆电气设备有限公司 / Nanjing Wanfan Electrical Equipment Co., Ltd.

Status: External delivery complete; no unresolved production blocker.

## Production identities

| Item | Verified value |
| --- | --- |
| GitHub identity | `luqite-ux` verified by authenticated `GET /user` before remote operations |
| Repository | `luqite-ux/wanfancabletray`, repository ID `1343776978`, default branch `main` |
| Runtime source SHA | `09476196a950ce8d4f70319b6c99636d050c19b3` |
| Vercel team | `team_v0pxRIIzSUGJleUTRNSz6GS4` |
| Vercel project | `wanfancabletray`, project ID `prj_btmXR6MHm2adsRz48lsDpS06gkJW` |
| Verified runtime deployment | `dpl_3cn6jcAtsCVFfrdAZvECcReU9T18`, READY Production, `https://wanfancabletray-di6at3fye-huanqiu.vercel.app` |
| Production origin | `https://wanfancabletray.com` |
| Redirect origin | `https://www.wanfancabletray.com` → apex with HTTP 308 |
| Tenant | `12349fb9-b9f7-46aa-8623-c3cff85fad23` |
| Shared admin | `https://admin.globle-trade.com`; READY shared-admin SHA `5bd9af01a869b43ceece52238e72512224b5817e` |

The Git remote is secret-free. The runtime deployment identifies GitHub source `luqite-ux/wanfancabletray`, ref `main`, and the exact runtime SHA above. A final evidence-only commit follows this runtime commit and is also pushed and deployed during handoff; its authoritative SHA and deployment ID are recorded in the Task 8 external report and final handoff readback.

## Tenant, content, and media

- The exact tenant reads back with `display_name = 南京万帆电气设备有限公司`, `default_language = en`, `supported_languages = [en]`, and `admin_group = 2`.
- Initialized settings read back with brand color `#25358f`, verified R2 logo/favicon URLs, `info@wanfancabletray.com`, `+86 158 5079 7846`, the verified Nanjing address, and populated English site-title/tagline/description/address/SEO JSON fields.
- Content reads back as four categories, ten active products, and zero articles. Every product contains the required English multilingual JSON and public R2 image URLs; no local database image path remains.
- Supabase Storage bucket `inquiry-attachments` exists and is private. Public site media uses R2 prefix `tenants/12349fb9-b9f7-46aa-8623-c3cff85fad23/wanfancabletray/`.
- The 28 planned objects—brand assets, product illustrations, workshop images, video poster, and production video—were uploaded before seeding. All 28 returned HTTP 206 to independent range reads with valid PNG, SVG, JPEG, or MP4 types.
- Database and fallback scans found zero prohibited warranty/guarantee terms, zero fictional articles, and zero local image paths.

## Vercel and domain configuration

- The independent Vercel project is explicitly linked to GitHub repository ID `1343776978`, owner `luqite-ux`, repository `wanfancabletray`, with Production Branch `main`.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_TENANT_ID`, `NEXT_PUBLIC_ADMIN_URL`, and `SUPABASE_SERVICE_ROLE_KEY` are present for Production, Preview, and Development. The service-role key has no `NEXT_PUBLIC_` counterpart and remains server-only.
- `NEXT_PUBLIC_ADMIN_URL` is exactly `https://admin.globle-trade.com`; the tenant ID is exactly `12349fb9-b9f7-46aa-8623-c3cff85fad23`.
- Both production domains are attached and Vercel reports them configured. Apex HTTPS is stable; `www` redirects to the canonical apex.
- Cloudflare zone `2953962b4e4fd5824652630a77ea827c` is active on authoritative nameservers `eleanor.ns.cloudflare.com` and `sterling.ns.cloudflare.com`.
- Only two apex A records and one `www` CNAME were added for Vercel. Existing mail/autoconfiguration CNAMEs, two MX records, and four TXT records were preserved. The pre-change nine-record snapshot is `docs/delivery/2026-08-23-wanfancabletray-dns-before.json`.

## Live acceptance evidence

- Live HTTP verification passed all 20 unique sitemap URLs: ten static/listing routes and all ten product details. Every route returned 200 with a unique title, description, exact apex canonical/Open Graph URL, HTTPS Open Graph image, and one H1.
- Product detail pages expose Product JSON-LD without offers or pricing; Home exposes Organization JSON-LD with the same verified company/contact facts.
- `robots.txt` returns 200, points to the canonical sitemap, and disallows `/admin/` and `/api/`. `sitemap.xml` returns 200 XML and excludes admin/API routes.
- Live public source/page, Supabase, and fallback scans found no prohibited warranty/guarantee terms and no price/cart/online-payment language.
- Home shows the verified legal English company name, email, phone, address, logo, and dynamic-year copyright. Footer/logo/product image checks passed on desktop and Pixel 7 views; all product subjects remain complete with `object-fit: contain` and clean backgrounds.
- Final live Playwright verification passed 12/12 tests against `https://wanfancabletray.com`, including navigation/carousel behavior, reduced motion, every independent route, every product image/gallery on desktop and mobile, inquiry validation, sitemap routes, runtime overlays, console/page errors, and axe serious/critical findings.

## Inquiry and shared-admin acceptance

- A clearly marked live inquiry (`CODEX DELIVERY CHECK 20260823-d54ed4c`) was submitted through the production UI. The API returned 200 and inquiry ID `c8caed00-bb4f-45e0-9e07-1d601dfdd367`.
- The row was read back with the exact Wanfan tenant, submitted identity, subject, marker, and status. It had no attachment. Only that exact row was deleted; a tenant/id/email/marker readback returned zero residual rows.
- Native admin login returned HTTP 303 to `https://wanfancabletray.com/admin` and issued the expected tenant/session cookies. Dashboard, product, article, inquiry, and settings routes were reachable.
- A disposable product (`2956d495-61f0-4d91-b7a4-6d731e579ef2`) and article (`8f3a4d53-2533-45ae-bd9f-7474c4c64407`) proved real DeepSeek one-click English→Chinese translation. Manual Chinese edits persisted after save and reopen in the corresponding `*_i18n` fields.
- The two disposable records were deleted by exact tenant and ID. Supported languages were restored to `[en]`; final readback is ten products, zero articles, and zero disposable translation records.

## Verification commands

- `pnpm test` — 110/110 passed.
- `pnpm lint` — exit 0.
- `pnpm typecheck` — exit 0.
- `pnpm build` — exit 0; 30 static pages generated and expected dynamic routes emitted.
- `pnpm test:e2e` — 12/12 passed locally against `next start` in 1.4 minutes.
- `PLAYWRIGHT_TEST_BASE_URL=https://wanfancabletray.com pnpm test:e2e` — 12/12 passed live in 2.0 minutes.
- Independent live HTTP verification — 20/20 sitemap routes and 10/10 product details passed.
- `git diff --check` — no whitespace errors; only repository line-ending notices.

No credential value is recorded in source, Git configuration, remote URLs, screenshots, or this delivery record.
