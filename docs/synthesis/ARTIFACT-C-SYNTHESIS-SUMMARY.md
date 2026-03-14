# ARCHITECTURE SYNTHESIS SUMMARY

> **Purpose**: Executive summary for next-stage refactoring decisions  
> **Generated**: 2026-03-14  
> **Cycle**: Investigation + Synthesis Phase Complete

---

## INVESTIGATION WAVES COMPLETED

| Wave | Focus | Artifact Produced |
|------|-------|-------------------|
| 1 | Root-Cause Pollution Map | ARTIFACT-A-ROOT-CAUSE-POLLUTION-MAP.md |
| 2 | Archiving Decisions | ARTIFACT-B-ARCHIVING-DECISIONS.md |
| 3 | OpenCode Native Synthesis | OPENCODE-NATIVE-SYNTHESIS.md (existing) |
| 4 | Current Codebase Audit | Audit embedded in Task agent outputs |

---

## KEY FINDINGS

### Pollution Sources Identified (Critical)

1. **Task Duplication**: `hivefiver-integration.ts:seedTasks()` creates new phases without deduplication
2. **Lineage Duplication**: `session-kernel.ts` writes to both lineages when scope undefined
3. **Context Bloat**: `state-mutation-queue.ts` accumulates without compaction

### Files >350 LOC Requiring Attention

**Critical (>800 LOC)**: doc-intel.ts (1785), hierarchy-tree.ts (1385), state-mutation-queue.ts (928), write-ops.ts (876), detection.ts (857), graph-migrate.ts (853), signature-extractor.ts (821)

**High (600-800 LOC)**: paths.ts (757), hivefiver-integration.ts (742), session-kernel.ts (672), session-engine.ts (669), session_coherence.ts (663), read-ops.ts (663)

### Similar-Named Session Files (12 files)

session_coherence.ts, session-boundary.ts, session-engine.ts, session-export.ts, session-governance.ts, session-intent-classifier.ts, session-kernel.ts, session-memory-purge.ts, session-role.ts, session-runtime.ts, session-split.ts

**Recommendation**: Consolidate into `lib/session/` directory with 6-8 focused modules

---

## GSD → HIVEMIND KNOWLEDGE TRANSFER

### Worth Adopting (Adapt Required)

| GSD Pattern | Hivemind Adaptation | Reason |
|-------------|---------------------|--------|
| Phase-based workflow | Session trajectory outlines | User's Phase 4.2 requirement |
| State.md checkpointing | hivebrain.md + hiveneuron.json | User's target architecture |
| Verification patterns | Gate-driven completion | User's acceptance criteria |
| Decimal phase calculation | Dependency-aware sequencing | For TODO governance |
| TDD checkpoint gates | Quality gates in hiveops-gate | User's gate-keeping config |

### Must Be Changed

| GSD Pattern | Why Change | Hivemind Approach |
|-------------|------------|-------------------|
| Interactive Q&A | OpenCode is non-interactive | Use flags, skills, or multi-choice via tool output |
| .gsd directory structure | Different ecosystem | Adopt proposed .hivemind hierarchy |
| init.cjs CLI approach | Different platform | Use opencode commands + TUI |
| Milestone-centric planning | User wants session-centric | Session first, milestone second |

### Must Be Rejected

| GSD Pattern | Why Reject |
|-------------|------------|
| Interactive prompts | Non-interactive shell constraint |
| Global config at ~/.gsd | OpenCode uses layered config |
| Single entry point (gsd init) | User wants multi-mechanism (hm-init, hm-doctor, hm-harness) |

---

## PROPOSED .hivemind ARCHITECTURE

```
.hivemind/
├── hiveneuron.json        ← Compact neural index (active state)
├── hivebrain.md           ← Human-readable context map
├── config/
│   ├── profile.json       ← User preferences
│   ├── governance.json    ← Governance level settings
│   └── guardrails.json    ← TDD/spec/research gates
├── state/
│   └── sessions.json      ← Active session registry (DEDUPLICATED)
├── project/
│   ├── PROJECT.md
│   ├── ROADMAP.md
│   ├── PROJECT-STATE.md
│   ├── MILESTONES.md
│   ├── phases/
│   │   └── XX-phase-name/
│   │       ├── XX-YY-PLAN.md
│   │       ├── XX-YY-SUMMARY.md
│   │       └── VERIFICATION.md
│   ├── research/
│   ├── todos/
│   │   ├── pending/
│   │   └── done/
│   └── codebase/
└── .archive/
    ├── migration/
    ├── orphans/
    └── sessions/
```

---

## RECOMMENDED IMPLEMENTATION ORDER

### 1. Foundation First (Blocking)
- Fix `hivefiver-integration.ts` task seeding (task duplication)
- Fix `session-kernel.ts` lineage routing (session duplication)
- Add brain.json compaction logic

### 2. Integrity Recovery (Priority)
- Delete backup files (brain.json.bak*)
- Merge session-engine.ts → session-kernel.ts
- Merge session_coherence.ts → session-governance.ts
- Clean orphan tasks from graph/tasks.json

### 3. Cleanup Third (Maintenance)
- Split large files (doc-intel, hierarchy-tree, paths, detection)
- Archive graph-migrate.ts
- Quarantine orphans.json

### 4. Hardening Later (After Foundation)
- Add compaction triggers
- Add deduplication guards
- Add orphan detection
- Implement hm-init, hm-doctor, hm-harness flows

---

## NEXT-STAGE DECISIONS REQUIRED

1. **Approve pollution fixes** — Should we proceed with seeding/routing fixes?
2. **Approve consolidation targets** — Confirm merge targets for session files?
3. **Approve split strategy** — Confirm 4-way splits for largest files?
4. **Archive timing** — Immediate or after consolidation?
5. **Test coverage** — Add tests for fix verification?

---

## ARTIFACTS FOR REVIEW

| File | Location |
|------|----------|
| Root-Cause Pollution Map | docs/synthesis/ARTIFACT-A-ROOT-CAUSE-POLLUTION-MAP.md |
| Archiving Decisions | docs/synthesis/ARTIFACT-B-ARCHIVING-DECISIONS.md |
| OpenCode Native Synthesis | docs/synthesis/OPENCODE-NATIVE-SYNTHESIS.md |
| Modernize Doc Intel Plan | docs/planning-draft/modernize-doc-intelligence-layer.md |
| Tools/Plugins Reorg Plan | docs/synthesis/tools-plugins-organized-structured.md |

---

**SYNTHESIS COMPLETE — AWAITING NEXT-STAGE DECISIONS**
