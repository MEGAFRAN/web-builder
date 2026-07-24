# Task: `scripts/provision-client.mjs` — New Paying Client (T-E)

**Status:** Ready for development
**Priority:** Medium — required to onboard first paying client
**Owner:** devops
**Estimated scope:** Small-Medium — 2 hours
**Depends on:** T-D (`31-deploy-generic-demo-site.md`), T-G (`26-validate-client-schema-gate.md`)
**Milestone:** M1 (Week 3, when first paying client converts)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

When a prospect replies "sí, me interesa" and pays (via Bizum or payment link), the founder provisions **their** site from the repair-shop template — not by promoting a per-lead demo config (there is only one generic demo).

Flow:

1. Clone `config/templates/cell-phone-repair-shop/` → `config/clients/{clientId}/`
2. Substitute placeholders from CLI args or a small JSON intake file (business name, phone, WhatsApp, address, hours, domain)
3. Run `npm run validate:client {clientId}`
4. Build and deploy to the client's custom domain

No Stripe webhook, no Cosmos seed, no admin user. Payment is recorded in a spreadsheet.

The generic demo (`demo-phone-repair-shop`) is **never renamed or overwritten** — it stays live for all future outreach.

---

## Technical Specifications

### CLI usage

```bash
node scripts/provision-client.mjs \
  --clientId reparaciones-garcia \
  --domain reparacionesgarcia.es \
  --businessName "Reparaciones García" \
  --phone "+34612345678" \
  --address "Calle Ejemplo 1, Madrid" \
  --hours "Lun–Vie 10:00–20:00"
```

Optional: `--intake path/to/intake.json` with the same fields for agent-driven provisioning.

### What the script does

1. **Validate:** `config/clients/{clientId}/` must not already exist.
2. **Clone:** copy template → `config/clients/{clientId}/`.
3. **Substitute:** replace `{{placeholders}}` in all JSON files from CLI/intake.
4. **Validate config:** run `npm run validate:client {clientId}` — abort on error.
5. **Update `client.json`:** set `customDomain`, `analyticsToken` placeholder (founder fills after Cloudflare Analytics setup).
6. **Build:** `CLIENT_ID={clientId} npm run build:blob` (no `BASE_PATH`).
7. **Deploy:** upload to client's Azure Blob container or path — document strategy.
8. **Print checklist:** Cloudflare CNAME, analytics token, spreadsheet row, client WhatsApp confirmation.

### Manual steps checklist (printed at end)

```
✅ Config created: config/clients/{clientId}/
✅ Validated and built
✅ Deployed to Azure Blob
⬜ Add CNAME in Cloudflare: {domain} → {storageEndpoint}
⬜ Create Cloudflare Web Analytics site for {domain}; add token to client.json
⬜ Record payment in spreadsheet (clientId, domain, date, €39/month)
⬜ Send "tu web está online" WhatsApp to client
```

### Idempotency

If `config/clients/{clientId}/` already exists, abort: `"Client {clientId} already exists. Provisioning aborted."`

---

## Requirements

- [ ] Accepts `--clientId`, `--domain`, and core business fields (or `--intake` JSON file).
- [ ] Clones from `config/templates/cell-phone-repair-shop/` — does not touch `demo-phone-repair-shop`.
- [ ] Substitutes placeholders in all JSON files under the new client directory.
- [ ] Runs `validate:client` before build; aborts on validation failure.
- [ ] Sets `customDomain` in `client.json`; builds for root `/` (no `basePath` — same as demo deploy model).
- [ ] Builds and deploys with `CLIENT_ID={clientId}` only.
- [ ] Prints Cloudflare DNS and post-provision checklist.
- [ ] Aborts if target `clientId` directory already exists.

---

## Files touched

| Area | Paths |
|---|---|
| New script | `scripts/provision-client.mjs` (new) |
| Package scripts | `package.json` (modified — add `"provision:client"`) |

---

## Out of scope

- Automating Cloudflare DNS (manual in M1).
- Stripe payment capture or webhooks.
- Admin panel or Cosmos seeding.
- Modifying the generic demo client or demo deploy script.

---

## Acceptance criteria

1. Running the script with valid args creates `config/clients/{clientId}/`, passes validation, and completes a successful build.
2. Built output has no `basePath` — assets at `/_next/`, pages at `/`.
3. `config/clients/demo-phone-repair-shop/` is unchanged after provisioning a paying client.
4. Second run with the same `clientId` aborts with a clear error.
5. `npm run validate:client {clientId}` passes on the new config.
