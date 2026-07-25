---
name: implement-tasks
description: >-
  Executes engineering tasks from business/tasks/todo/ by launching the
  appropriate project agents in dependency order. Use when the user invokes
  /implement-tasks, asks to implement meeting tasks, or run the task backlog.
disable-model-invocation: true
---

# Implement Tasks

Execute engineering tasks from `business/tasks/todo/` by spawning the correct project agents in dependency order.

## Usage

```
/implement-tasks                              # all ready tasks, wave by wave
/implement-tasks <slug-or-filename>           # single task (e.g. 24-fix-tenant-isolation)
/implement-tasks --from-summary <path.md>     # tasks whose Source matches this summary
/implement-tasks --wave                       # only unblocked tasks (one wave)
/implement-tasks --dry-run                    # show execution plan, no agents
/implement-tasks --with-tests                 # run test-runner after code-owning tasks
/implement-tasks --commit                     # run code-commit after each successful task
```

Parse flags and positional args from the user's message after `/implement-tasks`.

## Preconditions

- Task files live in `business/tasks/todo/`
- Each task has an **Owner** field mapping to a project agent
- Completed tasks are tracked in `business/tasks/done/` and `business/tasks/progress.md`

## Process

### 1. Discover tasks

1. List `business/tasks/todo/*.md`
2. If `--from-summary <path>`: filter tasks where **Source:** matches the path
3. If a slug/filename arg: match that single file
4. Otherwise: include all todo tasks

### 2. Parse metadata

For each task file, extract:

| Field | Fallback if missing |
|---|---|
| **Owner** | Required — skip task and warn if absent |
| **Depends on** | `None` — treat as no blockers |
| **Execution order** | Sort by filename prefix (`NN-`) then full filename |
| **Status** | Skip if `Done`, `Blocked`, or `Cancelled` |

**Dependency resolution:** A task is **ready** when every path in **Depends on** either:
- Is `None` / empty, or
- Points to a file in `business/tasks/done/`, or
- Was completed earlier in this session

Legacy tasks without **Execution order** still work — sort by filename and parse **Depends on** only.

### 3. Build execution waves

Topologically sort ready tasks into waves:

- **Wave 1:** all ready tasks with no unresolved dependencies
- **Wave 2+:** tasks whose dependencies were satisfied by prior waves

Within a wave, tasks with no inter-dependencies may run **in parallel**. Across waves, run **sequentially** (wave N must complete before N+1).

If `--wave`: execute only wave 1 and stop.

If `--dry-run`: print the plan and stop:

```
Execution plan (3 waves, 7 tasks)

Wave 1 (parallel):
  - business/tasks/todo/01-fix-tenant-isolation.md → nextjs-frontend-developer
  - business/tasks/todo/02-fix-deploy-blob-workflow.md → devops

Wave 2:
  - business/tasks/todo/03-static-priced-services-block.md → nextjs-frontend-developer
  …
```

### 4. Execute each task

For each task in the current wave, spawn the **Owner** agent using the **Task** tool.

**Agent name → `subagent_type`:** Use Owner as kebab-case (e.g. `nextjs-frontend-developer`, `devops`, `cto`, `test-runner`, `ux-ui-designer`, `agentic-architect`, `azure-cloud-developer`, `cold-outbound-sdr`). If no matching subagent exists, use `generalPurpose` and read `.cursor/agents/<owner>.md` into the Task prompt.

**Task prompt template:**

```
Implement the engineering task defined in: <task-file-path>

Instructions:
1. Read the full task file before making any changes.
2. Follow Technical Specifications and Acceptance criteria exactly.
3. Run `npm run validate` before finishing (and relevant tests if the task touches tested code).
4. Do not commit unless the task or user explicitly requests it.
5. Report: files changed, validation result, any blockers.

Task file:
<full contents of task file>
```

Run agents in a wave **in parallel** when independent (`run_in_background: false` — wait for all to complete before next wave).

### 5. Post-task lifecycle

On **success**:

1. Move task file from `business/tasks/todo/` to `business/tasks/done/` (same filename)
2. Append to `business/tasks/progress.md`:
   ```
   DONE: business/tasks/done/<filename>
   ```
3. If `--with-tests` and Owner is a code agent (`nextjs-frontend-developer`, `devops`, `cto`): spawn `test-runner` with a prompt to run relevant tests for the changed files

On **failure**:

1. Leave the task in `business/tasks/todo/`
2. Update **Status:** to `Blocked — <reason>` at the top of the file
3. Stop the current wave — do not run dependent tasks
4. Report which task failed and what's still unblocked

If `--commit`: after each successful task, spawn `code-commit` to stage, commit, and push (only when changes exist).

### 6. Close report

```
Implement Tasks — complete

Done (N):
  - business/tasks/done/01-slug.md (nextjs-frontend-developer)
  …

Blocked (M):
  - business/tasks/todo/05-slug.md — <reason>

Ready next wave (K):
  - business/tasks/todo/06-slug.md → devops
  …

Run `/implement-tasks --wave` to continue.
```

## Skip rules

Do **not** spawn agents for tasks where:

- **Owner** is `Founder`, `CEO` (strategy-only), or any non-implementing role without a code deliverable
- **Status** is already `Done`, `Blocked`, or `Cancelled`
- Dependencies are unresolved

## Reference

- Task file format: `.cursor/skills/process/task-file-template.md`
- Agent definitions: `.cursor/agents/<owner>.md`

Begin implementing now.
