# Task: Resend Transactional Email Integration

**Status:** Ready for development  
**Priority:** High — commercial blocker for M1  
**Owner:** DevOps / Next.js Frontend Developer  
**Estimated scope:** Small — Resend API integration + React Email templates  
**Depends on:** `business/tasks/done/04-implement-admin-azure-functions.md`

---

## Context

Transactional emails are critical for (a) notifying end-customers when their bookings are confirmed, and (b) inviting and welcoming new tenants to the admin portal after provisioning. We are using Resend for transactional emails because of its excellent developer experience, low pricing ($0 tier up to 3,000 emails/month), and native support for React Email templates.

All emails will be triggered from a single shared Azure Function endpoint `/api/send-email` gated by JWT to protect against abuse.

---

## Technical Specifications

### 1. Resend Account Configuration
- Domain verification in Resend (configuring SPF, DKIM, and DMARC on our Cloudflare domain).
- Setting the `RESEND_API_KEY` environment variable.

### 2. React Email Templates
We need to implement two clean, responsive templates using `@react-email/components` or inline HTML:
1. **Booking Confirmation Template**:
   - Sent to end-customers when their reservation is successfully booked.
   - Contains: Business Name, Service Name, Date & Time, Location/Phone, and a link to manage/cancel the booking if applicable.
2. **Admin Welcome & Invite Template**:
   - Sent to new tenants when they are provisioned.
   - Contains: Welcome message, temporary login link or portal URL, login credentials, and initial onboarding steps.

### 3. Azure Function Endpoint `/api/send-email`
- Receives email requests containing: `to`, `templateId`, `templateData` (JSON object matching the template's required properties).
- Gated by a JWT (shared administrative token or admin-user token depending on context) or restricted internal Function key.
- Invokes the Resend SDK to dispatch the email.

---

## Requirements

### 1. Resend SDK Setup
- [ ] Install `resend` and `@react-email/components` (or alternative email rendering library) in the Azure Functions workspace.
- [ ] Add `RESEND_API_KEY` and default `FROM_EMAIL` to local `.env` and Azure Function App Settings.

### 2. React Email Templates
- [ ] Create `emails/booking-confirmation.tsx` (or equivalent HTML template generator) with placeholders for `businessName`, `serviceName`, `dateTime`, `location`, `phone`, and `bookingId`.
- [ ] Create `emails/admin-welcome.tsx` (or equivalent HTML template generator) with placeholders for `businessName`, `adminEmail`, `loginUrl`, and `tempPassword`.

### 3. Send Email Azure Function
- [ ] Implement `azure-functions/notifications/sendEmail.ts` endpoint (e.g. mapping to Route `/api/send-email`).
- [ ] Protect the endpoint with JWT validation.
- [ ] Render the correct template based on a `templateId` parameter (`booking-confirmation` or `admin-welcome`).
- [ ] Send the email using the Resend SDK and return the message ID.

---

## Files touched

| Area | Paths |
|---|---|
| Dependencies | `azure-functions/package.json` (modified) |
| Email Templates | `azure-functions/emails/BookingConfirmation.tsx` (new) <br> `azure-functions/emails/AdminWelcome.tsx` (new) |
| Azure Functions | `azure-functions/notifications/sendEmail.ts` (new) |
| Environment | `.env.local.example` (add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`) |

---

## Out of scope

- Marketing newsletter campaigns or bulk emails (this task is strictly for transactional emails).
- Building an in-admin email logs explorer or dashboard.
- Designing more than the two required templates.

---

## Acceptance criteria

1. Calling the `/api/send-email` endpoint with a valid JWT and `templateId: "admin-welcome"` sends a beautifully formatted email using Resend.
2. Calling the `/api/send-email` endpoint with `templateId: "booking-confirmation"` sends a clean booking receipt with accurate client variables.
3. The Azure Function gracefully handles Resend API failures, logs them, and returns a helpful 500 error code.
4. Emails are successfully delivered to test mailboxes (e.g. Gmail/Outlook) without being marked as spam (assuming SPF/DKIM is configured).
