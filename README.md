# FoodRescue Link

Good food, shared locally. FoodRescue Link connects schools with food to share,
food pantries, and neighbors looking for their next meal — in one place.

Live site: https://foodrescuelink.org

Built for the 2026 Congressional App Challenge (NJ-03) by Team FoodRescue Link.
The site is trilingual (English / 中文 / Español) and works as a PWA.

## What it does

- Browse surplus food listings and nearby help without signing in.
- Schools and pantries can post food, manage pickups, and coordinate with volunteers.
- Email login (Supabase Auth), reservation email notifications, and a community
  bookshelf with a nutrition booklet from the Peddie Food Bank Club.

## Tech stack

- Frontend: vanilla HTML/CSS/JavaScript (in `public/`), built with esbuild.
- Backend: Cloudflare Worker (`src/worker.mjs`) with Cloudflare D1 (SQLite).
- Auth and data: Supabase (`@supabase/supabase-js`).
- Database migrations: `migrations/` (D1).
- Tests: `tests/` (Node test runner).

## Project structure

- `public/` — website pages, CSS, JavaScript, trilingual content, PWA files,
  images, demo video, and the nutrition booklet.
- `src/` — Cloudflare Worker backend and email-auth client.
- `lib/` — food listings, reservations, organizations, notifications, and
  account-deletion logic.
- `migrations/` — Cloudflare D1 database migrations.
- `tests/` — automated tests.
- `scripts/` — build script.

## Run it locally

Requires Node.js >= 22.13.0.

1. In this directory, run `npm ci`.
2. Configure your own values in `wrangler.jsonc`: Supabase URL, publishable key,
   and D1 `database_id`.
3. If you need an admin user, replace `REPLACE_WITH_ADMIN_USER_ID` in
   `src/worker.mjs`.
4. `npm run db:local` (apply migrations to the local D1 database)
5. `npm run dev` (builds, then serves locally at http://localhost:8787)
6. Tests: `npm test`. Build: `npm run build`.

## Deploy

1. Log in to Wrangler with your own Cloudflare account and configure D1.
2. Run the remote migrations, then `npm run deploy`.
3. Email login needs Supabase email auth configured; reservation email
   notifications need a `RESEND_API_KEY`.
4. The server key used by account deletion must only be configured through
   Worker secrets — never put it in browser code.

## Notes

- This repository is the development source packaged on 2026-11-18. Configuration
  values and the admin identity are placeholders; no environment credentials and
  no user, reservation, or inventory data are included.
- Images, video, and documents keep their original usage permissions.
