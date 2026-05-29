# Phase 24.5: Workflow Step Paths — Research

**Researched:** 2026-05-29
**Domain:** Workflow file path resolution
**Confidence:** HIGH (all confirmed via filesystem inspection)

## Summary

Two HM workflow files contain **4 broken file references** where the referenced path does not exist on disk. The primary victim is `hm-execute-phase.md` (3 broken step paths referencing a non-existent `workflows/hm-execute-phase/steps/` directory). A secondary victim is `hm-full.md` (1 broken topic reference to a non-existent `workflows/hm-help/modes/` directory).

The root cause is a naming convention mismatch: step files exist at `.opencode/workflows/execute-phase/steps/hm-{name}.md` (using `execute-phase` as the directory name with `hm-` prefix on filenames), but the references assume `workflows/hm-execute-phase/steps/{name}.md` (using `hm-execute-phase` as the directory name with no `hm-` filename prefix).

**Primary recommendation:** Fix all 4 file references to point to the actual paths where step files exist. Do NOT move files — only fix references.

---

## Broken Reference 1: per-plan-worktree-gate.md

| Property | Value |
|----------|-------|
| **File** | `.opencode/workflows/hm-execute-phase.md` |
| **Line** | 513 |
| **Context** | `Read and execute \`workflows/hm-execute-phase/steps/per-plan-worktree-gate.md\`` |
| **Broken path** | `workflows/hm-execute-phase/steps/per-plan-worktree-gate.md` |
| **Does NOT exist** ✅ confirmed |
| **Correct path** | `.opencode/workflows/execute-phase/steps/hm-per-plan-worktree-gate.md` |
| **Exists** ✅ confirmed (94 lines, matching content) |

---

## Broken Reference 2: post-merge-gate.md

| Property | Value |
|----------|-------|
| **File** | `.opencode/workflows/hm-execute-phase.md` |
| **Line** | 831 |
| **Context** | `Read and execute \`workflows/hm-execute-phase/steps/post-merge-gate.md\`` |
| **Broken path** | `workflows/hm-execute-phase/steps/post-merge-gate.md` |
| **Does NOT exist** ✅ confirmed |
| **Correct path** | `.opencode/workflows/execute-phase/steps/hm-post-merge-gate.md` |
| **Exists** ✅ confirmed (116 lines, matching content) |

---

## Broken Reference 3: codebase-drift-gate.md

| Property | Value |
|----------|-------|
| **File** | `.opencode/workflows/hm-execute-phase.md` |
| **Line** | 1360 |
| **Context** | `` Load and follow the full step spec from \`workflows/hm-execute-phase/steps/codebase-drift-gate.md\` `` |
| **Broken path** | `workflows/hm-execute-phase/steps/codebase-drift-gate.md` |
| **Does NOT exist** ✅ confirmed |
| **Correct path** | `.opencode/workflows/execute-phase/steps/hm-codebase-drift-gate.md` |
| **Exists** ✅ confirmed (81 lines, matching content) |

---

## Broken Reference 4: hm-full.md topic.md alias table

| Property | Value |
|----------|-------|
| **File** | `.opencode/workflows/help/modes/hm-full.md` |
| **Line** | 545 |
| **Context** | `See \`workflows/hm-help/modes/topic.md\` for the full alias table` |
| **Broken path** | `workflows/hm-help/modes/topic.md` |
| **Does NOT exist** ✅ confirmed (`.opencode/workflows/hm-help/` directory does not exist at all) |
| **Correct path** | `.opencode/workflows/help/modes/hm-topic.md` |
| **Exists** ✅ confirmed (74 lines) |

---

## Root Cause Analysis

The 3 step references in `hm-execute-phase.md` exhibit a **two-fold path construction error**:

1. **Wrong directory level:** The references use `workflows/hm-execute-phase/steps/` (named after the HM workflow file `hm-execute-phase.md`), but the actual step files live under `workflows/execute-phase/steps/` (the GSD equivalent workflow name without `hm-` prefix).

2. **Missing filename prefix:** The actual step files have an `hm-` prefix on their filenames (`hm-per-plan-worktree-gate.md`, `hm-post-merge-gate.md`, `hm-codebase-drift-gate.md`), but the references omit this prefix.

The `hm-full.md` reference exhibits a **similar directory-level error**: it uses `workflows/hm-help/modes/` but the actual directory is `workflows/help/modes/`.

---

## Resources at Actual Paths

### HM-prefixed step files (WRONG references → CORRECT files):

| Actual File | Lines | Referenced As (wrong) |
|-------------|-------|----------------------|
| `.opencode/workflows/execute-phase/steps/hm-per-plan-worktree-gate.md` | 94 | `workflows/hm-execute-phase/steps/per-plan-worktree-gate.md` |
| `.opencode/workflows/execute-phase/steps/hm-post-merge-gate.md` | 116 | `workflows/hm-execute-phase/steps/post-merge-gate.md` |
| `.opencode/workflows/execute-phase/steps/hm-codebase-drift-gate.md` | 81 | `workflows/hm-execute-phase/steps/codebase-drift-gate.md` |

### GSD non-prefixed step files (exist but NOT referenced by HM workflow):

| File | Lines |
|------|-------|
| `.opencode/get-shit-done/workflows/execute-phase/steps/per-plan-worktree-gate.md` | 94 |
| `.opencode/get-shit-done/workflows/execute-phase/steps/post-merge-gate.md` | 116 |
| `.opencode/get-shit-done/workflows/execute-phase/steps/codebase-drift-gate.md` | 81 |

> **Note:** The GSD copies under `get-shit-done/` are the developer tooling versions tracked in `gsd-file-manifest.json`. The HM-prefixed copies under `.opencode/workflows/execute-phase/steps/hm-*.md` are the correct targets for HM workflow references.

---

## Other HM Workflow References — Verified as Correct

The grep for `workflows/hm-` patterns found **no other broken references**. Every other HM workflow reference resolves to a top-level `.opencode/workflows/hm-{name}.md` file that exists on disk:

| Source | Reference | Resolution | Status |
|--------|-----------|------------|--------|
| `hm-execute-plan.md:328` | `@./.opencode/workflows/hm-node-repair.md` | File exists ✅ | OK |
| `hm-execute-phase.md:615` | `@.../workflows/hm-execute-plan.md` | File exists ✅ | OK |
| `hm-execute-phase.md:1653` | `@.../workflows/hm-transition.md` | File exists ✅ | OK |
| `hm-code-review.md:551` | `Workflow(workflow="workflows/hm-code-review-fix.md"` | File exists ✅ | OK |
| `hm-verify-work.md:492` | `@.../workflows/hm-transition.md` | File exists ✅ | OK |
| `hm-verify-work.md:547` | `@.../workflows/hm-diagnose-issues.md` | File exists ✅ | OK |
| `hm-transition.md:292` | `@.../workflows/hm-graduation.md` | File exists ✅ | OK |

---

## Fix Plan

### Fix 1 — `hm-execute-phase.md` line 513 (per-plan-worktree-gate)

**Change:**
```
Read and execute `workflows/hm-execute-phase/steps/per-plan-worktree-gate.md`
```
**To:**
```
Read and execute `.opencode/workflows/execute-phase/steps/hm-per-plan-worktree-gate.md`
```

---

### Fix 2 — `hm-execute-phase.md` line 831 (post-merge-gate)

**Change:**
```
Read and execute `workflows/hm-execute-phase/steps/post-merge-gate.md`
```
**To:**
```
Read and execute `.opencode/workflows/execute-phase/steps/hm-post-merge-gate.md`
```

---

### Fix 3 — `hm-execute-phase.md` line 1360 (codebase-drift-gate)

**Change:**
```
`workflows/hm-execute-phase/steps/codebase-drift-gate.md`
```
**To:**
```
`.opencode/workflows/execute-phase/steps/hm-codebase-drift-gate.md`
```

---

### Fix 4 — `hm-full.md` line 545 (topic.md alias table)

**Change:**
```
See `workflows/hm-help/modes/topic.md` for the full alias table.
```
**To:**
```
See `workflows/help/modes/hm-topic.md` for the full alias table.
```

---

## Verification

After applying all 4 fixes:
1. `grep -r "workflows/hm-execute-phase/steps/" .opencode/workflows/` **should return 0 matches**
2. `grep -r "workflows/hm-help/" .opencode/workflows/` **should return 0 matches**
3. `grep -r "workflows/execute-phase/steps/" .opencode/workflows/` **should return exactly 3 matches** (all pointing to correct paths)

---

## Sources

### Primary (HIGH confidence)
- Filesystem inspection of `.opencode/workflows/hm-execute-phase.md` — line 513, 831, 1360
- Filesystem inspection of `.opencode/workflows/help/modes/hm-full.md` — line 545
- Glob verification: `.opencode/workflows/hm-execute-phase/` does NOT exist
- Glob verification: `.opencode/workflows/hm-help/` does NOT exist
- Glob verification: `.opencode/workflows/execute-phase/steps/hm-*.md` — 3 files exist (correct targets)
- Glob verification: `.opencode/workflows/help/modes/hm-topic.md` — exists (correct target)
- Grep verification: `workflows/hm-` patterns in `.opencode/workflows/` — 21 matches, only 4 are broken

## Metadata

**Confidence breakdown:**
- Broken references identified: HIGH — confirmed via filesystem glob + read
- Correct paths: HIGH — confirmed via filesystem read of matching content
- No other broken HM workflow paths: HIGH — comprehensive grep with file-existence verification for each match
- Fix plan: HIGH — single-character changes to path strings

**Research date:** 2026-05-29
**Valid until:** Stable
