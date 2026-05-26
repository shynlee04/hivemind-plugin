# Extensibility Checks

## Overview

Architecture extensibility assessment methodology. Verifies that the current architecture supports planned future features and detects when the architecture must evolve to accommodate the roadmap. Based on architecture fitness functions, extension point analysis, and breaking change forecasting.

## The Core Question

For every feature planned in milestones 2+, ask:

> **"If we were to build this feature today, where in the current architecture would it attach?"**

If the answer is "nowhere" or "we'd need to change X first" → you have an architecture gap.

## Extensibility Checklist

Complete this checklist against the current architecture before committing to a roadmap:

### 1. Domain Boundary Stability
- [ ] Bounded contexts are clearly identified and mapped
- [ ] No planned feature crosses a bounded context boundary without an explicit integration contract
- [ ] Domain language is consistent across the codebase (no ambiguous terms used differently in different modules)
- [ ] Context map exists and shows relationships between bounded contexts

**Detection method:**
```bash
# Look for domain model files
find src/ -name "*domain*" -o -name "*model*" -o -name "*entity*"

# Check for context mapping documentation
find docs/ -name "*bounded*" -o -name "*context*map*" -o -name "*domain*"
```

### 2. API Contract Versioning
- [ ] Public APIs have versioning strategy (URL path, header, or content negotiation)
- [ ] Internal service contracts have schema definitions (OpenAPI, Protobuf, GraphQL schema)
- [ ] Breaking change policy is documented (deprecation window, migration guides)
- [ ] Consumer-driven contract tests exist for critical integration points

**Detection method:**
```bash
# Check for API versioning patterns
grep -r "v1\|v2\|/api/v" src/

# Check for API schema files
find . -name "*.openapi.*" -o -name "*.proto" -o -name "schema.graphql"
```

### 3. Data Model Evolvability
- [ ] Database schema migrations are managed (versioned migrations, not ad-hoc changes)
- [ ] Data model supports planned entities without breaking changes to existing tables
- [ ] Read/write separation exists or is planned if analytics/query features are in the roadmap
- [ ] Event sourcing or change data capture is available if real-time features are planned

**Detection method:**
```bash
# Check migration management
find . -path "*/migrations/*" -name "*.sql" -o -path "*/migrations/*" -name "*.ts"

# Check for ORM/DB schema files
find . -name "schema.prisma" -o -name "*.drizzle*"
```

### 4. Feature Flag / Configuration System
- [ ] Feature flags exist for phased rollouts and A/B testing
- [ ] Configuration is externalized (not hardcoded)
- [ ] Runtime configuration changes are possible without redeployment
- [ ] Flag lifecycle management exists (creation → rollout → cleanup)

**Detection method:**
```bash
# Check for feature flag usage
grep -r "feature.flag\|featureFlag\|feature_flag\|FeatureFlag" src/

# Check configuration patterns
find . -name "*.env*" -o -name "config.*" -o -name "*.toml" -o -name "*.yaml"
```

### 5. Extension Points (Plugin/Hook System)
- [ ] Extension points exist where late-binding or third-party behavior is planned
- [ ] Interface-based design enables swapping implementations without cascading changes
- [ ] Event system exists for decoupled communication between modules
- [ ] Dependency injection or service locator pattern is used for composability

**Detection method:**
```bash
# Check for plugin/hook patterns
grep -r "plugin\|extension\|hook\|middleware" src/

# Check for interface/abstract class patterns
grep -r "^export interface " src/ --include="*.ts" | wc -l
```

### 6. Scale Ceiling Estimation
- [ ] Resource profile has been estimated for each roadmap item (CPU, memory, I/O, storage)
- [ ] Current infrastructure limits are documented (max connections, throughput, data size)
- [ ] Growth projections exist for user base, data volume, and request rate
- [ ] Horizontal scaling strategy is in place or planned if growth projections exceed single-node limits

**Detection method:**
```bash
# Check for load testing / benchmark configurations
find . -name "*.bench.*" -o -name "*load*test*" -o -name "*k6*" -o -name "*artillery*"

# Check for infrastructure scaling configuration
find . -name "docker-compose*" -o -name "terraform*" -o -name "kubernetes*"
```

## Architecture Gap Classification

When a checklist item fails, classify the gap:

### BLOCKER Gap
The feature CANNOT be implemented without this architectural capability. No workaround exists.

**Examples:**
- "Feature F-020 requires event-driven communication but there is no event bus."
- "Feature F-015 requires horizontal scaling but the current architecture is single-node only."
- "Feature F-008 requires multi-tenancy but the data model has no tenant isolation."

**Action:** Create an architecture runway item (F-ENB-XXX) that must be completed before the dependent feature. Insert it as a hard dependency in the roadmap.

### RISK Gap
The feature CAN be implemented but with significant added complexity and technical debt accumulation.

**Examples:**
- "Feature F-012 would benefit from a plugin system but could be implemented with hardcoded conditionals."
- "Feature F-018 would be cleaner with a feature flag system but can be deployed as a separate branch."
- "Feature F-009 would be faster with caching but could run without it initially."

**Action:** Flag as RISK. Present the trade-off: implement now with higher complexity vs. invest in runway first. Let stakeholders decide.

### COSMETIC Gap
The architecture supports the feature; the gap is about elegance or best practices.

**Examples:**
- "Feature F-005 could use a newer design pattern but the current approach works fine."
- "Feature F-007's implementation would be slightly cleaner with interface extraction."

**Action:** Note for future refactoring. Do not block the roadmap.

## Architecture Runway Items

Architecture runway items are pre-enablement features that build architectural capabilities needed by future features.

### Runway Item Template

```markdown
### F-ENB-###: [Title]

- **Enables:** [F-XXX, F-YYY, F-ZZZ]
- **Gap Type:** BLOCKER | RISK
- **Description:** [What architectural capability this provides]
- **Scope:** [What needs to be built]
- **Complexity:** S | M | L | XL
- **Must Precede Milestone:** [the milestone containing the first dependent feature]
- **Deferral Risk:** [what happens if we skip this and build dependent features directly]
- **Checklist Item Failed:** [which item from the Extensibility Checklist]
```

### Runway Schedule Rules

1. A runway item must be in a milestone BEFORE any dependent feature
2. If multiple features in different milestones depend on the same runway item → schedule the runway item before the earliest dependent feature
3. A runway item CAN coexist with other features in the same milestone (it's a feature itself)
4. Runway items reduce that milestone's feature capacity

## Breaking Change Forecasting

Predict when radical architecture changes will be needed based on roadmap trajectory.

### Inflection Points

An inflection point occurs when the roadmap trajectory crosses an architecture boundary. Indicators:

| Signal | Detection | Example |
|--------|-----------|---------|
| **Scale inflection** | Planned user/data growth exceeds current architecture's documented ceiling | Current: single DB server (10K QPS). Roadmap M3: 100K QPS. Inflection at M3. |
| **Complexity inflection** | Number of planned features exceeds what the architecture pattern supports | Current: MVC monolith (supports ~50 routes). Roadmap: 80+ routes planned. Inflection at M5. |
| **Integration inflection** | Number of external integrations exceeds what point-to-point connections can manage | Current: 3 integrations. Roadmap: 15 integrations. Inflection at M4. |
| **Team inflection** | Team grows beyond what the current architecture supports for parallel development | Current: 2 devs working in monolith. Roadmap: team grows to 6+. Inflection at M3. |
| **Pattern inflection** | A planned feature requires an architectural pattern not present | Current: synchronous REST. Roadmap: real-time features. Inflection at M2. |

### Inflection Forecast Template

```markdown
### Inflection Point: [Name]

- **Triggering Milestone:** [M#]
- **Current Architecture Ceiling:** [what the architecture limits]
- **Roadmap Requirement:** [what the roadmap demands]
- **Architecture Migration Required:** [what must change]
- **Migration Complexity:** S | M | L | XL
- **Migration Duration (estimated):** [X] milestones
- **Must Start By Milestone:** [M#] (one milestone before the inflection, minimum)
- **Migration Strategy:**
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- **Deferral Cost:** [what happens if migration starts late or is skipped]
```

### Inflection Mitigation Patterns

| Pattern | When to Use | Approach |
|---------|------------|----------|
| **Strangler Fig** | Monolith → microservices migration | Gradually extract services. Old and new coexist during transition. |
| **Feature Toggle Migration** | Replacing a subsystem while maintaining functionality | New implementation behind feature flag. Cut over when ready. |
| **Parallel Run** | High-risk migration (database, auth system) | Run old and new in parallel. Validate outputs match. Cut over when confirmed. |
| **Big Bang (Avoid)** | Almost never appropriate | Avoid. Only acceptable for greenfield rewrites with no existing users. |

## Extensibility Assessment Template

```markdown
# Architecture Extensibility Assessment — [Date]

## Checklist Results

| # | Dimension | Status | Gap Type | Runway Item |
|---|-----------|--------|----------|-------------|
| 1 | Domain Boundary Stability | ✅ Pass / ⚠️ Gap / 🚫 Blocker | — | — |
| 2 | API Contract Versioning | — | — | — |
| 3 | Data Model Evolvability | — | — | — |
| 4 | Feature Flag System | — | — | — |
| 5 | Extension Points | — | — | — |
| 6 | Scale Ceiling Estimation | — | — | — |

## Architecture Runway

| Runway Item | Enables | Must Precede | Complexity | Status |
|-------------|---------|--------------|------------|--------|
| F-ENB-001 | F-012, F-015 | M2 | M (5d) | Scheduled |
| ... | ... | ... | ... | ... |

## Inflection Point Forecast

| Inflection | Triggering Milestone | Migration Must Start By | Migration Duration | Status |
|------------|---------------------|------------------------|-------------------|--------|
| Scale inflection (DB) | M3 | M2 | 1 milestone | Runway scheduled |
| ... | ... | ... | ... | ... |

## Feature-to-Architecture Map

| Feature | Milestone | Attachment Point | Gap? | Mitigation |
|---------|-----------|-----------------|------|------------|
| F-003 | M1 | Auth module → `src/auth/middleware.ts` | No | — |
| F-010 | M2 | Event bus → DOES NOT EXIST | BLOCKER | F-ENB-001 |
| ... | ... | ... | ... | ... |
```

## Anti-Patterns

| Anti-Pattern | Correction |
|-------------|------------|
| **Architecture blindness** — proceeding with roadmap without checking extensibility | Run the full checklist before any milestone commitment. |
| **YAGNI abuse** — dismissing all runway items as "you ain't gonna need it" | YAGNI applies to features, not architecture. If the roadmap says you'll need it by M3, you need it. |
| **Future-proofing paradox** — adding extensibility for features that aren't in the roadmap | Only build runway for committed roadmap items. "Someday" features don't count. |
| **Big Bang deferral** — planning all architecture evolution for one milestone | Spread runway across multiple milestones. Architecture evolves incrementally. |
| **Checklist pass-through** — marking all items ✅ without evidence | Each ✅ must cite evidence: file paths, tool output, or documentation references. |
| **Ignoring inflection signals** — roadmap shows growth but architecture assessment doesn't flag ceilings | Always estimate scale ceilings. If no documented ceiling exists, flag it as a gap. |
