# Package Independence Baseline

## Goal
- Shift the active skill-refactor mission from pollution-centric analysis to package independence and self-sufficiency.
- Make root `skills/**` packages stand on their own with package-local authority and package-local assets.
- Prefer markdown-only or package-local resources over cross-package dependencies and tool-specific enforcement chains.

## Authority
- Root `skills/**` is the source authority.
- `.opencode/skills/**` is projection evidence only.
- Current projection behavior is defined by:
  - `src/shared/opencode-skill-registry.ts`
  - `src/features/runtime-observability/sync.ts`
- User-designated detox workspace for audited/refactored skill packages is:
  - `.developing-skills/auditing-skills/`
  - `.developing-skills/refactored-skills/`
- For this detox program, future targeted package work should land in `.developing-skills/**` first; root `skills/**` should be treated as a mirror/update surface only when explicitly verified or intentionally upstreamed.

## Independence Contract
- One package = one directory under `skills/<skill-id>/`.
- `SKILL.md` is mandatory and canonical.
- Allowed:
  - package-local `references/*.md`
  - package-local `templates/*.md`
  - package-local `tests/*.md`
  - package-local scripts/assets when they are truly local authoring/runtime helpers
- Preferred near-term shape:
  - markdown-only package resources, because current projection is markdown-first and incomplete for non-markdown assets
- Forbidden:
  - hard dependency on sibling-package files or scripts
  - phantom routes to missing skills
  - treating `.opencode/skills/**` as package authority

## Verified Dependency Blockers
- `use-hivemind` hard-routes into sibling packages and still names phantom `Domain specialist` targets.
- `use-hivemind-context-integrity` hard-depends on `use-hivemind`, `context-intelligence-entry`, and `context-entry-verify`.
- `use-hivemind-context-verify` hard-depends on `use-hivemind`, `use-hivemind-context-integrity`, and `context-entry-verify`.
- `use-hivemind-hierarchy` hard-depends on `use-hivemind` and `agent-role-boundary`, and still references phantom governance/permission targets.
- `use-hivemind-delegation` and `hivemind-delegation-write` form a tight sibling chain.
- `use-hivemind-git-memory` hard-depends on `use-hivemind`, `context-intelligence-entry`, and `git-atomic-memory`, and still references phantom `use-hivemind-session-resume`.
- `git-atomic-memory` references phantom `session-memory-resume` and `delegation-handoff`.
- `spec-distillation` still references phantom `entry-resolution`.

## Verified Asset / Projection Constraints
- Currently closest to self-contained markdown-first packages:
  - `use-hivemind`
  - `agent-role-boundary`
  - `git-atomic-memory`
  - `use-hivemind-detox-refactor` is markdown-only internally, but current projection is not yet reliable evidence of completeness.
- Packages with non-markdown support surfaces that current projection does not reliably mirror:
  - `context-intelligence-entry`
  - `use-hivemind-context-integrity`
  - `use-hivemind-context-verify`
  - `use-hivemind-delegation`
  - `use-hivemind-git-memory`
  - `use-hivemind-hierarchy`
  - `spec-distillation`
- `hivemind-delegation-write` is structurally incomplete as a standalone package because it expects local execution support it does not ship.

## Best First Refactor Wave
1. `spec-distillation`
   - Smallest dependency cleanup: remove or replace `entry-resolution` routing.
2. `context-entry-verify`
   - Already close to self-contained; reduce sibling comparison language and keep local verification contract.
3. `context-intelligence-entry`
   - Keep package-local logic, reduce sibling handoff dependence, and normalize local assets.

## Deferred After First Wave
- Broad router decomposition in `use-hivemind`.
- Delegation/hierarchy pack untangling.
- Git-memory resume/handoff phantom removal.
- Projection hardening in `src/**` for scripts, schemas, nested files, and stale cleanup.
