# SR Restructuring Decisions (Archived from STATE.md)

**Archived:** 2026-05-11 per Phase 11 D-07. All SR phases (SR-0 through SR-10) are COMPLETE.

---

### Key Restructuring Decisions

| ID | Decision |
|----|----------|
| SR-D-01 | kebab-case everywhere — directories and files follow OMO naming conventions |
| SR-D-02 | Feature-module pattern — each module has `index.ts` (barrel), `types.ts`, `AGENTS.md` |
| SR-D-03 | Colocated tests — `manager.ts` + `manager.test.ts` in same directory (not separate `tests/`) |
| SR-D-04 | 500 LOC cap — modules exceeding 500 LOC (continuity.ts: 465, plugin.ts: 447, delegation-manager.ts: ~500) must be split |
| SR-D-05 | AGENTS.md at every level — hierarchical guidance from `src/AGENTS.md` down to individual module `AGENTS.md` |
| SR-D-06 | Circular dependency resolution — `primitive-scanners.ts ↔ primitive-registry.ts` and `runtime-validator.ts ↔ cross-primitive-validator.ts` resolved by extracting shared types |
| SR-D-07 | Rollback strategy — per-phase atomic commits; full rollback via `git checkout main && git branch -D refactor/structure-restructuring` |
