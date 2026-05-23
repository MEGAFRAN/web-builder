# Task: Stripe Checkout + Customer Portal Integration

**Status:** Ready for development  
**Priority:** High — commercial blocker for M1  
**Owner:** DevOps / Next.js Frontend Developer  
**Estimated scope:** Medium — Azure Functions + Stripe SDK + seeding script  
**Depends on:** `business/tasks/03-setup-cosmos-db-admin-containers.md` and `business/tasks/04-implement-admin-azure-functions.md`

---

## Context

To charge real money and remain compliant without building a complex billing UI, we are integrating Stripe Checkout (for subscription signups) and Stripe Customer Portal (for self-service card updates, billing history, and cancellations). 

All site configurations remain static compile-time file-based (SSG), but client-level billing status is tracked in the Cosmos DB `admin-users` container. This avoids database creep.

Stripe product configuration must be automated via code — no manual clicks in the Stripe Dashboard are allowed for agents.

---

## Technical Specifications

### 1. Stripe Products & Prices
We will have one Stripe Product with four pricing options supporting our two target markets (Spain and Colombia):
- `ES_MONTHLY_EUR`: €19 / month
- `ES_ANNUAL_EUR`: €179 / year
- `CO_MONTHLY_COP`: 49,000 COP / month
- `CO_ANNUAL_COP`: 490,000 COP / year

These must be automated via an idempotent script `scripts/setup-stripe-products.mjs`.

### 2. Azure Functions (in shared Function App)
We will add three new endpoints under the billing namespace:
- `createCheckoutSession`: Generates a Stripe Checkout Session URL for a client. For Spain (`ES`), SEPA Direct Debit must be enabled.
- `createPortalSession`: Generates a Stripe Customer Portal Session URL for self-service subscription management.
- `stripeWebhook`: Listens to Stripe events to keep client subscription state synchronized in Cosmos DB.

### 3. Stripe Webhook Events to Handle
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

On webhook receipt, the corresponding document in Cosmos DB's `admin-users` container must be updated with the correct billing fields.

### 4. Billing Fields in Cosmos DB (`admin-users` document)
These fields will be additive to the admin-user schema (under Task 11):
- `market`: `"ES"` | `"CO"`
- `planSku`: `"ES_MONTHLY_EUR"` | `"ES_ANNUAL_EUR"` | `"CO_MONTHLY_COP"` | `"CO_ANNUAL_COP"`
- `subscriptionStatus`: `"trialing"` | `"active"` | `"past_due"` | `"canceled"`
- `paymentProvider`: `"stripe"`
- `stripeCustomerId`: `string`
- `stripeSubscriptionId`: `string`
- `taxStatus`: tracks IVA/OSS/DIAN posture per tenant

---

## Requirements

### 1. Automated Stripe Configuration
- [ ] Implement `scripts/setup-stripe-products.mjs` to create the product and 4 prices idempotently using the Stripe API.
- [ ] The script must save/log the created Stripe Price IDs for reference or write them to a local config file.

### 2. Billing Azure Functions
- [ ] Create `createCheckoutSession` function:
  - Accepts `clientId`, `market` (`ES` | `CO`), and `plan` (`monthly` | `annual`).
  - Gated by admin JWT.
  - Generates Stripe Checkout Session with `payment_method_types` including card (and SEPA for `ES`).
  - Sets `client_reference_id` to `clientId`.
  - Redirects back to admin success/cancel URLs.
- [ ] Create `createPortalSession` function:
  - Accepts `clientId`.
  - Gated by admin JWT.
  - Queries Cosmos DB `admin-users` to retrieve `stripeCustomerId`.
  - Generates Stripe Customer Portal Session and returns the URL.
- [ ] Create `stripeWebhook` function:
  - Verifies Stripe webhook signature using `STRIPE_WEBHOOK_SECRET`.
  - Parses event and updates the tenant's record in Cosmos DB `admin-users` container (e.g. `subscriptionStatus`, `stripeCustomerId`, `stripeSubscriptionId`).

### 3. Admin UI Integration (No Custom Billing Views)
- [ ] In the admin Settings page, add a "Manage Subscription" button that calls `createPortalSession` and redirects the user to the Stripe Customer Portal.
- [ ] If no subscription exists (or during onboarding), redirect the user to Stripe Checkout via `createCheckoutSession`.
- [ ] Absolutely no custom billing forms, invoice tables, or payment fields should be built within the admin SPA.

---

## Files touched

| Area | Paths |
|---|---|
| Scripts | `scripts/setup-stripe-products.mjs` (new) |
| Azure Functions | `azure-functions/billing/createCheckoutSession.ts` (new) <br> `azure-functions/billing/createPortalSession.ts` (new) <br> `azure-functions/billing/stripeWebhook.ts` (new) |
| Admin Web App | `app/admin/settings/page.tsx` or settings component (modified) |
| Environment | `.env.local.example` (add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) |

---

## Out of scope

- Wompi payment integration (handled in a separate M2 task).
- Custom in-admin payment/billing dashboards.
- Multi-tier subscriptions (only a single flat plan per market is supported).

---

## Acceptance criteria

1. Running `node scripts/setup-stripe-products.mjs` creates the Stripe Product and Prices in the Stripe account and is completely idempotent.
2. `createCheckoutSession` generates a valid Stripe Checkout URL with correct currency, amount, and `client_reference_id`.
3. Clicking "Manage Subscription" in admin requests a portal session and successfully redirects the user to the Stripe Customer Portal.
4. Sending a mock Stripe Webhook payload (e.g. `checkout.session.completed`) successfully updates the corresponding Cosmos DB document with `subscriptionStatus: "active"`, `stripeCustomerId`, and `stripeSubscriptionId`.
5. Stripe webhook signature verification works in both local development (using Stripe CLI) and Azure environments.
