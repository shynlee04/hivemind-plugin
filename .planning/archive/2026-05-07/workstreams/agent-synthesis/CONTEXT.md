# agent-synthesis Workstream Context

**Created:** 2026-04-29
**Status:** BOOTSTRAPPING (Phase 0 — Audit & Inventory)

## Why This Workstream Exists

The Hivemind harness needs its own agent system — not dependent on GSD agents (which are internal-only for building this project). The goal is to define 2 agent lineages (hm-* for product dev, hf-* for meta builder), 3-level depth delegation, role-specific agents with content-rich bodies superior to generic AI agent definitions.

## Current State (2026-04-29 — Updated by SE-6 Context Validation)

- **58 agents** at `.opencode/agents/` with inconsistent quality
- **Zero hm-* tagged agents** exist on disk (AS-3 not yet started)
- **33 GSD agents** are internal project build tools — NOT shipped
- AS-0: ✅ COMPLETE (full inventory audit, AGENT-INVENTORY.md, 59-agent classification matrix)
- AS-1: ✅ COMPLETE (architecture synthesis, AGENT-ARCHITECTURE-SYNTHESIS.md, body format standard)
- AS-2: ✅ COMPLETE (lineage classification schema, LINEAGE-CLASSIFICATION-SCHEMA.md)
- AS-3: IN-PROGRESS (unblocked by SE-5 completion, awaiting execution)
- AS-4 through AS-11: NOT STARTED

## Key Design Decisions (Locked)

| ID | Decision |
|----|----------|
| D-01 | GSD agents are INTERNAL ONLY — not shipped with harness |
| D-02 | Shipped agents use hm-* and hf-* prefixes (matching skill lineages) |
| D-03 | Agent hierarchy: 3-level depth (orchestrator → coordinator → specialist) |
| D-04 | Agent YAML frontmatter must be granularly configurable by end users |
| D-05 | Agent body content must match GSD quality: XML tags, execution flows, guardrails |
| D-06 | Existing hivefiver-* agents are candidates for hf-* lineage |
| D-07 | Existing core agents (coordinator, orchestrator, etc.) are candidates for hm-* lineage |

## Workstream Scope

- Design agent classification system: 2 lineages, domain-based routing
- Standardize YAML frontmatter schema (builds on schema-kernel from Phase 16.5)
- Author exemplar agent bodies with XML-tagged execution flows
- Wire agents to skills, commands, tools, and quality gates
- Migrate existing agents to new standard
- Validate through quality gate triad (lifecycle → spec → evidence)

## Dependencies

- **skill-ecosystem workstream** (SE-6 creates hf-agent-synthesizer skill; agent-synthesis consumes SE-6 output, not the reverse)
- **Phase 16.5 schema-kernel** (Zod schemas for agent frontmatter)
- **Phase 50 validate-restart** (restart validation infrastructure)

## Agent Inventory Snapshot

| Category | Count | Prefix | Shipped? |
|----------|-------|--------|----------|
| GSD specialist | 33 | `gsd-*` | No (internal only) |
| Hivefiver meta | 6 | `hivefiver-*` | Candidate for hf-* |
| Hivemind core (hf) | 1 | `hf-*` | Yes (hf-prompter) |
| Core (no prefix) | 18 | coordinator, orchestrator, etc. | Candidate for hm-* |
| **Total** | **58** | | |

## Core Agent Candidates for hm-* Lineage

`coordinator`, `orchestrator`, `conductor`, `builder`, `critic`, `researcher`, `general`, `explore` (missing from disk), `context-mapper`, `context-purifier`, `meta-synthesis-agent`, `intent-loop`, `phase-guardian`, `prompt-analyzer`, `prompt-repackager`, `prompt-skimmer`, `risk-assessor`, `spec-verifier`, `test-router`
