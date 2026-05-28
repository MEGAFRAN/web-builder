# Task: Unify Booking Appointment Actions (Card Stack + Detail Drawer)

**Status:** Pending  
**Priority:** Medium — follow-up to task 12; prevents admin UX drift between mobile and desktop  
**Owner:** Next.js Frontend Developer / UX-UI Designer  
**Estimated scope:** Medium — extract shared action primitive; refactor two existing shells  
**Depends on:** `business/tasks/12-today-card-stack-bookings-entry-view.md` (TodayCardStack and PATCH `complete` action should land first)

---

## Context

`TodayCardStack` (mobile day view) and `BookingDetailDrawer` (desktop/week inspect panel) both let staff act on the same reservation, but they have diverged:

| Capability | TodayCardStack | BookingDetailDrawer |
|---|---|---|
| Call client | ✅ `tel:` button | ❌ phone is plain text |
| Mark complete | ✅ | ❌ |
| Mark no-show | ✅ + confirmation modal | ✅, one tap (no confirm) |
| No-show + charge (`guaranteeEnabled`) | ✅ gold button + confirm | ✅ primary styling, no confirm |
| Cancel appointment | ❌ | ✅ |
| Full details (email, notes, guarantee) | ❌ | ✅ |

This breaks **consistent interaction** (WCAG 3.2.3): the same destructive action behaves differently depending on viewport. It also creates maintenance risk — every new action must be patched in two places.

**Design decision (from UX review):** keep both shells (card = act fast on mobile; drawer = inspect then act on desktop), but extract a **single shared action layer** so behavior, order, disabled rules, confirmations, and styling stay identical.

---

## Design and UX Specifications

### 1. Shared action primitive — `BookingAppointmentActions`

Create `components/admin/bookings/BookingAppointmentActions.tsx` as the single source of truth for appointment-level actions.

**Button order (all layouts):**

1. **Call client** — `<a href="tel:…">`
2. **Mark complete** — PATCH `complete`
3. **Mark no-show** *or* **Mark no-show and charge** — last (destructive-adjacent; error prevention)

**Visual semantics:**

- Call → primary (`bg-primary`)
- Complete → green (`bg-green-600`)
- Plain no-show → yellow outline/fill
- No-show + charge → gold (`bg-amber-500`) when `guaranteeEnabled` and card on file

**Confirmation (error prevention):**

- Both plain no-show and charge no-show require a one-step `AdminModal` confirmation before executing (reuse copy from `adminCopy.bookings.todayStack.*`).
- Cancel does **not** use this primitive — it stays in the drawer with its existing separate cancel modal in `AdminBookingsPage`.

**Disabled / terminal states:**

- Single shared helper for terminal statuses: `cancelled`, `no-show`, `completed`, `cancelled_and_charged`, `cancelled_charge_failed`.
- Per-action loading state to prevent double-taps.

**Layout prop:**

- `layout: 'inline'` — horizontal/grid row for mobile card (min 44×44px targets)
- `layout: 'stacked'` — vertical column for drawer footer

### 2. TodayCardStack (summary shell)

- Keeps: time range, name, phone, service + price, status badge, empty states.
- **Remove** inline action/modal logic from `TodayCard`; embed `BookingAppointmentActions` with `layout="inline"`.

### 3. BookingDetailDrawer (detail shell)

- Keeps: full `<dl>` detail block (client, email, notes, guarantee, cancel reason).
- **Add:** tap-to-call on the phone field (`tel:` link styled as text, or prominent link — lighter than duplicating a full CTA row in the detail section).
- **Add:** mark complete via shared primitive.
- **Replace** current no-show buttons with `BookingAppointmentActions` (`layout="stacked"`) — including confirmation modal and gold charge styling.
- **Keep:** cancel appointment button (drawer-only; infrequent, high-impact — intentional progressive disclosure).

### 4. AdminBookingsPage (orchestrator)

- Continues to own API calls: `patchReservation`, `chargeNoShow`.
- Passes the same callbacks into both `TodayCardStack` and `BookingDetailDrawer` — no duplicated business logic inside UI shells.

---

## Requirements

### 1. Extract shared primitive
- [ ] Create `BookingAppointmentActions.tsx` under `components/admin/bookings/`.
- [ ] Export typed callbacks: `onPatchStatus(id, 'no-show' | 'complete')`, optional `onNoShowCharge(id)`.
- [ ] Own no-show confirmation modal (`AdminModal`) internally.
- [ ] Support `guaranteeEnabled` branch (charge vs plain no-show) using the same rules as today's `TodayCardStack`.

### 2. Refactor consumers
- [ ] Refactor `TodayCardStack` / `TodayCard` to use `BookingAppointmentActions`.
- [ ] Refactor `BookingDetailDrawer` footer to use `BookingAppointmentActions` and add mark complete.
- [ ] Make phone tappable in the drawer detail section.

### 3. Copy and consistency
- [ ] Reuse existing strings from `components/admin/admin-copy.ts`; move any card-only confirm copy to a neutral namespace (e.g. `adminCopy.bookings.appointmentActions.*`) if both surfaces share it.
- [ ] Align drawer charge button styling with card (gold, not primary blue).

### 4. Tests and Storybook
- [ ] Unit tests for `BookingAppointmentActions` (order, confirm flow, guarantee branch, disabled/loading states).
- [ ] Update `BookingDetailDrawer` and `TodayCardStack` tests to reflect shared primitive.
- [ ] Storybook stories for `BookingAppointmentActions` (`inline` + `stacked` layouts, guarantee variant).

---

## Files touched

| Area | Paths |
|---|---|
| Shared actions | `components/admin/bookings/BookingAppointmentActions.tsx` (new) |
| Stories | `components/admin/bookings/BookingAppointmentActions.stories.tsx` (new) |
| Tests | `__tests__/components/admin/bookings/BookingAppointmentActions.test.tsx` (new) |
| Mobile shell | `components/admin/TodayCardStack.tsx` (modified) |
| Desktop shell | `components/admin/bookings/BookingDetailDrawer.tsx` (modified) |
| Copy | `components/admin/admin-copy.ts` (modified, if namespaced) |
| Orchestrator | `components/admin/AdminBookingsPage.tsx` (modified, if callback wiring changes) |

---

## Out of scope

- Adding cancel to the mobile card (intentionally drawer-only to reduce accidental taps).
- Mobile "view full details" link that opens the drawer (optional future enhancement).
- New API endpoints or Cosmos schema changes.
- SMS, reschedule, or other new appointment actions.

---

## Acceptance criteria

1. Call, mark complete, and mark no-show (+ charge when applicable) behave identically on mobile cards and desktop drawer — same order, confirmations, disabled rules, and loading states.
2. No-show actions on desktop require confirmation (matching mobile).
3. No-show + charge uses gold styling on both surfaces when `guaranteeEnabled` and a card is on file.
4. `BookingDetailDrawer` includes mark complete; phone number is tappable to dial.
5. `TodayCardStack` retains current mobile UX after refactor (no visual/behavior regression).
6. Action logic lives in one component — adding a future action requires updating `BookingAppointmentActions` only.
7. `npm run validate:quick` passes.
