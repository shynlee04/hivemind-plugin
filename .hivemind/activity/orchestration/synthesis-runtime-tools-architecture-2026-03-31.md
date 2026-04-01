---
title: "Orchestrator Synthesis — Runtime + Tools + Architecture Verification"
date: 2026-03-31
agent: hiveminder
type: synthesis-report
scope: runtime-concepts, managing-layer-tools, plugin-tool-architecture
git_commit: 85f8cbe7
---

# Orchestrator Synthesis — 2026-03-31

**Purpose:** Consolidated findings from 3 parallel investigations. This is the single source of truth for what exists, what's broken, and what needs to be built.

**Source Reports:**
- `.hivemind/activity/agents/hivexplorer/runtime-concepts-verification-2026-03-31.md`
- `.hivemind/activity/agents/hivexplorer/managing-layer-tools-audit-2026-03-31.md`
- `.hivemind/activity/agents/hivexplorer/plugin-tool-architecture-verification-2026-03-31.md`

---

## Executive Summary

| Area | Health | Critical Issues |
|------|--------|----------------|
| **Runtime Concepts** | ⚠️ Partial | 4 of 14 user assumptions are FALSE |
| **Managing Layer Tools** | ⚠️ Partial | Journal BROKEN, 1 tool orphaned, 5 upward import violations |
| **Plugin/Tool Architecture** | ✅ Mostly Sound | CQRS VIOLATED by hooks, SDK usage minimal (25%) |

---

## 1. Runtime Reality — What Actually Exists

### Confirmed Working
| Concept | Evidence |
|---------|----------|
| Session create/delete tracking | `event-handler.ts` handles `session.created`, `session.deleted` |
| Session hierarchy (parent→child) | `hierarchy-writer.ts` maintains bidirectional links |
| Two session types (main vs sub-session) | `SessionScope = 'main' \| 'sub-session'`, different prompt rendering |
| Skill injection per session scope | `tiered-injection.ts` — 6-tier resolution |
| Command context injection | `command.execute.before` hook injects `<hivemind-command-context>` |
| Trajectory checkpoints | `trajectory-types.ts` supports `resume-closed` with `resumeTarget` |
| 10 slash command bundles | `command-bundles.ts`: hm-init, hm-doctor, hm-harness, hm-settings, hm-research, hm-plan, hm-implement, hm-verify, hm-tdd, hm-course-correct |

### FALSE Assumptions (Must Correct Mental Model)
| Assumption | Reality | Impact |
|------------|---------|--------|
| "Turn-level undo/redo exists" | **NO.** Zero code for fork/redo/undo in `src/`. SDK has message-level `revert`/`unrevert` only. | HIGH — cannot build time-machine features on this |
| "HiveMind controls context pruning" | **NO.** OpenCode SDK handles compaction internally. HiveMind only *records* events. | HIGH — overestimates control |
| "Dynamic context pruning is integrated" | **NO.** `.sdk-lib/dynamic-context-prunning/` is external reference material, zero imports. | HIGH — assumed capability doesn't exist |
| "Subagent sessions independently tracked" | **NO.** Subagents skip file creation (`event-handler.ts:198 return`). Only linked in parent's `subsessionIds`. | HIGH — cannot independently resume/audit subagent work |

### Partially True
| Assumption | Reality |
|------------|---------|
| "Session resume exists" | Trajectory has `resume-closed` action, but no explicit session-level resume API |
| "Commands refresh agent behavior" | Per-execution context injection, not persistent refresh |
| "Permissions refresh agent behavior" | Auto-allows HiveMind tools but doesn't dynamically change mid-session |

---

## 2. Managing Layer Tools — Your Orchestrator Utilities

### Tool Health Dashboard

| Tool | Status | Tests | Registered | Priority Fix |
|------|--------|-------|------------|-------------|
| **hivemind_trajectory** | ✅ Working | ❌ 0 tests | ✅ Yes | Add tests, fix upward import |
| **hivemind_task** | ✅ Working | ⚠️ Core only | ✅ Yes | Remove unnecessary `async`, fix upward import |
| **hivemind_handoff** | ✅ Working | ❌ 0 tests | ✅ Yes | Add tests, fix upward import, decouple cross-feature deps |
| **hivemind_journal** | ❌ BROKEN | ❌ 6/11 fail | ⚠️ Catalog only | **Fix path mismatch, export from barrel** |
| **hivemind_agent_work_create_contract** | ✅ Working | ✅ 8 test files | ✅ Yes | None |
| **hivemind_agent_work_export_contract** | ✅ Working | ✅ 8 test files | ✅ Yes | None |
| **hivemind_agent_work_classify_intent** | ❌ ORPHANED | ✅ Tests exist | ❌ Not wired | **Wire into plugin** |

### Systemic Violations
| # | Violation | Files Affected | Severity |
|---|-----------|---------------|----------|
| 1 | **Upward imports** — features importing from tools layer | 5 files (trajectory, task, handoff, doc, runtime-observability) | HIGH |
| 2 | **Cross-feature coupling** — handoff depends on agent-work-contract + runtime-entry | `handoff.ts:13-14` | MEDIUM |
| 3 | **Journal flat file** — not in directory structure like other tools | `hivemind-journal.ts` | LOW |
| 4 | **No intelligence layer** for trajectory/task/handoff | `src/intelligence/` is doc-only | LOW |

---

## 3. Plugin/Tool Architecture — Structural Assessment

### What's Sound
| Aspect | Status | Evidence |
|--------|--------|----------|
| Plugin assembly pattern | ✅ Correct | `opencode-plugin.ts` — assembly only, no business logic |
| Tool schema compliance | ✅ 100% | All tools use `tool.schema` (Zod) |
| Context reception | ✅ All tools | All receive `context` with sessionID, agent, directory |
| Tier 3 isolation | ✅ Respected | HiveMind writes to `.hivemind/`, not `.opencode/` |
| Feature classification (4 groups) | ✅ Validated | Group A: 6, Group B: 10, Group C: 5, Group D: 7 |

### What's Broken
| Aspect | Status | Evidence |
|--------|--------|----------|
| **CQRS boundary** | ❌ VIOLATED | All 5 major hooks write to `.hivemind/sessions/` |
| SDK surface usage | ⚠️ Minimal | 4 of 16 client surfaces used (25%) |
| Hook wiring rate | ⚠️ 71% | 12 of 17 hooks wired, 5 unused |

### CQRS Violation Detail
The stated principle "Tools write. Hooks read." is **not followed**. All hooks write:

| Hook | Write Operation | File |
|------|----------------|------|
| `chat.message` | `addTurn()`, `appendTurnToMarkdown()` | `chat-message-handler.ts:64-88` |
| `tool.execute.after` | `addEvent()`, `incrementCounter()` | `tool-execution-handler.ts:46-84` |
| `text.complete` | `addTurn()`, `addEvent()`, `addDiagnostic()` | `text-complete-handler.ts:97-156` |
| `session.compacting` | `addEvent()`, `incrementCounter()` | `compaction-handler.ts:65-93` |
| `event` | `initSession()`, `addEvent()`, `addDiagnostic()` | `event-handler.ts:208-425` |

**Note:** This may be intentional — session journal writes are event-driven append operations, not business logic mutations. The CQRS principle may need refinement: "Tools write state. Hooks append events."

---

## 4. User's Architectural Assumptions — Verified

| # | Assumption | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | Plugins subscribe to events, add functions via hooks | ✅ VERIFIED | 12 hooks wired in `opencode-plugin.ts` |
| 2 | Custom tools are LLM-facing, receive context, use Zod | ✅ VERIFIED | 100% compliance across all 12 tools |
| 3 | Tier 3 concepts (commands, skills, agents) are user-configurable | ✅ VERIFIED | Bundled in npm, projected to `.opencode/` non-destructively |
| 4 | Tier 3 shouldn't be mixed into harness governance | ✅ VERIFIED | HiveMind writes to `.hivemind/` only |
| 5 | Feature classification into 4 groups | ✅ VERIFIED | All groups have concrete examples |
| 6 | Not many features require SDK yet | ✅ VERIFIED | 25% client surface usage |
| 7 | Turn-level undo/redo exists | ❌ FALSE | Zero code references |
| 8 | HiveMind controls context pruning | ❌ FALSE | SDK handles compaction |
| 9 | Dynamic context pruning is integrated | ❌ FALSE | External reference only |
| 10 | Subagent sessions independently tracked | ❌ FALSE | No independent files |
| 11 | CQRS is followed everywhere | ❌ FALSE | Hooks systematically write |

---

## 5. Recommended Action Plan

### Phase 0: Fix Broken Things (CRITICAL)
1. **Fix journal tool** — path mismatch between `truncateSessionId()` and test assertions
2. **Wire classify-intent tool** — add to plugin registration
3. **Fix upward imports** — move types from `tools/*/types.ts` to `shared/` or feature layer

### Phase 1: Add Safety Nets (HIGH)
4. **Write trajectory tests** — 0 tests for the canonical pattern tool
5. **Write handoff tests** — 0 tests for the most complex tool (445 LOC)
6. **Write task tool/feature tests** — only core layer tested

### Phase 2: Structural Cleanup (MEDIUM)
7. **Move journal to directory** — `src/tools/journal/{index,tools,types}.ts`
8. **Decouple handoff cross-feature deps** — extract chain-executor and workflow-continuity as shared
9. **Remove unnecessary async** on task execute

### Phase 3: Architecture Decisions (STRATEGIC)
10. **Refine CQRS definition** — "Tools write state. Hooks append events." is more accurate
11. **Decide on subagent session tracking** — should subagents get independent files?
12. **Decide on context pruning strategy** — integrate external project or accept SDK-only?

### Phase 4: SDK Expansion (FUTURE)
13. **Wire unused hooks** — `chat.params`, `chat.headers`, `tool.definition`, `config`, `auth`
14. **Use more client surfaces** — 12 of 16 unused (`client.command`, `client.vcs`, `client.mcp`, etc.)

---

## 6. Key Questions for User

1. **Subagent session tracking:** Should subagent sessions get their own consolidated files for independent resume/audit? This would require changes to `event-handler.ts`.

2. **Context pruning:** Do you want to integrate the external dynamic-context-pruning project, or accept that OpenCode SDK handles compaction and HiveMind only records events?

3. **CQRS refinement:** Is "Tools write state. Hooks append events." an acceptable refinement of the CQRS principle? The hooks write session journals (append-only event logs), not business state.

4. **Turn-level undo/redo:** Was this a desired feature or an assumed existing feature? If desired, it would need to wrap the SDK's `revert`/`unrevert` APIs.

5. **Tool refactoring scope:** The previous session planned a 12→11 tool consolidation. Given these findings, should we proceed with that plan, or adjust priorities based on the broken things identified here?

---

## Investigation Metadata

- **Orchestrator:** hiveminder
- **Investigators:** hivexplorer (3 parallel agents)
- **Date:** 2026-03-31
- **Git commit:** 85f8cbe7
- **Branch:** v2.9.5-detox-dev
- **Type check:** 0 errors
- **Confidence:** HIGH — all claims backed by file:line references from 3 independent investigations
