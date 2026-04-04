# Task: Build the Case Studies Page

## Goal
The Case Studies page demonstrates the client's competence through real project outcomes. It is the most persuasive page for B2B buyers because it replaces claims with evidence. Visitors use this page to answer: "Have you done something like my project before, and what were the results?" The page must make it easy to scan available case studies, identify relevant ones by industry or service type, and click through to read details.

## Route
`app/[[...slug]]/page.tsx` — slug resolves to `['case-studies']`, representing the path `/case-studies`. The Sanity page document should have `slug: "case-studies"`.

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
| Sections    | CTA            | components/sections/CTA.tsx             |
| Content     | Heading        | components/content/Heading.tsx          |
| Content     | Text           | components/content/Text.tsx             |
| Content     | Image          | components/content/Image.tsx            |
| Content     | Badge          | components/content/Badge.tsx            |
| Data        | Card           | components/data/Card.tsx                |
| Inputs      | Button         | components/inputs/Button.tsx            |
| Navigation  | Footer         | components/navigation/Footer.tsx        |

## Page Layout & Section Order

1. **Navbar** — Sticky. "Case Studies" (or "Work") NavLink in active state.

2. **Breadcrumb** — "Home > Case Studies".

3. **Page Header (Section + Container + Stack)** — H1 Heading: "Our Work" or "Case Studies". Supporting Text: 1–2 sentences framing what the case studies demonstrate (e.g., "From strategy to execution — here's how we've helped businesses like yours."). No CTA here. This is an orientation section, not a conversion section.

4. **StatsBar** — 3 aggregate outcome metrics drawn from across all case studies (e.g., "45% Average Revenue Increase", "30+ Industries Served", "$2M+ in Client Revenue Generated"). These headline numbers prime the visitor to read the individual stories with a favorable frame.

5. **Divider**

6. **Case Study Cards (Grid + Card)** — One Card per case study. Each Card: a cover Image (project screenshot or branded graphic), a Badge for industry or service category (e.g., "E-commerce", "Branding"), an H3 Heading (client name or project title), a Text snippet (2–3 sentence outcome summary), and a Button ("Read Case Study") linking to the individual case study detail page. Cards arranged in a 2-column Grid on desktop, 1-column on mobile. Order: most recent or most impressive first.

7. **CTA** — Heading: "See yourself in one of these stories?", Text: "Let's write the next one together.", Button: "Start a Project". This CTA converts visitors who have just consumed proof — the highest-intent audience on the site.

8. **Footer** — Consistent full-width footer.

## UX Notes
- The StatsBar before the Cards is essential. It reframes the visitor's mindset from "show me what you've done" to "wow, they've done a lot." Without it, case study listings read like a portfolio dump. With it, they read like a track record.
- Every Card must include a Badge for industry or service type. Visitors self-select: a healthcare company wants to see healthcare case studies. Without category labels, they must read every headline to find relevant work — high cognitive load, high bounce risk.
- The Card image must be a real project visual, not a generic stock photo. If no image is available in Sanity for a case study, use a solid brand-colored placeholder with the client name as text — but this should be treated as a content gap to fix, not a permanent design choice.
- Cards should be ordered by recency or impact, not alphabetically. Alphabetical ordering signals no editorial judgment about quality.
- The CTA copy on this page is deliberately narrative ("write the next one together") rather than functional ("book a call"). Visitors in a case study reading mindset are engaged in a story — meet them where they are before shifting to transactional language.

## Dev Notes
- Case study data should come from a dedicated Sanity document type (e.g., `caseStudy`) with fields: `title`, `client`, `industry` (for Badge), `summary` (short), `coverImage`, `slug` (for the detail page link), `publishedAt`, `outcomes` (array of metric strings used for StatsBar aggregation).
- The individual case study detail page (`/case-studies/[slug]`) is a separate build task not covered by this file. However, the Card's Button must link to `/case-studies/[slug]` — ensure the Sanity schema includes a `slug` field on `caseStudy` documents from the start.
- The StatsBar metrics on this page should ideally be aggregated from case study outcome data in Sanity, or entered as a manually curated `statsBlock` document linked to this page.
- For SSG: `generateStaticParams` returns `{ slug: ['case-studies'] }`. Individual case study pages will require their own slug entries.
- If the number of case studies grows large (20+), consider a Sanity-configurable display limit with a "Load More" button — but this is a future enhancement. For initial build, render all case studies.
