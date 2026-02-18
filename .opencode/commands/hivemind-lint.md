---
name: "hivemind-lint"
description: "Run comprehensive linting, type checking, and quality validation. Use proactively after code changes and before commits."
---

# HiveMind Lint & Quality Gate

**Validates code quality, type safety, and project health.**

## Quick Run

```bash
npm run lint
```

## Full Validation Sequence

### 1. Type Safety Check
```bash
npx tsc --noEmit
```
**Enforcement:** Must pass (0 errors)

### 2. Test Suite
```bash
npm test
```
**Enforcement:** Must pass (or document failures)

### 3. Ecosystem Check
```bash
node bin/hivemind-tools.cjs ecosystem-check
```
**Validates:**
- .hivemind/ structure integrity
- State file consistency
- Anchor validity
- Memory accessibility

### 4. Source Audit
```bash
node bin/hivemind-tools.cjs source-audit
```
**Validates:**
- All source files accounted for
- No orphaned files
- Import integrity

### 5. Chain Validation
```bash
node bin/hivemind-tools.cjs validate chain
```
**Validates:**
- Hierarchy consistency
- Timestamp alignment
- No breaks detected

## Quality Thresholds

| Metric | Yellow | Red | Action |
|--------|--------|-----|--------|
| Type errors | 1-3 | > 3 | Fix immediately |
| Test failures | 1-2 | > 2 | Fix or skip with note |
| Files changed | 5-10 | > 10 | Commit now |
| Lines changed | 200-400 | > 400 | Split commits |

## Auto-Fix Mode

```bash
# Fix auto-fixable issues
npm run lint:fix 2>/dev/null || npx eslint --fix src/
```

## Integration

**Use with pre-stop:**
```bash
/hivemind-lint && /hivemind-pre-stop
```

**Use after build agent:**
```bash
# After Task(build) returns
/hivemind-lint
# Verify before accepting completion
```

## Skill Loading

```typescript
skill({ name: "verification-before-completion" })
```
