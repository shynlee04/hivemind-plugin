# Maintainability Scoring

## Overview

Quantitative scoring of codebase maintainability across six dimensions. Each dimension is scored 1-10 with specific criteria and automated verification where possible.

## Scoring Dimensions

### 1. Complexity (Weight: 0.25)

**What it measures:** How difficult the code is to understand and modify.

| Score | Criteria | Detection Method |
|-------|----------|-----------------|
| **1-2** | Many functions > 200 LOC, deeply nested (4+ levels), high cyclomatic complexity (> 20 per function) | ESLint complexity rule, SonarQube, manual inspection |
| **3-4** | Several functions > 100 LOC, moderate nesting (3 levels), cyclomatic complexity 10-15 | Static analysis tools |
| **5-6** | Most functions < 80 LOC, occasional deep nesting, cyclomatic complexity 5-10 | Linter defaults |
| **7-8** | Functions < 50 LOC, shallow nesting (≤2 levels), cyclomatic complexity ≤ 5 | Strict linting |
| **9-10** | Functions < 20 LOC, single responsibility, flat structure, cyclomatic complexity ≤ 3 | Pattern discipline |

**Gathering data:**
```bash
# Complexity metrics via eslint
npx eslint . --rule '{"complexity": ["error", 10]}' --format json

# Via SonarQube scanner (if configured)
npx sonar-scanner

# Manual: grep for function length
grep -r "function " src/ -A 30 | grep -c "^.{100,}$"
```

**Scoring heuristics:**
- Start at 5 (neutral)
- -1 for each module with average function length > 80 LOC
- -1 for each module with cyclomatic complexity > 15
- -1 if code has no complexity linting configured
- +1 if strict complexity gates enforced in CI
- +1 if code follows established patterns (MVC, clean architecture, etc.)

### 2. Coupling (Weight: 0.20)

**What it measures:** Inter-module dependency strength. High coupling means changes cascade.

| Score | Criteria | Detection Method |
|-------|----------|-----------------|
| **1-2** | Spaghetti: every module imports from 10+ others; circular dependencies exist | `dependency-cruiser`, import graph visualization |
| **3-4** | High fan-out: modules import from 5-10 others; 1-2 known circular deps | Dependency analysis |
| **5-6** | Moderate: modules import from 3-5 others; no circular deps | Import graph inspection |
| **7-8** | Low: modules import from 1-3 others; clear dependency direction (no cycles) | Dependency rules enforced |
| **9-10** | Very low: dependency inversion used; interfaces define contracts; hexagonal/clean architecture | Architectural fitness functions |

**Gathering data:**
```bash
# Via dependency-cruiser
npx depcruise --output-type json src/

# Count circular dependencies
npx madge --circular src/

# Manual: count import statements per module
grep -r "^import " src/ | wc -l
```

**Scoring heuristics:**
- Start at 5
- -1 for each circular dependency group found
- -1 if average module has > 8 imports
- -1 if core domain modules depend on infrastructure modules
- +1 if dependency rules are enforced by tooling
- +1 if interfaces/abstractions exist at module boundaries

### 3. Test Coverage (Weight: 0.20)

**What it measures:** Testing thoroughness and quality.

| Score | Criteria | Detection Method |
|-------|----------|-----------------|
| **1-2** | No tests or < 10% coverage | Coverage reporter |
| **3-4** | 10-40% coverage, critical paths untested | Coverage reporter |
| **5-6** | 40-70% branch coverage, critical paths covered | Coverage thresholds |
| **7-8** | 70-90% branch coverage, edge cases tested, mutation testing passing | Coverage + mutation testing |
| **9-10** | > 90% branch coverage, property-based tests, contract tests, integration tests | Full test pyramid |

**Gathering data:**
```bash
# Vitest coverage
npx vitest run --coverage

# Jest coverage
npx jest --coverage

# Mutation testing (Stryker)
npx stryker run
```

**Scoring heuristics:**
- If no tests: score 1
- Start at coverage_percentage / 10 (round down)
- -1 if no integration tests exist (only unit tests)
- -1 if no test for critical business logic paths
- +1 if mutation testing score > 80%
- +1 if tests are co-located with source files for easy discovery

### 4. Documentation (Weight: 0.10)

**What it measures:** Quality and completeness of codebase documentation.

| Score | Criteria | Detection Method |
|-------|----------|-----------------|
| **1-2** | No README, no inline docs, no API docs | File inspection |
| **3-4** | Basic README, sparse inline comments, no architecture docs | File inspection |
| **5-6** | README + CONTRIBUTING, JSDoc on public APIs, basic onboarding | Doc audit |
| **7-8** | Full API docs, architecture decision records (ADRs), onboarding guide | ADR directory, generated docs |
| **9-10** | Living documentation, design system docs, runbooks, postmortems, decision logs | Comprehensive doc suite |

**Gathering data:**
```bash
# Count ADRs
ls docs/adr/ 2>/dev/null | wc -l

# Check JSDoc presence
grep -r "^ \* " src/ | wc -l

# Check README quality
wc -l README.md

# Check for onboarding docs
find . -name "*onboarding*" -o -name "*CONTRIBUTING*" | wc -l
```

**Scoring heuristics:**
- Start at 3
- +1 if README is > 50 lines and has setup instructions
- +1 if ADRs exist for architectural decisions
- +1 if public APIs are JSDoc/Typedoc documented
- +1 if onboarding docs exist (local dev setup, architecture overview)
- +1 if runbooks exist for operations
- +1 if design decisions have dated rationale

### 5. Dependency Freshness (Weight: 0.10)

**What it measures:** Currency of third-party dependencies.

| Score | Criteria | Detection Method |
|-------|----------|-----------------|
| **1-2** | Dependencies > 2 years behind; known CVEs unresolved | `npm outdated`, `npm audit` |
| **3-4** | Major version behind on critical deps; some CVEs | Security audit |
| **5-6** | Minor versions behind; no critical CVEs | Dependency check |
| **7-8** | All deps within minor version; automated updates configured | Renovate/Dependabot |
| **9-10** | All deps current; automated updates with passing CI; zero CVEs | Green dashboard |

**Gathering data:**
```bash
# Check outdated packages
npx npm-check-updates
npm outdated

# Security audit
npm audit --json

# Check for update automation
ls .github/dependabot.yml .github/renovate.json 2>/dev/null
```

**Scoring heuristics:**
- Start at 7
- -1 for each major version behind on a critical dependency
- -1 if any HIGH/CRITICAL CVE exists
- -1 if more than 5 packages are > 1 year outdated
- -1 if no automated dependency updates configured
- +1 if Renovate/Dependabot configured and passing
- +1 if lockfile is committed and CI validates it

### 6. Architectural Debt (Weight: 0.15)

**What it measures:** Violations of intended architecture — patterns not followed, shortcuts taken, drift from design.

| Score | Criteria | Detection Method |
|-------|----------|-----------------|
| **1-2** | Architecture completely diverged from design; patterns systematically violated | Architecture review |
| **3-4** | Multiple known pattern violations; inconsistent layer boundaries; shared mutable state pervasive | Dependency analysis |
| **5-6** | 1-2 known architecture violations; minor layer leakage; some shared state | Manual audit |
| **7-8** | Architecture mostly clean; violations documented as known debt; fitness functions in CI | ArchUnit, dependency-cruiser rules |
| **9-10** | Architecture perfectly matches design; fitness functions prevent regressions; zero known violations | Automated enforcement |

**Gathering data:**
```bash
# Check for layer violations (e.g., UI importing from DB directly)
grep -r "import.*from.*database" src/components/ 2>/dev/null

# Check for known anti-patterns
grep -r "any" src/ --include="*.ts" | wc -l  # TypeScript any usage

# Architecture fitness functions
npx depcruise --validate .dependency-cruiser.js
```

**Scoring heuristics:**
- Start at 5
- -1 for each known architecture pattern violation
- -1 if layer boundaries are violated (e.g., UI directly imports DB)
- -1 if pervasive `any` types or type safety gaps exist
- -1 if no architecture fitness functions or lint rules enforce patterns
- +1 if architecture decisions are documented in ADRs
- +1 if fitness functions run in CI and block regressions

## Maintainability Index Calculation

```
MI = (Complexity × 0.25) + (Coupling × 0.20) + (Coverage × 0.20) + (Docs × 0.10) + (Freshness × 0.10) + (ArchDebt × 0.15)
```

| MI Range | Classification | Action |
|----------|---------------|--------|
| **9.0-10.0** | Excellent | Monitor quarterly. No action needed. |
| **7.0-8.9** | Healthy | Sustainable velocity. Monitor quarterly. |
| **5.0-6.9** | Moderate | Actionable gaps. Address before next milestone feature work. |
| **3.0-4.9** | At Risk | Velocity will degrade. Must address before new feature work. |
| **1.0-2.9** | Critical | Immediate intervention. Block new features until MI ≥ 5.0. |

## Scorecard Template

```markdown
## Maintainability Scorecard — [Date]

| Dimension | Score | Weight | Weighted Score | Red Flags | Evidence |
|-----------|-------|--------|----------------|-----------|----------|
| Complexity | X/10 | 0.25 | X.XX | — | [tool output summary] |
| Coupling | X/10 | 0.20 | X.XX | — | [dep graph summary] |
| Test Coverage | X/10 | 0.20 | X.XX | — | [coverage report] |
| Documentation | X/10 | 0.10 | X.XX | — | [doc audit] |
| Dependency Freshness | X/10 | 0.10 | X.XX | — | [audit summary] |
| Architectural Debt | X/10 | 0.15 | X.XX | — | [arch review] |
| **Maintainability Index** | | | **X.XX** | | **Classification** |

### Trend (vs. Previous Assessment)
| Metric | Previous | Current | Δ |
|--------|----------|---------|---|
| MI | X.XX | X.XX | ±X.XX |
```

## Scoring Frequency

| Project Phase | Scoring Frequency |
|---------------|-------------------|
| Active development (weekly releases) | Every milestone (every 2-4 weeks) |
| Stable maintenance | Quarterly |
| Pre-release / launch prep | Weekly until MI ≥ 7.0 |
| Post-architecture change | Immediately after change lands |

## Anti-Patterns

| Anti-Pattern | Correction |
|-------------|------------|
| **Scoring without tooling** — guessing scores based on "feel" | Run actual tooling. Every dimension has an automated data source. |
| **Score inflation to avoid action** — giving 7s when evidence shows 3s | Cross-reference every score with tool output. If tool says 10% coverage, test score cannot exceed 2. |
| **One-and-done scoring** — scoring once and never updating | Schedule recurring scoring aligned with project phase. |
| **Ignoring dimension weights** — treating all dimensions equally | Use weighted formula. Complexity and coupling matter more than docs for velocity. |
