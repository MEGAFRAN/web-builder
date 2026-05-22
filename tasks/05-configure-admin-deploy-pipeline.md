# Task: Configure admin SPA deployment pipeline

**Status:** Pending  
**Priority:** Medium — required to go live; not blocking local dev or Functions testing  
**Owner:** DevOps  
**Estimated scope:** Small — Azure portal clicks + GitHub secrets, no code  
**Depends on:** `implement-admin-azure-functions` (Functions must be deployed before the admin SPA is useful)

---

## Context

The `deploy-admin.yml` workflow is written and ready. It builds the admin SPA via `npm run build:admin` and deploys to Azure Static Web Apps (SWA) using the `Azure/static-web-apps-deploy@v1` action. Three values are missing before it can run:

1. The SWA resource does not exist yet in Azure
2. The GitHub secret `SWA_TOKEN_ADMIN` is not set
3. The GitHub variables `ADMIN_API_URL` and `ADMIN_BUILD_CLIENT_ID` are not set

Additionally, the Azure Functions app needs CORS configured to allow the admin SPA's origin. Without this, every `adminFetch()` call from the browser will be blocked.

---

## Step 1 — Create the Azure Static Web Apps resource

In the Azure portal, create a new Static Web App:

| Setting | Value |
|---|---|
| Name | `web-builder-admin` (or similar) |
| Plan | Free tier (sufficient for the admin SPA) |
| Region | Same region as the Azure Functions app |
| Deployment source | **Other** (CI is managed by GitHub Actions, not the SWA GitHub integration) |

After creation, go to **Manage deployment token** under the SWA resource overview. Copy the token — this becomes `SWA_TOKEN_ADMIN`.

---

## Step 2 — Set GitHub secret: `SWA_TOKEN_ADMIN`

In the GitHub repository → **Settings → Secrets and variables → Actions → Secrets**:

| Name | Value |
|---|---|
| `SWA_TOKEN_ADMIN` | The deployment token from Step 1 |

This is a **secret** (not a variable) because it grants write access to the SWA resource.

---

## Step 3 — Set GitHub variables

In the GitHub repository → **Settings → Secrets and variables → Actions → Variables**:

| Name | Value | Notes |
|---|---|---|
| `ADMIN_API_URL` | `https://<your-functions-app>.azurewebsites.net` | Base URL of the deployed Azure Functions app, no trailing slash. Baked into the admin SPA bundle at build time via `NEXT_PUBLIC_ADMIN_API_URL`. |
| `ADMIN_BUILD_CLIENT_ID` | `1` | Any valid `CLIENT_ID` from `config/clients/`. Used only to resolve root layout CSS tokens at build time — not used at runtime by the admin SPA. |

---

## Step 4 — Configure CORS on Azure Functions

The admin SPA (served from the SWA domain) makes cross-origin requests to Azure Functions. Without CORS, all requests are blocked by the browser.

In the Azure portal → **Functions App → CORS**:

- Add the admin SWA domain to the allowed origins list, e.g.:  
  `https://your-admin-spa.azurestaticapps.net`
- If using a custom domain for the admin SPA, add that domain instead (or in addition)
- Do **not** use `*` as the allowed origin in production — the `admin-session` cookie requires `credentials: 'include'`, and a wildcard origin is incompatible with credentialed requests

The `adminFetch()` helper in `lib/admin-api.ts` already passes `credentials: 'include'` on every request.

---

## Step 5 — Verify the workflow triggers correctly

The `deploy-admin.yml` workflow triggers on:
- Push to `main` when any of the listed paths change (`app/admin/**`, `components/admin/**`, `lib/admin-api.ts`, etc.)
- Manual dispatch (`workflow_dispatch`)

After setting the secrets and variables, trigger the workflow manually from the GitHub Actions UI to confirm the first deploy succeeds.

---

## Requirements

- [ ] SWA resource `web-builder-admin` (or equivalent) exists in Azure
- [ ] `SWA_TOKEN_ADMIN` secret is set in GitHub
- [ ] `ADMIN_API_URL` variable is set in GitHub and points to the live Functions app
- [ ] `ADMIN_BUILD_CLIENT_ID` variable is set in GitHub
- [ ] CORS on the Azure Functions app allows the admin SWA domain with credentials
- [ ] Manual trigger of `deploy-admin.yml` exits 0
- [ ] The deployed admin SPA URL loads the login page
- [ ] Logging in from the deployed SPA reaches the Azure Functions `auth/login` endpoint (check browser DevTools — no CORS errors)

---

## Post-deploy smoke test

```
1. Open the admin SPA URL in a browser
2. Enter clientId, email, password for the seeded admin user
3. Click Sign in
4. Verify the dashboard loads and shows the correct business name
5. Open DevTools → Network — confirm all /admin/* requests return 200, no CORS errors
6. Click Sign out — confirm redirect to login and cookie is cleared
```

---

## Out of scope

- Custom domain setup for the admin SPA (can be added later via SWA custom domain settings)
- HTTPS certificate (handled automatically by SWA and Azure Functions)
- Azure Functions deployment CI pipeline — functions are deployed separately (Azure DevOps or `func azure functionapp publish`)
