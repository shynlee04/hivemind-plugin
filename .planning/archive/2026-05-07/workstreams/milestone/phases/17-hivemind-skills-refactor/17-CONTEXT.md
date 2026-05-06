# Phase 17: Hivemind Skills Refactor — Critical Fixes - Context

**Gathered:** 2026-04-23
**Status:** archived
**Archived reason:** Reclassified to skill-ecosystem workstream (SE-H1)

<domain>
## Phase Boundary

Resolve all critical bugs (C1–C5) in the `.opencode/skills/` layer before any structural skills work begins, and integrate tech-stack synthesis capabilities across the hm-* skill family. This is the first of 6 continuation phases mapping the HIVEMIND-SKILLS-REFACTOR-PLAYBOOK into GSD phases 17–22. Modifies ONLY soft meta-concepts (skills) — no `src/` code changes.

**In scope:**
- C1: Missing `hm-skill-synthesis` skill — audit retired version, decide restore/refactor/migrate
- C2: 4 meta-builder depth reference files are stubs — fill with real content
- C3+C4: oh-my-openagent-reference full audit for dead references (tech-stack.md missing, project-structure.md verified OK at 674 lines)
- C5: Document canonical skill location, gitignore IDE sync directories
- NEW: Tech-stack synthesis integration across hm-synthesis, hm-deep-research, hm-detective

**Out of scope:**
- hm-* naming mandate for all 23 skills (Phase 18)
- Agent or command refactoring (subsequent cycle)
- Hard harness `src/` code changes
- New skill creation beyond tech-stack synthesis integration
- IDE-managed skill directories (.trae, .windsurf, .codex, .github) — left untouched

</domain>

<decisions>
## Implementation Decisions

### C1: Missing hm-skill-synthesis
- **D-01:** Audit-first approach — load `skill-creator`, `skill-judge`, and review the retired `skill-synthesis` at `.hivefiver-meta-builder/skills-lab/retired/skill-synthesis/` before deciding restore vs. refactor vs. migrate
- **D-02:** The retired skill's integration points must be checked: `validate-gate.sh` accepts `synthesize` action, `meta-builder` routing table references `skill-synthesis` (line 303), `hm-synthesis` may already cover some synthesis capability
- **D-03:** Decision (restore/refactor/migrate) is deferred to the researcher/planner after audit — capture the audit requirements, don't pre-decide the outcome

### C2: Meta-Builder Depth Files
- **D-04:** Fill all 4 depth reference files with real content (not stubs):
  - `depth-built-in-tools.md` (17 lines → full): OpenCode tool usage patterns for meta-builder work (question, todowrite, patch, grep, glob, skill, webfetch)
  - `depth-github-stacks.md` (12 lines → full): GitHub-based skill stacking patterns
  - `depth-repo-analysis.md` (13 lines → full): Repository analysis for meta-concept extraction
  - `depth-skill-synthesis.md` (13 lines → full): GitHub ingestion pipeline (repomix remote, agentskills.io spec, websearch corpus, shell safety)
- **D-05:** Each depth file should have: what it does, WHY it matters for meta-builder, WHEN to use it, inline examples, permission recommendations

### C3+C4: oh-my-openagent-reference Audit
- **D-06:** Full audit of oh-my-openagent-reference for ALL dead references, not just tech-stack.md — the `context-bomb: true` flag means any dead ref wastes agent context
- **D-07:** C4 (empty project-structure.md) is verified RESOLVED — 674 lines, not a stub. Mark as closed.
- **D-08:** C3 (phantom tech-stack.md): file genuinely missing from `references/`, `summary.md` doesn't reference it but the spec says it should exist. Generate it from the packed repo data using repomix tech-stack detection.
- **D-09:** Verify all cross-references in SKILL.md body against actual files in `references/` directory

### C5: Duplicate Skills Across IDE Directories
- **D-10:** IDE-managed skill directories (`.trae/skills/`, `.windsurf/skills/`, `.codex/skills/`, `.github/skills/`) contain third-party sync artifacts, NOT project deliverables — LEFT UNTOUCHED
- **D-11:** `.claude/skills/` does NOT exist — no Claude-specific duplicates
- **D-12:** Add IDE skill directories to `.gitignore` to prevent accidental commits of sync artifacts
- **D-13:** Document in AGENTS.md that `.opencode/skills/` is the ONLY canonical location for project skills. IDE directories are out-of-scope sync artifacts.

### Tech-Stack Synthesis Integration (NEW)
- **D-14:** Tech-stack synthesis capability distributed across 3 existing hm-* skills:
  - **hm-synthesis** → new section: tech-stack detection from packed repos (repomix + package.json / go.mod / Cargo.toml parsing), version resolution, Context7 query generation
  - **hm-deep-research** → new section: version-matched documentation research (query Context7 with resolved versions, detect breaking changes, produce versioned findings)
  - **hm-detective** → new reading mode: "scan for tech stack" — quick detection of technologies, versions, and dependencies from codebase files
- **D-15:** All 3 skills share a common tech-registry format for consistency (the format shape is at the planner/researcher's discretion)

### Deferred to Phase 18
- **D-16:** hm-* naming mandate for all 23 skills — rename all project skills to `hm-` prefix following the GSD `gsd-` pattern. Explicitly Phase 18 scope per ROADMAP continuation mapping.

### the agent's Discretion
- Exact content for each depth file (C2)
- Exact tech-registry format shape (D-15)
- Whether to create new reference files or integrate into existing sections
- Ordering/priority of fixes within the phase plans
- Test/verification approach for skill content changes (no `src/` tests affected)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 17 Specification (PRIMARY)
- `.hivemind/state/session-context-prompt-v4.md` — GSD phase-planning specification with scope boundaries, rename mandate, and skill inventory
- `.hivefiver-meta-builder/HIVEMIND-SKILLS-REFACTOR-PLAYBOOK.md` — Canonical reference for constitution, philosophy, quality gates, and phase ordering (Part VI §VI.2 has the critical issues)

### Affected Skills (DIRECT TARGETS)
- `.opencode/skills/meta-builder/SKILL.md` — C2: 4 depth stub files in `references/` directory
- `.opencode/skills/meta-builder/references/depth-built-in-tools.md` — Stub to fill
- `.opencode/skills/meta-builder/references/depth-github-stacks.md` — Stub to fill
- `.opencode/skills/meta-builder/references/depth-repo-analysis.md` — Stub to fill
- `.opencode/skills/meta-builder/references/depth-skill-synthesis.md` — Stub to fill
- `.opencode/skills/oh-my-openagent-reference/SKILL.md` — C3: full audit for dead references
- `.opencode/skills/oh-my-openagent-reference/references/` — C3: verify all files referenced in SKILL.md exist
- `.opencode/skills/hm-synthesis/SKILL.md` — Tech-stack synthesis integration
- `.opencode/skills/hm-deep-research/SKILL.md` — Version-matched research integration
- `.opencode/skills/hm-detective/SKILL.md` — Tech-stack scan reading mode

### Retired Skill (C1 Audit Target)
- `.hivefiver-meta-builder/skills-lab/retired/skill-synthesis/` — Retired skill to audit before restore/refactor/migrate decision

### Validation Scripts
- `.hivefiver-meta-builder/skills-lab/active/refactoring/use-authoring-skills/scripts/validate-gate.sh` — C1: accepts `synthesize` action but target skill missing

### Prior Phase Decisions
- `.planning/phases/15-security-quality-remediation-fix-all-26-audit-issues-from-co/15-CONTEXT.md` — Wildcard permissions, coordinator hierarchy, path portability (D-06 through D-17)
- `.planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16-CONTEXT.md` — PTY integration, WaiterModel locked

### Project Standards
- `AGENTS.md` — Code style rules, two-halves boundary, 500 LOC max
- `.planning/PROJECT.md` — Vision, principles, non-negotiables

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `hm-synthesis` skill: already has compression tiers (Snapshot/Focused/Signature) and repomix integration — tech-stack detection is a natural extension of the Focused tier
- `hm-deep-research`: already has multi-source research with Context7 integration — version-matched queries are an extension
- `hm-detective`: already has 3 reading modes (skim/scan/deep) — tech-stack scan is a 4th mode
- `validate-gate.sh`: already handles `synthesize` action — no script changes needed, only the target skill
- `repomix` MCP tools: `repomix_pack_codebase`, `repomix_generate_skill` — can detect tech stacks from packed repos

### Established Patterns
- SKILL.md frontmatter: `name`, `description` (with trigger phrases), `metadata` (layer, role, pattern), `allowed-tools`
- Depth reference files in `references/` directory: loaded on demand via progressive disclosure
- The skills-lab pipeline: `.hivefiver-meta-builder/skills-lab/active/refactoring/` → symlinked to `.opencode/skills/`
- GSD naming convention: `gsd-` prefix for all GSD skills in IDE directories (pattern to follow for `hm-` in Phase 18)

### Integration Points
- `.opencode/skills/` — where OpenCode reads skills at runtime
- `.hivefiver-meta-builder/skills-lab/` — where skills are authored before symlinking
- `.gitignore` — needs IDE skill directory entries added
- `AGENTS.md` — needs canonical location documentation
- `meta-builder` routing table — references `skill-synthesis` (line 303), may need update after C1 resolution

</code_context>

<specifics>
## Specific Ideas

- The retired `skill-synthesis` skill should be audited with `skill-creator` (assess completeness) and `skill-judge` (score against 6-criterion gate) before deciding restore vs. refactor
- Tech-stack detection should parse: `package.json` (Node), `go.mod` (Go), `Cargo.toml` (Rust), `pyproject.toml` (Python), `pom.xml` / `build.gradle` (Java), and derive versions for Context7 queries
- The oh-my-openagent-reference audit should produce a findings list of ALL dead references (not just tech-stack.md) — this is the `context-bomb` skill, so any dead reference is a context waste
- IDE skill directories should be gitignored with pattern: `.trae/`, `.windsurf/`, `.codex/`, `.github/skills/`

</specifics>

<deferred>
## Deferred Ideas

- **hm-* naming mandate** — Rename all 23 project skills to `hm-` prefix following GSD `gsd-` pattern. Explicitly Phase 18 scope per ROADMAP continuation mapping (Playbook Phase 1 → GSD Phase 18).
- **Agent refactoring** — Subsequent cycle after skills are locked
- **Command refactoring** — Subsequent cycle after skills are locked
- **New MCP integration skill** — Identified as a gap in the playbook but not in Phase 17 scope

</deferred>

---

*Phase: 17-hivemind-skills-refactor*
*Context gathered: 2026-04-23*
