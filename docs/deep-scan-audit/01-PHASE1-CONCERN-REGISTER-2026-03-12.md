# Phase 1 Concern Register

**Generated**: 2026-03-12
**Total Files**: 35
**Priority**: Phase 1 (immediate attention required)

---

## 🔴 RESTRICTED ZONES (2 files)

> **DO NOT EDIT** without phased plan and ownership coverage tests.

| File | Role | Risk | Prerequisite |
|------|------|------|--------------|
| `src/hooks/session-lifecycle.ts` | System 2a injection — sole system prompt owner after plugin deprecation | CRITICAL | Phased plan + `tests/injection-surface-ownership.test.ts` PASS |
| `src/hooks/messages-transform.ts` | System 2b injection — prepends structured context, appends checklist | CRITICAL | Phased plan + ownership tests PASS |

### Details

**session-lifecycle.ts**
- Fires: EVERY TURN
- Reads: `brain.json`, `config.json`, `anchors.json`, `mems.json`, `tasks.json`
- Calls: `compileDefaultGovernance()`, `generateEscalationBlock()`
- Outputs: HIVE-MASTER governance block to `output.system`
- Constraint: Child-session suppression active

**messages-transform.ts**
- Fires: EVERY TURN
- Reads: `brain.json`, `tasks.json`, `anchors.json`, `mems.json`
- Calls: `packCognitiveState()`
- Outputs: `<hivemind_state>` XML to `output.messages`
- Constraint: Child-session minimization active

---

## 🟡 HIGH-RISK INJECTION PIPELINE (8 files)

| File | Role | Risk |
|------|------|------|
| `src/lib/injection-orchestrator.ts` | Per-turn budget allocation, channel presence detection | HIGH |
| `src/lib/governance-instruction.ts` | HIVE-MASTER governance block generation (9 builtin rules) | HIGH |
| `src/lib/context-escalation.ts` | Context quality escalation levels 1-4, halt conditions | HIGH |
| `src/lib/cognitive-packer.ts` | Compiles cognitive state into dense XML for injection | HIGH |
| `src/lib/session-governance.ts` | Compiles warningLines, ignoredLines, frameworkLines | HIGH |
| `src/lib/session_coherence.ts` | First-turn context retrieval for session continuity | HIGH |
| `src/lib/budget.ts` | Context budget constants, controls injection sizing | HIGH |
| `src/lib/chain-analysis.ts` | Hierarchy chain break detection | MEDIUM |

### Injection Flow Dependency

```
budget.ts → injection-orchestrator.ts
    ↓
governance-instruction.ts → session-lifecycle.ts (System 2a)
    ↓
cognitive-packer.ts → messages-transform.ts (System 2b)
    ↓
session-governance.ts → both systems
```

---

## 🟡 AUTHORITY SURFACES (4 files)

| File | Role | Risk | Ownership |
|------|------|------|-----------|
| `src/hooks/event-handler.ts` | P1-B bootstrap ownership, session.created creates profile.json | HIGH | Core runtime |
| `src/lib/state-mutation-queue.ts` | CQRS enforcement layer, all state mutations flow here | HIGH | State authority |
| `src/lib/persistence.ts` | Direct brain.json I/O, migration pipeline | HIGH | Persistence layer |
| `src/lib/hierarchy-tree.ts` | hierarchy.json I/O with file locking | MEDIUM | Hierarchy authority |

### Authority Contract

- `state-mutation-queue.ts` is the **ONLY** legal path to `.hivemind/state/` writes
- Direct file I/O bypassing this queue is a CQRS violation
- All hooks must use queue for state mutations

---

## 🟡 CONTRACT MISMATCHES (1 file)

| File | Issue | Impact | Resolution |
|------|-------|--------|------------|
| `agents/hivefiver.md` | AGENTS.md declares PIVOTED to full project scope, but profile still forbids `src/**` and `tests/**` | Agent confusion, scope drift | Update profile constraints to match AGENTS.md |

### Evidence

- AGENTS.md line ~180: `PIVOTED: Surgical refactor operation across whole project`
- hivefiver.md profile: `scope: docs/**, commands/**, skills/**, workflows/**`
- **Mismatch**: Profile excludes `src/**` and `tests/**` which AGENTS.md includes

---

## 🟡 CQRS VIOLATIONS (2 tools)

| File | Violation | Severity | Fix Required |
|------|-----------|----------|--------------|
| `src/tools/hivemind-context.ts` | `handlePurge()` writes `brain.json` directly after `flushMutations()` | HIGH | Route through StateMutationQueue |
| `src/tools/hivemind-plan.ts` | Writes `trajectory_context` directly bypassing StateMutationQueue | HIGH | Route through StateMutationQueue |

### Pattern Violation

```typescript
// WRONG (current in hivemind-context.ts)
flushMutations(); // clears queue
fs.writeFileSync(brainPath, JSON.stringify(data)); // direct write!

// CORRECT
queueMutation({ type: 'brain_update', data });
flushMutations();
```

---

## 🟡 TREE-SITTER DEPENDENT (6 files)

> These files depend on WASM-based Tree-sitter runtime for AST parsing.

| File | Lines | WASM Dependencies | Fallback |
|------|-------|-------------------|----------|
| `src/lib/code-intel/tree-sitter-loader.ts` | ~150 | 7 language WASMs | None |
| `src/lib/code-intel/signature-extractor.ts` | 821 | Multi-language AST walkers | None |
| `src/lib/code-intel/compressed-codemap.ts` | ~200 | Optional | Regex |
| `src/lib/code-intel/ast-surgeon.ts` | ~300 | Tree-sitter + magic-string | None |
| `src/lib/code-intel/incremental-updater.ts` | ~150 | Optional | None |
| `src/lib/code-intel/watch-integration.ts` | ~100 | Optional | None |

### Heaviest File

`signature-extractor.ts` (821 lines) — Multi-language AST walkers for:
- TypeScript
- JavaScript
- Python
- Go
- Rust
- Java
- C/C++

---

## 🟡 SKILLS (8 Phase 1 critical)

| File | Role | Dependencies |
|------|------|--------------|
| `skills/entry-resolution/SKILL.md` | ROOT GATEWAY — all other skills depend on this | None (entry point) |
| `skills/delegation-framework/SKILL.md` | Delegation readiness guard | entry-resolution |
| `skills/platform-adapter/SKILL.md` | Maps universal to platform-specific | entry-resolution |
| `skills/context-integrity/SKILL.md` | Context loss detection and repair | entry-resolution |
| `skills/evidence-discipline/SKILL.md` | Proof-before-claim enforcement | verification-methodology |
| `skills/verification-methodology/SKILL.md` | Goal-backward analysis | None |
| `skills/agent-role-boundary/SKILL.md` | Diamond role separation | entry-resolution |
| `skills/meta-builder-governance/SKILL.md` | Framework evolution governance | agent-role-boundary |
| `skills/wrong-start-resolver/SKILL.md` | Wrong lineage detection | entry-resolution |

### Skill Dependency Graph

```
entry-resolution (ROOT)
├── delegation-framework
├── platform-adapter
├── context-integrity
├── agent-role-boundary
│   └── meta-builder-governance
└── wrong-start-resolver

verification-methodology
└── evidence-discipline
```

---

## 🟡 COMMANDS (3 with enforcement blocks)

| File | Role | Enforcement References |
|------|------|------------------------|
| `commands/hivefiver.md` | Router for hivefiver sub-commands | 7 scripts in enforcement block |
| `commands/hivefiver-start.md` | Entry point with gate-check | Can block execution |
| `commands/hivefiver-doctor.md` | Diagnostic with dead reference scan | References dead code detector |

### Enforcement Block Pattern

Commands include enforcement blocks that can:
- Block execution if prerequisites not met
- Scan for dead references
- Validate state integrity before proceeding

---

## Summary Table

| Category | Files | Severity | Action Required |
|----------|-------|----------|-----------------|
| 🔴 RESTRICTED ZONES | 2 | CRITICAL | Phased plan only |
| 🟡 INJECTION PIPELINE | 8 | HIGH | Review before modification |
| 🟡 AUTHORITY SURFACES | 4 | HIGH | Maintain CQRS contract |
| 🟡 CONTRACT MISMATCHES | 1 | MEDIUM | Sync profile with AGENTS.md |
| 🟡 CQRS VIOLATIONS | 2 | HIGH | Refactor to use queue |
| 🟡 TREE-SITTER DEPENDENT | 6 | MEDIUM | WASM availability check |
| 🟡 SKILLS | 8 | HIGH | Maintain dependency order |
| 🟡 COMMANDS | 3 | MEDIUM | Enforcement block awareness |

---

*Maintained by: hivefiver meta-builder*
*Next review: 2026-03-19*
