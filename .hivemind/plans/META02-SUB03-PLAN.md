---
id: "META02-SUB03"
parent: "META02"
status: "active"
priority: "critical"
scope: "meta"
type: "sub"
tags: ["content-architecture", "topology", "placement-map", "redesign"]
symlink_context: ".hivemind/context/META02-SUB03-synthesis.md"
validation_log: ".hivemind/plans/VALIDATION-META02-SUB03.md"
created: "2026-03-03T05:26:48Z"
last_sync: "2026-03-03T05:26:48Z"
completion_criteria:
  - "Content placement map covers every section in agent body (14 XML blocks)."
  - "Content placement map covers every section in temporary-ordained.md (5 phases)."
  - "Content placement map covers every section in hivefiver-prime SKILL.md (8 sections)."
  - "No content domain appears in more than one container."
  - "Unique content from temporary-ordained.md preserved in designated container."
  - "L0 token budget target declared per container."
---

# META02-SUB03 — Content Placement Architecture

## Context Summary
<!-- SECTION: CONTEXT_SUMMARY -->
This plan produces the PLACEMENT MAP — which content block lives in which container. No file changes. Only the plan artifact. This is the decision document that SUB04 executes.

## The Four Containers
<!-- SECTION: CONTAINERS -->

| Container | File | Role | Current Lines | Target Lines |
|-----------|------|------|:---:|:---:|
| Agent Body | `.opencode/agents/hivefiver.md` | Permanent identity + minimum routing | 524 | 150-200 |
| Prompt Injection | `.opencode/prompts/temporary-ordained.md` | Temporary operational directives | 225 | 0-50 (or removed) |
| Prime Skill | `.opencode/skills/hivefiver-prime/SKILL.md` | Session orientation, guardrails, disclosure | 232 | 200-300 |
| Stage Skills | `hivefiver-mode` + `hivefiver-coordination` | Stage-specific routing + quality gates | 375 | Keep as-is |

## Overlap Matrix (What's Duplicated Now)
<!-- SECTION: OVERLAP_MATRIX -->

| Content Domain | Body | Injection | Prime | Mode | Coord |
|----------------|:----:|:---------:|:-----:|:----:|:-----:|
| Identity/role | L91-114 | L1 (WRONG) | §1 | -- | -- |
| Scope boundaries | L136-154 | L7,71-75 | §1 tbl | -- | refs |
| Core principles | L116-134 | L3-4 | -- | -- | -- |
| Intent→stage routing | L169-194 | -- | §3 | FULL | -- |
| State management | L196-222 | -- | §2 | -- | scripts |
| Delegation model | L224-266 | L40-44 | -- | refs | refs |
| Execution flow | L268-316 | -- | -- | routing | gates |
| Context engineering | L318-340 | L34-38 | §5 | -- | -- |
| Quality gates | L342-369 | -- | §4 | -- | FULL |
| Asset standards | L371-397 | -- | -- | refs | refs |
| Output contract | L411-428 | -- | -- | -- | refs |
| GX-Pack governance | L451-524 | -- | -- | -- | scripts |
| OpenCode platform | -- | L82-225 | §7+ref | refs | -- |
| Coordinator mode | -- | L40-44 | §3 | -- | -- |
| Anti-poisoning | -- | L34-38 | §5 | -- | -- |
| Tool nuances (LSP) | -- | L84-103 | -- | -- | -- |
| Cmd variable interp | -- | L148-165 | -- | -- | -- |
| Research methodology | -- | L49-61 | -- | -- | -- |

## Placement Decision (PROPOSED — requires human confirmation in next session)
<!-- SECTION: PLACEMENT_DECISION -->

### Agent Body — KEEP (permanent identity anchor, ~150-200L)
- `<role>` identity block (slimmed) — WHO you are
- `<scope>` boundaries — WHERE you operate  
- `<philosophy>` core principles (slimmed) — HOW you think
- `<startup_health>` — WHAT to do first (change to: "Load hivefiver-prime FIRST")
- Frontmatter (permissions, description) — unchanged
- `<reference_pack>` — pointers only (slimmed)

### Agent Body — MOVE OUT
- `<user_journeys>` → already fully covered in `hivefiver-mode`
- `<state_management>` → move to prime skill (session hierarchy awareness)
- `<delegation_topology>` → move to prime skill or mode refs (already in both)
- `<execution_flow>` → split: skeleton stays in body, detail in mode
- `<context_management>` → move to prime skill (context guardrails)
- `<quality_gates>` → already fully in `hivefiver-coordination`
- `<asset_standards>` → already in mode refs
- `<swarm_rules>` → already in prime or coordination
- `<output_contract>` → already in coordination refs
- `<gx_governance>` → move to prime skill reference OR own reference file

### Prompt Injection — KEEP ONLY UNIQUE content (~50L or as prime ref)
- Research/Investigation/Synthesis methodology (L49-61) — UNIQUE
- LSP tool chain isolation rules (L84-103) — UNIQUE
- Patch vs Edit distinction (L93-97) — UNIQUE
- Command variable interpolation ($ARGUMENTS, @path, !cmd) (L148-165) — UNIQUE
- Everything else: REMOVE (duplicated in body or prime)

### Prime Skill — ABSORB migrated content
- §1 role: remove (will be in body only)
- §2 session hierarchy: KEEP + absorb state_management from body
- §3 intent classification: KEEP (body drops user_journeys)
- §4 progressive disclosure: KEEP + absorb context_management from body
- §5 context guardrails: KEEP
- §6 declaration protocol: KEEP
- §7 platform awareness: KEEP
- §8 skill chaining: KEEP
- NEW: absorb GX-Pack governance from body as reference file

## Notes Footer
<!-- SECTION: NOTES_FOOTER -->
- This is a DECISION document. Execution is META02-SUB04.
- Human must confirm placement decisions before SUB04 begins.
- Key risk: agent body line 94 change ("load prime FIRST") cascades to self-delegation prompts, command enforcement blocks, and root mirror parity.
