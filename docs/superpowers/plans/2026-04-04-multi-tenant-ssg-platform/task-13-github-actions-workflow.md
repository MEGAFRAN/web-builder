# Task 13: GitHub Actions Per-Client Deploy Workflow

**Plan:** Multi-Tenant SSG Platform  
**Depends on:** Tasks 01–12 (entire app must be buildable)  
**Goal:** Create the isolated CI/CD pipeline triggered by `workflow_dispatch` (called by a Sanity webhook). It builds only the specified client's static site and deploys it to that client's dedicated Azure Static Web App using per-client secrets stored in GitHub.

**Files:**
- Create: `.github/workflows/deploy-client.yml`

No unit tests — this is infrastructure-as-code validated by reading.

---

- [ ] **Step 1: Create `.github/workflows/` directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create `.github/workflows/deploy-client.yml`**

```yaml
name: Deploy Client

on:
  workflow_dispatch:
    inputs:
      clientId:
        description: 'Client ID to rebuild (e.g. restaurante-pepe)'
        required: true
        type: string

jobs:
  build-and-deploy:
    name: Build and Deploy ${{ github.event.inputs.clientId }}
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Set SANITY_DATASET from client config
        run: |
          DATASET=$(jq -r '.sanityDataset' config/clients/${{ github.event.inputs.clientId }}.json)
          echo "SANITY_DATASET=$DATASET" >> $GITHUB_ENV

      - name: Restore Next.js build cache
        uses: actions/cache@v4
        with:
          path: .next/cache
          key: nextjs-${{ github.event.inputs.clientId }}-${{ hashFiles('package-lock.json') }}
          restore-keys: |
            nextjs-${{ github.event.inputs.clientId }}-

      - name: Build static site
        env:
          CLIENT_ID: ${{ github.event.inputs.clientId }}
          SANITY_PROJECT_ID: ${{ secrets.SANITY_PROJECT_ID }}
          SANITY_API_TOKEN: ${{ secrets[format('CMS_TOKEN_{0}', github.event.inputs.clientId)] }}
        run: npm run build

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets[format('SWA_TOKEN_{0}', github.event.inputs.clientId)] }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: upload
          app_location: /
          output_location: out
```

- [ ] **Step 3: Verify the file looks correct**

```bash
cat .github/workflows/deploy-client.yml
```

Expected: Full YAML as written above, no truncation.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy-client.yml
git commit -m "feat: add isolated per-client GitHub Actions deploy workflow"
```

---

## GitHub Secrets required per client

For each new client added to `config/clients/`, two secrets must be added to the GitHub repo:

| Secret name | Value |
|---|---|
| `CMS_TOKEN_<clientId>` | Sanity API read token for that client's dataset |
| `SWA_TOKEN_<clientId>` | Azure Static Web Apps deployment token |

One shared secret across all clients:

| Secret name | Value |
|---|---|
| `SANITY_PROJECT_ID` | The Sanity project ID (same for all clients — datasets are per-client) |

Example secret names for `restaurante-pepe`:
- `CMS_TOKEN_restaurante-pepe`
- `SWA_TOKEN_restaurante-pepe`
