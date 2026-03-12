# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Galerie Antiquités** — a high-end French-language antique & art marketplace. The platform acts as an escrow intermediary: buyers pay the platform, funds are held until buyer confirms reception, then admin releases to vendor.

Interface language: **French throughout**.

## Commands

```bash
# Development
npm run dev               # Start dev server (http://localhost:3000)
npm run build             # Production build (Turbopack)
npm run lint              # ESLint

# Database
npm run db:generate       # prisma generate (after schema changes)
npm run db:push           # prisma db push (sync schema, no migration file)
npm run db:migrate        # prisma migrate dev (create migration file)
npm run db:studio         # Prisma Studio GUI
npm run db:seed           # Seed demo data (users, categories, sample listings)
```

No test suite is configured yet.

**First-time setup:**
```bash
cp .env.example .env      # Fill in DATABASE_URL, STRIPE_*, CLOUDINARY_*, NEXTAUTH_SECRET
npm install
npx prisma db push
npm run db:seed
```

**Local Stripe webhooks:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Environment Variables

See `.env.example`. Critical vars:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PLATFORM_FEE_PERCENT` — defaults to `15` if unset
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

## Architecture

### Tech Stack
- **Next.js 16** App Router + Turbopack, TypeScript
- **Prisma 5** + PostgreSQL
- **NextAuth v5 beta** (JWT strategy, credentials provider)
- **Stripe Connect** (Express accounts, escrow via separate charges/transfers)
- **Cloudinary** (signed direct-browser uploads)
- **Tailwind CSS** + custom CVA components (no shadcn CLI — components are hand-written in `components/ui/`)

### Role System
Three roles defined in `UserRole` enum: `ADMIN`, `VENDOR`, `BUYER`. Role is stored in JWT and available via `session.user.role`. Route protection is enforced in `middleware.ts` using NextAuth's `auth()` wrapper — `/admin/*` requires ADMIN, `/vendeur/*` requires VENDOR or ADMIN.

Auth helpers in `lib/auth.ts`: `requireAuth()`, `requireAdmin()`, `requireVendor()` — throw on failure, for use in Server Components and API routes.

### Listing Lifecycle
```
DRAFT → PENDING_REVIEW → LIVE → RESERVED → SOLD
                       ↘ REVISION → (back to PENDING_REVIEW)
                       ↘ REJECTED
```
- Vendor creates listing (DRAFT), submits for review (`POST /api/listings/[id]/submit`)
- Admin approves/edits/rejects via `/admin/annonces`
- Admin can override title, description, and price without altering the vendor's original fields (`titleAdmin`, `descriptionAdmin`, `priceAdmin` — these take display precedence when set)
- On purchase, listing moves to RESERVED; on completion, SOLD

### Escrow / Payment Flow
1. **Checkout**: `POST /api/stripe/checkout` creates a `PaymentIntent` with `application_fee_amount` and `on_behalf_of` the vendor's Express account. Funds land on the **platform** account.
2. **Webhook** (`/api/stripe/webhook`): `payment_intent.succeeded` → order status becomes `PAYMENT_HELD`.
3. **Buyer confirms**: `POST /api/orders/[id]/confirm` → order status becomes `CONFIRMED`.
4. **Admin releases**: `POST /api/stripe/release` creates a Stripe `Transfer` from platform → vendor's connected account. Webhook `transfer.created` → order becomes `FUNDS_RELEASED`, listing becomes `SOLD`.

`lib/stripe.ts` uses a lazy Proxy singleton — `STRIPE_SECRET_KEY` is checked at call-time, not module load, so `npm run build` works without env vars set.

### Cloudinary Upload Pattern
Images are never proxied through the server. Flow:
1. Client calls `POST /api/upload/sign` → server generates HMAC signature
2. Client POSTs directly to `https://api.cloudinary.com/v1_1/{cloud}/image/upload`
3. Resulting `secure_url` and `public_id` are saved to the `ListingImage` table

Images are stored under `galerie/{listingId}/`. Eager transformations auto-generate WebP thumbnails (400px) and full-size (1200px).

### Key Patterns

**Server Components with DB access** must include `export const dynamic = "force-dynamic"` to avoid build-time Prisma calls failing when `DATABASE_URL` is absent.

**Dynamic route params** (`params`, `searchParams`) are `Promise<T>` in Next.js 15+ — always `await` them before use.

**`useSearchParams()`** must be in a component wrapped by `<Suspense>`. See `/app/connexion/page.tsx` for the pattern (split into an inner form component + outer page with `<Suspense>`).

**Prisma `Decimal` fields** (price, fees) arrive as `Decimal` objects from queries — always call `Number()` before arithmetic or display.

### Database Models (key relationships)
- `User` → has one optional `VendorProfile` (vendors only)
- `User.stripeAccountId` — Stripe Express account ID (vendors only)
- `Listing` → belongs to `User` (vendor), optional `Category`, has many `ListingImage`
- `Order` → belongs to `Listing`, `buyer: User`, has `vendorId` denormalized for query performance
- `AuditLog` — records admin actions (`LISTING_APPROVED`, `FUNDS_RELEASED`, etc.)

### Typography & Design Tokens
- Fonts: `Playfair Display` (serif/display headings) and `Cormorant Garamond` (body), loaded via `next/font/google`, exposed as CSS vars `--font-playfair` / `--font-cormorant`
- Gold accent: `gold-500` (#d4911a) defined in `tailwind.config.ts`
- All UI components are in `components/ui/` and built with `class-variance-authority` (CVA). The `Button` component has `gold` and `gold-outline` variants.

### Routing Structure
```
app/
├── (public)   /                      Landing page
│              /catalogue             Browse (Museum Grid ↔ Masonry toggle)
│              /catalogue/[slug]      Product detail + Stripe checkout modal
│              /connexion             Login (credentials)
│              /inscription           Register (BUYER or VENDOR role)
├── /vendeur/                         Vendor dashboard (VENDOR + ADMIN)
│              /vendeur/annonces/nouvelle    Upload form (Cloudinary drag-drop)
│              /vendeur/paiements           Stripe Connect onboarding
│              /vendeur/stripe/retour       Stripe onboarding return handler
└── /admin/                           Admin dashboard (ADMIN only)
               /admin/annonces         Moderation queue — inline edit + approve/reject
               /admin/commandes        Escrow management + one-click fund release
```

### API Routes
All under `app/api/`. Auth checked at the top of each handler via `auth()` from `lib/auth.ts`.

| Route | Purpose |
|---|---|
| `POST /api/auth/register` | Create account (BUYER or VENDOR) |
| `GET/POST /api/listings` | List with filters / create listing |
| `GET/PATCH/DELETE /api/listings/[id]` | Get, admin-edit, or archive |
| `POST /api/listings/[id]/submit` | Vendor submits draft for review |
| `POST /api/upload/sign` | Generate Cloudinary upload signature |
| `GET/POST /api/stripe/connect` | Vendor Stripe Express onboarding |
| `GET /api/stripe/connect/dashboard` | Vendor Stripe dashboard login link |
| `POST /api/stripe/checkout` | Create PaymentIntent + Order |
| `POST /api/stripe/webhook` | Stripe event handler (no auth, signature verified) |
| `POST /api/stripe/release` | Admin releases escrowed funds to vendor |
| `POST /api/orders/[id]/confirm` | Buyer confirms reception |
