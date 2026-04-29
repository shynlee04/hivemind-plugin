# Compliance Report Template

## Purpose

Standard format for tech context compliance reports. Every validation run produces a report with PASS/FAIL/NEEDS_INVESTIGATION decisions, cited evidence, and actionable recommendations.

## Report Location

Write reports to: `.hivemind/evidence/tech-compliance-report-<timestamp>.md`

Where `<timestamp>` is ISO 8601 UTC format: `2026-04-28T143022Z`

## Report Template

```markdown
---
report_id: tc-<uuid-short>
timestamp: <ISO 8601 UTC>
project: <project name or root directory>
proposal: <what is being evaluated>
evaluator: hm-tech-context-compliance v1.0.0
---

# Tech Context Compliance Report

## Summary

| Check | Result | Detail |
|-------|--------|--------|
| Version Constraints | PASS / FAIL / NEEDS_INVESTIGATION | Brief reason |
| Peer Dependencies | PASS / FAIL / NEEDS_INVESTIGATION | Brief reason |
| Engine Compatibility | PASS / FAIL / NEEDS_INVESTIGATION | Brief reason |
| SDK/API Compliance | PASS / FAIL / NEEDS_INVESTIGATION | Brief reason |
| Cross-Stack Conflicts | PASS / FAIL / NEEDS_INVESTIGATION | Brief reason |

**Overall: PASS / FAIL / NEEDS_INVESTIGATION**

## Proposal

### What is being proposed

[Library name] @ [version] — [one-line description]

### Intended Usage

[How the library/SDK is intended to be used in the project]

### Source

- [Link to npm/PyPI/crates.io/go.dev page]
- [Link to GitHub repository]
- [Link to documentation]

## Detected Tech Stack

| Ecosystem | Runtime | Key Frameworks | Package Manager |
|-----------|---------|----------------|-----------------|
| [ecosystem] | [version] | [framework list] | [manager] |

### Extracted Constraints

- Node.js: v20.x (from .nvmrc)
- React: 18.3.1 (from package.json dependencies)
- TypeScript: 5.4 (from devDependencies)
- ... (additional constraints)

## Compatibility Analysis

### Phase 1: Version Constraint Check

#### Proposed Dependency

```
Package: <name>
Version: <version>
Engines: { ... } (if declared)
Peer Dependencies: { ... } (if declared)
```

#### Version Compatibility

| Constraint | Required | Project Has | Result |
|-----------|----------|-------------|--------|
| [package] | [range] | [installed] | PASS / FAIL |
| engine: [name] | [range] | [installed] | PASS / FAIL |

#### Evidence

```bash
# Command run to verify
$ npm ls <package> --depth=0
<output>

# Or: pip show <package>
<output>
```

### Phase 2: Peer Dependency Check

| Peer Dep | Required Version | Installed Version | Satisfied? |
|----------|-----------------|-------------------|------------|
| [name] | [range] | [version] | YES / NO |

**Peer dependency violations:**
- [List any violations with specific version gaps]

### Phase 3: API/SDK Surface Compliance

_Only if proposal involves SDK/API usage_

#### Import Path Validation

| Import Path | Exists in Installed Package? | Evidence |
|-------------|------------------------------|----------|
| [import path] | YES / NO | [file path or ls output] |

#### Method Signature Check

| Proposed Call | Actual Signature | Match? |
|---------------|-----------------|--------|
| [code snippet] | [from type defs or docs] | YES / NO |

#### Type Compatibility

- TypeScript types: Available in `@types/<package>` / Bundled / NOT AVAILABLE
- Type-check result: PASS (no errors) / FAIL (N errors)

### Phase 4: Cross-Stack Conflict Detection

| Conflict Type | Description | Severity |
|---------------|-------------|----------|
| [type] | [description of conflict] | HIGH / MEDIUM / LOW |

**No conflicts detected** (if applicable)

## Decisions

### PASS items

- [List items that passed with brief justification]

### FAIL items

| # | Issue | Evidence | Recommendation |
|---|-------|----------|----------------|
| 1 | [Issue description] | [file:line or command output] | [How to resolve] |
| 2 | ... | ... | ... |

### NEEDS_INVESTIGATION items

| # | Item | Why Uncertain | What Would Resolve |
|---|------|--------------|-------------------|
| 1 | [Item] | [Reason for uncertainty] | [Specific information needed] |
| 2 | ... | ... | ... |

## Recommendations

### If Overall: PASS

Proceed with integration. No compatibility issues detected.

### If Overall: FAIL

**Do not proceed** until the following are resolved:

1. [Actionable step 1]
2. [Actionable step 2]

Alternative approaches to consider:
- [Alternative A]
- [Alternative B]

### If Overall: NEEDS_INVESTIGATION

**Proceed with caution.** Resolve the following before finalizing:

1. [What needs investigation]
2. [What needs investigation]

After resolution, re-run this compliance check.

## Provenance

- Detection method: [auto/manual]
- Manifest files read: [list of files]
- Commands run: [list of key commands]
- Skills loaded: [list of skills used during validation]
- Date of last stack update: [date or "unknown"]
```

## Decision Criteria

### PASS Criteria

A check returns PASS when:
- Version constraint is satisfied (semver range match)
- Peer dependency is present and within required range
- Engine version meets minimum requirement
- API surface check finds no signature mismatches
- No cross-stack conflicts detected

### FAIL Criteria

A check returns FAIL when:
- Version constraint is violated (semver range mismatch, hard constraint broken)
- Required peer dependency is missing
- Engine version is below requirement
- API method/parameter/return type is incorrect or missing
- Cross-stack conflict is unresolvable (conflicting frameworks, license incompatibility)

### NEEDS_INVESTIGATION Criteria

A check returns NEEDS_INVESTIGATION when:
- Version range is `*` or `latest` (cannot determine exact version)
- Lock file is missing (cannot confirm exact resolved version)
- Package has no published types (for TypeScript projects)
- Version history is unclear (new package, pre-release, no changelog)
- Two sources disagree (documentation vs installed version)
- Conditional/dynamic imports make static analysis unreliable
- Git/URL-based dependency (no version tag)

## Evidence Standards

Every decision MUST cite evidence:

| Evidence Type | Good | Insufficient |
|---------------|------|-------------|
| Version check | `npm ls react: 18.3.1` | "React looks up to date" |
| File exists | `ls node_modules/<pkg>/dist/index.js: exists` | "Should be there" |
| Type check | `tsc --noEmit: 0 errors` | "Types look fine" |
| API signature | `grep "function createClient" node_modules/<pkg>/index.d.ts` output | "Docs say it exists" |
| Conflict | `npm ls <shared-dep>` showing two versions | "Might conflict" |

## Reporting Rules

1. **File under `.hivemind/evidence/`** — not in project root, not in `.opencode/`.
2. **Include timestamp in filename** — for traceability across sessions.
3. **One report per proposal** — do not batch multiple proposals into one report.
4. **Cite evidence** — every FAIL and NEEDS_INVESTIGATION must have a specific command output or file:line reference.
5. **Keep provenance** — list which files were read, commands run, and skills used.
6. **Maximum 3 re-runs** — if a proposal fails validation 3 times, hand off with accumulated evidence rather than looping.
