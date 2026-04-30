# Phase 27 Rich Third-Party Research

**Date:** 2026-04-25  
**Researcher:** gsd-phase-researcher subagent  
**Scope:** Third-party rich-source research for `hm-spec-driven-authoring` and `hm-test-driven-execution` repair.  
**Phase directory:** `.planning/phases/27-g-b-quality-assurance-demonstration-rewrite-and-evidence-hm-/`  
**Status:** COMPLETE FOR REPAIR PLANNING — skill implementation not modified.

## 1. Research Question

What third-party skill/repo/source patterns should Phase 27 use to repair the RICH gate failure for the two G-B target skills?

- Target 1: `.opencode/skills/hm-spec-driven-authoring/`
- Target 2: `.opencode/skills/hm-test-driven-execution/`

## 2. Discovery and Evidence Log

| Evidence | Result | Confidence |
|---|---|---|
| `npx --yes skills find spec-driven authoring requirements acceptance tests` | Top relevant results included `addyosmani/agent-skills@spec-driven-development` (1.7K installs), `proffesor-for-testing/agentic-qe@qe requirements validation` (32 installs), `kw12121212/auto-spec-driven@spec-driven-sync-specs` (27 installs), plus acceptance-testing/criteria alternatives. | HIGH — command output captured in current session. |
| `npx --yes skills find test-driven-development TDD red green refactor` | Top current results included `helderberto/skills@tdd` (37 installs), `jellydn/my-ai-tools@tdd` (27 installs), `smithery.ai@tdd` (27 installs), then `bjesuiter/skills@jb-tdd` and `kambleakash0/agent-skills@incremental-tdd`. | HIGH — command output captured in current session. |
| GitHub API root/dir crawl | Inspected target repo structure for selected sources: target directories, references/templates/scripts where available. | HIGH for listed directories; MEDIUM for omitted private/auth-blocked code search. |
| skills.sh page fetch | Fetched selected skills.sh pages for addy spec, proffesor requirements, kw sync, helderberto TDD, jellydn TDD. | HIGH. |
| GitHub code search MCP | `github_search_code` failed with authentication required. | BLOCKED — recorded below. |
| `https://skills.sh/smithery.ai/tdd` | Fetch returned 404. | BLOCKED for smithery candidate crawl. |

## 3. Target A: `hm-spec-driven-authoring`

### Selected top 3 sources

| Pattern | Source | Source URL(s) | Bundled resources inspected | Decision | Gaps / Cautions |
|---|---|---|---|---|---|
| Pattern 1 — Spec-first gated workflow | `addyosmani/agent-skills@spec-driven-development` | skills.sh: `https://skills.sh/addyosmani/agent-skills/spec-driven-development`; GitHub: `https://github.com/addyosmani/agent-skills/tree/main/skills/spec-driven-development` | Target directory contains `SKILL.md` only. Repo root also has `agents/`, `docs/`, `hooks/`, `references/`, and many skills, but this target skill has no local references/scripts/assets. | **ADOPT/ADAPT.** Adopt assumption surfacing, four gates (`SPECIFY → PLAN → TASKS → IMPLEMENT`), six-area spec template, executable commands section, boundaries (`Always/Ask first/Never`), and success criteria reframing. Adapt by keeping hm target narrower: it should produce falsifiable REQ rows and handoff, not own implementation. | Reject the broad Phase 4 implementation ownership for hm-spec-driven-authoring because local boundary says hand off to `hm-test-driven-execution`. Addy target lacks bundled refs/evals, so use as strong body-pattern source, not rich package-structure source. |
| Pattern 2 — Requirements validation / traceability / BDD coverage | `proffesor-for-testing/agentic-qe@qe-requirements-validation` | skills.sh: `https://skills.sh/proffesor-for-testing/agentic-qe/qe-requirements-validation`; GitHub: `https://github.com/proffesor-for-testing/agentic-qe/blob/main/.opencode/skills/qe-requirements-validation.yaml` | GitHub root includes `.opencode/skills/` with many QE YAML skills; repo also includes `assets/`, `benchmarks/`, `config/`, `docs/`, `examples/`, `reports/`, `scripts/`, `src/`, and `tests/`. Target YAML inspected. | **ADOPT/ADAPT.** Adopt SMART validation, traceability matrix, BDD scenario generation, coverage gap/orphan-test framing, quality checks requiring measurable/testable/no-ambiguity acceptance criteria. Adapt away from AQE-specific CLI/API examples into portable tables and command slots. | Do not copy imaginary AQE runtime calls unless the target project has them. Current hm skill should express these as evidence formats, not as hard dependency on `aqe`. |
| Pattern 3 — Spec drift synchronization and mappings | `kw12121212/auto-spec-driven@spec-driven-sync-specs` | skills.sh: `https://skills.sh/kw12121212/auto-spec-driven/spec-driven-sync-specs`; GitHub: `https://github.com/kw12121212/auto-spec-driven/tree/main/skills/spec-driven-sync-specs` | Target dir has `SKILL.md` plus `scripts` symlink. Repo root includes `.spec-driven/config.yaml`, `.spec-driven/specs/`, `.spec-driven/roadmap/`, `.spec-driven/changes/`, `template/`, `scripts/`, many `skills/spec-driven-*`, tests, and docs. | **ADAPT/DEFER.** Adopt evidence-first drift classification, explicit scan scope, reading spec index/config before judging drift, implementation/test mapping metadata, and ambiguous-finding confirmation gate. Defer direct `.spec-driven/` structure and CLI commands unless hm package adds a portable equivalent. | Local hm skill cannot assume `.spec-driven/` exists in arbitrary projects. Use the mapping-frontmatter idea as optional portable metadata, not a required runtime layout. |

### Spec-driven-authoring repair recommendations

1. Add a **Source Audit → Ambiguity Gate → Requirement Table → Acceptance Test Matrix → Handoff Packet** flow that combines Addy’s gated spec workflow with Agentic-QE’s traceability/BDD matrices.
2. Add a **requirements traceability matrix** format: requirement id, source quote/path, acceptance cases, mapped tests, mapped implementation, coverage state, blocker state.
3. Add a **drift/mapping note**: when validating existing code/spec alignment, inspect observable behavior and tests before changing requirements; preserve implementation/test mapping metadata where a project has a planning system.
4. Add **RICH evidence fields** to evals: source path, scenario type (`positive|negative|boundary|stacked`), expected block/lock output, adjacent skill handoff.

## 4. Target B: `hm-test-driven-execution`

### Selected top 3 sources

| Pattern | Source | Source URL(s) | Bundled resources inspected | Decision | Gaps / Cautions |
|---|---|---|---|---|---|
| Pattern 1 — Comprehensive TDD and Prove-It pattern | `addyosmani/agent-skills@test-driven-development` | GitHub: `https://github.com/addyosmani/agent-skills/tree/main/skills/test-driven-development`; raw: `https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/test-driven-development/SKILL.md` | Target directory contains `SKILL.md` only. It includes RED/GREEN/REFACTOR, bug-fix Prove-It, test pyramid, test sizes, state-not-interactions, DAMP over DRY, real implementations over mocks, AAA, browser runtime verification, and completion checklist. | **ADOPT/ADAPT.** Adopt Prove-It bug-fix pattern, test pyramid/size model, state-over-interactions, DAMP test readability, preference order for real/fake/stub/mock, browser runtime verification warning. | Target has no bundled references/scripts/evals; use as content-pattern source. Browser DevTools references are useful but should be optional/adapted to available OpenCode/Playwright/MCP tools. |
| Pattern 2 — One-test-at-a-time vertical TDD with public-interface discipline | `helderberto/skills@tdd` | skills.sh: `https://skills.sh/helderberto/skills/tdd`; GitHub: `https://github.com/helderberto/skills/tree/main/tdd` | Target dir contains `SKILL.md` plus references: `principles.md`, `examples.md`, `deep-modules.md`, `interface-design.md`, `refactoring.md`. Inspected `principles.md` and `examples.md`. | **ADOPT.** Adopt hard rule: one test → minimal code → next test; no all-tests-first batching; tests verify behavior through public interfaces; mocks only at system boundaries; refactor only after green; deep-module/testability planning. | This is the strongest rich-package structure for TDE because references are decomposed and directly usable. Add explicit invalid-RED and coverage evidence from local hm skill to exceed this source. |
| Pattern 3 — Command/action-oriented TDD session state and templates | `jellydn/my-ai-tools@tdd` | skills.sh: `https://skills.sh/jellydn/my-ai-tools/tdd`; GitHub: `https://github.com/jellydn/my-ai-tools/tree/main/skills/tdd` | Target dir contains `SKILL.md` plus `templates/test-template.md`. Repo root includes install scripts, docs, tests, configs, and CLI shell. | **ADAPT/REJECT PARTIAL.** Adopt action/state vocabulary (`start`, `red`, `green`, `refactor`, `cycle`, `watch`, `status`) and test-template idea. Reject direct command wrapper assumptions for hm skill unless project commands exist. | Template is Vitest-flavored; hm skill must be project-agnostic and detect runner. Keep template examples as illustrative, not mandatory. |

### TDD captured-prior candidates cross-check

| Candidate from prior correction | Result | Decision |
|---|---|---|
| `bobmatnyc/claude-mpm-skills@test-driven-development` | GitHub root accessible; repo includes `.bundles/`, `.claude/`, docs, examples, scripts, manifests, and `universal/testing/`. GitHub code search for exact skill path was blocked by auth. | **DEFER** — likely rich repo, but exact target skill path was not proven in current session. Do not use as top-3 evidence until path is confirmed. |
| `izyanrajwani/agent-skills-library@test-driven-development` | GitHub root and `skills/test-driven-development/` directory visible; exact contents not deeply inspected this session. Repo includes many skill dirs and a zip bundle. | **DEFER** — viable alternate if additional crawl time is available, but current top-3 had stronger/better-inspected resources. |
| `smithery.ai@tdd` | `npx skills find` listed it, but `https://skills.sh/smithery.ai/tdd` returned 404 and `github_get_file_contents` for guessed owner/repo failed Not Found. | **REJECT/BLOCKED** — cannot cite as inspected source. |

### Test-driven-execution repair recommendations

1. Add a **Prove-It Pattern** section for bugs: failing reproduction first, then fix, then full regression run.
2. Add a **one-test-at-a-time enforcement rule**: no batching multiple RED tests then implementation; each cycle must have target command evidence.
3. Add **test evidence labels** beyond current runtime-truthful labels: small/medium/large test size; real/fake/stub/mock boundary justification.
4. Add a **TDD session state table** compatible with arbitrary projects: action, target requirement, test command, red output, green output, refactor output, coverage status, next step.
5. Add at least one **portable test template** as a reference with placeholders and an explicit note that runner syntax must adapt to the detected stack.

## 5. Pattern Decision Summary

### `hm-spec-driven-authoring`

| Pattern | Adopt / Adapt / Reject / Defer | Why |
|---|---|---|
| P1 Addy spec-first gated workflow | **ADOPT/ADAPT** | Best trigger/body pattern for surfacing assumptions, blocking ambiguous requirements, and producing reviewable spec artifacts. Adapt to stop before implementation. |
| P2 Agentic-QE requirements validation | **ADOPT/ADAPT** | Best traceability/BDD/coverage matrix pattern. Adapt away from AQE-specific commands into portable evidence tables. |
| P3 Auto-spec-driven drift sync | **ADAPT/DEFER** | Strong mapping/drift pattern and bundled CLI/spec directory evidence. Defer direct `.spec-driven` dependency; adapt mapping metadata as optional. |

### `hm-test-driven-execution`

| Pattern | Adopt / Adapt / Reject / Defer | Why |
|---|---|---|
| P1 Addy comprehensive TDD | **ADOPT/ADAPT** | Best broad TDD content: Prove-It, pyramid, DAMP, mock boundaries, browser runtime check. Adapt optional browser tooling. |
| P2 Helderberto vertical one-test-at-time TDD | **ADOPT** | Best rich resource package with references and anti-rationalization discipline. Directly strengthens RED/GREEN/REFACTOR gates. |
| P3 Jellydn command/action TDD | **ADAPT/REJECT PARTIAL** | Useful action/status/template pattern, but direct slash-command workflow is not portable across arbitrary projects. |

## 6. Blockers and Attempted Evidence

| Blocker | Attempt | Evidence / Impact |
|---|---|---|
| GitHub code search unavailable | `github_search_code` against `bobmatnyc`, `izyanrajwani`, `proffesor-for-testing` repos | Failed with `Authentication Failed: Requires authentication`. Exact search-derived paths cannot be claimed. Directory API and raw URL fetches were used instead. |
| Smithery candidate unresolved | Fetched `https://skills.sh/smithery.ai/tdd` and tried guessed GitHub owner/repo | skills.sh returned 404; GitHub content request returned Not Found. Candidate rejected for this research batch. |
| Some selected top sources have target `SKILL.md` only | Addy spec and TDD target dirs each showed only `SKILL.md` | These are still high-install/high-quality body patterns but not sufficient as package-structure exemplars. Pair with richer resource packages (Helderberto, Jellydn, kw, Agentic-QE). |

## 7. Can Phase 27 Proceed to Implementation Repair?

**Yes — Phase 27 can proceed to implementation repair.**

The RICH gate now has enough third-party evidence to repair both target skills:

- `hm-spec-driven-authoring` should be repaired with Addy’s spec gates, Agentic-QE’s traceability/BDD matrices, and auto-spec-driven’s mapping/drift discipline.
- `hm-test-driven-execution` should be repaired with Addy’s Prove-It/testing-pattern breadth, Helderberto’s one-test-at-a-time/public-interface reference set, and Jellydn’s action/status/template mechanics.

Implementation repair should still treat this artifact as research input, not a license to copy content verbatim. Package updates must preserve Phase 27 boundaries, local project conventions, and arbitrary-user-project portability.

## 8. Source Index

### Discovery commands

- `npx --yes skills find spec-driven authoring requirements acceptance tests`
- `npx --yes skills find test-driven-development TDD red green refactor`

### Spec-driven / requirements sources

- `https://skills.sh/addyosmani/agent-skills/spec-driven-development`
- `https://github.com/addyosmani/agent-skills/tree/main/skills/spec-driven-development`
- `https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/spec-driven-development/SKILL.md`
- `https://skills.sh/proffesor-for-testing/agentic-qe/qe-requirements-validation`
- `https://github.com/proffesor-for-testing/agentic-qe/blob/main/.opencode/skills/qe-requirements-validation.yaml`
- `https://skills.sh/kw12121212/auto-spec-driven/spec-driven-sync-specs`
- `https://github.com/kw12121212/auto-spec-driven/tree/main/skills/spec-driven-sync-specs`
- `https://github.com/kw12121212/auto-spec-driven/tree/main/.spec-driven`

### TDD sources

- `https://github.com/addyosmani/agent-skills/tree/main/skills/test-driven-development`
- `https://raw.githubusercontent.com/addyosmani/agent-skills/main/skills/test-driven-development/SKILL.md`
- `https://skills.sh/helderberto/skills/tdd`
- `https://github.com/helderberto/skills/tree/main/tdd`
- `https://raw.githubusercontent.com/helderberto/skills/main/tdd/references/principles.md`
- `https://raw.githubusercontent.com/helderberto/skills/main/tdd/references/examples.md`
- `https://skills.sh/jellydn/my-ai-tools/tdd`
- `https://github.com/jellydn/my-ai-tools/tree/main/skills/tdd`
- `https://github.com/jellydn/my-ai-tools/blob/main/skills/tdd/templates/test-template.md`

### Deferred / blocked alternates

- `https://github.com/bobmatnyc/claude-mpm-skills`
- `https://github.com/izyanrajwani/agent-skills-library/tree/main/skills/test-driven-development`
- `https://skills.sh/smithery.ai/tdd` — 404 during this session.
