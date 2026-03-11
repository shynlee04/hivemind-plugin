# Deep Scan Audit — Master Index

**Generated**: 2026-03-12
**Source**: hivexplorer synthesized knowledge packet
**Scope**: Full codebase audit for Phase 1 concerns, dead code, and runtime impact

---

## Document Navigation

| # | Document | Description | Files Covered |
|---|----------|-------------|---------------|
| 01 | [Phase 1 Concern Register](./01-PHASE1-CONCERN-REGISTER-2026-03-12.md) | Restricted zones, injection pipeline, authority surfaces | 35 |
| 02 | [Safe to Archive](./02-SAFE-TO-ARCHIVE-2026-03-12.md) | Dead code with no consumers | 15+ |
| 03 | [Later Phase Files](./03-LATER-PHASE-FILES-2026-03-12.md) | Files deferred to Phases 2-5 | TBD |
| 04 | [Sector Responsibility Matrix](./04-SECTOR-RESPONSIBILITY-MATRIX-2026-03-12.md) | Sector-level ownership mapping | 9 sectors |
| 05 | [Runtime Impact Map](./05-RUNTIME-IMPACT-MAP-2026-03-12.md) | Entry → Mid-Session → Exit flows | 20+ |

---

## Summary Counts

### Phase 1 Concerns (35 files)

| Category | Count | Severity |
|----------|-------|----------|
| 🔴 RESTRICTED ZONES | 2 | CRITICAL |
| 🟡 HIGH-RISK INJECTION PIPELINE | 8 | HIGH |
| 🟡 AUTHORITY SURFACES | 4 | HIGH |
| 🟡 CONTRACT MISMATCHES | 1 | MEDIUM |
| 🟡 CQRS VIOLATIONS | 2 | HIGH |
| 🟡 TREE-SITTER DEPENDENT | 6 | MEDIUM |
| 🟡 SKILLS | 8 | HIGH |
| 🟡 COMMANDS | 3 | MEDIUM |

### Safe to Archive (15+ files)

| Category | Count | Risk |
|----------|-------|------|
| 🔴 DEAD CODE - NO CONSUMERS | 6 | LOW |
| 🟢 DEPRECATED COMPATIBILITY | 8+ | LOW |
| 🔴 DELETED 2026-03-09 | 9 | NONE |

---

## Audit Methodology

1. **Deep Scan**: Glob + grep across all code directories
2. **Consumer Analysis**: Import/require tracing for dead code detection
3. **Runtime Flow Mapping**: Hook execution order and data dependencies
4. **Contract Verification**: Schema vs implementation alignment
5. **Ownership Attribution**: Per-file lineage and responsibility

---

## Action Priority

1. **IMMEDIATE**: Address restricted zones (2 files) — requires phased plan
2. **HIGH**: Review injection pipeline (8 files) — per-turn execution risk
3. **MEDIUM**: Resolve CQRS violations (2 tools) — state integrity risk
4. **LOW**: Archive dead code (6 files) — cleanup with rollback safety

---

## Related Documents

- `AGENTS.md` — Project governance and agent registry
- `CONTAMINATION-GUARDRAILS.md` — Forensic contamination defense
- `docs/plans/NODE-1-INJECTION-LAYER-REFACTOR-2026-03-04.md` — Active refactor blueprint

---

*Maintained by: hivefiver meta-builder*
*Next review: 2026-03-19*
