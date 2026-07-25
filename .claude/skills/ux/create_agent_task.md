# Skill: create_agent_task

`create_agent_task(task_description: string, target_agent: string, output_mode?: string) returns TaskFile`

Write task files that `/implement-tasks` can execute.

## Input

1. `task_description`: full requirements (from UX design output or meeting summary)
2. `target_agent`: agent that should execute (e.g. `nextjs-frontend-developer`, `devops`)
3. `output_mode` (optional): `engineering` (default for meetings) | `ux-handoff`

## Output locations

| Mode | Directory | When |
|---|---|---|
| `engineering` | `business/tasks/todo/` | Meeting summaries, roadmap tasks, implementable work |
| `ux-handoff` | `.claude/tasks/` | One-off UX → frontend handoffs within a session |

For engineering tasks, follow `.claude/skills/process/task_file_template.md`.

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
2. Write to `.claude/tasks/<task-name>.md` with objective, inputs, expected output, constraints

## Output

Success (engineering):
```
Task files written (execution order):
  - business/tasks/todo/01-slug.md → nextjs-frontend-developer
Run /implement-tasks --from-summary <source-path> to execute.
```

Success (UX handoff):
```
Task file written: .claude/tasks/<filename>.md
Contents summary: <one-line description>
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error>
Suggested fix: <one-line actionable hint>
```
