# Requirement Traceability: Session Journal Refactor

**Date:** 2026-03-29
**Status:** proposed

---

## Prior Spec (R1-R9) → New Requirements Mapping

### R1: Consolidated Single-File Session Format

**Prior spec**: Each session produces ONE `{semantic-name}.json` file.

**New spec adds**: Each session produces TWO files — `.md` (journey-events) + `.json` (companion).

**Conflict**: Prior says "ONE file". New spec says markdown + JSON.

**Resolution**: JSON is the canonical source of truth (satisfies R1's intent). Markdown is a derived presentation artifact. The "one file" spirit is preserved: one JSON file replaces the old 3-file triplet (`events.md` + `session.json` + `diagnostics.log`). The new markdown is additive, not a replacement.

**Status**: RESOLVED — dual-output architecture accepted in ADR-018 D1.

---

### R2: Semantic Session Naming

**Prior spec**: `ses_<ISO-date>_<purpose>_<agent>.json`

**New spec adds**: `ses_xxxx-DATE-CREATED-ISO.md` (4-5 digit prefix).

**Conflict**: Different naming conventions.

**Resolution**: Merge as `ses_{4-5 digit counter}_{ISO-date}_{purpose}_{agent}`. The counter provides ordering; the date provides human scanning; purpose+agent provide semantics.

**Status**: RESOLVED — merged naming convention accepted in ADR-018 D2.

---

### R3: User Message Capture

**Prior spec**: `chat.message` hook captures user messages.

**New spec**: "Record the user's new prompt" in journey-events markdown.

**Conflict**: None — complementary requirements.

**Resolution**: Wire `chat-message-handler.ts` (already exists). The handler writes to JSON; the journey-events writer mirrors to markdown.

**Status**: UNBLOCKED — handler exists, wiring is the gap.

---

### R4: Turn-Based Structure

**Prior spec**: Sessions organized by turns with `userMessage`, `assistantContent`, `toolCalls`, `delegations`.

**New spec**: "For each agentic flow, record a batch of tools used and CRUD operations on files."

**Conflict**: None — new spec's "tool batch" concept extends the turn structure.

**Resolution**: Turns remain the primary structure. Tool batches are rendered as sub-sections within turns in the markdown. JSON stores tool invocations in `turns[].toolInvocations`.

**Status**: COMPATIBLE — no changes to existing turn structure needed.

---

### R5: Sub-Session Linking

**Prior spec**: `parentSessionId` + `childSessionIds` for delegation tracking.

**New spec**: "For sub-agents, export only the assistant's summary... appended inline with actor, workflow, planning alignment, and the session id."

**Conflict**: None — new spec adds richer sub-agent export format.

**Resolution**: Keep `parentSessionId`/`childSessionIds` in JSON. Enhance markdown delegation section to include actor, workflow, and planning alignment per new spec.

**Status**: ENHANCED — existing linking + new export format.

---

### R6: Tool Invocation Tracking

**Prior spec**: `tool.execute.after` hook captures tool calls.

**New spec**: "tool.execute.before — trigger skills before execution; extract readable insights after execution."

**Conflict**: None — new spec adds `tool.execute.before` in addition to `after`.

**Resolution**: Wire both hooks. `before` logs intent; `after` logs result. Both go to consolidated session.

**Status**: ENHANCED — wire both before/after hooks.

---

### R7: Counter Accuracy

**Prior spec**: All counters computed from actual data, not hardcoded 0.

**New spec**: No direct counter requirement, but "every update is appended with a timestamp" implies accurate tracking.

**Conflict**: None.

**Resolution**: Wire handlers → counters increment naturally. This was always the plan; the gap was handler wiring.

**Status**: UNBLOCKED — same as R3/R6.

---

### R8: Clean Legacy Directories

**Prior spec**: `.hivemind/session-inspection/` and `.hivemind/error-log/` cleared or migrated.

**New spec**: "Create a parallel sub-folder `error-logs` containing a `.log` file for any error events."

**Conflict**: Prior says "clear error-log". New spec says "create error-logs" (different directory name).

**Resolution**: Old `error-log/` is removed. New `error-logs/` (under `sessions/`) replaces it. The name change avoids confusion with the legacy directory.

**Status**: RESOLVED — phased removal in ADR-018 D6.

---

### R9 (Prior Spec): Clean Code / CQRS Compliance

**Prior spec**: Hooks are read-only, writers called through facade.

**New spec**: "Organize the codebase into logical SDK modules: `features`, `tools`, `hooks`, `runtime-entry`, `runtime-observability`, `session-entry`, `trajectory`, and `workflow`."

**Conflict**: New spec proposes a broader module reorganization than prior spec's CQRS focus.

**Resolution**: CQRS compliance is preserved (hooks call writers through facade). The module reorganization is a superset — it includes the CQRS boundary but also adds `runtime-entry`, `runtime-observability`, `session-entry` modules. These are cosmetic/organizational additions that don't change the CQRS contract.

**Status**: COMPATIBLE — CQRS preserved, module naming enhanced.

---

## New Requirements Not Covered by Prior Spec

| New Requirement | Prior Spec Coverage | Action Needed |
|----------------|-------------------|---------------|
| Journey-events markdown format with TOC | Not covered (prior spec was JSON-only) | ADD: New output format |
| Actors extraction in metadata | Not covered | ADD: Extract from session metadata |
| Tool batch rendering | Partially covered (tool invocations tracked) | ADD: Batch grouping in markdown |
| Artifact/evidence link rendering | Not covered | ADD: Link generation |
| Error-logs subfolder | Prior spec says "clear error-log" | ADD: New directory structure |
| Event subscription schema (12+ types) | Prior spec covers 10 EventType literals | PARTIAL: Wire available SDK hooks, document gaps |
| Module reorganization | Prior spec doesn't address module structure | ADD: Refactor plan |
| Sub-agent summary export format | Prior spec has delegation tracking | ENHANCE: Richer export format |
| JSON companion alongside markdown | Prior spec has JSON only | ADD: Dual output |

---

## Prior Spec Gaps Not Covered by Either Spec

| Gap | Description | Impact |
|-----|-------------|--------|
| Migration of existing 76+ session directories | Neither spec addresses how to handle existing `.hivemind/sessions/ses_*/` directories | High — existing data must be migrated or archived |
| Concurrent write safety | Prior spec mentions "concurrent access handled" but no implementation detail | Medium — multiple hooks can fire simultaneously |
| Session file size limits | No mention of when to rotate or archive large session files | Low — sessions are typically small |
| Cross-session search/query | No API for searching across sessions | Low — can be added later |
| Retention policy | No mention of how long session data is kept | Low — can be added later |

---

## Conflict Summary

| # | Conflict | Prior Spec | New Spec | Resolution |
|---|----------|-----------|----------|------------|
| 1 | Output format | ONE JSON file | MD + JSON | JSON canonical, MD derived |
| 2 | Naming convention | `ses_<ISO>_<purpose>_<agent>` | `ses_xxxx-DATE` | Merged: `ses_{counter}_{ISO}_{purpose}_{agent}` |
| 3 | Legacy error-log | Clear it | Create error-logs (new name) | Remove old, create new |
| 4 | Module structure | Not specified | Detailed module tree | Adopt new spec's module tree |

---

## Traceability Matrix: Requirement → Handler → Output

| Req | Source | Handler | Hook | Output |
|-----|--------|---------|------|--------|
| R1 | Prior | consolidated-writer.ts | All | `.json` per session |
| R2 | Prior | consolidated-writer.ts (`generateSessionId`) | — | Semantic filename |
| R3 | Prior + New | chat-message-handler.ts | `chat.message` | `userMessage` in turn |
| R4 | Prior | consolidated-writer.ts (`addTurn`) | — | `turns[]` array |
| R5 | Prior | consolidated-writer.ts (`linkSubSession`) | — | `parentSessionId` |
| R6 | Prior + New | tool-execution-handler.ts | `tool.execute.after` | `tool_invocation` event |
| R7 | Prior | All handlers | All | Counter increments |
| R8 | Prior | Plugin (remove legacy calls) | — | Legacy dirs empty |
| R9 | Prior + New | Module restructure | — | Clean module tree |
| NEW | New | journey-events-writer.ts | All | `.md` journey file |
| NEW | New | error-log-writer.ts | `event` (error) | `.log` error file |
