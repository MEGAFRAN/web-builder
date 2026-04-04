# Task: Build the Contact Page

## Goal
The Contact page must remove every possible barrier between a motivated visitor and a submitted inquiry. Its design should be minimal: one clear form, supporting contact details, and just enough trust signals to reassure the visitor that their message will reach a real person. Every element that does not directly aid form completion is a distraction and should be omitted from this page.

## Route
`app/[[...slug]]/page.tsx` — slug resolves to `['contact']`, representing the path `/contact`. The Sanity page document should have `slug: "contact"`.

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
| Sections    | FAQ            | components/sections/FAQ.tsx             |
| Content     | Heading        | components/content/Heading.tsx          |
| Content     | Text           | components/content/Text.tsx             |
| Content     | Alert          | components/content/Alert.tsx            |
| Inputs      | ContactForm    | components/inputs/ContactForm.tsx       |
| Inputs      | Button         | components/inputs/Button.tsx            |
| Navigation  | Footer         | components/navigation/Footer.tsx        |

## Page Layout & Section Order

1. **Navbar** — Sticky. "Contact" NavLink in active state.

2. **Breadcrumb** — "Home > Contact".

3. **Page Header (Section + Container + Stack)** — H1 Heading: "Get in Touch" (or "Contact Us"). Supporting Text: 1–2 sentences setting expectation for response time (e.g., "We respond to all inquiries within 1 business day."). Response time expectation is a direct anxiety reducer — include it.

4. **Two-Column Layout (Grid)** — The core of the contact page. Left column (wider, approx 60%): the ContactForm component. Right column (narrower, approx 40%): a Stack of contact detail blocks, each consisting of a Heading (label, e.g., "Email", "Phone", "Office") and a Text (the actual value). Include the client's email address, phone number, and physical address if applicable. This layout keeps the form prominent (F-pattern reading places the left column in primary focus) while making alternative contact methods available without burying them.

5. **Alert** — Rendered conditionally below the form (same Section, below the Grid). Two states:
   - Success state: "Thank you — we'll be in touch within 1 business day." (success variant)
   - Error state: "Something went wrong. Please try again or email us directly at [email]." (error variant)
   The Alert must include the fallback email address in the error state so the user is never left without a path forward. Not visible on initial page load — controlled by form submission state.

6. **Divider** — Separates the form section from the FAQ below.

7. **FAQ** — 3–4 questions that reduce hesitation specific to the contact flow: "What happens after I submit?", "Do you take on small projects?", "How do I know if you're the right fit?". This FAQ is not about services — it is about the inquiry process itself. It belongs on this page because it addresses the final doubts a visitor has before submitting.

8. **Footer** — Consistent full-width footer.

## UX Notes
- The ContactForm is the primary action on this page. Nothing should compete with it visually. Do not add a CTA section, testimonials, or a FeatureGrid to this page — they dilute focus and increase the cognitive load at exactly the moment when the visitor is ready to act.
- The two-column layout with contact details in the right column satisfies visitors who prefer not to use a form (some users will only contact via direct email or phone). Providing both options on the same screen prevents them from abandoning the page to search for contact details elsewhere.
- The Alert component for form feedback is critical. Without visible success/error feedback, users who submit the form do not know if it worked. Re-submission of duplicate inquiries and support overhead both increase. This is a direct WCAG 4.1.3 (Status Messages) requirement.
- The form fields within ContactForm (name, email, message) must all have visible labels — not just placeholder text. Placeholder text disappears on focus and fails WCAG 3.3.2 (Labels or Instructions). Confirm ContactForm renders label elements, not placeholder-only inputs.
- Set the Submit Button to a loading/disabled state after click to prevent duplicate submissions. Error prevention is the most cost-effective UX strategy applied to form interaction.

## Dev Notes
- Use the ContactForm component directly — do not manually compose Input + Textarea + Button for this page. ContactForm is the registry's purpose-built solution for this exact use case.
- The ContactForm on this SSG platform cannot POST to a server route at build time. You will need a client-side form submission strategy. Options: (a) a Next.js API route (`app/api/contact/route.ts`) that the form POSTs to client-side, (b) a third-party form service (Formspree, Netlify Forms, etc.) configured per client. The chosen endpoint URL should come from the client config (`getClientConfig`) so each client routes to their own inbox.
- The Alert component must be conditionally rendered based on form state — it should not be visible on initial page load. Manage visibility with React state in a client component wrapper around the ContactForm and Alert.
- The ContactForm and Alert must be in a `'use client'` component since they depend on form interaction state. The rest of the page (Navbar, Header, FAQ, Footer) can remain server-rendered.
- FAQ content on this page should be a distinct Sanity `faqBlock` instance with `context: "contact"` so editors can manage contact-specific FAQ separately from the services FAQ.
- For SSG: statically generated with `slug: "contact"`. Form submission is handled client-side at runtime.
