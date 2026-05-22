# Hard Restructuring — Thin Framing

**Date:** 2026-05-21
**Status:** Draft for human review
**Purpose:** Progressive addressing map for all design-flawed clusters before Phase 21 (now pushed downstream).
**Principle:** Fix design FIRST (make each cluster Hivemind-compliant), then clean/refactor. Never reverse.

---

## Cluster Map (Dependency-Ordered)

```
                    ┌──────────────────┐
                    │  0: Plugin.ts    │  Composition root — everything depends on it
                    │  (composition)   │  Design flaw: overloaded, dual-path, temporal coupling
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
   ┌──────────────────┐ ┌──────────┐ ┌──────────┐
   │ 1: Shared/Config │ │ 2: Hooks │ │ 3: Tasks │  Shared leaf + hooks + task-mgmt
   │ (leaf, singleton)│ │ (CQRS)   │ │ (design) │  Foundation layer
   └────────┬─────────┘ └────┬─────┘ └─────┬────┘
            │                │              │
            └────────────────┼──────────────┘
                             ▼
                    ┌──────────────────┐
                    │  4: Routing      │  Intent classification, behavioral profiles
                    │  (dead code,     │  Depends on: hooks (events) + shared (types)
                    │   no tests)      │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
   ┌──────────────────┐ ┌──────────┐ ┌──────────┐
   │ 5: Coordination  │ │ 6: Tools │ │ 7: Schema │  Core engine layer
   │ (delegation,     │ │ (surface)│ │ (kernel)  │
   │  dual-store,     │ │          │ │           │
   │  dual-status)    │ │          │ │           │
   └────────┬─────────┘ └────┬─────┘ └─────┬────┘
            │                │              │
            └────────────────┼──────────────┘
                             ▼
                    ┌──────────────────┐
                    │  8: Features     │  Standalone features
                    │  (session-tracker│  Includes session-tracker (reference)
                    │   is reference)  │  + pressure, doc, contracts etc.
                    └──────────────────┘
```

---

## Cluster Details (Design Flaws Only — No Code Bugs)

### 0. plugin.ts (Composition Root)
**OK?** ❌ — Near 500 LOC cap, overloaded with 5 concerns (startup, recovery, hooks, tools, migration)
**Design flaws:**
- Dual-path delegation setup (coordinatorRef temporal coupling)
- 5 fire-and-forget promises without error handling
- 2 legacy hooks returned that SDK silently ignores (system.transform, messages.transform)
- Startup + migration + recovery all inline — should be extracted
**Depends on:** Nothing (it's the root)
**Blocks:** Everything downstream

### 1. Shared/Config (Foundation Layer)
**Shared (leaf utilities):** 
- session-api.ts violates leaf constraint — imports from routing/
- types.ts is dumping ground — 5 concern areas in 381 LOC
- redaction.ts exists but unused in highest-risk path (session-tracker writers)
**Config:**
- subscriber.ts: only global mutable state in codebase (singleton cache)
- compiler.ts: 410 LOC, 6+ functions, decompileAgent returns "unknown" (bug)
- Zero test coverage across 3 modules (~972 LOC)
**Depends on:** plugin.ts (wiring)
**Blocks:** All downstream modules (they depend on shared types/config)

### 2. Hooks (CQRS Observer Layer)
**Design flaws:**
- CQRS violation: tool-after-workflow.ts performs durable writes from hooks sector
- assertHookWriteBoundary is called but NEVER throws (noop)
- Dual system.transform registration (one dead/duplicate)
- 2 thin observer shells (session-entry-consumer, session-main-consumer) could inline
- Loose-typed hook signatures (chat.message, tool.execute.before typed as unknown)
**Depends on:** shared (types), task-management (lifecycle), coordination (delegation)
**Blocks:** routing (consumes hook events), coordination (consumes hook results)

### 3. Task Management (Continuity + Journal + Trajectory + Lifecycle)
**Design flaws:**
- continuity/index.ts: 467 LOC, 9 legacy compatibility refs, sync I/O in runtime paths
- journal/: 540 LOC of fully designed but UNWIRED audit trail — design decision pending (wire or defer)
- trajectory/: no dedicated tests despite file I/O operations
- lifecycle/: silent catch blocks swallow errors
- Delegation persistence: duplicate deriveSurface/deriveRecoveryGuarantee with state-machine.ts (drift risk)
**Depends on:** shared (types, state), coordination (delegation needs continuity)
**Blocks:** All features that depend on continuity/state persistence

### 4. Routing (Intent Classification + Behavioral Profile + Command Engine)
**Design flaws:**
- intake-gate registry validator is DEAD — never receives validator argument at runtime
- PURPOSE_TO_ROUTING_TARGET dispatch computed but NEVER consumed
- Fragile substring matching (no NLP) in purpose-classifier
- Zero test coverage across session-entry (542 LOC), behavioral-profile (277 LOC)
- Dead no-op methods: invalidateBehavioralProfile, clearAllBehavioralProfiles
**Depends on:** hooks (events), config (compiler), shared (types)
**Blocks:** F-04 auto-routing, user journey pipeline

### 5. Coordination (Delegation + Completion + Concurrency + Spawner)
**Most complex cluster — 31 files, ~6,200 LOC**

**Key design flaws:**
- **Dual dispatch paths (v1 + v2):** manager.ts is thin facade routing to either manager-runtime.ts (v1 legacy) or coordinator.ts (v2). Two paths have divergent error handling.
- **Two in-memory delegation stores:** coordinator.ts (this.active) + state-machine.ts (this.delegations) — potential drift
- **Naming collision:** delegation/completion-detector.ts (semantic analysis) vs completion/detector.ts (watcher class) — same name, different purposes
- **Triple dispatch divergent errors:** CommandDelegationHandler has SDK/PTY/headless paths with 3 different error contracts — agents cannot handle errors uniformly
- **Dual status type system:** TaskStatus (harness enum) vs DelegationStatus (delegation enum) — confusion for consumers
- **Notification fire-and-forget:** no retry, no TTL, no delivery tracking — stale notifications after restart
- **execute-slash-command:** missing 3 guardrails (pre-dispatch validation, pressure gate, Zod schema) — only tool NOT using renderToolResult()
- **DelegationManager god-object:** ~580 LOC, 8+ imports, needs decomposition like session-tracker pattern
**Utilitity scores:** 6 REWORK surfaces (12-15/20)
**Depends on:** task-management (lifecycle, continuity), features (session-tracker)
**Blocks:** Delegate-task ecosystem, PTY/command ecosystem, notification system

### 6. Tools Surface (24 registered tools)
**Design flaws:**
- 3 session tools mislocated under hivemind/ instead of session/
- hivemind-session-view: only tool with ZERO test coverage
- configure-primitive: 490 LOC (near cap), inline Zod schemas duplicate schema-kernel
- 5 tools using wide `@opencode-ai/plugin` import instead of narrow `/tool`
- delegation-status renderer too dense — extraction needed
**Depends on:** schema-kernel, coordination, shared
**Blocks:** User-facing tool surface quality

### 7. Schema-Kernel (20 schema files, Zod v4 validation)
**Design flaws:**
- 3 DEAD schemas: permission.schema.ts (168 LOC), tool-definition.schema.ts (74 LOC), skill-metadata.schema.ts (111 LOC)
- permission.schema.ts: z.enum(["allow", "ask", "ask"]) — duplicate enum value bug
- 9/20 schemas with zero dedicated tests
- Barrel re-exports dead schemas as if alive
**Depends on:** zod only (leaf)
**Blocks:** Tools that use schemas, config validation

### 8. Features (10 feature modules, 12,669 LOC)
**Session-tracker (reference):** ✅ Relatively OK per user. But has:
- event-capture.ts 702 LOC (+40% over cap), index.ts 561 LOC (+12%)
- PendingDispatchRegistry: 312 LOC, 3 reverse indices (over-engineered?)
- 2 dead files: schema-normalizer.ts (155 LOC), session-classification-hook.ts (76 LOC)
**Others:**
- prompt-packet/: 348 LOC DEAD code — superseded by session-tracker, zero consumers
- sdk-supervisor/: isWrapperAvailable() uses || true — non-functional health check
- agent-work-contracts/: sync fs APIs in runtime path, zero tests
- doc-intelligence/: zero tests, estimatedTokens uses 4-char heuristic
- runtime-pressure/: zero tests, authority-matrix overlaps with skill
- background-command/pty/: singleton pattern (no DI), divergent from session-tracker
**Depends on:** shared, coordination, task-management
**Blocks:** N/A (standalone)

---

## Progressive Addressing Order

Each step is a **batch**, not a monolithic phase. Each batch may contain multiple phases. Each phase must be:
1. Design-fix first (make it compliant with Hivemind philosophy)
2. Then clean/refactor
3. Then verify via typecheck + tests

### Batch A: Composition + Foundation (clusters 0, 1, 2)
- Fix plugin.ts: extract startup/hooks/tools, fix temporal coupling, remove legacy hooks
- Fix shared leaf: move session-api.ts routing import, clean types.ts
- Fix hooks: enforce CQRS boundary, remove dead hooks, type hook signatures
- Fix config: compiler split, subscriber singleton fix, decompileAgent bug

### Batch B: Task Management & Persistence (cluster 3)
- Fix continuity: async I/O conversion, remove legacy paths
- Decision: journal wire or defer
- Fix trajectory: add tests, async I/O
- Fix lifecycle: replace silent catches with typed error handling

### Batch C: Routing (cluster 4)
- Remove dead code (registry validator, routing target dispatch)
- Fix dead profile methods
- Add tests for session-entry, behavioral-profile, command-engine

### Batch D: Coordination Engine (cluster 5)
- **Most complex.** Unify v1/v2 dispatch paths
- Unify TaskStatus ↔ DelegationStatus
- Unify triple-dispatch error contract
- Add notification delivery guarantee (TTL + retry)
- Fix naming collisions
- Decompose DelegationManager (god-object → sub-modules)
- Add guardrails to execute-slash-command

### Batch E: Tools Surface (cluster 6)
- Relocate mislocated session tools
- Add tests for hivemind-session-view
- Standardize import paths (wide → narrow)
- Standardize return envelopes
- Fix schema duplication (inline → schema-kernel)

### Batch F: Schema Kernel (cluster 7)
- Delete 3 dead schemas
- Fix permission.schema.ts enum bug
- Add tests for 9 untested schemas

### Batch G: Features Polish (cluster 8)
- Delete prompt-packet (348 LOC dead)
- Split event-capture.ts (702 → ~400 LOC)
- Split session-tracker/index.ts (561 → ~400 LOC)
- Simplify PendingDispatchRegistry
- Fix sdk-supervisor health check
- Add tests for pressure, doc, agent-work-contracts
- Fix singleton pattern in PtyManager

### Batch H: Final Integration
- Full regression (typecheck + tests)
- Rebuild dist/ (verify zero stale artifacts)
- Update all manifests (STRUCTURE.md, ARCHITECTURE.md, CONCERNS.md, AGENTS.md)
- Update ROADMAP.md + STATE.md

---

## Rules of Engagement

1. **Never batch B before A** — foundation must be stable before building on it
2. **Batch D can parallelize with B+C** — coordination mostly depends on shared+config (A), not on task-management or routing details
3. **Each batch produces a checkpoint** — typecheck clean, tests green, before moving to next batch
4. **Advisor run before each batch** — specific gray-area analysis for that batch's clusters
5. **No batch spans >3 clusters** — keeps cognitive load manageable
6. **Defer vs wire decision at batch boundary** — journal/sidecar decisions happen in Batch B context, not earlier
