# Azure infrastructure

ARM templates for provisioning tenant static-website storage accounts.

## Layout

| Path | Purpose |
|---|---|
| `website-blob.example.arm.json` | Reference template (`wbc1web` + `client_id=1`) |
| `generated/` | Per-client outputs (gitignored — regenerate on demand) |
| `../../scripts/generate-website-blob-template.mjs` | Source-of-truth generator |

## Generate a template

```bash
npm run generate:blob-template -- wbt2web team_id=internal-portfolio-francisco \
  -o infra/azure/generated/wbt2web.arm.json
```

Arguments:

- `storageAccountName` — 3–24 lowercase letters/numbers (globally unique in Azure)
- `tagKey=tagValue` — `client_id=<id>` or `team_id=<id>` (used by `deploy-blob-storage.yml` to discover the account)

## Deploy in Azure Portal

1. Open [Deploy a custom template](https://portal.azure.com/#create/Microsoft.Template)
2. **Build your own template in the editor** → **Load file** → select the generated JSON
3. Choose subscription and resource group; region should match `spaincentral`
4. Confirm parameters → **Review + create** → **Create**

Or via CLI:

```bash
az deployment group create \
  --resource-group <your-rg> \
  --template-file infra/azure/generated/wbt2web.arm.json
```

## After provisioning

Run the **Deploy to Blob Storage** GitHub Actions workflow with the matching `clientId` / tag value. The workflow discovers the storage account by tag and syncs the static build to `$web`.
