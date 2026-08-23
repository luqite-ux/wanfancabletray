# Task 7 Report — Admin integration and delivery scripts

## Status

Implemented the Task 7 admin proxy/login contract and dry-run-first delivery tooling. No live Supabase, R2, Vercel, GitHub, or domain mutation was performed.

## Delivered behavior

- Added a server-rendered administration sign-in page using a native HTML `POST` form to `/api/auth/login`.
- Added a Next.js Route Handler that scopes the administrator lookup to `NEXT_PUBLIC_TENANT_ID`, verifies the bcrypt password, persists an admin session, writes `hq_admin_session` and `hq_tenant_id` HTTP-only cookies, and returns an HTTP `303` redirect to `/admin`.
- Added `afterFiles` rewrites for `/admin`, `/admin/:path*`, and `/api/admin/:path*`, derived only from a normalized `NEXT_PUBLIC_ADMIN_URL`.
- Added a seed script that requires an explicit tenant UUID, produces an English-first multilingual JSONB plan, initializes all verified tenant settings, assigns `admin_group = 2`, seeds ten verified product families, and seeds zero articles.
- Added an R2 uploader that deterministically maps 28 reviewed local brand/product/factory assets to tenant-prefixed public R2 URLs. Its apply path uploads all objects before writing a temporary media manifest; the seed apply path requires that manifest before any database insertion.
- Added a Vercel setup script that defaults to dry-run, explicitly links `wanfancabletray` to `team_v0pxRIIzSUGJleUTRNSz6GS4`, supplies the five required variables to Production/Preview/Development from existing env sources, uses the main branch for Preview, and never prints values or passes the token on the command line.
- Added `bcryptjs` and `@aws-sdk/client-s3` runtime dependencies.

## TDD evidence

The initial focused run failed for the intended missing behaviors: all three delivery scripts, the login page, the login Route Handler, and the admin rewrites were absent. After implementation, focused tests exercise the actual CLI dry-run processes and the real native redirect/cookie response boundary.

Additional red/green cycles covered:

- Route Handler testability without weakening the existing `server-only` Supabase boundary.
- Local filesystem path detection without falsely rejecting `https://` R2 URLs.
- Next.js 16 entry-module constraints for page props and Route Handler exports.
- Vercel's current `--team <team-id>` targeting and a self-contained `pnpm dlx vercel@latest` CLI bootstrap.

## Verification

- Focused tests: `pnpm exec tsx --test tests/seed-contract.test.mjs tests/admin-login.test.mjs`
- Full tests: `pnpm test`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Production build: `pnpm build`
- Dry-runs: all three scripts executed with synthetic non-production values; each reported `mode = dry-run` and `mutations = 0`. The seed reported 10 products and 0 articles; R2 reported 28 uploads and 10 product mappings; Vercel reported the required company team/project and five environment variables.
- Diff hygiene: `git diff --check`

## Operational notes

- Live execution is intentionally gated behind `--apply`.
- R2 apply requires the R2 S3 credentials and public `pub-*.r2.dev` base; its completed manifest is written outside the repository by default.
- Seed apply requires that completed R2 manifest, service-role Supabase credentials, and `ADMIN_INITIAL_PASSWORD` from the environment. The plaintext password is not stored in source or emitted.
- Vercel apply requires `VERCEL_TOKEN` in the environment. It is not printed or included in CLI arguments.
