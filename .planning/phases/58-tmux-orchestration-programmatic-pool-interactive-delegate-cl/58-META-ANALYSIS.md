# Phase 58: Meta-Analysis — Why 4 User-Visible Symptoms Persisted Through P42–P58

**Researched:** 2026-06-04
**Domain:** Hivemind tmux-delegation layer (`.planning/phases/42-58`) + spec/verification process
**Confidence:** HIGH — meta-pattern reproduces across 8+ phases with file:line evidence
**Evidence level:** L5 documentation (planning/governance sector per `.planning/AGENTS.md`)

---

## 1. Phase Timeline Table

| Phase | Date | REQ Count | Verification Gate | User-Pain Awareness | Status |
|-------|------|-----------|--------------------|----------------------|--------|
| **P42** Tmux Visual Orchestration Layer (fork extension) | 2026-05-31 | 5 REQs (`42-SPEC.md:32-58`) | UAT.md `42-tmux-visual-orchestration-layer-fork-extension/UAT.md` (later downgraded to L5 per P49 close-pivot) | **PARTIAL** — Goal names "human sees subagent output" (inherited from seed) but the 5 REQs (REQ-42-01..05) are pure internal-contract (config keys, pane title format, factory wiring, server-mode auto-init, silent fallback). NO REQ mentions user-actor interaction. | ✅ shipped, UAT downgraded to L5 per `49-CLOSE-PIVOT-2026-06-02.md:4` |
| **P43** Co-pilot Model — Orchestrator Intervention | 2026-05-31 | 5 REQs (`43-SPEC.md`) | `43-VERIFICATION.md` (L1+L2 evidence; W-01..W-04 spec-drift items RESOLVED at commit `0a501582` per `53-SPEC.md:13`) | **PARTIAL** — Goal mentions "send-keys" and "co-pilot mode" but permission gate at `src/tools/tmux-copilot.ts:51-56` (now lines 56-63 per P49) restricts to orchestrator-tier agents only. User-actor path is gated OUT. | ✅ shipped, L1 evidence |
| **P44** Tool Intelligence Capability Layer | 2026-05-31 | (see `P44-tool-intelligence-capability-layer/`) | P44 VERIFICATION | **NOT MENTIONED** — P44 is unrelated to tmux/delegation user pain. | ✅ shipped |
| **P45** Vendor Sync Script | 2026-06-01 | 5 REQs (`45-01-PLAN.md`) | 3 BATS scenarios (fast-forward, 3-way merge, conflict) | **NOT RELEVANT** — vendor sync is infra, not user-pain adjacent | ✅ shipped |
| **P46** Build Pipeline + **P47** Install Docs + **P48** CI/CD | 2026-06-01 | TBD | TBD | **NOT RELEVANT** — infra only | 📋 planned |
| **P49** tmux-e2e-completion (close tmux E2E gap) | 2026-06-01 to 2026-06-02 | TBD | 3 BATS pass evidence at `49-CLOSE-PIVOT-2026-06-02.md`; **L4 live session deferred per user override**; P42/P43/P45 paperwork gaps DOWNGRADED to L5; **UAT SKIPPED** | **MISSED** — "register tmux-copilot in plugin.ts" is a wiring task, not a user-pain resolution. The seed's user-facing "human can see + human can intervene" criteria (`.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md:13-16`) are NOT addressed in P49's 9 sub-tasks (`ROADMAP.md:1935-1943`). | ✅ closed via pivot document |
| **P50** Cleanup opencode-tmux fork | 2026-06-02 | 3 REQs (REQ-04, REQ-05, REQ-07 per `50-01-PLAN.md`) | `50-CLOSE.md`: tsc exit 0, vitest 3,102/3,102 pass, grep returns 0 matches | **NOT RELEVANT** — removal/fork pivot only | ✅ shipped |
| **P51** Synthesize core tmux classes in-tree | 2026-06-02 | 3 REQs (REQ-04, REQ-05, REQ-07) | `51-CLOSE.md`: 7/7 EARS PASS, 80/80 vitest, 26/26 BATS | **NOT ADDRESSED** — `src/features/tmux/{tmux-multiplexer,session-manager,grid-planner}.ts` provide infrastructure primitives. NONE of them have a user-actor affordance. The `fork-bridge.ts` no-op stub is replaced with real classes, but the user-actor gap is preserved. | ✅ shipped |
| **P52** Wire tmux-copilot + state query | 2026-06-02 | 4 REQs (`52-SPEC.md:32-43`) | `52-CLOSE.md`: 4/4 EARS PASS, 11/11 P52 BATS, 26/26 P51 BATS regression, 3144/3144 vitest, 27 tool keys | **EXCLUDED S2** — `52-SPEC.md:63` "Permission gate: only orchestrator-tier agents... may invoke tmux tools" — explicitly gates OUT the user. The `tmux-state-query.ts` tool added at `52-SPEC.md:32-36` is also orchestrator-only. The SPEC's "Out of scope" (`52-SPEC.md:55-59`) does NOT mention "user-actor" at all. | ✅ shipped |
| **P53** Live pane monitoring hook | 2026-06-02 | 5 REQs (`53-SPEC.md:26-51`) | `53-CLOSE.md`: 5/5 EARS PASS, 40/40 BATS regression, 4/4 P53 vitest | **EXCLUDED S1 + S4** — Goal at `53-SPEC.md:9` is "writes structured journal entries to `.hivemind/journal/<sessionId>/<ISO-timestamp>-pane.json`". NO mention of "live streaming to user TUI" or "real-time event push to user". REQ-53-01..04 are about journal file persistence (`53-SPEC.md:26-46`); REQ-53-05 is retroactive paperwork (`53-SPEC.md:47-50`). The P55 `EARS` table at `55-SPEC.md:16` lists P53 as the "live pane monitoring" deliverable — but the test (BATS slot 55/57) only verifies file-on-disk, not user-visible stream. | ✅ shipped |
| **P54** Session persistence + restart-recovery | 2026-06-02 | 5 REQs (REQ-54-01..05 per `54-SPEC.md`) | `54-CLOSE.md`: 5/5 EARS PASS, kill-parent-restart L1 BATS (slot 56), 3203/3203 vitest | **NOT ADDRESSED** — `54-SPEC.md` covers `state: "paused"` state machine; nothing about user-actor. | ✅ shipped |
| **P55** E2E UAT against seed's 4 success criteria | 2026-06-02 to 2026-06-03 | 4 REQs (REQ-55-01..04 per `55-SPEC.md:46-107`) | `55-CLOSE.md`: 4/4 EARS PASS, **GATE 4/4 PASS** (seed germinated), 5/5 BATS scenarios pass (1+1+2+1), 46/46 BATS regression, 3203/3203 vitest | **EXCLUDED ALL 4 SYMPTOMS** — see Section 2 below. P55 was the E2E user-acceptance-test phase; its 4 success criteria were translated from the seed's USER-FACING criteria (`.planning/seeds/.../tmux-visual-orchestration-layer-2026-05-31.md:33-36`) into INTERNAL-CONTRACT criteria (`55-SPEC.md:14-19`). The "E2E" was harness-internal E2E, not user-experience E2E. **No real user tested anything.** | ✅ shipped, but `58-META-ANALYSIS.md` (this file) re-opens the question |
| **P56** Stress test for real-life tmux use | 2026-06-03 | 7 internal requirements (per `56-SPEC.md:2030-2038`) | BATS slot 61 (`61-stress-test-real-world-workflow.bats`) — **PRE-EXISTING FAIL** (missing helper `tmux_bats_require_stress_facilities` per `58-VERIFICATION.md:9-10`) | **EXCLUDED** — `56-SPEC.md:2031-2038` enumerates internal-contract goals (3+ sub-agents, send-keys to specific panes, journaled pane-captured, persistence, state-query, 27 tool keys). NO mention of user-actor or user-pain. | ⚠️ PARTIAL (slot 61 fails on pre-existing debt) |
| **P57** (empty placeholder) | 2026-06-03 | none | none | n/a | placeholder |
| **P58** Tmux orchestration — programmatic pool + interactive delegate | 2026-06-03 to 2026-06-04 | 6 REQs (REQ-58-01..06 per `58-SPEC.md:32-152`) | `58-VERIFICATION.md:25`: "VERIFIED — Ready to Ship" — 13/13 ACs, 6/6 BATS, 3310/3310 vitest | **EXCLUDED S1 + S3 + S4** — `58-SPEC.md:13` "It is production-readiness hardening of the P55-germinated tmux layer; it does not introduce new surfaces" + `58-SPEC.md:170-181` 11-item Out-of-scope list (no new modules, no new tool keys, no new SDK, no new plan mode, no sidecar, no multi-user, no auto-refresh, no toast migration, no enum changes, no new storage). Symptom 1 (live panel content streaming), Symptom 3 (orchestrator stream keep-alive), and Symptom 4 (live JIT context) all require new surfaces — explicitly excluded. **P58 only partially addresses Symptom 2** (S2) via G4 (forward-prompt, orchestrator-only) and G5 (take-over/release, orchestrator-only) at `58-SPEC.md:86-130`; user-actor case is excluded by `58-SPEC.md:13` "no new tools" and by P52's permission gate (`52-SPEC.md:63`). | ✅ shipped, 4/4 user symptoms OUT-OF-SCOPE per `p58-symptom-diagnosis-2026-06-04.md:6` |

---

## 2. Recurring Exclusion Pattern

The 4 user-visible symptoms (S1-S4) are defined in `p58-symptom-diagnosis-2026-06-04.md:14-17` and `tmux-delegate-streaming-gaps.md:13-36`. For each phase, here is the EXACT SPEC wording that excluded one or more symptoms.

### P52 SPEC (2026-06-02) — **EXCLUDED S2 (user→child affordance)**

- **Goal** (`52-SPEC.md:8-9`): "Keep the public contract of `src/tools/tmux-copilot.ts` **identical**... add a read-only `src/tools/tmux-state-query.ts` tool exposing session metadata." — User-actor is not mentioned.
- **REQ-52-02 (state query tool)** (`52-SPEC.md:32-36`): "Create `src/tools/tmux-state-query.ts` — a read-only tool exposing session metadata via 3 actions (`list-sessions`, `get-session`, `get-summary`)." — Tool is for orchestrator-actor, no user-actor path.
- **Constraints** (`52-SPEC.md:62-67`): "Permission gate: only orchestrator-tier agents (`hm-l0-orchestrator`, `hm-orchestrator`, `hf-l0-orchestrator`, `hf-l1-coordinator`) may invoke tmux tools." — **Explicit user-actor exclusion.**
- **Out of scope** (`52-SPEC.md:55-59`): 5 items, none mention "user" or "operator" or "human". S2 is not even in the conversation.

### P53 SPEC (2026-06-02) — **EXCLUDED S1 (live panel streaming) + S4 (live JIT context)**

- **Goal** (`53-SPEC.md:9`): "Add a new hook `src/hooks/pane-monitor.ts` that subscribes to `pane-captured` events... writes structured journal entries to `.hivemind/journal/<sessionId>/<ISO-timestamp>-pane.json`." — Goal is **file persistence**, not live streaming.
- **REQ-53-02 (journal entry)** (`53-SPEC.md:32-35`): "Each event produces exactly one file" with 7 fields. The acceptance test (BATS slot 55) asserts `jq -r .paneId <file>` matches the live pane (`53-SPEC.md:36`). Test verifies disk artifact, NOT user-visible stream. The `pane-captured` event in P52 (`52-SPEC.md:38-39`) carries `{ sessionId, paneId, contentLength, timestamp }` — note **no `content` field**, so the journal file's `contentPreview` is hard-coded to `""` per `53-SPEC.md:35`. S1 (live stream) is structurally impossible from this design.
- **Out of scope** (`53-SPEC.md:65-71`): 7 items. The closest is "Sidecar dashboard rendering of journal entries (separate downstream scope)" — but this is *dashboard* rendering, not *TUI panel* rendering. S1 is not addressed.

### P54 SPEC (2026-06-02) — **EXCLUDED S3 (main stream keep-alive)**

- **Goal** (`54-SPEC.md:2003-2005` per ROADMAP): "Implement persistent session metadata... serialized on every state transition (`active → ready → paused → detached → failed`)." — Goal is state persistence, not main-stream keep-alive.
- **State machine** (`54-SPEC.md:2003-2005`): `state: "paused"` literal added to `SessionState` union. None of the state transitions relate to "orchestrator main loop active while delegations in flight" (which is what S3 requires).

### P55 SPEC (2026-06-02) — **EXCLUDED ALL 4 SYMPTOMS** (the "E2E UAT" phase)

- **Seed's user-facing success criteria** (`.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md:33-36`):
  1. "Human can see all active subagent sessions in Tmux panes"
  2. "Human can prompt orchestrator to intervene in specific sessions"
  3. "Sessions survive parent process restart"
  4. "Orchestrator can query Tmux state for delegation decisions"

- **P55 SPEC's translated criteria** (`55-SPEC.md:14-19`):
  1. "**Live pane monitoring** — harness shows live content of all agent tmux panes" — translated from "Human can see" to "harness shows". The test (BATS slot 57 per `55-SPEC.md:51-58`) asserts journal file existence, NOT user-visible TUI rendering.
  2. "**Orchestrator intervention** — orchestrator can `send-keys` to any pane" — translated from "Human can prompt" to "orchestrator can". The test (BATS slot 58 per `55-SPEC.md:65-75`) asserts `sendKeys` delivers text to a tmux pane, NOT that a human invoked it. The 4-action test uses `TmuxMultiplexer` directly (`55-SPEC.md:69`), bypassing the `tmux-copilot` permission gate that would block user-actor.
  3. "**Session persistence** — harness restart preserves `paused`/`detached` sessions" — same as seed.
  4. "**Visual dependency graph** — delegation tree renders as a pane grid (DFS via P51 `grid-planner.ts`)" — translated from "Orchestrator can query Tmux state" to "delegation tree renders as pane grid". The test (BATS slot 60 per `55-SPEC.md:99-107`) asserts `tmux split-window` produces a 5-pane layout — not that a human sees the grid.

- **The P55 "E2E" was HARNESS-INTERnal E2E**, not user-experience E2E. The phrase "E2E" appears 47 times in `55-SPEC.md` but refers exclusively to "module integration E2E" (P51 module + P52 module + P53 module + P54 module working together). It does NOT mean "user-end-to-end".

- **Manual L2 evidence** (`55-SPEC.md:11`, `55-SPEC.md:118-119`): "manual L2 evidence pass (screenshots of the tmux grid + journal entries) is captured in `55-E2E-UAT-2026-06-02.md`". The "screenshots" are "text-described" (`55-E2E-UAT-2026-06-02.md:222` and `:250`) — there are no actual screenshot images. No real user ran the harness.

### P58 SPEC (2026-06-03) — **EXCLUDED S1 + S3 + S4, PARTIALLY ADDRESSED S2**

- **Line 13** (the "smoking gun"): "It is production-readiness hardening of the P55-germinated tmux layer; it **does not introduce new surfaces**."
- **Out of scope** (`58-SPEC.md:170-181`): 11 items, including "No new `src/features/tmux/*.ts` modules", "No new tool registrations in `src/plugin.ts`", "No new `package.json` dependencies", "No SDK upgrade", "No new plan mode for delegated agents", "**No sidecar-driven tmux projection (SC-04, SC-05)**", "No multi-user session concurrency".
- **S1 (live panel content streaming)**: Requires SDK event subscription (per `p58-symptom-diagnosis-2026-06-04.md:137-138`) — would be a new surface. Excluded by "no new surfaces" + "No SDK upgrade".
- **S3 (main stream ends early)**: Per `p58-symptom-diagnosis-2026-06-04.md:149` "27-tool-key invariant: cannot add a tool to keep the main stream open without breaking the tool surface contract" + per `58-SPEC.md:13` "no new surfaces" + per `58-SPEC.md:185` "No new tool keys" — excluded.
- **S4 (no live JIT context)**: Per `p58-symptom-diagnosis-2026-06-04.md:150` "Requires SDK event subscription (S1 fix) or a new polling tool (new surface). Both out-of-scope" — excluded.
- **S2 (user→child affordance)**: PARTIALLY addressed via G4 `forward-prompt` (`58-SPEC.md:86-107`) and G5 `take-over`/`release` (`58-SPEC.md:109-130`). But the permission gate at `58-SPEC.md:185` "still 27 tool keys" + the inherited P52 gate at `52-SPEC.md:63` restrict these to orchestrator-actor only. User-actor invocation requires either (a) widening the gate, or (b) a new user-facing tool — both excluded by P58's "no new surfaces" + "no new tool keys" + P52's permission gate.

---

## 3. Verification Gate Failure

### The Pattern: BATS verified the spec, not the user experience

All 11 BATS scenarios that "passed" across P55 (5 scenarios) + P58 (6 scenarios) verified **internal contract** behavior, not user-experience.

| BATS Slot | Phase | What it verified | What it DID NOT verify |
|-----------|-------|-------------------|--------------------------|
| 55 (P53) | P53 | Journal file written with 7 fields | That a human sees pane content live |
| 57 (P55) | P55 | Journal entry has `paneId` matching live tmux pane | That a human sees pane content live (still L5) |
| 58 (P55) | P55 | `TmuxMultiplexer.sendKeys` delivers text to a `cat` process | That a human can invoke a tool from their TUI (test bypasses `tmux-copilot` permission gate at `55-SPEC.md:69` and `55-E2E-UAT-2026-06-02.md:96-98`) |
| 59 (P55) | P55 | `restoreAll()` returns `paused`/`detached` records | That a human can observe the orchestrator's main stream stay open (S3) |
| 60 (P55) | P55 | `PaneGridPlanner` emits 4 SplitCommands | That a human can SEE the 5-pane grid (the L2 "text-described" screenshot at `55-E2E-UAT-2026-06-02.md:222-230` is ASCII, not a real screenshot) |
| 61-67 (P58) | P58 | 6 internal-contract assertions (grep guard, frozen pool, abort+resume, forward-prompt sentinel, takeover/release, 3 lifecycle events) | S1 (panel cut-off), S3 (stream ends), S4 (no JIT). S2 (user affordance) is verified for **orchestrator-actor** only via `forward-prompt` (BATS 64) and `takeover-release` (BATS 65) — the test invokes `tmux-copilot` with orchestrator agent context per `58-VERIFICATION.md:47-48`. |

### P55 was supposed to run REAL UAT — what happened?

- **P55 SPEC promises** (`55-SPEC.md:10`): "A separate **manual L2 evidence pass (screenshots of the tmux grid + journal entries)** is captured in `55-E2E-UAT-2026-06-02.md`."
- **What was actually captured** (`55-E2E-UAT-2026-06-02.md:222-230`, `:252-264`): ASCII text-described screenshots ("text-described 5-pane DFS layout (tree-style, the L2 evidence per D-55-09)"). No actual image file. No user account of "I ran the harness and saw X".
- **The 55-E2E-UAT report's verdict line** (`55-E2E-UAT-2026-06-02.md:484`): "No flags. No blockers. **No human verification required**." This is the proof: P55 explicitly stated that no human verification was required.
- **The seed's gate logic** (`55-SPEC.md:120`, `55-E2E-UAT-2026-06-02.md:266-272`): 3/4 PASS = advance. The seed itself was structured so that internal-contract evidence could pass the gate without user-experience evidence.

### Why BATS cannot catch user pain

- BATS tests are written against the SPEC's REQs, not against user-reported symptoms.
- BATS tests are authored by the same agent that wrote the SPEC (the `gsd-executor` or `gsd-planner`), creating a closed feedback loop.
- BATS scenarios invoke the harness programmatically; they cannot exercise the user's TUI session, the user's tmux pane focus, the user's intent to mid-flight intervene.
- The "manual L2" step was allowed to be text-described per `D-55-09` (`55-SPEC.md:172`) — meaning L2 evidence can be ASCII art, not a real user account.

---

## 4. Root Cause (One Sentence, Source-Backed)

**Specs at this codebase are written from the DEVELOPER's internal-contract perspective, not the USER's pain perspective, because the gsd-spec-phase skill (`.claude/skills/gsd-spec-phase/SKILL.md:1-29`) and the spec template (`.claude/get-shit-done/templates/spec.md:25-99`) define Goal / Requirements / Boundaries / Acceptance Criteria in terms of "what the system delivers" and "what the verifier checks" — neither section requires the author to enumerate the user-pain symptoms the phase defers, so the symptom-exclusion decisions are invisible to the spec reader and to the verifier; the user-pain backlog (the 4 S1-S4 symptoms) was not carried forward from `.planning/seeds/tmux-visual-orchestration-layer-2026-05-31.md:33-36` into P49-P58 SPECs (P49's 9 sub-tasks at `ROADMAP.md:1935-1943` are pure wiring; P50-P54 are pure infrastructure; P55's "E2E" is harness-internal; P58's "no new surfaces" `58-SPEC.md:13` is the final gate that closes the door on the 4 symptoms).**

---

## 5. 3 Process Changes to Prevent Recurrence

### Change 1: User-Pain Acknowledgement Section in SPEC.md (mandatory)

**Trigger:** Fires during `gsd-spec-phase` (`.claude/skills/gsd-spec-phase/SKILL.md:1-29`) at SPEC.md writing time, after Requirements and before Boundaries.

**Procedure (4 steps):**
1. **Fetch the user-pain backlog.** Maintain a file `.planning/USER-PAIN-BACKLOG.md` with dated entries of the form `## S{n} ({date}): {user-stated symptom} — Source: {debug report or repro}` (initial entries: S1-S4 from `p58-symptom-diagnosis-2026-06-04.md:14-17` and `tmux-delegate-streaming-gaps.md:13-36`).
2. **Append a `## User-Pain Coverage` section to every SPEC.md** with the structure:
   ```
   ## User-Pain Coverage
   - [ ] S1 (panel cut-off): [addresses | defers-to-P{N} | not-relevant] — {1-line reason}
   - [ ] S2 (no user→child affordance): ...
   - [ ] ... (one row per open symptom in the backlog)
   ```
3. **The spec-phase gate** at `.claude/skills/gsd-spec-phase/SKILL.md:50-60` is extended to require this section before SPEC.md commit. If any open symptom is "defers-to-P{N}" with `N > current`, an explicit cross-link to that follow-up phase's SPEC is required.
4. **Verifiers** (the `gsd-verifier` role) must check this section at the SPEC audit step (not just at the AC walk-through). A missing section is a HARD FAIL.

**Tool/artifact to create:**
- `.planning/USER-PAIN-BACKLOG.md` (initial entries: S1, S2, S3, S4 with citations).
- Update `.claude/skills/gsd-spec-phase/SKILL.md` Step 4 ("Generate SPEC.md") to mandate the new section.
- Update `.claude/get-shit-done/templates/spec.md` (the "File Template" block at `:18-99`) to include `## User-Pain Coverage` as a required heading.

**Example application to P58 gap-fix:** P58's `58-SPEC.md` (now under re-ship) would have a mandatory section like:
```
## User-Pain Coverage
- [x] S1 (panel cut-off): defers-to-P58.1 — REQ-58-04 (forward-prompt) does not address content streaming; new SDK subscription required (per p58-symptom-diagnosis-2026-06-04.md:126-128)
- [x] S2 (no user→child affordance): PARTIALLY addressed — G4/G5 are orchestrator-only; user-actor requires new tool (per p58-symptom-diagnosis-2026-06-04.md:33-42)
- [x] S3 (main stream ends early): defers-to-P58.3 — 27-tool-key invariant blocks fix (per p58-symptom-diagnosis-2026-06-04.md:43-53)
- [x] S4 (no live JIT): defers-to-P58.1 — requires SDK event push (per p58-symptom-diagnosis-2026-06-04.md:54-64)
```
Without this section, P58 would have shipped without anyone reading the existing diagnosis report and noting the deferrals.

**Rollback plan if it fails:** The section is a 5-line addition. If it produces no signal (e.g., SPEC authors just check boxes without thought), the **Change 2** (human-driven UAT) catches the symptoms independently. Both changes are cheap and complementary; the cost of having one fail is bounded by the other.

---

### Change 2: Human-Driven UAT Step in VERIFICATION.md (mandatory, not BATS-replaceable)

**Trigger:** Fires during `gsd-verify-work` (after the BATS regression is green, before the "READY TO SHIP" verdict). The trigger condition is: the phase touches any tool surface that a user invokes (L1 surfaces per the CQRS model in `.planning/codebase/ARCHITECTURE.md`).

**Procedure (5 steps):**
1. **Identify user-facing surfaces.** The phase's SPEC.md and CONTEXT.md are scanned for tool names and tool actions that are reachable from the user's TUI session (not just the orchestrator's tool-call path). For Hivemind, the user-facing surfaces are: the user's TUI input field, the user's tmux pane focus, the user's CLI (if any), the sidecar dashboard (per SC-04/SC-05 when built).
2. **Author a `## Human-Driven UAT` section in VERIFICATION.md** with the structure:
   ```
   ## Human-Driven UAT
   **Date:** {date}
   **Tester:** {human user name — not "gsd-verifier" or "gsd-executor"}
   **Surfaces tested:** {list of user-facing surfaces from step 1}
   **Procedure:** {numbered steps the tester actually performed}
   **Verdict:** PASS | FAIL | PARTIAL — {1-line reason per symptom tested}
   ```
3. **The "Human-Driven UAT" verdict is REQUIRED to be PASS or PARTIAL-with-explicit-follow-up.** A missing section is a HARD FAIL. A verdict of FAIL is a HARD FAIL (the phase does not ship).
4. **The user-driven UAT is run AFTER all BATS + vitest + tsc pass.** It is the final gate, not a parallel gate. This guarantees that no phase ships on BATS alone.
5. **For phases with no user-facing surfaces** (pure internal refactors), the section is marked "N/A — phase has no user-facing surface changes" and skipped. The verifier confirms this is correct.

**Tool/artifact to create:**
- Update `.claude/skills/gsd-verify-work/SKILL.md` (or its workflow file) to require the `## Human-Driven UAT` section.
- The P55 BATS-vs-human-UAT distinction is the prototype: P55 ran 5 BATS + 1 text-described "screenshot" + "No human verification required" (`55-E2E-UAT-2026-06-02.md:484`). The new process requires a real tester entry.

**Example application to P58 gap-fix:** The P58 re-ship (P58.1, P58.2, P58.3) VERIFICATION.md would have a `## Human-Driven UAT` section where the human user:
- (P58.1) Opens the user's TUI, runs `delegate-task`, switches to the tmux pane, asserts "I see all child messages streaming in real time, not just the first prompt" — PASS/FAIL per S1.
- (P58.2) Opens the user's TUI, invokes `tmux-copilot forward-prompt` or equivalent from the USER session, asserts "I can send a prompt to a running child session without going through the orchestrator" — PASS/FAIL per S2.
- (P58.3) Opens the user's TUI, runs `delegate-task` with 3+ dispatches, asserts "My main stream stays open while delegations run; I can ask 'progress?' and get an answer" — PASS/FAIL per S3.
- (P58.1) Same as S1 plus "I can see what tools the child is invoking" — PASS/FAIL per S4.

**Rollback plan if it fails:** The section is metadata only (no code change). If human-driven UAT is too expensive, the fallback is a 24-hour cooling-off period where the SPEC + BATS + vitest are visible to the user for 24h before ship. This catches the "no one noticed" failure mode at the cost of timeline.

---

### Change 3: Symptom Coverage Matrix in ROADMAP.md (mandatory, maintained)

**Trigger:** Fires during every ROADMAP.md update (any phase close that touches ROADMAP). The matrix is a single section in ROADMAP.md that traces each user-reported symptom to the phase that owns fixing it.

**Procedure (3 steps):**
1. **Append a `## Symptom Coverage Matrix` section to `ROADMAP.md`** with the structure:
   ```
   ## Symptom Coverage Matrix
   | Symptom | First Reported | Owned Phase | Status | Last Updated | Source |
   |---------|----------------|-------------|--------|--------------|--------|
   | S1 (panel cut-off) | 2026-06-04 | P58.1 | OPEN | 2026-06-04 | p58-symptom-diagnosis-2026-06-04.md:14 |
   | S2 (user→child affordance) | 2026-06-04 | P58.2 | OPEN | 2026-06-04 | p58-symptom-diagnosis-2026-06-04.md:15 |
   | S3 (stream ends early) | 2026-06-04 | P58.3 | OPEN | 2026-06-04 | p58-symptom-diagnosis-2026-06-04.md:16 |
   | S4 (no live JIT) | 2026-06-04 | P58.1 | OPEN | 2026-06-04 | p58-symptom-diagnosis-2026-06-04.md:17 |
   ```
2. **Every SPEC.md's User-Pain Coverage section** (Change 1) cross-references the Symptom Coverage Matrix by phase number. If a SPEC defers a symptom to a phase that does not exist in the matrix, the spec-phase gate fails.
3. **The matrix is updated atomically** with each phase's close. A phase cannot close (mark `[x]` in ROADMAP) without a corresponding matrix update.

**Tool/artifact to create:**
- Append `## Symptom Coverage Matrix` to `.planning/ROADMAP.md` (after line 2070, before EOF).
- Update `.claude/skills/gsd-update/SKILL.md` (or its workflow file) to require the matrix update as part of ROADMAP.md close.

**Example application to P58 gap-fix:** When the gap-fix phase (P58.1, P58.2, P58.3) is added to ROADMAP, the matrix rows for S1, S2, S3, S4 will be updated to point to these new phases. When P58.1 ships, the S1 row status changes to RESOLVED. The matrix becomes the canonical source of truth for "which phase is fixing what user pain".

**Rollback plan if it fails:** The matrix is a single markdown section. If the matrix becomes stale, the **Change 2** (human-driven UAT) catches the missing fix independently. If the matrix becomes too noisy, it can be moved to `.planning/SYMPTOM-COVERAGE.md` and the ROADMAP.md section replaced with a one-line link.

---

## 6. Linkage to Current Gap-Fix Plan

This meta-analysis informs the P58 gap-fix effort (PLAN-08 + PLAN-09 per `58-CLOSE.md:18` and the two team diagnoses at `.planning/debug/p58-symptom-diagnosis-2026-06-04.md:154-157` and `.planning/debug/tmux-delegate-streaming-gaps.md:300-356`):

- **The 3 process changes should be added as REQ-58-META in the updated P58 SPEC** (when the gap-fix updates `58-SPEC.md`). REQ-58-META would be 1 new requirement, with 3 sub-acceptance criteria (one per process change). This forces the gap-fix to address the meta-pattern, not just the 4 symptoms.
- **The gap-fix plans (PLAN-08, PLAN-09) must include the process changes** as plan tasks. Each plan should have a "process" section that creates `.planning/USER-PAIN-BACKLOG.md`, appends the Symptom Coverage Matrix to ROADMAP.md, and updates the gsd-spec-phase skill.
- **The verification gate for P58 re-ship must be REAL UAT (human-driven, not BATS).** The P58 re-ship VERIFICATION.md must have a `## Human-Driven UAT` section where the human user (the front-facing operator who filed the original complaint) signs off on the 4 symptoms being fixed. The BATS regression is necessary but not sufficient.
- **Without these process changes, the next phase (P58.1, P58.2, P58.3) will repeat the same exclusion pattern** because the SPEC.md template, the gsd-spec-phase skill, and the BATS-gate-as-evidence workflow all remain unchanged. The 4 symptoms will be replaced by 4 NEW symptoms that the next round of SPECs also exclude.

---

*Meta-analysis by hm-phase-researcher (subagent), 2026-06-04*
*Artifact: 58-META-ANALYSIS.md*
*Evidence level: L5 (planning/governance docs only; runtime claims require L1+ proof from gsd-verifier)*
