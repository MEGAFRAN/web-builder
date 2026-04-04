# Task: Build the About Page

## Goal
The About page builds the human case for choosing this client over a competitor. It must convey the team's credibility, the company's founding story or mission, and the values that differentiate how they work. For B2B clients especially, this page is often visited just before a contact form submission — it is the final trust checkpoint. The page should feel warm, personal, and credible without being self-indulgent.

## Route
`app/[[...slug]]/page.tsx` — slug resolves to `['about']`, representing the path `/about`. The Sanity page document should have `slug: "about"`.

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
| Sections    | StatsBar       | components/sections/StatsBar.tsx        |
| Sections    | LogoCloud      | components/sections/LogoCloud.tsx       |
| Sections    | CTA            | components/sections/CTA.tsx             |
| Content     | Heading        | components/content/Heading.tsx          |
| Content     | Text           | components/content/Text.tsx             |
| Content     | Image          | components/content/Image.tsx            |
| Content     | Avatar         | components/content/Avatar.tsx           |
| Content     | Badge          | components/content/Badge.tsx            |
| Data        | Card           | components/data/Card.tsx                |
| Inputs      | Button         | components/inputs/Button.tsx            |
| Navigation  | Footer         | components/navigation/Footer.tsx        |

## Page Layout & Section Order

1. **Navbar** — Sticky top navigation. "About" NavLink in active state.

2. **Breadcrumb** — "Home > About". Placed below Navbar inside a Container.

3. **Mission Section (Section + Container + Stack)** — Not a full Hero component (no primary CTA needed here). Use a Section with a Container and Stack to build a mission statement block: H1 Heading ("Who We Are" or the client's tagline), followed by a 3–4 sentence Text paragraph on the company's origin, mission, or core belief. Include one brand Image (team photo or office) beside or below the text. This section sets emotional tone, not conversion intent.

4. **StatsBar** — 3–4 milestone metrics that reinforce credibility: years in business, clients served, projects completed, team size. Placed after the mission statement to back the narrative with evidence.

5. **Divider**

6. **Values (Grid + Card)** — Three or four Cards, each representing a company value. Each Card: a short H3 Heading (the value name, e.g., "Transparency"), a Text description (2–3 sentences), and optionally a Badge for categorization. Two-column Grid on desktop, single-column on mobile.

7. **Divider**

8. **Team Section (Grid + Card + Avatar)** — One Card per team member. Each Card: Avatar (portrait photo, or initials fallback), Heading (name), Badge (job title/role), and a short Text bio (2 sentences). Three-column Grid on desktop. Keep bios concise — visitors scan team sections, they do not read them.

9. **LogoCloud** — "Partners & Certifications" or "As Featured In". Placed near the bottom of the page after team details because it functions as a final credibility stamp, not as a primary trust signal on this page (the team and mission carry that weight here).

10. **CTA** — Heading: "Ready to work with us?", Button: "Get in Touch". This should feel like a natural next step, not a hard sell. Use a muted or secondary background color rather than the loudest brand color.

11. **Footer** — Consistent full-width footer.

## UX Notes
- The About page follows the emotional arc: belief (mission) → evidence (stats) → proof of character (values) → proof of people (team) → external validation (logos) → invitation (CTA). Disrupting this order undermines the storytelling logic.
- Team Cards must include Avatar with a real photo as first priority. The Avatar's initials fallback is only acceptable when a photo is not available in Sanity. A team section with placeholder silhouettes reads as unfinished and damages trust.
- Keep team bios to 2 sentences maximum. The About page is not a CV repository. Long bios shift the page from "meet the team" to "here is our LinkedIn profiles" — different intent, worse UX.
- The StatsBar on this page serves a different psychological function than on the Homepage. On the Homepage it signals capability; here it signals reliability and longevity. Use metrics that speak to track record (years, client count) rather than scale.
- The CTA at the bottom of About should never be the same aggressive "Book Now" framing used elsewhere. Visitors on the About page are in a research mindset, not a decision mindset. Match the CTA tone to the visitor's mental state.

## Dev Notes
- Team member data should come from a dedicated Sanity document type (e.g., `teamMember`) with fields: `name`, `role`, `bio`, `photo` (Sanity image asset), `order` (integer for display ordering).
- Values should come from a Sanity block type (e.g., `valueCard`) with fields: `title`, `description`, `icon` (optional).
- The mission/intro section (section 3) does not use the Hero component from the registry — it is composed from Section + Container + Stack + Heading + Text + Image. Ensure PageRenderer supports this as a distinct Sanity block type (e.g., `missionBlock`).
- The LogoCloud on this page may show different logos than on the Homepage (partners vs. clients). Ensure the Sanity `logoCloud` block type supports a `context` or `label` field to differentiate instances.
- For SSG: statically generated with `slug: "about"`.
