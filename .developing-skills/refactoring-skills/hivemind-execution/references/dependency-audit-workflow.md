# Dependency Audit Workflow

Step-by-step procedure for auditing project dependencies for staleness, security, and correctness.

## Table of Contents

- [When to Run](#when-to-run)
- [Step 1: Inventory](#step-1-inventory)
- [Step 2: Staleness Check](#step-2-staleness-check)
- [Step 3: Security Audit](#step-3-security-audit)
- [Step 4: Unused Dependencies](#step-4-unused-dependencies)
- [Step 5: Version Pinning Policy](#step-5-version-pinning-policy)
- [Step 6: Update Strategy](#step-6-update-strategy)
- [Decision Table](#decision-table)
- [HiveMind-Specific Guidance](#hivemind-specific-guidance)

---

## When to Run

Run a dependency audit when:

1. Starting work on a new feature branch
2. Receiving a security advisory notification
3. Before a major release
4. Quarterly as a maintenance task
5. When `npm install` produces warnings about peer dependencies

---

## Step 1: Inventory

Catalog all dependencies and their purposes.

```bash
# List all dependencies
cat package.json | jq '.dependencies, .devDependencies'

# List with versions
npm ls --depth=0

# Generate dependency tree
npm ls --all
```

Record:

| Dependency | Version | Purpose | Type |
|-----------|---------|---------|------|
| `zod` | ^3.22.0 | Schema validation | runtime |
| `typescript` | ^5.3.0 | Type checking | dev |
| `@opencode-ai/plugin` | ^1.0.0 | OpenCode SDK | runtime |

---

## Step 2: Staleness Check

Identify dependencies more than 2 major versions behind.

```bash
# Check for outdated packages
npm outdated

# Check specific package
npm view zod versions --json | jq '.[-5:]'
```

**Staleness thresholds:**

| Status | Action |
|--------|--------|
| Current (latest) | No action needed |
| 1 major behind | Plan update in next sprint |
| 2+ major behind | Update soon — accumulating risk |
| Deprecated | Replace or remove immediately |

---

## Step 3: Security Audit

Check for known vulnerabilities.

```bash
# Run npm audit
npm audit

# JSON output for automation
npm audit --json

# Fix automatically (patch-level only)
npm audit fix

# Fix with major version bumps (careful)
npm audit fix --force
```

**Severity response:**

| Severity | Response Time | Action |
|----------|-------------|--------|
| Critical | Immediate | Fix now, block deployment |
| High | Within 48 hours | Fix in current sprint |
| Medium | Within 2 weeks | Schedule fix |
| Low | Next maintenance window | Batch with other updates |
| Informational | Track only | Document in dependency log |

---

## Step 4: Unused Dependencies

Find dependencies that are declared but never imported.

```bash
# Install depcheck if not available
npx depcheck

# Or use knip
npx knip
```

**Action for unused dependencies:**

1. Verify the dependency is truly unused (check dynamic imports, config files, scripts).
2. If confirmed unused, remove from `package.json`.
3. Run `npm test` and `npm run build` to verify no hidden dependencies.
4. Commit the removal as a `chore(deps): remove unused dependency X`.

---

## Step 5: Version Pinning Policy

| Strategy | Example | When to Use |
|----------|---------|-------------|
| Exact pin | `"zod": "3.22.4"` | Production-critical deps, reproducibility required |
| Caret range | `"zod": "^3.22.0"` | Standard for most deps — allows minor + patch |
| Tilde range | `"zod": "~3.22.0"` | Conservative — allows patch only |
| Wildcard | `"zod": "*"` | **Never** — too risky |

### HiveMind Policy

- **Runtime dependencies:** Caret ranges (`^x.y.z`) for well-maintained packages.
- **Dev dependencies:** Caret ranges acceptable — dev tools are lower risk.
- **SDK dependencies:** Exact pins or tilde — breaking SDK changes break the plugin.
- **Lock file:** Always commit `package-lock.json` for reproducible builds.

---

## Step 6: Update Strategy

Update in order of risk. Each category gets a separate PR.

### Update Order

1. **Patch updates** (`3.22.0` → `3.22.1`) — lowest risk, batch together
   ```bash
   npm update
   npm test && npm run build
   # PR: chore(deps): patch updates for {date}
   ```

2. **Minor updates** (`3.22.0` → `3.23.0`) — medium risk, test carefully
   ```bash
   npm install package@latest
   npm test && npm run build && npm run lint
   # PR: chore(deps): minor update {package} to 3.23.0
   ```

3. **Major updates** (`3.x` → `4.x`) — high risk, dedicated branch
   ```bash
   # Create feature branch
   git checkout -b deps/major-update-{package}
   npm install package@latest
   # Fix breaking changes
   npm test && npm run build && npm run lint
   # PR: chore(deps): major update {package} to 4.0.0
   # Include migration notes in PR description
   ```

### Rollback

If an update breaks tests or build:
1. Revert the commit (`git revert HEAD`).
2. Document the breaking change in the dependency log.
3. Schedule a dedicated fix branch for the update.

---

## Decision Table

| Condition | Action | Priority |
|-----------|--------|----------|
| Critical vulnerability | Update immediately | P0 |
| High vulnerability | Update this sprint | P1 |
| 2+ major versions behind | Plan update | P2 |
| Unused dependency | Remove | P2 |
| Deprecated package | Find replacement | P1 |
| Peer dependency warning | Investigate and resolve | P3 |
| Patch update available | Batch with next maintenance | P4 |

---

## HiveMind-Specific Guidance

### SDK Dependencies

The OpenCode SDK (`@opencode-ai/plugin`, `@opencode-ai/sdk`) is the most critical dependency. Breaking SDK changes break the entire plugin.

- Pin SDK versions exactly or use tilde ranges.
- Before updating the SDK, read the changelog and migration guide.
- Test SDK updates in a dedicated branch with full test suite.

### tool.schema Dependency

`tool.schema` is a Zod re-export from the SDK. Do not install Zod separately — use `tool.schema` exclusively. If `tool.schema` changes, all tool arg definitions must be updated.

### Audit Frequency

| Dependency Type | Audit Frequency |
|----------------|----------------|
| OpenCode SDK | Before each feature branch |
| Runtime deps | Monthly |
| Dev deps | Quarterly |
| All deps | Before major releases |
