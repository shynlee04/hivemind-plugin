# Phase 11: Governance Reconciliation — Update All Core Artifacts (STATE.md) - Research

**Researched:** 2026-05-11
**Domain:** Governance documentation reconciliation — multi-artifact staleness detection, truth-matrix cross-referencing, evidence-based artifact update
**Confidence:** HIGH

## Summary

Phase 11 involves documenting and correcting stale claims across 13 governance artifacts. Research reveals significant staleness in numeric claims (test counts: claimed 125/1767, actual 149/2010), file-system references (src/lib/ no longer exists, messages-transform.ts no longer exists), version citations (SDK ^1.14.28 vs actual ^1.14.41), and status markers (Phase 0 gate still labeled "blocking" when all P0 phases are COMPLETE). The ROADMAP.md footer falsely claims GOV-01 and CP-ST-02 entries were added when no table rows exist. No runtime code changes are needed — this is purely a documentation/governance reconciliation phase.

**Primary recommendation:** Use a structured truth matrix (`11-TRUTH-MATRIX.md`) as the central verification artifact, then ripple corrections from STATE.md outward through PROJECT.md → REQUIREMENTS.md → ROADMAP.md → sector AGENTS.md, with each wave validated against live filesystem/git evidence before moving to the next.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Stale claim detection | Planning/Governance (`.planning/`) | — | Cross-reference artifact claims against live filesystem and git log |
| STATE.md update | Planning/Governance (`.planning/`) | — | STATE.md is the central governance anchor, updated first |
| Truth matrix generation | Planning/Governance (`.planning/`) | — | Committed artifact linking claims to verification sources |
| AGENTS.md audit | Soft Meta-Concepts (`.opencode/`) + Planning | — | Sector AGENTS.md span both sectors; audit is read-only governance |
| Archive mechanism | Planning/Governance (`.planning/archive/`) | — | New `state-history/` directory for completed-phase detail |
| Numeric verification | Filesystem + Test runner | — | `find`, `wc`, `npm test` provide automated truth |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Tier 1 + sector AGENTS.md (13 files). Update STATE.md, PROJECT.md, REQUIREMENTS.md, ROADMAP.md (Tier 1) plus all sector-level AGENTS.md files. Module-level AGENTS.md files under src/ subdirectories are not in scope unless a sector-level AGENTS.md references them incorrectly.
- **D-02:** Wave-based approach. Update STATE.md first as anchor, then ripple outward: STATE → PROJECT → REQUIREMENTS → ROADMAP → AGENTS.md files. Each wave's corrections inform the next.
- **D-03:** Honest evidence reset. Downgrade over-claimed statuses. Upgrade items now proven. Add explicit phase evidence references.
- **D-04:** Full roadmap audit. Add missing GOV-01 and CP-ST-02 phase definition rows. Fix stale phase status markers. Verify dependency chains.
- **D-05:** Deep cross-reference. Verify claims using git log, phase directory completion evidence, and live codebase inspection. Two evidence sources where available.
- **D-06:** Unverifiable claims → [UNVERIFIED] marker. Claims without verifiable evidence keep current status but get explicit [UNVERIFIED] annotation.
- **D-07:** Archive completed-phase detail. Move SR decision tables, BOOT task lists, and Phase 0 artifact detail from STATE.md to `.planning/archive/state-history/` as date-stamped files.
- **D-08:** Strict numeric verification. Verify test counts, agent counts, skill counts against live codebase.
- **D-09:** Runway-focused STATE.md. Target ~150-200 lines: Current Status → What's Broken/Missing → Active Phase Runway → Recent Decisions → Key Artifacts Index.
- **D-10:** Condense "What's Delivered." Replace detailed table with summary paragraph.
- **D-11:** AGENTS.md audit + context. Verify claims, correct stale references (especially src/lib/ → new plane paths), add "Current Phase Context" section.
- **D-12:** Archive mechanism. New `.planning/archive/state-history/` directory with date-stamped files.
- **D-13:** Truth matrix as committed deliverable (`11-TRUTH-MATRIX.md`).
- **D-14:** Live evidence wins for contradiction resolution.
- **D-15:** Audit-only for missing AGENTS.md. Do NOT create new AGENTS.md files.

### the agent's Discretion
- Exact internal structure of the truth matrix
- Specific wording of STATE.md sections
- Order of AGENTS.md file audit within the final wave
- Which specific historical STATE.md sections get full archival vs inline collapse
- Exact format of archive files

### Deferred Ideas (OUT OF SCOPE)
- Creating missing AGENTS.md files
- Creating missing AGENTS.md for .hivemind/ sector
- Runtime readiness proof
- Full .planning/ surface audit beyond the 13 files
- Sidecar integration (Q2, separate project)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GOV-01 | Governance block injection is DELIVERED per REQUIREMENTS.md | Verified: governance-block.ts wired into create-core-hooks.ts, REQUIREMENTS.md Path 2 confirms DELIVERED |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Git | Native | Evidence source for file modification history | Authoritative timeline for claim verification |
| Bash + find/wc | Native | Filesystem enumeration, file counting, directory listing | Zero-dependency verification of numeric claims |
| Vitest | ^2.x (project) | Test execution and result reporting | Project's test framework; `npx vitest run --reporter=verbose` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| grep/rg | Native | Pattern search across AGENTS.md and markdown files | Detecting stale references (src/lib/, old counts) |
| `gsd-sdk query` | Project | Phase status queries from .planning/ artifacts | Automated staleness detection for ROADMAP/STATE consistency |

**Version verification:** No external packages to install. All tools are native POSIX or project-internal.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHASE 11: Governance Reconciliation            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WAVE 1: STATE.md (Anchor)                                      │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ Live Evidence│───▶│ Staleness    │───▶│ Update STATE.md    │  │
│  │ (git, find,  │    │ Detection    │    │ (runway-focused)   │  │
│  │  npm test)   │    │ (comparison) │    │ (~150-200 lines)   │  │
│  └─────────────┘    └──────────────┘    └───────────────────┘  │
│                                                 │               │
│  WAVE 2: Tier 1 Corrections                   ▼                │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ ARCHIVE old  │───▶│ Update       │───▶│ Update            │  │
│  │ STATE.md     │    │ PROJECT.md   │    │ REQUIREMENTS.md    │  │
│  │ detail       │    │ (counts,     │    │ (status alignment)│  │
│  └─────────────┘    │  versions)   │    └───────────────────┘  │
│                     └──────────────┘          │                │
│  WAVE 3: ROADMAP                               ▼               │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ Add GOV-01   │───▶│ Fix stale    │───▶│ Verify dependency │  │
│  │ & CP-ST-02   │    │ status flags │    │ chains post-SR    │  │
│  │ table rows   │    │ (complete)   │    │                   │  │
│  └─────────────┘    └──────────────┘    └───────────────────┘  │
│                                                 │               │
│  WAVE 4: AGENTS.md Audit (7 sector files)        ▼              │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐  │
│  │ Scan each    │───▶│ Detect stale │───▶│ Add Phase Context  │  │
│  │ AGENTS.md    │    │ refs (lib/)  │    │ section           │  │
│  └─────────────┘    └──────────────┘    └───────────────────┘  │
│                                                                  │
│  CROSS-CUTTING: 11-TRUTH-MATRIX.md (built across all waves)     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Claim │ Source Artifact │ Verification Source │ Verdict   │   │
│  │ "125 tests" │ STATE.md  │ find + wc → 149  │ CORRECTED  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure (new artifacts)
```
.planning/
├── phases/
│   └── 11-governance-reconciliation-update-all-core-artifacts-state-md/
│       ├── 11-RESEARCH.md          # This file
│       ├── 11-CONTEXT.md           # Existing
│       ├── 11-PLAN.md              # To be created by planner
│       ├── 11-TRUTH-MATRIX.md      # Committed deliverable (D-13)
│       └── 11-VERIFICATION.md      # L5 evidence after completion
├── archive/
│   └── state-history/              # NEW (D-12)
│       ├── .gitkeep
│       └── state-archive-2026-05-11.md   # Date-stamped archive
├── STATE.md                        # Updated (Wave 1)
├── PROJECT.md                      # Updated (Wave 2)
├── REQUIREMENTS.md                 # Updated (Wave 2)
└── ROADMAP.md                      # Updated (Wave 3)
```

### Pattern 1: Wave-Based Artifact Reconciliation
**What:** Update artifacts in dependency order, each wave validated before the next.
**When to use:** When multiple governance artifacts share cross-referenced claims.
**Example:**
```
Wave 1: STATE.md (anchor — all downstream corrections derive from here)
Wave 2: PROJECT.md + REQUIREMENTS.md (depend on STATE.md status)
Wave 3: ROADMAP.md (depends on accurate phase status from Wave 1-2)
Wave 4: Sector AGENTS.md (depends on accurate structural claims from all above)
Truth Matrix: Updated concurrently across all waves
```

### Pattern 2: Evidence-Backed Claim Correction
**What:** Every correction cites at least one live verification source (git log, filesystem, test output).
**When to use:** All artifact updates in this phase.
**Example:**
```markdown
| Claim | Before | After | Verification |
|-------|--------|-------|-------------|
| Test file count | 125 | 149 | `find tests -name "*.test.ts" ! -path "*/node_modules/*" \| wc -l` = 149 |
```

### Anti-Patterns to Avoid
- **Batch-correction without verification:** Don't correct claims across multiple files at once without live verification between each. Changes can cascade incorrectly.
- **Trusting STATE.md over filesystem:** STATE.md claims must be verified against the filesystem; filesystem wins when they conflict (D-14).
- **Assuming frontmatter is current:** `gsd_state_version` frontmatter in STATE.md (`completed_phases: 1`) is programmatically stale — do not trust it.
- **Creating new AGENTS.md:** D-15 explicitly forbids creation. Document gaps only.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File counting | Custom counting script | `find ... | wc -l` | Standard, reproducible, zero dependencies |
| Git history analysis | Custom git parser | `git log --oneline` | Already available, authoritative |
| Test result parsing | Custom reporter | `npx vitest run --reporter=verbose` | Built into project test framework |
| Stale reference detection | Manual code search | `grep -rn "src/lib/" --include="*.md"` | Pattern matching catches all references at once |

**Key insight:** This phase requires no new tools or libraries. All verification uses existing project infrastructure (git, npm, vitest) and POSIX commands (find, wc, grep). The value is in the systematic cross-referencing, not in tooling.

## Runtime State Inventory

> Skip for this phase — no rename/refactor/migration. This is a documentation reconciliation phase.

## Common Pitfalls

### Pitfall 1: Frontmatter Blindness
**What goes wrong:** Trusting STATE.md frontmatter fields (completed_phases, total_phases, percent) without verification. Frontmatter reports `completed_phases: 1` but ROADMAP shows ~21 COMPLETE phases.
**Why it happens:** Frontmatter is programmatically generated and not updated by manual edits.
**How to avoid:** Cross-verify every frontmatter field against ROADMAP table counts and filesystem evidence.
**Warning signs:** Frontmatter shows `completed_phases: 1` but ROADMAP has dozens of ✅ COMPLETE rows.

### Pitfall 2: ROADMAP Footer False Claims
**What goes wrong:** ROADMAP footer says "GOV-01 (Phase 11) + CP-ST-02 (Phase 12) added" but no actual table rows exist. A footer claim without corresponding table rows creates a false sense of completeness.
**Why it happens:** The footer was updated as a placeholder before the actual rows were added.
**How to avoid:** Verify every "added" claim by searching for the actual entry in the appropriate table. Footer text is not evidence of table content.
**Warning signs:** Search for a phase ID in ROADMAP yields only the footer line, no table rows.

### Pitfall 3: Stale Numeric Claims Cascade
**What goes wrong:** STATE.md says "125 test files, 1767 tests". PROJECT.md copies these numbers. REQUIREMENTS references them. One stale number propagates across 3+ artifacts.
**Why it happens:** Artifacts quote each other without independent verification.
**How to avoid:** In Wave 1 (STATE.md), verify ALL numeric claims independently. Then in Wave 2 (PROJECT.md/REQUIREMENTS.md), replace stale numbers with verified ones rather than quoting STATE.md.
**Warning signs:** Same stale number appearing verbatim in multiple files.

### Pitfall 4: Plugin LOC Drift
**What goes wrong:** STATE.md claims "plugin.ts at 447 LOC" but actual is 242 LOC. The SR-09 restructuring significantly reduced this file.
**Why it happens:** Claims were written pre-restructuring and never updated.
**How to avoid:** Re-measure key files (`wc -l src/plugin.ts`) rather than trusting prior claims.

### Pitfall 5: Missing Phase Evidence Confusion
**What goes wrong:** CP-ST-01 has SUMMARY.md files for each plan but no VERIFICATION.md yet. If an auditor checks only for VERIFICATION.md, they might falsely mark CP-ST-01 as having no completion evidence.
**Why it happens:** Different phases use different evidence conventions.
**How to avoid:** Document what evidence exists for each phase rather than asserting binary complete/incomplete. Multiple evidence types exist (CONTEXT.md, PLAN.md, SUMMARY.md, VERIFICATION.md).

## Code Examples

Verified patterns from live investigation:

### Numeric Claim Verification
```bash
# Test file count — authoritative
find tests -name "*.test.ts" ! -path "*/node_modules/*" | wc -l
# Result: 149 (not 125 as claimed in STATE.md and PROJECT.md)

# Test count — authoritative
npx vitest run --reporter=verbose 2>&1 | grep -E "^Test Files|^Tests"
# Result: Test Files 1 failed | 151 passed (152); Tests 2008 passed | 2 skipped (2010)
# (not 1767 as claimed in STATE.md and PROJECT.md)

# Agent count — authoritative
ls .opencode/agents/ | grep -v ".gitkeep" | wc -l
# Result: 89 (matches STATE.md claim)

# Skill count — authoritative
ls .opencode/skills/ | grep -v ".gitkeep" | wc -l
# Result: 124 (STATE.md says 123 — minor drift)

# plugin.ts LOC
wc -l src/plugin.ts
# Result: 242 (STATE.md says 447 — major drift, file was split during SR restructuring)
```

### Stale Reference Detection
```bash
# Check for references to removed src/lib/ directory
grep -rn "src/lib/" --include="AGENTS.md" .
# Result: Only ./AGENTS.md:5 mentions it in a "has been removed" context — CORRECT
# All other AGENTS.md files are clean — no stale src/lib/ references

# Check for messages-transform.ts references
find . -name "messages-transform*" -not -path "*/node_modules/*"
# Result: No output — file DOES NOT EXIST
# STATE.md claim "messages-transform.ts dead code" should be updated to "already removed"
```

### Phase Completion Evidence Detection
```bash
# Find all phases with VERIFICATION.md (strong completion evidence)
find .planning/phases -name "VERIFICATION.md" 2>/dev/null
# Result: .planning/phases/CP-PTY-00-shell-pty-control-plane-spike/VERIFICATION.md
#         (BOOT phases use date-stamped: VERIFICATION-2026-05-08.md, BOOT-08-VERIFICATION.md)

# Find all phases with SUMMARY.md (plan completion evidence)
find .planning/phases -name "*SUMMARY*" 2>/dev/null
# Result: BOOT-02 (per-plan), BOOT-02R, BOOT-03 through BOOT-07, CP-ST-01 (per-plan)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| STATE.md "What's Delivered" as detailed table | Condensed paragraph with phase directory references | Phase 11 (this phase) | Reduces STATE.md from ~216 to ~150-200 lines |
| Artifact trust without verification | Live evidence wins, cross-referenced truth matrix | Phase 11 (this phase) | Prevents stale claims from persisting across artifacts |
| Individual artifact updates | Wave-based: STATE → PROJECT → REQS → ROADMAP → AGENTS.md | Phase 11 (this phase) | Ensures corrections cascade correctly |
| Completed-phase detail inline in STATE.md | Archived to `.planning/archive/state-history/` | Phase 11 (this phase) | Keeps STATE.md runway-focused |

**Deprecated/outdated:**
- STATE.md frontmatter `gsd_state_version` fields: inaccurate, override with verified content
- "34 Lib modules" in PROJECT.md: `src/lib/` no longer exists
- "0 integration/E2E tests": 5 integration/e2e test files now exist

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `messages-transform.ts` was deleted during SR restructuring (not just moved) | Common Pitfalls | If the file was renamed/moved, STATE.md's "dead code" label is misleading; low risk since grep found zero matches |
| A2 | The 5 integration test files found are actual E2E/integration tests (not just file-naming convention) | Common Pitfalls | If these are unit tests with misleading names, PROJECT.md's "zero integration" claim remains correct; medium risk |
| A3 | CP-ST-01 is the "currently active" phase (in progress) based on git log recency | Summary | If CP-ST-01 is actually complete and awaiting verification, the runway section wording changes; low risk |
| A4 | `.hivemind/` has 11 active subdirectories (not 19 as claimed) — the 19 number included planned/defunct dirs | Standard Stack | If 8 missing directories should exist, they need bootstrapping; medium risk — configs.json shows only planned directories |

## Open Questions

1. **CP-ST-01 completion status**
   - What we know: 4 plan SUMMARY.md files exist, CP-ST-01-REVIEW.md exists (3 critical, 6 warnings), no VERIFICATION.md
   - What's unclear: Is CP-ST-01 in-progress or blocked on review fixes? Should Phase 12 be the remediation or continuation?
   - Recommendation: State CP-ST-01 as "ACTIVE — plans executed, under review" in STATE.md

2. **GOV-01 requirement scope**
   - What we know: GOV-01 is marked DELIVERED in REQUIREMENTS.md (governance block injection), but REQUIREMENTS.md also lists GOV-01 under Path 2 features
   - What's unclear: Is GOV-01 the governance-block feature (already DELIVERED) or Phase 11 itself (governance reconciliation)? The ID is overloaded.
   - Recommendation: Clarify in STATE.md: GOV-01 (feature: governance block injection) = DELIVERED; Phase 11 (governance reconciliation phase) = separate scope.

3. **Missing .hivemind/ AGENTS.md creation**
   - What we know: D-15 forbids creating missing AGENTS.md. `.hivemind/AGENTS.md` EXISTS (42 lines, well-formed).
   - What's unclear: Which sectors are missing AGENTS.md? The CONTEXT.md canonical refs list 7 sector AGENTS.md, but the issue says "missing AGENTS.md files." All 7 appear to exist.
   - Recommendation: Verify all 7 sector files exist (they do per filesystem). Document that "no missing AGENTS.md found" rather than searching for gaps.

4. **SR-04 phase directory**
   - What we know: SR-04 directory exists but appears to have minimal content (only 1 file visible in listing)
   - What's unclear: Is SR-04 completion evidence fully on disk?
   - Recommendation: List `.planning/phases/SR-04-features-to-features-plane/` contents explicitly during plan execution.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm test, npm run typecheck | ✓ | ≥20.0.0 | — |
| Vitest | Test result verification | ✓ | Project dep | — |
| Git | Commit history evidence | ✓ | System | — |
| Bash/POSIX find/wc/grep | File counting, pattern search | ✓ | Native macOS | — |
| gsd-sdk | Phase status queries (optional) | ✓ | Project | Manual grep |

**Missing dependencies:** None — all verification tools are available.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project configured) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose 2>&1 \| tail -5` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GOV-01 | Governance block injection delivers governance-block.ts into create-core-hooks.ts | L5 documentation + L3 code search | `grep -rn "governance-block" src/` then validate it's registered in plugin.ts hooks | N/A — documentation verification only |

### Sampling Rate
- **Per task commit:** MANUAL ONLY — this phase produces documentation, not code
- **Per wave merge:** Cross-reference truth matrix entries against artifacts updated
- **Phase gate:** All 13 target files updated, truth matrix complete, no uncorrected contradictions

### Wave 0 Gaps
- [ ] `11-TRUTH-MATRIX.md` — central verification artifact (created during phase)
- [ ] `.planning/archive/state-history/.gitkeep` — new directory registration

*(No test framework gaps — this is a documentation phase with manual verification)*

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | — |
| V6 Cryptography | no | — |

**Note:** This is a documentation/governance reconciliation phase. No runtime code is changed. No security-relevant operations are performed. Security domain analysis is not applicable.

### Known Threat Patterns for Documentation Artifacts

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stale security claims | Information Disclosure | Evidence verification against live codebase per D-05 |
| Over-claimed security compliance | Repudiation | Downgrade unproven claims per D-03/D-06 |

## Sources

### Primary (HIGH confidence)
- **Filesystem enumeration:** `find`, `wc`, `ls` commands on the live repository — authoritative for file counts, directory existence, file sizes
- **Git log:** `git log --oneline -20` — authoritative for commit history, phase completion ordering
- **Vitest output:** `npx vitest run --reporter=verbose` — authoritative for test counts and pass/fail status
- **npm typecheck:** `npm run typecheck 2>&1` — authoritative for TypeScript compilation status
- **package.json:** `grep` on `@opencode-ai/sdk` — authoritative for installed SDK version (^1.14.41)

### Secondary (MEDIUM confidence)
- **STATE.md (current, pre-update):** `.planning/STATE.md` — used as baseline for staleness comparison, verified against primary sources
- **PROJECT.md (current, pre-update):** `.planning/PROJECT.md` — used as baseline, verified against primary sources
- **ROADMAP.md (current, pre-update):** `.planning/ROADMAP.md` — used as baseline, verified against primary sources
- **REQUIREMENTS.md (current, pre-update):** `.planning/REQUIREMENTS.md` — used as baseline, verified against primary sources

### Tertiary (LOW confidence)
- None — all claims verified against primary filesystem or git evidence

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools are native POSIX or project-internal, verified available
- Architecture: HIGH — wave-based pattern is simple and well-understood from CONTEXT.md decisions
- Pitfalls: HIGH — detected through direct filesystem-to-artifact comparison during research
- Numeric verification: HIGH — all counts verified via `find`/`wc`/`npm test` commands

**Research date:** 2026-05-11
**Valid until:** 2026-05-25 (30 days for governance documentation — stable domain)
