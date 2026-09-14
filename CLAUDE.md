# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

Singarika CMS — catalogue, stock and blog manager for a **Nepali** ethnic wear store, plus a
read-only JSON API (`/api/v1/*`) that the separate public storefront consumes. Next.js 16 App
Router · PostgreSQL · Prisma 7 · NextAuth v5 · Cloudinary · Tailwind v4.

Nepal, not India: prices are Nepali rupees (`NPR`, rendered `रु`), sales tax is **VAT at 13%**
(not GST), dates render in `Asia/Kathmandu`, and product vocabulary is Nepali (Dhaka, pashmina,
allo; Dashain, Tihar, Teej, bihe). Keep new copy and seed data consistent with that.

## Commands

```bash
npm run dev                # Next dev server (Turbopack)
npm run build              # production build — the only full typecheck+lint gate
npm run lint               # eslint
npx tsc --noEmit           # typecheck alone

npm run db:migrate         # create + apply a dev migration
npm run db:deploy          # apply migrations in production
npm run db:push            # schema → database without a migration file
npm run db:seed            # admin user, Nepali category tree, one demo product
npm run db:studio          # Prisma Studio
npm run db:generate        # regenerate the client into src/generated/prisma
```

There is no test framework in this repo — no test runner, script, or test files. Verify changes
with `npx tsc --noEmit`, `npm run lint`, `npm run build`, and by exercising routes against a
running database.

`.env` needs `DATABASE_URL`, `AUTH_SECRET`, the three `CLOUDINARY_*` keys, and
`PUBLIC_API_CORS_ORIGIN`. Cloudinary uploads are the one path that cannot be exercised without
real credentials.

## Architecture

### Two APIs with different contracts

- **`/api/admin/*`** — session-authenticated CRUD. Every handler opens with
  `const guard = await requireUser(); if ("response" in guard) return guard.response;`
  (`src/lib/guard.ts`; pass `"ADMIN"` for admin-only routes). Responses go through `ok` /
  `fail` / `paginated` / `handleError` in `src/lib/api.ts` — `handleError` is the single place
  Zod and Prisma errors become status codes (P2002 → 409, P2025 → 404).
- **`/api/v1/*`** — unauthenticated, CORS-enabled, edge-cached. Responses go through
  `publicJson` / `publicError` / `corsPreflight` in `src/lib/public-response.ts`. Shapes are
  defined **only** in `src/lib/public-serialize.ts` — that file is the storefront's contract,
  so the database schema can change underneath it. Prices are converted to rupees there and
  only `ACTIVE` products / `PUBLISHED` posts are ever exposed.

Auth is split: `src/auth.config.ts` is the edge-safe half (no Prisma/bcrypt) consumed by
`src/proxy.ts` — **Next 16 renamed the `middleware` convention to `proxy`**. Providers live in
`src/auth.ts`. The `authorized` callback lets `/api/admin` through so those routes answer 401
JSON from their own guard instead of redirecting to the login page.

### Invariants worth knowing before editing

**Money is integer paisa.** `src/lib/money.ts` converts at the edges — forms and the public API
speak rupees, the database never sees a float. Use `rupeesToPaisa` / `paisaToRupees`, and
`formatNPR` for display.

**Stock only moves through the ledger.** `adjustStock` in `src/lib/services/inventory.ts`
updates the variant and writes a `StockMovement` row in one transaction, refusing to go negative
unless the variant allows backorders. Never write `variant.stock` directly. The product editor
deliberately renders existing variant stock as read-only so no change can bypass this.

**PATCH bodies are partial for real.** `toUpdateSchema` in `src/lib/validation/index.ts` strips
Zod `.default()` before making fields optional — without it, `PATCH { "status": "ACTIVE" }`
would reset tags, categories, images and tax rate to their create-time defaults. Build every
update schema with it, and have services apply only keys that are `!== undefined`.

**Prisma 7 conventions.** The connection URL lives in `prisma.config.ts`, not `schema.prisma`.
The client is generated to `src/generated/prisma` (import from `@/generated/prisma/client`) and
driven through `@prisma/adapter-pg`. Treat `src/generated/` as build output — never edit it.

### UI system

Design tokens are defined in `src/app/globals.css` inside `@theme` — **not `@theme inline`**.
The indirection of `@theme inline` silently drops opacity modifiers (`bg-ink/50` renders fully
opaque), which breaks modal backdrops. Keep literal values in `@theme` and reference them from
raw CSS as `var(--color-*)`.

Palette: Dhaka-weave indigo `--color-primary` carries every action, sindoor crimson
`--color-crimson` is the brand mark and destructive actions only, `--color-rail` is the
navigation rail. The `.dhaka-edge` woven stripe is the app's one ornament.

`src/components/ui.tsx` holds the shared primitives (`Section`, `PageHeader`, `Button`,
`Field`, `Input`, `MoneyInput`, `Badge`, `Notice`, `TableShell`, `EmptyState`). It has no
`"use client"` directive and `Field`/`Checkbox` call `useId`, so those two may only be rendered
from client components. Build forms out of `Field`, which wires label to control via a render
prop; don't hand-roll inputs.

Editor screens (`product-form.tsx`, `post-form.tsx`) put status and Save in one sticky bar at
the top of the form rather than in a sidebar card.

### Interface copy

Write for a shopkeeper, not the schema: "Stock" not "Inventory", "Photos" not "Media", "New
stock arrived" not `PURCHASE`. Buttons name their outcome ("Add 3 to stock", "Save changes").
Errors state what happened and don't apologise. Empty states say what to do next.
