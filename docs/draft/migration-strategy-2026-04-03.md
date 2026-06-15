# HiveMind Clean Architecture Migration Strategy
**Date**: 2026-04-03  
**Status**: Detailed Execution Plan  
**Authority**: Step-by-Step Migration Guide  
**Blueprint**: [`clean-architecture-blueprint-2026-04-03.md`](clean-architecture-blueprint-2026-04-03.md)

## Executive Summary

This document provides a comprehensive, file-level migration strategy to transform the product-detox codebase (~15,000 LOC, 50+ modules) into the clean architecture (~4,300 LOC, 8-10 modules) by consolidating with harness-experiment patterns.

**Migration Timeline**: 4 weeks (20 working days)  
**Target Reduction**: 67% LOC, 80% modules  
**Risk Level**: Medium (with proper rollback procedures)

---

## Table of Contents

1. [Pre-Flight Checklist](#1-pre-flight-checklist)
2. [Phase 1: Port Harness Core (Week 1)](#2-phase-1-port-harness-core-week-1)
3. [Phase 2: Eliminate Bloat (Week 2)](#3-phase-2-eliminate-bloat-week-2)
4. [Phase 3: Simplify Plugin (Week 3)](#4-phase-3-simplify-plugin-week-3)
5. [Phase 4: Enforce Boundaries (Week 4)](#5-phase-4-enforce-boundaries-week-4)
6. [File-Level Operation Matrix](#6-file-level-operation-matrix)
7. [Dependency Resolution Plan](#7-dependency-resolution-plan)
8. [Validation Gates](#8-validation-gates)
9. [Rollback Procedures](#9-rollback-procedures)
10. [Success Metrics](#10-success-metrics)
11. [Automation Scripts](#11-automation-scripts)

---

## 1. Pre-Flight Checklist

### 1.1 Branch Strategy

```bash
# Create migration branch
git checkout -b refactor/clean-architecture
git push -u origin refactor/clean-architecture

# Create rollback tags at each phase
git tag -a phase-0-baseline -m "Pre-migration baseline"
```

### 1.2 Backup Current State

```bash
# Create full backup
tar -czf ../hivemind-pre-migration-$(date +%Y%m%d).tar.gz .

# Document current metrics
npm run build
npx tsc --noEmit
npm test
find src -name "*.ts" | xargs wc -l > metrics-baseline.txt
```

### 1.3 Environment Setup

**Required Tools:**
- Node.js 18+
- TypeScript 5.3+
- Git 2.40+
- OpenCode CLI (latest)

**Dependencies Check:**
```bash
npm install
npm audit fix
npx tsc --version
```

### 1.4 Success Criteria Definition

| Metric | Baseline | Target | Gate |
|--------|----------|--------|------|
| Total LOC | ~15,000 | ~4,300 | <5,000 |
| Module Count | 50+ | 8-10 | <12 |
| Tool Count | 11 | 5 | =5 |
| Plugin LOC | 269 | <100 | <100 |
| Test Coverage | ~60% | >80% | >75% |
| TypeScript Errors | 0 | 0 | 0 |

---

## 2. Phase 1: Port Harness Core (Week 1)

**Goal**: Establish clean foundation with delegation, lifecycle, and continuity modules  
**Duration**: 5 days  
**Risk Level**: Low (additive changes)

### Day 1-2: Module Structure & Delegation

**Operations:**
```bash
# Create new module directories
mkdir -p src/lifecycle src/delegation src/continuity

# Port delegation (already clean)
# Verify src/delegation/ exports
# Move schema to kernel
mv src/delegation/delegation-record.schema.ts src/schema-kernel/
```

**Validation:**
```bash
npx tsc --noEmit
npm test -- src/delegation
```

### Day 3-4: Lifecycle & Continuity

**Extract Session Manager** from `src/features/session-entry/`:
- Create `src/lifecycle/session-manager.ts` (~150 LOC)
- Create `src/lifecycle/session-state.ts` (~100 LOC)
- Create `src/lifecycle/session-events.ts` (~150 LOC)

**Consolidate Stores**:
- Merge `src/core/trajectory/` → `src/continuity/trajectory-store.ts`
- Merge `src/core/workflow-management/` → `src/continuity/workflow-store.ts`
- Create `src/continuity/state-store.ts` (unified interface)

### Day 5: Integration & Validation

**Test Scenarios:**
1. Session initialization flow
2. Trajectory CRUD operations
3. Workflow lifecycle
4. State persistence

**Phase 1 Gate:**
```bash
npm run build && npx tsc --noEmit && npm test
git commit -m "Phase 1: Port harness core"
git tag -a phase-1-checkpoint -m "Harness core ported"
```

---

## 3. Phase 2: Eliminate Bloat (Week 2)

**Goal**: Remove redundant features and consolidate tools  
**Duration**: 5 days  
**Risk Level**: Medium (breaking changes)

### Day 6-7: Consolidate Agent Work Contract

**Current**: 30 files, ~3,000 LOC  
**Target**: 3 files, ~400 LOC

**Files to DELETE:**
- `engine/intent-classifier.*`
- `engine/response-mode-resolver.*`
- `engine/anchor-recorder.*`
- `engine/chain-executor.*`
- `engine/contract-store.archive.*`
- `hooks/agent-work-event-handler.*`
- `hooks/compaction-preservation.*`
- `tools/classify-intent-tool.*`
- `tools/export-contract-tool.*`

**Files to KEEP & CONSOLIDATE:**
- `schema/contract.ts` → Move to `src/schema-kernel/`
- `tools/create-contract-tool.ts` → Merge into `src/tools/delegation/`

### Day 8: Simplify Runtime Entry

**Current**: 20 files, ~2,000 LOC  
**Target**: 5 files, ~400 LOC

**Files to DELETE:**
- `nl-first-dispatch.ts`
- `attachment.*.ts` (5 files)
- `invocation.ts`
- `turn-output.ts`
- `snapshot-loader.ts`
- `instruction-loader.ts`

**Files to MOVE:**
- `init.ts` → `src/cli/init.ts`
- `doctor.ts` → `src/cli/doctor.ts`
- `settings.ts` → `src/cli/settings.ts`

### Day 9: Delete Doc Intelligence & Consolidate Tools

**Delete Entire Feature:**
```bash
rm -rf src/features/doc-intelligence/
```

**Tool Consolidation (11 → 5):**
1. Keep: `hivemind_runtime_status`
2. Keep: `hivemind_runtime_command`
3. **NEW**: `hivemind_delegation` (merges 3 tools)
4. Keep: `hivemind_trajectory`
5. Keep: `hivemind_task`

**Delete Tools:**
- `declare_intent`
- `map_context`
- `compact_session`

### Day 10: Phase 2 Validation

**Metrics Check:**
- LOC reduced by ~50%
- Module count reduced to ~25
- Tool count = 5
- All tests pass

**Phase 2 Gate:**
```bash
npm run build && npm test
find src -name "*.ts" | xargs wc -l > metrics-phase-2.txt
git commit -m "Phase 2: Eliminate bloat"
git tag -a phase-2-checkpoint -m "Bloat eliminated"
```

---

## 4. Phase 3: Simplify Plugin (Week 3)

**Goal**: Reduce plugin to <100 LOC (assembly only)  
**Duration**: 5 days  
**Risk Level**: Medium

### Day 11-12: Extract Inline Logic

**Extract Hooks** from `src/plugin/opencode-plugin.ts`:
1. `src/hooks/chat-message-hook.ts` (~30 LOC)
2. `src/hooks/permission-hook.ts` (~40 LOC)
3. `src/hooks/tool-hooks.ts` (~40 LOC)
4. `src/hooks/shell-env-hook.ts` (~30 LOC)
5. `src/hooks/command-hook.ts` (~60 LOC)
6. `src/hooks/messages-transform-hook.ts` (~100 LOC)
7. `src/hooks/compaction-hook.ts` (~40 LOC)

### Day 13: Create Factories

**Create Support Files:**
1. `src/plugin/tool-registry.ts` (~50 LOC) - Tool registration
2. `src/plugin/hook-handlers.ts` (~100 LOC) - Hook handler factory

**Simplified Plugin:**
```typescript
// src/plugin/opencode-plugin.ts (~90 LOC)
export const HiveMindPlugin: Plugin = async (input) => {
  const directory = input.directory
  initSdkContext(input)
  
  const tools = createToolRegistry(directory)
  const hooks = createHookHandlers(directory, ...)
  
  return {
    event: createEventHandler(directory),
    tool: tools,
    ...hooks
  }
}
```

### Day 14-15: Testing & Validation

**Unit Tests** for all extracted hooks  
**Integration Tests** for plugin assembly

**Phase 3 Gate:**
```bash
wc -l src/plugin/opencode-plugin.ts  # Must be <100
npm run build && npm test
git commit -m "Phase 3: Simplify plugin"
git tag -a phase-3-checkpoint -m "Plugin simplified"
```

---

## 5. Phase 4: Enforce Boundaries (Week 4)

**Goal**: Complete migration, enforce rules, publish  
**Duration**: 5 days  
**Risk Level**: Low

### Day 16: Boundary Scripts

**Create Validation Scripts:**
1. `scripts/check-module-size.ts` - Max 500 LOC per module
2. `scripts/check-plugin-size.ts` - Max 100 LOC for plugin
3. `scripts/check-circular-deps.ts` - No circular dependencies
4. `scripts/check-tool-count.ts` - Exactly 5 tools

**Add to package.json:**
```json
{
  "scripts": {
    "lint:boundary": "npm run check:module-size && npm run check:plugin-size && npm run check:circular-deps && npm run check:tool-count"
  }
}
```

### Day 17: Archive Old Features

```bash
mkdir -p src/archive/features
mv src/features/agent-work-contract src/archive/features/
mv src/features/runtime-entry src/archive/features/
mv src/features/session-entry src/archive/features/
mv src/features/doc-intelligence src/archive/features/
```

### Day 18-19: Documentation Updates

**Update Files:**
- `README.md` - Architecture section
- `AGENTS.md` - Module structure
- `docs/guide/` - All guides
- `src/*/AGENTS.md` - Sector docs

### Day 20: Final Validation & Release

**Final Checks:**
```bash
npm run build
npx tsc --noEmit
npm test
npm run lint:boundary
find src -name "*.ts" | xargs wc -l > metrics-final.txt
```

**Release:**
```bash
npm version major  # v3.0.0
git push --tags
npm publish
```

---

## 6. File-Level Operation Matrix

See separate document: [`file-operation-matrix.md`](file-operation-matrix.md)

---

## 7. Dependency Resolution Plan

### High-Risk Dependencies

**1. Plugin → Features**
- **Risk**: Plugin imports from features that will be deleted
- **Resolution**: Extract to hooks before deleting features
- **Validation**: `grep -r "from.*features" src/plugin/`

**2. Tools → Features**
- **Risk**: Tools depend on deleted features
- **Resolution**: Consolidate tools first, then delete features
- **Validation**: `grep -r "from.*features" src/tools/`

**3. Hooks → Session Entry**
- **Risk**: Hooks depend on session-entry
- **Resolution**: Port lifecycle first, update hooks, then delete
- **Validation**: `grep -r "from.*session-entry" src/hooks/`

### Dependency Resolution Order

1. **Phase 1**: Create new modules (additive, no breaks)
2. **Phase 2**: Update imports to new modules
3. **Phase 3**: Extract plugin logic
4. **Phase 4**: Delete old features

---

## 8. Validation Gates

### Per-Phase Gates

**Phase 1:**
- [ ] TypeScript compiles
- [ ] All tests pass
- [ ] No circular dependencies
- [ ] All modules <500 LOC

**Phase 2:**
- [ ] LOC reduced 50%
- [ ] Tool count = 5
- [ ] All tests pass
- [ ] No broken imports

**Phase 3:**
- [ ] Plugin <100 LOC
- [ ] All hooks extracted
- [ ] All tests pass
- [ ] No business logic in plugin

**Phase 4:**
- [ ] All boundary scripts pass
- [ ] Documentation updated
- [ ] Final LOC ~4,300
- [ ] Ready for release

### Automated Validation

```bash
# Run before each commit
npm run validate

# validate script in package.json
{
  "scripts": {
    "validate": "npm run build && npx tsc --noEmit && npm test && npm run lint:boundary"
  }
}
```

---

## 9. Rollback Procedures

### Per-Phase Rollback

**If Phase 1 Fails:**
```bash
git reset --hard phase-0-baseline
git clean -fd
npm install
```

**If Phase 2 Fails:**
```bash
git reset --hard phase-1-checkpoint
git clean -fd
npm install
```

**If Phase 3 Fails:**
```bash
git reset --hard phase-2-checkpoint
git clean -fd
npm install
```

**If Phase 4 Fails:**
```bash
git reset --hard phase-3-checkpoint
git clean -fd
npm install
```

### Rollback Triggers

**Abort Migration If:**
- TypeScript errors cannot be resolved within 2 hours
- Test coverage drops below 60%
- Critical functionality breaks
- Circular dependencies cannot be resolved
- Module size violations cannot be fixed

---

## 10. Success Metrics

### Final Metrics

| Metric | Baseline | Target | Actual | Status |
|--------|----------|--------|--------|--------|
| Total LOC | 15,000 | 4,300 | TBD | ⏳ |
| Module Count | 50+ | 8-10 | TBD | ⏳ |
| Tool Count | 11 | 5 | TBD | ⏳ |
| Plugin LOC | 269 | <100 | TBD | ⏳ |
| Test Coverage | 60% | >80% | TBD | ⏳ |
| Build Time | Baseline | -30% | TBD | ⏳ |

### Progress Tracking

```bash
# After each phase
find src -name "*.ts" | xargs wc -l > metrics-phase-N.txt
diff metrics-baseline.txt metrics-phase-N.txt
```

---

## 11. Automation Scripts

### Migration Helper Scripts

**1. Find Feature Dependencies:**
```bash
#!/bin/bash
# scripts/find-feature-deps.sh
feature=$1
echo "Finding dependencies for: $feature"
grep -r "from.*$feature" src/ --include="*.ts"
```

**2. Update Imports:**
```bash
#!/bin/bash
# scripts/update-imports.sh
old_path=$1
new_path=$2
find src -name "*.ts" -exec sed -i '' "s|$old_path|$new_path|g" {} +
```

**3. Validate Phase:**
```bash
#!/bin/bash
# scripts/validate-phase.sh
phase=$1
echo "Validating Phase $phase..."
npm run build && npx tsc --noEmit && npm test && npm run lint:boundary
if [ $? -eq 0 ]; then
  echo "✅ Phase $phase validation passed"
  git tag -a "phase-$phase-checkpoint" -m "Phase $phase complete"
else
  echo "❌ Phase $phase validation failed"
  exit 1
fi
```

---

## Appendix A: Daily Checklist Template

```markdown
### Day N: [Task Name]

**Morning:**
- [ ] Review previous day's work
- [ ] Run validation: `npm run validate`
- [ ] [Specific task 1]
- [ ] [Specific task 2]

**Afternoon:**
- [ ] [Specific task 3]
- [ ] [Specific task 4]
- [ ] Write tests
- [ ] Run validation: `npm run validate`

**End of Day:**
- [ ] Commit changes
- [ ] Update progress doc
- [ ] Plan next day
```

---

## Appendix B: Communication Template

```markdown
### Phase N Progress Report

**Date**: YYYY-MM-DD  
**Phase**: N - [Phase Name]  
**Status**: [On Track / At Risk / Blocked]

**Completed:**
- [Task 1]
- [Task 2]

**In Progress:**
- [Task 3]

**Blocked:**
- [Issue 1] - [Resolution plan]

**Metrics:**
- LOC: [Current] / [Target]
- Modules: [Current] / [Target]
- Tests: [Pass/Total] ([Coverage]%)

**Next Steps:**
- [Next task 1]
- [Next task 2]

**Risks:**
- [Risk 1] - [Mitigation]
```

---

**Status**: ✅ Migration Strategy Complete  
**Owner**: Architecture Team  
**Next Action**: Begin Phase 1 execution