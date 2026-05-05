# CONTEXT: Hivemind State Architecture

**Workstream:** hivemind-state-architecture (WS-1)
**Status:** COMPLETE ✅
**Parent Doc:** → `.planning/ROADMAP.md`
**Completed:** 2026-05-06

## Purpose

Design the canonical `.hivemind/` directory structure, `configs.json` schema (5-field minimal), bootstrap tree layout, and frontmatter/file-format conventions. Foundation for ALL state-writing features.

## Scope

- `.hivemind/` canonical directory architecture (per Q6 decision — state root separation)
- `configs.json` minimal 5-field schema:
  - `conversationLanguage` — primary language for agent conversations
  - `documentsLanguage` — primary language for generated artifacts
  - `mode` — project mode (expert-advisor, hivemind-powered, free-style)
  - `userExpertLevel` — user proficiency level
  - `delegationSystems` — enabled delegation modes
- File format conventions for all `.hivemind/` artifacts (JSON, MD with YAML frontmatter, `.gitkeep`)
- Frontmatter schema requirements for all `.hivemind/*.md` files
- Target bootstrap tree layout from master skeleton (§8.2)
- State root hardening: compatibility bridge verification from legacy `.opencode/state/opencode-harness/`
- One-way migration path: `.opencode/state/` → `.hivemind/`, no dual-write

## Feature Refs

- f-05.i — configs.json interactive configuration
- f-05 — CLI installation/bootstrap
- f-03x — Registry groundwork (directory structure dependency)
- Q6 — HIVEMIND-ROOT-01 through HIVEMIND-ROOT-03

## Key Design Decisions

| ID | Decision | Status |
|----|----------|--------|
| D-3 | configs.json schema: minimal 5-field | ✅ RESOLVED (2026-05-06) |
| HIVEMIND-STATE-01 | `.hivemind/` canonical directory structure designed and locked | ✅ COMPLETE |
| HIVEMIND-STATE-02 | `configs.json` 5-field schema defined and validated (28 tests) | ✅ COMPLETE |
| HIVEMIND-STATE-03 | File format and frontmatter conventions for all `.hivemind/` artifacts | ✅ COMPLETE |

## Deliverables

| Artifact | Path |
|----------|------|
| State Architecture Spec | `.planning/workstreams/hivemind-state-architecture/phases/WS1-01-state-architecture-spec/WS1-01-SPEC.md` |
| Zod Schema Module | `src/schema-kernel/hivemind-configs.schema.ts` |
| Schema Tests | `tests/schema-kernel/hivemind-configs.schema.test.ts` (28 tests) |
| Default Config | `.hivemind/configs.json` |
| 11 New Directories | `.hivemind/{manifests,hm-brain,hf-brain,delegation-managements,task-managements,registries,runtime,artifacts,sidecar,onboarding,logs}/` |

## Dependencies

- **HER-0 (COMPLETE ✅)**: Ecosystem map provides runtime module inventory for directory design
- **Blocks (now unblocked):** primitive-registry (WS-3), bootstrap-cli-onboarding (WS-2), context-compaction-engine (WS-7), trajectory-task-plus (WS-6)

## Priority: CRITICAL → COMPLETE ✅
