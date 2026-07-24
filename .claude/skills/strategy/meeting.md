---
description: Run an orchestrated multi-agent meeting. Usage: /meeting <agent1> <agent2> <agent3> <agent4> "topic"
---

You are facilitating an orchestrated multi-agent meeting. Parse $ARGUMENTS to extract agent names and topic.

**Parsing rules:**
- Text in quotes = the TOPIC
- Words before the quoted topic = AGENT NAMES (in order)
- If no quotes, treat the last phrase as the topic and prior words as agent names

**Meeting protocol — run sequentially:**

1. Spawn the 1st agent with just the topic. Ask it to share its analysis, recommendations, and key concerns from its role's perspective.

2. Spawn the 2nd agent with the topic + 1st agent's full output as context. Ask it to build on what was said, add its own perspective, and note any agreements or tensions.

3. (If 3rd agent) Spawn with topic + all prior outputs. Same instructions.

4. (If 4th agent) Same pattern.

5. After all agents respond, produce a **Meeting Summary**:
   - Decisions / recommendations
   - Points of alignment
   - Unresolved tensions or open questions
   - Suggested next actions

6. **Save the summary as a deliverable** — write a `.md` file to `docs/meetings/summaries/` using the filename format `YYYY-MM-DD-<slugified-topic>.md`. The file should contain:
   - Date, agents present, and topic at the top
   - Each agent's key points (condensed)
   - The full meeting summary (decisions, alignment, tensions, next actions)

7. **Create agent task files from the summary** — run the `create_agent_task` skill using the step 6 summary as input:
   - Read the saved summary file (`docs/meetings/summaries/YYYY-MM-DD-<slugified-topic>.md`)
   - Derive delegatable tasks from **Engineering Task List** and **Suggested Next Actions** (skip founder-only items with no agent owner)
   - **Determine execution order first:** build a dependency graph from each task's blockers, then topologically sort into the order work must actually be done. Tasks with no blockers come first; a task never gets a lower number than any task it depends on.
   - **Number by execution order, not by scan order:** write one file per task to `business/tasks/todo/` as `<NN>-<kebab-slug>.md`, where `<NN>` is the task's position in that sorted list (`01`, `02`, `03`, … zero-padded). Sorting filenames alphabetically must reveal the full execution sequence — no cross-referencing required.
   - For each task, set `target_agent` from the summary's Owner column (e.g. `nextjs-frontend-developer`, `devops`, `cto`)
   - Each task file must include: title prefixed with execution order (`# Task 01 — …`), **Execution order:** N of M, Status, Priority, Owner, Estimated scope, **Depends on** (prior task file paths only, e.g. `business/tasks/todo/01-….md`), **Next task** (path to the following file, or `None` for the last), Milestone, Source (path to the summary), Context, Technical Specifications, Acceptance criteria
   - Group related engineering items into one task only when they share the same owner, dependency chain, and execution slot (e.g. T-A + T-B + T-C → one PR for `nextjs-frontend-developer` becomes a single numbered step)
   - Do **not** launch agents yet — task files only

**Format each agent's turn as:**
```
---
### [Agent Name]:
[output]
---
```

Then close with the synthesis and confirm:
- The summary file path under `docs/meetings/summaries/`
- Each task file path under `business/tasks/todo/` **in execution order** (01 → last), one line per file with owner

Begin the meeting now.
