# Phase 53: Live Pane Monitoring Hook + Journal Integration - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning
**Mode:** Auto-generated (spec-locked, implementation decisions only)

<domain>
## Phase Boundary

Add `src/hooks/pane-monitor.ts` (≤ 500 LOC) as a consumer-only subscriber to the P52-expanded `src/features/tmux/observers.ts`. The hook subscribes to `pane-captured` events, writes a 7-field JSON entry per event to `.hivemind/journal/<sessionId>/<ISO-timestamp>-pane.json`, applies exponential backoff (5s → 10s → 30s, max 3 retries, 4th failure drops silently), enforces a 100-entries-per-session-per-hour rate cap (UTC top-of-hour reset), and retroactively appends `## L1 Backing (P53)` sections to P42 UAT.md and P43 VERIFICATION.md. No changes to `observers.ts`; no modifications to `.hivemind/session-tracker/*` (R-P50-03). Deliverables: 1 hook file, 1 plugin.ts call site, 1 BATS scenario (`tests/scripts/tmux/55-pane-monitor-journal-capture.bats`), 2 vitest files (`tests/lib/hooks/pane-monitor-backoff.test.ts`, `tests/lib/hooks/pane-monitor-cap.test.ts`), 2 retroactive `## L1 Backing (P53)` sections. L1 evidence: BATS 1/1, vitest 2 files, tsc exit 0, journal file present under `.hivemind/journal/test-session/`.

</domain>

<spec_lock>
## Requirements (locked via SPEC.md)

**5 requirements are locked.** See `53-SPEC.md` for full requirements, boundaries, and acceptance criteria.

Downstream agents MUST read `53-SPEC.md` before planning or implementing. Requirements are not duplicated here.

**In scope (from SPEC.md):**
- `src/hooks/pane-monitor.ts` creation (≤ 500 LOC; factory exports `createPaneMonitorHook`)
- Subscription wiring into the P52 `onPaneCaptured` registration method (consumer only — no changes to `observers.ts`)
- Journal writes to `.hivemind/journal/<sid>/<ISO-timestamp>-pane.json` (local runtime writes, never committed)
- Exponential backoff (5s/10s/30s, max 3 retries) and silent drop on retry exhaustion
- 100/session/hour rate limit with UTC top-of-hour reset
- Retroactive `## L1 Backing (P53)` sections on P42 UAT.md and P43 VERIFICATION.md (append-only)
- 1 BATS scenario (`tests/scripts/tmux/55-pane-monitor-journal-capture.bats`) + 2 vitest files
- `src/plugin.ts` registration of the hook in the hooks array (1 call site)

**Out of scope (from SPEC.md):**
- P54 session persistence and restart-recovery
- P55 E2E UAT
- Sidecar dashboard rendering of journal entries
- Changes to `src/features/tmux/observers.ts` (P52 deliverable is the contract)
- Changes to the `PaneCapturedEvent` shape
- Modifying `.hivemind/session-tracker/*` (R-P50-03 — strict append-only, EXECUTE must not touch)
- Removing or replacing the existing "L5 only" notice in P42 UAT.md (REQ-53-05 is additive, not subtractive)

</spec_lock>

<decisions>
## Locked Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| **D-53-01** | Module path is `src/hooks/pane-monitor.ts` (singular, mirrors `event-observers.ts` and `delegation-consumer.ts` naming; NOT `pane-monitor-hook.ts`) | REQ-53-01 acceptance requires a single `git grep createPaneMonitorHook src/hooks/` definition. The singular form matches the existing `src/hooks/observers/event-observers.ts` and `src/hooks/observers/delegation-consumer.ts` precedent (subject + role, not subject + suffix `-hook`). Per `.planning/codebase/STRUCTURE.md` file-placement conventions, hook modules live at `src/hooks/*.ts` with the file name describing the hook's subject. |
| **D-53-02** | Journal root is `.hivemind/journal/<sessionId>/` (mirrors `.hivemind/state/<sessionId>/` continuity convention) | Q6 locked decision (`.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — canonical state root): `.hivemind/` is the internal state root; `.opencode/` is OpenCode-primitives-only. The per-session subdirectory mirrors `.hivemind/state/<sessionId>/` established by P43+ continuity persistence. Per-session partitioning enables per-session rate limiting and per-session cleanup. |
| **D-53-03** | Filename format is `<ISO8601-timestamp>-pane.json` with colons replaced by dashes (e.g., `2026-06-02T19-30-45-123Z-pane.json`) | REQ-53-02 acceptance requires `<ISO-timestamp>-pane.json` glob match. ISO-8601 natively uses colons (`T19:30:45.123Z`) which are unsafe on Windows filesystems and visually ambiguous in shell contexts. Replacing colons with dashes preserves lexicographic sort order (dashes sort before colons in ASCII, so the file order matches the timestamp order). The `.json` extension enables tooling (jq, JSON.parse) and the `-pane` suffix distinguishes from future event types. |
| **D-53-04** | Journal entry JSON has 7 required fields: `schemaVersion` (number, `1`), `eventType` (string, `"pane-captured"`), `sessionId` (string), `paneId` (string), `contentLength` (number), `capturedAt` (string, ISO 8601), `retryCount` (number, default `0`) | REQ-53-02 acceptance asserts `jq -r 'keys \| length' <file>` returns `7`. The 7 fields are locked to a minimal forward-compatible shape: `schemaVersion` enables schema evolution, `eventType` enables journal multiplexing (future P54 events share the same journal root), `sessionId`/`paneId` enable lookup, `contentLength` enables storage analytics, `capturedAt` enables time-series reconstruction, `retryCount` enables post-hoc retry analysis. The user's `eventTimestamp` is consolidated with `capturedAt` (same value, stored under the SPEC field name) to keep the field count at 7. |
| **D-53-05** | Backoff schedule: 5s → 10s → 30s, max 3 retries, 4th failure drops event silently (no throw) | ROADMAP L1977 + REQ-53-03 acceptance: vitest backoff test injects 2 failures then success → elapsed time between 15s − ε and 15s + ε (5s + 10s = 15s, third attempt succeeds). 3 retries = 4 total attempts. After the 4th failure, `counters.dropped` is incremented and the event handler returns without throwing. The 5s/10s/30s doubling schedule is the standard "decorrelated jitter" base case — well-known, predictable, and bounded (3 retries caps total worst-case latency at 45s). |
| **D-53-06** | Rate limit: 100 entries per session per hour, UTC top-of-hour reset | ROADMAP L1977 + REQ-53-04 acceptance: vitest cap test seeds the counter to 100, fires 1 more event, asserts no new file written and `counters.dropped === 1`. UTC top-of-hour reset means `Math.floor(Date.now() / 3_600_000)` is the hour epoch; rollover is detected by comparing the current hour epoch against the stored hour epoch. UTC (not local) avoids timezone-dependent behavior across CI runners. |
| **D-53-07** | Rate-limit implementation: count via `fs.readdir(<sessionDir>)` filtering `.json` files with same hour prefix; cheaper than parsing each JSON | Performance optimization. `fs.readdir` is a single syscall returning file names; filtering by hour prefix (e.g., `2026-06-02T19-`) is O(n) string compare. The alternative (parse every JSON file's `capturedAt` to count) is O(n) parse + O(n) string ops. Since the rate cap is 100/hr, the readdir cost is bounded and negligible. The write-path is not on the hot loop (events arrive at human-readable pane-capture rates, not microsecond rates), so the readdir cost is amortized across events. |
| **D-53-08** | Backoff state in-memory: `Map<sessionId, { attempts: number; nextRetryAt: number }>` — per-session, ephemeral (resets on process restart) | D-04 graceful-fallback contract (P50/P51): in-memory state is consistent with the "no throw on missing prerequisites" rule. Persistence is unnecessary because journal writes are best-effort retry of a single event; if the process restarts mid-retry, the in-flight event is dropped (which is acceptable per silent-drop behavior). The `Map` keys by `sessionId` to avoid cross-session retry interference. The `attempts` counter is the source of truth for which backoff delay to apply; `nextRetryAt` (epoch ms) enables early-discard when the rate cap is checked. |
| **D-53-09** | P42/P43 retroactive rewrite: ADD a new `## L1 Backing (P53)` section; PRESERVE all pre-existing content (no retcon) | REQ-53-05 acceptance: `git diff` shows 0 lines removed and ≥ 5 lines added. Adding is the only way to upgrade L5 → L1 evidence without invalidating the audit trail of prior phases. Per the planning/AGENTS.md "explicit no-go boundaries" rule (planning docs SHALL NOT claim runtime readiness from docs-only evidence), the new section must cite the actual L1 source (BATS path + journal file glob) — not just claim "P53 happened." The append-only approach also satisfies `git log --follow` traceability on both files. |
| **D-53-10** | Graceful degradation: if `.hivemind/journal/` cannot be created (read-only FS, permission denied, ENOSPC), log warning via `client.app.log({ level: "warn", message })` and return — NO throw | D-04 silent-fallback contract (P51 decision, preserved through P52): tmux unavailability and filesystem errors must never propagate as exceptions that could crash the OpenCode host. Per `AGENTS.md` (repo root) and `.opencode/skills/customize-opencode` reference, `client.app.log` is the canonical harness log channel. The `level: "warn"` is the appropriate severity — recoverable but operator-visible. Returning without throwing keeps the event handler async-clean and prevents the `observer.onPaneCaptured` callback from rejecting. |
| **D-53-11** | Journal entries are local runtime state, NOT committed; EXECUTE commit uses `git add -u` (update-tracked) so the journal files produced at runtime are NOT staged | R-P50-03 spirit (strict prohibition on `.hivemind/session-tracker/*` mutation) extended by analogy: `.hivemind/journal/*` is local runtime state analogous to `.hivemind/state/` — durable on local disk, never staged. Using `git add -u` instead of `git add .` ensures only tracked files (the source code) are staged; the runtime-produced journal files remain untracked. The `.gitignore` at repo root should include `.hivemind/journal/` (verify in EXECUTE; add if missing). |
| **D-53-12** | Hook only subscribes to `pane-captured`; `session-state-changed` subscription is deferred to P54 (not in P53 scope) | ROADMAP L1975-1986 + REQ-53-01: P53 SPEC explicitly limits subscription to `pane-captured` only. The P52 observer (`src/features/tmux/observers.ts`) exposes both `onPaneCaptured` and `onSessionStateChanged`, but P53 is a focused single-event hook. P54 will introduce session persistence + restart-recovery and is the natural phase to add `session-state-changed` subscription (since restart-recovery needs to reconcile session state). Per `AGENTS.md` "no scope creep" rule and the SPEC's Out-of-Scope section. |

## the agent's Discretion

The implementer has flexibility for the following implementation details (no SPEC constraint, no user preference captured):
- Exact JSDoc depth on private helper functions (public API requires full JSDoc per `AGENTS.md`; private helpers may be one-line)
- Specific `Map` accessor naming (`get` / `set` / `has` vs `ensure` / `increment`) — must follow kebab-case per `.planning/codebase/CONVENTIONS.md`
- Test fixture data shape for BATS — the synthetic `PaneCapturedEvent` payload values (any valid `sessionId`/`paneId`/`contentLength` triple satisfies the SPEC)
- Exact wording of the `## L1 Backing (P53)` section in P42 UAT.md and P43 VERIFICATION.md — must include the BATS path and journal file glob (per REQ-53-05 acceptance), but the surrounding prose is flexible
- Error message phrasing for `client.app.log` warnings — must include "journal" + "pane-monitor" + the underlying error message, but exact wording is flexible
- `vi.useFakeTimers()` vs `vi.useRealTimers()` choice in the vitest backoff test — both satisfy the SPEC; fake timers are simpler
- Specific private helper structure inside `createPaneMonitorHook` (e.g., extracting `writeOnce`, `scheduleRetry`, `checkRateLimit` as separate functions vs inline closures)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### SPEC and Phase Documents
- `.planning/phases/53-live-pane-monitoring-hook-journal-integration/53-SPEC.md` — Locked spec: 5 EARS requirements (REQ-53-01..05), ambiguity gate PASSED at 0.10 ≤ 0.20, 19 acceptance criteria
- `.planning/phases/52-wire-tmux-copilot-state-query/52-CONTEXT.md` — Prior-phase decisions: D-01 single-tool discriminated union, D-02 simple callback collection, D-03 adapter bridge pattern, D-04 tool placement convention
- `.planning/phases/52-wire-tmux-copilot-state-query/52-SPEC.md` — P52 contract: `createTmuxEventObserver` expanded with `onPaneCaptured` registration method
- `.planning/phases/51-synthesize-core-tmux-classes-in-tree/51-CONTEXT.md` — Prior-phase decisions: D-04 graceful-fallback (preserved through P53), D-03 `[Harness]Tmux*` error prefix

### Roadmap and Requirements
- `.planning/ROADMAP.md` L1975-1986 — P53 phase entry with the 100/session/hour cap and 5s/10s/30s backoff schedule
- `.planning/ROADMAP.md` L1977 — Exact backoff + rate-limit numerical specs
- `.planning/REQUIREMENTS.md` — Requirement registry (REQ-53-01..05 trace)

### Codebase Architecture Maps
- `.planning/codebase/ARCHITECTURE.md` — 9-surface CQRS model; hook layer reads events from features/observers
- `.planning/codebase/STRUCTURE.md` — File placement: `src/hooks/*.ts` for hook modules
- `.planning/codebase/CONVENTIONS.md` — Max 500 LOC per module, `[Harness]` prefix on errors, deep-clone-on-read

### Source Code (read-only references for P53 implementer)
- `src/features/tmux/observers.ts` (P52 deliverable) — `createTmuxEventObserver` factory; `onPaneCaptured(cb)` registration method; `PaneCapturedEvent = { sessionId, paneId, contentLength, timestamp }`
- `src/hooks/observers/event-observers.ts` — Hook registration pattern (factory → `client.app.log` warnings → handler chain)
- `src/hooks/observers/delegation-consumer.ts` — Hook registration pattern (factory → SDK subscription → dispose)
- `src/hooks/types.ts` — Hivemind hook type definitions; `createPaneMonitorHook` follows the same shape
- `src/plugin.ts` — Composition root; 1 call site for `createPaneMonitorHook` registers hook output into the hooks array

### Retroactive Rewrite Targets
- `.planning/phases/42-tmux-visual-orchestration-layer-fork-extension/UAT.md` — Gains `## L1 Backing (P53)` section (≥ 5 lines, 0 removed)
- `.planning/phases/43-tmux-co-pilot-model-orchestrator-intervention/VERIFICATION.md` — Gains `## L1 Backing (P53)` section (≥ 5 lines, 0 removed)

### Project-wide Governance
- `AGENTS.md` (repo root) — Atomic commits, JSDoc mandated, `[Harness]` prefix, max 500 LOC
- `.planning/AGENTS.md` §7 — CP-PTY runway note: P53 is hook-only (new file), automatically satisfies the "no `src/**` mutation for CP-PTY runway" rule
- `.planning/AGENTS.md` (planning/AGENTS.md) §2 — Allowed mutation authority for planning artifacts (L5 docs-only)
- Q6 locked decision — `.hivemind/` is canonical state root; `.opencode/` is OpenCode-primitives-only
- D-04 (P50/P51) — Graceful-fallback contract: no throw on missing prerequisites
- R-P50-03 (spirit) — `.hivemind/journal/*` is local runtime state, never committed

</canonical_refs>

<specifics>
## Specific Ideas

No specific requirements beyond the locked SPEC — open to standard approaches. The implementer follows well-established patterns from `src/hooks/observers/event-observers.ts` and `src/hooks/observers/delegation-consumer.ts`. The 12 decisions above resolve all gray areas surfaced during discuss-phase.

</specifics>

<deferred>
## Deferred Ideas

- **`session-state-changed` hook subscription** — Deferred to P54 (D-53-12). P54 introduces session persistence + restart-recovery, which is the natural scope for the `onSessionStateChanged` consumer. Adding it in P53 would be scope creep and would require the journal schema to evolve.
- **Content body persistence** — The journal entry stores `contentLength` but not the full pane content. Storing the full content would inflate the journal and trigger the rate limit faster. Out of scope; a separate "full-capture journal" could be added in a later phase if needed.
- **Journal rotation / archival** — The `.hivemind/journal/<sessionId>/` directory grows unbounded within an hour (100 entries cap, but no rotation across hours). A future phase could add `journal-rotate` to compress old entries to a tarball.
- **Cross-session aggregation tools** — The journal is per-session by design (D-53-02). A future sidecar dashboard (separate roadmap track) could aggregate across sessions for the observability layer.
- **BATS socket teardown assertion** — D-06 (P51) established PID-based tmux socket teardown. The P53 BATS scenario (`55-pane-monitor-journal-capture.bats`) does not need a tmux server (it fires a synthetic `PaneCapturedEvent` directly into the hook), so D-06 does not apply.

</deferred>

---

*Phase: 53-live-pane-monitoring-hook-journal-integration*
*Context gathered: 2026-06-02*
*Checkpoint 5 (CONTEXT & ASSUMPTIONS) complete — 12 decisions locked, ready for Checkpoint 6 (RESEARCH) or Checkpoint 7 (PATTERNS)*
