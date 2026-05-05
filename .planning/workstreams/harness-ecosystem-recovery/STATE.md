# STATE: Harness Ecosystem Recovery

**Workstream:** harness-ecosystem-recovery
**Status:** ACTIVE
**Last Updated:** 2026-05-06

## Phase Status

| Phase | Goal | Status | Depends On |
|-------|------|--------|------------|
| HER-0 | Ecosystem Re-map & Reality Audit | ✅ COMPLETE (2026-05-05) | — |
| HER-1 | Documentation & Configuration Recovery | ✅ COMPLETE (2026-05-05) | HER-0 |
| HER-2 | Dead Code Cleanup (13.7% → ~6.5%) | ✅ COMPLETE (2026-05-05) | HER-1 |
| HER-3 | Context & Compaction | 🟢 READY | HER-2 (→ satisfied: prompt-packet/ + session-entry/ wired) |
| HER-4 | SDK Integration Depth | 🟢 READY | HER-1 |
| HER-5 | Agent Rationalization | 🟢 READY | HER-1 |

## Key Artifacts

| Artifact | Path |
|----------|------|
| Workstream ROADMAP | `workstreams/harness-ecosystem-recovery/ROADMAP.md` |
| Ecosystem Map (SOT) | `phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-map-2026-05-05.md` |
| Reconciliation Matrix | `phases/HER-0-ecosystem-remap-audit/matrix/ecosystem-reconciliation-matrix-2026-05-05.md` |
| HER-0 Summary | `phases/HER-0-ecosystem-remap-audit/HER-0-SUMMARY-2026-05-05.md` |
| HER-1 Context | `phases/HER-1-doc-config-recovery/HER-1-CONTEXT.md` |
| HER-2 Summary (Plan 01) | `phases/HER-2-dead-code-cleanup/HER-2-01-PLAN.md` |
| Master Skeleton | `workstreams/harness-ecosystem-recovery/INTEGRATED-SYSTEMATIC-SKELETON-2026-05-06.md` |
| Workstream STATE | `workstreams/harness-ecosystem-recovery/STATE.md` (this file) |
| Workstream REQUIREMENTS | `workstreams/harness-ecosystem-recovery/REQUIREMENTS.md` |

## Metrics

- 5 phases defined (HER-0 through HER-5)
- 3 complete (HER-0, HER-1, HER-2)
- 3 ready (HER-3, HER-4, HER-5)
- 17 plans executed across HER-0/1/2
- Dead code: 13.7% → ~6.5% (~1,562 LOC removed)
- 4 module groups removed (intake-cache/, purpose-classifier/, category-router/, schema-kernel/ restructured)
- 14 broken command agent references fixed (HER-1)
- AGENTS.md: 97→89 agents, 51→58 skills synced (HER-1)
- ARCHITECTURE.md: 9→16 tools, 57→89 agents fixed (HER-1)
- validate-restart: 0 errors (HER-1 exit gate)
- session-entry/ wired: event observer on session.created + system.transform hook (HER-2 Plan 03)
- prompt-packet/ compaction preservation: intake caching + routing context injection + compaction durability (HER-2 Plan 03)
- auto-loop + ralph-loop: wired as runtime DI primitives (HER-2 Plan 02)
- notification-handler: Re-activated Phase 16.2, boundary violations fixed (HER-2 Plan 02)

## Dependencies

### Internal Chain
```
HER-0 ✅ → HER-1 ✅ → HER-2 ✅ → HER-3 🟢 (prompt-packet/ wired ✅)
                                    HER-4 🟢 (independent after HER-1 ✅)
                                    HER-5 🟢 (independent after HER-1 ✅)
```

### Cross-Workstream Dependencies
- **HER-0 → hivemind-state-architecture (WS-1)**: Ecosystem map provides foundation for `.hivemind/` directory design (CRITICAL dependency)
- **HER-1 → primitive-registry (WS-3)**: Fixed command refs and validate-restart lay ground for registry
- **HER-2 → HER-3**: prompt-packet/ compaction-preservation wired — HER-3 context budget management can now consume compacted state
- **HER-3 → context-compaction-engine (WS-7, deferred)**: Event-tracker redesign and context purification build on compaction pipeline

## Child Documents

- ROADMAP.md — Detailed phase plans, requirements, and status
- REQUIREMENTS.md — Feature requirements per phase (HER-0-A through HER-2-F)
- phases/HER-0-ecosystem-remap-audit/ — Ecosystem audit artifacts
- phases/HER-1-doc-config-recovery/ — Documentation recovery artifacts
- phases/HER-2-dead-code-cleanup/ — Dead code cleanup artifacts
- phases/HER-3-context-compaction/CONTEXT.md — Context & compaction plan
- phases/HER-4-sdk-integration-depth/CONTEXT.md — SDK integration depth plan
- phases/HER-5-agent-rationalization/CONTEXT.md — Agent rationalization plan
