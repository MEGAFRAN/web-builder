# Skill: create_agent_task

`create_agent_task(task_description: string, target_agent: string) returns TaskFile: .md task file written to .claude/tasks/`

## Input

1. `task_description`: full requirements for the task to be delegated
2. `target_agent`: the agent that should execute the task (e.g., `nextjs-frontend-developer`)

## Preconditions

- No file reads required; task content is derived from prior function outputs in the session

## Process

1. Derive task requirements from the current session's design output (Component Map, Gaps, Next Step)
2. Structure the task file with: objective, inputs, expected output, and constraints
3. Write the file to `.claude/tasks/<task-name>.md` using a descriptive kebab-case filename

## Output

Success:
```
Task file written: .claude/tasks/<filename>.md
Contents summary: <one-line description of what was delegated and to whom>
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error>
Suggested fix: <one-line actionable hint>
```
