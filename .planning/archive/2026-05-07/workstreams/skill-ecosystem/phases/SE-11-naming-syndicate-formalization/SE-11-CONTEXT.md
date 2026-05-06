---
phase: SE-11
workstream: skill-ecosystem
status: COMPLETE
depends_on:
  - SE-10
blocks:
  - AS-11
created: 2026-04-29
---

# SE-11: Naming Syndicate Formalization — Context

## Phase Goal
Formalize a naming taxonomy across ALL 49 skills following the `[lineage]-[domain]-[function]` pattern. Document naming rules in `NAMING-SYNDICATE.md`, fix all inconsistencies, and create a machine-verifiable validation script. Enforce consistency so every skill name is predictable, parsable, and routable.

## Starting State
- SE-10 completed: routers exist and need predictable, parseable skill names
- Skills have inconsistent naming: `hm-*` (28), `hf-*` (11), `gate-*` (3), `stack-*` (6), unprefixed (1: `opencode-config-workflow`)
- No documented naming convention exists — names were organically chosen
- `hf-meta-builder` frontmatter was fixed (was `hr-meta-builder`), but other inconsistencies may remain
- `opencode-config-workflow` → `hf-config-workflow` rename is SE-6 responsibility (SE-11 validates it was done)
- Domain/function taxonomy exists informally but is not documented as a naming standard

## Deliverables
1. **`NAMING-SYNDICATE.md`** — Comprehensive naming convention document:
   - Prefix rules: `hm-` (product dev), `hf-` (meta builder), `gate-` (internal), `stack-` (tech reference)
   - Domain category taxonomy: brainstorm, requirements, spec, research, implementation, quality, debug, phase, delegation, context, audit, reference, etc.
   - Function naming patterns: `-router`, `-orchestrator`, `-coordinator`, `-detector`, `-manager`, `-reference`, `-builder`, etc.
   - Conflict resolution rules: what happens when two skills target the same domain+function
   - Edge cases: skills that bridge lineages (e.g., hm- but referenced by hf-)
2. **Naming consistency fixes** — Any skill where frontmatter `name:` does not match directory name or violates the `[lineage]-[domain]-[function]` pattern.
3. **Validation script** at `.planning/workstreams/skill-ecosystem/scripts/validate-naming.sh` — Checks all 49 skills against NAMING-SYNDICATE.md rules.
4. **Zero unprefixed skills** — Verify all skills have the correct lineage prefix (SE-6 must complete `opencode-config-workflow` → `hf-config-workflow` rename before this phase).

## Acceptance Criteria
- [ ] `NAMING-SYNDICATE.md` published with complete naming taxonomy
- [ ] All 49 skills validated: frontmatter `name:` matches directory name
- [ ] All 49 skills validated: name follows `[lineage]-[domain]-[function]` pattern
- [ ] Zero unprefixed skills remain (SE-6 prerequisite verified)
- [ ] `scripts/validate-naming.sh` runs and passes (exit 0 = all consistent)
- [ ] Domain category taxonomy documented for all 49 skills
- [ ] Function naming patterns documented with examples
- [ ] Conflict resolution rules documented
- [ ] Naming convention is machine-verifiable via regex in validation script

## Known Risks
- Naming changes may break cross-references in skill SKILL.md files that reference other skills by name
- `opencode-config-workflow` rename is SE-6 responsibility — if SE-6 hasn't completed, this phase must either block or work around it
- Domain taxonomy boundaries may be ambiguous for some skills (e.g., is `hm-deep-research` in "research" or "investigation"?)
- Renaming skills after routers are created (SE-10) means router trigger-condition mappings must be updated

## Skills/Agents Involved
- **Creates:** `NAMING-SYNDICATE.md`, `scripts/validate-naming.sh`
- **Validates:** All 49 active skills (naming consistency)
- **References:** SE-10 routers (must be updated if names change)
