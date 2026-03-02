---
id: "META02"
parent: null
status: "active"
priority: "critical"
scope: "meta"
type: "root"
tags: ["hivefiver", "content-architecture", "runtime-chain", "redesign"]
symlink_context: ".hivemind/context/META02-synthesis.md"
validation_log: ".hivemind/plans/VALIDATION-META02.md"
created: "2026-03-03T05:26:48Z"
last_sync: "2026-03-03T05:26:48Z"
completion_criteria:
  - "All child plans marked completed or pivoting."
  - "Validation artifact updated with evidence."
  - "Manifest entry synchronized."
  - "Agent body, prompt injection, and prime skill form one coherent non-overlapping system."
  - "Runtime restart confirmed by human."
---

# META02 — Hivefiver Content Architecture Redesign

## Context Summary
<!-- SECTION: CONTEXT_SUMMARY -->
Unified redesign of all content that enters a hivefiver runtime session. Four containers (agent body, prompt injection, prime skill, stage skills) currently have severe overlaps — identity declared 3x, scope 3x, context engineering 3x, platform knowledge 2x. Total Layer 0 load: 750+ lines before first agent action. Goal: each piece of content lives in exactly one container, total L0 budget ~350 lines, prime skill becomes the load-me-first anchor.

## Children
<!-- SECTION: CHILDREN -->
- META02-SUB01: Stale plugin cleanup (plugins/ → plugin/ path migration + deletion)
- META02-SUB02: hivefiver-prime completion (TODOs, frontmatter, standards alignment)
- META02-SUB03: Content placement architecture (which content → which container)
- META02-SUB04: Agent body + prompt injection rewrite (atomic, requires restart)

## Dependency Chain
<!-- SECTION: DEPENDENCY_CHAIN -->
```
META02-SUB01 (independent — can execute now)
META02-SUB02 (independent — can execute now)
META02-SUB03 (depends on topology analysis DONE in this session)
META02-SUB04 (depends on SUB03 — requires restart after)
```

## Execution Block
<!-- SECTION: EXECUTION_BLOCK -->
- SUB01 and SUB02 are parallelizable — zero file overlap, zero shared state.
- SUB03 produces the content placement map — no file changes, only the plan artifact.
- SUB04 is the atomic rewrite — agent body + prompt injection change together. Requires restart.
- After SUB04 completes: human restarts session, copies last message as handoff.

## Current State
<!-- SECTION: CURRENT_STATE -->
- SUB01: ready to execute (28 path references mapped, 10 files identified)
- SUB02: ready to execute (6 stale TODOs identified, 3 ref files need frontmatter)
- SUB03: ready to author (topology analysis completed in session)
- SUB04: blocked on SUB03

## Notes Footer
<!-- SECTION: NOTES_FOOTER -->
- Topology analysis done in current session — see handoff message for overlap matrix.
- Root mirror agents/hivefiver.md confirmed IDENTICAL to .opencode/agents/hivefiver.md (parity verified).
- temporary-ordained.md has unique content (LSP isolation, MCP tool rules, variable interpolation) not covered elsewhere — must be preserved somewhere.
