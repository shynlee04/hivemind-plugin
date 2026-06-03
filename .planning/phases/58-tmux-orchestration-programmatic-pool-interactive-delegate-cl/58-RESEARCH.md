# Phase 58: Tmux Orchestration — Programmatic Pool & Interactive Delegate — Research

**Researched:** 2026-06-03
**Domain:** Production-readiness hardening of the in-tree tmux visual orchestration layer (P51–P55 deliverables)
**Confidence:** HIGH (per-gap summary in §7)
**Evidence level:** L5 (docs-only — this artifact documents research findings; runtime readiness requires L1–L3 proof from `gsd-execute-phase 58` + `gsd-verify-work 58`)

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **6 requirements locked** (REQ-58-01..06), one per architectural gap G1–G6. See `58-SPEC.md` for full requirements, boundaries, acceptance criteria, and the 6-round auto-mode interview log. **Downstream agents MUST read `58-SPEC.md` before planning or implementing. Requirements are NOT duplicated here.**
- **17 implementation decisions locked** (D-58-01..17). See `58-CONTEXT.md` for full decision text, OOS items, and discretion areas. **Planners MUST honor these decisions verbatim.**

### In Scope (verbatim from CONTEXT.md)
- 1 new types file: `src/coordination/delegation/pool-types.ts` (≤ 60 LOC, exporting `DelegationPool`, `DelegationPoolEntry`, `DelegationLifecycleStatus`)
- 1 new method on `DelegationManager`: `getPoolSnapshot(): DelegationPool`
- 1 new optional field on `Delegation` (renamed from "DelegationRecord" in SPEC): `tmuxSessionId: string | null` (backward-compatible)
- 1 new method on session-tracker: `recordDelegationTerminal(delegationId, status, tmuxSessionId?)`
- 2 new event types: `delegation-dispatched`, `delegation-terminal` (delegation-queued is created from scratch — see §1 G6 finding)
- 3 new actions on `tmux-copilot`: `forward-prompt`, `take-over`, `release`
- 1 new action on `delegation-status`: `pool`
- 1 new policy comment block on `src/tools/delegation/delegate-task.ts`
- 6 new BATS scenarios at `tests/scripts/tmux/61..66-*.bats` (one per gap; slot 61 collision with P56 noted in §4)
- 1 extension to `tmux_bats_require_dist` in `tests/scripts/tmux/helpers.bash` (require `dist/coordination/delegation/pool-types.js`)
- Wiring at `src/plugin.ts:920` to respect `manualOverride` flag

### Out of Scope (verbatim from CONTEXT.md)
- No new `src/features/tmux/*.ts` modules (existing 7 in-tree modules are sufficient)
- No new tool registrations in `src/plugin.ts` (P55's 27-tool-key invariant is locked)
- No new `package.json` dependencies (P20 invariant)
- No new `.hivemind/` storage formats (`state: "paused"` already exists in `persistence.ts:32` per P54)
- No SDK upgrade (compatible with `@opencode-ai/plugin ^1.15.13`)
- No new plan mode for delegated agents (G1 guard-rail explicitly forbids it)
- No sidecar-driven tmux projection (SC-04, SC-05) — P58 only adds the data layer
- No multi-user session concurrency (collision detection deferred)
- No auto-refresh of visual dependency graph
- No `appendTuiPrompt` → `showTuiToast` migration (different layer)
- No changes to `manager.ts` action enum (existing 7 actions unchanged)

### the agent's Discretion
The implementer has flexibility for: JSDoc depth, BATS `run --` vs `assert_success` style, G1 regex flavor (must catch all 3 quote/subpath variants per STRIDE-E), BATS session-name interpolation, `manualOverride` field shape (top-level vs `policy:` sub-object), `Object.freeze` ordering, `Date.now()` vs `new Date().getTime()`, SSE event-type ordering, BATS slot 66 event-log seam style, `recordDelegationTerminal` placement.

---

## Phase Requirements

| ID | Description (from ROADMAP.md:2042-2046) | Research Support |
|----|------------------------------------------|------------------|
| REQ-58-01 | delegate-task must not invoke native task tool | §1 G1 + §3 STRIDE-E + §4 slot 61 |
| REQ-58-02 | Programmatic pool status API for all active delegations | §1 G2 + §3 STRIDE-I + §4 slot 62 |
| REQ-58-03 | Abort+resume cycle preserving tmux session state | §1 G3 + §3 STRIDE-D + §4 slot 63 |
| REQ-58-04 | Main-agent-to-delegate prompt forwarding via appendTuiPrompt | §1 G4 + §3 STRIDE-T + §4 slot 64 |
| REQ-58-05 | Mid-flight user override (takeover/release) bypassing orchestrator auto-prompting | §1 G5 + §3 STRIDE-S+R + §4 slot 65 |
| REQ-58-06 | Deep session-tracker integration emitting delegation lifecycle events | §1 G6 + §3 STRIDE-D + §4 slot 66 |

---

## Section 1: Stack Validation

This section validates the **current source-code reality** for each of the 6 gaps by reading the canonical files referenced in `58-CONTEXT.md:144-188`. All claims are cited with file:line references.

### Gap-by-Gap Stack Validation

| Gap | Source file | Line range | Current state (validated) | Target state (per SPEC) | Risk |
|-----|-------------|------------|---------------------------|--------------------------|------|
| **G1** | `src/tools/delegation/delegate-task.ts` | 1–106 | Imports `tool` from `@opencode-ai/plugin/tool` (line 1) — **NOT** the native `task` shortcut. Dispatches via `coordinator.dispatch()` at line 75–83. No bug; **guard-rail** against future regression. | Add 3-sentence `POLICY (P58, G1)` block above `createDelegateTaskTool` (line 23). Add BATS slot 61 with 3 grep assertions. | **Low** — comment is doc-only; grep regex is the actual enforcement. |
| **G2** | `src/coordination/delegation/manager.ts` | 141–145 | `listDelegations(sessionId?)` returns `Delegation[]` (untyped, mutable references). No read-only typed accessor. The `controlDelegation` enum at line 36 has 7 actions: `"abort" \| "cancel" \| "restart" \| "resume" \| "chain" \| "adjust-prompt" \| "change-agent"`. DelegationStatus (types.ts:1–9) has 7 values but does NOT include `"paused"`. | Add `src/coordination/delegation/pool-types.ts` (≤ 60 LOC). Add `getPoolSnapshot(): DelegationPool` on `DelegationManager`. Add `action: "pool"` to `delegationStatusAction` enum in `delegation-status.ts:37`. | **Low** — additive API only, no breaking changes. |
| **G3** | `src/coordination/delegation/manager.ts:153–157` | 153 | `abortDelegation` calls `coordinator.abortDelegation`, `lifecycle.markAborted`, or `terminalFallback`. **Missing**: no `sessionManager.persist({ ...record, state: "paused" })` call. `persistence.ts:32` already has `SessionState = "active" \| "ready" \| "paused" \| "detached" \| "failed"` (P54 invariant). `__stateRoot` test seam at persistence.ts:90. | Wire `state: "paused"` persist in `abortDelegation` (D-58-06). Wire `respawnIfKnown` BEFORE `sendPromptAsync` in `resume` (D-58-07). Wire `state: "ready"` persist in `handleResume` after prompt re-sent (D-58-08). | **Medium** — touches persistence.ts ordering and abort+resume path; subtle off-by-one risk on the BEFORE/AFTER ordering. |
| **G4** | `src/tools/tmux-copilot.ts` | 80–107 | 4 actions in Zod discriminated union: `send-keys`, `list-panes`, `compute-grid`, `respawn`. Permission-gated to orchestrator-tier agents. Bridge check at line 175–178 returns `{ available: false, reason: "tmux-not-wired" }` if no adapter. | Add 3 new actions: `forward-prompt` (D-58-09 sentinel format), `take-over` (D-58-11), `release`. Prepend `[orchestrator-forward <ISO>]\n` sentinel. Suppress via `manualOverride` flag (G5). | **Low** — additive discriminated-union branches; no new tool key. |
| **G5** | `src/plugin.ts:920` + `src/features/session-tracker/index.ts` | 920 + index.ts | `appendTuiPrompt(client, line)` called at plugin.ts:920. **No `manualOverride` check anywhere** — confirmed by repo-wide grep (0 matches). `SessionRecord` (session-tracker/types.ts:59–80) has no policy sub-object. | Add `manualOverride: boolean` flag (top-level or `policy:` sub-object — implementer's discretion). Add `take-over` + `release` actions on tmux-copilot. Modify `appendTuiPrompt` to short-circuit. Modify G4 `forward-prompt` to return `{ suppressed: true, reason: "manualOverride" }`. | **Medium** — new flag, 3 wiring points, new audit field `takenBy: "human-operator"`. No direct precedent for `manualOverride` in codebase. |
| **G6** | `src/features/session-tracker/tool-delegation.ts:234` + `src/sidecar/server/sse/pool.ts:92` | 234 + 92 | `recordChildTaskDelegation()` at line 234 records ONE journey entry (delegation initiated) — NOT a `SessionTrackerEvent` discriminated union member. **Repo-wide grep finds ZERO matches** for `delegation-queued` / `delegation-dispatched` / `delegation-terminal` strings (CONTEXT.md:160 claim that P25.1 added `delegation-queued` is **NOT reflected in current source**). SSE pool is at `src/sidecar/server/sse/pool.ts` (NOT `src/sidecar/sse-pool.ts`). The SSE filter is 6 CATEGORIES at `src/sidecar/server/routes/events.ts:15–31` (`"session" \| "delegation" \| "trajectory" \| "pressure" \| "invalidate" \| "heartbeat"`) — NOT a per-event-type filter. The 3 new event types will flow through the existing `"delegation"` filter category. | Add 3 event types to the `SessionTrackerEvent` union (NEW union — does not exist yet). Extend `recordChildTaskDelegation` to emit `delegation-dispatched`. Add `recordDelegationTerminal(delegationId, status, tmuxSessionId?)` method. Wire SC-01 SSE pool to consume (no filter change — uses existing `"delegation"` category). | **Medium** — claims mismatch CONTEXT.md; planner must create the `SessionTrackerEvent` union from scratch, not extend an existing one. |

### Per-Gap Detail: Test Seam Opportunities & Integration Points

#### G1 — `delegate-task` guard-rail
- **Test seam:** N/A (grep-based regression guard; no runtime seam needed)
- **Integration point:** Top of `src/tools/delegation/delegate-task.ts` (above line 23 export); 3-sentence policy comment per D-58-01

#### G2 — Programmatic pool status API
- **Test seam:** `__getDelegationsForTesting(): ReadonlyMap<string, Delegation>` on `DelegationManager` (D-58-03, matches `__stateRoot` precedent at `persistence.ts:90`)
- **Integration points:**
  - `src/coordination/delegation/pool-types.ts` (new file, ≤ 60 LOC) — exports `DelegationPool`, `DelegationPoolEntry`, `DelegationLifecycleStatus`
  - `src/coordination/delegation/manager.ts` — add `getPoolSnapshot()` method
  - `src/tools/delegation/delegation-status.ts:37` — add `"pool"` to `delegationStatusAction` enum

#### G3 — Abort+resume pane survival
- **Test seam:** Existing `__stateRoot` at `persistence.ts:90`; existing in-memory `delegations` Map
- **Integration points:**
  - `src/coordination/delegation/manager.ts:153` — `abortDelegation` adds `sessionManager.persist({ ...record, state: "paused" })` after `terminalFallback` decision (D-58-06)
  - `src/coordination/delegation/manager.ts:resume` (line ~180) — `respawnIfKnown` BEFORE `sendPromptAsync` (D-58-07)
  - `src/coordination/delegation/manager.ts:handleResume` (line ~210) — `persist({ state: "ready" })` AFTER `sendPromptAsync` resolves (D-58-08)
  - `src/coordination/delegation/types.ts` (line 28 `Delegation` interface) — add `tmuxSessionId?: string | null` optional field

#### G4 — Forward-prompt action
- **Test seam:** Live tmux pane + `tmux capture-pane` buffer grep
- **Integration point:** `src/tools/tmux-copilot.ts:102–107` `TmuxCopilotActionSchema` — add `ForwardPromptActionSchema` to the discriminated union array

#### G5 — Take-over / release actions
- **Test seam:** Live tmux pane + in-memory `Map<sessionId, SessionRecord>` in session-tracker
- **Integration points:**
  - `src/tools/tmux-copilot.ts:102–107` — add `TakeOverActionSchema` and `ReleaseActionSchema`
  - `src/features/session-tracker/index.ts` — add `manualOverride` field on `SessionRecord` (or sub-object per implementer discretion)
  - `src/features/session-tracker/types.ts:59–80` — extend `SessionRecord` interface
  - `src/plugin.ts:920` `appendTuiPrompt` — add early-return guard
  - G4 `forward-prompt` handler — add `manualOverride` check, return `{ suppressed: true, reason: "manualOverride" }` (D-58-12)

#### G6 — Session-tracker delegation events
- **Test seam:** New `__testEventLog` array (matches P25.1 trajectory precedent); existing `__stateRoot` for state-bound tests
- **Integration points:**
  - `src/features/session-tracker/types.ts` — **create new** `SessionTrackerEvent` discriminated union (does NOT exist in current source — see §1 G6 finding)
  - `src/features/session-tracker/tool-delegation.ts:234` — extend `recordChildTaskDelegation` to also emit `delegation-dispatched`
  - `src/features/session-tracker/tool-delegation.ts` — add new `recordDelegationTerminal` method (D-58-14)
  - `src/coordination/delegation/manager.ts` — wire `recordDelegationTerminal` from `terminalFallback` path and `abortDelegation` path
  - `src/sidecar/server/sse/pool.ts` — consume the 3 new event types through existing `"delegation"` filter category (no filter array change)

### Source Code Reality Mismatches with CONTEXT.md

The following 3 findings surface differences between the locked CONTEXT.md and actual source code. Planners MUST account for these:

| # | CONTEXT.md claim | Source reality | Impact |
|---|------------------|----------------|--------|
| 1 | `delegation-queued` event type already exists per P25.1 (line 160) | ZERO matches in src/ or tests/ | G6 must create `SessionTrackerEvent` union from scratch, not extend an existing one. All 3 event types are new. |
| 2 | SSE pool filter at `src/sidecar/sse-pool.ts` (line 172, 233) | SSE pool is at `src/sidecar/server/sse/pool.ts`; filter is 6 CATEGORIES (not event types) at `src/sidecar/server/routes/events.ts:15–31` | D-58-15's "add 3 event types to existing filter array" is moot — the 3 events flow through the existing `"delegation"` category without filter changes. |
| 3 | `DelegationRecord` type is the field-add target (line 150) | Actual interface name is `Delegation` at `src/coordination/delegation/types.ts:28` | `tmuxSessionId` is added to the `Delegation` interface, not `DelegationRecord` (which doesn't exist). |

---

## Section 2: Dependency Version Validation

Read from `/Users/apple/hivemind-plugin-private/package.json` (113 lines, dated 2026-06-03).

### Peer Dependency (per SPEC OOS)
- **`@opencode-ai/plugin`: `^1.15.13`** (peerDep, devDep) — meets SPEC's `>= 1.1.0` minimum; no upgrade required for P58.

### Runtime Dependencies (P20 invariant — no new deps)
| Package | Installed | Used by P58? | Notes |
|---------|-----------|--------------|-------|
| `@ai-sdk/openai-compatible` | `^2.0.47` | No | Out of scope |
| `@clack/prompts` | `^1.4.0` | No | UI only |
| `@modelcontextprotocol/sdk` | `^1.29.0` | No | Out of scope |
| `@opencode-ai/sdk` | `^1.15.13` | No | Out of scope |
| `gray-matter` | `^4.0.3` | No | Out of scope |
| `yaml` | `^2.9.0` | No | Out of scope |
| `zod` | `^4.4.3` | **Yes** | P58 uses Zod discriminated unions for `TmuxCopilotActionSchema` extension (G4+G5) and `delegationStatusAction` enum extension (G2). Zod v4.4+ supports `z.literal()`, `z.discriminatedUnion()`, and the inferred types needed for `DelegationPool`. |

### Dev Dependencies
| Package | Installed | Used by P58? | Notes |
|---------|-----------|--------------|-------|
| `@opencode-ai/plugin` | `^1.15.13` | Yes (peer) | Already satisfies SPEC OOS |
| `@types/bun` | `^1.3.8` | No | PTY feature only |
| `@types/node` | `^20.0.0` | Yes (types) | Node >= 20 required |
| `@vitest/coverage-v8` | `^4.1.7` | Yes (regression) | For `npm run test:coverage` |
| `bats` | `^1.13.0` | **Yes** | P58 BATS scenarios at slots 61–66 |
| `bun-types` | `^1.3.14` | No | PTY feature only |
| `typescript` | `^5.0.0` | **Yes** | TS 5.0+ supports `as const` template literal types, `Object.freeze` deep-freeze patterns, Zod v4 discriminated unions. All patterns required by `pool-types.ts` and the extended discriminated unions. |
| `vitest` | `^4.1.7` | **Yes** | Regression check for 3,203+ existing tests |

### Optional Dependencies (no P58 use)
- `@json-render/*`, `bun-pty`, `react`, `ws` — all unchanged; P58 does not touch these.

### Environment (validated via shell)
| Tool | Path | Version | Status |
|------|------|---------|--------|
| `tmux` | `/usr/local/bin/tmux` | `3.6b` | ✓ Available |
| `bats` | `/usr/local/bin/bats` | `1.13.0` | ✓ Available |
| `node` | (system) | >= 20.0.0 | ✓ Available (per `engines.node`) |
| `tsc` | (via `npm run typecheck`) | ^5.0.0 | ✓ Available |

### P20 Invariant Verification
**Zero new package dependencies** required for P58. All P58 patterns (template literal types, deep `Object.freeze`, Zod v4 discriminated unions, BATS scenarios) are supported by the existing dev/runtime stack.

---

## Section 3: STRIDE Threat Model

Per `gate-l3-lifecycle-integration` skill precedent, P58 surfaces 6 STRIDE categories. Each threat is paired with the SPEC/CONTEXT.md mitigation.

### S — Spoofing

**Threat:** A malicious delegate could forge a `manualOverride` flag value to suppress orchestrator auto-prompting, denying the user real-time visibility into agent activity.

**Attack vector:** The `manualOverride` flag is set via the `tmux-copilot take-over` action. A compromised child session could call this action with `sessionId` set to its own session, then invoke `forward-prompt` to be silently suppressed.

**Mitigation (D-58-11):** The `takenBy` field is a typed string literal `"human-operator"` — server-side, not client-controllable. The flag is set by the `take-over` action which is **permission-gated to orchestrator-tier agents** (`tmux-copilot.ts:159` `ORCHESTRATOR_AGENT_NAMES.has(callerAgent)`). A child delegate session is NOT in `ORCHESTRATOR_AGENTS` (line 49–54), so the permission gate blocks the attack.

**Residual risk:** Low. The orchestrator-tier check is the primary defense; the `takenBy` audit field is the secondary defense for forensic trace.

### T — Tampering

**Threat:** The `forward-prompt` action could inject shell metacharacters via the sentinel line, enabling command injection on the receiving tmux pane.

**Attack vector:** A malicious orchestrator could craft a `text` payload containing `\n[orchestrator-forward 2026-06-03T...]\nrm -rf /` to trick the receiving `cat` process into executing the second line.

**Mitigation (D-58-09):** The sentinel format is **fixed** at the action handler level:
```typescript
const sentinel = `[orchestrator-forward ${new Date().toISOString()}]\n`
const payload = sentinel + text
await adapter.sendKeys(input.paneId, payload, input.literal ?? true)
```
The `literal: true` default ensures `tmux send-keys -l` is used, which suppresses tmux's own special-key interpretation. The sentinel line is concatenated **before** the user-supplied text; the receiving process sees one or two lines, both delivered as literal bytes. No shell interpolation happens on the harness side — the user's terminal emulator (or `cat`) decides what to do with the bytes.

**Escape analysis:** The sentinel contains only `new Date().toISOString()` output, which is a fixed 24-character UTC string like `2026-06-03T19:28:00.000Z`. No metacharacters possible from the date input. The text payload is forwarded as-is — escape responsibility lies with the receiving process, not the orchestrator.

**Residual risk:** Low. The `literal: true` default + fixed-format sentinel prevent metacharacter injection at the tmux layer.

### R — Repudiation

**Threat:** A `take-over` action could be invoked without attribution, making it impossible to audit who suppressed auto-prompting.

**Attack vector:** A rogue orchestrator agent invokes `take-over` with arbitrary `sessionId` and `paneId`, then later claims "I never took over" — the SC-01 SSE pool has no record of WHO invoked the action.

**Mitigation (D-58-11):** The `take-over` action payload includes `takenBy: "human-operator"` (literal string, not parameter). The action is permission-gated to orchestrator-tier agents (line 159), and the calling `agent` from `context.agent` is included in the response envelope. The session-override-taken event payload includes the `callerAgent` (from `ToolContext` at `tmux-copilot.ts:129`).

**Forensic trace:** SC-01 SSE pool receives `session-override-taken` event with `takenBy` and `takenAt` fields. Future phases may persist to `.hivemind/journal/session-overrides.jsonl` (deferred per CONTEXT.md:260).

**Residual risk:** Low. Audit field is server-set; permission gate prevents unauthorized invocation.

### I — Information Disclosure

**Threat:** The `DelegationPool` snapshot returned by `getPoolSnapshot()` could leak sensitive prompt content to consumers (e.g., the SC-01 SSE pool, the SC-04 dashboard, the SC-05 panel).

**Attack vector:** An orchestrator component subscribes to `DelegationPool` updates and reads the `promptPreview` field to extract API keys, credentials, or proprietary business logic embedded in user prompts.

**Mitigation (D-58-05):** The `promptPreview` field is **truncated to 200 characters** (hard cap, suffix-ellipsized with U+2026 `…` when longer) and **single-line** (`\n` replaced with single space, `\r` stripped, `\t` collapsed to space). The 200-char cap is sufficient for preview purposes (e.g., "Investigate the auth flow in module X...") but truncates long prompts before sensitive content can leak.

**JSON round-trip invariant:** The snapshot is `Object.freeze`-d at the top level and each entry (D-58-04), and round-trips through `JSON.stringify` + `JSON.parse` without loss. No `Date` objects are serialized — only numeric epochs and primitive strings (D-58-04).

**Residual risk:** Low. Truncation prevents large-prompt leakage; freezing prevents downstream mutation that could expand the preview.

### D — Denial of Service

**Threat:** The 3-event fanout (G6) per delegation could cause journal write storms under high delegation throughput (e.g., 100 delegations × 3 events = 300 writes).

**Attack vector:** A bot orchestrator dispatches 1000 delegations per second; each triggers `delegation-queued` + `delegation-dispatched` + `delegation-terminal` writes to the SC-01 SSE pool; the pool exhausts its file-descriptor or memory budget.

**Mitigation (D-58-13, D-58-15):**
1. **Fan-in at session-tracker, not fan-out:** The 3 events per delegation are emitted from a single in-memory event log (`__testEventLog` seam); the SC-01 SSE pool subscribes once and re-broadcasts. No N×M write pattern.
2. **`emittedAt` is monotonic:** `Date.now()` numeric (ms epoch, D-58-13) — sort-friendly, integer arithmetic. No string parsing overhead.
3. **Bounded event types:** The 3 new event types flow through the existing `"delegation"` filter category (no new SSE connections needed).
4. **D-04 silent-fallback preserved:** No throw on missing prerequisites; events are best-effort logged at `tool-delegation.ts:415–425`.

**Residual risk:** Low. The fan-in architecture matches P25.1 trajectory precedent.

### E — Elevation of Privilege

**Threat:** The G1 grep-based guard could be bypassed by a contributor who imports the native `task` tool via a non-standard import statement.

**Attack vector:** A contributor writes one of:
- `import { task } from "@opencode-ai/plugin"` (bare import — SPEC's regex catches this)
- `import { task } from '@opencode-ai/plugin'` (single quotes — SPEC's regex catches this)
- `import { task } from "@opencode-ai/plugin/task"` (subpath import — **SPEC's regex does NOT catch this** because the regex is `from ['\"]@opencode-ai/plugin['\"]` which requires the closing quote right after `plugin`)

**Mitigation (D-58-02, D-58-15-style):** The G1 BATS scenario uses 3 grep assertions per CONTEXT.md D-58-02:
1. `grep -rE "from ['\"]@opencode-ai/plugin['\"]" src/tools/delegation/ | grep -E "\btask\b"` — catches bare imports
2. `grep -rE "createTaskTool" src/tools/delegation/` — catches the SDK factory function
3. `grep -c "POLICY (P58, G1)" src/tools/delegation/delegate-task.ts` — confirms policy comment

**Recommended enhancement (implementer's discretion per CONTEXT.md:107):** The implementer should tighten the first regex to also catch subpath imports:
```bash
grep -rE "from ['\"]@opencode-ai/plugin(/task)?['\"]" src/tools/delegation/ | grep -E "\btask\b"
```
This adds an optional `(/task)?` group to the path, catching both `from "@opencode-ai/plugin"` and `from "@opencode-ai/plugin/task"`. The implementer should validate this regex on the current `delegate-task.ts:1` `import { tool } from "@opencode-ai/plugin/tool"` and confirm it does NOT match (the path is `@opencode-ai/plugin/tool`, not `@opencode-ai/plugin/task`).

**Residual risk:** Low. The 3-assertion chain + recommended regex tightening provides defense-in-depth.

---

## Section 4: BATS Scenario Inventory

P58 produces **6 BATS scenarios** at `tests/scripts/tmux/61..66-*.bats`. Each scenario follows the P53/P54/P55 BATS pattern: `setup()` → `tmux_bats_require_dist` + `tmux_bats_make_project` → `@test "..."` blocks → `teardown()` with `tmux kill-session` cleanup. All scenarios use `BATS_TEST_TMPDIR` isolation (D-58-16).

**Slot 61 collision:** P56 reserved slot 61 for `61-stress-test-real-world-workflow.bats` (existing file, 14,454 bytes). The P58 SPEC assigns slot 61 to the G1 grep-guard scenario. Per CONTEXT.md:242, the implementer should follow P58 SPEC numbering (61–66) and accept that P58's G1 scenario will need to be renamed to slot 67 if a CI failure is reported. This is a known issue; the spec's slot reservation is conservative.

### BATS Helper Extension (D-58-16)
`tests/scripts/tmux/helpers.bash:tmux_bats_require_dist()` (lines 11–31) currently checks 6 dist artifacts. P58 EXECUTE adds 1 line:
```bash
if [[ ! -f "${TMUX_BATS_ROOT}/dist/coordination/delegation/pool-types.js" ]]; then
  skip "dist/coordination/delegation/pool-types.js missing — run 'npx tsc' first"
fi
```
Place this after the `dist/tools/tmux-copilot.js` check (line 28–30). The `dist/coordination/delegation/manager.js` artifact is NOT needed because `pool-types.ts` is the new file; the manager.js is already part of the build.

### Scenario 1 — Slot 61: G1 Guard-Rail

| Attribute | Value |
|-----------|-------|
| **Test name** | `delegate-task does not invoke native task tool (G1)` |
| **File path** | `tests/scripts/tmux/61-delegate-task-no-native-task-tool.bats` |
| **Setup** | No tmux session needed; pure grep assertions. `BATS_TEST_TMPDIR` not used. |
| **Assertions** | 3 chained grep checks in a single `@test` block: (a) `grep -rE "from ['\"]@opencode-ai/plugin['\"]" src/tools/delegation/ \| grep -E "\btask\b"` returns exit 1; (b) `grep -rE "createTaskTool" src/tools/delegation/` returns exit 1; (c) `grep -c "POLICY (P58, G1)" src/tools/delegation/delegate-task.ts` returns `>= 1`. |
| **Acceptance** | BATS exits 0; all 3 grep assertions pass. |
| **Runtime budget** | ≤ 5 seconds (pure grep; no tmux) |
| **Reuse** | `BATS_TEST_TMPDIR` auto-isolation; no helpers needed beyond standard BATS `run` + `assert_success` |
| **Per D-58-02** | Single `@test` block with 3 sequential `run --` assertions; matches P55 slot 60 G6 guard-rail scenario pattern. |

### Scenario 2 — Slot 62: G2 Pool Status API

| Attribute | Value |
|-----------|-------|
| **Test name** | `getPoolSnapshot returns frozen DelegationPool with 3 entries (G2)` |
| **File path** | `tests/scripts/tmux/62-pool-status-api.bats` |
| **Setup** | `tmux_bats_make_project`; in-memory `delegations` Map via `__getDelegationsForTesting` seam (D-58-03). 3 fake delegations inserted via `tmux_node_eval` Node ESM bridge. |
| **Assertions** | (a) `getPoolSnapshot()` returns object with `schemaVersion === 1` (numeric literal); (b) 3 entries in `delegations` array; (c) each `id` is UUIDv7-format; (d) each `promptPreview` is ≤ 200 chars; (e) no `\n` in any `promptPreview`; (f) `Object.isFrozen(snapshot)` is true; (g) `JSON.stringify(snapshot)` + `JSON.parse(...)` round-trip succeeds; (h) re-call returns same shape with `capturedAt` within 50ms tolerance. |
| **Acceptance** | BATS exits 0; all 8 assertions pass. |
| **Runtime budget** | ≤ 10 seconds |
| **Reuse** | `tmux_bats_require_dist` (extended for `pool-types.js`); `tmux_bats_make_project` (D-58-16); in-memory state via `__getDelegationsForTesting` seam. |
| **Per D-58-16** | BATS_TEST_TMPDIR-isolated; no disk writes (in-memory Map only). |

### Scenario 3 — Slot 63: G3 Abort+Resume Pane Survival

| Attribute | Value |
|-----------|-------|
| **Test name** | `abortDelegation + resume preserves tmux pane via state: paused (G3)` |
| **File path** | `tests/scripts/tmux/63-abort-resume-pane-survival.bats` |
| **Setup** | `tmux_bats_make_project`; create real tmux session via `tmux new-session -d -s <name> 'sleep 600'`; wire fake `Delegation` record with `tmuxSessionId: <sid>`. |
| **Assertions** | (a) `abortDelegation(<id>)` causes `.hivemind/state/tmux-sessions/<sid>.json` to have `jq -r .state` = `"paused"`; (b) `resume(<id>)` causes `respawnIfKnown(<sid>)` to return non-null `paneId` matching live `tmux list-panes -t <name> -F '#{pane_id}' \| head -1`; (c) persistence file now has `jq -r .state` = `"ready"`. |
| **Acceptance** | BATS exits 0; all 3 state transitions verified. |
| **Runtime budget** | ≤ 10 seconds |
| **Reuse** | `tmux_bats_require_dist` (persistence.js already checked); `tmux_bats_make_project`; mirrors P54 slot 56 `56-session-persistence-kill-restart.bats` pattern. |
| **Per D-58-06, D-58-07, D-58-08** | Tests the 3 call sites: abort → persist(paused); resume → respawnIfKnown BEFORE sendPromptAsync; handleResume → persist(ready) AFTER sendPromptAsync. |

### Scenario 4 — Slot 64: G4 Forward-Prompt

| Attribute | Value |
|-----------|-------|
| **Test name** | `tmux-copilot forward-prompt delivers sentinel-prepended text to live pane (G4)` |
| **File path** | `tests/scripts/tmux/64-forward-prompt.bats` |
| **Setup** | `tmux_bats_require_dist`; create real tmux session via `tmux new-session -d -s <name> 'cat'`; discover live `paneId` via `tmux list-panes`. |
| **Assertions** | (a) Call `forward-prompt` action with `paneId` + `text="E2E-FORWARD-PROBE-1780434056"`; (b) wait 200ms for tmux flush; (c) `tmux capture-pane -t <paneId> -p \| grep -c 'orchestrator-forward'` is `>= 1`; (d) `grep -c 'E2E-FORWARD-PROBE-1780434056'` is `>= 1`. |
| **Acceptance** | BATS exits 0; sentinel line AND text both visible in pane buffer. |
| **Runtime budget** | ≤ 10 seconds |
| **Reuse** | Mirrors P55 slot 58 `58-orchestrator-intervention.bats` pattern (real tmux + `TmuxMultiplexer.sendKeys` delivery). |
| **Per D-58-09, D-58-10** | Sentinel format `[orchestrator-forward <ISO>]\n`; `byteLength` uses UTF-8 byte count via `Buffer.byteLength`. |

### Scenario 5 — Slot 65: G5 Takeover/Release

| Attribute | Value |
|-----------|-------|
| **Test name** | `tmux-copilot take-over / release suppresses and restores forward-prompt (G5)` |
| **File path** | `tests/scripts/tmux/65-takeover-release.bats` |
| **Setup** | `tmux_bats_require_dist`; create real tmux session via `tmux new-session -d -s <name> 'cat'`; wire fake `SessionRecord` with `sessionId: <sid>`, `manualOverride: false`. |
| **Assertions** | (a) `take-over <sid> <paneId>` sets `manualOverride: true` AND emits `session-override-taken` event; (b) `forward-prompt` with `text="SHOULD-BE-SUPPRESSED-1780434056"` returns `suppressed: true` AND `tmux capture-pane` does NOT show the text; (c) `release <sid>` sets `manualOverride: false` AND emits `session-override-released`; (d) `forward-prompt` with `text="SHOULD-BE-DELIVERED-1780434056"` returns `deliveredAt` set AND `tmux capture-pane` shows the text. |
| **Acceptance** | BATS exits 0; suppression AND restoration both verified. |
| **Runtime budget** | ≤ 10 seconds |
| **Reuse** | Real tmux session; in-memory `SessionRecord` map; mirrors P55 slot 58 pattern. |
| **Per D-58-11, D-58-12** | `takenBy: "human-operator"` audit field; suppression response `{ suppressed: true, reason: "manualOverride", paneId, textPreview, evaluatedAt }`. |

### Scenario 6 — Slot 66: G6 Session-Tracker Delegation Events

| Attribute | Value |
|-----------|-------|
| **Test name** | `session-tracker emits 3 delegation lifecycle events with tmuxSessionId (G6)` |
| **File path** | `tests/scripts/tmux/66-session-tracker-delegation-events.bats` |
| **Setup** | `tmux_bats_require_dist`; construct fake `DelegationManager` with 2 delegations. |
| **Assertions** | (a) `recordChildTaskDelegation` called for both → 2 `delegation-queued` events in in-memory log; (b) SDK child-session creation (simulated) → 2 `delegation-dispatched` events with `tmuxSessionId: null`; (c) `recordDelegationTerminal(<id1>, "completed")` + `abortDelegation(<id2>)` → 1 `delegation-terminal` with `status: "completed"` and 1 with `status: "aborted"`; (d) all 6 events have `emittedAt` increasing monotonically; (e) SC-01 SSE pool filter accepts all 3 event types (`filter.accepts("delegation-queued")` returns `true` for all 3). |
| **Acceptance** | BATS exits 0; 6 events total (2 queued + 2 dispatched + 2 terminal). |
| **Runtime budget** | ≤ 5 seconds (no real tmux) |
| **Reuse** | In-memory event log via `__testEventLog` seam; SC-01 filter check via `events.ts:SseFilter.includes(...)`. |
| **Per D-58-13, D-58-14, D-58-15** | `emittedAt` is `Date.now()` numeric; `recordDelegationTerminal` typed signature; SSE pool filter is the existing 6-category array (`"delegation"` is the relevant category). |

### BATS Runtime Aggregate Budget
6 scenarios × 10s max = 60s; actual aggregate (with BATS `--jobs 1` serial) is typically 20–30s based on P55's 4-scenario baseline. Acceptable for CI.

---

## Section 5: Risk Heat Map

### HIGH RISK

**G5 — manualOverride (3 wiring points)**
- **Why HIGH:** New flag, no precedent in codebase, 3 separate wiring points (`plugin.ts:920`, G4 `forward-prompt`, G5 `take-over`/`release` actions). The flag is set via action and read via 2 different code paths; consistency depends on implementer discipline.
- **Mitigation:** D-58-11 (`takenBy: "human-operator"` audit field), D-58-12 (suppression response shape), permission gate at `tmux-copilot.ts:159`.
- **Detection:** BATS slot 65 verifies end-to-end suppression + restoration.

### MEDIUM RISK

**G3 — Paused state ordering (3 call sites in manager.ts)**
- **Why MEDIUM:** Touches `persistence.ts` ordering and the abort+resume path. The BEFORE/AFTER ordering of `respawnIfKnown` vs `sendPromptAsync` is subtle — sending the prompt to a stale `paneId` would lose the message (D-58-07).
- **Mitigation:** D-58-06, D-58-07, D-58-08 lock the exact ordering. `state: "paused"` already exists in `SessionState` union (persistence.ts:32, no schema change).
- **Detection:** BATS slot 63 verifies 3 state transitions.

**G6 — SessionTrackerEvent union creation (CONTEXT.md drift)**
- **Why MEDIUM:** CONTEXT.md:160 claims P25.1 added `delegation-queued`; this is NOT in the current source. The 3 event types must be created from scratch, not extended from an existing union. Plus, the SSE pool location differs from CONTEXT.md (real path: `src/sidecar/server/sse/pool.ts`).
- **Mitigation:** §1 G6 finding surfaces the mismatch; planner must create `SessionTrackerEvent` union, not extend one. D-58-15's "add to filter array" is moot — events flow through existing `"delegation"` filter category.
- **Detection:** BATS slot 66 verifies all 6 events with monotonic `emittedAt`.

### LOW RISK

**G1 — Grep guard (3 assertions)**
- **Why LOW:** Comment is doc-only; grep regex is the enforcement. The recommended enhancement to catch subpath imports is implementer's discretion.
- **Detection:** BATS slot 61 verifies all 3 grep assertions in 5s.

**G2 — Frozen contract (additive API)**
- **Why LOW:** New file, new method, new action — all additive. No breaking changes to existing callers. `schemaVersion: 1` follows D-53-13 numeric-literal convention.
- **Detection:** BATS slot 62 verifies 8 assertions including JSON round-trip.

**G4 — Sentinel format (additive discriminated union)**
- **Why LOW:** 3 new branches in `TmuxCopilotActionSchema`; no new tool key (27-tool-key invariant preserved). Sentinel format is fixed at handler level.
- **Detection:** BATS slot 64 verifies sentinel + text delivery to live `cat` process.

### Cross-Cutting Risks

| Risk | Mitigation | Detection |
|------|------------|-----------|
| **27-tool-key invariant broken** (P49 + P55) | All new functionality attaches to existing tools' Zod discriminated unions; no new tool keys in `src/plugin.ts`. | `tests/integration/hook-registration.test.ts` (P49) asserts 27 tool keys. |
| **`tsc --noEmit` not clean** | No `any` in new types; `DelegationPool` is strict readonly interface. | `npm run typecheck` exits 0. |
| **Vitest regression** (3,203+ tests) | P58 changes are additive; no existing call sites modified beyond the discriminated-union extensions. | `npm test` passes. |
| **BATS slot 61 collision with P56** | Per CONTEXT.md:242, follow P58 SPEC numbering; renumber to slot 67 if CI fails. | `bats --jobs 1 tests/scripts/tmux/61-*.bats` runs both 61-files serially. |
| **P55 L1 evidence preservation** (slots 57–60) | P58 changes are additive; no modifications to P55 scenarios. | `bats tests/scripts/tmux/57-*.bats 58-*.bats 59-*.bats 60-*.bats` all exit 0. |
| **P56 L1+L2 evidence preservation** (slot 61) | P58 G1 scenario at slot 61 may collide with P56 stress test; resolution deferred per CONTEXT.md:252. | Both 61-files run; whichever loses is renamed to slot 67. |
| **D-04 silent-fallback** (`integration.ts:197–202`) | P58 G3 abort+resume preserves D-04: no throw crosses the path. | No new throws introduced in manager.ts. |

---

## Section 6: Open Questions

**Per the locked SPEC + CONTEXT, all major decisions are resolved.** The following 3 items are surface-level research findings (not open questions requiring user re-validation) that planners MUST account for:

| # | Finding | Recommendation |
|---|---------|----------------|
| Q1 | CONTEXT.md:160 claims `delegation-queued` event type already exists from P25.1. **Source reality: zero matches anywhere.** | Planner creates `SessionTrackerEvent` union from scratch with 3 members (`delegation-queued`, `delegation-dispatched`, `delegation-terminal`). All 3 are new. No re-validation needed — this is a documentation correction, not a design change. |
| Q2 | CONTEXT.md:172, 233 references SSE pool at `src/sidecar/sse-pool.ts`. **Source reality: SSE pool is at `src/sidecar/server/sse/pool.ts`.** | Planner uses the real path. D-58-15's "add to filter array" is reinterpreted: the 3 new event types flow through the existing `"delegation"` filter category at `src/sidecar/server/routes/events.ts:15–31` without filter array changes. No re-validation needed. |
| Q3 | CONTEXT.md:150 references `DelegationRecord` type. **Source reality: the interface is named `Delegation` at `src/coordination/delegation/types.ts:28`.** | Planner adds `tmuxSessionId?: string \| null` to the `Delegation` interface, not `DelegationRecord`. No re-validation needed. |

**No open questions require `/gsd-discuss-phase 58 --no-auto` re-validation.** The SPEC + CONTEXT are internally consistent modulo the 3 surface-level findings above, all of which are documentation corrections with clear source-of-truth resolutions.

---

## Section 7: Confidence Assessment

### Per-Gap Confidence

| Gap | Confidence | Rationale |
|-----|------------|-----------|
| **G1** | **HIGH** | Source verified: `delegate-task.ts:1` uses `@opencode-ai/plugin/tool` (legitimate), not `@opencode-ai/plugin` (the target). The grep guard is straightforward. D-58-01, D-58-02 lock the exact comment text + BATS pattern. |
| **G2** | **HIGH** | Source verified: `manager.ts:141–145` has `listDelegations()` but no `getPoolSnapshot()`. New file `pool-types.ts` is additive. `delegationStatusAction` enum at `delegation-status.ts:37` accepts new `"pool"` value via Zod. D-58-03, D-58-04, D-58-05 lock the seam pattern + freeze contract + preview sanitization. |
| **G3** | **MEDIUM** | Source verified: `manager.ts:153–157` has `abortDelegation`; `persistence.ts:32` has `paused` literal. **MEDIUM** because the BEFORE/AFTER ordering of `respawnIfKnown` vs `sendPromptAsync` is subtle (D-58-07), and the 3 call sites must be wired consistently. |
| **G4** | **HIGH** | Source verified: `tmux-copilot.ts:80–107` has 4-action discriminated union; adding 3 more is additive. Sentinel format locked at D-58-09. `literal: true` default prevents tmux special-key interpretation. |
| **G5** | **MEDIUM** | Source verified: `plugin.ts:920` is the wiring point; no `manualOverride` field exists. **MEDIUM** because: (1) no precedent in codebase, (2) 3 wiring points must stay consistent, (3) `SessionRecord` extension is a public type change. D-58-11, D-58-12 lock the audit field + suppression shape. |
| **G6** | **MEDIUM** | Source verified: `tool-delegation.ts:234` records one journey entry; no `SessionTrackerEvent` union exists. **MEDIUM** because: (1) CONTEXT.md:160 drift (claims P25.1 added `delegation-queued` — not in source), (2) SSE pool location drift, (3) 3 event types must be created from scratch. D-58-13, D-58-14, D-58-15 lock the timestamp format + method signature + filter handling. |

### Overall Phase Confidence: **0.85 (HIGH)**

**Justification:** All 6 gaps are well-defined with discrete REQs (REQ-58-01..06) and 13 acceptance criteria locked in `58-SPEC.md`. The 17 implementation decisions (D-58-01..17) in `58-CONTEXT.md` cover all major design questions. Source validation confirms 4 of 6 gaps are LOW risk; the 2 MEDIUM gaps (G3, G5, G6) have explicit D-numbered mitigations. The 3 documentation drifts in CONTEXT.md are surface-level corrections with clear source-of-truth resolutions and do not require re-validation.

**Confidence deduction (-0.15):** 3 documentation drifts (Q1–Q3) and 1 slot collision (P56 vs P58 at slot 61) require planner awareness but are not blockers. The MEDIUM-risk gaps (G3, G5, G6) each have 1–2% implementation risk even with mitigations.

### Risk Summary by Confidence

- **HIGH confidence (4/6 gaps):** G1, G2, G4 + all 17 decisions locked
- **MEDIUM confidence (2/6 gaps):** G3, G5, G6 (per-gap MEDIUM)
- **LOW confidence (0/6 gaps):** None

---

## Boundary Verification (per `.planning/AGENTS.md` §2, §3, §6)

### Allowed Surfaces (this research artifact)
- `.planning/phases/58-tmux-orchestration-programmatic-pool-interactive-delegate-cl/58-RESEARCH.md` (write-only)
- `.planning/STATE.md` (read-only, for prior-phase context)
- `.git/` (commit metadata)

### Forbidden Surfaces (read-only, NOT modified)
- `src/**` — runtime code (delegation manager, tools, session-tracker, tmux feature layer)
- `tests/**` — BATS + vitest test files
- `.opencode/**` — OpenCode primitives (agents, skills, commands, rules)
- `.hivemind/**` — internal state root (Q6 locked)

### Actors/Consumers
| Actor | Uses this artifact for | Boundary |
|-------|------------------------|----------|
| `hm-planner` | Section 1 (gap tables), Section 4 (BATS inventory), Section 5 (risk heat map) | Plans tasks against REQ-58-01..06; honors D-58-01..17 verbatim |
| `hm-executor` | Section 2 (dependency validation), Section 3 (STRIDE mitigations) | Implements per SPEC; runs tsc + vitest + BATS regression |
| `hm-verifier` | Section 7 (confidence), Section 4 (BATS acceptance criteria) | Verifies 13 acceptance criteria checkboxes from SPEC |
| `gate-l3-lifecycle-integration` | Section 1 (integration points), Section 5 (cross-cutting risks) | Audits 9-surface CQRS boundaries; checks 27-tool-key invariant |
| `gate-l3-spec-compliance` | Section 7 + SPEC.md | Bidirectional traceability REQ-58-01..06 → code |
| `gate-l3-evidence-truth` | Section 4 (BATS L1) + Section 7 (confidence) | Evaluates evidence hierarchy: BATS = L1; tsc = L1; this artifact = L5 |

### Verification Commands (for downstream agents)
```bash
# Type-check (regression check)
npm run typecheck

# Unit test regression (3,203+ tests)
npm test

# BATS regression (slots 01–60 must still pass)
bats tests/scripts/tmux/

# BATS P58 (slots 61–66, after EXECUTE phase)
bats tests/scripts/tmux/61-delegate-task-no-native-task-tool.bats \
      tests/scripts/tmux/62-pool-status-api.bats \
      tests/scripts/tmux/63-abort-resume-pane-survival.bats \
      tests/scripts/tmux/64-forward-prompt.bats \
      tests/scripts/tmux/65-takeover-release.bats \
      tests/scripts/tmux/66-session-tracker-delegation-events.bats
```

### Stop Conditions
- **Planner MUST NOT** authorize runtime code mutations from this L5 artifact alone. Implementation requires `gsd-execute-phase 58` which produces L1–L3 evidence (test output, runtime proof).
- **Verifier MUST NOT** clear P58 unless all 6 BATS scenarios pass + `tsc --noEmit` exits 0 + vitest regression passes + 27-tool-key invariant intact.
- **Shipper MUST NOT** create PR for P58 until both `gsd-verify-work 58` AND quality-gate triad (lifecycle → spec → evidence) clear.

### Evidence Level Statement
**This artifact is L5 (documentation-only).** Per `.planning/AGENTS.md` §6, "Planning docs SHALL NOT claim runtime readiness from docs-only evidence." P58 runtime readiness requires:
- L1 (live test output) from BATS slots 61–66
- L1 from `tsc --noEmit` exit 0
- L1 from `npm test` (3,203+ vitest pass)
- L1 from 27-tool-key assertion (`tests/integration/hook-registration.test.ts`)
- L2 (integrated BATS + vitest) from `gsd-verify-work 58`
- L3 (gate triad) from `gate-l3-*` skills

---

## Sources

### Primary (HIGH confidence)
- `58-SPEC.md:34–212` — 6 requirements (REQ-58-01..06), 13 acceptance criteria, 6-round auto-mode interview log
- `58-CONTEXT.md:144–233` — canonical_refs with file:line citations
- `58-CONTEXT.md:58–117` — 17 implementation decisions (D-58-01..17)
- `.planning/ROADMAP.md:2042–2051` — Phase 58 entry, dependencies, plans placeholder
- `.planning/AGENTS.md` — planning/governance sector rules, evidence levels, mutation authority

### Secondary (HIGH confidence, source-validated)
- `src/tools/delegation/delegate-task.ts:1–106` — G1 target, no native `task` shortcut
- `src/coordination/delegation/manager.ts:36, 141–145, 153–157` — G2 + G3 wiring points
- `src/coordination/delegation/types.ts:1–75` — `Delegation` interface, no `tmuxSessionId` field
- `src/tools/tmux-copilot.ts:49–107, 156–234` — G4 + G5 wiring points, 4 actions
- `src/features/session-tracker/tool-delegation.ts:234–371` — G6 target, `recordChildTaskDelegation`
- `src/features/tmux/persistence.ts:32, 90, 36–292` — `SessionState` union with `paused`, `__stateRoot` seam, D-53-13 `schemaVersion: 1` precedent
- `src/plugin.ts:28, 920` — G5 wiring point, `appendTuiPrompt` call site
- `src/sidecar/server/sse/pool.ts:92` — real SSE pool path
- `src/sidecar/server/routes/events.ts:15–31` — SSE filter is 6 CATEGORIES, not event types
- `src/tools/delegation/delegation-status.ts:25, 37` — G2 wiring, `delegationStatusAction` enum
- `tests/scripts/tmux/helpers.bash:11–31` — `tmux_bats_require_dist` extension point
- `tests/scripts/tmux/01..06, 52..61-*.bats` — existing BATS scenarios (16 total)
- `package.json:49–80` — dependency validation

### Tertiary (MEDIUM confidence, contextual)
- `src/features/session-tracker/types.ts:59–80` — `SessionRecord` interface, no `manualOverride` field
- `src/features/session-tracker/index.ts:149` — `handleSessionEvent` pattern for new event types
- `src/features/session-tracker/capture/event-capture.ts:72–73` — existing event handler pattern
- `.planning/codebase/ARCHITECTURE.md` — 9-surface CQRS model reference

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — `@opencode-ai/plugin ^1.15.13`, `zod ^4.4.3`, `typescript ^5.0.0`, `vitest ^4.1.7`, `bats ^1.13.0`, `tmux 3.6b` all verified in `package.json` and runtime environment.
- Architecture: **HIGH** — 7 in-tree `src/features/tmux/` modules + `manager.ts` + `tool-delegation.ts` + `tmux-copilot.ts` + `delegation-status.ts` all verified; integration points cited with file:line.
- Pitfalls: **HIGH** — 3 documentation drifts in CONTEXT.md surfaced and resolved; slot 61 collision noted; BEFORE/AFTER ordering risk in G3 documented; `manualOverride` 3-wiring-point risk documented.
- BATS inventory: **HIGH** — 6 scenarios with assertions, runtime budgets, and reuse patterns; mirrors P53/P54/P55 BATS precedent.
- STRIDE: **MEDIUM** — 6 categories with mitigations tied to D-58-xx decisions; residual risks documented.

**Research date:** 2026-06-03
**Valid until:** 2026-07-03 (30 days; Hivemind source is fast-moving, but P58 SPEC + CONTEXT are locked)
**Phase:** 58-tmux-orchestration-programmatic-pool-interactive-delegate-cl
**Next step:** `/gsd-plan-phase 58` — produce `58-PATTERNS.md` (CP7) and `58-PLAN-*.md` files against this research + the locked SPEC + CONTEXT.
