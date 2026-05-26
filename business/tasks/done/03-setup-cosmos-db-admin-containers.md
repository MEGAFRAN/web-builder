# Task: Set up Cosmos DB admin containers and seed first admin user

**Status:** Ready for development  
**Priority:** High — blocks all admin Azure Functions  
**Owner:** Backend / DevOps  
**Estimated scope:** Small — infrastructure provisioning and a seeding script  
**Depends on:** An Azure Cosmos DB account must exist

---

## Context

The multi-tenant admin refactor moves all data storage from local JSON files to Azure Cosmos DB. Azure Functions read and write to four containers, all partitioned by `clientId` for tenant isolation. Before any Function can be deployed or tested, these containers must exist and at least one admin user must be seeded.

This task covers only the **infrastructure and data seeding** side. Implementing the Azure Functions that use these containers is a separate task (`implement-admin-azure-functions`).

---

## Cosmos DB containers to create

| Container name | Partition key | Purpose |
|---|---|---|
| `admin-users` | `/clientId` | One record per admin user; used by `auth/login` to validate credentials |
| `reservations` | `/clientId` | Client booking records; replaces `lib/reservations-db.ts` |
| `services` | `/clientId` | Client service catalogue; replaces `lib/booking-services-db.ts` |
| `schedule` | `/clientId` | Client availability schedule |
| `client-profile` | `/clientId` | Canonical company profile (`CompanyProfile` fields); see task 19 |

All containers live in the same Cosmos DB database (e.g. `web-builder-admin`).

---

## Admin user document schema

Each document in the `admin-users` container represents one admin user for one client:

```json
{
  "id": "<clientId>-admin",
  "clientId": "<clientId>",
  "email": "admin@example.com",
  "passwordHash": "<bcrypt hash>",
  "displayName": "Business Name",
  "logoUrl": null
}
```

- `passwordHash` must be a **bcrypt hash** (cost factor ≥ 12) — never store plaintext passwords
- `displayName` and `logoUrl` are used by the `GET /clients/:clientId/config` Function to populate the admin shell header — they are the admin-side equivalent of `client.json`'s `displayName` and `header.logo`
- `id` must be unique per container; `<clientId>-admin` is the recommended convention for single-admin-per-client

---

## Requirements

### 1. Container provisioning

- [ ] Database `web-builder-admin` exists in the Cosmos DB account
- [ ] All four containers (`admin-users`, `reservations`, `services`, `schedule`) exist with the correct partition key `/clientId`
- [ ] Throughput: use **serverless** mode (no RU provisioning) for cost efficiency at current scale; document the choice in a comment or README
- [ ] Index policy: default (all paths indexed) is acceptable for now; can be tuned later

### 2. Seeding script

- [ ] A Node.js script `scripts/seed-admin-user.mjs` is created
- [ ] The script accepts arguments or env vars: `CLIENT_ID`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DISPLAY_NAME`, `LOGO_URL` (optional)
- [ ] It writes one document to `admin-users` using the schema above
- [ ] It hashes the password with bcrypt (cost 12) before writing
- [ ] It is idempotent: if a document with the same `id` already exists, it upserts rather than erroring
- [ ] Usage is documented in `azure-functions/README.md`

### 3. First admin user seeded

- [ ] At least one admin user is seeded for a real or test `clientId` (e.g. `1`) so the `auth/login` Function can be tested end-to-end

### 4. Connection string / config

- [ ] `COSMOS_ENDPOINT` and `COSMOS_KEY` (or managed identity equivalent) are documented in `.env.local.example` under an `# Azure Functions local dev` section
- [ ] These values are added to the Azure Functions app settings (for deployed Functions) — documented in `azure-functions/README.md`

---

## Files touched

| Area | Paths |
|---|---|
| Seeding script | `scripts/seed-admin-user.mjs` (new) |
| Docs | `azure-functions/README.md` — add container setup + seeding instructions |
| Env example | `.env.local.example` — add `COSMOS_ENDPOINT`, `COSMOS_KEY`, `ADMIN_JWT_SECRET` |

---

## Out of scope

- Migrating existing local JSON data (reservations, services) to Cosmos DB — separate data-migration task
- Creating the Cosmos DB account itself — assumed to already exist
- Configuring Cosmos DB networking (VNet, private endpoints) — future hardening task

---

## Acceptance criteria

1. All four containers exist in the Cosmos DB account with partition key `/clientId`
2. `node scripts/seed-admin-user.mjs` runs without error and writes a document to `admin-users`
3. Running the script twice for the same `clientId` does not create a duplicate or throw an error
4. The seeded document can be read back from the Azure Portal or via the Cosmos DB SDK
