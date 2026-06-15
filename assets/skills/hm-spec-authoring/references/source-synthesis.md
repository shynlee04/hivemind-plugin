# Source Synthesis for Spec-Driven Authoring

## Purpose

Read this when auditing provenance, explaining why this skill behaves the way it does, or checking the RICH gate. It records third-party evidence decisions without requiring any external skill package at runtime.

## Inspected Sources and Decisions

| Source | Materials reviewed in Phase 27 research | Decision | Transformation in this package |
|---|---|---|---|
| `addyosmani/agent-skills@spec-driven-development` | skills.sh page, GitHub target directory, raw `SKILL.md`; target had `SKILL.md` only. | Adopt/adapt. | Adopt assumption surfacing and gated `SPECIFY → PLAN → TASKS → IMPLEMENT` discipline; adapt to stop at spec lock and handoff instead of implementing. |
| `proffesor-for-testing/agentic-qe@qe-requirements-validation` | skills.sh page, GitHub YAML skill, repository directories including assets, benchmarks, docs, examples, reports, scripts, src, tests. | Adopt/adapt. | Adopt SMART requirement checks, traceability matrix, BDD coverage, gap/orphan framing; replace AQE-specific commands with portable evidence tables. |
| `kw12121212/auto-spec-driven@spec-driven-sync-specs` | skills.sh page, GitHub skill directory, `.spec-driven` directories, scripts symlink, templates, tests, docs. | Adapt/defer. | Adapt drift classification and implementation/test mapping metadata; defer `.spec-driven/` file layout and CLI assumptions. |

## Adopted Professional Patterns

1. **Gate before generation:** never turn vague intent directly into implementation tasks.
2. **Traceability as the unit of truth:** every REQ row carries source quote/path, acceptance case, verification method, and mapping state.
3. **BDD as portable syntax:** Given/When/Then explains observable proof without requiring Cucumber or any specific runner.
4. **Drift is evidence, not blame:** classify source/code/test mismatch before editing either side.
5. **Portable adapters:** use project-local paths, commands, and public interfaces; do not assume GSD, BMAD, OMO, Spec-kit, or this repository.

## Rejected or Deferred Patterns

| Pattern | Reason |
|---|---|
| Owning implementation after task generation | Violates this skill boundary; implementation belongs to test-first execution or a project-specific builder. |
| AQE CLI/API calls | They are useful in the source ecosystem but would make this package non-standalone. |
| Required `.spec-driven/` config/index files | Strong pattern for projects that have it, but arbitrary OpenCode projects may not. Use optional mapping metadata instead. |

## Independence Audit

This skill must run in an arbitrary OpenCode project when the only inputs are a source artifact and available file/shell tools. If a project lacks planning state, write the matrix into the user-requested artifact or return it inline. If a project lacks test tooling, mark verification as inspection/manual/blocked instead of inventing commands.
