# Task: `scripts/provision-client.mjs` Idempotent Provisioning Script

**Status:** Ready for development  
**Priority:** High — milestone blocker for M1  
**Owner:** DevOps  
**Estimated scope:** Medium — Node.js CLI script integrating file systems, build commands, and Azure/Stripe/Resend API endpoints  
**Depends on:** `business/tasks/06-stripe-checkout-customer-portal-integration.md`, `business/tasks/07-resend-transactional-email-integration.md`, `business/tasks/08-cloudflare-azure-blob-custom-domain.md`, `business/tasks/09-solo-beauty-pro-starter-template.md`

---

## Context

To achieve a 15-to-25 minute steady-state time for onboarding a new client, we need a single idempotent provisioning command. The founder will run this CLI script from their local terminal to:
1. Parse client details (name, email, services, schedule, market, plan, etc.).
2. Clone a starting template, substitute the placeholders, and write the custom files under `config/clients/{clientId}/`.
3. Run the static site generator compile/build sequence (`build:blob`).
4. Provision a new Azure Blob static website container and upload the built site assets.
5. Setup the Cloudflare proxy and DNS records (via `scripts/setup-domain.mjs`).
6. Seed Cosmos DB with the client's default admin user, services, and schedules.
7. Trigger an admin onboarding/welcome email using Resend.

---

## Technical Specifications

### CLI Arguments
The script must be executable from the root of the workspace using Node:
```bash
node scripts/provision-client.mjs \
  --clientId "client-123" \
  --templateId "solo-beauty-pro" \
  --market "ES" \
  --plan "monthly" \
  --paymentProvider "stripe" \
  --clientJsonPath "./config/onboarding/client-details.json"
```

### Order of Operations (Idempotent Flow)
1. **Validation**: Check that the input JSON exists and matches schemas, and all required command arguments are provided.
2. **Templating**: Copy the files from `config/templates/{templateId}/` to `config/clients/{clientId}/`. Run a substitution pass over `client.json` and `pages/home.json` (replacing keys like `{{businessName}}` with actual user details).
3. **Build Static Assets**: Invoke the build script (e.g. `npm run build:client --clientId={clientId}`) to generate the isolated client SPA.
4. **Deploy to Azure Blob**:
   - Create an Azure Storage Container named `client-{clientId}` (static site hosting `$web` feature enabled).
   - Upload the build output assets to this container.
5. **Setup DNS & SSL**: Execute `scripts/setup-domain.mjs` to bind the custom domain.
6. **Cosmos DB Seeding**:
   - Check if the admin user exists in Cosmos DB `admin-users`. If not, generate a temporary password, bcrypt it, and insert.
   - Seed default `services` and empty `schedule` entries.
   - Set billing status fields: `market`, `planSku`, `subscriptionStatus: "trialing"`, `paymentProvider`.
7. **Onboarding Notification**: Invoke `/api/send-email` (or call Resend SDK directly if running locally with credentials) to send the admin invite with credentials and welcome details.

---

## Requirements

### 1. Robust Node.js CLI Script
- [ ] Create `scripts/provision-client.mjs`.
- [ ] Implement robust argument parsing and input validation.
- [ ] Log progress at every milestone with clear, timestamped terminal output.

### 2. File & Build Orchestration
- [ ] Implement the template cloning and string-replacement function.
- [ ] Programmatically invoke Next.js SSG build commands and output tracking.
- [ ] Leverage Azure Storage Blob SDK (`@azure/storage-blob`) to create containers and upload directory trees recursively.

### 3. Idempotency & Safety
- [ ] Every step must be safely re-runnable. If a container exists, skip creation; if DNS is set, skip; if DB record exists, update/upsert; if build folder exists, clean/overwrite.
- [ ] Never leave partial config corruptions or duplicate DB seeds on failure.
- [ ] Target run time: ≤25 mins for first client (due to potential manual setup steps documented in Task 08), and ≤15 mins from client #2.

---

## Files touched

| Area | Paths |
|---|---|
| Provisioning CLI | `scripts/provision-client.mjs` (new) |
| Documentation | `docs/operations/onboarding-and-provisioning.md` (new) |

---

## Out of scope

- Auto-purchasing custom domains (handled in Task 08).
- Multi-region or geo-distributed Azure Blob synchronization.

---

## Acceptance criteria

1. Running the provisioning script with valid arguments successfully builds and deploys a live website under 15 minutes.
2. The deployed site displays the substituted values (e.g. actual client name instead of `{{businessName}}`).
3. Running the script a second time with the same options updates the configuration without throwing errors or creating duplicated resources.
4. The client's record in Cosmos DB contains all seeded user and billing metadata correctly.
5. The welcome/invite email containing the correct client panel link is successfully dispatched via Resend.
