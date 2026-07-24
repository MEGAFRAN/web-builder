---
name: create-agent-task
description: >-
  Writes delegated task files for other agents based on design output from the
  current session. Use when handoff to nextjs-frontend-developer or another
  agent is needed after UX/design work.
---

# Create Agent Task

## Input

1. `task_description`: full requirements for the task to be delegated
2. `target_agent`: the agent that should execute the task (e.g., `nextjs-frontend-developer`)

## Preconditions

- No file reads required; task content is derived from prior function outputs in the session

## Process

1. Derive task requirements from the current session's design output (Component Map, Gaps, Next Step)
2. Structure the task file with: objective, inputs, expected output, and constraints
3. Write the file to `.cursor/tasks/<task-name>.md` using a descriptive kebab-case filename
4. Ensure `.cursor/tasks/` exists before writing

## Cursor implementation

To delegate execution immediately, launch the target agent with the **Task** tool using `subagent_type` matching the agent name (e.g. `nextjs-frontend-developer`, `devops`, `test-runner`). Include the task file path and full requirements in the Task prompt.

## Output

Success:
```
Task file written: .cursor/tasks/<filename>.md
Contents summary: <one-line description of what was delegated and to whom>
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error>
Suggested fix: <one-line actionable hint>
```
