# Verification Gate Types

> From PLAN.md §9. Every execution phase must declare and run its gate set before completion claims.

## The Five Gates

### 1. Runtime Authority Gate

**Question:** Is the selected owner the ONLY active authority for this slice?

| Evidence | Strategy |
|----------|----------|
| No competing hooks/handlers | `grep` for registration patterns in scope |
| No parallel control plane | Verify `.opencode/` doesn't still own the path |
| Single source of truth | Check no mirror overrides master |

### 2. Donor Gate

**Question:** Does accepted `.opencode` logic work WITHOUT `.opencode` runtime dependency?

| Evidence | Strategy |
|----------|----------|
| No import from `.opencode/` | `grep` for import paths |
| No runtime fallback to `.opencode/` | Trace code paths |
| Standalone test pass | Run tests with `.opencode/` absent |

### 3. Drift Gate

**Question:** Do `src` and `dist` agree on shipped behavior for this slice?

| Evidence | Strategy |
|----------|----------|
| Build succeeds | `npm run build` exits 0 |
| Semantic match | Diff `src` behavior vs `dist` output |
| No stale dist artifacts | Build timestamp matches |

### 4. State Gate

**Question:** Are `.hivemind` stores correctly classified (active vs compat vs stale)?

| Evidence | Strategy |
|----------|----------|
| Active stores respond | Load and validate schema |
| Compat stores have migration path | Check migration utilities |
| Stale stores are unreferenced | `grep` for stale path usage = 0 |

### 5. Regression Gate

**Question:** Do existing boundary tests still hold?

| Evidence | Strategy |
|----------|----------|
| Full test suite passes | `npm test` — capture FULL output |
| Changed tests are intentional | Diff test files, justify each change |
| No skipped tests | `grep` for `.skip`, `.todo` |

## Gate Verdict Rules

- **ALL gates pass** → Phase closed
- **ANY gate fails** → Phase blocked. Record which gate, which evidence failed
- **Gate cannot run** → Phase cannot be closed as complete
- **Gate pending** → Next cycle may be prepared but not authorized
