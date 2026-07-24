---
name: design-information-architecture
description: >-
  Designs site navigation and information architecture using registry components.
  Use when organizing pages, nav structure, wayfinding, Navbar/Footer composition,
  or IA hierarchy for a site.
---

# Design Information Architecture

## Input

1. `site_scope`: the set of pages or sections to organize
2. `user_types`: who the users are and their primary navigation goals

## Preconditions

- Glob `app/**/nav*.tsx`, `components/**/Navbar*`, `components/**/Footer*` to read existing navigation files
- Glob `app/**/page.tsx` to read existing page structure and understand current hierarchy

## Process

1. Inventory all current top-level and secondary routes
2. Apply IA principles: clear labels, shallow hierarchy (max 3 levels), predictable groupings
3. Identify wayfinding requirements: how users know where they are and where they can go
4. Recommend specific Navbar/NavLink/Breadcrumb/Footer compositions using registry component names
5. Verify every recommended component exists in `docs/agents/component-catalog.md`

## Output

Success:
```
Recommendation: <proposed IA structure>
Rationale: <IA principle per structural decision>
Component Map:
  - <ComponentName>: <navigation role>
  - <ComponentName>: <navigation role>
IA Hierarchy:
  Level 1: <top-level labels>
  Level 2: <grouped sub-labels>
  Level 3: <deepest level, if needed>
Gaps: <navigation needs the registry cannot satisfy>
Next Step: <one action for nextjs-frontend-developer>
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error>
Suggested fix: <one-line actionable hint>
```
