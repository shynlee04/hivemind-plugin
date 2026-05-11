# Phase BOOT-09: MVP Config Schema + Entry Init Verification — Specification

**Created:** 2026-05-12
**Ambiguity score:** 0.42 (gate: ≤ 0.20 — see Ambiguity Report for unresolved dimensions)
**Requirements:** 6 locked

## Goal

Verify whether the 4-field MVP config schema (`mode`, `user_expert_level`, `conversation_language`, `documents_and_artifacts_language`) produces **demonstrable, testable behavior changes** in agent runtime — not just text-injection into the system prompt — and fix identified architectural gaps in the config-to-behavior pipeline.

## Background

### Evidence from codebase investigation (hm-l2-investigator + hm-l2-auditor)

The existing config pipeline has been investigated at file:line depth by two specialist subagents. Their findings converge on a single critical architectural pattern:

**The behavioral profile system is a read-out-only architecture, not a governance enforcement architecture.**

The config pipeline works as follows:
1. `hivemind-configs.schema.ts` — Schema definition ✅ (Zod v4, validated, legacy key migration works)
2. `config/subscriber.ts` — Lazy cache ✅ (reads disk, caches per project root)
3. `behavioral-profile/resolve-behavioral-profile.ts` — Profile resolution ✅ (maps mode→profile, expertise, language)
4. `behavioral-profile/profiles.ts` — Static lookup table ✅ (3 modes → 4 profile dimensions each)
5. `hooks/guards/governance-block.ts` — System prompt injection ✅ (produces text like "You are operating in expert-advisor mode." — 8/8 tests pass)
6. **Enforcement — NO CODE WIRED** ❌

### The 4 profile dimensions that are NEVER enforced

| Dimension | Resolved? | Logged? | Enforced? | Where enforcement WAS planned |
|-----------|-----------|---------|-----------|-------------------------------|
| `guardrailLevel` | ✅ `profiles.ts:28` | ✅ `core-hooks.ts:119` | ❌ | `manager.ts:147-153` — `applyBehavioralGuardrail()` exists but comment says "intentionally NOT called from `dispatch()` yet" |
| `delegationMode` | ✅ `profiles.ts:29` | ✅ `core-hooks.ts:120` | ❌ | Zero grep matches in `src/coordination/` |
| `toolAccessPattern` | ✅ `profiles.ts:30` | ✅ `core-hooks.ts:121` | ❌ | `tool-guard-hooks.ts` reads `RuntimePolicy` not behavioral profile |
| `skillFilter` | ✅ `profiles.ts:31` | ✅ `core-hooks.ts:122` | ❌ | `category-gates.ts:76-83` — `checkSkillFilterAdvisory()` exists but "intentionally NOT called from any hook or tool yet" |

### Key architectural anomalies

1. **Config cached once at plugin init, never invalidated mid-session** (`plugin.ts:64`, `subscriber.ts:75-77`). `invalidateConfigCache()` exists but is never called.
2. **Corrupt config silently returns defaults** (`hivemind-configs.schema.ts:354-358`). No warning emitted. User changes config to invalid value → silent fallback to defaults.
3. **3 pre-built enforcement methods exist but are dead code** — `applyBehavioralGuardrail()` (tested, 3 tests pass), `checkSkillFilterAdvisory()` (tested, passes), `BehavioralOverrides` interface (defined). All marked "intentionally not wired" pending speculative WS-4 phase that never arrived.
4. **Language fields are text-only instructions** — "Use en for all conversation" appears in system prompt but no translation service, output validator, or language router exists.
5. **Tests prove text-injection, not behavior change** — All 58+ tests across governance-block and behavioral-profile suites verify the pipeline reads correctly and produces correct strings. Zero tests verify that changing config produces a different agent behavior.

### The root cause

The behavioral profile subsystem was built as a complete **read-side pipeline** (schema → config → profile → text injection) with write-side enforcement points designed but deferred to a future "WS-4" phase. That phase was never executed. The result is a system where changing `mode` from `"expert-advisor"` to `"free-style"` changes only the text the AI sees — runtime behavior (delegation, concurrency, tools, skill loading) is identical.

## Requirements

### Requirement 1: Verify config schema integrity post-arch-changes

The 4 MVP schema fields must be verifiably correct after SR restructuring and tech stack version bumps.

- **Current:** `HivemindConfigsSchema` exists and validates. `hivemind init` writes `configs.json`. But BOOT-02/05 implementations predate SR restructuring — stale path references or broken assumptions may exist.
- **Target:** Each of the 4 MVP fields is explicitly proven: schema definition → `configs.json` default → read-back by `readConfigs()` → validated without error. Any stale path in bootstrap tools is fixed.
- **Acceptance:** Running `npx hivemind init --yes --root <temp-dir>` creates `.hivemind/configs.json`. Reading it back with `readConfigs()` for all 4 fields returns the correct defaults. `hivemind doctor` reports config: PASS.

### Requirement 2: Verify config cache lifecycle

The config subscriber must correctly handle cache invalidation and mid-session config changes.

- **Current:** `getConfig()` caches at plugin init. `invalidateConfigCache()` exists but is never called. Corrupt config returns defaults silently with no warning.
- **Target:** Either (a) config is reloadable mid-session via explicit invalidation, or (b) the limitation is documented and a warning is emitted on corrupt/missing files.
- **Acceptance:** At minimum: corrupt `.hivemind/configs.json` produces a logged warning (not silent default fallback). Optionally: `invalidateConfigCache()` is called from a documented lifecycle point (e.g., `session.entry` hook).

### Requirement 3: Document the enforcement gap for 4 profile dimensions

The gap between "profile resolved" and "profile enforced" must be explicitly documented with file:line evidence.

- **Current:** `guardrailLevel`, `delegationMode`, `toolAccessPattern`, `skillFilter` are computed, logged, and injected into system prompt text, but zero enforcement gates exist. The codebase contains dead-code enforcement methods with comments pointing to nonexistent WS-4 phase.
- **Target:** A decision document exists in `.planning/decisions/` that records:
  1. Which of the 4 dimensions are intentionally "instruct the AI" (text-only)
  2. Which dimensions need programmatic enforcement and in which future phase
  3. Whether the 3 pre-built dead-code methods (`applyBehavioralGuardrail`, `checkSkillFilterAdvisory`, `BehavioralOverrides`) should be removed, kept, or wired
- **Acceptance:** Decision document reviewed and either (a) enforcement methods are wired, OR (b) methods are removed/dead-code-deleted, OR (c) document explicitly defers wiring to named phase with acceptance criteria.

### Requirement 4: Verify one config field produces observable behavior change

At least one config field must be verifiably traced from `.hivemind/configs.json` change → observable runtime difference, beyond text-injection into system prompt.

- **Current:** All 4 MVP fields produce TEXT changes in system prompt. Not a single field produces a runtime behavior difference (tested: changing `mode` from `expert-advisor` to `free-style` → delegation behavior is identical; changing `language` → agent still uses English).
- **Target:** At minimum, `mode: "free-style"` blocks delegation dispatch by checking `delegationMode` in the dispatch path. This wires the simplest enforcement point — one boolean check in `DelegationManager.dispatch()`.
- **Acceptance:** Setting `.hivemind/configs.json` `mode: "free-style"` causes `DelegationManager.dispatch()` to return before SDK delegation call. Setting `mode: "expert-advisor"` allows delegation. Proof: unit test proves dispatch path varies by mode.

### Requirement 5: Fix stale BOOT init paths (if found)

If any stale path references exist in the bootstrap toolchain, fix them.

- **Current:** `src/tools/config/bootstrap-init.ts` and `src/features/bootstrap/structure.ts` may reference paths that no longer exist post-SR restructuring. Initial scan found no major stale references but meta-builder deep paths may not exist in all setups.
- **Target:** All path references in the bootstrap toolchain verified correct for the current `src/` structure. Any broken paths fixed.
- **Acceptance:** `npx hivemind init --yes --root <temp-dir>` executes without `ENOENT` errors. `npx hivemind doctor` reports all checks pass.

### Requirement 6: Produce SPEC-quality evidence baseline

BOOT-09 generates an evidence baseline that downstream phases (CP-PTY-01, WS-4) can consume as authoritative config-plane truth.

- **Current:** Config-plane evidence is dispersed across 6 source files, 2 planning documents, and 2 test suites. No single authoritative document describes what the config pipeline actually does vs. aspires to do.
- **Target:** An `CONFIG-PLANE-TRUTH.md` (or equivalent) is committed to `.planning/phases/BOOT-09-mvp-config-schema-entry-init/` that documents:
  1. Each of the 4 MVP fields and its actual consumption (text-only vs enforcement)
  2. Each of the 4 profile dimensions and its enforcement status
  3. Cache lifecycle behavior
  4. Dead code inventory (3 methods, 1 interface)
  5. Test coverage gaps
- **Acceptance:** Document is reviewed. Phase exit gate requires this document as part of evidence package.

## Boundaries

**In scope:**
- Verification of 4 MVP schema fields: schema → configs.json → read → validate
- Config cache lifecycle audit and minimal fix (warning on corrupt config)
- Documentation of the enforcement gap for all 4 behavioral profile dimensions
- Wiring of ONE enforcement point (Recommendation: `delegationMode` check in `dispatch()` — simplest, highest signal)
- Verification of bootstrap toolchain paths
- Config-plane truth document

**Out of scope:**
- Full WS-4 enforcement wiring (all 4 dimensions + tool guards + skill filters) — that is Phase WS-4
- Building translation services for language fields — deferred to future language-enforcement phase
- Config file watcher / hot-reload — deferred to future infrastructure phase
- Session tracker integration with config changes — handled by Phase 12 team
- Adding new config fields beyond 4 MVP fields — that is CA-04 scope

## Constraints

- Must not break existing configs.json format (backward compatibility with schema v2.0.0)
- Must not change the governance-block text format — downstream tests rely on exact string matching
- Must not add new dependencies — all enforcement wiring uses existing code and types
- BOOT-09 is a verification phase with targeted fixes — no speculative architecture expansion

## Acceptance Criteria

- [ ] `npx hivemind init --yes --root <temp>` creates `.hivemind/configs.json` with valid schema reference
- [ ] All 4 MVP fields are readable and default to expected values via `readConfigs()`
- [ ] `hivemind doctor` reports config: PASS for a valid configs.json
- [ ] Corrupt `.hivemind/configs.json` produces a logged warning (not silent default fallback)
- [ ] Decision document exists recording enforcement-gap status for all 4 profile dimensions
- [ ] At least ONE mode change produces a verifiable runtime behavior difference (not just text) — recommendation: `mode: "free-style"` blocks delegation
- [ ] Bootstrap toolchain verified: `npx hivemind init` runs without ENOENT
- [ ] `CONFIG-PLANE-TRUTH.md` committed as evidence baseline
- [ ] `npm run typecheck` passes
- [ ] All existing tests still pass (no regressions)

## Ambiguity Report

| Dimension | Score | Min | Status | Notes |
|-----------|-------|-----|--------|-------|
| Goal Clarity | 0.75 | 0.75 | ✓ | Goal is clear: verify pipeline depth & wire ONE enforcement point. Requires user confirmation on which enforcement dimension. |
| Boundary Clarity | 0.65 | 0.70 | ⚠ | Is one enforcement point sufficient for phase completion? Or does user want all available enforcement wired? |
| Constraint Clarity | 0.80 | 0.65 | ✓ | Constraints are explicit: no new deps, backward compat, no speculative expansion. |
| Acceptance Criteria | 0.60 | 0.70 | ⚠ | Which enforcement dimension should be wired (guardrailLevel? delegationMode? toolAccessPattern?) requires decision. |
| **Ambiguity** | **0.42** | ≤0.20 | ⚠ | Gate not passed. Key unresolved: which enforcement point to wire and whether one is enough. |

**Status:** ✓ = met minimum, ⚠ = below minimum (planner treats as assumption)

## Interview Log

| Round | Perspective | Question summary | Decision locked |
|-------|-------------|------------------|-----------------|
| 1 | hm-l0-orchestrator initial scout | Shallow analysis — failed to detect the enforcement gap | User rejected shallow approach — delegate to specialist subagents |
| 2 | hm-l2-investigator (subagent) | Investigated config pipeline depth across 11 source files | Found: all 4 profile dimensions are text-only, 3 enforcement methods exist but are dead code |
| 3 | hm-l2-auditor (subagent) | Scored enforcement: 18/100. Verified: compute ✅ log ✅ enforce ❌ across all dimensions | Found: `manager.ts:138-141` — "intentionally NOT called from dispatch() yet" |
| 4 | Synthesis | Combined findings into this SPEC.md | Decision needed: which enforcement dimension to wire as MVP proof? Recommendation: `delegationMode` in `dispatch()` |
| — | Awaiting user | Which enforcement dimension(s) to wire? Is one enough for BOOT-09 completion? | ⬜ PENDING |

---

*Phase: BOOT-09-mvp-config-schema-entry-init*
*Spec created: 2026-05-12*
*Next step: discuss-phase BOOT-09 — implementation decisions (how to wire enforcement, fix cache, produce truth document)*
