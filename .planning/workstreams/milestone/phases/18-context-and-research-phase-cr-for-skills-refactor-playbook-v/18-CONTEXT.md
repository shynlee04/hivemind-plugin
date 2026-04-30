# Phase 18: Context & Research — Skills Refactor Playbook Phase CR - Context

**Gathered:** 2026-04-23
**Status:** Ready for execution

## Phase Boundary

Produce the evidence base and audit posture that Playbook Phases 1–5 (GSD Phases 19–23) consume. Prevent 6-NON failures from regressing downstream phases. This is a **read-only research/audit phase** — zero skill edits, zero `src/` changes, zero agent/command refactors, zero IDE-directory modifications. Only soft meta-concept research artifacts.

**In scope:**
- Every active skill in `.hivefiver-meta-builder/skills-lab/active/refactoring/` (24 skills)
- Every retired skill partial in `.hivefiver-meta-builder/skills-lab/retired/` (3 skills)
- Every third-party reference tree (`.opencode/get-shit-done/`, superpower/bmad trees)
- Every call-site of each skill (agent permissions, command bodies, workflow files)
- Fresh runtime probes for all inventory counts, LOC, eval coverage, trigger collisions
- Per-skill 6-NON audit grid (NON-1 through NON-6)
- Differential cluster gap map (G-A through G-D)
- Third-party pattern harvest (abstracted, attributed, no verbatim copy)
- Runtime-integration readiness map (soft `.md` → Zod-typed TS runtime)
- Tooling decision table per skill (no-change / description / body / bundle / rename / split / merge / create / retire)

**Out of scope:**
- `src/` code changes
- Agent or command refactors
- New skill authoring (patterns only — no new SKILL.md files)
- IDE-directory modifications
- Any mutation of active skill files

**Hard constraints (same as Phase 17):**
- Every claim grounded in fresh runtime probe (`ls`, `grep`, `wc -l`)
- Every finding mapped to at least one 6-NON mode AND one differential cluster
- No third-party content copied verbatim (I.6)
- Evidence is file-and-line-cite, not prose
- Max 20% "no change" rows in decision table (VI.CR.12 #4)

## Implementation Decisions

### Locked Decisions

- **D-01:** Phase is read-only audit — no skill file mutations. All deliverables are research documents in `.planning/phases/18-*/`.
- **D-02:** 24 active skills must be inventoried fresh (not cached from I.1.2 table). Count from `ls .hivefiver-meta-builder/skills-lab/active/refactoring/ | wc -l`.
- **D-03:** Every skill gets a 6-NON audit row. Every NON-X cell gets DEFENDED, EXPOSED, or PARTIAL with evidence citation.
- **D-04:** Differential cluster gap map must identify MISSING skills (not yet created) with severity and owning phase.
- **D-05:** Third-party patterns must be abstracted and attributed — no verbatim copy (I.6 violation aborts).
- **D-06:** Decision table must have fewer than 5 "no change" rows out of 24 active skills (< 20%).
- **D-07:** Exit criteria require `check-overlaps.sh` run, stacked-workflow eval, and user sign-off in CR-DISCUSSION-LOG.md.

### the agent's Discretion

- Exact grep patterns for NON-X probes (suggested patterns in 18-02-PLAN.md)
- Exact abstraction level for third-party patterns
- Zod feasibility rating criteria for runtime-readiness map
- Stacked-workflow eval method (automated vs documented gap)

### Deferred Ideas

- **hm-* naming mandate** — Rename all 23 project skills to `hm-` prefix. Explicitly Phase 19 scope per ROADMAP continuation mapping.
- **New skill creation** — Creating actual SKILL.md files for missing skills (hm-completion-looping, hm-spec-driven-authoring, etc.) is Phase 20 scope.
- **Agent/command refactoring** — Subsequent cycle after skills are locked.
- **IDE directory cleanup** — Already handled in Phase 17 (gitignore only).

## Canonical References

### Phase 18 Specification (PRIMARY)
- `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` §VI.CR (lines 626-694 — Phase CR specification)
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/18-RESEARCH.md` (research base with ecosystem data)
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/18-VALIDATION.md` (validation strategy)

### Execution Plans
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/18-01-PLAN.md` — Wave 1: CR-CONTEXT.md + CR-RESEARCH.md (ecosystem scan)
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/18-02-PLAN.md` — Wave 2: CR-AUDIT-ECOSYSTEM.md + CR-GAP-MAP.md (6-NON grid + cluster gaps)
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/18-03-PLAN.md` — Wave 3: CR-THIRD-PARTY-HARVEST.md + CR-RUNTIME-READINESS.md (pattern extraction + migration feasibility)
- `.planning/phases/18-context-and-research-phase-cr-for-skills-refactor-playbook-v/18-04-PLAN.md` — Wave 4: CR-DECISIONS.md + CR-VERIFICATION.md + CR-DISCUSSION-LOG.md (tooling table + sign-off)

### Prior Phase Decisions
- `.planning/phases/17-hivemind-skills-refactor/17-CONTEXT.md` — C1-C5 resolution, tech-stack synthesis integration
- `.planning/phases/17-hivemind-skills-refactor/17-RESEARCH.md` — Per-skill inventory table, schema unification findings
- `.planning/phases/17-hivemind-skills-refactor/17-VERIFICATION.md` — Verification template for CR-VERIFICATION.md

### Project Standards
- `AGENTS.md` — Code style rules, two-halves boundary, 500 LOC max
- `.planning/PROJECT.md` — Vision, principles, non-negotiables

## Existing Code Insights

### Reusable Assets
- `skill-synthesis/scripts/check-overlaps.sh` — Trigger collision detection across catalogue
- `validate-gate.sh` — Pre-flight intent/pattern/checklist gate
- `hm-detective` SCAN mode — Tech-stack scan for ecosystem inventory
- Unified `.tech-registry.json` schema — Established in Phase 17 (hm-detective format)

### Established Patterns
- Fresh runtime probe before any claim (ls, grep, wc -l)
- Evidence trace format: [PROBE: command] → [RESULT: value] [DATE: YYYY-MM-DD]
- Playbook cross-reference format: §Section.Subsection (line numbers)
- 6-NON cell format: DEFENDED / EXPOSED / PARTIAL with file:line citation

### Integration Points
- `.hivefiver-meta-builder/skills-lab/active/refactoring/` — source of truth for active skills
- `.opencode/skills/` — symlinked live testing directory
- `.opencode/get-shit-done/workflows/` — GSD workflow pattern source
- `~/.agents/skills/` — global skills (skill-creator, skill-judge)

## Specific Ideas

- The retired skills (repomix-exploration-guide, repomix-explorer, research-operations) should be audited for salvageable patterns but NOT restored verbatim
- GSD workflows in `.opencode/get-shit-done/workflows/` contain execution patterns (wave-based, verification gates, parallel dispatch) that should be abstracted for G-A/G-D cluster skills
- Superpowers skills (`~/.agents/skills/`) contain behavioural patterns (verification-before-completion, dispatching-parallel-agents, tdd-workflow) that map to G-B/G-D clusters
- The 6-NON audit should use automated grep probes for objective scoring, with human judgment only for PARTIAL vs DEFENDED border cases
- Runtime-readiness assessment should flag reference skills (oh-my-openagent-reference, opencode-platform-reference) as "not yet expressible" in Zod/SDK because their value IS the prose content

## Deferred to Phase 19+

- **hm-* naming mandate** — Phase 19 (Rename Sprint)
- **New skill creation** — Phase 20 (Structural Changes)
- **Description rewrite sprint** — Phase 21
- **Script hardening + 6-NON defence pass** — Phase 22
- **Body quality + eval expansion** — Phase 23
- **Runtime integration (Zod schemas + SDK)** — Phase 24-28

---

*Phase: 18-context-and-research-phase-cr-for-skills-refactor-playbook-v*
*Context gathered: 2026-04-23*
