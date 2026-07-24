# Task: Single-Bucket Demo Hosting with Path Prefixes (T-E)

**Status:** Ready for development
**Priority:** High — required to make demo links shareable via WhatsApp
**Owner:** devops
**Estimated scope:** Small-Medium — 2 hours
**Depends on:** `business/tasks/todo/31-generate-demos-script.md` (T-D)
**Milestone:** M0 (Week 1)
**Source:** `docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md`

---

## Context

The CEO's sample first WhatsApp message is:
> "Hola [Nombre], he montado una web para [Tienda] con vuestros datos de Google. Está aquí: **reparaciones-madrid.es/tienda-x** — si os gusta, la paso a vuestro dominio propio por 39€/mes + IVA, deducible."

For that link to exist, every demo site must be live at a stable public URL before the first DM is sent.

The original architecture provisioned one Azure Storage account per client (via Azure tag lookup in the deploy workflow). At 50+ demos, that means 50+ storage accounts before sending a single message — slow to provision, expensive to manage, and unnecessary.

**Architecture decision (locked by CTO):** one Azure Storage account, one `$web` container, one apex domain (`reparaciones-madrid.es` or equivalent) behind Cloudflare's free tier. Each demo lives at `{domain}/{slug}/`. Path prefixes are handled via `basePath` in `next.config.ts` (done in Task T-C).

---

## Technical Specifications

### Azure Storage setup

- One Azure Storage account (`webbuilderdemosstorage` or similar).
- One `$web` container with static website hosting enabled.
- Public access enabled on the container (read-only, no credential required).
- The storage account is shared across ALL demo sites. No per-demo provisioning.

### Cloudflare DNS + free tier setup

- Point the apex domain (`reparaciones-madrid.es`) to the Azure Storage static website endpoint via Cloudflare CNAME.
- Enable Cloudflare proxy (orange cloud) for CDN, free SSL, and DDoS protection.
- No Cloudflare Workers required — the demo sites are at sub-paths, not subdomains.

### Upload script / workflow step

After `generate-demos.mjs` produces `.demo-staging/`, upload all demo sites to the shared container:

```bash
az storage blob sync \
  --source .demo-staging/ \
  --container '$web' \
  --account-name $AZURE_DEMO_STORAGE_ACCOUNT \
  --auth-mode login
```

This is idempotent: `blob sync` only uploads changed files and deletes files no longer present in the source.

Add a `scripts/upload-demos.mjs` wrapper (or a Makefile target / npm script `npm run upload:demos`) that:
1. Checks that `.demo-staging/` is non-empty.
2. Runs the `az storage blob sync` command.
3. Prints a list of uploaded demo URLs: `https://{domain}/{slug}/`.

### npm script

Add to `package.json`:
```json
"upload:demos": "node scripts/upload-demos.mjs"
```

### Expiry policy (deferred)

Demos that have not been viewed in 30 days should be deleted. This is **not in scope for M0** — implement manually (delete the `config/clients/demo-{slug}/` directory and re-run `upload:demos`). Document the manual cleanup process in `scripts/upload-demos.mjs` as a comment.

---

## Requirements

- [ ] Provision one shared Azure Storage account for demos (document account name and subscription in `docs/infrastructure/demo-storage.md`).
- [ ] Enable static website hosting on the `$web` container.
- [ ] Configure Cloudflare DNS to point the demo domain to the storage endpoint.
- [ ] Write `scripts/upload-demos.mjs` that syncs `.demo-staging/` → `$web` container.
- [ ] Add `"upload:demos": "node scripts/upload-demos.mjs"` to `package.json`.
- [ ] Script prints a list of live demo URLs after upload.
- [ ] Verify at least one demo site is accessible at `https://{domain}/{slug}/` with correct asset paths.
- [ ] Document manual demo expiry/cleanup process as a comment in the script.

---

## Files touched

| Area | Paths |
|---|---|
| New script | `scripts/upload-demos.mjs` (new) |
| Package scripts | `package.json` (modified — add `upload:demos`) |
| Infrastructure docs | `docs/infrastructure/demo-storage.md` (new) |

---

## Out of scope

- Per-demo custom domains (those are set up for paying clients only, via Task T-I).
- Demo expiry automation (manual cleanup only for M0).
- Any changes to templates, components, or client configs.

---

## Acceptance criteria

1. Running `npm run upload:demos` uploads all contents of `.demo-staging/` to the shared `$web` container.
2. At least one demo site is publicly accessible at `https://{domain}/{slug}/`.
3. The homepage shows the services block with prices (not a blank section).
4. WhatsApp and phone CTAs work.
5. Re-running `upload:demos` is idempotent (no duplicate files, no errors on re-run).
6. The script prints the list of live URLs at the end.
