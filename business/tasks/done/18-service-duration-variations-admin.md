# Task: Service Duration and Pricing Variations in Admin Panel

**Status:** Pending  
**Priority:** High — critical for well-being, spa, and beauty salon clients (M2 polish)  
**Owner:** Next.js Frontend Developer / UX-UI Designer / CTO  
**Estimated scope:** Medium-Large — requires database model changes, admin modal UX, and public booking widget integration  
**Depends on:** stable catalog read/write APIs

---

## Context

Our multi-tenant web-builder platform is widely adopted by clients like solo beauty professionals, massage therapists, and hair salons. A fundamental requirement for these verticals is offering a single service with multiple durations and prices. For example, a "Swedish Massage" can be booked for:
- 30 minutes for €40
- 60 minutes for €60
- 90 minutes for €80

Currently, the `AdminBookingService` schema only supports a flat, single duration (`durationMinutes`) and price (`price`) per service. To set up multiple durations, administrators must create duplicate services (e.g., "Massage 30m", "Massage 60m"), cluttering the booking catalog and leading to poor client-facing UX.

Following our UX/UI design guidelines and CPO directives, we will implement native **Service variations** (durations and pricing) that are grouped under a single service entity in the administrator catalog and the public booking widget.

---

## Design and UX Specifications

### 1. Admin Service Form (`ServiceFormModal`)
- **Toggle Control**: Add a standard `Checkbox` labeled *"Este servicio tiene variantes (ej. múltiples duraciones o precios)"* immediately below the description textarea.
- **Static Form Mode (Default)**: If unchecked, the modal behaves exactly as it does now, showing standard single-value fields for `durationMinutes` and `price`.
- **Variations Form Mode**: If checked, the single price and duration fields are hidden. In their place, a dynamic variations stack is rendered:
  - A horizontal list of input rows. Each row contains:
    - **Label Input** (`Input` placeholder: *"Express / Completo / Premium"* - optional)
    - **Duration Input** (`Input` type="number" suffix="min")
    - **Price Input** (`Input` type="number" step="0.01" prefix="€")
    - **Remove Action**: A clear destructive button/icon with an `aria-label` to remove that variation.
  - **Add Button**: A secondary `Button` labeled *"+ Añadir variante"* at the bottom of the list. Clicking it inserts a new empty variation row and programmatically focuses its first input field.
  - **Validation**:
    - If variations are enabled, at least one variation must be defined.
    - Each variation must have a positive duration (>0) and a non-negative price (>=0).

### 2. Admin Services List Layout
- On `AdminServicesPage`, if a service contains variations, we display the variations inside the `ServiceCard` summary using mini-badges or a horizontal row of options (e.g., `"30 min (40€) · 60 min (60€)"`) instead of a single static price/duration badge.

### 3. Public Booking Block (`ServicesBlock`)
- When a user views a service card on the client-facing site, the card highlights the starting price (e.g., *"Desde 40€"* or *"30-90 min"*).
- When clicking "Reservar" on a service with variations:
  - If a booking modal opens, the first step prompts the user to select their desired duration option using a clear group of segment buttons or cards (Hick's Law).
  - The chosen variation's specific duration and price must be forwarded to the booking flow/reservation database.

---

## Technical Specifications & Data Flow

### 1. Schema Extensions (`types/admin.ts` & `types/cms.ts`)
We will extend the `AdminBookingService` schema to support an optional `variations` array. To ensure backward compatibility with existing single-price services, `durationMinutes` and `price` remain optional or fallback values:

```typescript
export type ServiceVariation = {
  id: string
  label?: string // e.g. "Short", "Standard"
  durationMinutes: number
  price: number
}

export type AdminBookingService = {
  id: string
  name: string
  description: string
  durationMinutes?: number // Fallback/default when variations is empty
  price?: number // Fallback/default when variations is empty
  currency: string
  category?: string
  variations?: ServiceVariation[] // New field
}
```

### 2. API & Data Validation
- **JSON Database**: Services are persisted inside `/data/booking-services-local.json` or Cosmos DB.
- **Validation Rules** (`app/api/admin/services/route.ts` & `lib/booking-catalog.ts`):
  - Adapt `isServiceRow` and `parseBookingCatalogRows` to accept the `variations` field as an array of `ServiceVariation`.
  - Ensure that each variation in the list is strictly checked for valid numeric types.

---

## Requirements

### 1. Type Definitions & API Backing
- [ ] Extend `AdminBookingService` in `types/admin.ts` to include optional `variations` matching the technical spec.
- [ ] Extend `ReservationServiceItem` or `Service` in `types/cms.ts` to allow multiple pricing and duration variations.
- [ ] Update `isServiceRow` in `app/api/admin/services/route.ts` to allow and validate the `variations` array.
- [ ] Adapt `parseBookingCatalogRows` in `lib/booking-catalog.ts` to correctly parse variations from the persistence layer.

### 2. Administrator Interface Polish
- [ ] Update `ServiceFormModal` in `components/admin/AdminServicesPage.tsx` to include the variations checkbox toggle and dynamic form rows.
- [ ] Implement validation in `submit()` to ensure all variation rows are correctly filled before sending to the backend.
- [ ] Update `ServiceCard` in `components/admin/AdminServicesPage.tsx` to handle services with variations, displaying them beautifully under the service title.
- [ ] Manage focus dynamically (WCAG 2.4.3): when adding a new variation row, move the focus to the new row's first input.

### 3. Public Booking Widget Update
- [ ] Adapt `components/blocks/ServicesBlock.tsx` to display services with variations.
- [ ] Modify the reservation submission flow to let the user select their duration/price option.
- [ ] Ensure the selected option's duration is populated inside the submitted `StoredReservation` object (`durationMinutes`, price/notes context).

---

## Files touched

| Area | Paths |
|---|---|
| Admin Types | `types/admin.ts` (modified) |
| CMS Types | `types/cms.ts` (modified) |
| Admin Services Page | `components/admin/AdminServicesPage.tsx` (modified) |
| Public Services Block | `components/blocks/ServicesBlock.tsx` (modified) |
| Catalog Parser | `lib/booking-catalog.ts` (modified) |
| Admin Services Route | `app/api/admin/services/route.ts` (modified) |

---

## Out of scope

- Assigning different employees or calendar schedules per variation (the schedule rules are set at the parent service/resource level).
- Varying currencies across different variations of the same service (all variations use the parent service's `currency`).

---

## Acceptance criteria

1. **Variation Creation**: The administrator can toggle "Este servicio tiene variantes" inside the service form, add multiple duration/price rows, and save the service.
2. **Backward Compatibility**: Existing services without variations load and function perfectly in the admin panel and public booking widget.
3. **Admin Visual Hierarchy**: On `AdminServicesPage`, cards of services with variations display all available options (durations/prices) clearly, utilizing high-contrast, readable typography.
4. **Validation Safety**: Saving a service with incomplete variation inputs (empty fields or negative values) throws an inline, accessible error message.
5. **Client Reservation Integrity**: Public users booking a service with variations are prompted to choose an option, and the chosen duration and price are successfully saved to the reservations collection.
