# Phase 12: CP-ST-01 Remediation — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-12
**Phase:** 12-cp-st-01-remediation-apply-critical-security-fixes-cr-01-02
**Areas discussed:** Remediation scope & ordering, Child session hierarchy model, Tool re-architecture, Error pruning & compaction capture

---

## Remediation Scope & Ordering

| Option | Description | Selected |
|--------|-------------|----------|
| 3-wave: Writer fixes → Tool redesign → Integration + verification | Wave 1 fixes capture engine, Wave 2 redesigns tools, Wave 3 handles edge cases + regression | ✓ |
| 2-wave: Engine + tools together → hardening | Writer engine AND tool redesign in one wave, then hardening | |
| Single pass: fix everything at once | One plan covering all 20+ defects | |

**User's choice:** 3-wave with writer fixes first
**Notes:** Wave 1 unblocks the pipeline; Wave 2 depends on correct capture; Wave 3 verifies integrity of the whole. Ordered by dependency.

### Task Granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Dependency-ordered micro-tasks | 1-2 files per task, individually testable, prevents regression cascade | ✓ |
| Domain-grouped medium tasks | Group by domain (~3 tasks), crosses dependency boundaries | |
| Monolithic writer rewrite | Rewrite entire SessionTracker in one task | |

**User's choice:** Dependency-ordered micro-tasks
**Notes:** Each task independently verifiable. Unblock the pipeline first (serial queue), then fix what flows through it.

---

## Child Session Hierarchy Model

| Option | Description | Selected |
|--------|-------------|----------|
| Turn-level stems + final assistant output as summary report | Per-turn: actor, timestamp, tools as paths, errors as type+path. Final: assistant response as summary. | ✓ |
| Full turn capture like main session | Child .json mirrors main .md capture rules — full tool metadata, full messages | |
| Summary-only | Compressed summary of delegation results only | |

**User's choice:** Turn-level stems with final assistant output as summary report
**Notes:** Stems compress context to actors, timestamps, tool I/O paths, errors as type+path. Final assistant response captured as summary/report after all turns complete. No .md files for child sessions — JSON only under parent.

---

## Tool Re-architecture

| Option | Description | Selected |
|--------|-------------|----------|
| One tool, many actions | Keep session-tracker as single discovery point, expand actions | |
| Toolset: multiple tools by domain | session-tracker, session-hierarchy, session-context — focused tools per CUSTOM-TOOLS-CRITERIA | ✓ |
| Minimal expansion | Add only get-children and get-status | |

**User's choice:** Toolset by domain, validated against CUSTOM-TOOLS-CRITERIA-2026-05-05.md
**Notes:** Criterion 4 (Granularity) says split tools over 200 LOC. Criterion 7 (Ergonomics) says minimal required fields. OpenCode has no nested sub-tool concept — flat tool registration. Three focused tools under `src/tools/hivemind/`: `session-tracker` (C2), `session-hierarchy` (C2), `session-context` (C3). Each ≤200 LOC.

---

## Error Pruning & Compaction Capture

| Option | Description | Selected |
|--------|-------------|----------|
| Summary breaker block | Pre-compaction context summary, key decisions, active TODOs, compact boundary marker | ✓ |
| Metadata-only timestamp | Record compaction timestamp only | |
| Full snapshot | Write entire pre-compaction conversation summary | |

**User's choice:** Summary breaker blocks
**Notes:** Semantic checkpoint for agents resuming long-haul sessions. Includes context summary, decisions made, pending delegations. Marker: `## COMPACTED`.

---

## the agent's Discretion

- Internal module structure for new handlers within `src/features/session-tracker/`
- Field naming for child session turn stems (following camelCase per REQ-ST-12)
- Tool response envelope format (follows existing `src/shared/tool-response.ts` patterns)
- How to wire compaction detection into the hook pipeline
- Fork detection implementation details

## Deferred Ideas

- Sidecar dashboard integration — Q2, separate project
- Real-time SSE streaming — out of scope
- Graph-based delegation visualization — future phase
- Auto-pruning of old session data — future phase
- Removal of legacy event-tracker source code — future phase (safety net per REQ-ST-13)
