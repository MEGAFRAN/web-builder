import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const scriptPath = path.join(repoRoot, 'scripts/generate-website-blob-template.mjs')
const referencePath = path.join(repoRoot, 'infra/azure/website-blob.example.arm.json')

const tempFiles = []

afterEach(() => {
  for (const file of tempFiles.splice(0)) {
    fs.rmSync(file, { force: true })
  }
})

function runScript(args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

describe('generate-website-blob-template.mjs', () => {
  it('generates the same structure as website-blob.example.arm.json for wbc1web/client_id=1', () => {
    const result = runScript(['wbc1web', 'client_id=1'])
    expect(result.status).toBe(0)

    const generated = JSON.parse(result.stdout)
    const reference = JSON.parse(fs.readFileSync(referencePath, 'utf8'))

    expect(generated).toEqual(reference)
  })

  it('uses storageAccountName in parameter names and references', () => {
    const result = runScript(['myteststorage', 'team_id=alpha'])
    expect(result.status).toBe(0)

    const generated = JSON.parse(result.stdout)
    const parameterName = 'storageAccounts_myteststorage_name'

    expect(generated.parameters).toEqual({
      [parameterName]: {
        defaultValue: 'myteststorage',
        type: 'String',
      },
    })

    expect(generated.resources[0].name).toBe(`[parameters('${parameterName}')]`)
    expect(generated.resources[0].tags).toEqual({ team_id: 'alpha' })

    const serialized = JSON.stringify(generated)
    expect(serialized).not.toContain('wbc1web')
    expect(serialized.match(/storageAccounts_myteststorage_name/g)?.length).toBeGreaterThan(5)
  })

  it('writes to a file when --output is provided', () => {
    const outputPath = path.join(os.tmpdir(), `website-blob-${Date.now()}.json`)
    tempFiles.push(outputPath)

    const result = runScript(['wbc2web', 'client_id=test', '--output', outputPath])
    expect(result.status).toBe(0)
    expect(fs.existsSync(outputPath)).toBe(true)

    const generated = JSON.parse(fs.readFileSync(outputPath, 'utf8'))
    expect(generated.parameters.storageAccounts_wbc2web_name.defaultValue).toBe('wbc2web')
    expect(generated.resources[0].tags).toEqual({ client_id: 'test' })
  })

  it('rejects invalid storage account names and tag keys', () => {
    expect(runScript(['WB', 'client_id=1']).status).not.toBe(0)
    expect(runScript(['wbc1web', 'owner_id=1']).status).not.toBe(0)
    expect(runScript(['wbc1web', 'client_id']).status).not.toBe(0)
  })
})
