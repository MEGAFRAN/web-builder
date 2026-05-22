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

## Mandatory Checklist
**Navigation**
- Always verify hover states on navbar links and buttons (transition-colors, hover:text-primary)
- Always verify navbar has visual separation from hero
- Always verify sticky scroll behavior with elevation change
**Grids and Cards**
- Always verify no orphan items in grids (2+1, 3+1) — force balanced columns
- Always verify equal card heights using CSS grid items-stretch
- Always verify titles with 2 lines do not misalign content below — use min-h on title container
- Always verify prices and final elements use mt-auto to anchor to card bottom
- Always verify card backgrounds use --color-surface, not plain white
**Typography**
- Always verify typographic hierarchy — headings, subheadings, body use distinct scales
- Always verify repeated card titles are not all bold/heavy
**Language and Copy**
- Always verify entire UI uses one consistent language — no mixing Spanish and English
- Always verify FAQ questions use correct grammar
- Always verify footer copyright year is dynamic (new Date().getFullYear())
**Spacing**
- Always verify horizontal padding on mobile (px-4 minimum)
- Always verify sections alternate background colors for visual rhythm
- Always verify consistent section spacing throughout
**Interactions**
- Always verify scroll entrance animations on all major sections
- Always verify count-up animations on statistics/numbers
- Always verify selected/active states on all interactive elements
**Forms**
- Always verify forms use consistent language throughout
- Always verify multi-step forms have clear visual step indicators
- Always verify form inputs have visible focus and error states
