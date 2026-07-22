# Skill: create_template

`create_template(business_description: string) returns TemplateFiles: template.json + pages/index.json written to config/templates/<template-id>/`

## Input

1. `business_description`: any initial context the developer provided (may be empty)

## Preconditions

Read these files before proceeding — do not answer from memory:
- `docs/agents/component-catalog.md` — to select valid `_type` block values
- `config/schemas/client.schema.json` — to validate template.json fields and enums
- One existing template for structural reference (e.g. `config/templates/solo-beauty-pro/client.json` and `config/templates/solo-beauty-pro/pages/index.json`)

## Discovery Interview

Before designing anything, ask the developer these questions. Collect all answers before proceeding — do not skip questions or assume answers from the business type alone.

### Required questions

**Q1 — Business type**
What type of business is this template for?
(e.g., yoga studio, law firm, personal trainer, barbershop, tutoring center, auto repair shop)

**Q2 — Services**
List the core services or offerings.
(e.g., "haircuts, coloring, highlights" or "algebra tutoring, SAT prep, writing workshops")
Include typical price ranges if known — this informs whether a `pricingPageBlock` is appropriate.

**Q3 — Vertical**
Which vertical does this map to?
Options (from `client.schema.json`): `beauty` | `tutors` | `repair` | `yoga-pilates` | `general`
If unsure, suggest the closest match and confirm.

**Q4 — Primary conversion action**
What is the #1 thing a visitor should do on the homepage?
(e.g., book an appointment, call for a quote, fill in a contact form, browse a menu)
This determines which CTA and which booking/contact blocks to prioritize.

**Q5 — Features needed**
Which of these platform features should be enabled?
- `booking` — online appointment/reservation system
- `gallery` — photo gallery
- `menu` — service or product menu page
- `blog` — blog or news section

**Q6 — Pages**
Beyond the homepage, which pages does this business type typically need?
(e.g., services page, about/team page, contact page, pricing page, FAQ page, menu page)
List them — each becomes a separate page file under `pages/`.

**Q7 — Tone and visual style**
Describe the visual personality in 2–3 adjectives.
(e.g., "warm and cozy", "bold and energetic", "clean and professional", "elegant and premium")
This drives the theme preset and color palette recommendation.

**Q8 — Audience**
Who is the typical customer?
(e.g., local neighborhood clients, corporate B2B buyers, parents booking for children, fitness enthusiasts)
This shapes copy tone in placeholders and which social-proof blocks to include.

### Optional questions (ask if not obvious from Q1–Q8)

**Q9 — Solo operator vs. team**
Is this typically a single-person business (solo) or a team?
(determines whether `teamBlock` is appropriate)

**Q10 — Physical location**
Does this business have a physical address customers visit?
(determines whether `location` block with map embed is needed)

**Q11 — External reviews**
Does this business type commonly use Google, Yelp, or similar review platforms?
(determines `externalReviewUrl` / `externalReviewPlatform` fields in template.json)

---

## Process

After collecting all answers:

### Step 1 — Derive template identity
- Generate a `templateId` in kebab-case from the business type (e.g., `yoga-studio`, `law-firm-solo`)
- Confirm it does not conflict with an existing directory under `config/templates/`

### Step 2 — Select theme preset
Map the tone (Q7) to the closest existing preset from `client.schema.json`:
- `bold-restaurant` → bold, vibrant, food/hospitality
- `modern-minimal` → clean, professional, tech/services
- `professional-law` → formal, conservative, legal/finance
- `vibrant-retail` → energetic, colorful, retail/fitness
- `default` → neutral fallback

If no preset fits well, recommend custom token overrides (primaryColor, accentColor, fontHeading, fontBody, borderRadius) and note it as a **Gap**.

### Step 3 — Design homepage block sequence
Using answers from Q4, Q5, Q7, Q8, Q9, Q10, select blocks from the component catalog in this priority order:

1. `navbar` — always first (chrome)
2. `heroBlock` — always second (large imagery + primary CTA)
3. Primary conversion block:
   - booking primary → `services` (catalog with booking CTAs)
   - quote/call primary → `contactInfoBlock` or `contactFormSection`
   - browse primary → `featureGridBlock` or `servicesPageBlock`
4. Social proof — `testimonialsBlock` if audience is consumer (B2C); `statsBlock` or `logoCloud` if B2B
5. Supporting blocks as needed:
   - physical location → `location`
   - team-based → `teamBlock`
   - FAQ expected → `faqBlock`
   - mid-page conversion push → `ctaBlock`
6. `footer` — always last (chrome)

Apply the Visual Hierarchy rule: higher-conversion blocks go above the fold or immediately after the hero. Never propose two adjacent blocks with identical background treatment.

### Step 4 — Define placeholder variables
Every template must use these standard placeholders where applicable:
- `{{businessName}}` — display name of the business
- `{{ownerFirstName}}` — first name of the owner (solo operators)
- `{{primaryService}}` — the main service offered (use for meta descriptions and hero subtext)
- `{{address}}` — physical address (if Q10 = yes)
- `{{phone}}` — contact phone number
- `{{bookingHoursWeekday}}` — weekday availability string (if booking = true)

Add business-type-specific placeholders as needed (e.g., `{{teamSize}}`, `{{yearsExperience}}`, `{{serviceArea}}`). Document each new placeholder in a comment within the JSON or in the skill output.

### Step 5 — Write template.json
Write to `config/templates/<template-id>/template.json` with this structure:
```json
{
  "templateId": "<template-id>",
  "displayName": "<Human-Readable Name>",
  "description": "<one sentence: what business type, what pages, what key features>",
  "defaultThemePreset": "<preset from Step 2>",
  "defaultFeatures": {
    "blog": <boolean>,
    "booking": <boolean>,
    "gallery": <boolean>,
    "menu": <boolean>
  },
  "header": {
    "logo": "<Business Type> — replace with client name",
    "ctaLabel": "<primary CTA label from Q4>",
    "ctaAction": "<href — anchor or page slug>",
    "links": [ ...nav links matching pages from Q6... ]
  },
  "footer": {
    "copyright": "<Business Type>. All rights reserved.",
    "columns": [
      { "title": "Navigation", "links": [...] },
      { "title": "Contact", "links": [] }
    ]
  }
}
```

### Step 6 — Write pages/index.json
Write to `config/templates/<template-id>/pages/index.json` with the block sequence from Step 3.

Each block must:
- Use a valid `_type` from `docs/agents/component-catalog.md`
- Include `placeholderCopy` with a one-line description of every text field that will be replaced during provisioning
- Use `{{placeholder}}` syntax for all variable content

### Step 7 — Write additional pages (if Q6 listed any)
For each additional page from Q6, write `config/templates/<template-id>/pages/<slug>.json`.
Use the same block-selection logic as Step 3 applied to that page's specific goal.

---

## Output

Success:
```
Template ID: <template-id>
Files written:
  - config/templates/<template-id>/template.json
  - config/templates/<template-id>/pages/index.json
  - config/templates/<template-id>/pages/<slug>.json  (one per additional page)

Block sequence (homepage):
  1. navbar
  2. heroBlock — <rationale>
  3. <block> — <rationale>
  ...
  N. footer

Theme: <preset or custom tokens>
Rationale: <1–2 sentences on key design decisions>

Custom placeholders introduced:
  - {{placeholder}} — <what it represents>

Gaps:
  <any user needs not addressable by current registry components>

Next Step: <one action for nextjs-frontend-developer — e.g., "validate both files against config/schemas/ and run npm run generate:component-catalog if any new block schemas were added">
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error, e.g., template-id already exists, vertical enum not recognized>
Suggested fix: <one-line actionable hint>
```
