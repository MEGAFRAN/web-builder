---
name: create-agent-task
description: >-
  Writes delegated task files for project agents. Use after UX/design work or
  meeting summaries when handoff to nextjs-frontend-developer, devops, or
  another agent is needed. Outputs to business/tasks/todo/ for engineering
  tasks or .cursor/tasks/ for ad-hoc UX handoffs.
---

# Create Agent Task

Write task files that `/implement-tasks` can execute.

## Input

1. `task_description`: full requirements (from UX design output or meeting summary)
2. `target_agent`: agent that should execute (e.g. `nextjs-frontend-developer`, `devops`)
3. `output_mode` (optional): `engineering` (default for meetings) | `ux-handoff`

## Output locations

| Mode | Directory | When |
|---|---|---|
| `engineering` | `business/tasks/todo/` | Meeting summaries, roadmap tasks, implementable work |
| `ux-handoff` | `.cursor/tasks/` | One-off UX → frontend handoffs within a session |

For engineering tasks, follow `.cursor/skills/process/task-file-template.md`.

## Process — engineering mode (meetings)

1. Read the source (meeting summary or design doc)
2. Derive delegatable tasks from **Engineering Task List** and **Suggested Next Actions**
3. Skip founder-only items with no agent owner
4. Build dependency graph → topologically sort
5. Number by execution order: `<NN>-<kebab-slug>.md` (`01`, `02`, …)
6. Write each file with: Execution order, Depends on, Next task, Owner, Context, Technical Specifications, Acceptance criteria, Source
7. Group related items only when same owner, dependency chain, and execution slot
8. Remove prior `business/tasks/todo/` files sourced from the same summary before writing a new batch
9. Do **not** launch agents — task files only. User runs `/implement-tasks` next.

## Process — UX handoff mode

1. Derive requirements from session design output (Component Map, Gaps, Next Step)
2. Write to `.cursor/tasks/<task-name>.md` with objective, inputs, expected output, constraints
3. Ensure `.cursor/tasks/` exists

## Cursor implementation

To delegate immediately (skip file-only mode), launch the target agent with the **Task** tool using `subagent_type` matching the agent name. Include the task file path and full requirements.

For batch execution, prefer `/implement-tasks` over launching agents one-by-one.

## Output

Success (engineering):
```
Task files written (execution order):
  - business/tasks/todo/01-slug.md → nextjs-frontend-developer
  - business/tasks/todo/02-slug.md → devops
Run /implement-tasks --from-summary <source-path> to execute.
```

Success (UX handoff):
```
Task file written: .cursor/tasks/<filename>.md
Contents summary: <one-line description>
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error>
Suggested fix: <one-line actionable hint>
```
