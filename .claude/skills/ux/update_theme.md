# Skill: update_theme

`update_theme(change_request: string) returns ThemeRecommendation: token or preset changes with design rationale`

## Input

1. `change_request`: what aspect of the theme needs to change and why

## Preconditions

Read all three files before proceeding — do not answer from memory or assumptions:
- `docs/theme-guide.md`
- `lib/theme-presets.ts`
- `lib/theme.json`

## Visual Rhythm Rule
- Card components use --color-surface, not plain white
- Page sections alternate between --color-surface and white
- No two adjacent sections share the exact same background color
- Border radius on cards matches theme character — warm themes use smaller radius (4-8px)

## Process

1. Identify which token(s) or preset(s) the `change_request` maps to
2. Evaluate the change against existing theme values to detect conflicts or regressions
3. Verify contrast ratios for any color changes:
   - WCAG 1.4.3: 4.5:1 for normal text, 3:1 for large text
   - WCAG 1.4.11: 3:1 for UI component boundaries
4. Describe the exact token path and new value — do not write code; hand off to developer

## Output

Success:
```
Recommendation: <token path(s) and proposed value(s)>
Rationale: <design and accessibility rationale per change>
Gaps: <theme system limitations that prevent the change as requested>
Next Step: <one action for nextjs-frontend-developer, referencing theme-guide.md section>
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error, e.g., theme.json not found>
Suggested fix: <one-line actionable hint>
```
