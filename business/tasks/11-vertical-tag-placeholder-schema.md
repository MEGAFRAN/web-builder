# Task: Vertical Tag + Placeholder Schema (Additive)

**Status:** Ready for development  
**Priority:** Medium — required by Task 09 and Task 10  
**Owner:** CTO / Next.js Frontend Developer  
**Estimated scope:** Small — minor additive schema enhancements and validation tests  
**Depends on:** `config/schemas/client.schema.json` and block schemas under `config/schemas/blocks/`

---

## Context

To make the system highly readable and self-documenting for onboarding agents (both human founders and future AI agents), we need to enrich our JSON Schemas with vertical tags and placeholder support. 

These changes must be strictly additive. Breaking the existing 27 block schemas is vetoed. These changes are crucial for the template-cloning script in Task 10 and the templates in Task 09 to validate cleanly.

---

## Schema Specifications

We will introduce two additive fields:

### 1. `template.vertical` in `client.schema.json`
To allow the platform and provisioning systems to categorize clients, we add a `vertical` property to the schema:
- Location: Within `client.schema.json` under properties, or inside a template description block.
- Type: `string`
- Enum values: `"beauty"`, `"tutors"`, `"repair"`, `"yoga-pilates"`, `"general"`
- Description: "Specifies the business industry vertical for template organization."

### 2. `placeholderCopy` field in Block Schemas
To denote which copy in a block can or should be substituted during concierge onboarding, we will introduce an optional metadata field in our schemas.
- Field: `placeholderCopy`
- Type: `object`
- Structure: An optional dictionary mapping block fields (e.g. `heading`, `subtext`) to descriptions of what content should go there.
- Location: This can be added as an optional property on all block JSON schemas or as an optional top-level metadata definition.

```json
{
  "properties": {
    "placeholderCopy": {
      "type": "object",
      "description": "Optional instructions mapping fields to substitution helper tokens.",
      "additionalProperties": { "type": "string" }
    }
  }
}
```

---

## Requirements

### 1. Update `client.schema.json`
- [ ] Add the `vertical` field as an optional property under the root of `client.schema.json`.
- [ ] Set `vertical` as a string with enum options: `["beauty", "tutors", "repair", "yoga-pilates", "general"]`.

### 2. Additive Block Schema Updates
- [ ] Add `placeholderCopy` to the common definitions schema or individually as an optional property in the 27 block schemas (focusing first on the 8 CPO-approved blocks used in the beauty template: `navbar`, `heroBlock`, `services`, `reservationBlock`, `testimonialsBlock`, `location`, `contactInfoBlock`, `footer`).
- [ ] Ensure that this field is fully optional and does not fail validation for existing clients who do not use it.

### 3. Verification Tests
- [ ] Verify that existing clients (e.g., `config/clients/1/client.json`) still validate 100% cleanly without errors.
- [ ] Write a simple Vitest contract test that verifies that any block JSON specifying `placeholderCopy` passes validation.

---

## Files touched

| Area | Paths |
|---|---|
| Client Schema | `config/schemas/client.schema.json` (modified) |
| Block Schemas | Files under `config/schemas/blocks/` (modified) |
| Tests | `tests/schemas-validation.test.ts` (modified or new) |

---

## Out of scope

- Refactoring existing blocks or introducing any new UI features based on these fields.
- Breaking backwards-compatibility of existing client JSON files.

---

## Acceptance criteria

1. Modifying `config/schemas/client.schema.json` doesn't break validation for any currently registered client.
2. The schemas allow the `vertical` tag on clients and `placeholderCopy` objects on blocks.
3. Tests run and verify that a config with `--vertical beauty` or a block utilizing `placeholderCopy` parses correctly without linter or schema validator complaints.
