# Plan Lifecycle Reference

## Worked Example

**Input**: Spec candidate for "Add user authentication module"

**Phase 1 — Validation**:
- Completeness: functional ✓, non-functional ✓, integration ✓, risk ✓, operations ✓
- Feasibility: `src/core/` exists, `src/shared/types.ts` exists ✓
- Constraints: 2-day timeline, no external deps ✓
- Ambiguity residual: none ✓

**Phase 2 — Decomposition**:
- Phase 1: Foundation (types, config) — 2 files
- Phase 2: Core auth logic — 3 files
- Phase 3: API endpoints — 2 files
- Phase 4: Integration tests — 3 files

**Phase 3 — Dependencies**:
- Phase 2 depends on Phase 1 (needs types)
- Phase 3 depends on Phase 2 (needs auth logic)
- Phase 4 depends on Phase 3 (tests API)
- Critical path: 1 → 2 → 3 → 4

**Phase 4 — Tracking**:
- Phase 1: complete, commit abc123
- Phase 2: in-progress, 2/3 files done

**Phase 5 — Retraceability**:
- Plan → Phase 1 → Slice: types-setup → Packet: types-setup-001 → Return: complete → Commit: abc123
