---
phase: SR-05
type: outline
created: 2026-06-04
---

# Phase SR-05: Config & Governance Cluster Unification — Plan Outline

## Plan Summary

| Plan ID | Objective | Wave | Depends On | Requirements |
|---------|-----------|------|------------|--------------|
| SR-05-01 | Schema Extension + Config Migration + TDD Tests | 1 | — | REQ-01, REQ-04 |
| SR-05-02 | Governance Rules Population + Evaluator Depth Matching | 2 | SR-05-01 | REQ-02 |
| SR-05-03 | Behavioral Profile Config-Driven Overrides | 2 | SR-05-01 | REQ-03 |
| SR-05-04 | Naming Validation Enforcement + Tool Guard Integration | 3 | SR-05-02, SR-05-03 | REQ-05 |
| SR-05-05 | Migration Cleanup + Init Support + Verification | 3 | SR-05-04 | REQ-01, REQ-02, REQ-03, REQ-04, REQ-05 |

## Wave Structure

```
Wave 1 (Foundation):
  └── SR-05-01: Schema + Config Migration [REQ-01, REQ-04]

Wave 2 (Core Features):
  ├── SR-05-02: Governance Rules + Depth Matching [REQ-02]
  └── SR-05-03: Behavioral Profile Overrides [REQ-03]

Wave 3 (Integration + Cleanup):
  ├── SR-05-04: Naming Validation + Tool Guard [REQ-05]
  └── SR-05-05: Migration + Init + Verification [ALL]
```

## Requirements Coverage

| Requirement | Plan Coverage | Status |
|-------------|---------------|--------|
| REQ-01: Unify governance configs | SR-05-01, SR-05-05 | ✅ |
| REQ-02: Populate governance.rules | SR-05-02, SR-05-05 | ✅ |
| REQ-03: Behavioral profile config-driven | SR-05-03, SR-05-05 | ✅ |
| REQ-04: Config reconciliation | SR-05-01, SR-05-05 | ✅ |
| REQ-05: Naming validation enforcement | SR-05-04, SR-05-05 | ✅ |

## Decisions Coverage

| Decision | Plan Coverage | Status |
|----------|---------------|--------|
| D-01: Merge Strategy (single file) | SR-05-01 | ✅ |
| D-02: Reader Fallback Pattern (facade) | SR-05-05 | ✅ |
| D-03: Session Depth Tracking (dual-source) | SR-05-02 | ✅ |
| D-04: Config Field Naming Convention (snake_case) | SR-05-01, SR-05-03 | ✅ |
| D-05: Old Config File Handling (delete immediately) | SR-05-05 | ✅ |
| D-06: Naming Validation Enforcement (warning for 1 phase) | SR-05-04 | ✅ |

## OUTLINE COMPLETE

Total plans: 5
Total waves: 3
All 5 requirements covered.
All 6 decisions covered.
