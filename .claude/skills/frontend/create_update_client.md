# Skill: create_client

`create_client(requirements: string) returns ClientConfigFolder: JSON files under config/clients/{clientId}/`

## When to use

Use this skill when asked to create, provision, or onboard a new tenant/client site from an existing template under `config/templates/`.

Examples:
- "Create a client called Hair Salon from solo-beauty-pro"
- "Provision a new beauty salon tenant"
- "Add config/clients/acme-spa using the solo-beauty-pro template"

## Input

Collect or infer these values from the request. If missing, use reasonable defaults and state them in the output.

| Field | Required | Notes |
|---|---|---|
| `displayName` | yes | Human-readable business name (e.g. "Hair Salon") |
| `clientId` | yes | Kebab-case slug derived from name (e.g. `hair-salon`). Must match folder name. |
| `templateId` | yes | Template folder under `config/templates/` (e.g. `solo-beauty-pro`) |
| `ownerFirstName` | for beauty templates | Used in booking/testimonial copy |
| `primaryService` | for beauty templates | Main service offering |
| `address` | recommended | Street address for location/contact blocks |
| `phone` | recommended | Display format free; `tel:` hrefs must strip spaces |
| `bookingHoursWeekday` | for beauty templates | Weekday hours string |
| `customDomain` | recommended | Default: `{clientId}.com` |
| `vertical` | optional | Set from template when known (e.g. `beauty`) |

## Preconditions

Read before executing:
- `config/templates/{templateId}/client.json`
- `config/templates/{templateId}/pages/` (all page JSON files)
- `config/schemas/client.schema.json`
- `config/clients/{existing-client}/` — one existing client for conventions
- `__tests__/schemas-validation.test.ts` — validation expectations

Do **not** modify:
- `config/templates/` (templates stay generic with placeholders)
- `docs/agents/component-catalog.md`
- Block component source files

## Process

### Step 1 — Derive identifiers

1. Set `clientId` to lowercase kebab-case (letters, numbers, hyphens only).
2. Set `swaResourceName` to `swa-{clientId}`.
3. Set `customDomain` to `{clientId}.com` unless the user specifies otherwise.
4. Confirm `config/clients/{clientId}/` does not already exist. If it does, stop and ask whether to update or choose a new id.

### Step 2 — Copy and substitute template files

Create the client directory:

```
config/clients/{clientId}/
├── client.json
└── pages/
    └── index.json   (and any other pages the template provides)
```

Copy from `config/templates/{templateId}/` and replace **all** placeholder tokens with real values.

#### solo-beauty-pro placeholders

| Placeholder | Example substitution |
|---|---|
| `{{clientId}}` | `hair-salon` |
| `{{businessName}}` | `Hair Salon` |
| `{{customDomain}}` | `hair-salon.com` |
| `{{ownerFirstName}}` | `Emma` |
| `{{primaryService}}` | `Haircuts & Color` |
| `{{address}}` | `123 High Street, London` |
| `{{phone}}` | `+44 20 7946 0958` |
| `{{bookingHoursWeekday}}` | `9:00 AM - 6:00 PM` |

Replace placeholders in **both** `client.json` and every file under `pages/`.

#### Client file rules

- **Remove `placeholderCopy`** from client page blocks. That field is for templates only; real clients should not include it.
- Keep `template: "{templateId}"` in `client.json` so template merge still works for any pages the client does not override.
- Preserve theme, features, and block structure from the template unless the user asks to change them.
- For `tel:` links, use a normalized href (e.g. `tel:+442079460958`) while keeping human-readable display text in labels.
- Use client-specific image seeds in placeholder URLs when copying (e.g. `seed/hair-salon-hero/` instead of `seed/solo-beauty-hero/`).

#### Why pages must be copied

When `client.json` sets `"template": "solo-beauty-pro"`, the runtime merges template pages with client pages — client pages win by slug. Template files still contain `{{placeholders}}`. **A provisioned client must include substituted page files** (at minimum `pages/index.json`) or the live site will render raw placeholder tokens.

### Step 3 — Validate structure

#### client.json required fields

```json
{
  "clientId": "...",
  "displayName": "...",
  "customDomain": "...",
  "swaResourceName": "swa-...",
  "template": "...",
  "features": { "blog": false, "booking": true, "gallery": false, "menu": false },
  "theme": { /* preset OR explicit color fields — see client.schema.json */ }
}
```

Theme must satisfy `client.schema.json` `oneOf`:
- `{ "preset": "bold-restaurant" | "modern-minimal" | ... }`, **or**
- explicit fields: `primaryColor`, `accentColor`, `backgroundColor`, `fontHeading`, `fontBody`, `borderRadius`

#### solo-beauty-pro homepage block order

The homepage (`pages/index.json`) must use exactly these 8 block types in order:

1. `navbar`
2. `heroBlock`
3. `services`
4. `reservationBlock`
5. `testimonialsBlock`
6. `location`
7. `contactInfoBlock`
8. `footer`

Do not add block types outside the template's approved set unless the user explicitly requests customization beyond the starter template.

### Step 4 — Run validation

```bash
npm run test -- __tests__/schemas-validation.test.ts
npx tsc --noEmit 2>&1 | head -40
npm run lint
```

Fix any schema or type errors before reporting done.

The schema test automatically validates every `config/clients/*/client.json` against `client.schema.json`. Block schemas for template pages are covered by the solo-beauty-pro template test; when adding non-template blocks to a client page, validate each block against `config/schemas/blocks/{_type}.schema.json`.

### Step 5 — Preview locally

```bash
npm run dev {clientId}
```

This sets `CLIENT_ID={clientId}` via `scripts/run-next-dev.mjs`. Open the local URL and confirm substituted copy renders (no `{{...}}` tokens visible).

## Output

Report this summary when done:

```
Client created:     config/clients/{clientId}/
Template:           {templateId}
Display name:       {displayName}
Pages written:      pages/index.json (and others if applicable)
Schema validation:  passed
Type check:         passed
Preview command:    npm run dev {clientId}
Assumptions:        <any inferred defaults, e.g. owner name, address, phone>
```

## Reference client

See `config/clients/hair-salon/` — a complete solo-beauty-pro client with all placeholders substituted.

## Failure format

```
FAILED at step <N> — <step name>
Reason: <exact error>
Suggested fix: <one-line actionable hint>
```

## Edge cases

- **Ambiguous name** ("salon"): pick a reasonable `clientId` (e.g. `salon` or `janes-salon`), state the assumption, proceed.
- **clientId collision**: do not overwrite silently; ask or append a suffix (e.g. `hair-salon-2`).
- **Non-beauty template**: read that template's `client.json` and pages for its own placeholders and block set; do not assume solo-beauty-pro placeholders.
- **Partial override**: client can omit page files for slugs it does not customize; those slugs fall back to the template. For solo-beauty-pro onboarding, always ship a fully substituted `pages/index.json`.
- **Future automation**: `scripts/provision-client.mjs` (not yet implemented) will automate this copy-and-substitute flow; until then, create files manually following this skill.
