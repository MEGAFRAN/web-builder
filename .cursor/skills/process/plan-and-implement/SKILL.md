---
name: plan-and-implement
description: >-
  Full pipeline: multi-agent meeting, task splitting, and implementation.
  Chains /meeting with /implement-tasks. Use when the user invokes
  /plan-and-implement with agents and a topic, or asks to plan and build.
disable-model-invocation: true
---

# Plan and Implement

End-to-end workflow: strategy meeting → task files → agent implementation.

## Usage

```
/plan-and-implement <agent1> <agent2> [agent3] [agent4] "topic"
/plan-and-implement --from-summary docs/meetings/summaries/YYYY-MM-DD-slug.md
/plan-and-implement --tasks-only [--wave] [--with-tests] [--commit]
/plan-and-implement --skip-checkpoint
```

Parse the user's message after `/plan-and-implement`.

| Mode | When |
|---|---|
| Full pipeline | Agents + quoted topic provided |
| Summary only | `--from-summary <path>` — skip meeting, implement tasks from that summary |
| Tasks only | `--tasks-only` — skip meeting, run `/implement-tasks` on existing todo backlog |
| Skip review | `--skip-checkpoint` — proceed to implementation without asking for approval |

Additional flags (`--wave`, `--dry-run`, `--with-tests`, `--commit`) pass through to the implement phase.

## Process

### Phase 1 — Plan (meeting)

**Skip if:** `--from-summary`, `--tasks-only`, or no agents/topic provided.

1. Read and execute `.cursor/skills/process/meeting/SKILL.md` in full
2. Run the multi-agent meeting sequentially
3. Save summary to `docs/meetings/summaries/YYYY-MM-DD-<slug>.md`
4. Create task files in `business/tasks/todo/` per meeting step 7
5. Record the summary path for phase 2

### Phase 2 — Review checkpoint (default)

**Skip if:** `--skip-checkpoint` or `--tasks-only` with no new tasks.

Present the task list and ask:

```
Plan complete. Ready to implement?

Summary: docs/meetings/summaries/<file>.md

Tasks (execution order):
  01 → business/tasks/todo/01-slug.md (nextjs-frontend-developer)
  02 → business/tasks/todo/02-slug.md (devops)
  …

Proceed with implementation? (yes / edit tasks first / stop)
```

- **yes** → continue to phase 3
- **edit tasks first** → stop; user edits files, then runs `/implement-tasks` or `/plan-and-implement --tasks-only`
- **stop** → end after planning; report summary and task paths

### Phase 3 — Implement

1. Read and execute `.cursor/skills/process/implement-tasks/SKILL.md`
2. If `--from-summary <path>`: pass `--from-summary` to implement-tasks
3. Forward any implement flags (`--wave`, `--dry-run`, `--with-tests`, `--commit`)
4. Run dependency-ordered task execution

### Phase 4 — Close report

```
Plan and Implement — complete

Meeting summary: docs/meetings/summaries/<file>.md  (or "skipped")

Implemented (N):
  - business/tasks/done/01-slug.md

Blocked (M):
  - business/tasks/todo/05-slug.md — <reason>

Remaining in todo (K):
  - business/tasks/todo/06-slug.md

Next: /implement-tasks --wave
```

## Examples

```
/plan-and-implement ceo cto cpo cgo "Q1 demo deploy hardening"
/plan-and-implement --from-summary docs/meetings/summaries/2026-07-24-pivot-mobile-repair-shops-spain.md
/plan-and-implement --tasks-only --wave
/plan-and-implement ceo cto "fix CI guards" --skip-checkpoint --with-tests
```

## Reference

- Meeting skill: `.cursor/skills/process/meeting/SKILL.md`
- Implement skill: `.cursor/skills/process/implement-tasks/SKILL.md`
- Task template: `.cursor/skills/process/task-file-template.md`

Begin the pipeline now.
