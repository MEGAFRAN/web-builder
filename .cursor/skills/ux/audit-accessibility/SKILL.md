---
name: audit-accessibility
description: >-
  Audits components and pages for WCAG 2.2 AA compliance with severity-rated
  findings and concrete fixes. Use when reviewing accessibility, WCAG compliance,
  or keyboard/contrast issues in UI code.
---

# Audit Accessibility

## Input

1. `target`: file path(s) or component name(s) to audit

## Preconditions

- Read the target file(s) using Read or Grep

## Process

1. Evaluate against the four WCAG principles relevant to the component type:
   - Perceivable: color contrast, alt text, text alternatives
   - Operable: keyboard navigation, focus order, target size (24x24px minimum)
   - Understandable: labels, error messages, consistent navigation
   - Robust: semantic HTML, ARIA roles and attributes
2. Rate each issue by severity: Critical (blocks access), Major (significant friction), Minor (best practice gap)
3. Cite the exact WCAG criterion number for every finding (e.g., WCAG 1.4.3)
4. Provide a concrete, implementable fix for every issue — never flag without a solution

## Visual Contrast Checklist
- Adjacent sections must not share the same background color
- Cards must have sufficient contrast against page background
- Interactive elements must have visible focus and hover states meeting WCAG 1.4.11
- Mobile layouts must have minimum px-4 horizontal padding

## Output

Success:
```
Recommendation: <summary of overall accessibility posture>
Rationale: <WCAG criteria cited per finding>
Findings:
  [Critical] WCAG <X.X.X> — <issue description> → Fix: <concrete fix>
  [Major]    WCAG <X.X.X> — <issue description> → Fix: <concrete fix>
  [Minor]    WCAG <X.X.X> — <issue description> → Fix: <concrete fix>
Gaps: <structural gaps requiring new components or patterns>
Next Step: <highest-priority fix for nextjs-frontend-developer>
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error, e.g., target file not found>
Suggested fix: <one-line actionable hint>
```
