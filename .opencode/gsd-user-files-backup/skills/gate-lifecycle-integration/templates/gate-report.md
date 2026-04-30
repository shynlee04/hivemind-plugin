# Lifecycle Integration Gate Report

**Date:** <!-- YYYY-MM-DD -->
**Evaluator:** <!-- Agent name -->
**Context:** <!-- Code review | Phase audit | Milestone verification | Integration check | Deployment readiness -->
**Active Lens:** <!-- Primary: Dev/Architect/PM, Secondary: Dev/Architect/PM -->
**Artifact(s):** <!-- File paths under evaluation -->

---

## Facts Section

### Dimension 1: Lifecycle Initiation

| Artifact | Checklist Items | Status | Notes |
|----------|----------------|--------|-------|
| <!-- path --> | <!-- N/M items passed --> | <!-- PASS/FAIL --> | <!-- --> |

### Dimension 2: CQRS Correctness

| Artifact | Write-Side | Read-Side | Violations | Status |
|----------|-----------|-----------|------------|--------|
| <!-- path --> | <!-- compliant? --> | <!-- compliant? --> | <!-- none or AP-XX --> | <!-- PASS/FAIL --> |

### Dimension 3: Classification Fit

| Artifact | Root | Correct? | Cross-Contamination | Status |
|----------|------|----------|-------------------|--------|
| <!-- path --> | <!-- src/.opencode/.hivemind --> | <!-- yes/no --> | <!-- none or details --> | <!-- PASS/FAIL --> |

### Dimension 4: Actor Hierarchy

| Artifact | Depth | Budget | Category | Queue Key | Status |
|----------|-------|--------|----------|-----------|--------|
| <!-- path --> | <!-- N/MAX --> | <!-- N/MAX --> | <!-- valid/invalid --> | <!-- present/missing --> | <!-- PASS/FAIL --> |

### Dimension 5: OpenCode Surface

| Artifact | Registration | Schema | Response Envelope | SDK Wrappers | Status |
|----------|-------------|--------|------------------|--------------|--------|
| <!-- path --> | <!-- present/missing --> | <!-- present/missing --> | <!-- present/missing --> | <!-- correct/incorrect --> | <!-- PASS/FAIL --> |

---

## Anti-Pattern Findings

| AP-ID | Severity | Artifact | File:Line | Description | Status |
|-------|----------|----------|-----------|-------------|--------|
| <!-- AP-XX --> | <!-- BLOCK/WARN --> | <!-- path --> | <!-- file:line --> | <!-- description --> | <!-- FOUND/CLEAR --> |

---

## Perspective Scores

### <!-- Primary Lens Name -->

| Criterion | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| <!-- D1/A1/P1 --> | <!-- 1-5 --> | <!-- Nx --> | <!-- score x weight --> |
| **Average** | | | <!-- weighted avg --> |

**Threshold:** 3.5 | **Result:** <!-- PASS/FAIL -->

### <!-- Secondary Lens Name -->

| Criterion | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| <!-- --> | <!-- 1-5 --> | <!-- Nx --> | <!-- score x weight --> |
| **Average** | | | <!-- weighted avg --> |

**Threshold:** 3.5 | **Result:** <!-- PASS/FAIL -->

---

## Verdict

**Overall:** <!-- PASS / FAIL -->

**Blocking Issues:**
<!-- List all BLOCK-level findings with file:line references. If none, write "None." -->

**Warnings:**
<!-- List all WARN-level findings. If none, write "None." -->

**Required Remediations:**
<!-- For each BLOCK finding, describe what must change. -->

---

## Routing

<!-- If PASS: -->
**Next Gate:** `gate-spec-compliance`
**Rationale:** Lifecycle integration verified. Proceed to specification-level compliance check.

<!-- If FAIL: -->
**Action Required:** STOP — fix blocking issues before re-running this gate.
**Re-run Command:** Apply remediations, then re-evaluate with this skill.
