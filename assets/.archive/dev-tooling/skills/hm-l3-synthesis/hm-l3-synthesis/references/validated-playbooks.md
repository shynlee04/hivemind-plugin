# Validated Playbook Generation
Generate runnable artifacts from code analysis that agents can execute directly.

---

## Playbook Anatomy

Every playbook has four parts:

| Section | Purpose | Required |
|---------|---------|----------|
| Frontmatter | Metadata for routing and triggering | Yes |
| Prerequisites | Environment state before execution | Yes |
| Steps | Ordered actions with validation gates | Yes |
| Rollback | Recovery procedure on failure | No |

### Frontmatter Schema

```yaml
---
name: playbook-name
trigger: "when to invoke this playbook"
complexity: low | medium | high
tools: [Read, Write, Bash, Glob, Grep]
depends_on: [optional-list-of-other-playbooks]
validation: static | dynamic | full
---
```

### Step Template

Each step has a mandatory validation gate:

```
## Step N: [Action Title]

[Description of what to do]

**Execute:**
```bash
[command or action]
```

**Validate:**
```bash
[verification command]
```

**Gate:** [condition that must be true to proceed]
```

---

## Playbook Types

### Investigation Playbook

Find and analyze. No mutations. Read-only.

```yaml
---
name: investigate-dependency-conflicts
trigger: "dependency conflict detected or version mismatch reported"
complexity: medium
tools: [Read, Bash, Glob, Grep]
validation: static
---
```

**Structure:**
1. Scope the investigation (grep imports, list versions)
2. Map dependency graph
3. Identify conflicts
4. Generate findings report
5. Gate: all conflicts catalogued with evidence

**When to use:** Bug investigation, audit, dependency review, security scan.

### Integration Playbook

Connect and validate. Mutations allowed. Requires rollback.

```yaml
---
name: integrate-new-provider
trigger: "adding a new LLM provider or external service integration"
complexity: high
tools: [Read, Write, Edit, Bash, Glob, Grep]
validation: full
---
```

**Structure:**
1. Verify prerequisites (types exist, interfaces defined)
2. Implement adapter
3. Write integration test
4. Run type-check
5. Run test suite
6. Gate: all tests pass, typecheck clean, no regressions

**When to use:** Feature integration, API connection, provider addition, plugin wiring.

### Migration Playbook

Move and verify. Destructive. Rollback mandatory.

```yaml
---
name: migrate-state-format
trigger: "state file format change or schema upgrade required"
complexity: high
tools: [Read, Write, Edit, Bash, Glob, Grep]
validation: full
---
```

**Structure:**
1. Backup current state
2. Transform data
3. Validate transformed output
4. Smoke test with real workload
5. Gate: backup exists, transform verified, smoke test passes
6. Rollback: restore from backup, verify restoration

**When to use:** Data migration, schema changes, file format upgrades, directory restructuring.

---

## Validation Protocol

### Static Checks (fast, no execution)
- Frontmatter parseable
- All steps have validation gates
- Dependencies referenced exist
- Tool permissions match operations
- No circular step dependencies

Run:
```bash
# Check frontmatter
head -20 playbook.md | grep -E '^(name|trigger|complexity|tools):'

# Check gates
grep -c '^\*\*Gate:\*\*' playbook.md
grep -c '^## Step' playbook.md
# Gate count should match step count
```

### Dynamic Checks (medium, dry run)
- Each step's validate command exits 0
- No file mutations outside declared paths
- Tool calls reference allowed tools only

Run:
```bash
# Extract and run all validate commands
grep -A1 '^\*\*Validate:\*\*' playbook.md | grep '```' -A1 | bash -n
```

### Smoke Test (slow, real execution)
- Execute full playbook in isolated environment
- Verify end state matches expected output
- No side effects outside declared scope

---

## Decision Table

| Situation | Playbook Type | Validation Level | Rollback |
|-----------|--------------|-----------------|----------|
| Bug investigation | Investigation | Static | No |
| Security audit | Investigation | Static | No |
| Dependency review | Investigation | Static | No |
| Add provider | Integration | Full | Optional |
| Wire plugin | Integration | Full | Optional |
| Add CLI command | Integration | Dynamic | Optional |
| Schema upgrade | Migration | Full | Mandatory |
| Directory restructure | Migration | Full | Mandatory |
| Data format change | Migration | Full | Mandatory |
| Config migration | Migration | Full | Mandatory |

---

## Generation Checklist

Before delivering a playbook:

- [ ] Frontmatter complete with all required fields
- [ ] Every step has Execute + Validate + Gate
- [ ] Validation commands are copy-pasteable
- [ ] Rollback procedure exists for mutation playbooks
- [ ] Tool list matches actual operations
- [ ] No hardcoded paths (use variables or relative paths)
- [ ] Complexity rating matches step count (low: 1-3, medium: 4-7, high: 8+)
