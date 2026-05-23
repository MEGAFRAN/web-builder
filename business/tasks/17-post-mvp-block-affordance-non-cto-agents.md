# Task: Post-MVP Block Affordance for Non-CTO Agents

**Status:** Pending  
**Priority:** Low — scheduled for M3 (engineering governance & scale)  
**Owner:** CTO  
**Estimated scope:** Small — documentation guide + a Vitest contract test  
**Depends on:** `business/tasks/11-vertical-tag-placeholder-schema.md` (Assumes JSON Schemas are finalized)

---

## Context

Our codebase is built, maintained, and scaled entirely by autonomous AI agents. To unlock future verticals (like tutors or repair services) without requiring direct CTO intervention, we must establish a self-serve guardrail for adding new UI blocks.

Currently, we have 27 blocks in our registry. If a non-CTO agent needs to add a block post-MVP, they must follow strict sandboxing guidelines to avoid breaking core platform logic.

This task involves two parts:
1. Writing a developer-agent guideline file `docs/agents/adding-a-block.md`.
2. Implementing an automated Vitest contract test that enforces these constraints at check-in (e.g. failing the build if a registered block lacks a valid schema).

---

## Engineering Guidelines

### Safe Areas for Edits
Non-CTO developer agents may only touch these files to implement new block structures:
- `components/blocks/*.tsx` (The React visual component)
- `config/schemas/blocks/*.schema.json` (The JSON validation schema)
- `components/componentRegistry.ts` (The central registry file matching names to components)

### Off-Limit Areas
Under no circumstances may client-level block-builder agents edit:
- `app/layout.tsx` (Global core layout)
- `lib/client-config.ts` (Core config parser)
- `scripts/*` (Provisioning and deployment scripts)

---

## Requirements

### 1. Guideline Documentation
- [ ] Create and author `docs/agents/adding-a-block.md`.
- [ ] Document the exact 3 files to edit to add a new block.
- [ ] List the forbidden directories and files with clear warnings for AI agents.
- [ ] Provide a fully worked code example of a mock block:
  - React visual component
  - JSON schema block
  - Registry entry snippet

### 2. Automated Contract Test
- [ ] Implement a Vitest contract test `tests/block-registry-contract.test.ts`.
- [ ] The test must dynamically:
  - Read `components/componentRegistry.ts` (or parse all registered block types).
  - Match each registered block to its corresponding schema file in `config/schemas/blocks/{blockType}.schema.json`.
  - Fail the test if a block type is registered but has no schema, or if the schema is malformed.
  - Fail if a schema exists but isn't listed in the registry.

---

## Files touched

| Area | Paths |
|---|---|
| Documentation | `docs/agents/adding-a-block.md` (new) |
| Automated Tests | `tests/block-registry-contract.test.ts` (new) |

---

## Out of scope

- Creating any new block types (this task only sets up the guidelines and automated testing structures for future agents).

---

## Acceptance criteria

1. The documentation file `docs/agents/adding-a-block.md` exists and contains precise instructions that LLMs can parse.
2. The Vitest contract test `tests/block-registry-contract.test.ts` is implemented.
3. Running `npm run test` (or the corresponding Vitest runner command) executes the contract test successfully.
4. Intentionally registering a dummy block in the registry without creating a schema causes the test to fail with a clear, structured error message.
