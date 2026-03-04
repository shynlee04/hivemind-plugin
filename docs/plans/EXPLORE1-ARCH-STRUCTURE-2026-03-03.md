# Explore1 — Deep Architecture & Structural Integrity Investigation

> **Document ID:** EXPLORE1-ARCH-STRUCTURE-2026-03-03  
> **Phase:** P4-Explore1  
> **Date:** 2026-03-03  
> **Scope:** Runtime/context/delegation architecture only (no implementation)

---

## 1) Executive Assessment

### Stable (high confidence)

1. **CQRS direction is explicit and mostly enforced in core hooks** via queued write-intent (`queueStateMutation`) in [`createSessionLifecycleHook()`](src/hooks/session-lifecycle.ts:76) and compaction/event flows in [`createCompactionHook()`](src/hooks/compaction.ts:52) and [`createEventHandler()`](src/hooks/event-handler.ts:248).
2. **Session lifecycle domain model is coherent** across start/update/close/resume in [`startSession()`](src/lib/session-engine.ts:113), [`updateSession()`](src/lib/session-engine.ts:236), [`closeSession()`](src/lib/session-engine.ts:376), [`resumeSession()`](src/lib/session-engine.ts:539).
3. **Hierarchy engine has good structural safeguards** (level transition validation, duplicate-id normalization, cursor continuity) in [`addChild()`](src/lib/hierarchy-tree.ts:296) and [`normalizeDuplicateNodeIds()`](src/lib/hierarchy-tree.ts:209).
4. **Compaction reporting/purification path is materially present** with turning points + bounded report generation in [`identifyTurningPoints()`](src/lib/compaction-engine.ts:98) and [`generateNextCompactionReport()`](src/lib/compaction-engine.ts:154).
5. **Staleness library is pure and deterministic** with clean function boundaries in [`isSessionStale()`](src/lib/staleness.ts:13), [`isMemStale()`](src/lib/staleness.ts:63), [`calculateRelevanceScore()`](src/lib/staleness.ts:124).

### Fragile (needs hardening)

1. **Session coherence library reads filesystem directly and synchronously** (`readFileSync`, `existsSync`, `readdirSync`) in [`loadLastSessionContext()`](src/lib/session_coherence.ts:132), which conflicts with “library purity/no side effects” expectation and increases runtime coupling.
2. **State mutation queue logger path binds to `process.cwd()`**, not injected directory, in [`getLogger()`](src/lib/state-mutation-queue.ts:39), creating hidden environment dependency risk.
3. **Compaction engine is architecturally detached from active tool flow**: [`executeCompaction()`](src/lib/compaction-engine.ts:252) appears unreferenced by any tool/hook callsite; runtime compaction behavior is hook-centric in [`createCompactionHook()`](src/hooks/compaction.ts:52).
4. **Potential budget-governance drift due to split responsibility** between lifecycle/system transform and compaction/message-transform channels (not a direct bug, but multi-surface policy risk) across [`createSessionLifecycleHook()`](src/hooks/session-lifecycle.ts:76), [`compileFirstTurnContext()`](src/hooks/session-lifecycle-helpers.ts:359), and [`createCompactionHook()`](src/hooks/compaction.ts:52).
5. **Queue flush adoption is partial by tool surface**: clear usage exists in [`createHivemindSessionTool()`](src/tools/hivemind-session.ts:183), [`createHivemindContextTool()`](src/tools/hivemind-context.ts:31), [`createHivemindSessionMemoryTool()`](src/tools/hivemind-session-memory.ts:61), but this is convention-based and not globally enforced at framework boundary.

---

## 2) Structural Findings with File-Level Evidence

### F1 — CQRS boundary is conceptually strong but enforcement is distributed

- **Evidence**
  - Hook read-intent with queued write in [`createSessionLifecycleHook()`](src/hooks/session-lifecycle.ts:107).
  - Queue semantics and atomic flush in [`flushMutations()`](src/lib/state-mutation-queue.ts:400).
  - Tool-side flush before mutation workflows in [`createHivemindSessionTool()`](src/tools/hivemind-session.ts:183), [`createHivemindContextTool()`](src/tools/hivemind-context.ts:31).
- **Assessment**
  - Strong pattern, but relies on every write-capable tool to remember flush discipline.

### F2 — Session/context stack has multi-channel injection architecture

- **Evidence**
  - System prompt assembly and budget dropping in [`assembleSections()`](src/hooks/session-lifecycle.ts:219).
  - First-turn context pipeline in [`compileFirstTurnContext()`](src/hooks/session-lifecycle-helpers.ts:359).
  - Post-compaction context injection in [`createCompactionHook()`](src/hooks/compaction.ts:103).
- **Assessment**
  - Flexible but introduces policy drift risk (different channels can diverge in dedupe/budget/governance semantics).

### F3 — Hierarchy tree core is structurally robust, but centrality makes it high blast-radius

- **Evidence**
  - Transition guard in [`isValidLevelTransition()`](src/lib/hierarchy-tree.ts:352).
  - Duplicate normalization + cursor remap in [`normalizeDuplicateNodeIds()`](src/lib/hierarchy-tree.ts:209).
  - Heavy consumer footprint declared in module header of [`src/lib/hierarchy-tree.ts`](src/lib/hierarchy-tree.ts).
- **Assessment**
  - Reliable internals; architectural risk stems from broad coupling across lifecycle/governance/compaction flows.

### F4 — Purification primitives are clean, but orchestration is split

- **Evidence**
  - Pure dedupe/fingerprint utilities in [`dedupeContextLines()`](src/lib/context-purifier.ts:29) and [`purifyContextFragments()`](src/lib/context-purifier.ts:49).
  - Purge/consolidation runtime in [`handlePurge()`](src/tools/hivemind-context.ts:80).
  - Compaction-report purification path in [`generateNextCompactionReport()`](src/lib/compaction-engine.ts:154).
- **Assessment**
  - Good building blocks; consolidation policy currently fragmented between compaction and context tooling.

### F5 — Session coherence retrieval has correctness intent but purity drift

- **Evidence**
  - Archived-first recovery intent in [`loadLastSessionContext()`](src/lib/session_coherence.ts:132).
  - Sync FS and JSON parsing operations in same library function (`readFileSync`, `existsSync`) around [`loadLastSessionContext()`](src/lib/session_coherence.ts:150).
- **Assessment**
  - Correct directional logic, but side-effectful IO in lib layer weakens separation and test isolation.

---

## 3) Dependency Flow & Circularity Review (Session/Context Stack)

### Observed flow (current)

1. Hook registration in [`src/index.ts`](src/index.ts:124) wires event + transform + tool hooks.
2. Runtime transforms:
   - System-level in [`createSessionLifecycleHook()`](src/hooks/session-lifecycle.ts:76)
   - Message-level in [`createMessagesTransformHook()`](src/index.ts:163)
   - Compaction-level in [`createCompactionHook()`](src/hooks/compaction.ts:52)
3. Hooks emit queued mutations via [`queueStateMutation()`](src/lib/state-mutation-queue.ts:339) / [`queueTaskManifestMutation()`](src/lib/state-mutation-queue.ts:363).
4. Tools flush queues before write operations in [`flushMutations()`](src/lib/state-mutation-queue.ts:400) / [`flushTaskManifestMutations()`](src/lib/state-mutation-queue.ts:467).
5. Stateful operations continue through session/context tools.

### Circularity status

- **No explicit import-cycle evidence** was found in inspected surfaces.
- **Implicit behavioral loop exists**: event/hook write-intent → queued mutation → tool flush (later turn). If tool execution gaps occur, queue lag accumulates (operational coupling, not static cycle).

---

## 4) Structural Risks (Top 5 Critical)

### R1 (P0) — CQRS leak risk via partial flush discipline

- **Risk**: some tool paths may apply direct saves without guaranteed queue reconciliation sequence.
- **Evidence**: flush present only in certain tools ([`src/tools/hivemind-session.ts`](src/tools/hivemind-session.ts:183), [`src/tools/hivemind-context.ts`](src/tools/hivemind-context.ts:31), [`src/tools/hivemind-session-memory.ts`](src/tools/hivemind-session-memory.ts:61)).
- **Impact**: stale queued state applied late; non-deterministic state snapshots.

### R2 (P0) — Detached compaction engine path

- **Risk**: architectural drift between designed compaction orchestration and runtime behavior.
- **Evidence**: [`executeCompaction()`](src/lib/compaction-engine.ts:252) has no detected callsite in `src/**` search; runtime compaction logic concentrated in [`createCompactionHook()`](src/hooks/compaction.ts:52).
- **Impact**: duplicated semantics, maintenance divergence, ambiguous source-of-truth.

### R3 (P1) — Hidden environment coupling in queue logger

- **Risk**: queue observability bound to ambient process cwd.
- **Evidence**: [`getLogger()`](src/lib/state-mutation-queue.ts:39) uses `getEffectivePaths(process.cwd())`.
- **Impact**: incorrect log destination in non-standard execution contexts.

### R4 (P1) — Library purity violation in session coherence

- **Risk**: libs performing sync IO directly reduce composability and test determinism.
- **Evidence**: synchronous FS APIs in [`loadLastSessionContext()`](src/lib/session_coherence.ts:132).
- **Impact**: harder mocking, potential blocking behavior, boundary erosion.

### R5 (P2) — Context-policy fragmentation across channels

- **Risk**: lifecycle, message-transform, and compaction can enforce different budgets/disclosure rules.
- **Evidence**: budget gate in [`assembleSections()`](src/hooks/session-lifecycle.ts:219), compaction budget enforcement in [`createCompactionHook()`](src/hooks/compaction.ts:223), first-turn compaction bypass in [`compileFirstTurnContext()`](src/hooks/session-lifecycle-helpers.ts:365).
- **Impact**: inconsistent operator experience and governance drift.

---

## 5) Required Refactor Targets (Ranked)

## P0

1. **Unify compaction execution authority**
   - Promote one canonical path: either tool-driven [`executeCompaction()`](src/lib/compaction-engine.ts:252) or hook-only compaction, not split semantics.
2. **Enforce global queue-flush boundary for all write tools**
   - Centralize pre-write flush contract at tool framework edge (not per-tool convention).

## P1

3. **Remove ambient cwd dependency in mutation queue logger**
   - Inject directory/log context into queue module init path instead of `process.cwd()` in [`getLogger()`](src/lib/state-mutation-queue.ts:39).
4. **Refactor session coherence IO out of lib core**
   - Isolate IO adapters; keep coherence decision/assembly pure around [`loadLastSessionContext()`](src/lib/session_coherence.ts:132).

## P2

5. **Consolidate budget/disclosure policy primitives**
   - Shared policy utility consumed by system-transform + compaction + first-turn context surfaces.
6. **Reduce hierarchy-tree blast radius through thinner façades**
   - Introduce narrower interfaces per consumer domain to decouple future schema changes.

---

## 6) Compact Superiority Insertion Points (Ranked)

### 1) CIS (Context Intelligence System) — **highest leverage**
- **Primary surface**: [`createSessionLifecycleHook()`](src/hooks/session-lifecycle.ts:76)
- **Secondary surface**: [`compileFirstTurnContext()`](src/hooks/session-lifecycle-helpers.ts:359)
- **Why**: already central for turn-by-turn context decisions, bootstrap, and governance signal assembly.

### 2) RLE (Run-time Load Enforcer)
- **Primary surface**: [`assembleSections()`](src/hooks/session-lifecycle.ts:219)
- **Secondary surface**: queue gating before apply in [`flushMutations()`](src/lib/state-mutation-queue.ts:400)
- **Why**: existing budget truncation and queued-write chokepoints enable declaration/validation insertion with minimal graph disruption.

### 3) AEM (Auto-Export Mechanism)
- **Primary surface**: [`purifyContextFragments()`](src/lib/context-purifier.ts:49)
- **Secondary surfaces**: [`handlePurge()`](src/tools/hivemind-context.ts:80), [`generateNextCompactionReport()`](src/lib/compaction-engine.ts:154)
- **Why**: purification already computes retention-worthy material; export-before-prune can be attached here.

### 4) PDF (Progressive Disclosure Framework)
- **Primary surface**: section prioritization in [`assembleSections()`](src/hooks/session-lifecycle.ts:219)
- **Secondary surface**: first-turn disclosure in [`compileFirstTurnContext()`](src/hooks/session-lifecycle-helpers.ts:359)
- **Why**: line assembly pipeline is already prioritized and budget-aware; natural layer-gated insertion point.

### 5) Session/Hierarchy boundary reinforcement
- **Primary surfaces**: [`startSession()`](src/lib/session-engine.ts:113), [`updateSession()`](src/lib/session-engine.ts:236), [`addChild()`](src/lib/hierarchy-tree.ts:296)
- **Why**: allows CIS/RLE decisions to propagate into structural state transitions with explicit contract checks.

---

## 7) Integration Readiness for CIS/RLE/AEM/PDF

### Ready now
- Turn-level interception and context assembly in hooks are mature.
- Purification and staleness primitives exist and are testable.
- Queue-based CQRS scaffolding is in place.

### Needs pre-integration hardening
- Canonicalize compaction ownership (engine vs hook split).
- Enforce universal tool flush boundary contract.
- Decouple IO from coherence core library.
- Normalize policy layer shared by lifecycle/message/compaction channels.

---

## 8) Phase 5 Context Purification Verification Checklist

- [ ] **CQRS Gate**: No direct hook writes (`stateManager.save`) in hook surfaces; hook writes are queued only.
- [ ] **Flush Gate**: Every write-capable tool executes [`flushMutations()`](src/lib/state-mutation-queue.ts:400) + [`flushTaskManifestMutations()`](src/lib/state-mutation-queue.ts:467) before state mutation.
- [ ] **Compaction Authority Gate**: Single canonical compaction execution path selected and documented.
- [ ] **Purification Gate**: Dedup/fingerprint/export-before-prune pipeline verified from [`purifyContextFragments()`](src/lib/context-purifier.ts:49) through purge/compaction entrypoints.
- [ ] **Budget Consistency Gate**: One shared disclosure/budget policy applied across lifecycle, messages-transform, and compaction injections.
- [ ] **Staleness Gate**: TTS and session staleness behavior validated for same-session vs cross-session mem handling in [`isMemStale()`](src/lib/staleness.ts:63).
- [ ] **Hierarchy Continuity Gate**: Cursor/path integrity retained across compaction/session transitions.
- [ ] **Observability Gate**: Queue audit and logger path correctness validated without `process.cwd()` ambiguity.

---

## 9) Diagnosis Summary (Debug mode protocol)

### Considered possible sources (7)
1. CQRS boundary leakage in hooks.
2. Incomplete queue flush adoption in tools.
3. Compaction architecture split (engine vs hook).
4. Session coherence IO impurity side effects.
5. Context budget policy fragmentation.
6. Hierarchy-tree high coupling blast radius.
7. Runtime path-resolution/logging environment coupling.

### Most likely root structural sources (2)
1. **Compaction authority split** between [`executeCompaction()`](src/lib/compaction-engine.ts:252) and [`createCompactionHook()`](src/hooks/compaction.ts:52).
2. **CQRS enforcement by convention** (per-tool flush) instead of centralized boundary enforcement.

### Validation logs/telemetry to add before any fixes
1. Queue depth + age histogram around [`flushMutations()`](src/lib/state-mutation-queue.ts:400) and tool entry boundaries.
2. Compaction-path marker showing whether runtime used hook-only, engine-only, or both.
3. Policy checksum log for budget/disclosure decisions from lifecycle vs compaction channels.
4. Session coherence IO latency + fallback path counters in [`loadLastSessionContext()`](src/lib/session_coherence.ts:132).

### Confirmation required before remediation
Diagnosis is complete and evidence-backed for Explore1 scope. Architectural remediation should only proceed after explicit user confirmation of the two primary root sources above.
