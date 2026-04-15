# Real OpenCode SDK Runtime Adapter Master Plan

> Date: 2026-04-15
> Mode: master orchestration guide
> Status: proposed for execution
> Scope: execute full Option 2 now, preserve clean seams for Option 3 later, and reconcile misleading regression artifacts from Phases 09–13

## Mission

Restore `delegate-task` against the **real OpenCode SDK/runtime contract** by landing the full Option 2 adapter fix end-to-end, proving it with live runtime evidence, then hardening the code/tests/docs so future work starts from truthful artifacts instead of mock theater or stale summaries.

## Non-Negotiable Execution Rules

1. **Live runtime truth outranks mocks, summaries, and prior claims.**
2. **`session.status()` is runtime truth; `session.get()` is metadata truth.**
3. **`promptAsync()` acceptance is dispatch acknowledgment only, never proof of meaningful work.**
4. **A cycle is not complete if it only passes mocked/unit verification.**
5. **Cleanup/archive work must preserve forensic traceability; quarantine or archive, do not silently erase history.**
6. **Option 3 readiness means preserving seams, not partially implementing event-stream architecture now.**

## Trusted vs Untrusted Inputs at Start

### Trusted enough to execute from
- `docs/superpowers/specs/2026-04-15-real-opencode-sdk-runtime-adapter-design.md`
- `docs/superpowers/specs/2026-04-15-delegate-task-single-path-recovery-design.md`
- `docs/superpowers/plans/2026-04-15-delegate-task-single-path-recovery.md`
- current code in `src/lib/session-api.ts`, `src/lib/lifecycle-background-observer.ts`, `src/lib/result-capture.ts`, `src/lib/tasking/completion/*`
- current regression indicators in `.planning/STATE.md`, `.planning/ROADMAP.md`, `.planning/DELEGATION-AUDIT-REPORT-2026-04-15.md`

### Untrusted until re-proven
- historical completion claims from Phase 09 / 09.1 / 09.2 / 13 that were not backed by real delegated-child runtime evidence
- tests that only prove fantasy message shapes or synthetic lifecycle promotion
- any artifact that implies async delegation is “done” without continuity-backed child output and live smoke validation
- older SSE/event-stream expectations when planning the immediate Option 2 polling-based fix

## Global Dependency / Authorization Map

```text
Cycle 0 -> Cycle 1 -> Cycle 2 -> Cycle 3 -> Cycle 4 -> Cycle 5 -> Cycle 6

Hard gates:
- Cycle 0 must lock trusted truth before code changes are trusted
- Cycle 3 live validation must pass before Cycle 5 can declare cleanup truthfully
- Cycle 5 must finish before Cycle 6 can certify Option 3 readiness

Return loops:
- Cycle 1/2 failure -> revise adapter / lifecycle truth before any broader cleanup
- Cycle 3 failure -> loop back to Cycle 1 or 2 based on whether contract vs evidence is broken
- Cycle 4 failure -> fix tests/coverage only after preserving Cycle 3 live truth
```

## Evidence Classes

| Class | Allowed to prove | Not allowed to prove |
|---|---|---|
| Static code inspection | likely blast radius, seam location | runtime correctness |
| Mocked/unit tests | local logic correctness | real SDK contract correctness |
| Continuity file inspection from live run | persisted lifecycle/result truth | raw SDK shape assumptions on its own |
| Real async `delegate-task` smoke | end-to-end correctness | long-term architecture quality |

---

## Cycle 0 — Truth reset / scope lock

**Goal**  
Reset execution truth so Option 2 work proceeds from authoritative evidence instead of inherited completion theater.

**Why this cycle exists**  
Phases 09–13 left a mixture of useful code, quarantined summaries, stale assumptions, and misleading “complete” language. This cycle prevents poisoned inputs from steering execution.

**Entry criteria**
- current specs/designs are available
- current state/roadmap/debug artifacts are readable

**Key workstreams**
- classify artifacts into: trusted, usable-with-caveat, untrusted, archive candidate
- define the minimum evidence bar for each later cycle
- lock Option 2 boundary: runtime adapter repair now, no partial Option 3 implementation
- identify misleading artifact classes: mock-only verification, stale summaries, superseded architectural assumptions, outdated test expectations

**Main files/areas likely affected**
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/DELEGATION-AUDIT-REPORT-2026-04-15.md`
- Phase 09/12/13 summaries and reconciliation notes
- `docs/superpowers/specs/*.md`, `docs/superpowers/plans/*.md`

**Verification gate**
- one explicit trust matrix exists
- one execution scope statement exists: “Option 2 now, Option 3 later, no blended redesign”
- one list exists of artifact classes that may mislead downstream execution

**Exit criteria**
- orchestrator can name which documents/code paths are authoritative for execution
- historical artifacts that remain readable are marked as non-authoritative where needed

**Rollback / fallback note**
- if truth classification is still disputed, stop here and do not authorize implementation cycles

**Next cycle requires explicit user authorization?**  
**Yes.** This is the scope-lock gate.

---

## Cycle 1 — SDK contract repair

**Goal**  
Align wrappers, parsers, and observer inputs to the **real OpenCode SDK contract** with minimum blast radius.

**Why this cycle exists**  
The current failure is primarily contract mismatch: wrong status source, wrong prompt assumptions, wrong tool-part field assumptions.

**Entry criteria**
- Cycle 0 trust reset approved
- target contract is locked from the 2026-04-15 adapter design

**Key workstreams**
- make `session.status()` the primary runtime-status input
- demote `session.get()` to metadata/existence usage only
- remove forced `parseAs: "text"` path from `sendPrompt()` and accept structured payloads directly
- introduce one normalization path for assistant/tool parts using real fields (`part.tool`, `part.state.input`, `part.state.output`, `part.state.status`)
- preserve minimal blast radius by keeping policy decisions out of transport wrappers

**Main files/areas likely affected**
- `src/lib/session-api.ts`
- `src/lib/result-capture.ts`
- `src/lib/types.ts`
- helper utilities that normalize runtime payloads
- `tests/lib/session-api.test.ts`
- `tests/lib/result-capture.test.ts`

**Verification gate**
- focused unit tests prove wrappers/parsers accept structured prompt output and real-shape tool parts
- no code path still depends on legacy `part.name` / `part.arguments` / `part.output` assumptions as the primary shape

**Exit criteria**
- transport/adaptation layer exposes normalized runtime inputs without lifecycle heuristics
- downstream lifecycle modules can consume one normalized assistant/tool evidence shape

**Rollback / fallback note**
- if SDK/runtime shape observed in code/tests contradicts the approved design, freeze the cycle and update the contract note before touching lifecycle logic

**Next cycle requires explicit user authorization?**  
**No**, unless contract observations force a design revision.

---

## Cycle 2 — Runtime evidence + completion truth

**Goal**  
Repair start/completion semantics so delegated children become `running` and `completed` only from real assistant/tool evidence plus authoritative idle truth.

**Why this cycle exists**  
Even with a correct adapter, the harness still lies if it promotes children from transport acknowledgment or over-constrained fantasy gates.

**Entry criteria**
- Cycle 1 adapter normalization is in place
- normalized evidence shape is available to lifecycle code

**Key workstreams**
- replace reasoning-plus-two-tool-call exclusivity with truthful start evidence rules
- make `lifecycle-background-observer` use `session.status()` as primary runtime signal
- ensure continuity truth is built from persisted assistant/tool evidence, not status churn alone
- fix completion verifier so completion means: authoritative idle + stable evidence that substantive work occurred
- keep dead-start failure semantics explicit for children that were accepted but never actually worked

**Main files/areas likely affected**
- `src/lib/lifecycle-background-observer.ts`
- `src/lib/tasking/completion/start-gate.ts`
- `src/lib/tasking/completion/completion-verifier.ts`
- `src/lib/runtime.ts`
- continuity metadata/evidence types
- observer/completion tests

**Verification gate**
- tests prove `promptAsync()` acceptance alone does not advance to `running`
- tests prove `running`/`completed` decisions are tied to normalized work evidence plus idle stability
- tests prove dead-start timeout still fails no-evidence children truthfully

**Exit criteria**
- continuity status transitions are evidence-driven and runtime-honest
- observer/completion logic tolerates real delegated-child patterns that do useful work without old fantasy heuristics

**Rollback / fallback note**
- if lifecycle truth cannot be expressed cleanly with current completion types, stop and refactor the internal evidence model before adding more tests or cleanup work

**Next cycle requires explicit user authorization?**  
**No.** This still belongs to the same Option 2 execution corridor.

---

## Cycle 3 — Live E2E validation

**Goal**  
Prove the repaired adapter/lifecycle path works against the **real OpenCode runtime**, not just mocks.

**Why this cycle exists**  
This is the decisive truth gate. Without it, Cycles 1–2 are only plausible.

**Entry criteria**
- Cycle 2 logic is complete enough to run live
- build/typecheck/focused tests are green enough to justify smoke testing

**Key workstreams**
- dispatch a real async `delegate-task` child via current runtime
- inspect continuity and parent-visible notification/result flow during and after execution
- run one positive smoke and one controlled low-evidence/negative smoke
- record exact success/failure observations for queue state, running promotion, result capture, and parent recovery

**Main files/areas likely affected**
- live harness runtime via `src/tools/delegate-task.ts`
- continuity store under `.opencode/state/opencode-harness/`
- observer/notification/recovery surfaces
- validation docs or debug records capturing live evidence

**Verification gate**
- success case must show: `queued -> running -> completed|failed` with continuity-backed evidence
- at least one real tool part must be captured using the normalized real shape
- negative case must show: accepted child with no meaningful evidence does **not** count as truly started

**What counts as success**
- parent gets immediate async handle metadata
- child lifecycle advances truthfully from continuity-backed evidence
- persisted result/notification can be read without scraping assumptions

**What counts as failure**
- child still promotes from dispatch acknowledgment only
- result capture depends on legacy tool fields
- completion is claimed without recoverable live evidence
- parent-visible truth disagrees with continuity or live session facts

**Exit criteria**
- real runtime smoke evidence exists and is unambiguous
- orchestrator can say “Option 2 works live” or “Option 2 is not done yet” without hedging

**Rollback / fallback note**
- if smoke fails, stop broader restructuring/cleanup and route back to Cycle 1 or 2 based on whether the miss is adapter-shape or lifecycle-policy related

**Next cycle requires explicit user authorization?**  
**Yes.** This is the live-runtime go/no-go gate.

---

## Cycle 4 — Test suite restructuring / regression hardening

**Goal**  
Restructure tests so they reinforce live contract truth instead of re-encoding fantasy runtime behavior.

**Why this cycle exists**  
Historical tests created false confidence by proving internal assumptions rather than real SDK/runtime behavior.

**Entry criteria**
- Cycle 3 has at least one passing live smoke and one explicit failure-mode observation

**Key workstreams**
- rewrite tests that encode old tool-part or prompt assumptions
- separate pure unit tests, runtime-contract tests, and live/manual smoke procedures
- add regression coverage for normalized tool-part parsing, status-source authority, truthful start promotion, and continuity-backed result capture
- quarantine or remove confidence-theater tests that cannot be made truthful

**Main files/areas likely affected**
- `tests/lib/session-api.test.ts`
- `tests/lib/lifecycle-background-observer.test.ts`
- `tests/lib/result-capture.test.ts`
- `tests/tools/delegate-task.test.ts`
- any live-contract-focused regression helper fixtures

**Verification gate**
- tests explicitly distinguish mocked logic verification from live runtime verification
- no core regression suite still depends on fantasy shapes as the canonical contract
- failed/quarantined tests are documented as intentionally removed or reclassified, not silently dropped

**Exit criteria**
- regression suite aligns with real SDK behavior observed in Cycle 3
- future failures point at real contract regressions rather than stale assumptions

**Rollback / fallback note**
- if rewriting tests would erase useful forensic evidence, quarantine them under an explicit stale/legacy label instead of deleting immediately

**Next cycle requires explicit user authorization?**  
**Conditional.** Not required if changes are test-only hardening; required if major quarantine/removal materially changes historical verification surfaces.

---

## Cycle 5 — Artifact cleanup / archival

**Goal**  
Reconcile planning/debug/history artifacts so the repo truthfully reflects what works, what was superseded, and what remains historical-only evidence.

**Why this cycle exists**  
Even if Option 2 works, stale docs and misleading summaries can recreate the same confusion for the next planner/executor.

**Entry criteria**
- Cycle 3 live truth is established
- Cycle 4 has identified which tests/artifacts remain confidence theater

**Key workstreams**
- update authoritative truth docs (`STATE`, `ROADMAP`, relevant AGENTS/project notes)
- quarantine or archive superseded summaries and design claims that contradict live runtime truth
- preserve forensic lineage for Phases 09–13 while clearly marking non-authoritative claims
- archive stale or misleading architectural noise that implies incorrect execution paths or verification status

**Main files/areas likely affected**
- `.planning/STATE.md`
- `.planning/ROADMAP.md`
- `.planning/PROJECT.md` if required
- `.planning/phases/09*/**/*SUMMARY.md`
- `.planning/phases/12-*/12-reconciliation-note-2026-04-14.md`
- `.planning/debug/*.md`
- `docs/superpowers/plans/*.md`, `docs/superpowers/specs/*.md` where misleading claims remain active
- `AGENTS.md` only if it currently misstates delegation/runtime truth

**Verification gate**
- authoritative docs name Cycle 3 live evidence as the governing truth
- stale artifacts are either archived, quarantined, or rewritten with explicit status labels
- no active planning surface still implies “complete” for work that remains historical or mock-only

**Exit criteria**
- a fresh planner can start from the repo and not be misled about delegate-task runtime status
- historical artifacts remain auditable without masquerading as current truth

**Rollback / fallback note**
- if archival changes risk losing valuable forensic context, prefer quarantine plus cross-links over deletion

**Next cycle requires explicit user authorization?**  
**Yes.** This is the repo-truth reconciliation gate.

---

## Cycle 6 — Option 3 readiness checkpoint

**Goal**  
Confirm the Option 2 fix leaves clean seams for a later event-stream-first redesign without forcing rework across the repaired runtime corridor.

**Why this cycle exists**  
The user wants Option 2 now but does not want today’s fix to box out Option 3 later.

**Entry criteria**
- Cycles 1–5 are complete
- repo truth has been reconciled to the post-Option-2 state

**Key workstreams**
- verify the normalizer is a reusable boundary, not observer-specific glue
- verify transport wrappers remain separate from lifecycle policy
- verify continuity/result persistence remains the durable truth layer independent of polling vs event-stream observation source
- identify the exact seam where a future event-stream observer can replace polling without rewriting result capture or persistence semantics

**Main files/areas likely affected**
- `src/lib/session-api.ts`
- normalized evidence helpers/types
- `src/lib/lifecycle-background-observer.ts`
- continuity/recovery modules
- future-design notes referencing Option 3/event-stream work

**Verification gate**
- one explicit readiness note exists naming what Option 3 can reuse unchanged
- one explicit list exists of what Option 3 should replace later (observation source only, not persistence truth)

**Exit criteria**
- orchestrator can start a later Option 3 plan from a clean seam map instead of reopening Option 2 decisions

**Rollback / fallback note**
- if Option 2 code is still too entangled, stop and extract seams before authorizing any Option 3 planning

**Next cycle requires explicit user authorization?**  
**Yes.** This is the handoff checkpoint into any future Option 3 work.

---

## Routing Rules During Execution

### If Cycle 1 fails
- route back to contract clarification, not lifecycle patching

### If Cycle 2 fails
- route to lifecycle/evidence-policy repair, not broad restructuring

### If Cycle 3 fails
- treat live runtime as final authority and reopen only the failing corridor

### If Cycle 4 reveals many fake tests
- quarantine in batches rather than mixing large test surgery into live runtime debugging

### If Cycle 5 uncovers broader historical contamination
- archive/relabel first, then decide whether a separate history-cleanup tranche is needed

### If Cycle 6 finds no clean Option 3 seam
- do not start Option 3 planning yet; schedule a seam-extraction tranche first

## Recommended Authorization Cadence

1. **Authorize after Cycle 0** — commit to Option 2 execution scope
2. **Auto-continue through Cycles 1–2** — same repair corridor
3. **Authorize after Cycle 3** — live truth gate
4. **Conditional after Cycle 4** — only if large quarantine/removal is needed
5. **Authorize after Cycle 5** — repo-truth reconciliation gate
6. **Authorize after Cycle 6** — before any Option 3 planning or redesign starts

## Completion Standard for This Master Plan

This orchestration succeeds only when:
- Option 2 works against the **real** OpenCode runtime
- continuity-backed truth reflects real delegated-child work
- tests reinforce the real contract instead of fantasy mocks
- stale Phase 09–13 artifacts are no longer able to mislead future execution
- a later Option 3 redesign can swap the observation source without redoing the repaired truth model
