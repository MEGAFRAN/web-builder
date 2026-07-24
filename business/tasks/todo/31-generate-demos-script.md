# Task: CSV → Batch Demo Site Generator (`scripts/generate-demos.mjs`) (T-D)

**Status:** Ready for development
**Priority:** High — core of the demo-first acquisition pipeline
**Owner:** devops
**Estimated scope:** Medium — 3 hours
**Depends on:** T-A (`29-template-surgery-repair-shop.md`), T-B (`30-static-priced-services-block.md`), T-C (`25-fix-deploy-blob-workflow.md`)
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

The acquisition motion is: build demo sites from the scraper CSV *before* sending any WhatsApp messages. The founder's first DM is "here's your live site" — not "can I have 30 minutes?" This script is the engine that makes that possible.

The script must be:
- **Idempotent:** Re-running on the same CSV overwrites cleanly. No timestamps, no random seeds, no appends. The founder will re-run this constantly.
- **Sandboxed:** Writes only to `config/clients/demo-*/` and `.demo-staging/`. Any write outside those paths is a bug.
- **Serial:** At 9.8 seconds per build, 50 demos takes under 10 minutes. Do not build parallelization or a worker pool — the module-level caches in the platform are keyed per-process and need auditing under concurrency for zero real gain.
- **Lead-filtered:** The scraper CSV may contain low-quality entries. The script filters to leads with ≥20 Google reviews AND ≥4.0 rating before generating any site.

---

## Technical Specifications

### Pipeline (per CSV row, serial)

```
leads.csv
  → parse rows
  → filter: reviews >= 20 AND rating >= 4.0
  → slugify business name → demo-{slug}
  → copy config/templates/cell-phone-repair-shop/ → config/clients/demo-{slug}/
  → substitute {{placeholders}} from CSV columns + defaults table
  → validate against config/schemas/ via ajv (fail-fast per client, skip on error + log)
  → CLIENT_ID=demo-{slug} BASE_PATH=/{slug} npm run build:blob
  → move out/ → .demo-staging/{slug}/
```

### CSV column mapping

The scraper CSV is expected to export at minimum:

| CSV column | Template placeholder | Fallback if missing |
|---|---|---|
| `name` | `{{businessName}}` | Required — skip row |
| `phone` | `{{phone}}`, `{{whatsapp}}` | Required — skip row |
| `address` | `{{address}}` | `"Consultar dirección"` |
| `city` | `{{city}}` | `"España"` |
| `hours` | `{{hours}}` | `"Lunes a viernes, 9:00–20:00"` |
| `rating` | Used for filter only | — |
| `reviews` | Used for filter only | — |
| `photo_url` | `{{heroImageUrl}}` | Default repair-shop stock photo URL |

If the CSV does not include `reviews` or `rating` columns, the script must log a warning and skip the filter (not silently pass all rows through). Document this as an open dependency on the scraper export format (see U3 in the meeting summary).

### Placeholder substitution rules

- Substitute all `{{placeholder}}` occurrences in all JSON files under the cloned client directory.
- Use a simple regex replace — no template engine required.
- If a placeholder has no value and no fallback, log a warning and use an empty string (do not throw).
- WhatsApp number: strip all non-digit characters from `{{phone}}` to build the `wa.me` URL. E.g., `+34 612 345 678` → `34612345678`.

### Slug generation

```js
const slug = name
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const clientId = `demo-${slug}`;
```

Enforce a max slug length of 40 characters (truncate before the final replace).

### Write sandbox enforcement

At script startup, resolve the absolute paths of `config/clients/` and `.demo-staging/` and store them. Before any file write, assert that the target path starts with one of those two prefixes. If not, throw immediately and abort. This is what protects paying client configs from batch job corruption.

### Output

After all rows are processed, print a summary table:

```
Generated: 47 demo sites
Filtered out: 12 (low reviews/rating)
Skipped (missing required fields): 3
Errors (build failed): 1
  - demo-reparaciones-garcia: build exited with code 1
Output: .demo-staging/
```

---

## Requirements

- [ ] Script reads a CSV file path from CLI arg: `node scripts/generate-demos.mjs leads.csv`
- [ ] Parses CSV (use `csv-parse` or built-in `node:readline` — prefer no new deps if feasible).
- [ ] Filters rows: skip if `reviews < 20` OR `rating < 4.0`. Log filtered rows.
- [ ] Skips rows missing `name` or `phone`. Logs skipped rows.
- [ ] Slugifies business name → `demo-{slug}` (max 40 chars after `demo-`).
- [ ] Copies `config/templates/cell-phone-repair-shop/` → `config/clients/demo-{slug}/` (idempotent overwrite).
- [ ] Substitutes all `{{placeholders}}` in all JSON files.
- [ ] Strips non-digits from phone for WhatsApp URL.
- [ ] Validates each config with `npm run validate:client demo-{slug}` (or inline ajv call). Skips and logs on validation error.
- [ ] Runs `CLIENT_ID=demo-{slug} BASE_PATH=/{slug} npm run build:blob` serially.
- [ ] Moves `out/` → `.demo-staging/{slug}/` after each successful build.
- [ ] Write sandbox: asserts all writes are under `config/clients/demo-*/` or `.demo-staging/`.
- [ ] Prints summary table at the end.
- [ ] Script is idempotent: re-running produces byte-identical configs and overwrites cleanly.

---

## Files touched

| Area | Paths |
|---|---|
| New script | `scripts/generate-demos.mjs` (new) |
| Gitignore | `.gitignore` (add `.demo-staging/` if not present) |

---

## Out of scope

- Uploading demos to Azure Storage (that is Task T-E scope).
- Any changes to templates, components, or schemas.
- Parallelization.

---

## Acceptance criteria

1. `node scripts/generate-demos.mjs sample-leads.csv` (with a 5-row test CSV) generates 5 demo client configs under `config/clients/demo-*/` and 5 built sites under `.demo-staging/`.
2. A row with `reviews < 20` is filtered out and logged.
3. A row with a missing `name` is skipped and logged.
4. Re-running the script on the same CSV produces identical configs (idempotency check: `git diff` shows no changes to existing demo configs after re-run).
5. The script does not write to any path outside `config/clients/demo-*/` or `.demo-staging/`.
6. A build failure on one row does not abort the entire run — it logs the error and continues.
