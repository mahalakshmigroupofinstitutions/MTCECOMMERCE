# NextGen — B2B Marketplace

Buyer-side B2B marketplace web app (RFQ/quote-negotiation model), built from the NextGen design prototype. See `docs/dev-plan.md` for the full phase-by-phase roadmap.

## Stack

- Next.js (App Router, TypeScript, Tailwind CSS v4)
- Prisma + PostgreSQL

## Getting started

```bash
npm install
cp .env.example .env   # then fill in a real DATABASE_URL
npx prisma migrate dev # applies prisma/schema.prisma to your database
npx prisma db seed     # loads sample categories/suppliers/products (prisma/seed.ts)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database

`DATABASE_URL` in `.env` must point at a real PostgreSQL instance — none is provisioned in this repo. Options:

- Local: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16`, then `DATABASE_URL="postgresql://postgres:password@localhost:5432/nextgen?schema=public"`.
- Managed (recommended for staging/prod): Supabase or Neon — copy their connection string into `DATABASE_URL`.

The schema (`prisma/schema.prisma`) models Buyer, Category, Supplier, Product, RFQ, Quote, Order, OrderStep and SavedSupplier — derived from the design prototype's sample data. Run `npx prisma migrate dev` after setting `DATABASE_URL` to create the tables, then `npx prisma db seed` to load sample categories/suppliers/products as a starting catalog (categories are still admin/seed-only; suppliers and their products can also be created and managed by vendors themselves — see "Vendor portal" below).

### Buyer identity (stopgap ahead of real auth)

Phase 1 (real mobile-OTP auth) hasn't been built yet, but Phase 4 (RFQs) needs to know who's asking. `lib/session.ts` implements a minimal stopgap with a Register/Log in split (`app/(buyer)/register` and `app/(buyer)/login`, backed by `registerBuyer`/`loginBuyer`/`logoutBuyer` in `app/(buyer)/account/actions.ts`): registration captures name/phone/company/GST/city and upserts a `Buyer`, login finds an existing `Buyer` by phone (bouncing unknown numbers to register), and both set a signed session cookie — no OTP verification yet. Requires a `SESSION_SECRET` env var (see `.env.example` for how to generate one). This cookie shape is designed to carry over unchanged once Phase 1 adds real OTP verification in front of it. The signing helpers live in `lib/signedCookie.ts`, shared with the vendor session below.

### Vendor portal (`/vendor`)

A separate self-service portal for suppliers, using the same phone-based stopgap pattern (`lib/vendorSession.ts`, its own `nx_vendor` cookie — one browser can hold a buyer session and a vendor session at the same time). Logging in with a phone number matching one of the seeded suppliers logs into that record as-is; any other phone number creates a new, unverified `Supplier`.

- `/vendor/rfqs` — inbox of RFQs relevant to the vendor's own products/categories; submit a quote from `/vendor/rfqs/[id]`.
- `/vendor/products` — add/edit/delete the vendor's own product listings (specs and bulk price tiers are entered as plain `Key: Value` / `range | price` lines, parsed server-side).
- `/vendor/orders` — the vendor advances their own orders through "In Production" → "Shipped".

### Order tracking (stopgap ahead of Razorpay)

Accepting a quote (`lib/rfq.ts`'s `acceptQuote`) creates an `Order` plus its 5-step `OrderStep` timeline (Confirmed → Payment Received → In Production → Shipped → Delivered). Each step is now controlled by whoever would realistically trigger it: the vendor advances "In Production"/"Shipped" from `/vendor/orders/[id]`; the buyer's `/orders/[id]` has an internal "Mark payment received" button standing in for a future Razorpay webhook, and a "Confirm delivery" button once the order has shipped. Both are clearly marked "not for production" in the UI.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx prisma studio` — browse the database
