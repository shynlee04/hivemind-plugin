---
phase: 49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi
reviewed: 2026-06-02T00:30:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/plugin.ts
  - src/tools/tmux-copilot.ts
  - src/features/tmux/integration.ts
  - src/features/tmux/fork-bridge.ts
  - src/features/tmux/observers.ts
  - tests/lib/tmux/integration.test.ts
  - tests/integration/hook-registration.test.ts
  - .github/workflows/ci.yml
  - tests/scripts/sync-fork.bats
  - scripts/sync-fork.sh
  - opencode-tmux/src/index.ts
  - opencode-tmux/src/tmux.ts
  - opencode-tmux/src/grid-planner.ts
findings:
  critical: 1
  warning: 4
  info: 5
  total: 10
status: issues_found
---

# Phase 49: Code Review Report

**Reviewed:** 2026-06-02T00:30:00Z
**Depth:** standard
**Files Reviewed:** 13 (10 changed in P49 + 3 fork-source cross-refs)
**Status:** issues_found

## Summary

Phase 49 closes the e2e gap for the `tmux-copilot` tool across 9 atomic commits
(2e1fc548 → a8d7b1e5). The implementation is broadly sound: structural types
mirror the fork's published signatures, the `existsSync` guard prevents
build-time crash, the permission gate runs at `execute()` runtime, BATS
runtime evidence (L1) is collected (`49-bats-output.txt` — 3/3 pass), and
L4 (live session) is honestly deferred in `49-SUMMARY.md` (L270-288).

However, the review surfaced one **CRITICAL** architectural gap and four
**WARNING**-level defects. The CRITICAL is the most consequential: Hivemind's
runtime-injection boundary assumes the fork's plugin will call
`setForkSessionManager()` at bootstrap, but `opencode-tmux/src/index.ts:41`
exports only the default `OpencodeTmux` plugin function and constructs
`SessionManager` privately inside the closure (L24). There is no published
mechanism for the fork to inject the adapter into Hivemind — the wiring is
architecturally incomplete as designed.

The WARNINGs include a stale log message ("25 custom tools" vs actual 26),
a catch-block conflation that mislabels adapter errors as "tmux-not-installed",
and broader structural-type surface than the tool consumes.

L5-only runtime claims in P42 UAT.md are flagged for governance — they
contradict the 49-SUMMARY.md evidence-level discipline.

---

## Critical Issues

### CR-01: Runtime-injection producer gap — fork has no published mechanism to inject SessionManager into Hivemind

**File:** `opencode-tmux/src/index.ts:24,41` (producer); `src/features/tmux/fork-bridge.ts:127-129` (consumer)

**Issue:** The Phase 49 architecture rests on a runtime-injection boundary:
the fork's `SessionManager` is supposed to be injected into Hivemind via
`setForkSessionManager()` at plugin bootstrap, and the `tmux-copilot` tool
retrieves it via `getForkSessionManager()`. However, examining the fork's
published `index.ts` (the only file reachable via `package.json` exports —
verified at `opencode-tmux/package.json:8-13`), the export surface is:

```ts
// opencode-tmux/src/index.ts:24
const mgr = new SessionManager(input, config, tmux);
// ...only used inside the event hook closure...
// opencode-tmux/src/index.ts:41
export default OpencodeTmux;
```

`SessionManager` (and `TmuxMultiplexer`, `PaneGridPlanner`) are constructed
locally inside the plugin function and used only within the returned
`event` hook closure (L27-37). They are **never exported**, and the
plugin's public surface consists of just the `default` function plus
whatever hooks it returns. There is no globalThis mutation, no
Hivemind import, no bootstrap callback, no plugin-API extension point
that would let Hivemind's `setForkSessionManager()` ever be called by
the fork.

Hivemind's `fork-bridge.ts:127-129` is a **module-private singleton**:
```ts
export function setForkSessionManager(a: ForkSessionManagerAdapter | null): void {
  adapter = a
}
```

Nothing in the fork's runtime-visible code can reach this setter. The
runtime-injection boundary is aspirational — it assumes a producer
mechanism that does not exist in the fork's published API. In the
absence of a producer, every call to `getForkSessionManager()` returns
`null` and the `tmux-copilot` tool always returns
`{available: false, reason: "fork-not-wired"}` (verified via
`src/tools/tmux-copilot.ts:147-149`).

The P43 paperwork (D-43-02) acknowledges this gap by authorizing "a thin
visibility extension on the fork's `SessionManager`" if methods are not
publicly reachable, but no such extension has been made. P49 plans
(49-01, 49-02) wire the consumer side and treat `null` as graceful, but
do not implement the producer side. Phase 49's "e2e wiring verified"
claim in commit `a8d7b1e5` is therefore **partially false** at the
runtime level — the wiring is structurally complete in Hivemind but
has no producer in the fork.

**Fix:** Pick one of three paths, in order of preference:

1. **Add fork-side export + Hivemind-side importer with deferred init**
   (preferred). Modify the fork's `src/index.ts` to also export
   `SessionManager` (and `TmuxMultiplexer`, `PaneGridPlanner`):
   ```ts
   export { SessionManager } from "./session-manager"
   export { TmuxMultiplexer } from "./tmux"
   export { PaneGridPlanner } from "./grid-planner"
   ```
   Then add a Hivemind bootstrap step (post-fork plugin init) that
   imports the fork and calls `setForkSessionManager(adapter)`. This
   breaks the "no compile-time import" architectural promise, so
   document the trade-off explicitly.

2. **globalThis / process-level registry**. The fork writes the
   adapter to a process-global location (e.g.
   `globalThis.__hivemindForkAdapter__`) on construction; Hivemind
   reads it on first `getForkSessionManager()`. Ugly but avoids the
   compile-time coupling.

3. **Document the gap honestly** and demote the runtime claim. If
   no producer is implementable, change 49-SUMMARY.md and P42 UAT.md
   to say "structural wiring complete; runtime-injection producer
   deferred to P50+". This is the lowest-cost path but admits the
   wiring does not actually work end-to-end.

This finding is **CRITICAL** because the entire Phase 49 narrative —
"e2e wiring verified" — depends on the runtime-injection boundary
being functional. The paperwork is L5-asserted; the producer is
L1-not-implemented. Per planning governance, the L1-L3 evidence chain
required for runtime readiness is **broken** at the producer point.

---

## Warnings

### WR-01: list-panes catch block conflates adapter errors with "tmux-not-installed"

**File:** `src/tools/tmux-copilot.ts:165-171`

**Issue:** The `list-panes` action's `catch` block is empty and
unconditionally returns `{available: false, reason: "tmux-not-installed"}`
regardless of the actual error cause:

```ts
case "list-panes": {
  try {
    const panes = await adapter.listPanes(input.mainPaneId)
    return renderToolResult({ panes })
  } catch {
    return renderToolResult({ available: false, reason: "tmux-not-installed" })
  }
}
```

The `reason: "tmux-not-installed"` semantics in the `TmuxCopilotResult`
union (L85-94) is reserved for the case where the fork adapter itself
is absent (the pre-bridge check at L147-149 handles that and returns
`"fork-not-wired"`). Here, the adapter is present and `listPanes()` was
called — any error from that call is an adapter error, a tmux binary
error, a permission error, or a timeout. Conflating all of these as
`"tmux-not-installed"` misleads callers and corrupts the result-type
contract.

Compare with the `send-keys` branch (L154-163), which correctly
preserves the error message:
```ts
catch (err) {
  return renderToolResult({
    sent: false,
    paneId: input.paneId,
    error: { message: err instanceof Error ? err.message : String(err) },
  })
}
```

**Fix:** Either:
- Match the `send-keys` pattern and return
  `{available: false, reason: "adapter-error", error: {message: ...}}`,
  or
- Add a new reason variant `"adapter-call-failed"` to the result union
  and discriminate on `error` cause when possible.

Empty `catch {}` blocks violate the "handle error or rethrow" rule
from the AGENTS.md "JavaScript/TypeScript" section (unchecked errors).

---

### WR-02: Stale log message — "25 custom tools" but 26 are registered

**File:** `src/plugin.ts:391` (log message); `tests/integration/hook-registration.test.ts:103` (test expectation); `src/plugin.ts:647-671` (tool spread)

**Issue:** The plugin-init log says:
```ts
message: "[Harness] Hivemind plugin loaded — registering 25 custom tools"
```

But the actual count is 26. The test at L103 asserts:
```ts
expect(toolKeys.length).toBe(26)
```

The tool spread at L647-671 contains:
- `...registerDelegationTools(...)` — count: N
- `...registerSessionTools(...)` — count: M
- `...registerHivemindTools(...)` — count: K
- `...registerConfigTools(...)` — count: J
- `"tmux-copilot": tmuxCopilotTool` — count: 1 (added in P49-01, commit 2e1fc548)

N+M+K+J+1 = 26. The log message is stale (predates P49-01). This is a
paper-vs-code drift that downstream consumers (operators, dashboards)
will see and may mis-trust.

**Fix:** Change L391 to:
```ts
message: "[Harness] Hivemind plugin loaded — registering 26 custom tools"
```

Or, more robustly, derive the count from a single source:
```ts
const toolCount = Object.keys({
  ...registerDelegationTools(...),
  ...registerSessionTools(...),
  ...registerHivemindTools(...),
  ...registerConfigTools(...),
  "tmux-copilot": tmuxCopilotTool,
}).length
```
and embed `toolCount` in the message. Eliminates the drift permanently.

---

### WR-03: PaneGridPlanner structural type exposes methods no consumer uses

**File:** `src/features/tmux/fork-bridge.ts:68-72`

**Issue:** The `PaneGridPlanner` interface mirrors three methods:
```ts
export interface PaneGridPlanner {
  computeSplitSequence: (root: PaneTreeNode) => SplitCommand[]
  requestLayout: (root: PaneTreeNode, onComputed: (commands: SplitCommand[]) => void) => void
  cancel: () => void
}
```

But the `tmux-copilot` tool only consumes `computeSplitSequence` (verified
at `src/tools/tmux-copilot.ts:174`):
```ts
const commands = adapter.createPaneGridPlanner().computeSplitSequence(input.tree)
```

`requestLayout` and `cancel` are dead surface in the Hivemind contract.
They are preserved for "fork compatibility" per D-43-02, but their
presence widens the trust boundary (any injected adapter must now
correctly implement all three, not just one) and creates a future
maintenance burden (renaming on the fork side would require
synchronizing three method signatures).

**Fix:** Either:
- Narrow the interface to just `computeSplitSequence` and document
  that `requestLayout`/`cancel` are intentionally excluded from the
  Hivemind-visible surface (the fork may add them; Hivemind ignores them).
- Add JSDoc to each unused method noting "Future use — not currently
  consumed by Hivemind; preserved for fork compatibility".

This is a WARNING (not INFO) because it expands the structural
contract for a real consumer trust boundary, even if the impact is
localized.

---

### WR-04: BATS scenario 2 uses fragile bash operator-precedence pattern

**File:** `tests/scripts/sync-fork.bats:169`

**Issue:** Scenario 2 contains:
```bash
[[ "$output" != *"pinned"* ]]
[[ ! "$output" == *"Sync complete"* ]]
```

The first assertion uses `!=` correctly inside `[[ ]]`. The second
uses `!` outside `[[ ]]` with `==` inside — `[[ ! EXPR == PATTERN ]]`
is operator-precedence fragile across BATS versions and bash modes.
Bash manual: `!` inside `[[ ]]` works reliably as `[[ ! EXPR == PATTERN ]]`,
but the form `[[ ! EXPR == PATTERN ]]` parses as `[[ (no-op !) (EXPR == PATTERN) ]]`
in some strict-mode bash, depending on the operator. The currently-passing
test gets away with it because the pattern is absent, but if the output
ever evolves to contain the string, the assertion may not behave as
intended.

**Fix:** Standardize to one of:
```bash
! [[ "$output" == *"Sync complete"* ]]   # preferred: ! outside
[[ "$output" != *"Sync complete"* ]]     # alternative: != inside
```

Apply the same fix to scenario 3 (L203) which has the identical
`[[ ! "$output" == *"Sync complete"* ]]` pattern.

---

## Info

### IN-01: P42 UAT.md makes L5-only runtime claims (governance drift)

**File:** `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md:23-26`

**Issue:** All four UAT steps say `PASS — verified by P43-02 SUMMARY`:
```md
| 1 | User runs `opencode` inside a tmux session with the fork vendored | Fork plugin entry loads; `setForkSessionManager(adapter)` is called; Hivemind's observer receives the real adapter | PASS — verified by P43-02 SUMMARY |
| 2 | User invokes the `tmux-copilot` tool with action `send-keys` | Tool dispatches via the real adapter; tmux pane receives the text | PASS — verified by P43-02 SUMMARY |
| 3 | User invokes the `tmux-copilot` tool with action `list-panes` | Tool returns `PaneState[]` with `isMain` correctly tagged | PASS — verified by P43-02 SUMMARY |
| 4 | User invokes the `tmux-copilot` tool with action `compute-grid` | Tool returns a debounced `SplitCommand[]` ordered by BFS | PASS — verified by P43-02 SUMMARY |
```

The chain is `P42 UAT.md (L5) → P43-02 SUMMARY (L5) → ... nothing in L1-L3`.
There is no L1 (live runtime) evidence, no L2 (source-verified) wiring
trace, no L3 (test-framework) execution log. The 49-SUMMARY.md
evidence-level table (L270-288) correctly shows P42/P45 closure as
L5-only and acknowledges L4 (live session) is not collected. The P42
UAT.md should reflect the same discipline.

Additionally, step 1's expected behavior ("`setForkSessionManager(adapter)`
is called") directly conflicts with CR-01 above — the fork has no
mechanism to make that call.

**Fix:** Add to P42 UAT.md (line 28+):
```md
## Acceptance Notes

This UAT was L5-verified only (P43-02 SUMMARY references no L1-L3
runtime evidence). Runtime readiness requires the evidence chain
documented in 49-SUMMARY.md (L270-288). The runtime-injection producer
is currently NOT implemented — see 49-REVIEW.md CR-01.
```

---

### IN-02: P43 VERIFICATION.md documents W-01..W-04 spec drifts (non-blocker)

**File:** `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/VERIFICATION.md` (issues table)

**Issue:** Four pre-existing spec drifts (all classified as
non-blocker in P43):

- **W-01:** PaneState shape. SPEC says `size: string`; code has
  `width: number, height: number, isMain: boolean` (matches fork's
  actual `opencode-tmux/src/tmux.ts`). Resolution: code wins, SPEC
  should be updated.
- **W-02:** REQ-04 action names. SPEC says `get-pane`/`plan-grid`;
  code has `send-keys`/`list-panes`/`compute-grid`/`respawn`.
  Resolution: code wins, SPEC should be updated.
- **W-03:** `plugin.ts` line number. SPEC cites L579, actual wiring
  is L594-595 (per P49-02). Resolution: SPEC line refs stale.
- **W-04:** `grid-planner.test.ts` L17 test description says "BFS
  order" but assertions are DFS-preorder. Cosmetic.

These are P43-era findings, not new in P49, but P49's paperwork
chain references them without consolidating. They are already in
the "not blocking" category per P43's verdict.

**Fix:** Add a one-line summary to 49-SUMMARY.md (or a follow-up
P50 task) noting "P43 W-01..W-04 spec drifts remain open; verified
non-blocker, deferred to SPEC consolidation PR".

---

### IN-03: REQUIRES_PERMISSIONS and ORCHESTRATOR_AGENT_NAMES are decoupled

**File:** `src/tools/tmux-copilot.ts:32-39`

**Issue:** The tool declares two related but independent pieces of
information:
```ts
export const REQUIRES_PERMISSIONS = ["orchestrator"] as const

const ORCHESTRATOR_AGENT_NAMES = new Set<string>([
  "hm-l0-orchestrator",
  // ...more tier names...
])
```

The `REQUIRES_PERMISSIONS` const drives the tool's permission
declaration; `ORCHESTRATOR_AGENT_NAMES` is the runtime gate at
`execute()`. Adding a new orchestrator tier (e.g., `hm-l1-orchestrator`)
requires editing the set; forgetting to update the const (or vice
versa) creates a documentation/governance drift.

**Fix:** Derive one from the other, or expose a single source:
```ts
const ORCHESTRATOR_AGENT_NAMES = ["hm-l0-orchestrator", /* ... */] as const
export const REQUIRES_PERMISSIONS = ["orchestrator"] as const
const ORCHESTRATOR_SET = new Set<string>(ORCHESTRATOR_AGENT_NAMES)
```

Better: rename the const to match the set (e.g.,
`REQUIRES_PERMISSIONS = ["orchestrator"]` stays, but the gate
references a single set).

---

### IN-04: readPersistedPort hash-fallback has misleading name and birthday-collision risk

**File:** `src/features/tmux/integration.ts:62-68`

**Issue:** The function:
```ts
function readPersistedPort(projectDir: string): number | null {
  // ...read from disk first, then...
  const hash = crypto.createHash("sha256").update(projectDir).digest("hex")
  const fallback = (parseInt(hash.slice(0, 4), 16) % 55535) + 40000
  return fallback
}
```

Two issues:
1. **Misleading name**: the function returns a deterministic
   fallback even when no file exists. The name implies it only reads
   persisted state.
2. **Birthday-paradox collision**: with 55535 possible port values,
   collision probability crosses 50% at ~275 unrelated project
   directories. Two projects landing on the same port causes the
   second to fail to bind. In practice, only one project runs at a
   time on a given workstation, so collision is rare but not zero
   (e.g., CI runners that reuse image templates across projects).

**Fix:** Rename to `resolvePort(projectDir)` to reflect "read OR
fallback". Document the collision risk in a comment. Consider widening
the namespace to `65535 - 40000 = 25535` ports (current `+ 40000` is
an arbitrary offset; `(parseInt(hash.slice(0, 8), 16) % 65535)` is
already covered by a 16-bit truncation but currently slices only 4
hex chars = 16 bits = 65536 values modulo 55535 — there's headroom
in the unused high ports).

---

### IN-05: BATS suite missing re-run scenario for cleanup-trap verification

**File:** `tests/scripts/sync-fork.bats` (full file, 210 lines)

**Issue:** The suite has 3 scenarios (fast-forward, non-pinned
conflict, pinned-file conflict). None exercise the post-merge
re-run path, which is the only path that verifies the
`trap cleanup EXIT` (at `scripts/sync-fork.sh:54`) actually removes
the `hivemind-fork-temp` remote. If the trap is broken, re-runs
accumulate stale remotes. The cleanup path is the primary defense
against this drift.

**Fix:** Add a 4th scenario:
```bash
@test "scenario 4 — re-run after successful merge: cleanup trap removes temp remote" {
  # Setup: run scenario 1 to completion
  # Assert: re-running the script succeeds (exit 0) without accumulating remotes
  # Verify: git remote | grep -v hivemind-fork-temp returns empty
}
```

Severity is INFO because the `continue-on-error: true` CI posture
(per D-08) limits blast radius, and manual operators would notice
stale remotes.

---

## Reviewer Notes

**Evidence model observed in P49:**

| REQ | L1 (live) | L2 (source) | L3 (test fw) | L5 (paper) |
|-----|-----------|-------------|--------------|------------|
| REQ-04 (tool wiring) | — | ✅ (2e1fc548) | — | ✅ (49-SUMMARY) |
| REQ-05 (runtime-injection) | — | ✅ (2ac06af8) | ✅ (812d734f) | ✅ (49-SUMMARY) |
| REQ-07 (BATS in CI) | ✅ (49-bats-output.txt) | ✅ (fdfd4c3c) | — | ✅ (49-SUMMARY) |
| P42 UAT steps | ❌ claimed | — | — | ✅ only |

The bottom row (P42 UAT) is the governance concern: L5-only runtime
claims are exactly what planning governance warns against. The 49-SUMMARY.md
evidence table is the correct model; P42 UAT.md should be retrofitted
to match (see IN-01).

**Cross-file analysis:** The CR-01 producer gap is the single most
consequential finding. It invalidates the "e2e wiring verified"
claim in commit a8d7b1e5 at the runtime level. P49's evidence is
strong at L2 (source) and partial at L3 (test framework), but the
L1 link — the fork's `SessionManager` actually calling
`setForkSessionManager()` at runtime — is missing. Until either
the producer is added or the claim is downgraded, the runtime
wiring is **structurally complete but operationally inert**.

**Performance:** Out of scope for v1 (per review config). Not flagged.

**Security:** No injection, XSS, hardcoded secrets, or unsafe
deserialization observed. The `bash -c` in BATS scenario
(`run bash -c "cd '$WORK' && SYNC_FORK_REMOTE_URL='$FORK_BARE' '$SYNC_FORK_SH'"`)
uses single-quoted env vars (the BATS `$WORK` and `$FORK_BARE`
are bound at setup time and are file paths / Git URLs, not user
input). No command-injection risk.

---

_Reviewed: 2026-06-02T00:30:00Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
