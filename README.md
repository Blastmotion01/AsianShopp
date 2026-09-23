# AsiaShop

Online store for imported sweets, drinks, snacks and food from 🇰🇷 Korea, 🇯🇵 Japan, 🇨🇳 China and 🇺🇸 the USA.
Based in Dnipro, Ukraine · currency UAH (₴) · languages **uk** (default), **ru**, **en**.

It's a full-stack Next.js app: storefront, cart, checkout, customer accounts and an admin panel,
all backed by PostgreSQL.

---

## 1. Requirements

| Tool | Version |
|---|---|
| Node.js | 20.9+ (tested on 24) |
| npm | 10+ |
| PostgreSQL | 14+ (**optional for local dev**: `npm run db:local` starts an embedded PostgreSQL) |

## 2. Installation

```bash
npm install
```

npm 11 blocks dependency install scripts by default. If `npm install` warns about them, approve the ones the
project needs (Prisma engines, esbuild, the embedded PostgreSQL binaries):

```bash
npm install-scripts approve @prisma/client @prisma/engines prisma esbuild unrs-resolver @swc/core @embedded-postgres/windows-x64
```

(Use the `@embedded-postgres/<your-platform>` package that `npm install-scripts ls` shows.)

## 3. Environment variables

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | ≥ 32 random chars. Signs the guest cookie and the mock payment webhook. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public origin, e.g. `https://asiashop.ua`. Used for canonical URLs, sitemap, payment return URLs |
| `DATABASE_URL_UNPOOLED` | ✅ | Direct DB connection for migrations (locally the same as `DATABASE_URL`; set automatically by Neon on Vercel) |
| `STORAGE_PROVIDER` | – | `local` or `vercel-blob`. Leave empty to auto-select: Blob when `BLOB_READ_WRITE_TOKEN` is set |
| `BLOB_READ_WRITE_TOKEN` | – | Vercel Blob token (set automatically when a Blob store is connected) |
| `STORAGE_URL` | – | Public base URL of uploads (`/uploads` for local) |
| `STORAGE_LOCAL_DIR` | – | Upload directory for local storage (`storage/uploads`) |
| `PAYMENT_PROVIDER` | – | `mock` (implemented). See [Payments](#payment-architecture) |
| `NOTIFIER` | – | `console` (implemented: emails/notifications are logged to the server console) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | seed | Creates the first admin. The password is never stored in source, only as a bcrypt hash |

Only `NEXT_PUBLIC_APP_URL` is exposed to the browser. All other variables are server-only (validated in `src/lib/env.ts`).

## 4. Database setup

**Option A: no PostgreSQL installed (local dev).** Run this in a separate terminal and keep it running:

```bash
npm run db:local
```

It starts PostgreSQL 18 on port **5433** with data in `./.local-db`, using UTF-8, and creates the `asiashop` database.
The default `DATABASE_URL` in `.env.example` already points at it.

**Option B: your own PostgreSQL.** Create a database and set `DATABASE_URL`.

## 5. Prisma migrations

```bash
npm run db:migrate      # dev: apply migrations + regenerate client
npm run db:deploy       # production: apply pending migrations only
npm run db:studio       # browse data
```

## 6. Seed

```bash
npm run db:seed         # idempotent: safe to re-run
npm run db:reset        # drop everything, re-migrate and re-seed
```

The seed creates:
- roles: `CUSTOMER`, `ADMIN`, plus example staff roles `MANAGER`, `CONTENT_MANAGER`, `WAREHOUSE`
- the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- 4 countries and 9 categories, including Mystery Box
- **30 products** (Korea 8, Japan 8, China 7, USA 7) and **5 Mystery Boxes**, with uk/ru/en content, variants, stock and nutrition
- illustrated SVG placeholders instead of photos. They're clearly marked "Illustration" on the site; replace them with real photos in the admin
- sample reviews, promo codes `WELCOME10` (−10%, min 300 ₴), `DNIPRO50` (−50 ₴, min 500 ₴), `SPICY15`
- CMS homepage blocks and store settings
- 48 demo orders over the last 60 days, so the dashboard has data. Demo customers get random passwords and can't log in

## 7. Development

```bash
npm run db:local        # terminal 1 (if you use the embedded DB)
npm run dev             # terminal 2 → http://localhost:3000
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm test                # unit tests + DB integration tests (the latter skip when DATABASE_URL is unset)
```

## 8. Production build

```bash
npm run db:deploy
npm run build
npm start
```

The build prerenders the homepage, Mystery Box and Snack Match for each locale. **It needs a reachable database.**
Storefront pages use ISR (5 min) and are revalidated right away when admins change products, stock, reviews or CMS content.

## 9. Admin login

1. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (≥ 10 chars) in `.env`, then run `npm run db:seed`, **or** run
   ```bash
   npm run admin:create -- you@example.com "a-long-password" "Your name"
   ```
   This creates or promotes the user to ADMIN and resets the password. It also signs out that account's existing sessions.
2. Sign in at `/login`, then open `/admin`.

Non-admins who open `/admin` get a 404. Signed-out users are redirected to login.

## 10. Deployment

### Vercel + GitHub (recommended)

1. Push the repo to GitHub (private is fine). `.env`, `.local-db` and `storage/uploads` are git-ignored.
2. vercel.com → **Add New → Project → Import** the GitHub repo. Framework: Next.js (auto-detected).
3. In the Vercel project → **Storage**:
   - **Neon (Postgres)** → *Connect*. It sets `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct, used by migrations).
   - **Blob** → *Connect*. It sets `BLOB_READ_WRITE_TOKEN`, and admin photo uploads go to Vercel Blob automatically.
4. **Settings → Environment Variables:** `AUTH_SECRET` (new random value), `NEXT_PUBLIC_APP_URL` (e.g. `https://asiashop.vercel.app`), `PAYMENT_PROVIDER=mock`.
5. **Deploy.** Vercel runs `npm run vercel-build` = `prisma generate && prisma migrate deploy && next build`, so tables are created or updated on every deploy.
6. Fill the cloud database once from your machine, with `DATABASE_URL` / `DATABASE_URL_UNPOOLED` pointing at Neon:
   `npx prisma db seed`, then `npm run admin:create -- you@example.com "long-password" "Name"`.
7. After that, every `git push` to `main` deploys automatically.

Product placeholders are generated on the fly by `/placeholders/<slug>.svg`, so they need no file storage.

### Other hosts

Works on any Node host (Render, Fly.io, a VPS with PM2/Docker, …):

1. Provision PostgreSQL and set all env vars. `AUTH_SECRET` must be unique per environment.
2. `npm ci && npm run db:deploy && npm run build && npm start`
3. Create the first admin with `npm run admin:create`.
4. **Uploads:** the `local` storage provider writes to disk. That's fine on a VPS with a persistent volume. On
   serverless or multi-instance hosting, implement the Cloudinary/S3 provider first (see below).
5. **Rate limiting** is in-memory per instance. With several instances, back it with Redis/Upstash (`src/lib/rate-limit.ts`).
6. Put the app behind HTTPS. Cookies are `Secure` in production.

---

## Project structure

```
prisma/
  schema.prisma          relational model (see below)
  seed.ts, seed-data.ts  demo catalog
scripts/
  local-db.ts            embedded PostgreSQL for dev
  create-admin.ts        create/promote admin
messages/{uk,ru,en}.json all UI strings (key parity is tested)
src/
  app/
    [locale]/(shop)/     storefront routes (header/footer layout)
    [locale]/admin/      admin routes (own layout, server-side auth)
    api/                 REST route handlers (cart, wishlist, search, session, payment webhooks)
    uploads/[...path]    serves local uploads
    robots.ts, sitemap.ts, icon.svg
  proxy.ts               locale routing + optimistic auth redirect (Next 16 "middleware")
  components/            ui/ (design-system primitives), layout/, brand/, product/, motion/
  features/              domain modules, each with services / schemas / actions / components
    products  cart  wishlist  orders  promo  auth  account  reviews
    snack-match  cms  home  store (client store)  admin/{products,inventory,orders,promocodes,cms}
  lib/
    auth/                password hashing, sessions, guest cookie, permissions, guards
    integrations/        payments/, delivery/, storage/, notifications/ (provider interfaces)
    db.ts env.ts errors.ts money.ts rate-limit.ts localized.ts placeholder-art.ts
  i18n/                  next-intl routing/navigation/request config
  config/site.ts         locales, cookie names, constants
  styles/globals.css     design tokens (Tailwind v4 @theme)
tests/                   Vitest: unit + integration
```

Database access stays in services (`features/*/service.ts`, `queries.ts`). UI components never import Prisma.

## Database schema

`Role` (permissions[]) → `User` → `Session`, `PasswordResetToken`, `Address`, `Cart`, `Wishlist`, `Review`, `Order`, `AdminLog`
`Country`, `Category` (tree), `Brand` → `Product` → `ProductTranslation` (uk/ru/en), `ProductImage`, `ProductVariant` → `Inventory`
`Cart` → `CartItem` (per variant) · `Wishlist` → `WishlistItem` (a cart or wishlist belongs to a user **or** a signed guest id)
`Order` → `OrderItem` (name/price/image snapshots), `OrderEvent` (status history), `Payment` (provider transactions)
`PromoCode` → `PromoCodeUsage` (one per order) · `ContentBlock` (CMS) · `Setting` (store settings)

Money is stored as integer kopiykas (`12900` = 129 ₴). Localized reference data (`Category.name`, `Country.name`, CMS)
uses `{uk, ru, en}` JSON; product content uses the `ProductTranslation` table so it can be searched.

## Routes

Storefront (the uk locale has no prefix, e.g. `/products`; others do: `/en/products`, `/ru/products`):

| Route | |
|---|---|
| `/` | storytelling homepage (blocks editable in CMS) |
| `/products` | catalog: search, filters, sorting, pagination (all in the URL) |
| `/products/[slug]` | product page with JSON-LD, OG image, reviews, similar products |
| `/snack-match` | 5-question quiz with rule-based matching |
| `/mystery-box` | Mystery Box landing |
| `/wishlist` | wishlist (works for guests too) |
| `/checkout` · `/checkout/pay/[ref]` · `/checkout/success/[orderId]` | checkout, mock payment page, confirmation |
| `/login` `/register` `/forgot-password` `/reset-password` | auth |
| `/account` · `/account/orders[/id]` · `/account/addresses` | customer area |

Admin: `/admin` (dashboard) · `/admin/products` · `/admin/products/new` · `/admin/products/[id]` · `/admin/inventory` ·
`/admin/orders[/id]` · `/admin/customers` · `/admin/promocodes` · `/admin/cms` · `/admin/logs`

## API structure

| Method & path | |
|---|---|
| `GET /api/cart?locale=` | current cart with totals, promo and free-shipping progress |
| `POST /api/cart` `{variantId, quantity}` | add (clamped to stock) |
| `PATCH /api/cart` `{variantId, quantity}` | set quantity (0 removes it) |
| `POST /api/cart/promo` `{code}` · `DELETE /api/cart/promo` | apply / remove promo |
| `GET /api/wishlist` · `POST /api/wishlist` `{productId}` | list / toggle |
| `GET /api/search?q=&locale=` | autocomplete |
| `GET /api/session` | public view of the current user |
| `POST /api/payments/:provider/webhook` | payment provider callbacks (signature-verified) |

Mutating JSON endpoints check Origin and Content-Type (CSRF) and are rate-limited. Forms (auth, checkout, reviews,
all admin operations) use **Server Actions**. Each one validates input with Zod and checks permissions on the server.

## Authentication flow

- Passwords are hashed with **bcrypt (12 rounds)**. Login runs in constant time for unknown emails and is rate-limited.
- A session is a random 256-bit token in an `httpOnly`, `SameSite=Lax` cookie (`Secure` in production). The DB stores
  only its **SHA-256 hash** and the expiry (30 days).
- Guests get a **signed** (HMAC) `as_guest` cookie that owns their cart and wishlist. On login or sign-up, both are merged
  into the user's.
- Password reset: a one-time hashed token valid for 60 minutes. The same response is returned whether or not the email
  exists, and all sessions are revoked after the reset. **The email is currently logged to the server console** (see the notifier).
- Authorization is **permission-based**: `Role.permissions[]`, where `*` means everything. `proxy.ts` only does an optimistic
  cookie check. The real checks are `requireAdminPage()` in admin layouts and pages and `requirePermission()` in every admin action.
  Adding `MANAGER` / `CONTENT_MANAGER` / `WAREHOUSE` staff only takes assigning their role (the seed already defines them).

## Payment architecture

```
checkout → createOrder() → startPayment() → PaymentProvider.createPayment() → redirect
provider → POST /api/payments/:id/webhook → PaymentProvider.parseWebhook() (verifies signature) → applyPaymentStatus()
```

- Interface: `src/lib/integrations/payments/types.ts`. Registry: `…/payments/index.ts`.
- **`MockPaymentProvider` (current).** It redirects to `/checkout/pay/[ref]`, a page clearly labelled *Test mode* where you
  simulate success or failure. That page sends a signed payload through the same `parseWebhook → applyPaymentStatus` path
  a real provider uses. No real money moves.
- Adding LiqPay / WayForPay / Monobank / NovaPay / Stripe: create one class implementing `PaymentProvider`, register it,
  and set `PAYMENT_PROVIDER`. Checkout doesn't change. `applyPaymentStatus` is idempotent and never downgrades a PAID payment.
- Cash on delivery needs no provider. The order is marked PAID when an admin sets it to DELIVERED.

## Other integration points (interfaces ready, implementations pending)

| Area | Where | Now |
|---|---|---|
| Delivery (Nova Poshta, Ukrposhta, Meest) | `lib/integrations/delivery` | static fees; branch typed manually |
| Storage (Cloudinary, S3, Supabase) | `lib/integrations/storage` | local disk |
| Email / SMS / Telegram | `lib/integrations/notifications` | console logger |
| Analytics (GA, Meta Pixel) | root layout | not included |

## What is mocked / known limitations

- **Payments:** the mock provider only, marked "Test mode" in the UI.
- **Emails:** password-reset links and order notifications are printed to the server log, not sent.
- **Product photos:** illustrated SVG placeholders, labelled as illustrations. Upload real photos in the admin.
- **Nova Poshta:** no branch lookup or delivery-cost API yet. Fees are flat (80 ₴ branch, 120 ₴ courier, 90 ₴ Dnipro courier,
  pickup free, free above the CMS threshold).
- Rate limiting is in-memory per instance, and local uploads need persistent disk.
- Search uses PostgreSQL `ILIKE`. That's fine for hundreds of products; add full-text or trigram indexes (or Meilisearch) as the catalog grows.

## Tests

`npm test` runs 43 tests:
- unit: promo rules, cart pricing and free delivery, order status transitions, checkout validation, product input
  validation, password hashing, signed cookies, open-redirect protection, permissions, Snack Match scoring, i18n key parity
- integration (real DB): create a product → guest cart (stock clamping) → promo → order (atomic stock decrement, promo
  usage, cart cleared) → oversell and promo-limit protection → cancel (stock and promo restored) → online payment and
  idempotent webhook → admin authorization for anonymous and customer users
