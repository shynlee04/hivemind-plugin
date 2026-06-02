# Phase 55: E2E UAT Against Seed's 4 Success Criteria — Pattern Map

**Mapped:** 2026-06-02
**Phase:** 55 (E2E UAT Against Seed's 4 Success Criteria)
**Files mapped:** 4 new BATS test files (`tests/scripts/tmux/{57,58,59,60}-*.bats`) + 1 extension to `tests/scripts/tmux/helpers.bash` + 1 new UAT report (`.planning/phases/55-e2e-uat-against-seed-success-criteria/55-E2E-UAT-2026-06-02.md`)
**Analogs found:** 6 in-tree analogs sourced + 1 GATE evaluation pattern (3/4 → advance / 2/4 → retry / 1/4 → hard fail)
**Composite risk:** 0.06 (GREEN-LIT, unchanged from locked `D-55-*` set in 55-CONTEXT.md)
**Constraint:** P55 is **verification-only** — no new `src/**` files, no new tool registrations, no new `package.json` deps. Patterns are for BATS test code + governance docs ONLY.

---

## 1. BATS for live pane monitoring (criterion 1) — closest analog: `tests/scripts/tmux/55-pane-monitor-journal-capture.bats` (P53)

**Decision:** The P55 BATS scenario `tests/scripts/tmux/57-live-pane-monitoring.bats` follows the **`load "helpers"` + `setup()` with `tmux_bats_require_dist` + `tmux_bats_make_project`** shape from `tests/scripts/tmux/55-pane-monitor-journal-capture.bats:9-14`, but replaces the **synthetic `PaneCapturedEvent`** payload (the P53 test fixture constructs the event object directly at line 27) with a **real tmux session lifecycle**: spawn via `tmux new-session -d -s <name> -c <project> 'sleep 600'`, capture the live `paneId` via `tmux list-panes`, then drive the P52 observer with a real PaneCapturedEvent. The journal entry assertions (`jq -r .eventType`, `jq -r .schemaVersion`, `jq -r 'keys | length'`) are byte-identical to P53's pattern (lines 42-50).

### Code (canonical analog — P53 BATS structure)
```bash
# tests/scripts/tmux/55-pane-monitor-journal-capture.bats:9-14
load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}
```

```bash
# tests/scripts/tmux/55-pane-monitor-journal-capture.bats:17-51 — typical P53 scenario
@test "pane-monitor writes 7-field JSON journal entry on pane-captured event" {
  local journal_root="${BATS_TEST_TMPDIR}/project/.hivemind/journal"
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js').then(async (obs) => {
      const { createPaneMonitorHook } = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
      const observer = obs.createTmuxEventObserver({ onSessionCreated: async () => {} });
      const hook = createPaneMonitorHook({ sessionId: 'test-session', observer, journalRoot: '${journal_root}' });
      // Dispatch the pane-captured event through the observer's main fn
      await observer({ event: { type: 'pane-captured', sessionId: 'test-session', paneId: '%7', contentLength: 2048, timestamp: 1780434056789 } });
      await hook.__waitForPendingRetries?.();
      await hook.dispose();
      process.stdout.write('written=' + hook.counters.written);
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"written=1"* ]]
  # ... glob + jq assertions ...
}
```

```bash
# tests/scripts/tmux/56-session-persistence-kill-restart.bats:39-41 — real tmux spawn pattern
tmux new-session -d -s "$tmux_session" -c "$project" "sleep 600"
run tmux has-session -t "$tmux_session"
[ "$status" -eq 0 ]
```

### Reuse for P55 (criterion 1)
- **BATS slot 57** uses the P53 `setup()` + `tmux_node_eval` shape verbatim, but the body of the `@test` exercises a REAL tmux session (per D-55-05: real OS process survival). The `paneId` is discovered via `tmux list-panes -t <name> -F '#{pane_id}' | head -1` (not hard-coded `%7` like P53).
- **`createPaneMonitorHook` is invoked with `journalRoot: ${BATS_TEST_TMPDIR}/project/.hivemind/journal`** — same pattern as P53 line 23, but with `${BATS_TEST_TMPDIR}` prefix for per-test isolation (D-55-07).
- **The `__waitForPendingRetries?.()` drain** before assertions is the P53 D-53-05 backoff-drain pattern (line 28). The 100ms timing tolerance in D-55-08 covers any microtask scheduling jitter.
- **The P53 PaneCapturedEvent payload** (`{ type: 'pane-captured', sessionId, paneId, contentLength, timestamp }`) is the 5-field shape from `src/features/tmux/observers.ts:52-65`. P55 BATS slot 57 uses the same shape but with the live paneId discovered from `tmux list-panes`.
- **The 7-field journal entry** (`schemaVersion`, `eventType`, `sessionId`, `paneId`, `capturedAt`, `contentLength`, `contentPreview`) is asserted via the same `jq` chain as P53 lines 42-50. The P55 BATS adds ONE extra assertion: `paneId` matches the live `tmux list-panes` output (the E2E contract — proves the journal entry reflects the real OS pane, not a synthetic stub).
- **`teardown()` with `tmux kill-session -t <name> 2>/dev/null || true`** is the P54 BATS slot 56 pattern (lines 26-27) — defensive cleanup for failed tests.

---

## 2. BATS for orchestrator intervention (criterion 2) — closest analog: P51 `SessionManager.sendKeys` + tmux CLI live-key probe (NO existing BATS for `send-keys`)

**Decision:** P55 BATS scenario `tests/scripts/tmux/58-orchestrator-intervention.bats` is the **first in-tree BATS to exercise `adapter.sendKeys` end-to-end** (verified via `grep -r sendKeys tests/scripts/tmux/*.bats` returning 0 matches). The closest analog for the **structure** is `tests/scripts/tmux/56-session-persistence-kill-restart.bats:38-40` (spawn real tmux session, assert alive). The closest analog for the **`sendKeys` adapter method** is the `tmux-copilot` tool at `src/tools/tmux-copilot.ts:182-193` (the `send-keys` action calls `adapter.sendKeys(input.paneId, input.text, input.literal ?? false)` then returns `{ sent: true, paneId }`). The BATS does NOT exercise the tool directly (the tool has a permission gate at `src/tools/tmux-copilot.ts:158-163` that requires an orchestrator-tier context which BATS cannot provide) — it goes through the underlying `getSessionManagerAdapter()` from `src/features/tmux/types.ts:201-203`.

### Code (canonical analog — tmux-copilot sendKeys dispatch + adapter access)
```typescript
// src/tools/tmux-copilot.ts:182-193 — send-keys action with graceful failure
case "send-keys": {
  try {
    await adapter.sendKeys(input.paneId, input.text, input.literal ?? false)
    return renderToolResult({ sent: true, paneId: input.paneId })
  } catch (err) {
    return renderToolResult({
      sent: false,
      paneId: input.paneId,
      error: { message: err instanceof Error ? err.message : String(err) },
    })
  }
}
```

```typescript
// src/features/tmux/types.ts:151-162 — SessionManagerAdapter interface (6 methods)
export interface SessionManagerAdapter {
  onSessionCreated: (event: EnrichedSessionEvent) => Promise<void>;
  respawnIfKnown: (sessionId: string) => Promise<{ paneId: string } | null>;
  getMainPaneId: () => Promise<string | null>;
  sendKeys: (paneId: string, text: string, literal?: boolean) => Promise<void>;
  listPanes: (mainPaneId?: string) => Promise<PaneState[]>;
  createPaneGridPlanner: (debounceMs?: number) => PaneGridPlanner;
}
```

```typescript
// src/features/tmux/types.ts:201-203 — adapter bridge accessor
export function getSessionManagerAdapter(): SessionManagerAdapter | null {
  return currentAdapter
}
```

### Reuse for P55 (criterion 2)
- **BATS slot 58 spawns a tmux session with `'cat'` as the foreground process** (per D-55-02 + 55-SPEC.md REQ-55-02 step 1) — `cat` reads from stdin, so any text sent via `sendKeys` is rendered into the pane's capture-pane buffer. `tmux new-session -d -s <name> -c <project> 'cat'` is the canonical "interactive stdin reader" pattern.
- **The BATS calls `createTmuxIntegrationIfSupported({projectDirectory, enableTmux: true})` from `dist/features/tmux/integration.js`** to wire the real `TmuxMultiplexer` + `SessionManager` and publish the adapter via `setSessionManagerAdapter` (the P51 `src/features/tmux/integration.ts:194-261` factory). After the factory returns, `getSessionManagerAdapter()` returns the live adapter (BATS asserts `adapter !== null`).
- **The BATS invokes `adapter.sendKeys(paneId, 'E2E-INTERVENTION-PROBE-1780434056', false)`** with a 31-character probe string. The 200ms timing tolerance (D-55-08) absorbs the tmux keystroke-to-buffer pipeline (the `sendKeys` call returns immediately; the keystrokes are buffered by tmux server; the `cat` process reads them; the buffer is updated).
- **The BATS asserts via `tmux capture-pane -t <paneId> -p | grep -c 'E2E-INTERVENTION-PROBE-1780434056' >= 1`** — the `capture-pane -p` flag prints to stdout (no internal tmux buffer drain), and the `grep -c` count is `≥ 1` (the probe appears in the rendered output, proving the keystrokes were delivered to the live OS process and rendered on the pane).
- **Bypassing the permission gate**: the BATS exercises `adapter.sendKeys` directly (NOT the `tmux-copilot` tool), so the orchestrator-tier gate at `src/tools/tmux-copilot.ts:158-163` is NOT in the test path. The BATS simulates the "permission granted" path by calling the underlying adapter (the actual delivery mechanism).
- **`teardown()` cleans up the tmux session** (defensive `tmux kill-session -t <name> 2>/dev/null || true`).

---

## 3. BATS for session persistence (criterion 3) — closest analog: `tests/scripts/tmux/56-session-persistence-kill-restart.bats` (P54)

**Decision:** P55 BATS scenario `tests/scripts/tmux/59-session-persistence-restart.bats` is a **stricter E2E** version of P54 BATS slot 56 — it combines the persistence module with a **kill-restart of the harness process boundary**. The structure (1 file, 2 `@test` blocks per D-55-08/CONTEXT §"the agent's Discretion") follows P54's single-scenario pattern (1 file = 1 scenario per file in P54, but P55 slot 59 explicitly mandates 2 scenarios per the SPEC). Each scenario uses a `kill -9 <pid>` to simulate a harness crash, then a fresh `tmux_node_eval` to simulate a harness restart.

### Code (canonical analog — P54 kill-restart BATS)
```bash
# tests/scripts/tmux/56-session-persistence-kill-restart.bats:18-27 — setup/teardown
load "helpers"

setup() {
  tmux_bats_require_dist
  tmux_bats_make_project
}

teardown() {
  # Defensive cleanup — kill any tmux session we created during the test.
  tmux kill-session -t "p54-kill-restart-$$" 2>/dev/null || true
}
```

```bash
# tests/scripts/tmux/56-session-persistence-kill-restart.bats:39-101 — kill-restart body
tmux new-session -d -s "$tmux_session" -c "$project" "sleep 600"
run tmux has-session -t "$tmux_session"
[ "$status" -eq 0 ]

run tmux_node_eval "
  import('${TMUX_BATS_ROOT}/dist/features/tmux/persistence.js').then(async (mod) => {
    const p = mod.createSessionPersistence({ projectDirectory: '${project}' });
    await p.persist({
      schemaVersion: 1,
      sessionId: '${sid}',
      agent: 'survive-agent',
      delegationId: 'survive-delegation',
      directory: '${project}',
      paneId: '%1',
      spawnTime: Date.now(),
      state: 'ready',
      lastTransitionAt: Date.now(),
    });
    process.stdout.write('persisted=true');
  });
"
[ "$status" -eq 0 ]
[[ "$output" == *"persisted=true"* ]]

# Assert 9-field shape + schemaVersion: 1 numeric (D-54-03)
[ -f "$state_file" ]
run jq -r .state "$state_file"
[ "$status" -eq 0 ]
[ "$output" = "ready" ]
run jq -r 'keys | length' "$state_file"
[ "$status" -eq 0 ]
[ "$output" = "9" ]
run jq -r .schemaVersion "$state_file"
[ "$status" -eq 0 ]
[ "$output" = "1" ]   # numeric literal, NOT "1.0" (D-54-03)
```

### Reuse for P55 (criterion 3)
- **BATS slot 59 has TWO `@test` blocks** (per D-55-08 / CONTEXT §"the agent's Discretion" — "BATS slot 59's `detached-state` scenario requires manual `state: "detached"` injection"):
  - **Scenario 1 (`ready-state kill`)**: write a `state: "ready"` record (P54 BATS slot 56 verbatim), simulate a harness crash, assert `restoreAll()` does NOT return the record (state ∉ {paused, detached} per D-54-06). This proves the alive-filter contract.
  - **Scenario 2 (`detached-state restore`)**: write a `state: "detached"` record, simulate a harness crash, assert `restoreAll()` returns the record AND `tmux has-session` returns 0. This proves the seed criterion 3 contract — the session survives parent restart in a restorable state.
- **The `kill -9 <harness-node-pid>` cycle**: P55 BATS slot 59 captures the PID of the `tmux_node_eval` process that wrote the record, then runs `kill -9 <pid>` to simulate a crash. The fresh-process restart is the next `tmux_node_eval` invocation (BATS itself orchestrates this as a separate `run` block).
- **The 9-field `PersistedSession` shape** (per D-54-03) is asserted via the same `jq` chain as P54 BATS slot 56 lines 68-77 (`state`, `keys | length`, `schemaVersion`). P55 BATS slot 59 also asserts `tmux has-session` after the kill — the SEED criterion 3 contract that P54 did NOT test (P54 only tested the file-on-disk contract; P55 tests the OS-process survival contract).
- **`tmux_node_eval` is the cross-process state channel**: each call is a fresh OS process, so the persistence file is the ONLY way to bridge the kill-restart gap. P55 BATS slot 59 demonstrates this by reading the file in a NEW process after killing the OLD process.
- **The 15-second timing tolerance** (D-55-08) covers the longer `kill -9` cycle + fresh-process restart (vs. 10 seconds for the other 3 BATS).

---

## 4. BATS for visual dependency graph (criterion 4) — closest analog: P51 `grid-planner.test.ts` (vitest) + tmux CLI live-split pattern

**Decision:** P55 BATS scenario `tests/scripts/tmux/60-visual-dependency-graph.bats` is the **first in-tree BATS to exercise `PaneGridPlanner.computeSplitSequence`** (verified via `grep -r "computeSplitSequence\|PaneGridPlanner" tests/scripts/tmux/*.bats` returning 0 matches). The closest analog for the **planner logic** is the P51 vitest file `tests/lib/tmux/grid-planner.test.ts` (P51 + P54 vitest coverage). The closest analog for the **tmux split-window pattern** is `tests/scripts/tmux/04-grid-layout.bats:17-30` (port read/migration test — uses `tmux_bats_make_project` + `tmux_node_eval` for the dist-import pattern). The P55 BATS combines BOTH: vitest-style assertion of the SplitCommand sequence + real `tmux split-window` execution to verify the layout produces a coherent 5-pane tmux session.

### Code (canonical analog — P51 PaneGridPlanner + SplitCommand shape)
```typescript
// src/features/tmux/grid-planner.ts:70-89 — computeSplitSequence DFS preorder
computeSplitSequence(root: PaneTreeNode): SplitCommand[] {
  const out: SplitCommand[] = [];
  if (!root.children || root.children.length === 0) return out;

  const visit = (node: PaneTreeNode, parentId: string, depth: number): void => {
    const direction: SplitDirection = depth === 1 ? "h" : "v";
    out.push({ parentPaneId: parentId, direction });
    if (node.children) {
      for (const child of node.children) {
        visit(child, node.id, depth + 1);
      }
    }
  };

  for (const child of root.children) {
    visit(child, root.id, 1);
  }

  return out;
}
```

```typescript
// src/features/tmux/types.ts:40-48 (referenced via grid-planner.ts:25-30) — types
export interface PaneTreeNode {
  id: string;
  children?: PaneTreeNode[];
}

export interface SplitCommand {
  parentPaneId: string;
  direction: SplitDirection;  // "h" | "v"
}
```

```bash
# tests/scripts/tmux/04-grid-layout.bats:18-30 — tmux_bats_node_eval pattern
run tmux_node_eval "
  const m = await import('${TMUX_BATS_DIST}/integration.js');
  const result = await m.readOrMigratePort('${project}');
  process.stdout.write(String(result));
"
[ "$status" -eq 0 ]
```

### Reuse for P55 (criterion 4)
- **BATS slot 60 constructs the canonical P51 5-node delegation tree**: `root → [a → [a1, a2], b]`. Encoded as `{ id: "root", children: [{ id: "a", children: [{ id: "a1" }, { id: "a2" }] }, { id: "b" }] }`. The DFS preorder traversal produces 4 SplitCommands (one per non-root node).
- **The BATS calls `new PaneGridPlanner(0).computeSplitSequence(tree)`** with `debounceMs: 0` to bypass the 500ms debounce — we want the immediate return (per P51 D-51-01, the debounce is a coalescing mechanism; for tests, `0` is the immediate-mode escape hatch). The 4 expected SplitCommands are: `{ parentPaneId: "root", direction: "h" }` (a), `{ parentPaneId: "a", direction: "v" }` (a1), `{ parentPaneId: "a", direction: "v" }` (a2), `{ parentPaneId: "root", direction: "h" }` (b).
- **End-to-end tmux integration**: the BATS spawns a real tmux session (`tmux new-session -d -s <name> -c <project>`) and applies each SplitCommand via `tmux split-window -t <parentPaneId> -d -<direction>`. After all 4 splits, the BATS asserts `tmux list-panes -t <name> | wc -l = 5` (5 panes total = 1 root + 4 splits).
- **Parent-child mapping verification**: the BATS uses `tmux list-panes -t <name> -F '#{pane_id}:#{pane_parent}'` and compares the actual parent mapping to the expected DFS layout. The expected mapping is: a1 parent = a, a2 parent = a, b parent = root (the parent references are the actual tmux pane IDs, not the logical node IDs — the BATS must resolve the logical → tmux mapping).
- **No timing tolerance** (D-55-08): `computeSplitSequence` is a pure function (no I/O, no async, no scheduling). The `tmux split-window` calls complete synchronously.
- **`teardown()` cleans up the tmux session** (`tmux kill-session -t <name> 2>/dev/null || true`).

---

## 5. helpers.bash extension — `tmux_bats_require_dist` adds 2 new dist checks (D-55-06 additive)

**Decision:** P55 extends `tests/scripts/tmux/helpers.bash:11-24` with **2 new `[[ ! -f ... ]]` checks** for `dist/features/tmux/grid-planner.js` and `dist/tools/tmux-copilot.js` — the first 2 `dist/` artifacts P55 BATS files import. The extension is **additive only** (no removal of P53/P54 checks) per D-55-06. After P55, `tmux_bats_require_dist` will have 6 checks (4 existing + 2 new).

### Code (current state — P53+P54 checks)
```bash
# tests/scripts/tmux/helpers.bash:11-24
tmux_bats_require_dist() {
  if [[ ! -f "${TMUX_BATS_DIST}/integration.js" ]]; then
    skip "dist/features/tmux/integration.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_DIST}/types.js" ]]; then
    skip "dist/features/tmux/types.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js" ]]; then
    skip "dist/hooks/pane-monitor.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_DIST}/persistence.js" ]]; then
    skip "dist/features/tmux/persistence.js missing — run 'npx tsc' first"
  fi
}
```

### Reuse for P55
- **2 new `if [[ ! -f ... ]] then skip` blocks** added at the END of the function (after the persistence check) — preserves the existing 4 checks byte-identically (no removal, no reordering).
- **The new checks are**:
  ```bash
  if [[ ! -f "${TMUX_BATS_DIST}/grid-planner.js" ]]; then
    skip "dist/features/tmux/grid-planner.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js" ]]; then
    skip "dist/tools/tmux-copilot.js missing — run 'npx tsc' first"
  fi
  ```
- **The `TMUX_BATS_DIST` variable** (`${TMUX_BATS_ROOT}/dist/features/tmux`) is reused for the grid-planner check (it's a `features/tmux/` artifact). The `TMUX_BATS_ROOT` absolute path is used for the tmux-copilot check (it's a `tools/` artifact, not under `features/tmux/`).
- **No new helper functions** (e.g., `tmux_bats_require_persistence_dist`) are added — D-55-06 mandates additive extension of the existing single helper. The single-call setup pattern is preserved.
- **The `skip` message format** is consistent with the existing 4 checks: `"dist/<path> missing — run 'npx tsc' first"`. The `npx tsc` is the canonical build command (per `package.json:scripts.build`).

---

## 6. Manual L2 evidence format — `.planning/phases/55-e2e-uat-against-seed-success-criteria/55-E2E-UAT-2026-06-02.md`

**Decision:** P55's manual L2 evidence is a **text-described** (ASCII-art / structured markdown) report, NOT binary PNG screenshots (D-55-03 + R-P50-03 spirit). The report is **1 section per criterion** (4 sections total) with **(a) L1 BATS pass output verbatim, (b) L2 text-described screenshot or journal excerpt, (c) verdict line `PASS` or `FAIL`** (D-55-09). The final section is the **GATE evaluation block** with the `PASS_COUNT` computation and the resulting decision (advance / retry / hard fail).

### Code (canonical analog — no in-tree precedent; closest is P49 close-pivot evidence model)
The P49 close-pivot `49-CLOSE-PIVOT-2026-06-02.md` (referenced in 55-CONTEXT.md canonical_refs §49) established the L1 + L2 + verdict evidence model for the 4 seed success criteria. P55 follows the same model.

### Reuse for P55
- **4 sections, one per criterion**:
  - **Section 1: Live Pane Monitoring (criterion 1)** — L1 = BATS slot 57 pass output (TAP format); L2 = journal entry excerpt (the 7-field JSON for a real `pane-captured` event, formatted via `jq` for readability); verdict: `criterion 1: PASS|FAIL`.
  - **Section 2: Orchestrator Intervention (criterion 2)** — L1 = BATS slot 58 pass output; L2 = `tmux capture-pane` output excerpt (showing the `E2E-INTERVENTION-PROBE-1780434056` probe string in the rendered buffer); verdict: `criterion 2: PASS|FAIL`.
  - **Section 3: Session Persistence (criterion 3)** — L1 = BATS slot 59 pass output (2 scenarios); L2 = persistence file excerpt (the 9-field JSON for a `state: "detached"` record) + `tmux has-session` confirmation; verdict: `criterion 3: PASS|FAIL`.
  - **Section 4: Visual Dependency Graph (criterion 4)** — L1 = BATS slot 60 pass output; L2 = text-described tmux grid (ASCII-art of the 5-pane DFS layout, e.g., a tree-style or table-style representation of the `root → [a → [a1, a2], b]` topology); verdict: `criterion 4: PASS|FAIL`.
- **GATE section** at the end:
  ```markdown
  ## GATE Evaluation

  PASS_COUNT = count(PASS verdicts across 4 criteria) = <N>

  | PASS_COUNT | Decision |
  |------------|----------|
  | >= 3 | seed advances to `germinated`, ROADMAP proceeds to P56+ |
  | == 2 | P56 retry-phase planning triggered (7-day grace per close-pivot §7) |
  | <= 1 | hard fail, no grace period, P57 escalates to user |

  **Result:** <advance | retry | hard fail>
  ```
- **The text-described screenshot for criterion 4** is a structured markdown table OR ASCII-art:
  ```
  +---+---+---+
  | a1| a | b |
  +---+---+---+
  | (root)     |
  +-----------+
  ```
  OR a tree-style:
  ```
  root
  ├── a
  │   ├── a1
  │   └── a2
  └── b
  ```
  Both satisfy the L2 evidence requirement (D-55-09 / CONTEXT §"the agent's Discretion" §k).
- **The journal entry excerpt for criterion 1** is a `jq`-formatted print of the on-disk JSON:
  ```json
  {
    "schemaVersion": "1.0",
    "eventType": "pane-captured",
    "sessionId": "test-session",
    "paneId": "%3",
    "capturedAt": "2026-06-02T19:00:56.789Z",
    "contentLength": 2048,
    "contentPreview": "..."
  }
  ```
- **No binary files** (no PNG screenshots, no PDF attachments). The report is **commit-friendly** (text-only, git-trackable, reviewable in the terminal).

---

## 7. GATE evaluation logic — 3/4 PASS = advance, 2/4 = P56 retry, 1/4 = hard fail (D-55-04)

**Decision:** P55's GATE logic is **binary per criterion** (PASS or FAIL) with a **counted aggregation** (`PASS_COUNT = count(PASS)`) and a **3-tier decision table** (advance / retry / hard fail). The logic is evaluated by a **human reviewer** reading the UAT report (D-55-09 / CONTEXT §"the agent's Discretion" §"Automated gate evaluation" deferred). The 7-day grace period (close-pivot §7) applies to the 2/4 case only (operational — how long the user has to review + decide), not to the GATE logic itself.

### Code (no in-tree precedent — GATE logic is P55's invention; closest analog is close-pivot §7 mitigation table)
```markdown
# From .planning/phases/49-close-tmux-end-to-end-gap-register-tmux-copilot-in-src-plugi/49-CLOSE-PIVOT-2026-06-02.md §7
# (referenced in 55-CONTEXT.md canonical_refs §49)
#
# Mitigation: P55 risks over-promising: 4 seed success criteria in one phase is
# ambitious. Mitigation: each criterion becomes its own BATS scenario; partial
# passes still advance ROADMAP.
```

### Reuse for P55
- **3-tier decision table** (D-55-04):
  - `PASS_COUNT >= 3` → **advance**: seed advances from `planted` to `germinated`, ROADMAP proceeds to P56+. The 5xx BATS slots can be cleared (the tmux visual orchestration layer is verified working).
  - `PASS_COUNT == 2` → **retry**: P56 retry-phase planning is triggered. The 7-day grace period (close-pivot §7) gives the user 1 week to decide whether to fix the 2 failing criteria or accept the partial pass. The 2 failing criteria MUST be documented in `55-CLOSE-PARTIAL.md` (CONTEXT §"deferred" §"P56 retry phase").
  - `PASS_COUNT <= 1` → **hard fail**: P57 escalation to user. The 3 failing criteria indicate a regression in the in-tree synthesis (P51–P54 each have their own unit tests; if 3/4 integration BATS fail, the unit tests are passing but the integration is broken — a fundamentally different class of problem). The architectural regression MUST be documented in `55-CLOSE-FAILED.md` (CONTEXT §"deferred" §"P57 escalation").
- **The GATE evaluation is human-driven** (D-55-09): a human reviewer reads the UAT report, computes `PASS_COUNT`, and applies the decision table. An automated gate evaluator (e.g., `bin/uat-gate.cjs`) is DEFERRED (CONTEXT §"deferred" §"Automated gate evaluation").
- **The 4 BATS verdicts feed into the GATE**: each `@test` block in each BATS file has a `bats exit code` (0 = pass, non-zero = fail). The GATE is the **per-criterion aggregation** of the BATS verdicts: criterion 1 = BATS slot 57 (1 scenario → 1 verdict), criterion 2 = BATS slot 58 (1 scenario → 1 verdict), criterion 3 = BATS slot 59 (2 scenarios → 2 sub-verdicts, aggregated to 1 per-criterion verdict via AND), criterion 4 = BATS slot 60 (1 scenario → 1 verdict).
- **The 3 atomic commits** are EXECUTE-side concerns; the GATE evaluation is a post-EXECUTE governance decision. The GATE verdict is recorded in the UAT report (`55-E2E-UAT-2026-06-02.md`) and propagated to ROADMAP/STATE.md in a separate commit (per CONTEXT D-55-11: "3 atomic commits: (1) BATS + helpers.bash, (2) UAT report + L2 evidence, (3) ROADMAP/STATE advance").

---

## Constraints for planner

The planner MUST respect the following locked invariants when producing `55-01-PLAN.md`:

1. **Q6 canonical state root + R-P50-03 spirit** (CONTEXT.md D-55-10) — `.hivemind/journal/<sid>/<ISO-ts>-pane.json` (criterion 1) and `.hivemind/state/tmux-sessions/<sid>.json` (criterion 3) are the on-disk paths. The `.gitignore` already covers `.hivemind/state/`; P55 BATS uses `BATS_TEST_TMPDIR` for all `.hivemind/` writes — no project-tree writes, no committed state. EXECUTE must NOT mutate `.hivemind/session-tracker/*` (R-P50-03 strict).

2. **27-tool-key invariant (D-55-12)** — P55 does NOT add any new tool registrations. The 4 BATS files do not register new tools, do not import new tool modules, do not extend the `SessionManagerAdapter` interface. The `tmux-copilot` tool (P43 + P49 widening) is exercised by BATS slot 58, but no new action is added to its 4-action discriminated union.

3. **P20 invariant — no new `package.json` deps** (CONTEXT.md D-55-11 + AGENTS.md) — P55 is verification-only. The 4 BATS files use only `node:fs/promises` (via the in-tree modules), `node:child_process` (via `tmux_node_eval`), and `bash` builtins. No new `node_modules` entries.

4. **D-04 silent-fallback (D-55-10)** — P55 BATS does NOT test the silent-fallback contract directly (P51–P54 unit tests do that). P55 BATS exercises the happy path only — a real OS tmux server, a real harness binary, a real `node` process. The `[[ "$status" -eq 0 ]]` assertions in the BATS verify the happy path; the silent-fallback paths are tested by the P51–P54 vitest suites.

5. **BATS real-OS-process survival (D-55-05)** — all 4 BATS use real `tmux` binary and real `node` process — no mocks. Per P54 D-54-12 precedent (the kill-restart test uses real OS process survival, not stubbed `fs.writeFile` / `fs.readdir`).

6. **`schemaVersion: 1` numeric literal (D-55-06 / D-53-13 fix)** — the persistence BATS (slot 59) asserts `jq -r .schemaVersion <file> = "1"` (number, NOT `"1.0"` string). The P53 pane-monitor BATS (slot 57) uses `schemaVersion: "1.0"` string (per P53 D-53-13 — the journal entry uses string `"1.0"` while the persistence record uses numeric `1`; P55 preserves the per-module schema version shape).

7. **Atomic commit (CONTEXT.md D-55-11 + AGENTS.md)** — EXECUTE commit must be atomic (one logical change = one commit per the project-wide commit-discipline rule). P55 has **3 atomic commits**:
   - **Commit 1**: BATS + helpers.bash extension (4 BATS files + `tmux_bats_require_dist` extension).
   - **Commit 2**: UAT report + L2 evidence (`55-E2E-UAT-2026-06-02.md`).
   - **Commit 3**: ROADMAP/STATE advance (P55 marked `[x]`, P56+ phases added if gate passes).

8. **BATS timing tolerance (D-55-08)** — ±100ms for criterion 1 (`__waitForPendingRetries` drain); ±200ms for criterion 2 (tmux keystroke flush + capture-pane race); no tolerance for criterion 3 (file must exist exactly when written) and criterion 4 (SplitCommand sequence is deterministic).

9. **BATS slot reservation (D-55-01)** — slots 57, 58, 59, 60 follow the P52/P53/P54 `5X-tmux-...` convention. The numeric ordering matches the seed criteria's natural order (live → intervention → persistence → visual graph). P55 does NOT pre-reserve beyond slot 60.

10. **SC-isolation (D-55-10)** — no `SC-*` work referenced. The 4 BATS files import only from `dist/features/tmux/`, `dist/hooks/`, and `dist/tools/` — no `sidecar/` references, no `.hivemind/session-tracker/*` reads or writes, no `compositions/` cross-references.

11. **No new `src/**` files (D-55 + P20 invariant)** — P55 is verification-only. The 4 BATS files + `helpers.bash` extension are the ONLY file changes. The BATS files are `tests/**` additions (NOT `src/**` mutations), so the CP-PTY-00 docs/spec-only phase can land later without conflict (per `.planning/AGENTS.md` §7).

12. **P55 PLAN scope (CONTEXT.md "in scope")** — the 4 BATS files + helpers.bash extension + UAT report are the EXECUTE deliverables. The 3 atomic commits are pre-scoped. The implementer follows the P54 PLAN format (`<read_first>`, `<action>`, `<verify>`, `<done>` blocks) — see `54-01-PLAN.md:1-1015` for the canonical structure.

13. **GATE verdict propagation (D-55-04)** — after the 4 BATS run + L1 evidence capture, the GATE verdict is recorded in `55-E2E-UAT-2026-06-02.md` AND propagated to ROADMAP.md (P55 line marked `[x]`) + STATE.md (P55 status set to `✅ COMPLETE` / `⚠️ PARTIAL` / `❌ FAILED`). The propagation commit is the 3rd atomic commit.

---

*Phase: 55-e2e-uat-against-seed-success-criteria*
*Checkpoint 7 (PATTERNS) complete — 7 patterns mapped, ready for Checkpoint 8 (PLANNING)*
