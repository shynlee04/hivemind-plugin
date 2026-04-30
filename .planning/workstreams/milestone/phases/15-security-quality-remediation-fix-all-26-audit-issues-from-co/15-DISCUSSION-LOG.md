# Phase 15: Security & Quality Remediation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 15-security-quality-remediation-fix-all-26-audit-issues-from-co
**Areas discussed:** Profanity handling, Orchestrator hierarchy, Missing skills strategy, Path portability

---

## Profanity Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with professional alternatives | MUST_READ_AND_OBEY — preserves urgency, removes risk | ✓ |
| Keep as-is — intentional dev culture | Deliberate emphasis, but unprofessional in shared contexts | |
| Keep in tags, remove from description | XML tags less visible, description is user-facing | |

**User's choice:** Replace all with professional alternatives
**Notes:** User selected recommended option. `MUST_FUCKING_READ_AND_OBEY` → `MUST_READ_AND_OBEY` throughout build.md.

---

## Orchestrator Hierarchy

| Option | Description | Selected |
|--------|-------------|----------|
| Single primary + named specialists | coordinator.md as THE primary, others get distinct roles | ✓ |
| Keep all 4 with explicit disambiguation | Each stays primary but with non-overlapping triggers | |
| Merge to 2 orchestrators | coordinator (GSD) + hivefiver (HF), delete others | |

**User's choice:** Single primary + named specialists
**Notes:** coordinator.md = single primary orchestrator. conductor → delegation routing, orchestrator → phase-gated workflows, hivefiver → meta-concept workflows.

---

## Missing Skills Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Update references to use global skills | skill-creator/skill-judge exist at ~/.agents/skills/ | ✓ |
| Create local stubs in .opencode/skills/ | Minimal SKILL.md files that delegate to globals | |
| Remove dangling references | Delete refs, agents use general skill tool | |

**User's choice:** Update references to use global skills
**Notes:** Global skills already installed and functional. Just need reference updates in conductor.md and hivefiver-agent-builder.md.

---

## Path Portability

| Option | Description | Selected |
|--------|-------------|----------|
| Use project-relative paths | All paths relative from project root | ✓ |
| Use ${GSD_HOME} variable | Single config variable, requires env setup | |
| Hybrid: project-relative + env | GSD tools project-relative, home-dir uses ${HOME} | |

**User's choice:** Use project-relative paths
**Notes:** Replace $HOME/.claude/get-shit-done/ → .opencode/get-shit-done/. Replace /Users/apple/... absolute paths → relative from project root.

---

## Auto-Decided Items (from audit, no user input needed)

### Critical Security Fixes
- C-1: Hardcoded $HOME path → project-relative (covered by Path Portability decision)
- C-2: Wildcard permissions → explicit allowlist (security non-negotiable)
- C-3: Excessive conductor permissions → minimum-required scoping (security non-negotiable)

### Command/Skill/Agent Standards
- Missing frontmatter: add to deep-init.md and deep-research-synthesis-repomix.md
- Unquoted $ARGUMENTS: quote in 4 command files
- Missing files_to_read: add to 5 skills
- Dangling skill refs: update to global (covered by Missing Skills decision)
- Non-standard schema: fix orchestrator.md frontmatter
- Generic triggers: narrow hm-deep-research and hm-detective
- AGENT_TOOLS gap: implement or remove references

### Folded Todos
All 4 matched todos folded into scope by user request.

---

## the agent's Discretion

- Exact wording of professional alternatives
- Specific trigger phrase wording
- Exact frontmatter content
- AGENT_TOOLS implementation approach
- Fix ordering within plans

## Deferred Ideas

None — all discussion stayed within phase scope.
