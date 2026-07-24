# Task: `scripts/promote-client.mjs` — Demo to Paying Client (T-I)

**Status:** Ready for development
**Priority:** Medium — required to onboard first paying client
**Owner:** devops
**Estimated scope:** Small-Medium — 2 hours
**Depends on:** `business/tasks/todo/32-demo-hosting-single-bucket.md` (T-E)
**Milestone:** M1 (Week 3, when first paying client converts)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

When a prospect replies "sí, me interesa" and pays (via Bizum or Stripe link), the founder needs to promote their demo site to a full paying client with a custom domain. This is a **three-step state change**, not a new provisioning pipeline:

1. Rename `config/clients/demo-{slug}/` → `config/clients/{clientId}/`
2. Set `customDomain` in the client config
3. Drop `BASE_PATH`, rebuild, and deploy to Cloudflare-backed custom domain

No Stripe call, no Cosmos write, no admin user seed, no welcome email. Payment is a Bizum notification and a row in a spreadsheet. Encoding billing state into the repo before there is billing infrastructure is exactly the premature complexity that killed the previous roadmap.

---

## Technical Specifications

### CLI usage

```bash
node scripts/promote-client.mjs \
  --demo demo-reparaciones-garcia \
  --clientId reparaciones-garcia \
  --domain reparacionesgarcia.es
```

Arguments:
- `--demo` — the demo clientId (must exist under `config/clients/demo-{slug}/`)
- `--clientId` — the new production clientId (becomes `config/clients/{clientId}/`)
- `--domain` — the custom domain (e.g., `reparacionesgarcia.es`)

### What the script does

1. **Validate:** check that `config/clients/{demo}/` exists and `config/clients/{clientId}/` does NOT exist (guard against overwriting a paying client).
2. **Rename:** `mv config/clients/{demo}/ config/clients/{clientId}/`
3. **Update config:** in `config/clients/{clientId}/client.json`, set:
   - `"customDomain": "{domain}"`
   - Remove `"basePath"` if present (it was set by the demo pipeline)
   - Set `"analyticsToken": ""` (placeholder — founder fills in after creating a Cloudflare Web Analytics site for the client's domain)
4. **Build:** `CLIENT_ID={clientId} npm run build:blob` (no `BASE_PATH` → builds for root `/`)
5. **Deploy to client's own Azure Storage:** provision a new Azure Blob `$web` container named `client-{clientId}` OR upload to the shared demo container under a new path — document which approach is used.
6. **Cloudflare DNS:** print instructions for the founder to add a CNAME record pointing `{domain}` → the Azure Blob static website endpoint. Do NOT automate Cloudflare DNS in M1 — the founder does this step manually in the Cloudflare dashboard.
7. **Log:** print a completion summary with the new site URL and a checklist of manual steps remaining.

### Manual steps checklist (printed at end)

```
✅ Config promoted: config/clients/{clientId}/
✅ Built and deployed to Azure Blob
⬜ Add CNAME in Cloudflare: {domain} → {storageEndpoint}
⬜ Enable Cloudflare proxy (orange cloud) on the CNAME
⬜ Create Cloudflare Web Analytics site for {domain} and add token to client.json
⬜ Record payment in spreadsheet (row: clientId, domain, date, €39/month)
⬜ Send "tu web está online" WhatsApp to client
```

### Idempotency

The script is NOT idempotent by design — it renames a directory, which is destructive if run twice on the same demo. Add a guard: if `config/clients/{clientId}/` already exists, abort with an error: `"Client {clientId} already exists. Promote aborted."`. The founder must manually resolve any conflict.

---

## Requirements

- [ ] Accepts `--demo`, `--clientId`, `--domain` CLI arguments.
- [ ] Validates that the demo config exists and the target clientId does not.
- [ ] Renames the config directory.
- [ ] Updates `client.json`: sets `customDomain`, removes `basePath`, clears `analyticsToken`.
- [ ] Runs `CLIENT_ID={clientId} npm run build:blob` with no `BASE_PATH`.
- [ ] Deploys to Azure Blob (document the chosen container strategy).
- [ ] Prints Cloudflare DNS CNAME instruction.
- [ ] Prints the full manual-steps checklist.
- [ ] Aborts with a clear error if the target clientId already exists.

---

## Files touched

| Area | Paths |
|---|---|
| New script | `scripts/promote-client.mjs` (new) |
| Package scripts | `package.json` (modified — add `"promote:client"`) |

---

## Out of scope

- Automating Cloudflare DNS (manual in M1, potentially scripted via Cloudflare API in M2+).
- Stripe payment capture or webhook handling.
- Admin panel or Cosmos seeding.
- Welcome email automation.

---

## Acceptance criteria

1. Running the script on a valid demo config renames the directory, updates the config, and triggers a successful build.
2. The built output has no `basePath` prefix — assets are at `/_next/`, pages at `/`.
3. Running the script twice on the same demo produces an error on the second run: `"Client already exists."`.
4. The printed checklist covers all remaining manual steps.
5. `npm run validate:client {clientId}` passes on the promoted config.
