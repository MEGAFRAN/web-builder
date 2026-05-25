// @vitest-environment node
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { describe, expect, it } from 'vitest'

type AjvValidate = ((data: unknown) => boolean) & {
  errors?: Array<{ message?: string; dataPath?: string }> | null
}

const require = createRequire(import.meta.url)
const Ajv = require('ajv') as new (options?: { allErrors?: boolean }) => {
  addSchema(schema: object, key?: string): void
  compile(schema: object): AjvValidate
}

const ROOT = path.resolve(__dirname, '..')
const SCHEMAS_DIR = path.join(ROOT, 'config/schemas')
const BLOCKS_DIR = path.join(SCHEMAS_DIR, 'blocks')
const CLIENTS_DIR = path.join(ROOT, 'config/clients')

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T
}

function formatAjvErrors(
  errors: Array<{ message?: string; dataPath?: string }> | null | undefined,
): string {
  if (!errors?.length) return 'unknown validation error'
  return errors.map((error) => `${error.dataPath ?? '(root)'}: ${error.message ?? 'invalid'}`).join('; ')
}

function createAjvWithBlockRefs() {
  const ajv = new Ajv({ allErrors: true })
  ajv.addSchema(loadJson(path.join(BLOCKS_DIR, '_common.schema.json')), '_common.schema.json')
  return ajv
}

describe('schema validation', () => {
  it('validates all registered client.json files against client.schema.json', () => {
    const ajv = createAjvWithBlockRefs()
    const validate = ajv.compile(loadJson(path.join(SCHEMAS_DIR, 'client.schema.json')))

    const clientDirs = fs
      .readdirSync(CLIENTS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())

    for (const dir of clientDirs) {
      const clientPath = path.join(CLIENTS_DIR, dir.name, 'client.json')
      if (!fs.existsSync(clientPath)) continue

      const client = loadJson(clientPath)
      const valid = validate(client)
      expect(valid, formatAjvErrors(validate.errors)).toBe(true)
    }
  })

  it('accepts client config with vertical beauty', () => {
    const ajv = createAjvWithBlockRefs()
    const validate = ajv.compile(loadJson(path.join(SCHEMAS_DIR, 'client.schema.json')))
    const baseClient = loadJson<Record<string, unknown>>(path.join(CLIENTS_DIR, '1/client.json'))

    const valid = validate({ ...baseClient, vertical: 'beauty' })
    expect(valid, formatAjvErrors(validate.errors)).toBe(true)
  })

  it('validates blocks that specify placeholderCopy', () => {
    const ajv = createAjvWithBlockRefs()
    const beautyBlockSchemas = [
      'navbar.schema.json',
      'heroBlock.schema.json',
      'services.schema.json',
      'reservationBlock.schema.json',
      'testimonialsBlock.schema.json',
      'location.schema.json',
      'contactInfoBlock.schema.json',
      'footer.schema.json',
    ]

    const sampleBlocks: Record<string, object> = {
      'navbar.schema.json': {
        _type: 'navbar',
        logo: '{{businessName}}',
        placeholderCopy: { logo: 'Business name shown in the navbar' },
      },
      'heroBlock.schema.json': {
        _type: 'heroBlock',
        heading: '{{businessName}}',
        placeholderCopy: {
          heading: 'Primary hero headline',
          subtext: 'Short supporting tagline',
        },
      },
      'services.schema.json': {
        _type: 'services',
        items: [{ title: '{{primaryService}}', description: 'Service overview' }],
        placeholderCopy: { heading: 'Services section title' },
      },
      'reservationBlock.schema.json': {
        _type: 'reservationBlock',
        heading: 'Book with {{ownerFirstName}}',
        placeholderCopy: { heading: 'Booking section headline' },
      },
      'testimonialsBlock.schema.json': {
        _type: 'testimonialsBlock',
        items: [{ name: 'Alex', quote: 'Great service' }],
        placeholderCopy: { heading: 'Testimonials section title' },
      },
      'location.schema.json': {
        _type: 'location',
        showMap: true,
        address: '{{address}}',
        placeholderCopy: { address: 'Studio or salon address' },
      },
      'contactInfoBlock.schema.json': {
        _type: 'contactInfoBlock',
        phone: '{{phone}}',
        placeholderCopy: { phone: 'Primary contact phone number' },
      },
      'footer.schema.json': {
        _type: 'footer',
        copyright: '© {{businessName}}',
        placeholderCopy: { copyright: 'Footer copyright line' },
      },
    }

    for (const schemaFile of beautyBlockSchemas) {
      const validate = ajv.compile(loadJson(path.join(BLOCKS_DIR, schemaFile)))
      const block = sampleBlocks[schemaFile]
      const valid = validate(block)
      expect(valid, `${schemaFile}: ${formatAjvErrors(validate.errors)}`).toBe(true)
    }
  })
})
