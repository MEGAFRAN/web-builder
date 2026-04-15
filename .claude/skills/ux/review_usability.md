# Skill: review_usability

`review_usability(target: string, user_context: string) returns UsabilityReport: prioritized findings by user impact`

## Input

1. `target`: file path(s) or component name(s) to review
2. `user_context`: who the user is and what they are trying to do

## Preconditions

- Read the relevant page or component files using Read or Grep

## Process

1. Evaluate against five usability dimensions:
   - Clarity: is the primary action obvious?
   - Hierarchy: does visual weight match content importance?
   - Consistency: do patterns match elsewhere in the app?
   - Feedback: do interactive elements communicate state?
   - Load: is cognitive load appropriate for the user's context?
2. Prioritize findings by user impact, not implementation effort
3. For each finding, state which design principle it violates (see Design Principles in the agent)

## Output

Success:
```
Recommendation: <overall usability assessment>
Rationale: <design principle per finding>
Findings (ordered by user impact):
  1. <dimension> — <issue> → Fix: <concrete recommendation>
  2. <dimension> — <issue> → Fix: <concrete recommendation>
  ...
Gaps: <needs not addressable without new components>
Next Step: <highest-impact fix for nextjs-frontend-developer>
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error>
Suggested fix: <one-line actionable hint>
```
