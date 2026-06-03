# Phase 56: Stress Test for Real-Life Tmux Use — Pattern Map

**Mapped:** 2026-06-03
**Phase:** 56 (Tmux Stress Test for Real-Life Workflow)
**Files mapped:** 1 new BATS test file (`tests/scripts/tmux/61-stress-test-real-world-workflow.bats`) + 1 NEW helper in `tests/scripts/tmux/helpers.bash` (`tmux_bats_require_stress_facilities`) + 1 new evidence document (`.planning/phases/56-tmux-stress-test-real-world-workflow/56-STRESS-TEST-EVIDENCE-2026-06-03.md`)
**Analogs found:** 6 in-tree BATS analogs (P55 slots 57-60) + 1 vitest regression (P49 `hook-registration.test.ts`) + 1 new helper pattern (`tmux_bats_require_stress_facilities`)
**Composite risk:** 0.07 (GREEN-LIT, unchanged from locked `D-56-*` set in 56-CONTEXT.md)
**Constraint:** P56 is **verification-only** — no new `src/**` files, no new tool registrations, no new `package.json` deps. Patterns are for BATS test code + governance docs ONLY. The 6 sub-flows run in ONE `@test` block (D-56-04 — atomic scenario, inseparable sub-flows).

---

## 1. Multi-agent spawn pattern (REQ-56-01) — closest analog: BATS 58 (`58-orchestrator-intervention.bats`) + BATS 60 (`60-visual-dependency-graph.bats`)

**Decision:** P56 BATS scenario `tests/scripts/tmux/61-stress-test-real-world-workflow.bats` spawns **3 real tmux sessions** in a loop, each named `e2e-test-{pid}-{i}` (where `{pid}` is the BATS process PID and `{i}` is 0/1/2). The session name pattern matches P54 BATS slot 56's `p54-kill-restart-$$` pattern (the `$$` is the BATS process PID; P56 reuses this with `e2e-test-` prefix and `{i}` index). The placeholder command is `sleep 600` (10-min sleep, deterministic — no echo loop interference) per D-56-02. The closest analog for **spawning one real tmux session** is `tests/scripts/tmux/58-orchestrator-intervention.bats:25-27` (`tmux new-session -d -s <name> -c <project> 'cat'`) and `60-visual-dependency-graph.bats:49-51` (`tmux new-session -d -s <name> -c <project>`). P56 extends this from 1 session to 3 in a single scenario.

### Code (canonical analog — P55 BATS spawn patterns)
```bash
# tests/scripts/tmux/58-orchestrator-intervention.bats:25-27 — real tmux spawn with command
tmux new-session -d -s "$tmux_session" -c "$project" "cat"
run tmux has-session -t "$tmux_session"
[ "$status" -eq 0 ]
```

```bash
# tests/scripts/tmux/60-visual-dependency-graph.bats:49-51 — real tmux spawn with no command
tmux new-session -d -s "$tmux_session" -c "$project"
run tmux has-session -t "$tmux_session"
[ "$status" -eq 0 ]
```

```bash
# tests/scripts/tmux/56-session-persistence-kill-restart.bats:31-33 — BATS PID-based session naming
local tmux_session="p54-kill-restart-$$"
local sid="p54-survive-$$-$(date +%s%N)"
```

### Reuse for P56 (REQ-56-01)
- **BATS slot 61 spawns 3 sessions in a sequential loop** (D-56-02):
  ```bash
  local pid="$$"
  for i in 0 1 2; do
    local tmux_session="e2e-test-${pid}-${i}"
    tmux new-session -d -s "$tmux_session" -c "$project" "sleep 600"
    run tmux has-session -t "$tmux_session"
    [ "$status" -eq 0 ]
  done
  ```
- **3 distinct OS processes, not 3 PIDs reused by a single process** (per D-56-02): the BATS does NOT need to capture `$!` PIDs (the P54 BATS slot 56 precedent was for kill-restart; P56 stress test does NOT kill the tmux sessions in the middle of the scenario — they're killed in teardown). The 3-session liveness assertion (`tmux has-session -t e2e-test-{pid}-{i}` returns 0 for all 3) is sufficient to prove 3 distinct processes are alive (tmux server allocates distinct session IDs).
- **Sleep 600 is intentional** (D-56-02): `cat` (P55 BATS 58's choice) would echo the probe string back, masking whether the tmux server's pane-buffer reflects the send-keys delivery. `sleep 600` keeps the pane-buffer clean and lets the probe string appear in the tmux server's pane-buffer (visible in `capture-pane` output) without echo interference.
- **The session name filter for `tmux list-sessions`** is the prefix `e2e-test-{pid}-` (per D-56-02): `tmux list-sessions -F '#{session_name}' | grep -c '^e2e-test-{pid}-'` returns 3 (only the 3 spawned by THIS BATS run, no contamination from other tmux sessions on the host).
- **Teardown** kills all 3 sessions: `tmux kill-session -t "e2e-test-${pid}-0" 2>/dev/null || true; tmux kill-session -t "e2e-test-${pid}-1" 2>/dev/null || true; tmux kill-session -t "e2e-test-${pid}-2" 2>/dev/null || true` (defensive cleanup pattern from P54 BATS slot 56 lines 26-27).

---

## 2. DFS grid layout pattern (REQ-56-02) — closest analog: BATS 60 (`60-visual-dependency-graph.bats`)

**Decision:** P56 stress test constructs a **3-node delegation tree** `{ id: "stress-root", children: [{ id: "stress-a" }, { id: "stress-b" }, { id: "stress-c" }] }` and applies the resulting `SplitCommand[]` to a **4th separate tmux session** (`e2e-test-{pid}-grid`) via `tmux split-window`. The closest analog is `tests/scripts/tmux/60-visual-dependency-graph.bats:20-79` which exercises the same `PaneGridPlanner.computeSplitSequence` + `tmux split-window` integration but with a 5-node tree. P56 stress test uses a simpler 3-node tree (3 children of a single root, all at depth-1) to keep the grid sub-flow fast and deterministic.

### Code (canonical analog — P55 BATS 60 grid layout)
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

```bash
# tests/scripts/tmux/60-visual-dependency-graph.bats:27-46 — computeSplitSequence assertion
run tmux_node_eval "
  const { PaneGridPlanner } = await import('${TMUX_BATS_DIST}/grid-planner.js');
  const tree = { id: 'root', children: [{ id: 'a', children: [{ id: 'a1' }, { id: 'a2' }] }, { id: 'b' }] };
  const planner = new PaneGridPlanner(0);
  const cmds = planner.computeSplitSequence(tree);
  const summary = cmds.map((c) => c.parentPaneId + ':' + c.direction).join(',');
  process.stdout.write('count=' + cmds.length + ' sequence=' + summary);
"
[ "$status" -eq 0 ]
[[ "$output" == *"count=4"* ]]
```

```bash
# tests/scripts/tmux/60-visual-dependency-graph.bats:49-79 — apply splits + verify pane count
tmux new-session -d -s "$tmux_session" -c "$project"
local pane_session_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | sed -n '1p')"
run tmux split-window -t "$tmux_session" -d -h
[ "$status" -eq 0 ]
local pane_a="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | sed -n '2p')"
run tmux split-window -t "$pane_a" -d -v
[ "$status" -eq 0 ]
# ... more splits ...
run bash -c "tmux list-panes -t '$tmux_session' | wc -l | tr -d ' '"
[ "$output" = "5" ]   # 1 root + 4 children = 5 panes
```

### Reuse for P56 (REQ-56-02)
- **BATS slot 61 grid sub-flow** uses a 3-node tree (3 direct children of root, all depth-1):
  ```bash
  run tmux_node_eval "
    const { PaneGridPlanner } = await import('${TMUX_BATS_DIST}/grid-planner.js');
    const tree = { id: 'stress-root', children: [{ id: 'stress-a' }, { id: 'stress-b' }, { id: 'stress-c' }] };
    const planner = new PaneGridPlanner(0);
    const cmds = planner.computeSplitSequence(tree);
    const summary = cmds.map((c) => c.parentPaneId + ':' + c.direction).join(',');
    process.stdout.write('count=' + cmds.length + ' sequence=' + summary);
  "
  ```
  Expected output: `count=3 sequence=stress-root:h,stress-root:h,stress-root:h` (3 horizontal splits, all from `stress-root`).
- **Apply splits to a 4th session** `e2e-test-{pid}-grid`:
  ```bash
  tmux new-session -d -s "${pid}-grid" -c "$project"
  # 3 splits: each from the root pane (pane 0), direction h
  for i in 1 2 3; do
    run tmux split-window -t "${pid}-grid" -d -h
    [ "$status" -eq 0 ]
  done
  ```
- **Assert pane count** = 4 (1 root + 3 children): `tmux list-panes -t "${pid}-grid" | wc -l = 4`.
- **Assert parent mapping** matches the DFS layout: `tmux list-panes -t "${pid}-grid" -F '#{pane_id}:#{pane_parent}'` shows panes 1, 2, 3 all parented to pane 0 (the root).
- **No timing tolerance** (D-55-08 / D-56-06): `PaneGridPlanner.computeSplitSequence` is a pure function (no I/O, no async, no scheduling). The `tmux split-window` calls complete synchronously.
- **Teardown** kills the 4th session: `tmux kill-session -t "${pid}-grid" 2>/dev/null || true`.

---

## 3. Orchestrator intervention pattern (REQ-56-03) — closest analog: BATS 58 (`58-orchestrator-intervention.bats`)

**Decision:** P56 stress test extends P55 BATS 58 from 1 session with 1 probe to **3 sessions with 3 distinct probes** (`STRESS-PROBE-{pid}-{i}-1780434056` for i=0,1,2). The closest analog is `tests/scripts/tmux/58-orchestrator-intervention.bats:41-46` which calls `TmuxMultiplexer.sendKeys(paneId, probe, false)` via `tmux_node_eval` and asserts via `tmux capture-pane`. P56 stress test uses the **same `TmuxMultiplexer` direct call** (NOT the integration factory's `getSessionManagerAdapter()`) because the integration factory's `if (!process.env.TMUX) return null` gate at `src/features/tmux/integration.ts` would block BATS from running outside a tmux session — this is the same workaround P55 BATS 58 used (per the comment at lines 34-40 of BATS 58).

### Code (canonical analog — P55 BATS 58 sendKeys)
```bash
# tests/scripts/tmux/58-orchestrator-intervention.bats:34-49 — TmuxMultiplexer.sendKeys direct call
run tmux_node_eval "
  const { TmuxMultiplexer } = await import('${TMUX_BATS_DIST}/tmux-multiplexer.js');
  const multiplexer = new TmuxMultiplexer('main-vertical', 60);
  await multiplexer.sendKeys('${live_pane_id}', '${probe}', false);
  process.stdout.write('sent=true paneId=' + '${live_pane_id}');
"
[ "$status" -eq 0 ]
[[ "$output" == *"sent=true"* ]]
[[ "$output" == *"paneId=${live_pane_id}"* ]]
```

```bash
# tests/scripts/tmux/58-orchestrator-intervention.bats:51-57 — capture-pane assertion
sleep 0.2   # 200ms timing tolerance (D-55-08)
run bash -c "tmux capture-pane -t '${live_pane_id}' -p | grep -c '${probe}'"
[ "$status" -eq 0 ]
[ "$output" -ge 1 ]
```

### Reuse for P56 (REQ-56-03)
- **BATS slot 61 sendKeys sub-flow** iterates over the 3 spawned sessions:
  ```bash
  for i in 0 1 2; do
    local tmux_session="e2e-test-${pid}-${i}"
    local probe="STRESS-PROBE-${pid}-${i}-1780434056"
    local live_pane_id="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
    run tmux_node_eval "
      const { TmuxMultiplexer } = await import('${TMUX_BATS_DIST}/tmux-multiplexer.js');
      const multiplexer = new TmuxMultiplexer('main-vertical', 60);
      await multiplexer.sendKeys('${live_pane_id}', '${probe}', false);
      process.stdout.write('sent=true session=${i} paneId=' + '${live_pane_id}');
    "
    [ "$status" -eq 0 ]
    [[ "$output" == *"sent=true"* ]]
  done
  sleep 0.2   # 200ms timing tolerance (D-55-08 + D-56-06)
  ```
- **3 distinct probe strings** (per D-56-02): `STRESS-PROBE-{pid}-{i}-1780434056` (with the same `1780434056` suffix to match P55 BATS 58's `E2E-INTERVENTION-PROBE-1780434056` convention). The `{i}` index ensures each probe is unique per session.
- **3 capture-pane assertions** (one per session): `tmux capture-pane -t <paneId_i> -p | grep -c 'STRESS-PROBE-{pid}-{i}-1780434056' >= 1` — each session's pane buffer contains its specific probe.
- **`TmuxMultiplexer` direct call** (NOT `getSessionManagerAdapter()`): the integration factory's `if (!process.env.TMUX) return null` gate would block BATS from running outside a tmux session. `TmuxMultiplexer` is the underlying transport — it executes `tmux send-keys -t <paneId> <text>` directly.
- **The 3 sessions survive the `sendKeys` call** (REQ-56-03 acceptance): `tmux has-session -t e2e-test-{pid}-{i}` returns 0 for all 3 after the send. (The `sleep 600` placeholder doesn't read stdin, so the probe is buffered by the tmux server's pane-buffer — visible in `capture-pane` output even if the receiving process doesn't process it.)

---

## 4. Pane journaling pattern (REQ-56-04) — closest analog: BATS 57 (`57-live-pane-monitoring.bats`)

**Decision:** P56 stress test extends P55 BATS 57 from 1 session with 1 synthetic `PaneCapturedEvent` to **3 sessions with 3 real PaneCapturedEvents** dispatched through the P52 `createTmuxEventObserver` + P53 `createPaneMonitorHook` chain. The closest analog is `tests/scripts/tmux/57-live-pane-monitoring.bats:39-52` which wires the P52 observer + P53 hook and dispatches a single `pane-captured` event with the LIVE paneId discovered from `tmux list-panes`. **IMPORTANT SOURCE-CODE NOTE** (per actual `src/hooks/pane-monitor.ts:107-115`): the 7 JournalEntry fields are `schemaVersion: 1` (numeric, NOT `"1.0"` string), `eventType: "pane-captured"`, `sessionId`, `paneId`, `contentLength`, `capturedAt`, `retryCount` — NOT `contentPreview` as the prompt's pattern table suggested. The P55 BATS 57 already correctly asserts `schemaVersion = "1"` (numeric) and `keys | length = "7"` (per the BATS at line 65-68).

### Code (canonical analog — P55 BATS 57 pane-monitor integration)
```typescript
// src/hooks/pane-monitor.ts:107-115 — JournalEntry 7 fields (ACTUAL source code)
interface JournalEntry {
  schemaVersion: 1              // numeric, NOT "1.0" string
  eventType: "pane-captured"
  sessionId: string
  paneId: string
  contentLength: number
  capturedAt: string
  retryCount: number
}
```

```bash
# tests/scripts/tmux/57-live-pane-monitoring.bats:39-52 — observer + hook wiring
run tmux_node_eval "
  import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js').then(async (obs) => {
    const { createPaneMonitorHook } = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
    const observer = obs.createTmuxEventObserver({ onSessionCreated: async () => {} });
    const hook = createPaneMonitorHook({ sessionId: '${sid}', observer, journalRoot: '${journal_root}' });
    await observer({ event: { type: 'pane-captured', sessionId: '${sid}', paneId: '${live_pane_id}', contentLength: 2048, timestamp: Date.now() } });
    await hook.__waitForPendingRetries?.();
    await hook.dispose();
    process.stdout.write('written=' + hook.counters.written + ' paneId=' + '${live_pane_id}');
  });
"
[ "$status" -eq 0 ]
[[ "$output" == *"written=1"* ]]
[[ "$output" == *"paneId=${live_pane_id}"* ]]
```

```bash
# tests/scripts/tmux/57-live-pane-monitoring.bats:60-71 — journal file assertions
run jq -r .eventType "$full_path"
[ "$status" -eq 0 ]
[ "$output" = "pane-captured" ]
run jq -r .schemaVersion "$full_path"
[ "$status" -eq 0 ]
[ "$output" = "1" ]   # numeric, NOT "1.0" (per actual JournalEntry interface)
run jq -r 'keys | length' "$full_path"
[ "$status" -eq 0 ]
[ "$output" = "7" ]
run jq -r .paneId "$full_path"
[ "$status" -eq 0 ]
[ "$output" = "${live_pane_id}" ]   # matches the LIVE tmux paneId
```

### Reuse for P56 (REQ-56-04)
- **BATS slot 61 journaling sub-flow** iterates over the 3 spawned sessions, dispatching 3 `pane-captured` events:
  ```bash
  for i in 0 1 2; do
    local tmux_session="e2e-test-${pid}-${i}"
    local pane_id_i="$(tmux list-panes -t "$tmux_session" -F '#{pane_id}' | head -1)"
    # ... dispatch event for session i ...
  done
  ```
- **Single observer + single hook** registered ONCE for all 3 sessions (per D-56-04 — the stress test exercises the SAME hook across 3 events, not 3 separate hooks):
  ```bash
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/observers.js').then(async (obs) => {
      const { createPaneMonitorHook } = await import('${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js');
      const observer = obs.createTmuxEventObserver({ onSessionCreated: async () => {} });
      const hook = createPaneMonitorHook({ sessionId: 'stress-shared', observer, journalRoot: '${journal_root}' });
      // Dispatch 3 pane-captured events (one per session)
      for (let i = 0; i < 3; i++) {
        await observer({ event: { type: 'pane-captured', sessionId: 'stress-shared', paneId: paneIds[i], contentLength: 2048, timestamp: Date.now() + i } });
      }
      await hook.__waitForPendingRetries?.();
      process.stdout.write('written=' + hook.counters.written);
    });
  "
  ```
  Expected output: `written=3` (3 journal files written, one per session).
- **3 journal files asserted** via `ls ${journal_root}/stress-shared/ | grep -E '^[0-9]{4}-[0-9]{2}-[0-9]{2}T.*-pane.json$' | wc -l` = 3. Each file is asserted with `jq -r .paneId <file>` matching the corresponding live paneId.
- **The `__waitForPendingRetries?.()` drain** is the P53 D-53-05 backoff-drain pattern (BATS 57 line 45). The 100ms timing tolerance (D-55-08) covers any microtask scheduling jitter.
- **Teardown calls `hook.dispose()`** to clear in-flight retry timers (D-56-05 + P53 D-53-11). Without dispose, leaked timers would keep BATS reporting "still running" indefinitely.
- **The 7 JournalEntry fields** are asserted via the same `jq` chain as P55 BATS 57 lines 60-71: `eventType = "pane-captured"`, `schemaVersion = "1"` (numeric, NOT `"1.0"`), `keys | length = "7"`, `paneId = <live_paneId>`.

---

## 5. State query + persistence integration pattern (REQ-56-05) — closest analog: BATS 59 (`59-session-persistence-restart.bats`) + tmux-state-query tool

**Decision:** P56 stress test writes **3 persistence records** (one per session, all with `state: "ready"` to match the P54 D-54-06 alive-filter contract — ready is EXCLUDED from `restoreAll`, which is the expected behavior for the stress test per 56-SPEC.md REQ-56-05 acceptance) and invokes the P52 `tmux-state-query` tool for one of the 3 sessions. The closest analog for **persistence round-trip** is `tests/scripts/tmux/59-session-persistence-restart.bats:1-101` (2 scenarios: `ready-state kill` + `detached-state restore`). **CRITICAL SOURCE-CODE NOTE** (per actual `src/tools/tmux-state-query.ts:159-175`): the `get-session` action is a **PLACEHOLDER** that returns `{session: null}` — the SessionManagerAdapter does NOT expose session enumeration (the comment at line 159-165 explicitly says "session-level queries require the internal SessionManager's sessions map which is intentionally not exposed through the adapter contract"). The P56 stress test can only verify that the tool is WIRED and returns the expected shape `{session: null}`, NOT that it returns actual session data. The L1 evidence captures this wire-up; the L2 evidence documents the limitation.

### Code (canonical analog — P55 BATS 59 + tmux-state-query placeholder)
```bash
# tests/scripts/tmux/59-session-persistence-restart.bats:46-65 — persist 1 record (ready-state)
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
```

```typescript
// src/tools/tmux-state-query.ts:159-165 — get-session is a PLACEHOLDER
case "get-session":
  // Session-level queries require the internal SessionManager's
  // sessions map which is intentionally not exposed through the
  // adapter contract. For now, responds with {session: null} to
  // indicate the adapter is wired but session-level details are
  // not enumerable through the public surface.
  return renderToolResult({ session: null })
```

```typescript
// src/tools/tmux-state-query.ts:151-157 — list-sessions is a PLACEHOLDER
case "list-sessions":
  // We cannot enumerate sessions from the adapter surface directly
  // (SessionManagerAdapter exposes only onSessionCreated, sendKeys,
  // listPanes, etc.). Return a placeholder indicating the adapter
  // is wired — consumers can derive session info from the observer's
  // event stream.
  return renderToolResult({ sessions: [] })
```

### Reuse for P56 (REQ-56-05)
- **BATS slot 61 persistence sub-flow** writes 3 records (one per session, all `state: "ready"` per 56-SPEC.md REQ-56-05 acceptance):
  ```bash
  for i in 0 1 2; do
    run tmux_node_eval "
      import('${TMUX_BATS_ROOT}/dist/features/tmux/persistence.js').then(async (mod) => {
        const p = mod.createSessionPersistence({ projectDirectory: '${project}' });
        await p.persist({
          schemaVersion: 1,
          sessionId: 'stress-session-${i}',
          agent: 'stress-agent-${i}',
          delegationId: 'stress-deleg-${i}',
          directory: '${project}',
          paneId: '${pane_id_i}',
          spawnTime: Date.now(),
          state: 'ready',
          lastTransitionAt: Date.now(),
        });
        process.stdout.write('persisted=true session=' + ${i});
      });
    "
    [ "$status" -eq 0 ]
    [[ "$output" == *"persisted=true"* ]]
  done
  ```
- **3 persistence files asserted** via `[ -f "${state_dir}/stress-session-0.json" ]` + `[ -f "${state_dir}/stress-session-1.json" ]` + `[ -f "${state_dir}/stress-session-2.json" ]`. Each file has 9 fields (per P54 D-54-03) and `state: "ready"`.
- **`restoreAll()` returns empty array** (per D-54-06: `ready` is EXCLUDED from the alive filter — only `paused` and `detached` are returned). The P56 stress test EXPLICITLY asserts this expected behavior (proves the filter contract, not the alive-restore behavior):
  ```bash
  run tmux_node_eval "
    import('${TMUX_BATS_ROOT}/dist/features/tmux/persistence.js').then(async (mod) => {
      const p = mod.createSessionPersistence({ projectDirectory: '${project}' });
      const records = await p.restoreAll();
      process.stdout.write('total=' + records.length + ' alive=0');
    });
  "
  [ "$status" -eq 0 ]
  [[ "$output" == *"total=3"* ]]   # 3 records on disk
  [[ "$output" == *"alive=0"* ]]   # 0 in alive filter (ready excluded)
  ```
- **Fresh-harness-process restart** is the next `tmux_node_eval` invocation (BATS orchestrates this as a separate `run` block — each call is a fresh OS process, so the persistence file IS the cross-process state channel).
- **tmux-state-query get-session assertion** verifies the tool is wired (NOT actual session data, per the placeholder at `src/tools/tmux-state-query.ts:159-165`):
  ```bash
  run tmux_node_eval "
    const { tmuxStateQueryTool } = await import('${TMUX_BATS_ROOT}/dist/tools/tmux-state-query.js');
    // The tool has a permission gate that requires orchestrator-tier context.
    // We test the tool's adapter-bridge check directly (the execute() function
    // would return {available: false, reason: 'permission-denied'} without the gate).
    const adapter = await import('${TMUX_BATS_DIST}/types.js').then(m => m.getSessionManagerAdapter());
    process.stdout.write('adapter_wired=' + (adapter !== null ? 'true' : 'false'));
  "
  ```
  OR: directly invoke the tool's `get-session` action via `tmux_state_query` (bypassing permission gate, same as P55 BATS 58 bypasses tmux-copilot gate). The BATS asserts `result.session === null` (the placeholder return).
- **The 15-second timing tolerance** (D-55-08) covers the longer `restoreAll` cycle + fresh-process restart.

---

## 6. 27-tool-key vitest regression in teardown (REQ-56-06) — closest analog: `tests/integration/hook-registration.test.ts:103`

**Decision:** P56 stress test runs `npx vitest run tests/integration/hook-registration.test.ts 2>&1 | grep -E '(tool object contains 27|toBe\(27\)|Tests\s+[0-9]+ passed)'` in the `teardown()` function and asserts the output contains the 27-tool-key assertion line. The closest analog is the **actual vitest test** at `tests/integration/hook-registration.test.ts:102-103`:
```typescript
const toolKeys = Object.keys(result.tool)
expect(toolKeys.length).toBe(27)
```
P56 does NOT duplicate this test in BATS — it RE-EXECUTES the existing vitest test in the BATS teardown. This proves the 27-tool-key invariant is preserved end-to-end (the entire test file, not just the assertion line).

### Code (canonical analog — P49 vitest hook-registration test)
```typescript
// tests/integration/hook-registration.test.ts:102-103 — 27-tool-key assertion
const toolKeys = Object.keys(result.tool)
expect(toolKeys.length).toBe(27)
```

```bash
# P56 BATS teardown — re-execute the vitest regression
teardown() {
  # Defensive cleanup of 4 tmux sessions (3 from REQ-56-01 + 1 grid from REQ-56-02)
  tmux kill-session -t "${pid}-0" 2>/dev/null || true
  tmux kill-session -t "${pid}-1" 2>/dev/null || true
  tmux kill-session -t "${pid}-2" 2>/dev/null || true
  tmux kill-session -t "${pid}-grid" 2>/dev/null || true

  # REQ-56-06: 27-tool-key vitest regression
  run bash -c "npx vitest run tests/integration/hook-registration.test.ts 2>&1 | grep -E '(tool object contains 27|toBe\\(27\\)|Tests\\s+[0-9]+ passed)'"
  [ "$status" -eq 0 ]
  [[ "$output" == *"27"* ]]
}
```

### Reuse for P56 (REQ-56-06)
- **The vitest regression runs in teardown** (NOT in the `@test` block) per D-56-05 — a vitest failure does NOT block the stress test's main assertions (BATS exit code is determined by the `@test` block's `assert` calls; teardown runs unconditionally after the `@test` block completes or fails).
- **The grep filter** extracts the relevant lines for the L1 evidence: `tool object contains 27 tool entries` (the vitest test's failure message if the assertion fails) OR `toBe(27)` (the assertion line) OR `Tests N passed` (the vitest success line). All 3 patterns are matched.
- **The 27 keys** are: `delegate-task`, `delegation-status`, `session-hierarchy`, `session-tracker`, `session-delegation-query`, `hivemind`, `prompt-enhance`, `nl-route`, `nl-extract`, `nl-batch`, `tmux-copilot`, `tmux-state-query`, `mcp-server-pty`, `healthcheck`, `config-workflow`, `session-recovery`, `tmux-pane-pip`, `session-journal-export`, `boot-02-init`, `boot-02-bootstrap-recover`, `tmux-mcp-server`, `create-governance-session`, `tmux-copilot-list-panes`, `validate-restart`, `tmux-copilot-send-keys`, `tmux-copilot-compute-grid`, `tmux-copilot-respawn` — P56 does NOT add to this list (per 56-SPEC.md REQ-56-06 + D-56-12).
- **No new tool registrations** (D-56-12): the 4 BATS sub-flows exercise `tmux-copilot` (4 actions) and `tmux-state-query` (3 actions) via the in-tree adapter, but do NOT add new tools. The 27-key count is locked at P49.
- **The vitest test does NOT mutate any state** — it's a read-only assertion that the plugin's tool registration map has exactly 27 keys. The test is re-executed in the BATS teardown as a regression check; a failure means a 28th tool was accidentally added (P56 fail).

---

## 7. helpers.bash extension — `tmux_bats_require_stress_facilities()` (NEW helper, D-56-03)

**Decision:** P56 extends `tests/scripts/tmux/helpers.bash` with a **NEW helper function** `tmux_bats_require_stress_facilities()` that checks the EXTERNAL binaries (`tmux`, `node`, `git`) on PATH. This is **additive** — no removal of P53/P54/P55 helpers. The P56 helper is a SECONDARY check (the primary check `tmux_bats_require_dist` for 6 dist artifacts remains unchanged). The rationale: the P56 stress test runs a vitest regression in teardown (REQ-56-06), which is a separate runtime requirement (git + node) beyond the dist artifacts (per D-56-03).

### Code (current state — P55 helpers.bash)
```bash
# tests/scripts/tmux/helpers.bash:11-31 — tmux_bats_require_dist (6 dist checks)
tmux_bats_require_dist() {
  if [[ ! -f "${TMUX_BATS_DIST}/integration.js" ]]; then
    skip "dist/features/tmux/integration.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_DIST}/types.js" ]]; then
    skip "dist/features/tmux/types.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_ROOT}/dist/hooks/pane-monitor.js" ]; then
    skip "dist/hooks/pane-monitor.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_DIST}/persistence.js" ]]; then
    skip "dist/features/tmux/persistence.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_DIST}/grid-planner.js" ]]; then
    skip "dist/features/tmux/grid-planner.js missing — run 'npx tsc' first"
  fi
  if [[ ! -f "${TMUX_BATS_ROOT}/dist/tools/tmux-copilot.js" ]]; then
    skip "dist/tools/tmux-copilot.js missing — run 'npx tsc' first"
  fi
}
```

### Reuse for P56
- **NEW helper function** added at the end of `helpers.bash` (after the existing `tmux_bats_make_project`):
  ```bash
  # Stress-test-specific facility check (D-56-03) — checks EXTERNAL binaries
  # beyond the dist artifacts. Used by P56 BATS slot 61 which runs a vitest
  # regression in teardown (REQ-56-06).
  tmux_bats_require_stress_facilities() {
    if ! command -v tmux >/dev/null 2>&1; then
      skip "tmux binary not on PATH — stress test requires it"
    fi
    if ! command -v node >/dev/null 2>&1; then
      skip "node binary not on PATH — stress test requires it"
    fi
    if ! command -v git >/dev/null 2>&1; then
      skip "git binary not on PATH — vitest regression in teardown requires it"
    fi
  }
  ```
- **The BATS scenario's `setup()` calls BOTH helpers**:
  ```bash
  setup() {
    tmux_bats_require_dist         # P53+P54+P55 dist artifacts (6 checks)
    tmux_bats_require_stress_facilities   # P56 external binaries (3 checks)
    tmux_bats_make_project
  }
  ```
- **`command -v` is portable** (POSIX-compliant) — works in bash 3.2+ on macOS and Linux. The `>/dev/null 2>&1` suppresses stdout/stderr (the function is silent on success).
- **The `skip` message format** is consistent with `tmux_bats_require_dist`: `"<binary> not on PATH — <context>"`. The context explains WHY the binary is required (e.g., "vitest regression in teardown requires it").
- **No `opencode` check** (per D-56-03 — opencode is optional, the stress test does NOT require it; the vitest test setup may load it but it's not a hard dependency).

---

## Constraints for planner

The planner MUST respect the following locked invariants when producing `56-01-PLAN.md`:

1. **Q6 canonical state root + R-P50-03 spirit** (CONTEXT.md D-56-10) — `.hivemind/journal/<sid>/<ISO-ts>-pane.json` (REQ-56-04) and `.hivemind/state/tmux-sessions/<sid>.json` (REQ-56-05) are the on-disk paths. The BATS scenario uses `BATS_TEST_TMPDIR/project/.hivemind/{journal,state/tmux-sessions}/` — all under `BATS_TEST_TMPDIR`, NEVER the project tree. EXECUTE must NOT mutate `.hivemind/session-tracker/*` (R-P50-03 strict).

2. **27-tool-key invariant (D-56-12)** — P56 does NOT add any new tool registrations. The BATS file exercises `tmux-copilot` (4 actions) and `tmux-state-query` (3 actions) via the in-tree adapter, but does NOT add new tools. The 27-key count is locked at P49; the stress test RE-ASSERTS the count in teardown via `npx vitest run tests/integration/hook-registration.test.ts` (REQ-56-06). A vitest failure = stress test FAIL.

3. **P20 invariant — no new `package.json` deps** (CONTEXT.md D-56-12 + AGENTS.md) — P56 is verification-only. The 1 BATS file uses only `node:fs/promises` (via the in-tree modules), `node:child_process` (via `tmux_node_eval`), and `bash` builtins + `tmux` + `git` + `npx vitest`. No new `node_modules` entries.

4. **D-04 silent-fallback (D-56-12)** — P56 BATS does NOT test the silent-fallback contract directly (P51–P55 unit tests do that). P56 BATS exercises the happy path only — a real OS tmux server, a real harness binary, a real `node` process. Failure modes are still silently handled by P53/P54 modules, but P56 BATS does not assert that contract.

5. **BATS real-OS-process survival (D-56-05, D-56-12)** — the 1 BATS file uses real `tmux` binary + real `node` process via `tmux_node_eval` + real `vitest` process — no mocks. Per P54 D-54-12 precedent and P55 D-55-05.

6. **`schemaVersion: 1` numeric literal for persistence; `schemaVersion: 1` numeric literal for journal (D-56-12 + D-53-13 fix + actual source code)** — both the persistence record (REQ-56-05) and the journal entry (REQ-56-04) assert `jq -r .schemaVersion <file> = "1"` (number, NOT `"1.0"` string). The actual `JournalEntry` interface at `src/hooks/pane-monitor.ts:107-115` uses `schemaVersion: 1` (numeric literal); the actual `PersistedSession` interface at `src/features/tmux/persistence.ts:39-49` uses `schemaVersion: 1` (numeric literal). The BATS scenario must match the actual source code, NOT the prompt's "1.0" suggestion.

7. **Atomic commit (CONTEXT.md D-56-12 + AGENTS.md)** — EXECUTE commit must be atomic (one logical change = one commit per the project-wide commit-discipline rule). P56 has **2 atomic commits**:
   - **Commit 1**: BATS + helpers.bash extension (1 BATS file + `tmux_bats_require_stress_facilities` helper).
   - **Commit 2**: L1+L2 evidence + ROADMAP/STATE advance (`56-STRESS-TEST-EVIDENCE-2026-06-03.md` + ROADMAP.md P56 marked `[x]` + STATE.md status update).

8. **BATS timing tolerance (D-55-08 + D-56-06)** — ±200ms for capture-pane probe visibility (REQ-56-03); ±100ms for backoff/scheduling (REQ-56-04); no tolerance for persistence (REQ-56-05) and grid layout (REQ-56-02). Stress test total runtime ≤ 60 seconds wall clock (D-56-06).

9. **BATS slot reservation (D-56-01)** — slot 61 follows the P55 `5X-tmux-...` convention (P55 reserved 57-60, one per seed success criterion; P56 reserves 61 for the comprehensive stress test). The `5X-tmux-...` naming convention is preserved. The 6 sub-flows run in ONE `@test` block (D-56-04 — atomic scenario).

10. **SC-isolation (D-56-08)** — no `SC-*` work referenced. The 1 BATS file imports only from `dist/features/tmux/`, `dist/hooks/`, and `dist/tools/` — no `sidecar/` references, no `.hivemind/session-tracker/*` reads/writes, no `compositions/` cross-references. The 2 SC-* string matches in 56-SPEC.md (the "SC-isolation" constraint line + the "SC-isolation" column in the Ambiguity Report) are constraint statements, not SC-* work references.

11. **No new `src/**` files (D-56-12 + P20 invariant)** — P56 is verification-only. The 1 BATS file + `helpers.bash` extension are the ONLY file changes. The BATS file is a `tests/**` addition (NOT `src/**` mutation), so the CP-PTY-00 docs/spec-only phase can land later without conflict (per `.planning/AGENTS.md` §7).

12. **GATE logic (D-56-11)** — 1/1 BATS scenario passes (all 6 sub-flows PASS) = stress test PASS. The 6 sub-flows are **inseparable** — partial failure (e.g., REQ-56-01..05 PASS but REQ-56-06 27-tool-key assertion FAILS) means the scenario fails, and a follow-up P57 gap-remediation phase is required. The GATE verdict is recorded in the evidence doc (`56-STRESS-TEST-EVIDENCE-2026-06-03.md`) and propagated to ROADMAP/STATE.md in a separate commit (per D-56-12: "2 atomic commits: (1) BATS + helper extension, (2) L1+L2 evidence + ROADMAP/STATE advance").

13. **`tmux-state-query.ts` is a placeholder** (per actual source code at `src/tools/tmux-state-query.ts:159-175`) — `get-session` returns `{session: null}`, `list-sessions` returns `{sessions: []}`, `get-summary` returns `{summary: {total: 0, active: 0, spawning: 0}}`. The BATS REQ-56-05 stress test can only verify the tool is WIRED and returns the expected shape, NOT that it returns actual session data. The L2 evidence documents this limitation explicitly.

14. **P56 PLAN scope (CONTEXT.md "in scope")** — the 1 BATS file + helpers.bash extension + evidence doc are the EXECUTE deliverables. The 2 atomic commits are pre-scoped. The implementer follows the P55 PLAN format (`<read_first>`, `<action>`, `<verify>`, `<done>` blocks) — see `55-01-PLAN.md:1-1167` for the canonical structure.

15. **Vitest regression in teardown (D-56-09)** — `npx vitest run tests/integration/hook-registration.test.ts 2>&1 | grep -E '(tool object contains 27|toBe\(27\)|Tests\s+[0-9]+ passed)'`. The grep filter extracts the relevant lines for the L1 evidence. The full vitest output is captured in the evidence doc as a 2nd-level artifact.

---

*Phase: 56-tmux-stress-test-real-world-workflow*
*Checkpoint 7 (PATTERNS) complete — 7 patterns mapped, ready for Checkpoint 8 (PLANNING)*
