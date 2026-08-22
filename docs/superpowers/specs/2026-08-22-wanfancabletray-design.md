# Wanfan Cable Tray Website Design Specification

## Objective

Build a bright, premium, English-first B2B inquiry website for Nanjing Wanfan Electrical Equipment Co., Ltd. at `wanfancabletray.com`. The website presents cable-management and structural-support manufacturing capabilities, does not show prices or commerce controls, and routes every commercial CTA into a real inquiry workflow.

## Verified source facts

- Legal Chinese name: 南京万帆电气设备有限公司.
- Public English name: Nanjing Wanfan Electrical Equipment Co., Ltd.
- Brand: Wanfan / 万帆.
- Email: `info@wanfancabletray.com`.
- Phone: `+86 158 5079 7846`.
- Address: C4-2068, Runtai Market, Yuhuatai District, Nanjing, Jiangsu, China.
- Factory area: approximately 3,000 m².
- Production equipment: approximately 50 machines.
- Typical production window: 5–15 days, subject to order confirmation.
- Registered Class 6 word mark: No. 74440645.
- Registered Class 6 device mark: No. 75536653.
- Product families: cable tray systems, solar mounting structures, seismic supports, utility-tunnel supports, aluminum cable trunking, stainless-steel rainwater outlets, EMT conduits, JDG conduits, stainless-steel hose clamps, and stainless-steel fasteners.
- Cable-tray materials include galvanized steel, powder-coated steel, zinc-aluminum-magnesium coated steel, stainless steel 201/304/316, and aluminum alloy.
- Cable-tray thickness range supplied in the customer questionnaire: 0.5–3.0 mm. Sizes and processes may be customized to confirmed order requirements.

The 1688 offer was blocked by a verification challenge during research, so no unverified SKU data, images, prices, certifications, or claims from that page may be invented. The private reference-case library required an administrator password, so the approved design is based on the customer brief, verified attachments, and established B2B manufacturing patterns.

## Brand and visual system

Use the supplied logo without redrawing or recoloring it. Derive the main palette from the original mark: deep engineering blue `#25358f`, clear blue `#0878d1`, electric cyan `#00aee8`, ink `#10233f`, mist `#edf7ff`, and white. The design must remain bright and clean; large black or muddy gray surfaces are prohibited.

Backgrounds alternate between subtle blueprint grids, pale blue-to-white gradients, soft cyan light fields, and high-key industrial photography. Body text maintains WCAG AA contrast. Product imagery uses `object-fit: contain` with continuous clean backgrounds so product geometry is never cropped.

Typography uses Geist Sans with Geist Mono for technical labels and measurements. Corners are moderately rounded (18–28 px for major cards, pill buttons for CTA). Iconography uses one consistent Lucide outline style and a different semantic icon for each capability or process step.

## Navigation and page architecture

The header explicitly includes `Home` and a clickable logo. Primary navigation:

- Home `/`
- Products `/products`
- Solutions `/solutions`
- Manufacturing `/manufacturing`
- Quality `/quality`
- About `/about`
- News `/news`
- Contact `/contact`
- Request a Quote `/request-a-quote`

Independent detail routes:

- Product detail `/products/[slug]`
- News detail `/news/[slug]`

English is the only enabled launch language. All content readers accept a locale and use request locale → default locale → first non-empty locale fallback. The data model uses multilingual JSON fields from the first release so another locale can be enabled later without schema or route redesign. The launch UI hides the language switcher.

## Home page

The homepage contains nine substantive sections.

1. Three-slide hero carousel:
   - Product installation: “Engineered Cable Management for Demanding Projects.”
   - Manufacturing: “Flexible Manufacturing, Built Around Your Drawings.”
   - Brand and production control: “Registered Brand. Controlled Production. Project-Ready Support.”
   - Each slide has a primary inquiry CTA and a contextual secondary CTA.
2. Metrics: approximately 3,000 m² facility, approximately 50 machines, 5–15 day production window subject to confirmation, and drawing-based customization.
3. Product systems grid with complete product imagery.
4. Application solutions for commercial buildings, solar projects, industrial facilities, infrastructure, schools, and public facilities.
5. Custom manufacturing flow: drawing review, material selection, sample confirmation, production, inspection, shipment.
6. Factory and production story using optimized real workshop photography and a short, muted, user-controllable video.
7. Material and surface options.
8. FAQ using only verified questionnaire answers after compliance rewriting.
9. Strong inquiry CTA. A News section appears only when real published articles exist; no fictional news is seeded.

## Motion system

Motion communicates engineered flow rather than entertainment. Use slow blueprint-line movement, cable-path light sweeps, restrained parallax, staggered section reveals, animated counters, and subtle product-card overlays. The carousel auto-advances every seven seconds, pauses on hover/focus, supports keyboard and touch controls, and provides visible progress and pause controls. All animation respects `prefers-reduced-motion`; content and CTAs remain immediately accessible without animation.

## Product experience

The products page supports category filtering and shows no prices. Product cards show name, family, short description, and `View Details` / `Get a Quote`. Product detail pages contain a full-image gallery, overview, material and surface options, specifications, applications, customization flow, related products, and a prefilled inquiry CTA.

Static launch data is a centralized fallback and future seed source. Supabase becomes the primary source when environment variables are present. Product and article rendering runs in async Server Components or server-side data modules; interactive filters and forms are Client Components.

## Inquiry experience

All CTAs converge on one real inquiry interface. Required fields: full name, company, business email, country/region, product category, estimated quantity, and message. Optional fields: phone, product, size, material, surface treatment, application, target delivery date, and drawing/specification attachment.

The product route pre-fills product context. Submission validates on server and client, persists to the shared Supabase `inquiries` table with the exact tenant ID, and provides accessible success/error states. No `alert`, `console.log`, timeout simulation, shopping cart, online payment, or price display is allowed.

## Manufacturing and source-media treatment

Use the supplied logo as header brand, favicon, loading mark, and social-share base asset. Preserve its aspect ratio.

The 13 workshop images are authentic but visually inconsistent. Prioritize the wide workshop views and finished cable-tray stacks. Correct exposure, white balance, perspective, and minor visual clutter without changing products, equipment count, factory size, or manufacturing reality. Product close-ups with rough floors are secondary gallery evidence, not hero images. The 24.97-second 1280×720 video requires orientation correction, trimming to 8–12 seconds, poster generation, muted playback, controls, and a static mobile fallback.

Trademark certificates are labeled `Registered Trademarks`, never product certification. Do not imply CE, UL, ISO, performance approval, or testing that was not supplied.

## Content and compliance

The public site must not contain warranty, guarantee, guaranteed-quality, service-life commitment, or equivalent promises in any language. The questionnaire’s “30-year life,” “one-year warranty,” “samples and bulk goods guaranteed consistent,” “peak season will not delay,” and “we can remake it” statements are excluded or rewritten as conditional process facts.

Avoid unverifiable superlatives such as leading, best, No. 1, certified, global leader, or zero-defect. Use “manufacturer,” “supports,” “available,” and “subject to order confirmation.”

The footer copyright is generated at runtime as `© <current year> Nanjing Wanfan Electrical Equipment Co., Ltd. All rights reserved.` after punctuation normalization. The logo remains clearly visible and linked to Home.

## SEO and accessibility

Each page has independent title, description, canonical URL, Open Graph metadata, structured data, and semantic headings. Product pages use Product structured data without offers or prices. The organization entity uses one consistent company name, email, phone, address, logo, and domain. Generate robots.txt and sitemap from the same locale-aware routes. Do not generate empty locale pages.

Meet WCAG AA contrast, keyboard operation, visible focus, descriptive alternative text, correct form labels, status announcements, and touch targets at least 44×44 px. The carousel, video, accordion, filters, and mobile navigation must remain usable without a mouse.

## Backend and delivery constraints

The client website lives in its own `luqite-ux/wanfancabletray` GitHub repository and its own Vercel project. It connects to the shared Supabase through environment variables only. A new tenant uses `display_name = 南京万帆电气设备有限公司`, `default_language = en`, `supported_languages = [en]`, and `admin_group = 2`, with all site-setting fields initialized from verified sources and read back after creation.

Logo, favicon, product imagery, certificates, and public media are uploaded to R2 before their URLs are written to tenant/product/article records. The future `/admin` proxy uses the proven Route Handler login pattern. Translation remains a manually triggered DeepSeek action in the shared admin and never runs automatically on save.

## Acceptance criteria

- Every route above renders as an independent page on desktop and mobile.
- Three accessible hero slides are present and motion reduces correctly.
- No price, cart, payment, warranty, guarantee, unsupported certification, or fictional article appears.
- Product imagery remains complete at all breakpoints and hover states.
- All CTA paths reach the real inquiry form; a verified submission persists to the correct tenant.
- Product and article data use multilingual fields and locale fallback.
- Footer, metadata, JSON-LD, email, phone, domain, logo, and tenant settings agree.
- Source, fallback data, Supabase records, and all indexed live URLs pass prohibited-term scans.
- Lint, tests, typecheck, production build, accessibility checks, browser console review, desktop screenshots, and mobile screenshots pass before delivery.

