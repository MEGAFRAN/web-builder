# Task: Cold-DM Outreach Tracking (Out-of-Codebase)

**Status:** Pending  
**Priority:** Medium — scheduled for M2 (operation startup)  
**Owner:** CEO / Operations  
**Estimated scope:** Small — operations spreadsheet setup, no codebase impact  
**Depends on:** None

---

## Context

To acquire our first 10 paying customers, we are relying strictly on founder-led cold DMs on Instagram followed by a 30-minute concierge onboarding discovery call. 

We must track our outreach metrics rigorously to:
- Compute conversion metrics.
- Enforce our Week 6 "Kill Switch" (pivot vertical if conversion is less than 1 paying client per 100 cold DMs).
- Identify which sub-niches (e.g. brow techs vs. nail techs) convert best.

To preserve 100% of our engineering focus on the platform, **this tracker is explicitly out-of-codebase**. We will not build a CRM feature inside the app. Instead, we will set up a lightweight tracker using a Google Sheet or Airtable.

---

## Tracker Specification

The tracker must contain the following fields:
- `instagram_handle`: String (e.g., `@sally_styling`)
- `dm_sent_at`: Date (when the first outreach message was sent)
- `replied_at`: Date (optional, when the client replied)
- `discovery_call_at`: Date (optional, when the 30-min onboarding call took place)
- `signup_at`: Date (optional, when they completed the trial sign-up)
- `paid_at`: Date (optional, when their trial expired and they successfully paid)
- `vertical_subniche`: Dropdown (e.g., `hair-stylist`, `nail-tech`, `brow-lash`, `barber`, `makeup-artist`)
- `notes`: Text (any relevant business info: pricing, booking details, website preferences)

---

## Requirements

### 1. Operations Tool Selection
- [ ] Select Google Sheets or Airtable for the tracker.
- [ ] Create the database or sheet structure with the fields listed above.
- [ ] Freeze headers, add coloring, and ensure data validation is set up on dates and the sub-niche dropdown.

### 2. Operational Metrics Calculations
- [ ] Embed simple formula columns to track conversion rates automatically:
  - **Response Rate**: `Count(replied_at) / Count(dm_sent_at)`
  - **Discovery Call Rate**: `Count(discovery_call_at) / Count(dm_sent_at)`
  - **Signup Rate**: `Count(signup_at) / Count(dm_sent_at)`
  - **Paying Conversion Rate**: `Count(paid_at) / Count(dm_sent_at)` (Must exceed 1% by Week 6 to pass the kill-switch threshold).

### 3. Shareability
- [ ] Share the tracking sheet with the executive team (CEO, CPO, CTO) to ensure alignment on lead volume and conversions.

---

## Files touched

None in the main repository codebase! This is a **purely operational task** to ensure zero-overhead focus.

---

## Out of scope

- Integrating any CRM or third-party lead tracking APIs (e.g. HubSpot, Salesforce).
- Writing scripts or extensions in the Google Sheet.
- Syncing this tracking sheet with our Cosmos DB container.

---

## Acceptance criteria

1. The tracking spreadsheet is set up and accessible to the team.
2. The columns match the specifications, including validation on the `vertical_subniche` column.
3. Formulations for key conversion rates are written and compute correctly as data is entered.
4. The CEO initiates recording data starting on day 1 of Milestone 2.
