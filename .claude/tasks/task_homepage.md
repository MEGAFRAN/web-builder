# Task: Build the Homepage

## Goal
The homepage is the primary entry point for every client site. Its purpose is to communicate the client's core value proposition immediately, establish trust through social proof and metrics, and drive the visitor toward a primary conversion action — whether that is booking a call, requesting a quote, or learning more about services. Every section must earn its position by moving the visitor one step closer to conversion.

## Route
`app/[[...slug]]/page.tsx` — slug resolves to `[]` (empty array), representing the root `/` path. The Sanity page document for this route should have `slug: ""`.

## Components to Use

| Role        | Component      | Path                                    |
|-------------|----------------|-----------------------------------------|
| Navigation  | Navbar         | components/navigation/Navbar.tsx        |
| Navigation  | NavLink        | components/navigation/NavLink.tsx       |
| Layout      | Section        | components/layout/Section.tsx           |
| Layout      | Container      | components/layout/Container.tsx         |
| Layout      | Stack          | components/layout/Stack.tsx             |
| Layout      | Divider        | components/layout/Divider.tsx           |
| Sections    | Hero           | components/sections/Hero.tsx            |
| Sections    | LogoCloud      | components/sections/LogoCloud.tsx       |
| Sections    | FeatureGrid    | components/sections/FeatureGrid.tsx     |
| Sections    | StatsBar       | components/sections/StatsBar.tsx        |
| Sections    | Testimonials   | components/sections/Testimonials.tsx    |
| Sections    | CTA            | components/sections/CTA.tsx             |
| Content     | Heading        | components/content/Heading.tsx          |
| Content     | Text           | components/content/Text.tsx             |
| Content     | Badge          | components/content/Badge.tsx            |
| Inputs      | Button         | components/inputs/Button.tsx            |
| Navigation  | Footer         | components/navigation/Footer.tsx        |

## Page Layout & Section Order

1. **Navbar** — Sticky top navigation. Logo left, primary NavLinks center or right, primary CTA Button ("Get a Quote" or "Contact Us") rightmost. Active NavLink state must reflect current page.

2. **Hero** — Full-viewport-height opening section. Contains: H1 Heading with the client's core value proposition (max 12 words), a supporting Text paragraph (2–3 sentences), and two Buttons — primary ("Get Started") and secondary ("See Our Work", ghost/outline style). Background may use a brand image via Image component if supplied by Sanity.

3. **LogoCloud** — Immediately below the Hero. Section background alternates (light grey or muted). Heading: "Trusted by leading brands". Displays 5–8 client/partner logos. This placement answers the visitor's first trust question before they scroll further.

4. **FeatureGrid** — Three or four-column grid of service highlights or product differentiators. Each cell: an icon or Image, a short Heading (H3), and a Text description (2 sentences max). Heading above the grid: "Why Choose Us" or equivalent client-specific label.

5. **StatsBar** — Full-width band with 3–4 key metrics (e.g., "250+ Projects Delivered", "98% Client Satisfaction", "12 Years Experience"). High-contrast background. No CTA — this section exists purely for credibility weight.

6. **Divider** — Thin visual separator before the Testimonials section.

7. **Testimonials** — Two or three customer quotes. Each uses Avatar (photo or initials fallback), Heading for the customer name, Badge for their company/role, and a Text block for the quote body. Section Heading: "What Our Clients Say".

8. **CTA** — Final conversion section before the footer. High-contrast background using the brand's primary or accent color. Heading: action-oriented (e.g., "Ready to Grow Your Business?"), Text: one supporting sentence, one primary Button ("Book a Free Call" or equivalent).

9. **Footer** — Full-width footer with grouped NavLinks (Services, Company, Legal), contact details, social icons if applicable, and copyright text via Text component.

## UX Notes
- The Hero must answer three questions in under 5 seconds: What is this? Who is it for? What should I do next? Keep headline copy ruthlessly short.
- LogoCloud directly below the Hero is intentional. Visitors decide within seconds whether to keep reading — social proof at this position reduces bounce before the page has made its full argument.
- The StatsBar uses quantitative proof after qualitative proof (features). This ordering moves from "what we do" to "how well we do it", which matches the natural evaluation sequence of a skeptical visitor.
- The final CTA must contrast visually with every section above it so it reads as a distinct destination, not more content. Use the primary or accent CSS variable for its background.
- Limit the homepage to one primary CTA Button per section. Two competing CTAs on the same section (e.g., "Buy Now" and "Learn More" at equal visual weight) violates Hick's Law and increases decision paralysis.

## Dev Notes
- The Sanity page document for the homepage should have `slug: ""` so `generateStaticParams` returns `{ slug: [] }`, which Next.js maps to the root path `/`.
- All section content (headlines, body copy, logos, stats, testimonial quotes) must be sourced from Sanity blocks and passed to `PageRenderer` as typed block props — no hardcoded strings in components.
- The Navbar and Footer are likely rendered outside `PageRenderer` (e.g., in a client-specific layout wrapper or injected by `PageRenderer` as special block types). Confirm this pattern with the existing `PageRenderer` implementation before building.
- For SSG, `generateStaticParams` already handles all slugs. No additional dynamic routing is needed for this page.
- Ensure the Hero's primary Button links to a Sanity-configurable URL so different clients can point it to different conversion destinations.
