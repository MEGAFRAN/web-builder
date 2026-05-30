# Skill: design_page_layout

`design_page_layout(page_type: string, user_goals: string) returns ComponentMap: page structure with rationale`

## Input

1. `page_type`: the kind of page being designed (e.g., landing page, dashboard, pricing, onboarding)
2. `user_goals`: what the user of that page needs to accomplish

## Preconditions

- Read `docs/agents/component-catalog.md` to confirm available components
- Glob `app/**/*.tsx` to read existing pages and understand established patterns

## Process

1. Identify the primary user goal and the secondary goals for this page type
2. Map established UX reading patterns (F-pattern, Z-pattern) to section placement
3. Assign CMS block `_type` values or primitives from the catalog; verify each name exists in `docs/agents/component-catalog.md`
4. Apply visual hierarchy: order sections so weight matches content priority
5. Flag every user need that no current registry component can satisfy

## Grid Layout Rules
- Never propose a grid that results in orphan items (2+1, 3+1)
- Always specify equal card heights using CSS grid items-stretch
- Always specify card internal structure as flex flex-col h-full
- Always specify min-h on title containers when titles may wrap

## Output

Success:
```
Recommendation: <direct design answer>
Rationale: <UX principle or evidence per decision>
Component Map:
  1. <ComponentName> — <purpose and placement rationale>
  2. <ComponentName> — <purpose and placement rationale>
  ...
Gaps: <user needs not addressable by registry; precise enough to hand off>
Next Step: <one action for nextjs-frontend-developer>
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error, e.g., component-catalog.md not found>
Suggested fix: <one-line actionable hint>
```
