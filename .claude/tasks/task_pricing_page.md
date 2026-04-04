# Task: Build the Pricing Page

## Goal
The Pricing page must answer the visitor's most direct question — "What does it cost, and what do I get?" — with the least possible friction. It must present tiers clearly, make the recommended option visually obvious, neutralize price objections through value framing and FAQ, and close with a low-risk CTA. Poor pricing page design is one of the highest-impact causes of conversion drop-off; clarity and confidence are the only design values that matter here.

## Route
`app/[[...slug]]/page.tsx` — slug resolves to `['pricing']`, representing the path `/pricing`. The Sanity page document should have `slug: "pricing"`.

## Components to Use

| Role        | Component      | Path                                    |
|-------------|----------------|-----------------------------------------|
| Navigation  | Navbar         | components/navigation/Navbar.tsx        |
| Navigation  | NavLink        | components/navigation/NavLink.tsx       |
| Navigation  | Breadcrumb     | components/navigation/Breadcrumb.tsx    |
| Layout      | Section        | components/layout/Section.tsx           |
| Layout      | Container      | components/layout/Container.tsx         |
| Layout      | Stack          | components/layout/Stack.tsx             |
| Layout      | Divider        | components/layout/Divider.tsx           |
| Sections    | PricingTable   | components/sections/PricingTable.tsx    |
| Sections    | Testimonials   | components/sections/Testimonials.tsx    |
| Sections    | FAQ            | components/sections/FAQ.tsx             |
| Sections    | CTA            | components/sections/CTA.tsx             |
| Content     | Heading        | components/content/Heading.tsx          |
| Content     | Text           | components/content/Text.tsx             |
| Content     | Badge          | components/content/Badge.tsx            |
| Content     | Alert          | components/content/Alert.tsx            |
| Data        | List           | components/data/List.tsx                |
| Inputs      | Button         | components/inputs/Button.tsx            |
| Navigation  | Footer         | components/navigation/Footer.tsx        |

## Page Layout & Section Order

1. **Navbar** — Sticky. "Pricing" NavLink in active state.

2. **Breadcrumb** — "Home > Pricing".

3. **Page Header (Section + Container + Stack)** — H1 Heading: "Simple, Transparent Pricing". Supporting Text: 1–2 sentences (e.g., "No hidden fees. No long-term contracts. Cancel any time."). This copy pre-empts the three most common pricing page anxieties in a single statement. Follow with an optional Badge: e.g., "14-Day Free Trial" or "No Credit Card Required" — only if the client offers this.

4. **Alert** — Optional but high-value. Use if the client has a current promotion or introductory offer. Alert variant: informational or success (e.g., "Limited time: 20% off annual plans through April 2026."). Position directly below the header, above the PricingTable, so it is seen before the visitor evaluates price. If no promotion exists, omit this component entirely.

5. **PricingTable** — The focal section of the page. Displays 2–4 pricing tiers side by side. The recommended/most popular tier must be visually distinguished: use a Badge ("Most Popular" or "Best Value") and a higher-contrast card background. Each tier: a Heading (plan name), a prominent price display (use Heading at large size for the price figure), a Text subtitle (billing cadence, e.g., "per month, billed annually"), a List of included features (5–8 items), and a Button ("Get Started" for the recommended tier — primary variant; "Choose Plan" for others — secondary variant). Do not use the Table component here — PricingTable is the correct registry component for this layout.

6. **Divider**

7. **Testimonials** — 2–3 testimonials specifically about value and ROI rather than general satisfaction. Filter for quotes that mention price, results, or return on investment (e.g., "We made back our investment in the first month."). Section Heading: "What clients say about the value". Placing testimonials directly below the PricingTable addresses price shock at exactly the moment it occurs.

8. **FAQ** — 5–7 questions that address pricing-specific objections: "What's included in the [plan name] plan?", "Can I switch plans later?", "What happens when my trial ends?", "Do you offer discounts for nonprofits or startups?", "What payment methods do you accept?". This FAQ must be placed after the PricingTable (not before) because the questions only become relevant once the visitor has seen the prices.

9. **CTA** — Final section. Heading: "Still have questions?", Text: "Our team can help you pick the right plan.", two Buttons side by side: primary "Talk to Sales" and secondary "Start Free Trial" (or equivalent). Offering a no-commitment path alongside a sales path accommodates both self-serve and assisted purchase preferences.

10. **Footer** — Consistent full-width footer.

## UX Notes
- The PricingTable's visual hierarchy must make the recommended tier impossible to miss. If every tier looks the same, visitors default to the cheapest option (anchoring bias) or the most expensive (perceived quality signal). A visually elevated "Most Popular" tier steers visitors toward the option the client most wants to sell.
- Testimonials placed directly below the PricingTable (not at the top, not at the bottom near the CTA) are specifically placed to counteract price objection at the moment it arises. This is the single highest-leverage positioning decision on this page.
- The FAQ on this page must answer questions a paying customer would ask, not questions a first-time visitor would ask. "What is your product?" does not belong here. "What happens if I exceed my usage limit?" does.
- Never show crossed-out "original" prices unless the discount is real and current. False urgency (fake strikethroughs) erodes trust with sophisticated B2B buyers.
- The dual CTA at the bottom ("Talk to Sales" + "Start Free Trial") is the one place on the page where two Buttons are justified — both options move toward the same goal (acquisition) via different paths, so it is a parallel choice, not a conflicting one.

## Dev Notes
- PricingTable data should come from a Sanity document type (e.g., `pricingTier`) with fields: `name`, `price` (number), `billingCadence` (string), `features` (array of strings for the List), `recommended` (boolean — controls the visual highlight and "Most Popular" Badge), `ctaLabel`, `ctaHref`.
- The Alert for promotions should be conditionally rendered based on a Sanity `promotionBanner` block type with fields: `message`, `expiresAt` (date). At build time, only render the Alert if `expiresAt` is in the future relative to the build date. Since this is SSG, an expired promotion will persist until the next build — document this limitation for clients and recommend a manual redeploy on promotion expiry.
- Testimonials on this page should be filtered by a `context` or `tag` field in the Sanity `testimonial` document (e.g., `tags: ["pricing", "value"]`). Do not use the same testimonials as the Homepage — select specifically for ROI/value quotes.
- The PricingTable component must support a `recommended` prop per tier. Confirm this is implemented in `components/sections/PricingTable.tsx` before building the Sanity schema around it.
- For SSG: statically generated with `slug: "pricing"`. All pricing data fetched at build time. If pricing changes frequently, recommend ISR (Incremental Static Regeneration) with a short revalidation interval for this page specifically.
