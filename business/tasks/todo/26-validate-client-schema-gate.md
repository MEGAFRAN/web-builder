# Task: Offline `validate:client` Schema Gate (T-G)

**Status:** Ready for development
**Priority:** High — required before agent-driven JSON edits are safe
**Owner:** nextjs-frontend-developer
**Estimated scope:** Medium — 3 hours
**Depends on:** None (can run in parallel)
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

Site updates for paying clients work without an admin panel: the founder sends a WhatsApp message, an agent edits a JSON config file, and a redeploy runs. This is the update loop.

The problem: right now `npm run validate` runs lint, tests, and `tsc` — none of which validate a client config against the block schemas. An agent can write a structurally invalid `pages/index.json`, pass all existing validation, trigger a build, and ship a broken page with no feedback. At 10 clients, one silent corruption per update request is one too many.

`ajv` is already available as a transitive dependency. The only thing needed is a script that uses it.

This script is also used by `provision-client.mjs` (Task T-E) to fail-fast on bad configs before build and deploy.

---

## Technical Specifications

### CLI usage

```bash
npm run validate:client <clientId>
# e.g.:
npm run validate:client demo-reparaciones-garcia
npm run validate:client tienda-real
```

With no argument: validate all configs under `config/clients/`:
```bash
npm run validate:client
```

### What it validates

For each client config under `config/clients/{clientId}/`:

1. **`client.json`** against `config/schemas/client.schema.json`
2. **Every page file** under `pages/*.json` — each block item in the page's block array is validated against its corresponding schema in `config/schemas/blocks/{_type}.schema.json`
3. **Missing block schemas** are treated as warnings (not errors), since not all blocks have individual schema files today. Log them but do not fail.

### Error output format

Errors are printed as structured, human-readable lines:

```
ERROR config/clients/demo-garcia/pages/index.json
  Block[2] (heroBlock): .heading — must be string, got number
  Block[2] (heroBlock): .unknownField — additional property not allowed

ERROR config/clients/demo-garcia/client.json
  .phone — required property missing

WARN  config/clients/demo-garcia/pages/index.json
  Block[4] (customBlock): no schema found at config/schemas/blocks/customBlock.schema.json

Summary: 2 errors, 1 warning across 1 client
```

Exit code 0 = no errors. Exit code 1 = one or more errors. Warnings do not affect exit code.

### npm script

Add to `package.json`:
```json
"validate:client": "node scripts/validate-client.mjs"
```

### Integration with provision-client.mjs

`provision-client.mjs` must call `validate:client` on the new config before triggering `npm run build:blob`. If validation fails, abort provisioning and print errors.

### Integration with CI

Add a CI step to `.github/workflows/` that runs `npm run validate:client` with no arguments on every push. This ensures no PR can land a broken client config. The step should run after `npm run validate` (existing lint/types/tests).

---

## Requirements

- [ ] Write `scripts/validate-client.mjs` using `ajv` (or `ajv-formats` if needed for format validation).
- [ ] Validates `client.json` against `config/schemas/client.schema.json`.
- [ ] Validates each page block against `config/schemas/blocks/{_type}.schema.json` (warns if schema not found).
- [ ] Accepts optional `<clientId>` CLI arg; defaults to all clients.
- [ ] Structured error output: file path, block index, block type, JSON pointer, message.
- [ ] Exit code 0 on success, 1 on any error.
- [ ] Add `"validate:client": "node scripts/validate-client.mjs"` to `package.json`.
- [ ] Add CI step to run `npm run validate:client` on every push.

---

## Files touched

| Area | Paths |
|---|---|
| New script | `scripts/validate-client.mjs` (new) |
| Package scripts | `package.json` (modified — add `validate:client`) |
| CI workflow | `.github/workflows/validate.yml` (new or modified) |

---

## Out of scope

- Validating component source files or TypeScript types (that is `tsc`'s job).
- Auto-fixing validation errors.
- Validating template files (only client configs under `config/clients/` are in scope).

---

## Acceptance criteria

1. `npm run validate:client demo-phone-repair-shop` exits with code 0 on a valid config.
2. If a required field (e.g., `phone`) is removed from `client.json`, the script exits with code 1 and prints a clear error pointing to the missing field.
3. If an unknown property is added to a block (e.g., `"unknownField": true` in `heroBlock`), the script exits with code 1.
4. Running with no args validates all clients and prints a summary.
5. A missing block schema file generates a warning, not an error, and does not affect exit code.
6. CI fails on any PR that introduces an invalid client config.
