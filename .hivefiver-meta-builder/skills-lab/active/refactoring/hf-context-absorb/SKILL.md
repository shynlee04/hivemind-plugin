---
name: hf-context-absorb
description: >
  Multi-wave swarm protocol for absorbing dense context (links, text, files, stories, events, actors) into persistent session-context-prompt.md. Orchestrates parallel subagent waves for parsing, deep extraction, narrative synthesis, and YAML-managed appending. Triggers on: absorb context, process prompt dump, extract links, interpret narrative, update session context, merge context, append context, ingest context, import session state, load external context.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep]
---

# HF Context Absorb

Multi-wave swarm protocol. Parses dense user input (URLs, files, narrative, events, actors) and appends structured content to `.hivemind/state/session-context-prompt.md`.

## Execution Context

Load these skills before starting:
- `hm-detective` — disk file reading (SKIM/SCAN/DEEP escalation)
- `hm-synthesis` — compression and cross-dependency analysis
- `hm-deep-research` — URL extraction and research patterns

## Wave Protocol (summary — see `references/01-wave-protocol-detail.md` for full specs)

| Wave | Mode | Subagents | Purpose |
|------|------|-----------|---------|
| **0: State Load** | Sequential (self) | 0 | Read existing file, compute delta vs new input |
| **1: Outline Formation** | Parallel | 3 (Parser, Matcher, Scanner) | Categorize input, detect overlaps, scan disk files |
| **2: Deep Processing** | Parallel | 2–3 (URL Extract, Narrative, Cross-Ref) | Extract URLs, synthesize narrative, cross-reference |
| **3: Clarification** | Conditional | 0 (AskUserQuestion) | Resolve ambiguities (max 5 questions, skip if clear) |
| **4: Assemble & Append** | Sequential (self) | 0 | Merge YAML, construct XML block, append, validate |

### Wave Gates

- **Wave 0→1:** Delta report computed. If no existing file: clean slate flag.
- **Wave 1→2:** ≥80% of input elements categorized. If fail: re-dispatch failed parser (max 2 retries).
- **Wave 2→3:** Every URL extracted or flagged failed. If >5 unresolved → Wave 3. Else skip to Wave 4.
- **Wave 3→4:** All ambiguities resolved or escalated to `open_questions`.

## Subagent Prompt Envelope

Every subagent receives:

```
[Session Context]
Phase: hf-absorb Wave N
Existing context size: <lines> lines
Goals: Interpret and persist user's dense context into structured session state
Constraints: Tokens don't matter. Accuracy does. Use ALL available tools aggressively.
Input: <relevant portion for this wave>
Wave findings so far: <summary of previous wave outputs>
```

## YAML Merge Rules (summary — see `references/02-yaml-merge-operations.md`)

On append to session-context-prompt.md frontmatter:
- `dates_active` — APPEND today if absent
- `actors` — MERGE-APPEND (check name exists case-insensitive)
- `domains` — APPEND if new
- `sessions_count` — INCREMENT
- `last_updated` — OVERWRITE with current timestamp
- `complexity` — RECOMPUTE: `max(existing, new)`, cap 10
- `absorb_history` — APPEND new entry
- **Preserve ALL unknown existing fields** — never delete fields from other schemas

If existing YAML lacks absorb fields (first run), initialize them alongside existing fields.

## XML Body Schema (summary — see `references/03-xml-body-schema.md`)

New content appended as:
```xml
<absorb-session date="YYYY-MM-DD" wave_count="N">
  <sources>...</sources>
  <narrative>...</narrative>
  <entities>...</entities>
  <timeline>...</timeline>
  <insights>...</insights>
  <questions_open>...</questions_open>
</absorb-session>
```

## Tool Selection (summary — see `references/04-tool-selection-matrix.md`)

| Task | Primary | Fallback |
|------|---------|----------|
| URL content | `tavily_extract` (batch 20) | `brave_web_search` → `fetcher` |
| Library docs | `context7` pair | `deepwiki_ask_question` |
| GitHub repos | `deepwiki_ask_question` | `repomix_pack_remote_repository` |
| Disk files | `hm-detective` SKIM→SCAN | Direct `Read` for <100 LOC |
| Cross-dep | `hm-synthesis` FOCUSED | Manual grep + cross-compare |

## Error Recovery

| Error | Action |
|-------|--------|
| Target file missing | Initialize with YAML + empty body, then resume Wave 0 |
| YAML parse failure | Extract body, reconstruct YAML from scratch |
| URL extraction failure | Flag `extracted="false"`, add to `open_questions` |
| Subagent timeout | Record partial output, advance with available data |
| Write conflict | Re-read, re-merge, re-write (max 3 retries) |

## Anti-Patterns

| Anti-Pattern | Correction |
|-------------|------------|
| Silent overwrite | ALWAYS append. Verify with line count delta. |
| YAML corruption | Re-parse original, merge to parsed object, re-serialize |
| Phantom URLs | Every URL must have extraction attempt + result |
| Ghost actors | Cross-check narrative refs vs entities list |
| Wave skip | Enforce sequential wave progression |

## References

- `references/01-wave-protocol-detail.md` — Per-wave I/O schemas, subagent dispatch templates, transition guards
- `references/02-yaml-merge-operations.md` — Complete merge operation catalog with schema compatibility matrix and examples
- `references/03-xml-body-schema.md` — XML tag definitions, nesting rules, attribute specifications, validation
- `references/04-tool-selection-matrix.md` — Expanded tool comparison with latency and quality tradeoffs

## Self-Correction

### When the Task Keeps Failing
[Detection] Wave 1 fails to categorize ≥80% of input elements after 2 retries. Same URL extraction keeps failing across all fallback tools. YAML merge corrupts the session file and reconstruction also fails.
[Recovery] STOP advancing waves. For Wave 1 failures: inspect the uncategorized elements — they may be in an unexpected format (binary, encoded, non-text). Flag uncategorized elements in `open_questions` and continue with partial data. For persistent URL failures: flag as `extracted="false"` and add to open_questions. For YAML corruption: save the corrupted file as `.backup`, reconstruct from the last known good state, and append the new content manually with validation.

### When Unsure About the Next Step
[Detection] Unclear whether Wave 3 (clarification) is needed. Input classification is ambiguous — unsure if it's a URL, narrative, or file reference. Can't determine whether existing session-context-prompt.md content should be replaced or merged.
[Recovery] For Wave 3: trigger it if there are >5 unresolved questions. For ambiguous input: use the Parser subagent's classification result — if it's low confidence, route to Wave 3 for clarification. For merge vs replace: ALWAYS merge (append). This skill never replaces existing content. If the content truly needs replacement, flag it for human decision.

### When the User Contradicts Skill Guidance
[Detection] User says "just summarize it all in one go, don't split into waves" (violating wave protocol). User says "overwrite the existing context, I don't need the old stuff" (violating append-only rule). User says "skip the tool selection, just use read for everything."
[Recovery] Acknowledge but explain: "The wave protocol prevents context pollution by processing different input types through specialist subagents. Skipping waves means one agent handles all input types, which degrades quality. The append-only rule preserves historical context — older sessions may contain important decisions." If the user insists, proceed with the shortcut but document it and warn that quality may be affected.

### When an Edge Case Is Encountered
[Detection] Input contains binary attachments or non-text content. Session-context-prompt.md has grown beyond practical token limits. Multiple absorb sessions running concurrently (race condition on append). YAML frontmatter uses a schema this skill doesn't recognize.
[Recovery] For binary content: skip with a note in sources that binary content was ignored. For oversized files: suggest archiving older absorb-session blocks to a separate archive file and keeping only recent sessions in the active file. For concurrent sessions: DO NOT proceed — detect the conflict by checking file modification time vs last read time, and wait or escalate. For unknown YAML schemas: preserve all unknown fields (per merge rules), add absorb-specific fields alongside them, and note the unknown schema in the absorb_session metadata.
