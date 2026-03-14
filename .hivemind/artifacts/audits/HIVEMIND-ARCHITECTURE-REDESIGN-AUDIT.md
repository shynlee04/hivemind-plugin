# HIVEMIND Architecture Redesign Audit & Synthesis

> **Generated**: 2026-03-14T00:50:00Z  
> **Phase**: Wave 1-3 Complete (Ground Truth + Comparative Learning + Architecture Synthesis)  
> **Purpose**: Enable next-stage refactoring decisions with evidence-based rationale

---

## Executive Summary

This audit synthesizes deep analysis of:
1. **Current HiveMind state** (`.hivemind/` directory, source code, runtime behavior)
2. **GSD patterns** (selective learning from get-shit-done framework)
3. **OpenCode architecture** (native capabilities and constraints)
4. **Root-cause pollution sources** (what generates noisy artifacts)

**Key Finding**: HiveMind has a strong conceptual foundation but suffers from:
- Organic growth creating 30+ files >350 LOC in `src/lib/`
- Proliferation of overlapping session/governance/planning modules
- Noisy auto-spawned state (backup chains, graph ledgers, session runtime dirs)
- Dual-lineage confusion (hivefiver vs hiveminder) without clear boundaries
- Missing foundational integrity (no `config.json` found, stale session state)

**Recommendation**: Phased refactoring starting with foundation-first cleanup, then hardening.

---

## 1. Selective GSD-to-Hivemind Knowledge Transfer

### 1.1 What to Adopt from GSD

| GSD Concept | Value for HiveMind | Adaptation Required |
|-------------|-------------------|---------------------|
| **Atomic Phase Lifecycle** (PLAN → EXECUTE → VERIFY → SUMMARY) | Structured workflow with clear handoff boundaries | Adapt to OpenCode's session/compaction model, use gates instead of file-based phases |
| **STATE.md as Rolling Snapshot** | Human-readable operational state | Split into `hivebrain.md` (readable) + `hiveneuron.json` (deterministic) |
| **Milestone-Archive Pattern** | Clean phase history without pollution | Adopt as `.hivemind/sessions/archive/` with structured exports |
| **Config-Driven Model Resolution** | Agent/model selection based on task type | Implement via OpenCode agent config + skill-based model hints |
| **Verification Patterns** | Pre-commit gates, integration checks | Translate to `hiveops_gate` tool + plugin hooks |
| **Planning Config** | Scoped settings per project | Extend to `hiveneuron.json` settings_digest + `config/` directory |
| **Template System** (phase-prompt, debug, verification-report) | Structured prompts for agents | Convert to OpenCode skills + commands |
| **Continuation Format** | Session recovery after interruption | Enhance with anchors + session export/import |

### 1.2 What Must Change

| GSD Pattern | Why It Doesn't Fit | HiveMind Alternative |
|-------------|-------------------|---------------------|
| **Interactive TUI/CLI** | OpenCode is non-interactive shell | Plugin hooks + tool-based governance |
| **`.planning/` as single root** | Conflicts with `.hivemind/` authority | `.hivemind/project/planning/` as generated ledger |
| **File-based phase numbering** (00-*, 01-*) | Rigid, blocks flexibility | Plan hierarchy with prefix-based IDs (PLAN-001) |
| **STATE.md as sole state** | No machine-parseable runtime state | `hiveneuron.json` as kernel, `hivebrain.md` as readable mirror |
| **Agent-specific model profiles** (gsd-planner → opus) | OpenCode uses skill/model config | Skill-based model hints + agent config |
| **Subagent delegation via bash** | OpenCode has native Task tool | Use `task()` tool with subagent types |
| **Git-centric planning commits** | OpenCode may not always have git | Optional git integration, not required |

### 1.3 What to Reject

| GSD Concept | Reason for Rejection |
|-------------|---------------------|
| **Nyquist Validation** | Too specialized, adds complexity without clear value for HiveMind's scope |
| **Branching Strategy Templates** | Git workflow is user-specific, not framework-controlled |
| **Model Profile Table** (hardcoded agent→model mapping) | OpenCode handles this via config, not code |
| **Command-line argument parsing** (phase-argument-parsing.md) | OpenCode tools use Zod schemas, not argv |
| **`.planning/` directory structure** | Conflicts with `.hivemind/` authority, creates confusion |

---

## 2. Current `.hivemind` Architecture Audit

### 2.1 Directory Structure Analysis

```
.hivemind/                          (85+ files, ~50 directories)
├── hiveneuron.json                 ✅ GOOD - 64 LOC, concise kernel index
├── hivebrain.md                    ✅ GOOD - 37 LOC, readable context map
├── manifest.json                   ⚠️ REVIEW - 49 LOC, unclear ownership
├── archive/                        🔍 EMPTY - ready for use
├── artifacts/                      🔍 EMPTY - ready for use
├── codemap/                        ⚠️ STALE - manifest only, no actual codemaps
├── codewiki/                       ⚠️ STALE - manifest only, no actual wiki
├── config/                         ✅ GOOD - governance.json, guardrails.json, profile.json
├── docs/                           🔍 EMPTY - ready for use
├── graph/                          ❌ POLLUTED - 1445 LOC across 2 JSON files
│   ├── orphans.json               ❌ 696 LOC - auto-spawned orphan tracking
│   └── tasks.json                 ❌ 749 LOC - auto-spawned task graph
├── logs/                           ⚠️ NOISE - 3 log files with unclear retention
├── memory/                         ⚠️ STALE - manifest only
├── meta-module/                    🔍 EMPTY - ready for use
├── plans/                          ⚠️ STALE - manifest + templates only
├── project/planning/               ✅ GOOD - GSD-style planning root
├── recovery/                       ⚠️ REVIEW - doctor-report.json
├── sessions/                       ⚠️ MIXED
│   ├── active.md                  ❌ BLANK - should be populated
│   ├── manifest.json              ⚠️ MINIMAL - 3 LOC
│   ├── runtime/                   ⚠️ AUTO-SPAWNED - 5 session dirs with profile.json
│   └── archive/                   🔍 EMPTY - ready for use
├── state/                          ❌ POLLUTED
│   ├── brain.json                 ⚠️ 250 LOC - bloated metrics/tracking
│   ├── brain.json.bak             ❌ 3 backup files (stale)
│   ├── hierarchy.json             ✅ 14 LOC - concise
│   ├── tasks.json                 ✅ 4 LOC - concise
│   └── manifest.json              ⚠️ 23 LOC
├── states/                         ⚠️ DUAL-LINEAGE
│   ├── shared/                    ✅ GOOD - integrity, session-map, artifact-index, verification-index
│   └── lineages/                  ⚠️ CONFUSING
│       ├── hivefiver/sessions/    Only 1 session file
│       └── hiveminder/sessions/   Only 1 session file
├── system/                         🔍 EMPTY - ready for use
├── templates/                      ✅ GOOD - session.md template
└── workflows/                      🔍 EMPTY - ready for use
```

### 2.2 Pollution Sources Identified

| Source | Artifact | LOC | Root Cause |
|--------|----------|-----|------------|
| `graph-io.ts` | `.hivemind/graph/*.json` | 1445 | Auto-spawns orphan/task graph on every operation |
| `session-runtime.ts` | `.hivemind/sessions/runtime/ses_*/` | ~500 | Creates session dirs without cleanup |
| `state-mutation-queue.ts` | `.hivemind/state/brain.json` | 250 | Appends metrics without pruning |
| `persistence.ts` | `.hivemind/state/brain.json.bak*` | ~750 | Creates backups without rotation |
| `manifest.ts` | `.hivemind/*/manifest.json` | ~100 | Creates manifests even when empty |

### 2.3 Integrity Issues

1. **`config.json` not found** - Required for planning operations, not generated by init
2. **`active.md` is blank** - Session state not written
3. **5 runtime session directories** from task subagents - never cleaned up
4. **3 `brain.json.bak` files** - backup chain without rotation policy
5. **Graph orphans/tasks** - 1445 LOC of auto-generated state with unclear value

---

## 3. Source Code Architecture Audit

### 3.1 Files >350 LOC (Critical Refactoring Targets)

| File | LOC | Priority | Rationale |
|------|-----|----------|-----------|
| `src/lib/doc-intel.ts` | 1,785 | **CRITICAL** | Monolithic document intelligence - split into read/write/search/metadata |
| `src/lib/hierarchy-tree.ts` | 1,385 | **CRITICAL** | Complex hierarchy engine - split into data structures/CRUD/query/render |
| `src/lib/state-mutation-queue.ts` | 928 | **HIGH** | State mutation system - split into types/queue/persistence |
| `src/lib/doc-intel/write-ops.ts` | 876 | **HIGH** | Write operations - consolidate with read-ops.ts |
| `src/lib/detection.ts` | 857 | **HIGH** | Detection engine - extract into sub-detectors |
| `src/lib/graph-migrate.ts` | 853 | **HIGH** | Graph migration - candidate for archival after migration complete |
| `src/lib/code-intel/signature-extractor.ts` | 821 | **MEDIUM** | Signature extraction - split into parser/generator |
| `src/lib/paths.ts` | 757 | **MEDIUM** | Path resolution - consolidate with hiveops-paths.ts |
| `src/lib/hivefiver-integration.ts` | 742 | **MEDIUM** | Integration utilities - review for overlap |
| `src/lib/session-kernel.ts` | 672 | **MEDIUM** | Session kernel - consolidate with session-engine.ts |
| `src/lib/session-engine.ts` | 669 | **MEDIUM** | Session engine - potential merge with session-kernel.ts |
| `src/lib/session_coherence.ts` | 663 | **MEDIUM** | Coherence checking - consolidate session modules |
| `src/lib/doc-intel/read-ops.ts` | 663 | **MEDIUM** | Read operations - consolidate with write-ops.ts |
| `src/lib/cognitive-packer.ts` | 622 | **MEDIUM** | Cognitive packing - review for simplification |
| `src/lib/doctor-recovery.ts` | 604 | **MEDIUM** | Doctor recovery - split into diagnosis/recovery |
| `src/tools/hivemind-doc.ts` | 911 | **HIGH** | 20-action tool monolith - split into read/write/search tools |
| `src/tools/hiveops-todo.ts` | 522 | **HIGH** | Legacy todo - archive to src/legacy/ |
| `src/tools/hivemind-session.ts` | 485 | **MEDIUM** | Session lifecycle - consolidate with session tools |
| `src/tools/hivemind-plan.ts` | 382 | **MEDIUM** | Plan management - review for overlap |
| `src/tools/hivemind-memory.ts` | 369 | **LOW** | Memory search - acceptable size |

### 3.2 Suspicious Naming Patterns

#### Potential Duplicates/Overlaps

1. **Planning filesystem confusion**:
   - `src/lib/plan-fs.ts` (396 LOC) vs `src/lib/planning-fs.ts` (3 LOC - re-export only)
   - `src/lib/fs/planning-ops.ts` (589 LOC) overlaps with both
   - **Recommendation**: Merge into single `src/lib/planning/` module

2. **Session file proliferation** (14 files):
   ```
   session_coherence.ts, session-boundary.ts, session-engine.ts,
   session-export.ts, session-governance.ts, session-intent-classifier.ts,
   session-kernel.ts, session-memory-purge.ts, session-role.ts,
   session-runtime.ts, session-split.ts, fs/session-io.ts,
   long-session.ts, runtime-session-lineage.ts
   ```
   - **Recommendation**: Consolidate into 3-4 focused modules:
     - `session/core/` (kernel, engine, runtime)
     - `session/governance/` (coherence, boundary, role)
     - `session/io/` (export, split, memory-purge)

3. **Governance file overlap** (4 files):
   - `governance-instruction.ts` (364 LOC)
   - `session-governance.ts` (511 LOC)
   - `sot-governance.ts` (369 LOC)
   - `task-governance.ts` (330 LOC)
   - **Recommendation**: Merge into `governance/` module with sub-modules

4. **Detection-related overlap**:
   - `detection.ts` (857 LOC) + `code-intel/binary-detector.ts` + `code-intel/secret-detector.ts`
   - **Recommendation**: Extract detectors into unified detection subsystem

5. **Legacy `hiveops-*` tools** (4 files, ~1481 LOC):
   - `hiveops-export.ts`, `hiveops-gate.ts`, `hiveops-sot.ts`, `hiveops-todo.ts`
   - All unmounted from barrel exports, marked as "P1-C.1 compatibility debt"
   - **Recommendation**: Archive to `src/legacy/` immediately

6. **Naming inconsistency**:
   - Mix of hyphenated (`session-kernel.ts`) and underscored (`session_coherence.ts`)
   - **Recommendation**: Standardize to hyphenated naming

### 3.3 `code-intel/` Subdirectory Analysis

**18 files, ~4,200 LOC total**

Well-structured subsystems:
- **AST/Signature**: `signature-extractor.ts`, `ast-surgeon.ts`, `tree-sitter-loader.ts`
- **Scanning**: `pattern-search.ts`, `file-scanner.ts`, `knowledge-commits.ts`
- **Injection**: `selective-injector.ts`, `watch-integration.ts`, `incremental-updater.ts`
- **Detectors**: `binary-detector.ts`, `secret-detector.ts`, `gitignore-filter.ts`
- **Codemap**: `compressed-codemap.ts`, `codemap-io.ts`, `token-counter.ts`
- **IDE**: `lsp-bridge.ts`

**Recommendation**: Keep as-is but add `index.ts` barrel exports for each subsystem.

### 3.4 `doc-intel/` Subdirectory Analysis

**9 files, ~2,200 LOC total**

Clean separation:
- `read-ops.ts` (663 LOC) + `write-ops.ts` (876 LOC) - core operations
- `formats/` - markdown, yaml, xml, json handlers
- `safety.ts`, `types.ts` - utilities

**Recommendation**: Good structure, consider consolidating format handlers into single registry.

---

## 4. Root-Cause Map: Pollution Sources

### 4.1 Emission Pipeline

```
Source Module          → dist/ artifacts        → .hivemind/ runtime artifacts
─────────────────────────────────────────────────────────────────────────────────
graph-io.ts            → graph-io.js            → graph/orphans.json, graph/tasks.json
session-runtime.ts     → session-runtime.js     → sessions/runtime/ses_*/
state-mutation-queue.ts→ state-mutation-queue.js→ state/brain.json (bloated)
persistence.ts         → persistence.js         → state/brain.json.bak* (backup chains)
manifest.ts            → manifest.js            → */manifest.json (empty manifests)
```

### 4.2 Root Causes

1. **No cleanup hooks**: Modules create artifacts but never clean them up
2. **No rotation policy**: Backups accumulate without limits
3. **Auto-spawn on access**: Graph/session modules spawn on every read operation
4. **Manifest pre-creation**: Manifests created even when content is empty
5. **No garbage collection**: Old session directories never expire

---

## 5. Proposed Target Architecture

### 5.1 Root Files

```
.hivemind/
├── hiveneuron.json     # Compact kernel index (~65 LOC max)
├── hivebrain.md        # Human-readable context map (~50 LOC max)
└── manifest.json       # Framework metadata only
```

### 5.2 State Model

**Replace current state/ with:**
```
.hivemind/state/
├── active.json         # Current session + workflow state (single file)
├── anchors.json        # Persistent cross-session anchors
└── checkpoints.json    # Gate/checkpoint results
```

**Remove:**
- `brain.json` + backups (replace with active.json)
- `hierarchy.json` (move to plan hierarchy)
- `tasks.json` (move to todo system)
- `manifest.json` (redundant with root manifest)

### 5.3 Session Model

**Replace current sessions/ with:**
```
.hivemind/sessions/
├── current.json        # Active session reference (single file)
├── archive/            # Completed session exports
│   └── SES-*.json     # Structured exports with artifacts
└── runtime/            # DELETED - use OpenCode session IDs directly
```

**Remove:**
- `runtime/ses_*/` directories (use OpenCode session IDs)
- `active.md` (replace with current.json)
- `manifest.json` (redundant)

### 5.4 Artifact Model

**Keep but restructure:**
```
.hivemind/artifacts/
├── audits/             # This audit and future audits
├── handoffs/           # Structured session handoffs
├── intel/              # Codebase intelligence reports
├── planning/           # Generated planning artifacts
├── research/           # Research synthesis outputs
├── summaries/          # Session/workflow summaries
└── verification/       # Gate/verification results
```

### 5.5 Handoff Model

**Structured exports via `hiveops_export` tool:**
```json
{
  "id": "HND-001",
  "session_id": "SES-xxx",
  "summary": "Completed architecture audit",
  "artifacts": ["./artifacts/audits/HIVEMIND-ARCHITECTURE-REDESIGN-AUDIT.md"],
  "next_agent": "hiveminder",
  "next_actions": ["implement cleanup", "design new state model"],
  "blockers": [],
  "decisions": ["archive hiveops tools", "split doc-intel.ts"],
  "risk": "low"
}
```

### 5.6 Verification Model

**Via `hiveops_gate` tool + plugin hooks:**
- Pre-commit verification gates
- Integration validation checkpoints
- Phase completion gates
- Evidence-rich pass/fail verdicts

### 5.7 TODO/Task Governance

**Via `hiveops_todo` tool:**
- Hierarchical task IDs (TASK-001, TASK-002)
- Dependency tracking
- Priority levels (high/medium/low)
- Status tracking (pending/in_progress/completed/blocked/cancelled)
- Evidence requirements for completion

### 5.8 Context-Loading Strategy

**Tiered loading:**
1. **Tier 1** (always loaded): `hiveneuron.json` (kernel state)
2. **Tier 2** (on demand): `hivebrain.md` (context map), config files
3. **Tier 3** (deep dive): Linked artifacts, session archives, planning docs
4. **Tier 4** (research): Codebase intelligence, external sources

---

## 6. Cleanup and Migration Strategy

### 6.1 What to Delete

| Target | Reason |
|--------|--------|
| `.hivemind/state/brain.json.bak*` | Stale backups, no rotation policy |
| `.hivemind/sessions/runtime/ses_*/` | Auto-spawned session dirs, use OpenCode IDs |
| `.hivemind/graph/` | Polluted auto-generated state, rebuild from source |
| `.hivemind/codemap/manifest.json` | Empty manifest, no actual codemaps |
| `.hivemind/codewiki/manifest.json` | Empty manifest, no actual wiki |
| `.hivemind/memory/manifest.json` | Empty manifest |
| `.hivemind/plans/manifest.json` | Empty manifest |
| `src/tools/hiveops-*.ts` (4 files) | Legacy compatibility debt, unmounted |
| `src/lib/planning-fs.ts` | 3 LOC re-export, merge into plan-fs.ts |

### 6.2 What to Archive

| Target | Location | Reason |
|--------|----------|--------|
| `.hivemind/graph/orphans.json` | `.hivemind/archive/graph/` | Preserve for reference, rebuild clean |
| `.hivemind/graph/tasks.json` | `.hivemind/archive/graph/` | Preserve for reference, rebuild clean |
| `.hivemind/state/brain.json` | `.hivemind/archive/state/` | Preserve metrics history |
| `src/tools/hiveops-*.ts` | `src/legacy/tools/` | Preserve for migration reference |

### 6.3 What to Migrate

| Source | Target | Method |
|--------|--------|--------|
| `.hivemind/project/planning/*` | Keep as-is | Already canonical |
| `.hivemind/config/*` | Keep as-is | Already structured |
| `.hivemind/states/shared/*` | Keep as-is | Already concise |
| `.hivemind/templates/` | Keep as-is | Already useful |

### 6.4 What to Regenerate

| Target | Source | Method |
|--------|--------|--------|
| `.hivemind/state/active.json` | brain.json + hierarchy.json + tasks.json | Consolidate into single file |
| `.hivemind/state/anchors.json` | New | Initialize from planning docs |
| `.hivemind/sessions/current.json` | active.md + session manifests | Create from current state |

---

## 7. Session Bootstrap and Continuation Design

### 7.1 `hm-init` Design

**Entry point**: `npx hivemind-context-governance --mode <mode>`

**Phases**:
1. **Profile Settings** (-profile-settings):
   - Language detection (en/vi/auto)
   - Expertise level (beginner/intermediate/expert)
   - Output style preference
   - Persist to `config/profile.json`

2. **Pathing Structures** (-pathing-structures):
   - Validate/create `.hivemind/` directory structure
   - Create missing root files (hiveneuron.json, hivebrain.md)
   - Initialize config files

3. **Governance Level** (-governance-level):
   - mild: expert opinions only
   - moderate: expert-guided workflows
   - agent-driven: fully autonomous
   - Persist to `config/governance.json`

4. **Gate-Keeping** (-gate-keeping):
   - TDD requirements
   - Spec-driven requirements
   - Research-first requirements
   - Persist to `config/guardrails.json`

### 7.2 Integrity Checks

**Via `hm-doctor`**:
1. Scan `.hivemind/` for missing/corrupt files
2. Validate JSON files against schemas
3. Check for stale artifacts (backup chains, empty manifests)
4. Verify planning document consistency
5. Report health status with recommendations

### 7.3 Session Recovery

**Via plugin hooks + anchors**:
1. `session.compacting` hook: inject governance state into compaction
2. `session.created` hook: initialize governance state from anchors
3. Anchors: persistent cross-session memory via `hivemind_anchor` tool
4. Session export: structured handoffs via `hiveops_export` tool

---

## 8. Trajectory and Delegation Model

### 8.1 Intent Recovery

**Pipeline**: prompt → classification → clarification (if needed) → trajectory

1. **Parse inputs**: prompt, slash commands, skills, @agent mentions, attached files
2. **Classify intent**: exploration, planning, implementation, verification, research
3. **Clarify if ambiguous**: targeted questions only when materially improves correctness
4. **Build trajectory**: session skeleton with delegation waves

### 8.2 Delegation Waves

**Pattern**: orchestrator → researcher → executor → verifier

1. **Orchestrator** (hiveminder): plans delegation waves, monitors progress
2. **Researcher** (hivefiver/hiverd): investigates, synthesizes context
3. **Executor** (hivemake): implements changes
4. **Verifier** (hiveq): validates against acceptance criteria

### 8.3 Branch/Reroute Behavior

- **Branch conditions**: ambiguity detected, scope change, blocker encountered
- **Reroute paths**: back to orchestrator with evidence, then re-delegate
- **Failure containment**: isolate failed subagent, retry with adjusted parameters

### 8.4 Evidence-Rich Handoffs

**Required evidence for each handoff**:
- Summary of work completed
- Artifacts produced (paths)
- Decisions made (with rationale)
- Blockers encountered
- Recommended next actions
- Risk assessment

---

## 9. Verification and Completion Model

### 9.1 Success Metrics

| Metric | Measurement | Threshold |
|--------|-------------|-----------|
| Context integrity | Drift score in brain.json | < 20 |
| Workflow completion | Gates passed / gates required | 100% |
| Session trajectory | Actions completed / actions planned | > 80% |
| Evidence quality | Artifacts with verification | 100% of claims |
| Noise reduction | Auto-spawned artifacts | < 5 per session |

### 9.2 Acceptance Criteria

**Per workflow**:
- All gates passed
- All TODOs completed or explicitly deferred
- Evidence artifacts produced
- Handoff summary generated
- No unresolved blockers

**Per session**:
- Intent satisfied or explicitly escalated
- Context preserved via anchors/exports
- Next actions defined
- Risk documented

### 9.3 Gatekeeping Patterns

**Via plugin hooks**:
- `tool.execute.before`: verify checkpoint prerequisites
- `session.idle`: check pending checkpoints
- `file.edited`: track modifications for audit trail

**Via tools**:
- `hiveops_gate`: create/verify quality gates
- `hiveops_todo`: track completion status
- `hiveops_export`: produce structured handoffs

---

## 10. Practical Implementation Order

### Phase 1: Foundation First (Week 1)

1. **Archive legacy artifacts**:
   - Move `hiveops-*.ts` to `src/legacy/tools/`
   - Move `graph/*.json` to `.hivemind/archive/graph/`
   - Clean up backup chains

2. **Establish new state model**:
   - Create `state/active.json` from brain.json consolidation
   - Create `state/anchors.json` for cross-session memory
   - Create `state/checkpoints.json` for gate results

3. **Fix integrity issues**:
   - Generate `config.json` via hm-doctor
   - Populate `sessions/current.json`
   - Clean up empty manifests

### Phase 2: Integrity Recovery (Week 2)

1. **Implement cleanup hooks**:
   - Add cleanup logic to graph-io.ts
   - Add rotation policy to persistence.ts
   - Add expiration to session-runtime.ts

2. **Establish context-loading strategy**:
   - Implement tiered loading in session-kernel.ts
   - Add anchor injection via session.compacting hook
   - Add session recovery via session.created hook

3. **Refactor session files**:
   - Consolidate 14 session files into 3-4 modules
   - Standardize naming to hyphenated
   - Remove session_coherence.ts underscore naming

### Phase 3: Cleanup (Week 3)

1. **Split oversized files**:
   - Split doc-intel.ts into 4 modules
   - Split hierarchy-tree.ts into 4 modules
   - Split state-mutation-queue.ts into 3 modules

2. **Consolidate overlapping modules**:
   - Merge governance files into governance/ module
   - Merge planning files into planning/ module
   - Merge detection files into detection/ module

3. **Implement gate system**:
   - Create hiveops_gate tool with verification patterns
   - Add plugin hooks for checkpoint verification
   - Implement evidence collection

### Phase 4: Hardening (Week 4+)

1. **Add enforcement**:
   - CI linting for 350 LOC threshold
   - Automatic cleanup on session close
   - Drift detection and alerts

2. **Optimize context loading**:
   - Implement lazy loading for tier 3-4 content
   - Add context compression for long sessions
   - Implement smart context pruning

3. **Polish UX**:
   - Improve hm-init guided flow
   - Add hm-doctor diagnostic reporting
   - Enhance hm-harness improvement suggestions

---

## 11. Next-Stage Decision Points

### Decision 1: Legacy Tool Archival
**Question**: Archive `hiveops-*.ts` tools immediately or migrate functionality first?
- **Option A** (Recommended): Archive immediately, functionality already duplicated in `hivemind-*` tools
- **Option B**: Migrate unique functionality, then archive
- **Impact**: Low risk, high cleanup value

### Decision 2: Session File Consolidation
**Question**: Consolidate 14 session files into 3-4 modules or keep separate with better organization?
- **Option A** (Recommended): Consolidate into `session/core/`, `session/governance/`, `session/io/`
- **Option B**: Keep separate but add clear module boundaries
- **Impact**: Medium risk, high maintainability value

### Decision 3: State Model Replacement
**Question**: Replace `brain.json` + backups with `active.json` or evolve brain.json?
- **Option A** (Recommended): Replace with cleaner active.json design
- **Option B**: Evolve brain.json with pruning and rotation
- **Impact**: Medium risk, high clarity value

### Decision 4: Graph System Fate
**Question**: Delete graph system entirely or rebuild from clean slate?
- **Option A** (Recommended): Archive current, rebuild only if needed
- **Option B**: Clean up and keep
- **Impact**: High risk if deleted, low value if kept polluted

---

## Appendix A: File Size Audit Summary

### Critical Files (>500 LOC)
- `src/lib/doc-intel.ts` - 1,785 LOC
- `src/lib/hierarchy-tree.ts` - 1,385 LOC
- `src/lib/state-mutation-queue.ts` - 928 LOC
- `src/lib/doc-intel/write-ops.ts` - 876 LOC
- `src/lib/detection.ts` - 857 LOC
- `src/lib/graph-migrate.ts` - 853 LOC
- `src/tools/hivemind-doc.ts` - 911 LOC
- `src/tools/hiveops-todo.ts` - 522 LOC

### Total LOC by Directory
- `src/lib/` - 30,027 LOC (100 files)
- `src/tools/` - 5,872 LOC (22 files)
- `.hivemind/state/` - ~1,950 LOC (mostly brain.json + backups)
- `.hivemind/graph/` - 1,445 LOC (orphans.json + tasks.json)

### Recommendation
Enforce 350 LOC threshold via CI. Split files exceeding threshold into focused modules.

---

## Appendix B: OpenCode Integration Points

### Plugin Hooks for Governance
- `tool.execute.before` - Pre-execution verification
- `tool.execute.after` - Post-execution audit trail
- `session.compacting` - State preservation during compaction
- `session.created` - Session initialization
- `session.idle` - Pending checkpoint verification
- `file.edited` - File modification tracking

### Custom Tools for Governance
- `hivemind_checkpoint` - Create/verify checkpoints
- `hiveops_gate` - Quality gates with pass/fail
- `hiveops_export` - Structured session exports
- `hivemind_anchor` - Persistent cross-session memory
- `hiveops_todo` - Hierarchical task management

### Skills for Governance Patterns
- `hivemind-session-lifecycle` - Session management patterns
- `hivemind-gates` - Quality gate patterns
- `hivemind-exports` - Handoff patterns
- `hivemind-verification` - Verification patterns

### Commands for Workflows
- `hivefiver-research` - Governance research
- `hivefiver-audit` - Governance audit
- `hm-init` - Initialization workflow
- `hm-doctor` - Diagnostic workflow

---

## Appendix C: GSD Workflow Mapping

| GSD Workflow | HiveMind Equivalent | Status |
|--------------|---------------------|--------|
| `new-project.md` | `hm-init` | Design complete |
| `health.md` | `hm-doctor` | Design complete |
| `execute-phase.md` | Session execution | Via hiveminder |
| `verify-phase.md` | `hiveops_gate` tool | Implemented |
| `research-phase.md` | `hivefiver-research` command | Implemented |
| `plan-phase.md` | Planning tools | Implemented |
| `map-codebase.md` | `hm-doctor` + codemap | Partial |
| `diagnose-issues.md` | `hm-doctor` | Design complete |
| `cleanup.md` | `hm-harness` | Design complete |

---

*This audit provides the foundation for next-stage refactoring decisions. All findings are evidence-based from ground-truth analysis of the actual codebase and `.hivemind/` directory.*
