# Task: Build the Testimonials / Reviews Page

## Goal
The Testimonials page consolidates all social proof in one place for visitors who need extensive reassurance before committing. Unlike the Homepage where testimonials are a section among many, here they are the entire product. The page must feel credible, varied, and scannable — a mix of formats (quotes, attributed sources) that makes the volume and diversity of positive feedback immediately apparent.

## Route
`app/[[...slug]]/page.tsx` — slug resolves to `['testimonials']`, representing the path `/testimonials`. The Sanity page document should have `slug: "testimonials"`.

## Components to Use

| Role        | Component      | Path                                    |
|-------------|----------------|-----------------------------------------|
| Navigation  | Navbar         | components/navigation/Navbar.tsx        |
| Navigation  | NavLink        | components/navigation/NavLink.tsx       |
| Navigation  | Breadcrumb     | components/navigation/Breadcrumb.tsx    |
| Layout      | Section        | components/layout/Section.tsx           |
| Layout      | Container      | components/layout/Container.tsx         |
| Layout      | Grid           | components/layout/Grid.tsx              |
| Layout      | Stack          | components/layout/Stack.tsx             |
| Layout      | Divider        | components/layout/Divider.tsx           |
| Sections    | Testimonials   | components/sections/Testimonials.tsx    |
| Sections    | StatsBar       | components/sections/StatsBar.tsx        |
| Sections    | LogoCloud      | components/sections/LogoCloud.tsx       |
| Sections    | CTA            | components/sections/CTA.tsx             |
| Content     | Heading        | components/content/Heading.tsx          |
| Content     | Text           | components/content/Text.tsx             |
| Content     | Avatar         | components/content/Avatar.tsx           |
| Content     | Badge          | components/content/Badge.tsx            |
| Content     | Alert          | components/content/Alert.tsx            |
| Data        | Card           | components/data/Card.tsx                |
| Inputs      | Button         | components/inputs/Button.tsx            |
| Navigation  | Footer         | components/navigation/Footer.tsx        |

## Page Layout & Section Order

1. **Navbar** — Sticky. "Testimonials" or "Reviews" NavLink in active state.

2. **Breadcrumb** — "Home > Testimonials".

3. **Page Header (Section + Container + Stack)** — H1 Heading: "What Our Clients Say". Supporting Text: 1 sentence framing the collection (e.g., "Real feedback from real clients — unedited and unfiltered."). This copy directly addresses the visitor's implicit skepticism that curated testimonials are cherry-picked.

4. **StatsBar** — Aggregate proof metrics: total number of reviews, average satisfaction score, NPS score, or years of consistent ratings. E.g., "120+ Reviews", "4.9 / 5 Average Rating", "100% Would Recommend". This anchors the qualitative testimonials that follow with quantitative weight.

5. **Testimonials (featured)** — Use the Testimonials section component for 3–5 highlighted, high-impact testimonials. Each entry: Avatar (client photo), Heading (client name), Badge (company and role), Text (full quote). These are the "hero" testimonials — longest, most specific, most outcome-focused. Place them in the primary reading path (center of page, high contrast section background).

6. **Divider**

7. **Extended Testimonials Grid (Grid + Card)** — A denser grid (3 columns desktop, 2 tablet, 1 mobile) of shorter testimonial Cards. Each Card: Avatar, Heading (name), Badge (role/company), Text (quote, 1–3 sentences). This section handles volume — showing breadth of satisfied clients. Cards should be visually lighter than the featured Testimonials above to maintain clear visual hierarchy.

8. **Alert** — Optional. If the client has a Google, Trustpilot, or Clutch review badge, use an Alert component in an informational style to display "Verified reviews from [Platform]" with a link to the external source. This addresses the credibility gap that self-curated testimonials always carry.

9. **LogoCloud** — "Clients Who Trust Us" — logos of companies whose representatives have given testimonials. Connects the quotes above to recognizable brand names, amplifying credibility.

10. **CTA** — Heading: "Convinced? Let's talk.", Button: "Contact Us Today". Keep it direct — visitors who have read an entire testimonials page are high-intent.

11. **Footer** — Consistent full-width footer.

## UX Notes
- Separating "featured" testimonials (long-form, prominent) from "extended" testimonials (short-form, dense grid) applies progressive disclosure: the best evidence is immediately visible, and the full body of evidence is available for visitors who need more convincing.
- Every testimonial must have a real name and a company/role Badge. Anonymous testimonials ("Happy Customer") have near-zero credibility. If a client cannot attribute a testimonial, it should not appear on this page.
- The Avatar component is load-bearing on this page. A grid of 15 testimonials with only initials as avatars looks unfinished. Prioritize sourcing real client photos for at least the 5 featured testimonials.
- The StatsBar at the top sets a quantitative anchor. Once a visitor sees "4.9/5 from 120 reviews", every individual quote they read is interpreted in that frame. Without the anchor, they read each quote in isolation and discount it.
- Avoid organizing testimonials by service category on this page. Category filtering adds interface complexity and implies some categories have better results than others. Let the volume speak for itself.

## Dev Notes
- Testimonials should come from a Sanity document type (e.g., `testimonial`) with fields: `authorName`, `authorRole`, `authorCompany`, `authorPhoto` (Sanity image), `quote`, `featured` (boolean — controls whether it appears in the featured Testimonials section or only in the extended grid), `publishedAt`.
- The `featured` boolean in Sanity allows editors to promote specific testimonials to the top section without developer involvement.
- The Alert component for external review platforms should be conditionally rendered: only show it if the client's config (from `getClientConfig`) includes an `externalReviewUrl` and `externalReviewPlatform` field. Add these optional fields to the client config schema.
- For SSG: statically generated with `slug: "testimonials"`. All testimonial data fetched at build time.
- LogoCloud on this page should source from the same Sanity `logoCloud` block as elsewhere, but with a distinct `context` value (e.g., `"testimonials"`) so editors can configure different logo sets per placement.
