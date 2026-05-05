# UAT Reclassification Index
**Date:** 2026-05-05
**Type:** Navigation Index
**Source:** `lane-a-uat-reclassification-2026-05-05.md`

---

## Quick Navigation: Finding → Path → Lineage

### By Path

| Path | ID Range | Finding Count |
|------|----------|---------------|
| **Path 1** (Agent-Callable Tools & Skills) | UAT-F-02, UAT-F-03, UAT-F-06, UAT-F-09, UAT-F-10, UAT-B-01, UAT-B-02, UAT-P1-01, UAT-P1-02 | 9 |
| **Path 2** (Runtime Programmatic) | UAT-F-07, UAT-F-11, UAT-G-01, UAT-G-02, UAT-P2-01, UAT-P2-02, UAT-P2-03 | 7 |
| **Path 3** (Governance, Permissions, Registry) | UAT-F-01, UAT-F-05, UAT-G-03 | 3 |
| **Path 4** (Side-Car & User Onboarding) | UAT-F-04, UAT-F-08, UAT-B-03 | 3 |

### By Lineage

| Lineage | IDs | Count |
|---------|-----|-------|
| **hm** | UAT-F-01, UAT-F-06, UAT-G-01 | 3 |
| **hf** | — | 0 |
| **hm+hf** | UAT-F-02, UAT-F-03, UAT-F-04, UAT-F-05, UAT-F-07, UAT-F-08, UAT-F-09, UAT-F-10, UAT-F-11, UAT-B-01, UAT-B-02, UAT-B-03, UAT-G-02, UAT-G-03, UAT-P1-01, UAT-P1-02, UAT-P2-01, UAT-P2-02, UAT-P2-03 | 19 |

### By Severity

| Severity | IDs | Count |
|----------|-----|-------|
| **HIGH** | UAT-F-01, UAT-F-02, UAT-F-04, UAT-F-05, UAT-B-01, UAT-B-02 | 6 |
| **MEDIUM** | UAT-F-03, UAT-F-06, UAT-F-07, UAT-F-08, UAT-F-09, UAT-F-10, UAT-B-03, UAT-G-01, UAT-G-03 | 9 |
| **LOW** | UAT-F-11, UAT-G-02 | 2 |
| **PASS** | UAT-P1-01 (partial), UAT-P1-02, UAT-P2-01, UAT-P2-02, UAT-P2-03 | 5 |

### By Evidence Level

| Evidence Level | IDs | Count |
|---------------|-----|-------|
| **DIRECT** | UAT-F-01, UAT-F-02, UAT-F-03, UAT-F-04, UAT-F-05, UAT-F-06, UAT-F-07, UAT-F-08, UAT-F-09, UAT-F-10, UAT-F-11, UAT-B-01, UAT-B-02, UAT-B-03, UAT-G-02, UAT-P1-01, UAT-P1-02, UAT-P2-01, UAT-P2-02, UAT-P2-03 | 20 |
| **ABSENCE** | UAT-G-01, UAT-G-03 | 2 |

---

## Feature Map: UAT Finding → GAP-MATRIX Feature

| UAT ID | GAP-MATRIX Feature | Feature Status |
|--------|-------------------|----------------|
| UAT-F-01 | F-08b (Permission model) | PARTIAL |
| UAT-F-02 | F-03a (Agents registry & routing) | PARTIAL |
| UAT-F-03 | F-03a (Agents registry & routing) | PARTIAL |
| UAT-F-04 | F-09d (Configuration compilation) | PARTIAL |
| UAT-F-05 | F-08a (Context/event-tracker overhaul) | PARTIAL |
| UAT-F-06 | F-03b (Skills registry) | PARTIAL |
| UAT-F-07 | F-07a (Trajectory ledger) | FULL |
| UAT-F-08 | F-09c (Specialist tools for dashboard) | PARTIAL |
| UAT-F-09 | F-03f (Background PTY sessions) | FULL |
| UAT-F-10 | F-03a (Agents registry & routing) | PARTIAL |
| UAT-F-11 | F-07a (Trajectory ledger) | FULL |
| UAT-B-01 | F-03c (Tools wiring) | FULL |
| UAT-B-02 | F-03c (Tools wiring) | FULL |
| UAT-B-03 | F-09c (Specialist tools for dashboard) | PARTIAL |
| UAT-G-01 | F-06 (Custom delegation revamp) | PARTIAL |
| UAT-G-02 | F-07a (Trajectory ledger) | FULL |
| UAT-G-03 | F-08d (Quality gate triad) | PARTIAL |
| UAT-P1-01 | F-03c (Tools wiring) | FULL |
| UAT-P1-02 | F-03c (Tools wiring) | FULL |
| UAT-P2-01 | F-06 + F-07a | PARTIAL + FULL |
| UAT-P2-02 | F-07c (Agent work contracts) | FULL |
| UAT-P2-03 | F-04c + F-08c | PARTIAL + PARTIAL |

---

## Cross-Reference: UAT → Source File Index

| UAT ID | Primary Source | Cross-Referenced Sources |
|--------|---------------|--------------------------|
| UAT-F-01 | `team-b-critical-L1-L2-chain-blocked-2026-05-05.md` | `team-b-batch-11-final-audit-2026-05-05.md` (F-1), `team-b-batch-1-3-results-2026-05-05.md` |
| UAT-F-02 | `team-b-critical-validate-restart-drift-2026-05-05.md` | `team-b-batch-11-final-audit-2026-05-05.md` (F-2), `team-b-batch-9-results-2026-05-05.md` (FINDING-9.2), `team-b-batch-4-results-2026-05-05.md` |
| UAT-F-03 | `team-b-batch-11-final-audit-2026-05-05.md` (F-3) | `team-b-batch-9-results-2026-05-05.md` (FINDING-9.1), `phase-3/PHASE-3-AUDIT-2026-05-05.md` (G5) |
| UAT-F-04 | `team-b-batch-11-final-audit-2026-05-05.md` (F-4) | — |
| UAT-F-05 | `team-b-batch-11-final-audit-2026-05-05.md` (F-5) | — |
| UAT-F-06 | `team-b-batch-11-final-audit-2026-05-05.md` (F-6) | `team-b-batch-4-results-2026-05-05.md` (FINDING-4.3), `team-b-batch-9-results-2026-05-05.md` (FINDING-9.3) |
| UAT-F-07 | `team-b-batch-11-final-audit-2026-05-05.md` (F-7) | `team-b-batch-7-results-2026-05-05.md` (FINDING-7.1) |
| UAT-F-08 | `team-b-batch-11-final-audit-2026-05-05.md` (F-8) | `team-b-batch-8-results-2026-05-05.md` (FINDING-8.1) |
| UAT-F-09 | `team-b-batch-11-final-audit-2026-05-05.md` (F-9) | `team-b-batch-5-results-2026-05-05.md` (FINDING-5.1) |
| UAT-F-10 | `team-b-batch-11-final-audit-2026-05-05.md` (F-10) | `team-b-batch-6-results-2026-05-05.md` (FINDING-6.1) |
| UAT-F-11 | `team-b-batch-11-final-audit-2026-05-05.md` (F-11) | `team-b-batch-4-results-2026-05-05.md` (FINDING-4.2) |
| UAT-B-01 | `phase-1/PHASE-1-SUMMARY-2026-05-05.md` (P1) | `phase-3/PHASE-3-AUDIT-2026-05-05.md` (P1-a), `phase-1/batch-1a-prompt-enhancement/results-2026-05-05.md` |
| UAT-B-02 | `phase-1/PHASE-1-SUMMARY-2026-05-05.md` (P2) | `phase-3/PHASE-3-AUDIT-2026-05-05.md` (P1-b) |
| UAT-B-03 | `phase-1/PHASE-1-SUMMARY-2026-05-05.md` (P3) | `phase-3/PHASE-3-AUDIT-2026-05-05.md` (P2-a) |
| UAT-G-01 | `phase-3/PHASE-3-AUDIT-2026-05-05.md` (G1) | — |
| UAT-G-02 | `phase-3/PHASE-3-AUDIT-2026-05-05.md` (G2) | — |
| UAT-G-03 | `phase-3/PHASE-3-AUDIT-2026-05-05.md` (G3) | — |
| UAT-P1-01 | `team-b-batch-1-3-results-2026-05-05.md` (Test 1.8) | — |
| UAT-P1-02 | `phase-1/PHASE-1-SUMMARY-2026-05-05.md` | All phase-1 batch results |
| UAT-P2-01 | `phase-2/PHASE-2-RESULTS-2026-05-05.md` (Test 1) | — |
| UAT-P2-02 | `phase-2/PHASE-2-RESULTS-2026-05-05.md` (Test 2) | — |
| UAT-P2-03 | `phase-2/PHASE-2-RESULTS-2026-05-05.md` (Test 3) | — |

---

## Path-to-Path Dependency: Findings That Span Multiple Paths

| UAT ID | Primary Path | Secondary Path | Relationship |
|--------|-------------|----------------|-------------|
| **UAT-F-02** | Path 1 (F-03a Agents registry) | Path 2 (F-04c Workflow router) | Agent references in commands break both agent discovery AND command routing |
| **UAT-P2-01** | Path 2 (F-06 Delegation revamp) | Path 2 (F-07a Trajectory ledger) | Positive: delegation pipeline feeds trajectory |
| **UAT-P2-03** | Path 2 (F-04c Workflow router) | Path 3 (F-08c Tool capability matrix) | Positive: command discovery cross-referenced with tool catalog |

---

## Unrepresented Features (No UAT Coverage)

These GAP-MATRIX features had **zero** UAT findings (positive or negative) — either unimplemented or not tested:

| Feature | Path | Status | Reason for No Coverage |
|---------|------|--------|----------------------|
| **F-03d** MCP server integration | 1 | NONE | Feature not implemented — no code in `src/` |
| **F-09a** Long-haul compaction survival | 4 | DEAD | All 4 prompt-packet files unused; no runtime wiring |
| **F-09b** SDK hooks/events | 4 | PARTIAL | Implemented but not UAT tested in any phase |

---

## Metadata

- **Agent:** hm-l2-general (HER-0 Lane A UAT Reclassifier)
- **Workstream:** harness-ecosystem-recovery
- **Phase:** HER-0-ecosystem-remap-audit
- **Lane:** A (UAT Reclassification)
- **Classification Taxonomy:** 4-Path × 3-Lineage × 5-Surface (from HER-0-RESEARCH §Classification Taxonomy)
- **Total UAT Sources:** 24 files read
- **Total Reference Sources:** 3 files (GAP-MATRIX, FEATURE-DEPENDENCY-GRAPH, HER-0-RESEARCH)
- **Total Findings Classified:** 22
- **Unclassified:** 0
