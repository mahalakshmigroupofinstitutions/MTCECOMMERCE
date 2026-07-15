# NextGen — B2B Marketplace: Phase-by-Phase Development Plan

## Context

`NextGen.zip` contains a **click-through design prototype**, not a real app — a single HTML page loading React 18 + Babel from a CDN, no build step, no package.json, no backend. It renders the same 8-screen buyer journey twice (once as a mobile-app layout in `mobile.jsx`, once as a desktop layout in `web.jsx`): **Home → Search → Supplier profile → Product detail → RFQ form → RFQ confirmation → Compare quotes → Order tracking**. All data (categories, suppliers, products, quotes, the one sample order) is hardcoded in `data.js`.

The prototype's own embedded chat history (`ai_chat.json`) shows the *original* brief asked for more than what got built: splash/OTP onboarding, in-app chat with WhatsApp handoff, a quote accept/reject dashboard, and a buyer profile/account section (saved suppliers, RFQ history) — none of which exist in the delivered screens. There's also no seller-side app and no admin panel anywhere; supplier/product data is entirely hardcoded.

The working directory (`D:\NewSource\MTCECOMMERCE`) is empty — this is a greenfield build. The goal is to turn the validated buyer-journey design into a real, database-backed product, phase by phase, reusing the prototype's screen flow and data shapes as the starting point.

**Confirmed scope for this plan** (decided with the user):
- Buyer-side MVP first. Seller dashboard and admin panel are later phases; suppliers/products are admin-seeded for now.
- One responsive Next.js web app (collapses the prototype's duplicated mobile/web layouts into one codebase). Native mobile app is a later phase.
- Recommended stack: Next.js (React + TypeScript), Prisma + PostgreSQL, OTP-based phone auth, Razorpay for payment, WhatsApp (`wa.me` links first, Business API later).
- Commerce model stays RFQ/quote-negotiation only — no shopping cart/fixed-price checkout.

---

## Phase 0 — Project Foundation

- Scaffold a Next.js (TypeScript) app in this repo; deploy to a staging URL immediately (e.g. Vercel) so every later phase is demoable.
- Provision PostgreSQL (managed: Supabase/Neon/RDS) with Prisma as the ORM (schema-as-code + migrations).
- Port the prototype's design system into real components: colors (#E8590C accent, black/white), fonts (Manrope + JetBrains Mono), and the shared atoms from `ui.jsx` (`Ph`, `Stars`, `VBadge`, `Chip`, `Btn`, `Metric`) rebuilt as typed React components. Carry over the icon set from `icons.jsx`.
- Build one responsive layout shell (breakpoint-based) replacing the prototype's separate `mobile.jsx` / `web.jsx` duplication — this is the key architectural simplification vs. the prototype.
- Basic CI: build + typecheck on push.

*Nothing depends on anything before this; everything else depends on this.*

## Phase 1 — Auth & Onboarding

- Splash/intro screens (requested originally, never built).
- Mobile-OTP signup/login (phone number → SMS OTP → session) via an India-friendly provider (e.g. MSG91, Twilio Verify).
- `Buyer` table: phone, name, company name, GST number (validated format), city.
- Session handling (NextAuth with a custom OTP provider, or lightweight JWT).

*Depends on Phase 0. Every later feature that "remembers" a buyer (RFQs, saved suppliers, orders) depends on this.*

## Phase 2 — Catalog & Search

- Real DB tables replacing `data.js`'s `CATEGORIES` / `SUPPLIERS` / `PRODUCTS` arrays:
  - `Category` (id, name, icon)
  - `Supplier` (id, name, trustScore, verified, gstNumber, responseTime, deliveryPercent, tags[], city)
  - `Product` (id, supplierId FK, categoryId FK, moq, bulkPriceTiers as jsonb, specs as jsonb) — jsonb for specs/price-tiers because they vary a lot by category (steel vs. textiles vs. packaging); avoids a rigid-schema fight this early.
- Home screen (category grid, featured suppliers) and Search/discovery screen (filters: category, verified-only, city, response time, price) — both reuse the prototype's UI, now data-driven.
- A minimal internal seed/admin form to load suppliers/products (intentional stopgap — full seller self-service comes later).

*Depends on Phase 0. Independent of Phase 1 (browsing can be anonymous). RFQ (Phase 4) and profile (Phase 7) depend on this catalog existing.*

## Phase 3 — Supplier Profile & Product Detail

- Supplier profile screen (trust score, verified badge, GST, response/delivery stats, product list) and product detail screen (MOQ, bulk price tiers, specs) — near 1:1 port of the prototype screens onto real data.
- "WhatsApp this supplier" CTA as a `wa.me` deep link (cheap first version; full chat in Phase 6).

*Depends on Phase 2.*

## Phase 4 — RFQ Creation, Quote Comparison & Acceptance

The commercial core of the product.

- RFQ form (quantity, specs/notes, target delivery) and RFQ confirmation screen, as in the prototype.
- `RFQ` (id, buyerId FK, productId/categoryId, quantity, notes, targetDeliveryDate, status) and `Quote` (id, rfqId FK, supplierId FK, price, priceTiers, deliveryEstimate, status, validUntil) tables.
- Quote inbox + compare-quotes screen (price, delivery, trust score side-by-side), reused from the prototype.
- **New vs. prototype:** Accept/Reject actions on a quote (in the original brief, never built). Accepting a quote is what creates an `Order` (Phase 5).
- For MVP, quotes are entered by an internal/admin tool on the supplier's behalf (no seller dashboard yet) — same stopgap pattern as Phase 2's seeding.
- No cart/checkout: the order is created directly from an accepted quote, keeping the model negotiation-first as confirmed.

*Depends on Phase 2 (products/suppliers to quote against) and Phase 1 (buyer identity).*

## Phase 5 — Order Creation & Tracking

- Accepting a quote auto-creates an `Order` (id, rfqId/quoteId FK, buyerId FK, supplierId FK, status enum, paymentStatus, razorpayOrderId, per-step timestamps).
- Order tracking screen reusing the prototype's 5-step timeline (Confirmed → Payment Received → In Production → Shipped → Delivered).
- Razorpay integration for the advance/deposit payment tied to "Payment Received" — keep it narrow: one deposit charge per order, webhook-driven status update, no split-payment logic yet.
- Order status advances for MVP are admin/internal-triggered (same stopgap as Phase 4).

*Depends on Phase 4. Flag Razorpay KYC/approval as an external dependency to start during Phase 2–3 — gateway approval can take days.*

## Phase 6 — Chat / WhatsApp Handoff

- In-app chat thread per RFQ/order (text, timestamps, read state).
- Upgrade the Phase 3 `wa.me` stub to carry RFQ/product context; treat full WhatsApp Business API as a fast-follow once there's real usage to justify onboarding.

*Depends on Phase 3 and Phase 4. Not a hard launch blocker — Phase 3's `wa.me` link alone covers a minimal version, so this can ship after Phase 5 if timeline is tight.*

## Phase 7 — Buyer Profile / Account

- Profile/account screen (requested originally, never built): saved suppliers (bookmarking), RFQ history, account settings (name, company, GST, city, phone).
- Bottom-tab "Account" destination on mobile layout, matching the prototype's tab bar.
- `SavedSupplier` (buyerId FK, supplierId FK) join table; RFQ history queries the existing `RFQ` table by buyerId.

*Depends on Phases 1, 2, and 4 — naturally last since it's a rollup view of everything else.*

---

## Sequencing at a Glance

```
Phase 0 (Foundation)
   ├─▶ Phase 1 (Auth/OTP)
   └─▶ Phase 2 (Catalog/Search)
              │
              ▼
        Phase 3 (Supplier/Product Detail)
              │
              ▼
        Phase 4 (RFQ + Quotes + Accept)
              │
              ▼
        Phase 5 (Order + Razorpay Payment)
              │
      ┌───────┴───────┐
      ▼               ▼
Phase 6 (Chat)   Phase 7 (Profile/Account)
```

Phases 0–5 are the true critical path (a buyer can sign up, find a supplier, request a quote, accept it, pay a deposit, and track the order). Phases 6 and 7 can run in parallel with each other and can slip slightly past a soft launch if needed.

## Later Phases (out of MVP scope)

- **Seller Dashboard** — self-service listing management and direct RFQ/quote responses, replacing the admin-seeding stopgaps in Phases 2, 4, 5. Biggest unlock after MVP.
- **Admin Panel** — supplier verification/approval, dispute handling, analytics.
- **Native Mobile App** — React Native rebuild reusing the web app's API layer and TypeScript types.
- **Payments Hardening** — split/milestone payments, refunds, GST-compliant invoicing, escrow-style holds.

## Critical Files (once implementation starts)

- `prisma/schema.prisma` — DB shape derived from `data.js` (Buyer, Category, Supplier, Product, RFQ, Quote, Order)
- `app/layout.tsx` — responsive shell replacing the prototype's `mobile.jsx`/`web.jsx` split
- `components/ui/*` — typed rebuilds of the prototype's `ui.jsx` atoms (Ph, Stars, VBadge, Chip, Btn, Metric)
- `lib/auth.ts` (or `app/api/auth/*`) — OTP auth/session logic (Phase 1, underpins everything downstream)
- `app/rfq/*`, `app/orders/*` — the RFQ-to-order pipeline (Phases 4–5), the commercial core of the app

## Verification

Each phase should be demoed on the staging deployment before moving on:
- Phase 0: staging URL loads, design-system components render in a Storybook page or a scratch route.
- Phase 1: real OTP round-trip (send code, verify, session persists across reload).
- Phase 2: home/search screens driven entirely by DB data (no hardcoded arrays left).
- Phase 3: supplier/product pages load from a seeded record, WhatsApp link opens with correct number.
- Phase 4: submit an RFQ, manually insert competing quotes, confirm compare screen renders and Accept creates a row in `Order`.
- Phase 5: Razorpay test-mode payment completes, webhook flips `paymentStatus`, order timeline updates.
- Phase 6/7: chat message round-trips between two test sessions; profile screen reflects saved suppliers and RFQ history for the logged-in buyer.

## Seller Dashboard (Vendor Flow) — shipped

Built ahead of the other "Later Phases" items, since there was no vendor-facing app at all — suppliers were admin-seeded and quotes were entered through an unauthenticated internal tool. This phase replaced both with a real, self-service vendor portal:

- **Vendor auth**: same phone-based stopgap pattern as buyers (`lib/vendorSession.ts`, its own `nx_vendor` cookie so one browser can hold a buyer and a vendor session at once). Logging in with a phone matching an existing seeded `Supplier` logs into that record as-is; a new phone number creates a new, unverified `Supplier`.
- **RFQ inbox** (`/vendor/rfqs`) — relevance-filtered to RFQs tied to the vendor's own products or categories; submitting a quote (`/vendor/rfqs/[id]`) uses the vendor's own session-derived `supplierId`, closing the spoofing hole the old internal tool had.
- **Product catalog CRUD** (`/vendor/products`) — vendors add/edit/delete their own listings; specs and bulk price tiers are entered as plain `Key: Value` / `range | price` textareas, parsed server-side into the same JSON shape the buyer-facing product page already renders.
- **Order fulfillment** (`/vendor/orders`) — the vendor now advances "In Production" → "Shipped" themselves; the buyer-side internal advance control (`/orders/[id]`) is narrowed to only "Payment Received" (Razorpay stopgap) and "Delivered" (buyer confirms receipt).
- **Architecture**: buyer routes moved into an `app/(buyer)/` route group with their own layout (`AppShell`/buyer header+tab bar), so `/vendor/*` gets a separate, simpler `VendorHeader` instead. No URL changes for existing buyer pages.
