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

The schema (`prisma/schema.prisma`) models Buyer, Category, Supplier, Product, RFQ, Quote, Order, OrderStep and SavedSupplier — derived from the design prototype's sample data. Run `npx prisma migrate dev` after setting `DATABASE_URL` to create the tables, then `npx prisma db seed` to load sample catalog data (this is the "admin-seeded" stopgap for Category/Supplier/Product until a real seller dashboard exists — see Phase "Seller Dashboard" in `docs/dev-plan.md`).

### Buyer identity (stopgap ahead of real auth)

Phase 1 (real mobile-OTP auth) hasn't been built yet, but Phase 4 (RFQs) needs to know who's asking. `lib/session.ts` implements a minimal stopgap: a name/phone/company form (`identifyAndContinue` in `app/rfq/actions.ts`) that upserts a `Buyer` row and sets a signed session cookie — no OTP verification yet. Requires a `SESSION_SECRET` env var (see `.env.example` for how to generate one). This cookie shape is designed to carry over unchanged once Phase 1 adds real OTP verification in front of it.

### Quotes (stopgap ahead of a seller dashboard)

There's no seller-side app yet, so quotes against an RFQ are entered through an internal, unauthenticated tool at `/rfq/[id]/quotes/new` — acting on a supplier's behalf. It's clearly marked "not for production" in the UI; a real Seller Dashboard phase replaces it.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npx prisma studio` — browse the database
