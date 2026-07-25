# Task File Template

Use this template when writing engineering task files to `business/tasks/todo/`. Meeting summaries and UX handoffs both produce files here.

## Filename

```
business/tasks/todo/<NN>-<kebab-slug>.md
```

- `<NN>` = zero-padded execution order (`01`, `02`, …). Sorting filenames alphabetically reveals the pipeline.
- `<kebab-slug>` = short descriptive slug (lowercase, hyphens).

Legacy tasks may use non-sequential numbers (e.g. `24-fix-tenant-isolation-company-profile.md`). New batches from meetings always start at `01`.

## Required frontmatter block

```markdown
# Task 01 — Short title (T-X optional)

**Status:** Ready for development
**Priority:** High | Critical | Medium | Low — one-line reason
**Owner:** nextjs-frontend-developer | devops | cto | test-runner | …
**Estimated scope:** Small — 30 min | Medium — 3 h | …
**Execution order:** 1 of M
**Depends on:** None | business/tasks/todo/01-prior-task.md
**Next task:** business/tasks/todo/02-next-task.md | None
**Milestone:** M0 (Week 1) | …
**Source:** docs/meetings/summaries/YYYY-MM-DD-slug.md | UX session | …

---

## Context

Why this task exists, what breaks without it, and any locked decisions from the source meeting.

---

## Technical Specifications

Concrete implementation guidance: files, functions, options, investigation steps.

---

## Requirements

- [ ] Checklist of deliverables

---

## Files touched

| Area | Paths |
|---|---|
| … | … |

---

## Out of scope

What must NOT change.

---

## Acceptance criteria

1. Verifiable outcome one
2. Verifiable outcome two
```

## Field rules

| Field | Rule |
|---|---|
| **Owner** | Must map to a project agent (`ceo`, `cto`, `devops`, `nextjs-frontend-developer`, etc.). Skip founder-only items — no task file. |
| **Depends on** | Prior task file paths only, or `None`. Use for topological sort. |
| **Next task** | Path to the following file in execution order, or `None` for the last step. |
| **Execution order** | `N of M` where M = total tasks in the batch. |
| **Source** | Path to the meeting summary or design doc that originated this task. |

## Grouping

Combine related engineering items into one task only when they share the same owner, dependency chain, and execution slot (e.g. T-A + T-B → one PR for `nextjs-frontend-developer`).

## Lifecycle

| Location | Meaning |
|---|---|
| `business/tasks/todo/` | Ready or in progress |
| `business/tasks/done/` | Completed — moved by `/implement-tasks` |
| `business/tasks/backlog/` | Deferred, not yet ready |

On completion, append to `business/tasks/progress.md`:

```
DONE: business/tasks/done/<NN>-<kebab-slug>.md
```
