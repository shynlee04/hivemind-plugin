---
phase: HER-0-ecosystem-remap-audit
plan: 04
type: execute
wave: 2
depends_on: ["HER-0-01"]
files_modified:
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix.md
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/module-ownership.csv
autonomous: true
requirements: [HER-0-C]

must_haves:
  truths:
    - "Every src/lib/ module is assigned to exactly one lifecycle responsibility"
    - "Each module's ownership is justified with source evidence"
    - "Orphan modules (no clear lifecycle owner) are explicitly flagged"
  artifacts:
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix.md"
      provides: "Module ownership matrix with lifecycle responsibilities"
      min_lines: 150
      contains: "lifecycle"
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/module-ownership.csv"
      provides: "Machine-readable ownership matrix for downstream automation"
      contains: "module,responsibility,owner"
  key_links:
    - from: "lane-c-ownership-matrix.md"
      to: "src/lib/types.ts"
      via: "lifecycle phase definitions"
      pattern: "types\\.ts"
    - from: "lane-c-ownership-matrix.md"
      to: "src/plugin.ts"
      via: "composition root ownership"
      pattern: "plugin\\.ts"
---

<objective>
Map every src/lib/ module to its lifecycle responsibility, producing both a human-readable analysis and a machine-readable CSV.

Purpose: Downstream phases need to know which module "owns" which behavior to avoid cross-cutting changes that break module boundaries. The IMPLEMENTATION-INVENTORY lists 175 files but doesn't assign ownership — this plan fills that gap.

Output: lane-c-ownership-matrix.md, module-ownership.csv
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-RESEARCH.md
@.planning/codebase/IMPLEMENTATION-INVENTORY-2026-05-05.md
@.planning/codebase/ARCHITECTURE.md

<interfaces>
<!-- Module structure from IMPLEMENTATION-INVENTORY -->
src/lib/ modules (16 files per INVENTORY):
- types.ts — leaf, no imports (TaskStatus, DelegationMeta, LifecyclePhase, etc.)
- helpers.ts — pure utilities
- state.ts — in-memory Maps (sessionStats, rootBudgets)
- concurrency.ts — keyed semaphore (FIFO queue)
- continuity.ts — durable JSON persistence (~401 LOC)
- session-api.ts — typed OpenCode SDK wrappers
- runtime.ts — event→status mapping
- completion-detector.ts — two-signal completion detection
- notification-handler.ts — async completion notification
- lifecycle-manager.ts — session lifecycle state machine (~152 LOC, STUB)
- runtime-policy.ts — trusted runtime policy loading
- delegation-manager.ts — core delegation orchestrator
- delegation-persistence.ts — delegation record persistence
- task-status.ts — task status transitions + guards

Dependency rules from AGENTS.md:
- types.ts = leaf (depends on nothing)
- helpers.ts, concurrency.ts, completion-detector.ts = leaf or near-leaf
- lifecycle-manager.ts depends on most modules (deepest chain: 2 levels)
- delegation-persistence.ts depends on types.ts, continuity.ts
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Build module ownership matrix</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix.md,
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/module-ownership.csv
  </files>
  <action>
Read each src/lib/*.ts file and classify by lifecycle responsibility:

**Lifecycle responsibilities (from types.ts):**
- COMPOSITION — plugin assembly, tool/hook registration (plugin.ts)
- DELEGATION — session dispatch, completion detection, delegation records (delegation-manager.ts, delegation-persistence.ts, completion-detector.ts)
- PERSISTENCE — durable state I/O (continuity.ts, state.ts)
- LIFECYCLE — session state machine, phase transitions (lifecycle-manager.ts, runtime.ts, task-status.ts)
- POLICY — runtime policy loading, permission enforcement (runtime-policy.ts)
- API — external SDK wrappers (session-api.ts)
- UTILITY — pure helpers, no state (helpers.ts, concurrency.ts)
- NOTIFICATION — async completion notification (notification-handler.ts)

For each module:
1. Read the file to understand its primary responsibility
2. Identify its dependency depth (leaf=0, near-leaf=1, mid=2, deep=3)
3. Map to the lifecycle responsibility above
4. Record: imports (what it depends on), exports (what it provides), LOC count

Output markdown format:
```
## Module Ownership Matrix
| Module | Responsibility | Depth | Imports | Exports | LOC |

## Orphan Modules
| Module | Issue |
```

Output CSV format:
```
module,responsibility,depth,imports,exports,loc,path
```

Write markdown to `map/lane-c-ownership-matrix.md` and CSV to `matrix/module-ownership.csv`.
  </action>
  <verify>
    <automated>wc -l .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/matrix/module-ownership.csv | grep -qv '1$' && echo "PASS: CSV has multiple rows" || echo "FAIL: CSV is empty or header-only"</automated>
  </verify>
  <done>
All src/lib/ modules classified by lifecycle responsibility. CSV file contains module→responsibility mapping. Orphan modules (no clear owner) explicitly flagged.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Verify ownership against dependency rules</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix.md
  </files>
  <action>
Using the ownership matrix from Task 1, verify compliance with AGENTS.md dependency rules:

1. **Leaf constraint:** types.ts must have depth=0 (no imports). Flag if types.ts imports anything.
2. **Max depth constraint:** No module should have dependency depth > 3 (lifecycle-manager.ts is documented as deepest at 2). Flag if any module exceeds this.
3. **Circular dependency check:** No two modules should import each other. Check import statements for cycles.
4. **Max LOC constraint:** No module should exceed 500 LOC. Flag violations.
5. **Cross-boundary violations:** UTILITY modules should not import DELEGATION or PERSISTENCE modules. Flag if they do.

Append a "Constraint Violations" section to lane-c-ownership-matrix.md:
```
## Constraint Violations
| Module | Rule | Expected | Actual | Severity |
```
  </action>
  <verify>
    <automated>grep -c 'Constraint Violations' .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-c-ownership-matrix.md | grep -qv '0' && echo "PASS: Constraint check section present" || echo "FAIL: missing constraint check"</automated>
  </verify>
  <done>
Ownership matrix verified against all 5 dependency rules. Any violations flagged with severity.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| source code → Lane C | Read-only code analysis (trusted — analyzing actual code) |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-HER0-04 | T | Module ownership | accept | Read-only analysis — ownership assignment is advisory, not authoritative |
</threat_model>

<verification>
- lane-c-ownership-matrix.md covers all src/lib/ modules
- module-ownership.csv has non-header rows
- Constraint violations section exists
</verification>

<success_criteria>
- Every src/lib/*.ts module has a lifecycle responsibility assignment
- CSV is parseable with module,responsibility columns
- Dependency rule violations are flagged (if any)
</success_criteria>

<output>
After completion, create `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-04-SUMMARY.md`
</output>
