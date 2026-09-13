# Singarika CMS

Catalogue, inventory and blog manager for the Singarika ethnic wear store, with a
read-only JSON API that the public storefront consumes.

**Stack:** Next.js 16 (App Router) · PostgreSQL · Prisma 7 · Cloudinary · NextAuth v5 · Tailwind v4

---

## Getting started

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL + Cloudinary keys
openssl rand -base64 32       # paste into AUTH_SECRET

npm run db:migrate            # create the schema
npm run db:seed               # admin user, category tree, one demo product
npm run dev
```

Sign in at `/login` with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`.
**Change that password immediately in production.**

### Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | NextAuth session signing key |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Image uploads |
| `CLOUDINARY_FOLDER` | Root folder for assets (default `singarika`) |
| `PUBLIC_API_CORS_ORIGIN` | Storefront origin; `*` in development |

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js (Turbopack by default in 16) |
| `npm run db:migrate` | Create and apply a dev migration |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed admin, categories, demo product |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | ESLint |

---

## Admin app

| Route | Purpose |
| --- | --- |
| `/dashboard` | Counts, low-stock list, recent stock movements |
| `/products`, `/products/[id]` | Catalogue with variants, images, attributes, SEO |
| `/categories` | Two-level tree (Sarees › Kanjivaram Silk) |
| `/inventory` | Stock adjustments and the full ledger |
| `/blog`, `/blog/[id]` | Rich-text posts, blog categories, tags |
| `/media` | Cloudinary library with alt text |
| `/users` | Admin-only user management |

Roles: **ADMIN** (everything, including users) and **EDITOR** (everything else).

---

## Public API — `/api/v1/*`

Unauthenticated, CORS-enabled, cached at the edge
(`s-maxage=60, stale-while-revalidate=300`; 300/900 for categories and facets).
Prices are returned in **rupees**; only `ACTIVE` products and `PUBLISHED` posts
are ever exposed.

### Products

```http
GET /api/v1/products
```

| Query param | Notes |
| --- | --- |
| `category` | Slug. Passing a parent also returns its children's products. |
| `fabric`, `occasion`, `color`, `tag` | Repeatable or comma-separated |
| `minPrice`, `maxPrice` | In rupees |
| `inStock=true`, `featured=true` | Flags |
| `q` | Searches name, short description, fabric, work type |
| `sort` | `newest` (default), `oldest`, `price-asc`, `price-desc`, `name`, `featured` |
| `page`, `perPage` | `perPage` max 60 |

```http
GET /api/v1/products/:slug     # full detail + `related` products
GET /api/v1/filters            # facet values with counts + price range
```

Each product carries `priceRange`, `inStock`, the ethnic-wear attributes, and
images pre-sized by Cloudinary (`thumb` 400×600, `card` 800×1200, `full` 1600w).

### Categories & blog

```http
GET /api/v1/categories          # active tree, two levels
GET /api/v1/categories/:slug    # detail + breadcrumb + children
GET /api/v1/posts               # ?category= &tag= &q= &page= &perPage=
GET /api/v1/posts/:slug         # full HTML content + `related`
GET /api/v1/blog-categories     # categories that have published posts
```

### Live stock check

```http
POST /api/v1/inventory
{ "skus": ["SAR-KJV-RED-FS"] }
```

Returns `{ sku, available, inStock }` per SKU, uncached. **Call this at checkout** —
the stock values on the product endpoints are cached and can be stale.

### Response shape

```jsonc
{ "data": [ /* ... */ ], "meta": { "page": 1, "perPage": 24, "total": 2, "totalPages": 1 } }
{ "error": { "message": "Product not found" } }
```

---

## Admin API — `/api/admin/*`

Session-authenticated; returns `401` JSON when signed out. CRUD for
`products`, `categories`, `posts`, `blog-categories`, `media`, `users`, plus:

```http
GET  /api/admin/stats                      # dashboard figures
GET  /api/admin/inventory                  # ?q= &lowStock=true
POST /api/admin/inventory                  # signed delta; ?mode=set for a stock take
GET  /api/admin/inventory/movements        # ledger, ?variantId= or ?productId=
```

---

## Design notes

**Money is stored as integer paise.** `src/lib/money.ts` converts at the edges —
forms and the public API speak rupees, the database never sees a float.

**Stock only moves through the ledger.** `adjustStock` updates the variant and
writes a `StockMovement` row in one transaction, refusing to go negative unless
the variant allows backorders. The product editor deliberately shows existing
variant stock as read-only so no change can bypass the ledger.

**PATCH bodies are partial for real.** `toUpdateSchema` in
`src/lib/validation/index.ts` strips Zod `.default()` before making fields
optional — without it, `PATCH { "status": "ACTIVE" }` would reset tags,
categories, images and tax rate to their create-time defaults.

**Public JSON is a stable contract.** `src/lib/public-serialize.ts` is the single
place the storefront's shape is defined, so the schema can change underneath it.

**Prisma 7 / Next 16 conventions.** The connection URL lives in
`prisma.config.ts` (not the schema) and the client is generated to
`src/generated/prisma` and driven through `@prisma/adapter-pg`. Request
interception is `src/proxy.ts` — Next 16 renamed the `middleware` convention to
`proxy`.

## Not yet wired

- Orders and customers — the storefront is read-only today; `RESERVATION` /
  `RELEASE` ledger reasons and `reservedStock` are in place for when checkout lands.
- Cloudinary uploads need real credentials to exercise; every other path is verified.
