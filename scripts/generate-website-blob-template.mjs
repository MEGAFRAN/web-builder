#!/usr/bin/env node
/**
 * Generate an Azure ARM template for a static website Blob Storage account.
 *
 * Usage:
 *   node scripts/generate-website-blob-template.mjs <storageAccountName> <tagKey>=<tagValue> [--output path]
 *
 * Examples:
 *   node scripts/generate-website-blob-template.mjs wbc1web client_id=1
 *   node scripts/generate-website-blob-template.mjs wbc2web team_id=design -o infra/azure/generated/wbc2web.arm.json
 */

import fs from 'node:fs'

const VALID_TAG_KEYS = new Set(['client_id', 'team_id'])
const STORAGE_ACCOUNT_PATTERN = /^[a-z0-9]{3,24}$/

function printUsage() {
  console.error(`Usage: node scripts/generate-website-blob-template.mjs <storageAccountName> <tagKey>=<tagValue> [--output path]

Arguments:
  storageAccountName   Azure Storage account name (3–24 lowercase letters/numbers)
  tagKey=tagValue      Resource tag — key must be "client_id" or "team_id"

Options:
  --output, -o         Write JSON to this file (default: stdout)
  --help, -h           Show this help message

Examples:
  node scripts/generate-website-blob-template.mjs wbc1web client_id=1
  node scripts/generate-website-blob-template.mjs wbc2web team_id=design -o infra/azure/generated/wbc2web.arm.json`)
}

function parseArgs(argv) {
  const positional = []
  let outputPath

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      printUsage()
      process.exit(0)
    }
    if (arg === '--output' || arg === '-o') {
      outputPath = argv[i + 1]
      if (!outputPath) {
        throw new Error('Missing value for --output')
      }
      i += 1
      continue
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    }
    positional.push(arg)
  }

  if (positional.length !== 2) {
    printUsage()
    process.exit(1)
  }

  const [storageAccountName, tagArg] = positional
  const separatorIndex = tagArg.indexOf('=')
  if (separatorIndex <= 0 || separatorIndex === tagArg.length - 1) {
    throw new Error(`Invalid tag "${tagArg}". Expected format: client_id=<value> or team_id=<value>`)
  }

  const tagKey = tagArg.slice(0, separatorIndex)
  const tagValue = tagArg.slice(separatorIndex + 1)

  return { storageAccountName, tagKey, tagValue, outputPath }
}

function validateInputs({ storageAccountName, tagKey, tagValue }) {
  if (!STORAGE_ACCOUNT_PATTERN.test(storageAccountName)) {
    throw new Error(
      `Invalid storageAccountName "${storageAccountName}". Use 3–24 lowercase letters and numbers only.`,
    )
  }

  if (!VALID_TAG_KEYS.has(tagKey)) {
    throw new Error(`Invalid tag key "${tagKey}". Must be one of: ${[...VALID_TAG_KEYS].join(', ')}`)
  }

  if (!tagValue.trim()) {
    throw new Error('Tag value must not be empty')
  }
}

function buildTemplate(storageAccountName, tagKey, tagValue) {
  const parameterName = `storageAccounts_${storageAccountName}_name`
  const parameterRef = `parameters('${parameterName}')`

  return {
    $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
    contentVersion: '1.0.0.0',
    parameters: {
      [parameterName]: {
        defaultValue: storageAccountName,
        type: 'String',
      },
    },
    variables: {},
    resources: [
      {
        type: 'Microsoft.Storage/storageAccounts',
        apiVersion: '2025-08-01',
        name: `[${parameterRef}]`,
        location: 'spaincentral',
        tags: {
          [tagKey]: tagValue,
        },
        sku: {
          name: 'Standard_LRS',
          tier: 'Standard',
        },
        kind: 'StorageV2',
        properties: {
          dualStackEndpointPreference: {
            publishIpv6Endpoint: false,
          },
          dnsEndpointType: 'Standard',
          defaultToOAuthAuthentication: false,
          publicNetworkAccess: 'Enabled',
          allowCrossTenantReplication: false,
          minimumTlsVersion: 'TLS1_2',
          allowBlobPublicAccess: false,
          allowSharedKeyAccess: true,
          networkAcls: {
            ipv6Rules: [],
            bypass: 'AzureServices',
            virtualNetworkRules: [],
            ipRules: [],
            defaultAction: 'Allow',
          },
          supportsHttpsTrafficOnly: true,
          encryption: {
            requireInfrastructureEncryption: false,
            services: {
              file: {
                keyType: 'Account',
                enabled: true,
              },
              blob: {
                keyType: 'Account',
                enabled: true,
              },
            },
            keySource: 'Microsoft.Storage',
          },
          accessTier: 'Hot',
        },
      },
      {
        type: 'Microsoft.Storage/storageAccounts/blobServices',
        apiVersion: '2025-08-01',
        name: `[concat(${parameterRef}, '/default')]`,
        dependsOn: [
          `[resourceId('Microsoft.Storage/storageAccounts', parameters('${parameterName}'))]`,
        ],
        sku: {
          name: 'Standard_LRS',
          tier: 'Standard',
        },
        properties: {
          staticWebsite: {
            enabled: true,
            indexDocument: 'index.html',
            errorDocument404Path: '404.html',
          },
          containerDeleteRetentionPolicy: {
            enabled: true,
            days: 7,
          },
          cors: {
            corsRules: [],
          },
          deleteRetentionPolicy: {
            allowPermanentDelete: false,
            enabled: true,
            days: 7,
          },
        },
      },
      {
        type: 'Microsoft.Storage/storageAccounts/fileServices',
        apiVersion: '2025-08-01',
        name: `[concat(${parameterRef}, '/default')]`,
        dependsOn: [
          `[resourceId('Microsoft.Storage/storageAccounts', parameters('${parameterName}'))]`,
        ],
        sku: {
          name: 'Standard_LRS',
          tier: 'Standard',
        },
        properties: {
          protocolSettings: {
            smb: {
              encryptionInTransit: {
                required: true,
              },
            },
          },
          cors: {
            corsRules: [],
          },
          shareDeleteRetentionPolicy: {
            enabled: true,
            days: 7,
          },
        },
      },
      {
        type: 'Microsoft.Storage/storageAccounts/queueServices',
        apiVersion: '2025-08-01',
        name: `[concat(${parameterRef}, '/default')]`,
        dependsOn: [
          `[resourceId('Microsoft.Storage/storageAccounts', parameters('${parameterName}'))]`,
        ],
        properties: {
          cors: {
            corsRules: [],
          },
        },
      },
      {
        type: 'Microsoft.Storage/storageAccounts/tableServices',
        apiVersion: '2025-08-01',
        name: `[concat(${parameterRef}, '/default')]`,
        dependsOn: [
          `[resourceId('Microsoft.Storage/storageAccounts', parameters('${parameterName}'))]`,
        ],
        properties: {
          cors: {
            corsRules: [],
          },
        },
      },
      {
        type: 'Microsoft.Storage/storageAccounts/blobServices/containers',
        apiVersion: '2025-08-01',
        name: `[concat(${parameterRef}, '/default/$web')]`,
        dependsOn: [
          `[resourceId('Microsoft.Storage/storageAccounts/blobServices', parameters('${parameterName}'), 'default')]`,
          `[resourceId('Microsoft.Storage/storageAccounts', parameters('${parameterName}'))]`,
        ],
        properties: {
          immutableStorageWithVersioning: {
            enabled: false,
          },
          defaultEncryptionScope: '$account-encryption-key',
          denyEncryptionScopeOverride: false,
          publicAccess: 'None',
        },
      },
    ],
  }
}

try {
  const args = parseArgs(process.argv.slice(2))
  validateInputs(args)

  const template = buildTemplate(args.storageAccountName, args.tagKey, args.tagValue)
  const json = `${JSON.stringify(template, null, 4)}\n`

  if (args.outputPath) {
    fs.writeFileSync(args.outputPath, json, 'utf8')
    console.error(`Wrote ${args.outputPath}`)
  } else {
    process.stdout.write(json)
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
