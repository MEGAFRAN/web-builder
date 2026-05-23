# Task: Cloudflare + Azure Blob `$web` Custom Domain Mapping

**Status:** Ready for development  
**Priority:** High — commercial blocker for M1  
**Owner:** DevOps  
**Estimated scope:** Medium — Cloudflare DNS API integration, Azure Blob configuration, and a CLI script  
**Depends on:** `business/tasks/05-configure-admin-deploy-pipeline.md` (Assumes Azure storage infrastructure is established)

---

## Context

Each tenant's static site is compiled and hosted in an isolated Azure Blob Storage container under the `$web` static website static hosting feature (e.g., container named `client-{clientId}`). 

To look credible and professional, each client site must be mapped to their own custom domain (e.g., `sallystyling.com`) rather than a raw Azure Blob storage URL. 

To achieve this at $0 infrastructure cost:
- We place **Cloudflare Free** in front of Azure Blob Storage `$web`.
- This gives us free SSL certificates, DNS hosting, and $0 egress bandwidth costs.
- **Azure Front Door** was vetoed due to high starting costs.
- **Azure Static Web Apps (SWA) custom domains** were vetoed because SWA hosts our *admin SPA*, not the individual client sites.

This task involves researching/spiking the optimal setup, writing a technical runbook for manual steps, and implementing a helper script `scripts/setup-domain.mjs` to automate as much as possible via the Cloudflare API.

---

## Architecture Design

```
[Visitor Browser] 
       │ (HTTPS over Custom Domain, e.g. sallystyling.com)
       ▼
[Cloudflare (Free Tier proxy + SSL/TLS)]
       │ (CNAME to Azure Blob Storage endpoint)
       ▼
[Azure Blob Storage ($web static website container, e.g. client-123.z13.web.core.windows.net)]
```

### Cloudflare Integration Specs
1. **Zone Management**: Set up a Cloudflare zone for the client domain.
2. **DNS Records**: Create a CNAME record pointing `@` or `www` to the Azure Blob Storage primary static website endpoint (e.g., `<storage-account-name>.z13.web.core.windows.net`).
3. **SSL/TLS**: Configure SSL to "Full (Strict)".
4. **Origin CA Certificate**: Generate a Cloudflare Origin CA certificate and upload/bind it to the Azure Blob storage account or configure appropriate edge certificates (if routing directly through Cloudflare's proxy).

---

## Requirements

### 1. Research & Spike (The Runbook)
- [ ] Investigate the exact DNS and SSL requirements to map a Cloudflare-proxied CNAME to an Azure Blob Storage static website endpoint.
- [ ] Document these findings in a new file `docs/operations/cloudflare-azure-mapping-runbook.md`.
- [ ] Explicitly outline which steps must be done manually in the Cloudflare Dashboard vs. which steps can be automated via the API (Open Question T6).

### 2. DNS Automation Helper (`scripts/setup-domain.mjs`)
- [ ] Create a Node.js CLI helper `scripts/setup-domain.mjs`.
- [ ] The script must accept: `--domain <custom-domain>`, `--clientId <clientId>`, and `--storageEndpoint <azure-blob-endpoint>`.
- [ ] It must utilize the Cloudflare API (using `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_EMAIL` from env) to:
  - Create or locate a Cloudflare DNS Zone for the custom domain.
  - Create a CNAME record pointing to the Azure Blob storage static website endpoint.
  - Enable Cloudflare proxy (`proxied: true`) on the record to leverage Cloudflare's free SSL and egress protection.
  - Set SSL/TLS settings to "Full" or "Full (Strict)" for that zone.
- [ ] The script must be idempotent (re-runnable without duplicate DNS errors).

### 3. Local Env Configuration
- [ ] Document `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `CLOUDFLARE_EMAIL` in `.env.local.example`.

---

## Files touched

| Area | Paths |
|---|---|
| Scripts | `scripts/setup-domain.mjs` (new) |
| Runbook Docs | `docs/operations/cloudflare-azure-mapping-runbook.md` (new) |
| Env example | `.env.local.example` (add `CLOUDFLARE_*` keys) |

---

## Out of scope

- Automated domain purchasing (domains are assumed to be purchased by the founder/client on Namecheap, GoDaddy, etc., with nameservers pointed to Cloudflare).
- Multi-region geo-routing or custom edge rule scripting.

---

## Acceptance criteria

1. The operations runbook `docs/operations/cloudflare-azure-mapping-runbook.md` exists and contains a clear, step-by-step setup procedure.
2. `node scripts/setup-domain.mjs --domain testclient.com --clientId 123 --storageEndpoint example.z13.web.core.windows.net` executes successfully and configures the CNAME and SSL settings on Cloudflare.
3. Running `scripts/setup-domain.mjs` twice for the same domain update is idempotent and does not crash or throw duplicate CNAME errors.
4. Edge requests to the custom domain successfully proxy through Cloudflare, load the index page from the corresponding Azure Blob container, and terminate SSL.
