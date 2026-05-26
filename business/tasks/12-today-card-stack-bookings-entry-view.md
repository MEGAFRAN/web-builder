# Task: "Today" Card-Stack Bookings Entry View

**Status:** Pending  
**Priority:** Medium — scheduled for M2 (activation & mobile UX polish)  
**Owner:** Next.js Frontend Developer / UX-UI Designer  
**Estimated scope:** Medium — frontend UI redesign on mobile screens, retaining the existing data path  
**Depends on:** `business/tasks/done/04-implement-admin-azure-functions.md` (Assumes admin API endpoints for reservations are stable)

---

## Context

Our core user vertical — solo beauty professionals — works primarily on their mobile phones while on the move. The existing table-based or calendar-based bookings dashboard is too dense and desktop-centric. 

To deliver a high-impact "aha!" experience within the first 60 seconds of logging in, the booking tab must be optimized for mobile devices. 

Following the CPO's directive (Commitment #4), we will redesign the entry view of the Bookings section `/admin/bookings` to a mobile-first **"Today" Card Stack**. This will show a vertical scroll of today's appointments with instant, one-tap actions.

---

## Design and UX Specifications

### 1. The Mobile View (Default below 768px)
- A focused list of today's bookings sorted chronologically by time.
- Large, readable typography for the customer's name, booking time, and selected service.
- **Three One-Tap Actions**:
  1. **Call Client**: A prominent button linking to `tel:<phone>` to instantly dial the client.
  2. **Mark No-Show**: Triggers a status change to `no-show` (calls existing PATCH reservation API).
  3. **Mark Complete**: Triggers a status change to `completed` (calls existing PATCH reservation API).

### 2. The Desktop View (768px and above)
- The desktop view can retain a calendar or list/table view for weekly/monthly context.
- The new mobile layout is conditionally rendered using standard Tailwind responsiveness (e.g. `block md:hidden` for mobile card stack, `hidden md:block` for standard view).

### 3. Data Flow
- No Cosmos DB schema changes.
- Uses the existing backend API path (`GET /admin/reservations` with query params for the current date).
- Triggers existing PATCH `/admin/reservations/:id` status updates.

---

## Requirements

### 1. Mobile Responsiveness & Layout
- [ ] Create a mobile-first React component `TodayCardStack` under `/components/admin/`.
- [ ] Render a card for each of today's appointments containing:
  - Appointment time range (e.g., "14:00 - 14:45").
  - Client details: Name, phone number.
  - Service item and pricing (e.g., "Haircut & Blow Dry - $45").
  - Current reservation status tag (`pending`, `confirmed`, `completed`, `no-show`).
- [ ] Embed the three one-tap buttons with clean, thumb-friendly tap targets (minimum size 44x44px).

### 2. State & Action Integration
- [ ] Bind the "Call" action to a standard `<a href="tel:...">` anchor.
- [ ] Integrate the "Mark No-Show" and "Mark Complete" buttons to invoke the existing reservation PATCH update function.
- [ ] Handle loading and disabled states gracefully on the buttons to prevent double-tapping.

### 3. Empty State
- [ ] Design an elegant, reassuring empty state card for days with no appointments (e.g., "No bookings scheduled for today. Enjoy your day!").

---

## Files touched

| Area | Paths |
|---|---|
| Admin Bookings View | `app/admin/bookings/page.tsx` (modified) |
| Card Stack Component | `components/admin/TodayCardStack.tsx` (new) |

---

## Out of scope

- Setting up SMS reminders or push notifications (this is purely a visual and interactive layout change).
- Rewriting the database queries or introducing a new database container.

---

## Acceptance criteria

1. Navigating to `/admin/bookings` on a mobile viewport (width < 768px) loads the "Today" Card Stack by default.
2. The cards are displayed in chronological order starting with the earliest appointment.
3. Tapping the "Call" button correctly prompts the phone's native dialer with the client's number.
4. Tapping "Mark Complete" or "Mark No-Show" successfully updates the status in Cosmos DB and reflects the state change in the UI without needing a page refresh.
5. Desktop layouts remain unaffected or render the calendar/table list as expected.
