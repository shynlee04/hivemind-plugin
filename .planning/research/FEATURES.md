# Feature Landscape - Phase 2 Cognitive Packer

**Domain:** Context Compilation / State Management
**Researched:** 2026-02-18

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Deterministic XML output | Context injection must be reliable | Low | Custom XML builder |
| Budget enforcement | Context windows are limited | Medium | Dynamic calculation |
| Staleness filtering | Old data pollutes context | Medium | TTS + active task logic |
| False path removal | Prevent repeating mistakes | Low | Simple type filter |
| FK validation | Data integrity | High | Orphan quarantine |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Anti-patterns section | Prevents amnesia | Medium | Compresses pruned items |
| Active task linkage | Context relevance | Low | Never stale if linked |
| Relevance scoring | Budget optimization | Medium | Drops lowest first |
| Graceful recovery | Fault tolerance | High | Recovers from corrupt files |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| AI-based compression | Non-deterministic | Relevance scoring |
| External database | Over-engineering | JSON files |
| Real-time updates | Complexity | Batch on pack call |
| Custom XML templates | Maintenance burden | Fixed schema |

## Feature Dependencies

```
packCognitiveState
├── pruneContaminated (US-011)
│   └── Filters false_path mems
│   └── Filters invalidated tasks
├── isMemStale (US-012)
│   └── Checks staleness_stamp
│   └── Checks active_task_ids
├── calculateRelevanceScore (US-012)
│   └── Task linkage scoring
│   └── Recency scoring
└── Graph I/O (US-014)
    └── loadTrajectory/loadGraphTasks/loadGraphMems
```

## MVP Recommendation

Phase 2 is already MVP complete. All table stakes features implemented.

**Prioritize for v3.1:**
1. Unit tests for `isMemStale()` and `calculateRelevanceScore()`
2. JSDoc documentation for TTS configuration
3. Edge case logging for invalid staleness_stamp

**Defer:**
- Custom XML templates: Maintenance burden, fixed schema works
- Real-time updates: Batch approach is sufficient

## Sources

- Code review: src/lib/cognitive-packer.ts, staleness.ts, graph-io.ts
- Test verification: npm test (126 tests pass)
- PRD review: docs/refactored-plan.md (US-010 to US-014)
