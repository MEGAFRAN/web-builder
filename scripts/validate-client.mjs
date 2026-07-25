#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const Ajv = require('ajv')

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SCHEMAS_DIR = path.join(repoRoot, 'config/schemas')
const BLOCKS_DIR = path.join(SCHEMAS_DIR, 'blocks')
const CLIENTS_DIR = path.join(repoRoot, 'config/clients')

/** @typedef {{ filePath: string; blockIndex?: number; blockType?: string; pointer: string; message: string }} ValidationIssue */

/**
 * @param {string} filePath
 */
function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function createAjv() {
  const ajv = new Ajv({ allErrors: true })
  ajv.addSchema(loadJson(path.join(BLOCKS_DIR, '_common.schema.json')), '_common.schema.json')
  return ajv
}

/**
 * @param {import('ajv').ErrorObject} error
 */
function describeAjvError(error) {
  const pointer = error.dataPath ? (error.dataPath.startsWith('.') ? error.dataPath : `.${error.dataPath}`) : '(root)'

  if (error.keyword === 'required' && error.params?.missingProperty) {
    return { pointer, message: `required property missing` }
  }

  if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) {
    return { pointer: `.${error.params.additionalProperty}`, message: 'additional property not allowed' }
  }

  if (error.keyword === 'type' && error.params?.type) {
    const expected = error.params.type
    const got = error.data === null ? 'null' : Array.isArray(error.data) ? 'array' : typeof error.data
    return { pointer, message: `must be ${expected}, got ${got}` }
  }

  return { pointer, message: error.message ?? 'invalid value' }
}

/**
 * @param {string} relPath
 * @param {number | undefined} blockIndex
 * @param {string | undefined} blockType
 * @param {import('ajv').ErrorObject[]} ajvErrors
 * @returns {ValidationIssue[]}
 */
function issuesFromAjvErrors(relPath, blockIndex, blockType, ajvErrors) {
  return ajvErrors.map((error) => {
    const { pointer, message } = describeAjvError(error)
    return { filePath: relPath, blockIndex, blockType, pointer, message }
  })
}

/**
 * @param {'ERROR' | 'WARN'} level
 * @param {ValidationIssue[]} issues
 */
function printIssues(level, issues) {
  const grouped = new Map()

  for (const issue of issues) {
    if (!grouped.has(issue.filePath)) grouped.set(issue.filePath, [])
    grouped.get(issue.filePath).push(issue)
  }

  for (const [filePath, fileIssues] of grouped) {
    console.log(`${level} ${filePath}`)
    for (const issue of fileIssues) {
      const prefix =
        issue.blockIndex !== undefined
          ? `  Block[${issue.blockIndex}] (${issue.blockType ?? 'unknown'}):`
          : ' '
      console.log(`${prefix} ${issue.pointer} — ${issue.message}`)
    }
  }
}

/**
 * @param {string} clientId
 * @param {ReturnType<typeof createAjv>} ajv
 * @param {ReturnType<typeof createAjv>['compile']} compileClient
 * @returns {{ errors: ValidationIssue[]; warnings: ValidationIssue[] }}
 */
function validateClient(clientId, ajv, compileClient) {
  /** @type {ValidationIssue[]} */
  const errors = []
  /** @type {ValidationIssue[]} */
  const warnings = []

  const clientDir = path.join(CLIENTS_DIR, clientId)
  const clientJsonPath = path.join(clientDir, 'client.json')
  const relClientJson = path.relative(repoRoot, clientJsonPath)

  if (!fs.existsSync(clientJsonPath)) {
    errors.push({
      filePath: relClientJson,
      pointer: '(root)',
      message: 'client.json not found',
    })
    return { errors, warnings }
  }

  const clientConfig = loadJson(clientJsonPath)
  if (!compileClient(clientConfig)) {
    errors.push(...issuesFromAjvErrors(relClientJson, undefined, undefined, compileClient.errors ?? []))
  }

  const pagesDir = path.join(clientDir, 'pages')
  if (!fs.existsSync(pagesDir)) return { errors, warnings }

  const pageFiles = fs
    .readdirSync(pagesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort()

  for (const pageFile of pageFiles) {
    const pagePath = path.join(pagesDir, pageFile)
    const relPagePath = path.relative(repoRoot, pagePath)
    const page = loadJson(pagePath)
    const blocks = Array.isArray(page?.blocks) ? page.blocks : null

    if (!blocks) {
      errors.push({
        filePath: relPagePath,
        pointer: '.blocks',
        message: 'must be an array',
      })
      continue
    }

    blocks.forEach((block, blockIndex) => {
      const blockType = block && typeof block === 'object' ? block._type : undefined

      if (typeof blockType !== 'string' || blockType.length === 0) {
        errors.push({
          filePath: relPagePath,
          blockIndex,
          blockType: 'unknown',
          pointer: '._type',
          message: 'required block type missing',
        })
        return
      }

      const schemaPath = path.join(BLOCKS_DIR, `${blockType}.schema.json`)
      const relSchemaPath = path.relative(repoRoot, schemaPath)

      if (!fs.existsSync(schemaPath)) {
        warnings.push({
          filePath: relPagePath,
          blockIndex,
          blockType,
          pointer: '(schema)',
          message: `no schema found at ${relSchemaPath}`,
        })
        return
      }

      const validateBlock = ajv.compile(loadJson(schemaPath))
      if (!validateBlock(block)) {
        errors.push(...issuesFromAjvErrors(relPagePath, blockIndex, blockType, validateBlock.errors ?? []))
      }
    })
  }

  return { errors, warnings }
}

function listClientIds() {
  return fs
    .readdirSync(CLIENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

function main() {
  const clientArg = process.argv[2]
  const clientIds = clientArg ? [clientArg] : listClientIds()

  if (clientArg) {
    const clientDir = path.join(CLIENTS_DIR, clientArg)
    if (!fs.existsSync(clientDir)) {
      console.error(`ERROR client "${clientArg}" not found under config/clients/`)
      process.exit(1)
    }
  }

  const ajv = createAjv()
  const compileClient = ajv.compile(loadJson(path.join(SCHEMAS_DIR, 'client.schema.json')))

  /** @type {ValidationIssue[]} */
  const allErrors = []
  /** @type {ValidationIssue[]} */
  const allWarnings = []

  for (const clientId of clientIds) {
    const { errors, warnings } = validateClient(clientId, ajv, compileClient)
    allErrors.push(...errors)
    allWarnings.push(...warnings)
  }

  if (allErrors.length > 0) printIssues('ERROR', allErrors)
  if (allWarnings.length > 0) printIssues('WARN ', allWarnings)

  const clientLabel = clientIds.length === 1 ? '1 client' : `${clientIds.length} clients`
  const errorLabel = allErrors.length === 1 ? '1 error' : `${allErrors.length} errors`
  const warningLabel = allWarnings.length === 1 ? '1 warning' : `${allWarnings.length} warnings`
  console.log(`\nSummary: ${errorLabel}, ${warningLabel} across ${clientLabel}`)

  process.exit(allErrors.length > 0 ? 1 : 0)
}

main()
