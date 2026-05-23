# Task: 14-Day Trial → Auto-Charge Billing Flow

**Status:** Pending  
**Priority:** Medium — scheduled for M2 (commercial polish)  
**Owner:** DevOps / Next.js Frontend Developer  
**Estimated scope:** Medium — Stripe Checkout parameters, webhook event handling, and email notifications  
**Depends on:** `business/tasks/06-stripe-checkout-customer-portal-integration.md` and `business/tasks/07-resend-transactional-email-integration.md`

---

## Context

To mitigate the risk of clients signing up but never converting to paid users (CEO Risk #3), we will require a credit card upfront during onboarding. 

The client will receive a **14-day free trial**. At checkout session completion, their subscription will start in a `trialing` state. If they do not cancel through the Customer Portal within 14 days, Stripe will automatically charge their card on file.

We need to support:
- Setting up the trial on Stripe Checkout.
- Listening to webhook notifications for successful conversion or failed payments.
- Sending transactional dunning emails via Resend if a payment fails to ensure they can update their card.

---

## Technical Specifications

### 1. Stripe Checkout Configuration
- Update the Stripe Checkout Session parameters in `createCheckoutSession` to include:
  - `subscription_data.trial_period_days: 14`
  - `payment_method_collection: "always"` (required to collect card details up front during trial setup)

### 2. Stripe Webhook Additions
We need to handle these additional Stripe webhook events in our Azure Function `stripeWebhook`:
- `customer.subscription.trial_will_end`: Sent 3 days before the trial ends (optional, useful for courtesy notification).
- `invoice.payment_failed`: Sent when the trial ends and the card is declined, or during subsequent monthly renewal failures.
- `invoice.paid`: Transition from `trialing` to `active` or successful subsequent billing.

### 3. State Management in Cosmos DB
- Transition the `subscriptionStatus` field in Cosmos `admin-users` container:
  - At signup: `"trialing"`
  - On successful auto-charge/invoice paid: `"active"`
  - On failed auto-charge/failed payment: `"past_due"`
  - On manual cancellation / deleted subscription: `"canceled"`

### 4. Dunning / Email Alerts (via Resend)
- If `invoice.payment_failed` is received:
  - Send a transactional email notifying the tenant that their payment failed and their site will be disabled soon if their billing details are not updated.
  - Include a direct link to their Stripe Customer Portal (`/admin/settings` -> redirect to Customer Portal) to update the card.

---

## Requirements

### 1. Enable Upfront-Card Free Trials
- [ ] Modify `createCheckoutSession.ts` to include `trial_period_days: 14` and force payment method collection.

### 2. Handle Failed Payment Webhooks
- [ ] Update `stripeWebhook.ts` to intercept `invoice.payment_failed` and transition `subscriptionStatus` to `"past_due"`.
- [ ] Update `stripeWebhook.ts` to intercept `customer.subscription.deleted` and transition `subscriptionStatus` to `"canceled"`.

### 3. Implement Dunning Notification Flow
- [ ] Create a new email template `emails/payment-failed.tsx` or inline HTML within the email notification service.
- [ ] Connect the `invoice.payment_failed` webhook event to dispatch the failed-payment email via Resend to the tenant's admin email.

### 4. Trial Warning Email (Optional / Nice to have)
- [ ] Implement support for `customer.subscription.trial_will_end` to optionally send a courtesy "Your trial is ending soon" email.

---

## Files touched

| Area | Paths |
|---|---|
| Stripe Functions | `azure-functions/billing/createCheckoutSession.ts` (modified) <br> `azure-functions/billing/stripeWebhook.ts` (modified) |
| Email Templates | `azure-functions/emails/PaymentFailed.tsx` (new) |
| Shared Notifications | `azure-functions/notifications/sendEmail.ts` (modified or new triggers added) |

---

## Out of scope

- Building custom credit card forms or collection UIs inside our admin web app (Stripe Checkout handles card inputs completely).
- Advanced automated billing retry schedules (we rely on Stripe's native retry and dunning schedule settings).

---

## Acceptance criteria

1. Initiating a checkout session correctly sets up a 14-day trial with upfront card requirement, and Stripe dashboard shows the subscription status as `trialing`.
2. Completing the Stripe checkout updates the Cosmos DB record with `subscriptionStatus: "trialing"`.
3. Simulating an `invoice.paid` webhook event (successful transition from trialing to active) updates the Cosmos DB record with `subscriptionStatus: "active"`.
4. Simulating an `invoice.payment_failed` webhook event updates the Cosmos DB record to `subscriptionStatus: "past_due"` and triggers a failed-payment transactional email via Resend.
5. Deleting a subscription on Stripe triggers `customer.subscription.deleted`, updating the Cosmos record to `"canceled"`.
