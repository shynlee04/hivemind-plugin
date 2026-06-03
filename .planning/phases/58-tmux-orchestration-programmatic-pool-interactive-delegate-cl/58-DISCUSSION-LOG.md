# Phase 58: tmux-orchestration-programmatic-pool-interactive-delegate - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-04 (P58-extension update)
**Phase:** 58-tmux-orchestration-programmatic-pool-interactive-delegate-cl
**Mode:** `--auto` (P58-extension; SPEC already auto-generated at 0.0775 ambiguity)
**Re-discuss reason:** SPEC.md was UPDATED 2026-06-04 with 5 new REQs (REQ-58-07..10 + REQ-58-META) covering 4 user-visible symptoms (S1–S4) and 3 process changes. The original CONTEXT.md (dated 2026-06-03) only covered the 6 G1–G6 gaps with 17 decisions. The P58-extension needed implementation decisions to guide PLAN-08 and PLAN-09 generation.

**Areas discussed:** 5 (S1 — Live tmux pane content streaming; S2 — User-actor affordance; S3 — WaiterModel keep-alive; S4 — Real-time child event streaming; META — Process changes)

---

## S1 — Live tmux pane content streaming (REQ-58-07)

| Option | Description | Selected |
|--------|-------------|----------|
| `capturePaneContent` on `TmuxMultiplexer` (single owner) | Matches P51 boundary; tmux subprocess invocations stay in one class. Less coupling for future tests. | ✓ |
| New module `src/features/tmux/capture.ts` | Cleaner separation but violates SPEC In Scope ("No new `src/features/tmux/*.ts` modules") | |
| `SessionManager` method | Sessions own pane lifecycle, but mixing capture with respawn/close is too much responsibility for one class | |

| Option | Polling cadence | Selected |
|--------|-----------------|----------|
| 5s fixed cadence | Simple but wastes tmux subprocess invocations on stable panes | |
| 5s/15s adaptive (per SPEC) | 5s when content changes; 15s when content stable (SHA-256 hash detection). Matches D-53-05 backoff schedule. | ✓ |
| Event-driven (SDK subscription) | Per SPEC OOS, REQ-58-10 uses existing hooks, NOT a new SDK subscription. Polling is the fallback. | |

| Option | `peek` action placement | Selected |
|--------|--------------------------|----------|
| `peek` on `delegation-status` (orchestrator-tier) AND `peek` on `tmux-copilot` (user-tier), sharing `capturePaneContent()` method | Per SPEC AC-58-08-02; single source of truth for capture logic. Tool key count remains 27. | ✓ |
| Single tool only (either delegation-status or tmux-copilot) | Simpler but breaks SPEC's user-vs-orchestrator tier separation | |
| Merge with `progress` (S4) | Different response shapes; `peek` returns content; `progress` returns counters+lastEvent. Merging breaks both AC-58-07-02 and AC-58-10-02 | |

| Option | BATS slot numbering | Selected |
|--------|----------------------|----------|
| Use slots 67-70 as SPEC says (collides with existing BATS 67 G1 grep-guard) | Conflicts with `58-SUMMARY.md:45` evidence trail | |
| Renumber to slots 71-74 (post-67) | Matches existing P58 pattern (62-67 is original block; 71-74 is extension block; 75+ reserved for P58.1/P58.2 follow-ups). Preserves the G1 BATS at slot 67. | ✓ |

**Auto-selected decisions:** D-58-18 (capturePaneContent on TmuxMultiplexer), D-58-19 (5s/15s adaptive polling in SessionManager), D-58-20 (peek on both tools sharing capturePaneContent()), D-58-21 (BATS slots 71-74)

---

## S2 — User-actor affordance for tmux-copilot (REQ-58-08)

| Option | `USER_SESSION` tier placement | Selected |
|--------|-------------------------------|----------|
| Add to `ORCHESTRATOR_AGENTS` array at `tmux-copilot.ts:51` | Mixes user-tier with orchestrator-tier; hard to gate per-action; breaks P52 invariant | |
| Separate `USER_SESSION_TIERS` constant (Set) added BELOW the existing array | Explicit signal; gates 3 specific actions (take-over, release, peek). Preserves P52 invariant. | ✓ |
| Per-action whitelist baked into each case branch | More flexible but spreads the gate logic; harder to audit | |

| Option | User-actor detection sentinel | Selected |
|--------|-------------------------------|----------|
| `context.agent === "user"` only | Misses TUI sessions where the natural agent name is the model provider (e.g., "anthropic/claude-sonnet-4-5") | |
| `context.agent === "__user__"` sentinel only | Too restrictive; forces all user-actor calls to go through the sentinel | |
| Both: `context.agent === "user" OR context.agent === "__user__"` | Per SPEC AC-58-08-01; covers both natural agent name AND explicit TUI invocation | ✓ |

| Option | REGRESSION GUARD for AC-58-08-04 | Selected |
|--------|----------------------------------|----------|
| Re-run BATS 64 + 65 in CI (manual override check still passes) | Preserves evidence trail; minimal new infrastructure | ✓ |
| Add a new BATS test for the regression | More assertions but duplicates BATS 64/65's coverage | |
| Skip the guard (assume manual override check is preserved) | Violates AC-58-08-04; breaks the REGRESSION GUARD contract | |

**Auto-selected decisions:** D-58-22 (USER_SESSION_TIERS Set below ORCHESTRATOR_AGENTS), D-58-23 (both "user" and "__user__" sentinels), D-58-24 (re-run BATS 64/65 in CI as REGRESSION GUARD)

---

## S3 — WaiterModel keep-alive (REQ-58-09)

| Option | Fire-and-forget pattern | Selected |
|--------|--------------------------|----------|
| `void sendPromptAsync(...).catch(err => logger.error(...))` at `manager-runtime.ts:244` | Per SPEC AC-58-09-01; minimal change preserves dispatch chain structure. The `.catch` logs errors but does NOT throw. | ✓ |
| Background worker / queue | Adds new infrastructure; over-engineered for a 1-line behavioral change | |
| `setTimeout(sendPromptAsync, 0)` (microtask deferral) | Equivalent to fire-and-forget but less explicit; harder to grep for the pattern | |

| Option | Pre-send validation location | Selected |
|--------|-----------------------------|----------|
| Inline in `dispatch()` at `manager-runtime.ts:230` | Minimal new abstraction; preserves error handling for spawn failures | ✓ |
| Helper function `assertChildSessionValid(delegation)` | Cleaner separation but adds a new function for a 1-line check | |
| Skip pre-send validation (rely on sendPromptAsync's internal checks) | Violates SPEC's "preserves synchronous error handling for spawn failures" requirement | |

| Option | Comment fix wording | Selected |
|--------|---------------------|----------|
| Verbatim SPEC text: "true-fire-and-forget WaiterModel (P58.3)" | Per SPEC AC-58-09-04; verifiable by grep; matches the "(P58.3)" annotation convention | ✓ |
| Custom wording | Violates AC-58-09-04 verification contract | |

**Auto-selected decisions:** D-58-25 (void sendPromptAsync with .catch), D-58-26 (inline pre-send validation at line 230), D-58-27 (verbatim comment fix)

---

## S4 — Real-time child event streaming (REQ-58-10)

| Option | Event bus file location | Selected |
|--------|--------------------------|----------|
| `src/features/session-tracker/streaming/child-event-stream.ts` (NEW file, NEW dir) | Per SPEC In Scope; matches P53 pane-monitor style (separate file for separate concern) | ✓ |
| Extend `src/features/session-tracker/tool-delegation.ts` | Too much responsibility for one file; current file is already 583 LOC after G6 | |
| Extend `src/features/session-tracker/index.ts` | Breaks the session-tracker pattern (capture/persistence are subdirs) | |

| Option | Event buffer size | Selected |
|--------|-------------------|----------|
| Unbounded | Risk of memory leak; same T-58-07-T3 risk as the original G6 | |
| Last 100 events per session (bounded RingBuffer) | Bounded; matches T-58-07-T3 with tighter cap. 100 × ~500 bytes × N active = bounded. | ✓ |
| Last 10 events per session | Too small; `progress` action needs enough history to show meaningful lastEvent | |

| Option | `progress` action vs. `peek` | Selected |
|--------|------------------------------|----------|
| Separate `progress` action (per SPEC) | AC-58-10-02: progress returns counters+lastEvent. AC-58-07-02: peek returns content. Different response shapes, different Zod schemas. | ✓ |
| Merge into a single `live` action | Breaks both ACs; mixes concerns | |
| Add `progress` to existing `status` action (as a query parameter) | Action count stays at 6 but breaks the discriminated union pattern | |

| Option | `progress` action's `lastEvent` field shape | Selected |
|--------|-------------------------------------------|----------|
| Single `payload: { toolName?, thought?, message? }` (all optional) | Simpler; covers common cases | |
| Discriminated union per `eventType` (type-safe per event category) | More type-safe but more boilerplate | ✓ (per D-58-30) |

**Auto-selected decisions:** D-58-28 (event bus in streaming/ subdir, bounded 100 events), D-58-29 (subscription at coordinator.ts:200, unsubscribe at terminal), D-58-30 (progress action with single payload), D-58-31 (peek and progress are separate actions)

---

## META — Process changes (REQ-58-META)

| Option | `.planning/USER-PAIN-BACKLOG.md` content | Selected |
|--------|------------------------------------------|----------|
| Initial entries S1-S4 verbatim from symptom diagnosis | Per SPEC AC-58-META-01; preserves source citation | ✓ |
| Truncated entries | Loses traceability | |

| Option | Human-Driven UAT tester identity | Selected |
|--------|----------------------------------|----------|
| Hard require "name" (not "gsd-verifier" or "gsd-executor") | Per SPEC AC-58-META-02; prevents automated padding | ✓ |
| Free-text (any string) | Defeats the regression-guard purpose | |

| Option | Symptom Coverage Matrix initial entries | Selected |
|--------|------------------------------------------|----------|
| S1-S4 with P58-extension as owner | Atomic with phase close; provides immediate traceability | ✓ |
| Defer until plan | Loses META-04 enforcement signal | |

| Option | META-04 real UAT enforcement | Selected |
|--------|--------------------------------|----------|
| Hard fail VERIFIED verdict if Human-Driven UAT missing | Per SPEC AC-58-META-04; matches the "BATS-only is not sufficient" principle | ✓ |
| Warning only | Defeats the regression-guard purpose | |
| Skip the gate (rely on BATS-only) | Repeats the P55 failure mode (per `58-META-ANALYSIS.md:120-214`) | |

**Auto-selected decisions:** D-58-32 (USER-PAIN-BACKLOG.md with verbatim entries), D-58-33 (User-Pain Coverage section in spec.md template + gsd-spec-phase gate), D-58-34 (Human-Driven UAT section in verification.md template + gsd-verify-work gate), D-58-35 (Symptom Coverage Matrix in ROADMAP.md + close-pivot gate), D-58-36 (META-04 real UAT enforcement)

---

## the agent's Discretion (P58-extension)

10 implementation details deferred to the implementer (no SPEC constraint, no user preference captured — `--auto` mode):

1. Exact JSDoc depth on `capturePaneContent` / `ChildEvent` / `DelegationEventBase`
2. Specific `setTimeout` vs `setInterval` for polling loop
3. `RingBuffer<ChildEvent>` hand-rolled vs. library
4. SHA-256 truncation length for content-stable detection
5. `USER_SESSION` tier via Set vs. switch
6. `__user__` sentinel value (current: `"__user__"`)
7. Order of `take-over`/`release`/`peek` in `USER_SESSION_ALLOWED_ACTIONS`
8. `progress` `lastEvent` payload: single vs. discriminated union
9. `.planning/USER-PAIN-BACKLOG.md` YAML frontmatter vs. markdown-only
10. Specific phrasing in `## Human-Driven UAT` verdict field

---

## Deferred Ideas

- SC-04 / SC-05 dashboard rendering (out of scope)
- Multi-user session concurrency (single-actor `takenBy: "human-operator"` preserved)
- Auto-refresh of visual dependency graph (out of scope)
- `appendTuiPrompt` → `showTuiToast` migration (different layer)
- Distributed `take-over` across multiple tmux servers (single-host)
- Bounded buffer tuning for child-event-stream.ts (100 is default)
- Polling cadence tuning (5s/15s is default)
- USER_SESSION tier widening beyond 3 actions
- `__user__` sentinel collision detection
- Real SDK event subscription (replaces polling loop)
- META process changes — non-P58 templates
