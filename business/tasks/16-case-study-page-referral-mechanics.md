# Task: Case-Study Page + Referral Mechanics

**Status:** Pending  
**Priority:** Medium — scheduled for M3 (growth & compounding acquisition)  
**Owner:** Next.js Frontend Developer / CEO  
**Estimated scope:** Medium — new landing subpage + minor admin shell updates  
**Depends on:** `business/tasks/13-in-admin-monthly-bookings-revenue-kpi-tile.md` (Assumes client revenue statistics exist)

---

## Context

Once we have successfully onboarded and activated our first 5+ clients (Milestone 2), we will enter Milestone 3 (retention & growth). 

To scale our acquisition loop beyond cold DMs, we will implement two high-leverage growth mechanics:
1. **Public Marketing Case Studies**: Showcase 3 highly successful clients and their actual month-over-month revenue generated through the platform (leveraging metrics tracked from Task 13).
2. **Admin-Side Referral Nudge**: Implement a lightweight "Refer a friend, get 1 month free" banner within the admin dashboard pointing to a shared Stripe referral promo code. No complex referral software will be built in the platform.

---

## Technical Specifications

### Part A: Marketing Site Case-Study Page
- Location: On our own marketing site (separate from client static containers).
- Route: `/case-studies` or `/success` on our central marketing portal.
- Design: Clean, high-conversion layout showcasing 3 clients from the solo beauty vertical.
- Content:
  - Client headshot and live site link.
  - Testimonial quote.
  - KPI highlight: "Generated $X,XXX in bookings this month" / "Saved X hours of booking calls".

### Part B: Admin Referral Nudge
- Location: At the bottom or sidebar of the admin dashboard shell (common layout).
- Copy: "Love WebBuilder? Refer a friend and get 1 month free! 🎁"
- Action: Opens a modal or tooltip showing their unique or shared referral code (e.g., `SHARE25`) which maps to a Stripe Coupon.
- Stripe Coupon: Configure a coupon/promotion code inside Stripe that applies 100% off for 1 billing cycle when used by referees, and manually credit the referrer's account (zero-code referral engine).

---

## Requirements

### 1. Central Marketing Case Studies
- [ ] Implement a new public page `/app/marketing/case-studies/page.tsx` (or central marketing route).
- [ ] Design a conversion-oriented layout featuring 3 case studies (e.g. hair stylist, nail technician, massage therapist).
- [ ] Add prominent CTAs on the page pointing to our main onboarding / contact form.

### 2. Admin Panel Referral Banner
- [ ] Modify the shared admin dashboard shell (`components/admin/AdminLayout.tsx` or similar sidebar) to include a referral banner.
- [ ] Style the banner to be visually distinct but non-intrusive (e.g. a small badge or footer link).
- [ ] Implement a lightweight modal or slide-over displaying the coupon code and clear instructions on how they and their friends receive the credit.

---

## Files touched

| Area | Paths |
|---|---|
| Marketing Site | `app/marketing/case-studies/page.tsx` (new or modified) |
| Admin UI Layout | `components/admin/AdminLayout.tsx` or sidebar (modified) |

---

## Out of scope

- Automated coupon code generation or serverless referral attribution engine (we track referrers manually in Stripe when coupons are redeemed to save engineering complexity).
- Dynamic database-backed case studies (marketing case-studies are hardcoded static pages).

---

## Acceptance criteria

1. Navigating to `/case-studies` on the marketing domain displays 3 structured case studies with testimonials and revenue metrics.
2. Logging into the admin panel displays the "Refer a friend" nudge in the sidebar or shell.
3. Clicking the referral link opens a modal showing the promo code and clear instructions.
4. The referral design compiles safely and doesn't break standard dashboard layouts on mobile or desktop viewports.
