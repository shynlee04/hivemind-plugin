# Compatibility Rules — Version Constraints, Peer Dependencies, Breaking Changes

## Purpose

This reference defines the rules for validating that proposed dependencies are version-compatible with a project's existing dependencies. Covers semver constraint checking, peer dependency resolution, breaking change detection, and ecosystem-specific rules.

## Core Rules

### Rule 1: Major Version Compatibility

```
If project has dep@MAJOR_A and proposed dep requires dep@MAJOR_B:
  MAJOR_A == MAJOR_B → PASS (further check for minor/patch satisfaction)
  MAJOR_A != MAJOR_B → Check if coexistence is possible:
    - Same package but different majors → FAIL if shared in same dependency graph
    - Different packages → PASS (they can coexist)
```

**Application:**
- A library requiring React 18 cannot coexist with a library requiring React 17 in the same bundle.
- Two libraries depending on different major versions of a shared transitive dependency may cause runtime errors.

### Rule 2: Peer Dependency Satisfaction

```
For each peerDependency declared by the proposed package:
  Check if project has that peer dep installed:
    YES → Check if project's version satisfies the peer dep's semver range
    NO  → FAIL — peer dependency missing
```

**Example:**
```json
// Proposed library declares:
"peerDependencies": { "react": "^18.0.0" }

// Project has:
"dependencies": { "react": "18.3.1" }

// Result: PASS — 18.3.1 satisfies ^18.0.0
```

### Rule 3: Engine Constraints

```
Extract engines field from proposed package:
  Check node/npm/yarn version from project against engine constraint:
    Project version >= engine minimum → PASS
    Project version < engine minimum → FAIL
    Engine field missing → PASS (no constraint)
```

**Example:**
```json
// Proposed library declares:
"engines": { "node": ">=22.0.0" }

// Project .nvmrc says: 20

// Result: FAIL — Node 20 < required 22
```

### Rule 4: Overlapping Transitive Dependencies

```
For each dependency shared between proposed_pkg and existing_pkg:
  Compare version ranges:
    Ranges overlap → PASS
    Ranges don't overlap → FAIL (possible runtime conflict)
    Same exact version → PASS
```

## Semver Constraint Resolution

### Constraint Types

| Constraint | Example | Meaning | Check |
|-----------|---------|---------|-------|
| Exact | `1.2.3` | Exactly 1.2.3 | `==` |
| Caret | `^1.2.3` | `>=1.2.3 <2.0.0` | Semver range |
| Tilde | `~1.2.3` | `>=1.2.3 <1.3.0` | Semver range |
| Greater/equal | `>=1.2.3` | Any >= 1.2.3 | Numeric |
| Range | `1.2.3 - 2.0.0` | Between inclusive | Range check |
| Wildcard | `1.x` or `*` | Any in major / any | Flag `NEEDS_INVESTIGATION` |
| Range union | `>=1.2.3 \|\| >=2.0.0` | Either range | Check both |

### Conflict Detection Algorithm

```
function checkCompatibility(projectVersion, dependencyConstraint):
  if dependencyConstraint is "*" or "latest":
    return NEEDS_INVESTIGATION

  if projectVersion satisfies dependencyConstraint per semver:
    return PASS

  if projectVersion.major > dependencyConstraint.max.major:
    return FAIL_MAJOR_BREAK

  if projectVersion < dependencyConstraint.min:
    return FAIL_TOO_OLD

  return FAIL_MISMATCH
```

### Ecosystem-Specific Adaptations

#### npm (semver)

```bash
# Check if version satisfies range
npx semver -r "^18.0.0" "18.3.1" && echo "PASS" || echo "FAIL"
npx semver -r ">=16" "20.0.0" && echo "PASS" || echo "FAIL"

# Get installed version of a package
npm ls <package-name> --depth=0 2>/dev/null | grep <package-name> | grep -oP '\d+\.\d+\.\d+'

# Check peer dependency violations
npm ls 2>&1 | grep -i "peer dep\|UNMET PEER\|peer dependency"
```

#### Python (pip)

```bash
# Get installed version
pip show <package-name> 2>/dev/null | grep "Version:" | awk '{print $2}'

# Check constraint (python semver is less strict)
# pip checks: compatible release (~=), ==, >=, <=, !=
pip install --dry-run <package-name>==X.Y.Z 2>&1 | grep -i "conflict\|Requirement"

# Check dependency tree for conflicts
pip check 2>&1
```

#### Go (semver via go.mod)

```bash
# Go modules use semver with /v2+ suffix
# Major version 2+ requires import path suffix

# Check dependency version
grep '<module-path>' go.mod | grep -oP 'v\d+\.\d+\.\d+'

# Check for version conflicts
go mod graph | grep '<module-path>'
```

#### Rust (Cargo semver)

```bash
# Cargo uses semver with ^ as default
# Get resolved version from lock file
grep -A 2 'name = "<package>"' Cargo.lock | grep version

# Check for dependency tree conflicts
cargo tree -d 2>&1 | grep -i "duplicate\|conflict"
```

#### JVM (Maven/Gradle)

```bash
# Maven: check dependency tree
mvn dependency:tree -Dincludes=<group>:<artifact> 2>&1

# Gradle: check dependencies
./gradlew dependencies --configuration compileClasspath 2>&1 | grep <artifact>
```

---

## Breaking Change Detection

### Major Version Breaks

A major version bump (e.g., `1.x → 2.x`) signals breaking changes. Validate:

1. **Check changelog** — Look for `CHANGELOG.md`, `MIGRATION.md`, or release notes.
2. **Verify API removals** — Search for deprecated methods being used in codebase:
   ```bash
   # TypeScript/JavaScript
   grep -r "deprecated\|@deprecated" node_modules/<package> 2>/dev/null | head -10
   ```
3. **Check TypeScript types** — If typed, `npm run typecheck` or `tsc --noEmit` to catch type errors from API changes.

### Peer Dependency Version Jumps

When a library bumps its peer dependency requirement:
- **Minor bump** (e.g., react `^18 → ^18.3`) — usually safe, verify.
- **Major bump** (e.g., react `^18 → ^19`) — must check all consumers.

### Package Renames / Splits

Some packages are renamed or split across major versions:
- `@material-ui/core` → `@mui/material`
- `vue` 2.x → `vue` 3.x (major API changes)
- `react-router-dom` v5 → v6 (complete API rewrite)

Check for these known transitions when proposing a dependency at a version that crosses a rename boundary.

---

## Common Conflict Patterns

| Pattern | Example | Detection |
|---------|---------|-----------|
| **Two React versions** | Library A has `peerDep react@^18`, Library B bundles `react@17` | `npm ls react` shows two versions |
| **Node engine mismatch** | Library requires Node 22, project CI uses Node 20 | Extract `engines` from `package.json` |
| **TypeScript version gap** | Library types use TS 5.4 features, project on TS 4.9 | Compare `typescript` version in `devDependencies` |
| **Conflicting build tools** | Library uses webpack, project uses vite | Check for build-tool-specific configs |
| **Duplicate sub-dependency** | Both A and B depend on C but incompatible versions | `npm ls <shared-dep>` shows duplicates |
| **Python dependency hell** | `pip check` fails due to incompatible transitive deps | Run `pip check` |
| **Go module replace conflict** | `go.mod` has `replace` directives that override needed versions | Extract `replace` in `go.mod` |

---

## Resolution Strategies

| Conflict | Resolution |
|----------|-----------|
| Peer dep missing | Install the peer dependency at the required version |
| Peer dep wrong version | Upgrade/downgrade the peer dep (check all consumers first) |
| Engine too old | Upgrade project's Node/Python/Go version |
| Engine too new (lib requires older) | Use `--legacy-peer-deps` (npm) or find newer version of lib |
| Overlapping transitive dep | Use `resolutions` (yarn), `overrides` (npm), or `dependencyManagement` (Maven) |
| Conflicting frameworks | Pick one framework; remove the other |
| Multiple major versions of shared dep | Use `dedupe` / `why` to trace and resolve |

---

## Gate Checks

Before passing any compatibility check:

- [ ] All peer dependencies for the proposed package are satisfied
- [ ] Engine constraints are met by the project's runtime
- [ ] No shared transitive dependency has incompatible version ranges
- [ ] No known breaking change boundary (major version jump) is crossed without investigation
- [ ] For ecosystem-specific checks: `npm ls` / `pip check` / `go mod tidy` / `cargo check` return clean
