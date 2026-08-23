# Task 8 External Delivery Report

Date: 2026-08-23

Status: DONE

## Outcome

Wanfan's independently owned customer repository, exact Supabase tenant, R2 media, Vercel project, Cloudflare DNS, apex and www domains, live inquiry flow, shared-admin write paths, and real one-click translation path are delivered and verified. Test inquiries and translation fixtures were removed by exact tenant and ID, and the tenant was restored to English-only launch state.

No secret value is present in this report, the repository remote, Git configuration, source, or screenshots.

## Source and hosting

- GitHub company identity: authenticated GET /user returned exactly luqite-ux before every remote push.
- Repository: luqite-ux/wanfancabletray; repository ID 1343776978; owner luqite-ux; default branch main.
- Reviewed input SHA: d54ed4cce91cf6c03989e3c0f909faffb641bc19.
- Runtime code SHA: 09476196a950ce8d4f70319b6c99636d050c19b3.
- Runtime Production deployment: dpl_3cn6jcAtsCVFfrdAZvECcReU9T18; READY at https://wanfancabletray-di6at3fye-huanqiu.vercel.app; source repository/ref/SHA read back as luqite-ux/wanfancabletray, main, 09476196a950ce8d4f70319b6c99636d050c19b3.
- Vercel project: wanfancabletray, ID prj_btmXR6MHm2adsRz48lsDpS06gkJW, team team_v0pxRIIzSUGJleUTRNSz6GS4.
- Git source: GitHub repository ID 1343776978, owner luqite-ux, repository wanfancabletray, Production Branch main.
- Production domains: https://wanfancabletray.com and https://www.wanfancabletray.com; www returns 308 to the apex.
- The evidence/documentation commit created after this report is pushed to main and deployed to Production as the final handoff action. Its exact SHA and deployment ID are returned in the parent handoff after REST readback.

## Shared-admin prerequisite

- Retained reviewed shared-admin worktree: D:\Cursor\Grand\huanqiu-admin-worktrees\wanfan-main-integration-20260823.
- Exact shared-admin Production SHA: 5bd9af01a869b43ceece52238e72512224b5817e.
- Shared-admin project: prj_VFHYQ1BFLRFQzxAOY4m1Gdz55byM.
- Readiness verifier found both wanfancabletray.com and www.wanfancabletray.com in the reviewed commit and confirmed the exact SHA as the latest READY Production deployment in the approved team/project.

## Supabase and R2

- Tenant ID: 12349fb9-b9f7-46aa-8623-c3cff85fad23.
- Exact readback: display_name = 南京万帆电气设备有限公司, domain wanfancabletray.com, default_language = en, supported_languages = [en], admin_group = 2.
- Settings readback: brand #25358f; R2 logo/favicon; verified email, phone, address; all required English title/tagline/description/address/SEO JSON fields; source metadata present.
- Administrator: exact tenant, active, group 2. The password is intentionally omitted.
- Data counts after cleanup: four categories, ten active products, zero articles, zero disposable translation records.
- Every product reads from public R2 URLs and contains the required English multilingual JSON values. No local database image path was found.
- Private inquiry bucket inquiry-attachments exists with public = false.
- R2 prefix: tenants/12349fb9-b9f7-46aa-8623-c3cff85fad23/wanfancabletray/.
- Media upload preceded seeding. All 28 required assets independently returned HTTP 206 with valid PNG, SVG, JPEG, or MP4 content types.
- Prohibited-term scans over tenant/settings/products/articles returned zero hits. No fictional article was seeded.

## Vercel environment boundary

- Present for Production, Preview, and Development: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_TENANT_ID, NEXT_PUBLIC_ADMIN_URL, SUPABASE_SERVICE_ROLE_KEY.
- NEXT_PUBLIC_TENANT_ID is the exact Wanfan UUID.
- NEXT_PUBLIC_ADMIN_URL is exactly https://admin.globle-trade.com.
- SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ variant and remains server-only.
- Windows Vercel CLI delivery was fixed with a tested command-shim launcher, current CLI visibility flags, and untargeted Preview environment configuration compatible with a Production Branch of main.

## DNS and HTTPS

- Cloudflare zone ID: 2953962b4e4fd5824652630a77ea827c; zone active.
- Authoritative nameservers: eleanor.ns.cloudflare.com, sterling.ns.cloudflare.com.
- Added only apex A 216.150.1.1, apex A 216.150.16.1, and www CNAME aa723e6e3295706e.vercel-dns-016.com.
- Preserved unrelated records: three mail/autoconfiguration CNAMEs, two MX records, and four TXT records.
- Pre-change snapshot: docs/delivery/2026-08-23-wanfancabletray-dns-before.json.
- Public resolver and Vercel readback confirmed both A records, exact CNAME, authoritative nameservers, preserved MX/TXT, configured domains, apex HTTPS, and www 308 redirect.

## Live inquiry and rollback

- Marker: CODEX DELIVERY CHECK 20260823-d54ed4c.
- Production UI submission returned HTTP 200 and inquiry ID c8caed00-bb4f-45e0-9e07-1d601dfdd367.
- Service-role readback matched the exact Wanfan tenant, submitter, email, subject, marker, and status; there was no attachment.
- Only that exact row was deleted using tenant/id/email/marker constraints. Final residual count: zero.

## Admin writes and translation rollback

- Native admin login POST returned HTTP 303 to https://wanfancabletray.com/admin and set tenant/session cookies.
- Dashboard displayed ten products, zero articles, and zero inquiries after cleanup; product, article, inquiry, and settings routes were reachable.
- Temporary Chinese support was enabled through Settings.
- Disposable product: ID 2956d495-61f0-4d91-b7a4-6d731e579ef2, slug codex-delivery-check-temp-product-d54ed4c.
- Disposable article: ID 8f3a4d53-2533-45ae-bd9f-7474c4c64407, slug codex-delivery-check-temp-article-d54ed4c.
- Real DeepSeek one-click English-to-Chinese translation succeeded for both records. A manual Chinese product title and article title persisted after save and reopen, with translated description/excerpt/content in the corresponding multilingual JSON.
- Both records were deleted by exact tenant and ID. Settings were restored to supported_languages = [en]. Final readback: ten products, zero articles, zero disposable records.

## Live site verification

- Independent HTTP verifier passed 20/20 sitemap URLs, including all ten product detail pages.
- Every page returned 200 with title, description, exact apex canonical and Open Graph URL, HTTPS Open Graph image, and exactly one H1.
- Home Organization JSON-LD and all ten Product JSON-LD blocks passed; product schema contains no offers or pricing.
- robots.txt returns 200, identifies the canonical sitemap, and disallows /admin/ and /api/; the sitemap returns XML and excludes both namespaces.
- Verified Home/footer facts: legal English company name, contact email, phone, full address, dynamic-year copyright, and clear linked logo.
- Desktop and Pixel 7 browser checks passed for complete product subjects, object-fit contain, clean image backgrounds, footer/logo contrast and proportions, overlay absence, console errors, and axe serious/critical findings.
- Final live Playwright run: 12/12 passed in 2.0 minutes against https://wanfancabletray.com.
- Live public-page and source scans, fallback scan, and Supabase scan found zero warranty/guarantee/Chinese promise hits and zero price/cart/online-payment hits.

## Verification summary

- Focused delivery tests: 17/17 passed.
- Full unit/integration/contract suite: 110/110 passed.
- Lint: passed.
- Typecheck: passed.
- Production build: passed; 30 static pages generated.
- Local Playwright: 12/12 passed in 1.4 minutes.
- Live Playwright: 12/12 passed in 2.0 minutes.
- Live HTTP/SEO: 20/20 sitemap routes and 10/10 product details passed.
- Fallback media: ten products, ten images, zero missing files, zero prohibited hits.
- Git diff hygiene: passed.

## Cleanup and remaining concerns

- Test inquiry: removed; zero residual.
- Test attachment: none created.
- Disposable product/article: removed; zero residual.
- Temporary locale: removed; supported languages restored to [en].
- Other tenants: untouched.
- Customer worktree and shared-admin reviewed worktree are intentionally retained for final review as required by the delivery task.
- No production blocker or pending external mutation remains.
