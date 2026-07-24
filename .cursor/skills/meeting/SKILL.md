---
name: meeting
description: >-
  Facilitates an orchestrated multi-agent meeting where 2–4 project agents
  discuss a topic sequentially and produce a saved summary. Use when the user
  invokes /meeting with agent names and a topic, or asks to run a multi-agent
  strategy meeting.
disable-model-invocation: true
---

# Meeting

Run an orchestrated multi-agent meeting. Usage: `/meeting <agent1> <agent2> <agent3> <agent4> "topic"`

Parse the user's message after `/meeting` to extract agent names and topic.

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

**Format each agent's turn as:**
```
---
### [Agent Name]:
[output]
---
```

Then close with the synthesis and confirm the summary file was saved.

Begin the meeting now.

## Cursor implementation

Use the **Task** tool to spawn agents. Run each agent **sequentially** (`run_in_background: false`).

**Agent name → `subagent_type`:** Use the agent name as kebab-case (e.g. `ceo`, `cto`, `cpo`, `cgo`, `devops`, `nextjs-frontend-developer`, `ux-ui-designer`, `test-runner`, `agentic-architect`, `azure-cloud-developer`, `cold-outbound-sdr`, `code-commit`). If no matching subagent exists, use `generalPurpose` and read `.cursor/agents/<name>.md` into the Task prompt.

**Task prompt template (agent 1):**
```
Topic: <topic>

You are participating in a multi-agent meeting. Share your analysis, recommendations, and key concerns from your role's perspective.
```

**Task prompt template (agent 2+):**
```
Topic: <topic>

Prior meeting context:
<prior agent outputs>

Build on what was said, add your own perspective, and note any agreements or tensions with prior speakers.
```

Ensure `docs/meetings/summaries/` exists before writing the summary file. Slugify the topic (lowercase, hyphens, no special chars).
