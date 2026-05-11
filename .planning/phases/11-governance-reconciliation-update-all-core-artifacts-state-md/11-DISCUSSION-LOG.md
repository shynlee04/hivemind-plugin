# Phase 11: Governance Reconciliation — Update All Core Artifacts (STATE.md) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 11-governance-reconciliation-update-all-core-artifacts-state-md
**Areas discussed:** Artifact Scope, Staleness Detection, Structure & Format, Cross-Artifact Consistency

---

## Artifact Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Tier 1: STATE.md + PROJECT.md + REQUIREMENTS.md + ROADMAP.md | The four core governance files | |
| Tier 1 + all 9 sector AGENTS.md files | Add cross-sector AGENTS.md reconciliation | ✓ |
| All .planning/ surface | Full audit of every .planning/ file | |

**User's choice:** Tier 1 + all 9 sector AGENTS.md files
**Notes:** User wants to "resynthesize incrementally to make sure my context and requirements are sensible and matched across"

| Option | Description | Selected |
|--------|-------------|----------|
| Single-pass: audit first, then update all at once | Cleaner but more upfront work | |
| Wave-based: STATE.md first, ripple outward | Each update informs the next | ✓ |
| Surgical: only critical staleness | No cleanup, just facts | |

**User's choice:** Wave-based: STATE.md first, ripple outward
**Notes:** STATE.md as anchor → PROJECT.md → REQUIREMENTS.md → ROADMAP.md → AGENTS.md files

| Option | Description | Selected |
|--------|-------------|----------|
| Keep L5 boundaries as-is | Audit updates are L5 documentation only | |
| Selectively upgrade | Notate resolved items with phase evidence | |
| Honest reset — downgrade over-claims, upgrade proven items | Full truth reset | ✓ |

**User's choice:** Honest reset
**Notes:** No hesitation to downgrade over-claims

| Option | Description | Selected |
|--------|-------------|----------|
| Add missing phase entries only | GOV-01 and CP-ST-02 rows | |
| Add entries + fix stale phase statuses | Plus status corrections | |
| Full roadmap audit — entries, statuses, dependency chains | Complete verification | ✓ |

**User's choice:** Full roadmap audit
**Notes:** Verify dependency chains post-SR restructuring

---

## Staleness Detection

| Option | Description | Selected |
|--------|-------------|----------|
| File-existence checks | Verify referenced paths exist | |
| Phase evidence audit | Check phase dirs for completion artifacts | |
| Deep cross-reference — git + phase evidence + live codebase | Most thorough | ✓ |

**User's choice:** Deep cross-reference
**Notes:** At least two evidence sources where available

| Option | Description | Selected |
|--------|-------------|----------|
| Mark as [UNVERIFIED] with note | Don't change status without proof | ✓ |
| Default downgrade | Under-claim when uncertain | |
| Quarantine to 'Needs Verification' section | Flag for future audit | |

**User's choice:** Mark as [UNVERIFIED] with note
**Notes:** Conservative — no status change without proof either direction

| Option | Description | Selected |
|--------|-------------|----------|
| Archive completed-phase detail | Keep STATE.md focused on current | ✓ |
| Collapse to summaries | Keep decisions, drop implementation detail | |
| Date-section the file | Past vs current, no content removal | |

**User's choice:** Archive completed-phase detail
**Notes:** SR decision tables, BOOT task lists, Phase 0 artifact lists all archived

| Option | Description | Selected |
|--------|-------------|----------|
| Verify — run commands | Check numeric claims live | ✓ |
| Spot-check | Verify only suspicious numbers | |
| Date-stamp numeric claims | Let staleness be visible | |

**User's choice:** Verify with strict validation
**Notes:** "tests must exercise actual stack interfaces and true behaviors, not mock-heavy coverage that doesn't reflect real behavior"

---

## Structure & Format

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal — status + issues + active phases only | ~80-120 lines | |
| Runway-focused — status + issues + active runway + artifact index | ~150-200 lines | ✓ |
| Evolutionary — keep structure, collapse history, add new sections | ~150 lines | |

**User's choice:** Runway-focused
**Notes:** Current Status → What's Broken → Active Phase Runway → Recent Decisions → Key Artifacts Index

| Option | Description | Selected |
|--------|-------------|----------|
| Condense to summary | Phase dirs are authoritative | ✓ |
| Replace with capability checklist | Living milestone tracker | |
| Remove entirely | STATE.md is about current | |

**User's choice:** Condense to summary
**Notes:** Brief paragraph, not detailed table

| Option | Description | Selected |
|--------|-------------|----------|
| Audit + correct | Verify claims, update dates, fix errors | |
| Audit + correct + add phase context section | Plus active work context | ✓ |
| Light touch | Verify no false claims, minimal additions | |

**User's choice:** Audit + correct + add phase context section
**Notes:** Each AGENTS.md gets a "Current Phase Context" section

| Option | Description | Selected |
|--------|-------------|----------|
| New archive dir — .planning/archive/state-history/ | Date-stamped files | ✓ |
| Use existing archive | Append to existing structure | |
| Inline collapse | Reference phase dirs, no new files | |

**User's choice:** New archive dir
**Notes:** Registered with .gitkeep

---

## Cross-Artifact Consistency

| Option | Description | Selected |
|--------|-------------|----------|
| Truth matrix — audit every claim across all 13 files | Full cross-reference | ✓ |
| High-risk only | Phase status, capability claims, stale refs | |
| STATE.md as source of truth | All others must align | |

**User's choice:** Truth matrix
**Notes:** Every claim verified, mismatches flagged

| Option | Description | Selected |
|--------|-------------|----------|
| Live evidence wins | Resolve with git/filesystem proof | ✓ |
| Domain ownership | Closest file to the domain owns truth | |
| STATE.md wins | Resolve ambiguity toward STATE.md | |

**User's choice:** Live evidence wins
**Notes:** Trust no artifact blindly — verify against filesystem

| Option | Description | Selected |
|--------|-------------|----------|
| Audit all — document gaps but don't create new AGENTS.md files | Gap documentation only | ✓ |
| Audit + create where sector has clearly changed | Creation for changed sectors | |
| Strictly audit-only — no new AGENTS.md creation | Conservative | |

**User's choice:** Audit all, document gaps only
**Notes:** Creation belongs to separate phase

| Option | Description | Selected |
|--------|-------------|----------|
| Deliverable artifact — truth matrix as committed output | Committed file | ✓ |
| Internal tool — matrix drives corrections, not committed | Ephemeral | |
| Inline annotation — corrections traced in-file | No separate matrix | |

**User's choice:** Deliverable artifact
**Notes:** Downstream phases can reference the truth matrix

---

## the agent's Discretion

- Exact internal structure of the truth matrix (table format, claim grouping, verification method columns)
- Specific wording of STATE.md sections (within the runway-focused structure)
- Order of AGENTS.md file audit within the final wave
- Which specific historical STATE.md sections get full archival vs inline collapse
- Exact format of archive files in `.planning/archive/state-history/`

## Deferred Ideas

- Creating missing AGENTS.md files (belongs to O3-04 extension or separate phase)
- Creating missing AGENTS.md for .hivemind/ sector (gap documented only)
- Runtime readiness proof (L5 only; L1-L3 needs authorized phases)
- Full .planning/ surface audit beyond 13 files
- Sidecar integration (Q2, separate project)
