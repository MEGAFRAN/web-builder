# Skill: grammar

`grammar(language: string, file: string) returns GrammarFixResult: language-aware grammar and spelling corrections applied to the given file`

## Invocation

User command form:

```
/grammar <language> <file>
```

- **`language`**: Target language for proofreading (e.g. `en`, `es`, `English`, `Spanish`). All grammar, spelling, punctuation, and typography rules MUST follow this language’s conventions, not the model’s default locale.
- **`file`**: Path to the file to read and edit (relative to the repo root or absolute). This is the only file in scope unless the user explicitly names more paths.

Parse rules:

1. If arguments are missing or ambiguous, ask once for `language` and `file` before editing.
2. Treat the first token after `/grammar` as `language` and the remainder as `file` if the path contains spaces (or use quoted paths if the user provides them).

## Preconditions

- Read `file` with Read (or project tools) before changing it — do not invent content or “fix” from memory.
- If the path does not exist or is not readable, stop and return **Failure** (do not create a new file unless the user asked to).

## Process

1. **Confirm language norms**  
   Apply standard written norms for `language` (spelling variant, punctuation, capitalization, hyphenation, date/number style where visible in prose). If `language` is a short code (e.g. `en`), infer the appropriate regional default only when the file content does not imply a variant (e.g. `en-GB` vs `en-US` from existing spellings).

2. **Scope of edits**  
   - Fix **grammar, spelling, typos, and punctuation** in human-readable prose only.  
   - **Do not** rename identifiers, API fields, URLs, paths, commands, or configuration keys.  
   - **Do not** change semantics, tone, or factual claims unless fixing a clear grammatical error (e.g. subject–verb agreement).  
   - In structured files (JSON, YAML, TS types): only adjust string values meant for display or documentation; never break syntax or schema.

3. **Preserve structure**  
   Keep formatting, indentation, line order, and code structure unchanged except where a character inside allowed prose must change.

4. **Apply**  
   Write edits back using the project’s normal edit tools (e.g. StrReplace / Write). Keep the diff minimal and limited to `file`.

## Output

Success:
```
Language: <resolved language>
File: <resolved path>
Summary: <short description of what was corrected>
Changes: <bulleted list of notable fixes, or "Minor spelling/punctuation only">
Notes: <optional: ambiguous places left unchanged and why>
```

Failure:
```
FAILED at step <N> — <step name>
Reason: <exact error, e.g., file not found>
Suggested fix: <one-line actionable hint>
```
