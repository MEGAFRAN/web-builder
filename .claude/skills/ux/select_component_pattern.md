# Skill: select_component_pattern

`select_component_pattern(user_goal: string, context: string) returns PatternRecommendation: named registry components with UX rationale`

## Input

1. `user_goal`: what the user of the interface needs to accomplish
2. `context`: page type, surrounding components, or interaction constraints

## Preconditions

- Read `docs/agents/component-catalog.md` to confirm available components

## Process

1. Identify the user's goal and the interaction model it requires
2. Match the goal to an established UX convention (progressive disclosure, Fitts's Law, Hick's Law, etc.)
3. Map the convention to CMS block `_type` values or primitive names; verify each exists in `docs/agents/component-catalog.md`
4. If the registry cannot satisfy the need, describe the gap with: component name, required props, expected behavior, and use case

## Card Component Rules
- Background must use --color-surface, not plain white
- Border radius must match theme character
- Cards in a grid must use same background, padding, and border treatment
- If card contains price or CTA, always use mt-auto to anchor it to card bottom

## Output

Success:
```
Recommendation: <best-fit pattern and registry component(s)>
Rationale: <UX convention applied and why it fits this goal>
Component Map:
  - <ComponentName>: <role in the pattern>
  - <ComponentName>: <role in the pattern>
Gaps: <missing components described with props, behavior, use case>
Next Step: <one action for nextjs-frontend-developer>
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error>
Suggested fix: <one-line actionable hint>
```
