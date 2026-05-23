# Task: In-Admin Monthly Bookings Revenue KPI Tile

**Status:** Pending  
**Priority:** Low — scheduled for M2 (retention polish)  
**Owner:** Next.js Frontend Developer  
**Estimated scope:** Small — dashboard widget + backend aggregation API  
**Depends on:** `business/tasks/04-implement-admin-azure-functions.md` and `business/tasks/12-today-card-stack-bookings-entry-view.md`

---

## Context

Our single most important metric for reducing customer churn is proving immediate, concrete financial ROI. When a client sees they've generated more revenue through their website than the $25/month subscription fee, retention becomes nearly 100%.

Following the CPO's directive (Commitment #6), we will add a single, prominent KPI tile to the bookings admin screen: **"Booked through your site this month: $X"**.

This metric represents the sum of the service prices (`service.price`) across all *confirmed* and *completed* reservations for the current calendar month, scoped to the client's `clientId`.

---

## Technical Specifications

### 1. Cosmos DB Query Strategy
- Scoped strictly by partition key `/clientId` to preserve our $50/month infra ceiling (preventing cross-partition scans).
- The query will scan documents in the `reservations` container for the current client, filtering by:
  - `status` IN `["confirmed", "completed"]`
  - `dateTime` (or creation date) within the bounds of the current calendar month.
- Query:
  ```sql
  SELECT SUM(c.service.price) as totalRevenue 
  FROM c 
  WHERE c.clientId = @clientId 
    AND (c.status = "confirmed" OR c.status = "completed") 
    AND c.dateTime >= @startOfMonth 
    AND c.dateTime <= @endOfDelta
  ```

### 2. Frontend Widget Design
- A large, high-contrast visual tile positioned at the top of `/admin/bookings`.
- Displays: "Booked this month: **$XX.XX**" (with appropriate local currency symbol € / $ / COP based on the client's market setting).
- Subtext: "You are ROI Positive!" or "Generates value for your business".

---

## Requirements

### 1. Backend Endpoint / Aggregation
- [ ] Create a lightweight API / Azure Function or Route Handler endpoint `GET /api/admin/metrics/revenue` (or augment existing GET reservations metadata).
- [ ] Implement the Cosmos DB query scoped by partition key `clientId`.
- [ ] Format the return value: `{ totalRevenue: number, currency: string }`.

### 2. Admin UI Widget
- [ ] Add the KPI tile at the top of `/admin/bookings`.
- [ ] Style it beautifully using Tailwind (e.g. emerald/green accents, prominent number, clear typography).
- [ ] Format the numeric total as a currency string based on the client's market (e.g., `€195.00` for ES, `250,000 COP` for CO, `$250.00` default).
- [ ] Load the KPI data asynchronously with a clean skeleton loading state.

---

## Files touched

| Area | Paths |
|---|---|
| Admin Web App | `app/admin/bookings/page.tsx` (modified) |
| KPI Component | `components/admin/MonthlyRevenueTile.tsx` (new) |
| Azure Functions / API | `azure-functions/admin/getMonthlyRevenue.ts` (new) |

---

## Out of scope

- Advanced analytics dashboards (historical charts, comparisons, page views, etc. — CPO mandates "No dashboard sprawl").
- Bookings tax accounting or invoicing files.

---

## Acceptance criteria

1. Navigating to `/admin/bookings` loads the revenue KPI tile at the top of the screen.
2. The tile displays the sum of `service.price` for all of the client's `confirmed` and `completed` reservations within the current calendar month only.
3. The total respects the client's local market currency (COP for CO clients, EUR for ES clients).
4. The database query is optimized, runs with a single partition read (via `clientId`), and operates with low RU usage.
