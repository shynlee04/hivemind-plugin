# Phase 11: Governance Reconciliation — Update All Core Artifacts (STATE.md) - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Reconcile all core governance artifacts to reflect current project reality. Update STATE.md as the anchor, then ripple corrections outward through PROJECT.md, REQUIREMENTS.md, ROADMAP.md, and all sector-level AGENTS.md files. Produce a committed truth matrix documenting every claim, its verification source, and any corrections made.

**In scope:**
- Update STATE.md to runway-focused structure (~150-200 lines) reflecting current phase status
- Reconcile PROJECT.md, REQUIREMENTS.md, and ROADMAP.md against live evidence
- Audit all sector-level AGENTS.md files for stale claims, add phase context sections
- Archive completed-phase detail from STATE.md to `.planning/archive/state-history/`
- Produce committed truth matrix (`11-TRUTH-MATRIX.md`) cross-referencing claims across all 13 files
- Add GOV-01 (Phase 11) and CP-ST-02 (Phase 12) entries to ROADMAP.md with full audit
- Verify numeric claims (test counts, agent counts, skill counts) against live codebase
- Honest evidence reset: downgrade over-claims, upgrade proven items, mark unverifiable as [UNVERIFIED]

**Out of scope:**
- Creating new AGENTS.md files for sectors that lack them (document gaps only)
- Runtime code changes, test changes, or src/ modifications
- Phase execution or implementation — this is governance/docs reconciliation only
- Sidecar dashboard, CP-PTY runtime implementation, MCM continuation

</domain>

<decisions>
## Implementation Decisions

### Artifact Scope
- **D-01: Tier 1 + sector AGENTS.md.** Update STATE.md, PROJECT.md, REQUIREMENTS.md, ROADMAP.md (Tier 1) plus all sector-level AGENTS.md files. Module-level AGENTS.md files under src/ subdirectories are not in scope unless a sector-level AGENTS.md references them incorrectly.
- **D-02: Wave-based approach.** Update STATE.md first as anchor, then ripple outward: STATE → PROJECT → REQUIREMENTS → ROADMAP → AGENTS.md files. Each wave's corrections inform the next.
- **D-03: Honest evidence reset.** Downgrade over-claimed statuses (e.g., DELIVERED that was actually PARTIAL). Upgrade items now proven by completed phases (BOOT-07 E2E, CP-PTY-00 spec, MCM verification). Add explicit phase evidence references.
- **D-04: Full roadmap audit.** Add missing GOV-01 and CP-ST-02 phase definition rows. Fix stale phase status markers. Verify dependency chains post-SR restructuring (old dep chains may reference superseded Phase 11).

### Staleness Detection
- **D-05: Deep cross-reference.** Verify claims using git log, phase directory completion evidence (SUMMARY.md, VERIFICATION.md), and live codebase inspection. No claim accepted without at least two evidence sources where available.
- **D-06: Unverifiable claims → [UNVERIFIED].** Claims without verifiable evidence keep their current status but get an explicit [UNVERIFIED] marker with explanatory note. No status change without proof either direction.
- **D-07: Archive completed-phase detail.** Move SR decision tables, BOOT task lists, and Phase 0 artifact detail from STATE.md to `.planning/archive/state-history/` as date-stamped files. STATE.md keeps only current status.
- **D-08: Strict numeric verification.** Verify test file counts, agent counts, skill counts against live codebase. For test claims specifically: tests must exercise actual stack interfaces and true behaviors, not mock-heavy coverage that doesn't reflect real behavior.

### Structure & Format
- **D-09: Runway-focused STATE.md.** Target structure: Current Status → What's Broken/Missing → Active Phase Runway (CP-PTY, CP-ST, GOV) → Recent Decisions → Key Artifacts Index. ~150-200 lines total. Historical detail archived.
- **D-10: Condense "What's Delivered."** Replace detailed component table with a brief summary paragraph. Phase directories are the authoritative source for what each phase delivered.
- **D-11: AGENTS.md audit + context.** For each sector AGENTS.md: verify claims against live sector state, correct stale references (especially src/lib/ → new plane paths), add a "Current Phase Context" section noting active work affecting that sector.
- **D-12: Archive mechanism.** New `.planning/archive/state-history/` directory. Date-stamped files for archived STATE.md content. Registered with `.gitkeep`.

### Cross-Artifact Consistency
- **D-13: Truth matrix as deliverable.** Produce committed `11-TRUTH-MATRIX.md` documenting every verifiable claim across all 13 files, its verification source, and any corrections. Not ephemeral — committed artifact.
- **D-14: Live evidence wins.** When two artifacts contradict, resolve using git log, phase directory contents, and actual file counts. Trust no artifact blindly — verify against filesystem.
- **D-15: Audit-only for missing AGENTS.md.** Document gaps where sector AGENTS.md files are missing. Do NOT create new AGENTS.md files in this phase. Creation belongs to a separate phase or O3-04 extension.

### the agent's Discretion
- Exact internal structure of the truth matrix (table format, claim grouping, verification method columns)
- Specific wording of STATE.md sections (within the runway-focused structure)
- Order of AGENTS.md file audit within the final wave
- Which specific historical STATE.md sections get full archival vs inline collapse
- Exact format of archive files in `.planning/archive/state-history/`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Governance Files (to be updated)
- `.planning/STATE.md` — Current state, phase status, decisions, issues (last updated 2026-05-08)
- `.planning/PROJECT.md` — Project identity, constraints, key decisions (last updated 2026-05-07)
- `.planning/REQUIREMENTS.md` — Feature requirements by path, critical gaps, quality contracts (last updated 2026-05-08)
- `.planning/ROADMAP.md` — Phase definitions, dependencies, statuses, workstreams (last updated 2026-05-11, missing GOV-01/CP-ST-02 entries)

### Sector AGENTS.md Files (to be audited)
- `AGENTS.md` — Root project-level governance
- `src/AGENTS.md` — Hard Harness sector
- `.opencode/AGENTS.md` — Soft Meta-Concepts sector
- `.planning/AGENTS.md` — Planning/Governance sector
- `.hivemind/AGENTS.md` — Internal State sector
- `.hivefiver-meta-builder/AGENTS.md` — Meta-Authoring sector
- `tests/AGENTS.md` — Test sector

### Architecture & Governance Baselines
- `.planning/architecture/hivemind-runtime-identity-taxonomy-2026-05-07.md` — Naming contract, lineage contract, L0-L3 hierarchy
- `.planning/architecture/hivemind-source-plane-architecture-2026-05-07.md` — Surface ownership model, Phase 0 mutation gates
- `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority, component graph, dependency rules
- `.planning/codebase/STRUCTURE.md` — File tree, placement conventions, naming, folder registration

### Phase Evidence (for verification)
- `.planning/phases/BOOT-07-end-to-end-proof/` — BOOT-07 E2E proof (bootstrap verification)
- `.planning/phases/BOOT-08-agent-skill-integration/` — BOOT-08 agent/skill integration constitution
- `.planning/phases/CP-PTY-00-shell-pty-control-plane-spike/` — CP-PTY-00 docs/spec completion
- `.planning/phases/MCM-01-agent-migration/` — MCM-01 agent migration verification
- `.planning/phases/MCM-02-skill-migration/` — MCM-02 skill migration verification
- `.planning/phases/SR-10-cleanup-agents-md-updates/` — SR-10 final cleanup (SR completion marker)

### Control Artifacts
- `.planning/roadmap/managed-autonomous-loop-2026-05-07.md` — Autonomous loop governance
- `.planning/lifecycle/lifecycle-overview-2026-05-07.md` — Lifecycle overview
- `.planning/roadmap/shell-pty-control-plane-route-2026-05-08.md` — CP-PTY route

### Prior Phase Contexts
- `.planning/phases/CP-ST-01-session-tracker-revamp/01-CONTEXT.md` — Most recent CONTEXT.md (format/structure reference)
- `.planning/phases/MCM-02-skill-migration/MCM-02-CONTEXT.md` — Prior CONTEXT.md
- `.planning/phases/MCM-01-agent-migration/MCM-01-CONTEXT.md` — Prior CONTEXT.md

### Archive Structure Reference
- `.planning/archive/` — Existing archive structure to extend with `state-history/`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `gsd-sdk query` — CLI tool for querying phase status, config, roadmap entries. Use for automated staleness detection.
- `.planning/phases/` directory structure — Each phase has CONTEXT.md, SUMMARY.md, VERIFICATION.md, PLAN.md. Use for completion evidence.
- Git log — Authoritative source for when files were last modified and by what phase.

### Established Patterns
- **Phase directory convention:** `.planning/phases/{padded_phase}-{slug}/` with CONTEXT.md, PLAN.md files
- **Evidence hierarchy:** L1 (live runtime) > L2 (integration test) > L3 (unit test) > L4 (static analysis) > L5 (documentation)
- **AGENTS.md structure:** Purpose → Allowed mutations → Forbidden mutations → Actors/consumers → Naming conventions → Quality gates → Cross-sector alignment
- **Commit format:** `type(scope): description — why`

### Integration Points
- ROADMAP.md ↔ STATE.md: Phase status must be consistent between both
- PROJECT.md ↔ REQUIREMENTS.md: Capability claims must match requirement statuses
- AGENTS.md ↔ src/ tree: AGENTS.md claims about code structure must match actual directory layout
- STATE.md "What's Broken" ↔ REQUIREMENTS.md "Critical Gaps": Issues should align

</code_context>

<specifics>
## Specific Ideas

- User emphasized: "resynthesize incrementally to make sure my context and requirements are sensible and matched across" — truth matrix is the mechanism for this
- User emphasized: strict test validation — tests must exercise actual stack interfaces and true behaviors, not mock-satisfying coverage
- User chose "Honest reset" for evidence — this phase should not hesitate to downgrade over-claims
- User wants STATE.md as anchor with ripple-outward corrections — the wave ordering is deliberate
- Archive mechanism must be in `.planning/archive/state-history/` with date-stamped files
- The truth matrix is a committed deliverable, not ephemeral — downstream phases can reference it

</specifics>

<deferred>
## Deferred Ideas

- **Creating missing AGENTS.md files** — Document gaps in Phase 11, but creation belongs to O3-04 extension or a separate phase
- **Creating missing AGENTS.md for .hivemind/ sector** — Out of scope; gap documented only
- **Runtime readiness proof** — This phase is L5 documentation only. Runtime readiness remains blocked until L1-L3 proof from authorized phases
- **Full .planning/ surface audit** — Architecture docs, control artifacts, and checklists beyond the 13 files are out of scope
- **Sidecar integration** — Q2, separate project

</deferred>

---

*Phase: 11-governance-reconciliation-update-all-core-artifacts-state-md*
*Context gathered: 2026-05-11*
