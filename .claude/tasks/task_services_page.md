# Task: Build the Services Page

## Goal
The Services page must clearly enumerate what the client offers, differentiate between service types, and give the visitor enough detail to self-qualify. By the end of the page, a visitor should know whether the client's services match their need and should feel confident enough to make contact. The page functions as both an education tool and a pre-qualification filter.

## Route
`app/[[...slug]]/page.tsx` — slug resolves to `['services']`, representing the path `/services`. The Sanity page document should have `slug: "services"`.

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
| Sections    | Hero           | components/sections/Hero.tsx            |
| Sections    | FeatureGrid    | components/sections/FeatureGrid.tsx     |
| Sections    | CTA            | components/sections/CTA.tsx             |
| Sections    | FAQ            | components/sections/FAQ.tsx             |
| Content     | Heading        | components/content/Heading.tsx          |
| Content     | Text           | components/content/Text.tsx             |
| Content     | Badge          | components/content/Badge.tsx            |
| Content     | Image          | components/content/Image.tsx            |
| Data        | Card           | components/data/Card.tsx                |
| Data        | List           | components/data/List.tsx                |
| Inputs      | Button         | components/inputs/Button.tsx            |
| Navigation  | Footer         | components/navigation/Footer.tsx        |

## Page Layout & Section Order

1. **Navbar** — Same sticky top navigation as all pages. The "Services" NavLink should render in its active/highlighted state on this page.

2. **Breadcrumb** — Immediately below the Navbar, inside a Container. Path: "Home > Services". Provides wayfinding orientation for users arriving from search or deep links.

3. **Hero** — Reduced height compared to the homepage (not full viewport). Heading (H1): "Our Services" or a more evocative client-specific label. Supporting Text: 2 sentences describing the client's service philosophy or breadth. One primary Button ("Talk to Us") — no secondary CTA at this level.

4. **FeatureGrid** — High-level service category overview. Three or four columns, each cell representing one service category. Each cell: a short H3 Heading, a 1-sentence Text summary, and a Badge indicating category type (e.g., "Design", "Strategy", "Development"). This section answers "what do you offer?" at a glance.

5. **Divider** — Visual break before individual service Cards.

6. **Service Cards (Grid + Card)** — One Card per distinct service offering. Each Card contains: an Image (illustration or icon), H3 Heading (service name), Text (3–4 sentence description), a List of 3–5 deliverables or inclusions, and a secondary Button ("Learn More" or "Request This Service"). Cards arranged in a 2- or 3-column Grid, responsive to single column on mobile.

7. **FAQ** — 4–6 questions addressing common pre-sales objections specific to the client's service domain (e.g., "How long does a project take?", "Do you work with small businesses?"). Placed after the service detail Cards because visitors who read this far are seriously evaluating — FAQ removes the last friction before contact.

8. **CTA** — Final conversion push. Heading: "Not sure which service fits?", Text: "Let's talk — we'll help you find the right solution.", Button: "Book a Free Consultation". Accent background color.

9. **Footer** — Full-width footer consistent with all other pages.

## UX Notes
- The Breadcrumb is mandatory on this page. Users frequently arrive from Google with no Homepage context. Breadcrumb tells them where they are within the site hierarchy without requiring them to visit the homepage first (WCAG 2.4.8 Location, best practice).
- The FeatureGrid overview before the detailed Cards applies the progressive disclosure principle: give the visitor the map before the territory. Scanning 4 category tiles takes 3 seconds; reading 8 Cards takes 3 minutes. Let visitors decide what to read deeply.
- The List component inside each Card for deliverables is deliberate. Bullet points inside prose-heavy Cards break up visual density and let skimmers extract value without reading full paragraphs.
- FAQ placement after service Cards — not at the top — ensures it serves visitors who are genuinely evaluating rather than acting as a clutter-laden intro for visitors who just want to browse.
- Each Card's Button should link to either a dedicated service detail page (if those exist) or pre-populate the contact form with the service name as a subject. Never link to a generic contact page without context passing.

## Dev Notes
- Service data should come from a Sanity block type (e.g., `serviceCard` block) with fields: `title`, `description`, `deliverables` (array of strings), `image`, `ctaLabel`, `ctaHref`.
- The FAQ block should source questions and answers from a Sanity `faqBlock` type, not hardcoded content.
- The Badge on each FeatureGrid cell should display a Sanity-configured category label — allow clients to define their own service categories.
- For SSG: this page is statically generated via `generateStaticParams` with `slug: "services"`. No dynamic params needed.
- If individual service detail pages are added later, the Card Button's `ctaHref` should point to `/services/[service-slug]`. Plan the Sanity schema with a `slug` field on service documents from the start.
