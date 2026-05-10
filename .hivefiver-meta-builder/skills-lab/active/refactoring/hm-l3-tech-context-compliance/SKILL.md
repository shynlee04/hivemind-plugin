---
name: hm-l3-tech-context-compliance
description: Validate that proposed libraries, frameworks, SDKs, and dependencies are compatible with the project's existing tech stack. Use when checking tech context, running compatibility checks, performing stack validation, verifying dependency compatibility, checking SDK compliance, validating API compatibility, running peer dependency checks, detecting version conflicts, enforcing tech constraints, or validating dependencies against project standards. NOT for deep package research — that is hm-deep-research.
metadata:
  layer: "3"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
  lineage: "hm"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
pipeline:
  stage: validation
  reads:
    - "package.json"
    - "requirements.txt"
    - "go.mod"
    - "Cargo.toml"
    - "pom.xml"
    - "*.csproj"
    - "tsconfig.json"
  writes:
    - "<project-root>/evidence/tech-compliance-report-<timestamp>.md"
  upstream:
    - "hm-deep-research"
    - "hm-detective"
  downstream:
    - "hm-spec-driven-authoring"
    - "hm-requirements-analysis"
  boundary:
    - "hm-brainstorm"
---

## Overview

Validate that proposed libraries, frameworks, SDKs, and dependencies are compatible with what a project already uses. When features are designed, they often assume tech stacks that conflict with the project's existing constraints, or use APIs/SDKs in ways that don't match the platform's actual capabilities.

This skill performs automated detection, compatibility validation, and compliance reporting. It catches version conflicts, peer dependency violations, API surface mismatches, and cross-stack incompatibilities before they become runtime bugs.

## The Iron Law

```
Before accepting any new dependency or SDK usage, validate it against what exists.
```

## Quick Jump

| Task | Section / Reference |
|------|---------------------|
| "What stack is this project?" | [Auto-Detect the Tech Stack](#auto-detect-the-tech-stack) |
| "Is library X compatible?" | [Compatibility Check Workflow](#compatibility-check-workflow) |
| "What format is this project?" | `references/detection-patterns.md` |
| "Will these versions conflict?" | `references/compatibility-rules.md` |
| "Is this SDK usage correct?" | `references/sdk-compliance-checks.md` |
| "How do I report findings?" | `references/report-template.md` |
| "What should I check first?" | [Detection Ordering](#detection-ordering) |

## Entry Gate

Proceed only when a concrete proposal exists: a library name, framework choice, SDK call, or dependency being considered. If the question is "what should we use?", route to `hm-deep-research` for library evaluation — return here when a candidate is selected.

Before starting validation:
1. Read the proposal — identify the specific dependency, version, or SDK usage being evaluated.
2. Confirm the project has at least one detectable tech stack indicator file (package.json, requirements.txt, etc.).
3. If the project is multi-language, select the relevant ecosystem(s) for this check.
4. If no manifest files exist, report `NEEDS_CONTEXT` and ask for stack information.

## Auto-Detect the Tech Stack

### Step 1: Scan for Manifest Files

Run this detection scan first:

```bash
# Find all manifest files in project
ls package.json pom.xml build.gradle build.gradle.kts Cargo.toml go.mod requirements.txt pyproject.toml Pipfile *.csproj *.fsproj Gemfile composer.json mix.exs CMakeLists.txt 2>/dev/null
```

### Step 2: Classify the Ecosystem

Use the detection patterns in `references/detection-patterns.md` to classify each ecosystem. The patterns cover these ecosystems:

| Ecosystem | Primary Indicators |
|-----------|-------------------|
| Node.js / TypeScript | `package.json`, `tsconfig.json`, `.nvmrc` |
| Python | `requirements.txt`, `pyproject.toml`, `Pipfile`, `setup.py` |
| Go | `go.mod`, `go.sum` |
| Rust | `Cargo.toml`, `Cargo.lock` |
| Java / JVM | `pom.xml`, `build.gradle`, `build.gradle.kts` |
| .NET | `*.csproj`, `*.fsproj`, `packages.config` |
| Ruby | `Gemfile`, `*.gemspec` |
| PHP | `composer.json`, `composer.lock` |
| Elixir | `mix.exs` |

### Step 3: Extract Constraints

For each detected ecosystem, extract:
- **Runtime version** (Node version from `.nvmrc` or `engines`, Python version from `pyproject.toml`, Go version from `go.mod`)
- **Core dependencies** with version ranges (from lock files or manifest files)
- **Build tools** (bundler, webpack, cargo, maven, gradle)
- **Framework constraints** (React version, Django version, etc.)
- **Platform requirements** (OS constraints, CPU architecture if specified)

### Step 4: Summarize

Produce a concise stack summary:

```markdown
## Detected Tech Stack

| Ecosystem | Runtime | Key Framework | Package Manager |
|-----------|---------|---------------|-----------------|
| Node.js | v20.x | React 18.3 | npm (lockfileVersion 3) |
```

## Compatibility Check Workflow

### Phase 1: Version Constraint Check

1. Extract the proposed dependency's version and its declared peer dependencies.
2. Cross-reference against the project's current versions using `references/compatibility-rules.md`.
3. Check for:
   - **Major version conflicts** — e.g., React 18 and a library requiring React 17
   - **Peer dependency violations** — library needs peer X@^2 but project has X@^3
   - **Engine constraints** — library requires Node >= 22 but project uses Node 20
   - **Overlapping sub-dependencies** — two libraries drag in incompatible versions of shared transitive deps

### Phase 2: API/SDK Surface Compliance

1. If the proposal involves SDK usage, load `references/sdk-compliance-checks.md`.
2. Verify that the proposed SDK calls match actual API signatures:
   - Check parameter types, return types, and error handling patterns.
   - For TypeScript projects, type-check against installed `@types/` packages.
   - For OpenCode-specific SDKs (plugin API, tools, hooks), validate against `hm-opencode-platform-reference`.

### Phase 3: Cross-Stack Conflict Detection

Flag any of these conflict patterns:

| Conflict Type | Signal | Action |
|---------------|--------|--------|
| Duplicate capability | Two libs solve same problem | Recommend one, remove other |
| Build tool clash | Two incompatible build systems | Resolve merge strategy |
| Runtime contention | Two frameworks claim same port/process | Document conflict |
| License incompatibility | GPL lib in MIT project | Escalate for legal review |
| Security policy violation | Pinned vulnerable version | Block or flag with severity |

### Phase 4: Produce Compliance Report

Write a compliance report using the template in `references/report-template.md`. The report must include:

- **PASS** — fully compatible, no issues detected
- **FAIL** — blocked by incompatible version, missing peer dep, or engine violation
- **NEEDS_INVESTIGATION** — uncertain (ambiguous version ranges, missing docs, new library)

Write the report to `<project-root>/evidence/tech-compliance-report-<timestamp>.md` for durable traceability. In HiveMind harness projects, use `.hivemind/evidence/`; in GSD projects, use `.planning/evidence/`; in arbitrary projects, default to `evidence/` at project root.

## Detection Ordering

Run checks in this order. Stop at the first FAIL — do not invest time validating downstream.

```
1. VERSION CONSTRAINTS
   └─ Engine/runtime version match
   └─ Peer dependency satisfaction
   └─ Major version compatibility

2. PEER DEPENDENCIES
   └─ Declared peer deps present
   └─ Peer dep version ranges satisfied

3. API/SDK COMPATIBILITY
   └─ Import paths exist
   └─ API signatures match
   └─ Type compatibility (if typed)

4. PLATFORM REQUIREMENTS
   └─ OS support
   └─ Architecture support
   └─ Build tool compatibility
```

## Decision Tree

```
What are you checking?
|
+-- "Is this library safe to add?"
|   -> Run full 4-phase compatibility check (above)
|   -> Produce PASS/FAIL/NEEDS_INVESTIGATION report
|
+-- "Does this SDK usage look right?"
|   -> Load references/sdk-compliance-checks.md
|   -> Verify API surface against docs or types
|
+-- "Are these versions going to conflict?"
|   -> Load references/compatibility-rules.md
|   -> Run version constraint check only
|
+-- "What stack is this project even using?"
|   -> Run auto-detect sequence
|   -> Load references/detection-patterns.md for edge cases
|
+-- "I have multiple proposals — rank them by compatibility"
|   -> Run full check on each proposal
|   -> Produce ranked comparison with compatibility scores
```

## Cross-References

### Skills This Skill Feeds Into

| Skill | What It Receives |
|-------|-----------------|
| `hm-spec-driven-authoring` | Validated tech constraints for spec enforcement |
| `hm-requirements-analysis` | Compatible dependency options, blocked choices |
| `hm-brainstorm` | Current tech stack as ideation constraint |

### Skills This Skill Consumes From

| Skill | What It Provides |
|-------|-----------------|
| `hm-deep-research` | Library research findings, version histories, API docs |
| `hm-detective` | Codebase structure, import analysis, type definitions |
| `hm-opencode-platform-reference` | OpenCode SDK API surface (for SDK compliance checks) |

### Boundary Rules

| Nearby Skill | Boundary |
|-------------|----------|
| `hm-deep-research` | Tech-context-compliance validates compatibility; deep-research does the library evaluation. This skill does NOT decide which library is best — it checks if a candidate fits. |
| `hm-spec-driven-authoring` | This skill provides validated constraints; spec-driven-authoring enforces them. |
| `hm-tech-stack-ingest` (future SE-4) | When available, pre-loads bundled repo docs for offline API validation. |

## Edge Cases

| Scenario | Response |
|----------|----------|
| No manifest files found | Report `NEEDS_CONTEXT`, ask for manual stack declaration |
| Multi-language monorepo | Detect each ecosystem independently, validate per-package |
| Lock file missing | Use manifest ranges, flag as `NEEDS_INVESTIGATION` (lower confidence) |
| Version range is `*` or `latest` | Report `NEEDS_INVESTIGATION` — cannot determine exact version |
| Library has no published types | For TypeScript, flag if `@types/` package is missing, recommend `declare module` |
| Proposed dep is pre-release (0.x, alpha, beta) | Flag `NEEDS_INVESTIGATION` with a stability warning |
| SDK matches OpenCode plugin API | Verify against `hm-opencode-platform-reference` skill's documented interface |
| Circular peer dependency | Report FAIL — circular peer deps are always broken |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Blind Add** — adding a dependency without checking compatibility | No manifest comparison performed | Run Phase 1 (version constraints) before any `npm install` / `pip install` / etc. |
| **The Version Guess** — assuming a version without checking the lock file | Version not cross-referenced with lock file | Always read the lock file (`package-lock.json`, `poetry.lock`, `Cargo.lock`, etc.) |
| **The Ecosystem Confusion** — applying npm rules to Python dependencies | Using wrong adapter for package manager | Load `references/detection-patterns.md` to identify the correct ecosystem |
| **The SDK Handwave** — using SDK methods without verifying signatures | No API surface check performed | Load `references/sdk-compliance-checks.md`, verify every method call |
| **The Silent Overlap** — installing a dependency that duplicates existing capability | Two packages solve same problem, no alert | Run Phase 3 cross-stack conflict detection |
| **The Monorepo Blind Spot** — checking only root manifest | Only root `package.json` checked, workspaces ignored | Check all workspace/package manifests in monorepo projects |
| **The Stale Doc** — trusting docs over actual installed types | Doc says X, installed version is Y | Prioritize installed types (`npm ls`, `pip freeze`, etc.) over documentation |

## Validation Loop

```
do → validate → fix → repeat

1. DETECT: Run auto-detect scan → classify ecosystem
2. EXTRACT: Parse manifest/lock files → identify constraints
3. CHECK: Run compatibility phases 1-4 → produce decisions
4. REPORT: Write compliance report → cite evidence
5. VERIFY: Re-run checks if project files change → gate on PASS/FAIL
```

If any check returns FAIL:
- Document the specific conflict with file:line evidence.
- If the conflict is resolvable (version bump, alternative library), propose the fix.
- If unresolvable (fundamental architecture conflict), escalate to `hm-requirements-analysis`.

**Maximum 3 iterations** of the validation loop on the same proposal. After 3 rounds without resolution, hand off with the accumulated evidence.

## Self-Correction

### When no manifest files are found
**Detection:** `ls package.json pom.xml ...` returns nothing and no other ecosystem indicators exist.
**Recovery:** Report `NEEDS_CONTEXT` immediately. Ask: "I cannot auto-detect your tech stack. Please tell me: (1) what language/runtime, (2) what package manager, (3) what key frameworks." Do not attempt compatibility checks without stack information.

### When a FAIL result is based on stale lock file data
**Detection:** Compliance report shows FAIL for a version constraint, but the user says "we just upgraded that last week."
**Recovery:** Re-read the lock file fresh (do not trust cached reads). If the lock file is outdated, flag it: "The lock file shows version X but you indicate version Y. Please run `install` to update the lock file, then re-check."

### When ecosystem misclassification produces wrong compatibility rules
**Detection:** Python-specific rules (requirements.txt, pip) are being applied to a Node.js project, or vice versa.
**Recovery:** Re-run `references/detection-patterns.md`. Double-check that the manifest file matches the ecosystem. Multi-language monorepos need per-package classification. If uncertain, ask the user to confirm the ecosystem.

### When the validation loop exceeds 3 iterations without resolution
**Detection:** Same proposal has been through 3 compatibility check rounds and still returns FAIL or NEEDS_INVESTIGATION.
**Recovery:** Hand off with accumulated evidence. Say: "After 3 validation rounds, the proposal remains [FAIL/NEEDS_INVESTIGATION]. Key unresolved issues: [list]. Recommended next step: escalate to `hm-requirements-analysis` for deeper gap analysis or `hm-deep-research` for alternative library research."

## Success Criteria

- [ ] Project tech stack auto-detected with ecosystem classification
- [ ] All proposed dependencies checked against version constraints
- [ ] Peer dependency chains validated
- [ ] SDK/API surface compliance verified (where applicable)
- [ ] Cross-stack conflicts flagged
- [ ] Compliance report written to `<project-root>/evidence/` (HiveMind: `.hivemind/evidence/`, GSD: `.planning/evidence/`) with PASS/FAIL/NEEDS_INVESTIGATION decisions
- [ ] All FAIL results include specific conflict evidence (file:line or doc reference)
- [ ] All NEEDS_INVESTIGATION results include what would resolve them
