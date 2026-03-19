---
phase: 11-runtime-context-detox-and-plugin-flattening
verified: 2026-03-19T16:08:26Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Live OpenCode plugin injection uses one authoritative packet"
    expected: "A real OpenCode-loaded HiveMind plugin injects exactly one `<hivemind context_version=\"v1\">` packet per user turn, optional route hint only, and no legacy packet families."
    why_human: "Local tests prove the assembly and helper contracts, but they do not fully substitute for a live OpenCode host/plugin boundary."
  - test: "Live compaction and attached-runtime continuation preserve the flattened context path"
    expected: "After attach/reuse and compaction, the session continues with the same authoritative packet fields and no duplicate runtime emitters."
    why_human: "This depends on the official server/client/plugin lifecycle and compaction behavior, which is only partially covered by local automated tests."
---

# Phase 11: Runtime Context Detox and Plugin Flattening Verification Report

**Phase Goal:** Remove poisoned multi-injection runtime context, eliminate dead per-turn orchestration, and flatten plugin ownership around the authoritative seams that are actually consumed at runtime.
**Verified:** 2026-03-19T16:08:26Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Runtime context reaches the model through one authoritative packet instead of overlapping emitters. | ✓ VERIFIED | `src/plugin/opencode-plugin.ts:147` injects through `experimental.chat.messages.transform`, `src/plugin/opencode-plugin.ts:187` preserves compaction, and `tests/plugin-assembly-smoke.test.ts:42` plus `tests/plugin-assembly-smoke.test.ts:72` assert no `experimental.chat.system.transform`, no legacy packet families, and one `context_version="v1"` packet. |
| 2 | The plugin reuses one runtime snapshot across a turn and resets it explicitly. | ✓ VERIFIED | `src/plugin/runtime-snapshot.ts:20` caches one `loadRuntimeBindingsSnapshot(...)` result until reset, `src/plugin/opencode-plugin.ts:78` resets in `chat.message`, and `tests/plugin-runtime.test.ts:94` proves one-read-per-turn behavior. |
| 3 | Compaction still preserves the same authoritative runtime context after flattening. | ✓ VERIFIED | `src/plugin/opencode-plugin.ts:187` pushes the same rendered packet during compaction, `src/plugin/context-renderer.ts:62` defines the canonical renderer, and `tests/plugin-assembly-smoke.test.ts:95` verifies a single `context_version="v1"` packet in compaction output. |
| 4 | Surviving runtime-entry, control-plane, and slash-command boundaries use the feature-owned instruction loader instead of the deleted bridge path. | ✓ VERIFIED | `src/features/runtime-entry/command.ts:13`, `src/control-plane/control-plane-handler.ts:6`, `src/commands/slash-command/command-runner.ts:6`, and `src/commands/slash-command/command-types.ts:9` all import `features/runtime-entry/instruction-loader`; `tests/runtime-entry-contract.test.ts:16` verifies the relocated loader path; `src/hooks/runtime-bridge/**` is absent from the worktree. |
| 5 | The flattened plugin still exposes the preserved runtime/tool boundary after cleanup. | ✓ VERIFIED | `src/plugin/opencode-plugin.ts:70` registers the six preserved SDK tools, `tests/runtime-tools.test.ts:25` verifies those tool ids and rejects deleted wrapper dependencies, `tests/runtime-authority-live-sanity.test.ts:15` proves managed-versus-attached authority behavior still works, and `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md:24` records deleted versus preserved survivors. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/plugin/runtime-snapshot.ts` | Lazy per-turn snapshot loader with explicit reset behavior | ✓ VERIFIED | Exists, substantive, and wired from `src/plugin/opencode-plugin.ts:23` and `src/plugin/opencode-plugin.ts:64`. |
| `src/plugin/context-renderer.ts` | Canonical `hivemind context_version="v1"` packet renderer | ✓ VERIFIED | Exists, substantive, and wired from `src/plugin/opencode-plugin.ts:18` and `src/plugin/opencode-plugin.ts:168`. |
| `src/plugin/opencode-plugin.ts` | Flattened authoritative hook registration on surviving runtime seams | ✓ VERIFIED | Exists, substantive, and directly owns the surviving hook/tool assembly. |
| `src/features/runtime-entry/instruction-loader.ts` | Feature-owned command asset loader for preserved runtime entry flows | ✓ VERIFIED | Exists, substantive, and consumed by runtime-entry, control-plane, and slash-command files. |
| `tests/plugin-assembly-smoke.test.ts` | Reduced-scope proof for authoritative plugin hook assembly | ✓ VERIFIED | Passed in reduced-scope suite on 2026-03-19. |
| `tests/runtime-tools.test.ts` | Six-tool verification against the flattened plugin path | ✓ VERIFIED | Passed in reduced-scope suite on 2026-03-19. |
| `tests/runtime-entry-contract.test.ts` | Verification that preserved command flows use the relocated loader | ✓ VERIFIED | Passed in reduced-scope suite on 2026-03-19. |
| `tests/runtime-authority-live-sanity.test.ts` | Post-cleanup authority and continuation sanity proof | ✓ VERIFIED | Passed in reduced-scope suite on 2026-03-19. |
| `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md` | Final deleted-versus-preserved record for runtime/plugin survivors | ✓ VERIFIED | Documents deleted families, one preserved shared survivor, and reduced-scope skip notes. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `src/plugin/opencode-plugin.ts` | `src/plugin/runtime-snapshot.ts` | `createTurnSnapshotLoader(...)` | ✓ WIRED | Import at `src/plugin/opencode-plugin.ts:23`, instantiation at `src/plugin/opencode-plugin.ts:64`, and active use in `chat.message`, `shell.env`, message transform, and compaction. |
| `src/plugin/opencode-plugin.ts` | `src/plugin/context-renderer.ts` | `renderHivemindContext(...)` | ✓ WIRED | Imported at `src/plugin/opencode-plugin.ts:18` and used for both message injection and compaction at `src/plugin/opencode-plugin.ts:168` and `src/plugin/opencode-plugin.ts:189`. |
| `src/plugin/opencode-plugin.ts` | `src/plugin/route-hint.ts` | Optional route reminder injection | ✓ WIRED | Imported at `src/plugin/opencode-plugin.ts:22` and appended only when route guidance exists at `src/plugin/opencode-plugin.ts:176`. |
| `src/features/runtime-entry/command.ts` | `src/features/runtime-entry/instruction-loader.ts` | Direct feature-owned loader import | ✓ WIRED | `loadCommandAsset` and `LoadedCommandAsset` imported at `src/features/runtime-entry/command.ts:13`. |
| `src/control-plane/control-plane-handler.ts` | `src/features/runtime-entry/instruction-loader.ts` | Direct feature-owned loader contract | ✓ WIRED | `LoadedCommandAsset` imported at `src/control-plane/control-plane-handler.ts:6`. |
| `src/commands/slash-command/command-runner.ts` | `src/features/runtime-entry/instruction-loader.ts` | Direct feature-owned loader contract | ✓ WIRED | `LoadedCommandAsset` imported at `src/commands/slash-command/command-runner.ts:6`. |
| `tests/runtime-tools.test.ts` | `src/plugin/opencode-plugin.ts` | Six-tool assertions on surviving plugin assembly | ✓ WIRED | The test instantiates `HiveMindPlugin` and asserts the exact preserved tool set at `tests/runtime-tools.test.ts:25`. |
| `tests/runtime-entry-contract.test.ts` | `src/features/runtime-entry/instruction-loader.ts` | Preserved runtime-entry contract verification | ✓ WIRED | The test imports `loadCommandAsset` directly and checks runtime-entry consumers at `tests/runtime-entry-contract.test.ts:5` and `tests/runtime-entry-contract.test.ts:16`. |
| `tests/runtime-authority-live-sanity.test.ts` | `src/commands/slash-command/index.ts` | Post-cleanup authority and continuation proof | ✓ WIRED | The test exercises attach/reuse plus slash-command execution at `tests/runtime-authority-live-sanity.test.ts:15`. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `P11-01` | `11-02-PLAN.md` | `chat.message` no longer emits runtime context | ✓ SATISFIED | `src/plugin/opencode-plugin.ts:78` only resets the turn snapshot and shows degraded toast; `tests/plugin-assembly-smoke.test.ts:57` verifies no context parts are injected. |
| `P11-02` | `11-02-PLAN.md` | `experimental.chat.system.transform` removed as context emitter | ✓ SATISFIED | `src/plugin/opencode-plugin.ts` contains no system transform registration; `tests/plugin-assembly-smoke.test.ts:42` asserts it is undefined. |
| `P11-03` | `11-02-PLAN.md` | One cached snapshot is reused across hook work in a turn | ✓ SATISFIED | `src/plugin/runtime-snapshot.ts:20` and `tests/plugin-runtime.test.ts:94`. |
| `P11-04` | `11-02-PLAN.md` | One unified `<hivemind context_version="v1">` packet is emitted | ✓ SATISFIED | `src/plugin/context-renderer.ts:62`, `tests/plugin-runtime.test.ts:116`, and `tests/plugin-assembly-smoke.test.ts:72`. |
| `P11-05` | `11-02-PLAN.md` | Compaction still receives authoritative context | ✓ SATISFIED | `src/plugin/opencode-plugin.ts:187` and `tests/plugin-assembly-smoke.test.ts:95`. |
| `P11-06` | `11-04-PLAN.md`, `11-05-PLAN.md`, cleanup plans | Dead orchestration files are removed only after consumer proof | ✓ SATISFIED (reduced scope) | `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-CONSUMER-PROOF.md:24` records deleted families and preserved survivors; `src/hooks/runtime-bridge/**` is absent; `tests/runtime-tools.test.ts:52` rejects deleted plugin wrapper dependencies. |
| `P11-07` | `11-11-PLAN.md` | Preserved tools/runtime entry paths still work after flattening | ✓ SATISFIED | Reduced-scope suite passed for `tests/runtime-tools.test.ts`, `tests/runtime-entry-contract.test.ts`, and `tests/runtime-authority-live-sanity.test.ts` on 2026-03-19. |

`P11-01` through `P11-07` are declared in phase plans and roadmap artifacts, but they are not present in `.planning/REQUIREMENTS.md`. Cross-reference against that file was therefore not possible; verification used plan frontmatter plus `.planning/phases/11-runtime-context-detox-and-plugin-flattening/11-RESEARCH.md` requirement text instead.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `src/control-plane/control-plane-handler.ts` | 28 | `return null` guard clause | ℹ️ Info | Normal no-handler fallback, not a stub. |
| `src/features/runtime-entry/command.ts` | 115 | `return null` guard clause | ℹ️ Info | Early-exit control flow in auto-recovery logic, not placeholder behavior. |

No blocker reduced-scope anti-patterns were found in the surviving runtime/plugin files or tests scanned for TODOs, placeholder text, empty implementations, or console-log-only behavior.

### Reduced-Scope Skips

- `tests/control-plane-runtime-tools.test.ts` is not present in the current worktree and was treated as removed-surface noise per the reduced-scope rule.
- `tests/schema-kernel-contracts.test.ts` is not present in the current worktree and was treated as out of scope for surviving runtime/plugin verification.
- `npm test` failed in `scripts/check-agent-registry-parity.sh` because `.opencode/agents/*.md` runtime mirrors are missing; this is removable agent-surface noise, not a surviving runtime/plugin boundary failure for Phase 11.

### Human Verification Required

### 1. Live plugin injection path

**Test:** Load the package as an actual OpenCode plugin, send a normal user message, and inspect the resulting message history/prompt injection.
**Expected:** Exactly one `hivemind context_version="v1"` packet appears, optional route hint only, and no legacy packet families or duplicate emitters appear.
**Why human:** The automated evidence uses local plugin instantiation rather than a live OpenCode-loaded plugin boundary.

### 2. Live attach-plus-compaction continuation

**Test:** Attach to a live runtime, trigger the preserved command path, compact the session, and continue work.
**Expected:** Authority remains singular, continuation still sees the same canonical packet fields, and no extra runtime context emitter reappears after compaction.
**Why human:** This depends on live server/client/plugin lifecycle behavior beyond what the reduced-scope local tests can prove.

### Gaps Summary

No reduced-scope implementation gaps were found in surviving runtime/plugin boundaries. Automated code inspection and targeted tests verify the flattened plugin assembly, canonical runtime packet, per-turn snapshot reuse, relocated instruction-loader ownership, preserved six-tool registration, and the final consumer-proof matrix. Remaining uncertainty is limited to live official-boundary plugin behavior, so this phase is marked `human_needed` rather than `gaps_found`.

---

_Verified: 2026-03-19T16:08:26Z_
_Verifier: Claude (gsd-verifier)_
