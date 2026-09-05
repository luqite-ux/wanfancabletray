# Wanfan Final Fix Report

Date: 2026-08-24

Status: DONE

## Scope and source

- Final-reviewed input: `0744e5ba2a1683e27d1c057c9809607d4f599e86`.
- A concurrent remote-only atomic CAPTCHA commit, `92fbe7ec6353b4d6686dabfda27391b86fa98a26`, appeared before delivery. It was authenticated, fetched, inspected, and rebased cleanly; no force-push was used.
- Delivered runtime code: `2b1173fdc6e653d5063174ffd2d9cb3c17788ae9` on `luqite-ux/wanfancabletray` `main`.
- READY Production deployment: `dpl_AzBpeH8LfMMH2RZHP3h1iuyFxxyC`, `https://wanfancabletray-448lluby9-huanqiu.vercel.app`, source ref `main`, exact source SHA above.
- Final evidence/documentation follows as an evidence-only commit and is pushed/deployed during handoff; its exact SHA and deployment ID are returned in the final handoff readback.

## Findings closed

### Mobile touch targets

The failing controls now expose explicit rendered hit boxes of at least 44×44 CSS pixels at 390×844. The carousel keeps its compact 24×8 visual selectors inside 44×44 button boxes, preserving the approved hierarchy.

| Target | Live rendered box (CSS px) |
| --- | ---: |
| Header logo link | 108.36×44 |
| Previous / pause / next | 44×44 each |
| Slide selectors 1–3 | 44×44 each |
| Footer navigation links | 350×44 each |
| Footer email | 198.27×44 |
| Footer phone | 140.5×44 |
| Contact email | 214.88×44 |
| Contact phone | 148.52×44 |
| Attachment input | 265.91×44 |
| CAPTCHA answer input | 128×44 |
| CAPTCHA refresh button | 76.89×44 |

The named targets are asserted from `boundingBox()` results in Chromium, not source/CSS regexes. Latest desktop and mobile captures are committed under `output/playwright/`.

### Generic locale routing

- Root `proxy.ts` is the only locale request-routing layer. It recognizes every configured non-default locale, rewrites to the existing App Router tree, and passes an allow-listed locale request header to Server Components.
- Default English stays canonical and unprefixed. `/en/*` redirects to the equivalent unprefixed path. Locale-shaped unsupported prefixes are rewritten to a no-index 404.
- Request locale now drives product/news list and detail reads, metadata, Open Graph URLs, product JSON-LD, internal links, date formatting, and the sitemap. Static English sections explicitly use the existing fallback behavior.
- Canonical and reciprocal `hreflang` URLs are unique per enabled locale; `x-default` remains English/unprefixed.
- There is no copied `[locale]` route tree.

A process-local fixture enabled `en,zh` only for the dedicated browser server and supplied one localized product/article without touching Supabase. All four required paths returned 200 and remained visibly prefixed:

- `/zh/products`
- `/zh/products/cable-tray-systems`
- `/zh/news`
- `/zh/news/locale-routing-update`

Each page rendered Chinese data, `html[lang=zh]`, a matching prefixed canonical, reciprocal `en`/`zh`/`x-default`, and locale-preserving chrome links. Each emitted Chinese sitemap URL resolved. `/xx/products` returned 404. Default `/products` remained English/canonical, and `/en/products` redirected to it.

Production stayed English-only: live `/zh/products` and `/xx/products` return 404; the live 20-URL sitemap has no `/zh` or `/en` prefix and contains exactly ten product detail URLs.

### Deterministic E2E

- Product browser coverage requires exactly ten cards, ten detail links, and ten unique detail paths.
- Both owned local Playwright servers use `reuseExistingServer: false`; a stale listener on 4173 cannot satisfy E2E.
- Local and live CAPTCHA responses are intercepted inside the browser harness, so verification performs no customer-data write. The rendered CAPTCHA controls remain part of mobile touch-target assertions.

## TDD and verification evidence

RED evidence captured during implementation:

- Mobile touch test failed first at the 108.36×36 header logo.
- Locale unit tests first failed because the generic route module did not exist.
- Locale browser test first returned 404 for `/zh/products`.
- After the first rewrite, trace evidence exposed a second Next.js Proxy pass that reset `zh` to `en`; the allow-listed internal request locale was preserved on the second pass.
- Dynamic product/news detail tests exposed Next.js static-to-dynamic `headers()` errors; both detail routes were made request-dynamic.
- Integrating the concurrent CAPTCHA commit exposed its `.ts` import under `tsc --noEmit` and its expected local 503s under the browser console-error contract; both were corrected without weakening the runtime checks.

GREEN evidence on the combined final tree:

- `pnpm test`: 119/119 passed.
- `pnpm lint`: passed.
- `pnpm typecheck`: passed.
- `pnpm build`: passed; 29 static pages generated, expected dynamic routes emitted, and Proxy registered.
- `pnpm test:e2e`: 14 passed, one intentional desktop touch-target skip; includes desktop, mobile, and the alternate-locale project.
- Live Playwright at `https://wanfancabletray.com`: 13 passed, one intentional desktop touch-target skip in 2.6 minutes.
- Live HTTP: apex 200; `www` 308 to apex; `/products` 200 with exact canonical; `/en/products` 308 to `/products`; `/zh/products` and `/xx/products` 404; sitemap 200 with 20 URLs and exactly ten product details.
- GitHub authentication: `GET /user` returned exactly `luqite-ux`; REST main readback matched the runtime SHA.
- Vercel readback: project `prj_btmXR6MHm2adsRz48lsDpS06gkJW`, team `team_v0pxRIIzSUGJleUTRNSz6GS4`, READY deployment/source SHA matched.

## Data safety and concerns

- No tenant setting, supported-language value, product, article, inquiry, CAPTCHA challenge, R2 object, DNS record, or environment value was changed by this fix wave.
- No other tenant was read or written for test data.
- The alternate locale exists only in the process-local fixture; Production remains `[en]` and emits no empty-language pages.
- CONCERNS: none.
