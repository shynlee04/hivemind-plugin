---
name: hivefiver-context-absorb
description: Multi-wave swarm protocol for absorbing dense context (links, text, files, stories, events, actors) into persistent session-context-prompt.md. Orchestrates parallel subagent waves for parsing, deep extraction, narrative synthesis, and YAML-managed appending. Triggers on: absorb context, process prompt dump, extract links, interpret narrative, update session context, merge context, append context, ingest context, import session state, load external context.
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
