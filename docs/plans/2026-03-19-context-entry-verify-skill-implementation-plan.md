# Context-Entry-Verify Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a deterministic verification skill (`context-entry-verify`) that provides hard proof of project reality via JSON-gated commands.

**Architecture:** Standalone skill with single `hm-verify.cjs` script (zero deps, CommonJS). Complements `context-intelligence-entry` (session/rot health) by focusing on project/build/truth verification. Auto-runs before work execution.

**Tech Stack:** Node.js (no npm deps), CommonJS, JSON output, execSync for git/fs commands

---

## Design Decisions

| Aspect | Decision |
|--------|----------|
| Auto-run trigger | Before work execution (not session start) |
| Gate chain behavior | Fail-fast, with delegation reporting to user on failure |
| Architecture gates | Soft (warnings only, not blockers) |

---

## Task 1: Create Skill Directory Structure

**Files:**
- Create: `skills/context-entry-verify/SKILL.md`
- Create: `skills/context-entry-verify/scripts/hm-verify.cjs`
- Create: `skills/context-entry-verify/references/gate-definitions.md`
- Create: `skills/context-entry-verify/references/gate-chain-order.md`
- Create: `skills/context-entry-verify/references/.gitkeep`

**Step 1: Create directory structure**

```bash
mkdir -p skills/context-entry-verify/{scripts,references}
touch skills/context-entry-verify/references/.gitkeep
```

**Step 2: Create SKILL.md**

```yaml
---
name: context-entry-verify
description: Deterministic verification skill. Use when starting work, before execution, at gate checkpoints, or when verifying completion claims. Runs hard-proof JSON gates against real project state.
triggers:
  - starting work
  - before execution
  - gate checkpoints
  - verifying completion claims
auto_run: before-work-execution
---
```

---

## Task 2: Implement hm-verify.cjs - Core Script

**Files:**
- Create: `skills/context-entry-verify/scripts/hm-verify.cjs`

**Step 1: Write the script header and CLI routing**

```javascript
#!/usr/bin/env node
/**
 * HM Verify - Deterministic Project Verification
 * 
 * Provides hard proof gates via JSON output. Zero dependencies.
 * Usage: node hm-verify.cjs <command> [--raw]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function output(result, raw) {
  if (raw) {
    console.log(JSON.stringify(result));
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}
```

**Step 2: Implement Layer 1 - Project Reality Gates**

```javascript
// project contracts — reads package.json, checks required fields
function cmdProjectContracts(cwd, raw) {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    return output({ passed: false, error: 'package.json not found' }, raw);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const checks = {
    has_name: !!pkg.name,
    has_version: !!pkg.version,
    has_main: !!pkg.main,
    has_types: !!pkg.types,
    has_exports: !!pkg.exports || !!pkg.main,
    has_engines: !!pkg.engines,
    dependencies_count: Object.keys(pkg.dependencies || {}).length,
    devDependencies_count: Object.keys(pkg.devDependencies || {}).length,
  };
  const passed = checks.has_name && checks.has_version && checks.has_main;
  return output({ passed, checks, pkg_name: pkg.name, pkg_version: pkg.version }, raw);
}

// project dependencies — runs npm ls --json, parses real output
function cmdProjectDependencies(cwd, raw) {
  try {
    const result = execSync('npm ls --json --depth=0 2>&1', { cwd, encoding: 'utf-8' });
    const parsed = JSON.parse(result);
    const problems = parsed.problems || [];
    const missing = problems.filter(p => p.startsWith('missing:'));
    const invalid = problems.filter(p => p.startsWith('invalid:'));
    return output({
      passed: missing.length === 0 && invalid.length === 0,
      missing,
      invalid,
      total_deps: Object.keys(parsed.dependencies || {}).length,
    }, raw);
  } catch (e) {
    return output({ passed: false, error: e.message }, raw);
  }
}

// project sdk-surface — checks the actual SDK is importable
function cmdProjectSdkSurface(cwd, raw) {
  const checks = [];
  for (const pkg of ['@opencode-ai/sdk', '@opencode-ai/plugin']) {
    try {
      const resolved = require.resolve(pkg, { paths: [cwd] });
      checks.push({ package: pkg, installed: true, path: resolved });
    } catch {
      checks.push({ package: pkg, installed: false, path: null });
    }
  }
  return output({ passed: checks.every(c => c.installed), checks }, raw);
}

// project build — run tsc --noEmit
function cmdProjectBuild(cwd, raw) {
  try {
    execSync('npx tsc --noEmit', { cwd, encoding: 'utf-8', stdio: 'pipe' });
    return output({ passed: true, errors: 0 }, raw);
  } catch (e) {
    const output = e.stdout + e.stderr;
    const errorMatch = output.match(/(\d+) errors?/);
    const errors = errorMatch ? parseInt(errorMatch[1], 10) : 1;
    return output({ passed: false, errors, output: output.slice(0, 500) }, raw);
  }
}

// project tests — run npm test
function cmdProjectTests(cwd, raw) {
  try {
    execSync('npm test', { cwd, encoding: 'utf-8', stdio: 'pipe' });
    return output({ passed: true, failures: 0 }, raw);
  } catch (e) {
    const output = e.stdout + e.stderr;
    const failMatch = output.match(/(\d+) (failures?|tests? failed)/);
    const failures = failMatch ? parseInt(failMatch[1], 10) : 1;
    return output({ passed: false, failures, output: output.slice(-500) }, raw);
  }
}
```

**Step 3: Implement Layer 2 - Planning Integrity Gates**

```javascript
// planning exists — check .planning/ exists
function cmdPlanningExists(cwd, raw) {
  const planningDir = path.join(cwd, '.planning');
  const exists = fs.existsSync(planningDir);
  return output({ passed: exists, path: planningDir }, raw);
}

// planning health — check required planning files
function cmdPlanningHealth(cwd, raw) {
  const required = ['STATE.md', 'ROADMAP.md', 'REQUIREMENTS.md'];
  const results = required.map(file => {
    const exists = fs.existsSync(path.join(cwd, '.planning', file));
    return { file, exists };
  });
  const allExist = results.every(r => r.exists);
  return output({ passed: allExist, checks: results }, raw);
}

// planning consistency — check roadmap phases match disk directories
function cmdPlanningConsistency(cwd, raw) {
  try {
    const roadmapPath = path.join(cwd, '.planning', 'ROADMAP.md');
    if (!fs.existsSync(roadmapPath)) {
      return output({ passed: false, error: 'ROADMAP.md not found' }, raw);
    }
    // Parse phase numbers from ROADMAP.md
    const content = fs.readFileSync(roadmapPath, 'utf-8');
    const phaseMatches = content.match(/## (\d+\.\d+)/g) || [];
    const phases = phaseMatches.map(m => m.replace('## ', ''));
    
    // Check each phase directory exists
    const missing = [];
    for (const phase of phases) {
      const dir = path.join(cwd, '.planning', 'phases', phase);
      if (!fs.existsSync(dir)) {
        missing.push(phase);
      }
    }
    return output({ passed: missing.length === 0, phases_found: phases.length, missing }, raw);
  } catch (e) {
    return output({ passed: false, error: e.message }, raw);
  }
}
```

**Step 4: Implement Layer 3 - Git Evidence Gates**

```javascript
// git branch-state — report working tree status
function cmdGitBranchState(cwd, raw) {
  try {
    const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' }).trim();
    const clean = status.length === 0;
    const files = status.split('\n').filter(Boolean);
    return output({ passed: clean, clean, uncommitted_files: files.length, files }, raw);
  } catch (e) {
    return output({ passed: false, error: 'Not a git repo' }, raw);
  }
}

// git last-commit — return last commit info
function cmdGitLastCommit(cwd, raw) {
  try {
    const hash = execSync('git rev-parse HEAD', { cwd, encoding: 'utf-8' }).trim().slice(0, 8);
    const message = execSync('git log -1 --format=%s', { cwd, encoding: 'utf-8' }).trim();
    const author = execSync('git log -1 --format=%an', { cwd, encoding: 'utf-8' }).trim();
    const date = execSync('git log -1 --format=%ci', { cwd, encoding: 'utf-8' }).trim();
    const filesChanged = execSync('git diff --stat --cached', { cwd, encoding: 'utf-8' }).trim();
    return output({ hash, message, author, date, filesChanged }, raw);
  } catch (e) {
    return output({ passed: false, error: e.message }, raw);
  }
}

// git diff-stat — return diff stat
function cmdGitDiffStat(cwd, ref, raw) {
  try {
    const target = ref || 'HEAD~1';
    const stat = execSync(`git diff --stat ${target}`, { cwd, encoding: 'utf-8' }).trim();
    return output({ passed: true, ref: target, stat }, raw);
  } catch (e) {
    return output({ passed: false, error: e.message }, raw);
  }
}
```

**Step 5: Implement Layer 4 - Architecture Gates (Soft/Warning only)**

```javascript
// arch src-domains — scan src/ top-level dirs
function cmdArchSrcDomains(cwd, raw) {
  const srcDir = path.join(cwd, 'src');
  if (!fs.existsSync(srcDir)) {
    return output({ passed: true, domains: [], note: 'No src/ directory' }, raw);
  }
  
  const domains = [];
  try {
    const dirs = fs.readdirSync(srcDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules');
    
    for (const dir of dirs) {
      const domainPath = path.join(srcDir, dir.name);
      try {
        const files = execSync(`find "${domainPath}" -name "*.ts" -not -name "*.test.ts" | wc -l`, { encoding: 'utf-8' }).trim();
        const loc = execSync(`find "${domainPath}" -name "*.ts" -not -name "*.test.ts" -exec cat {} + | wc -l`, { encoding: 'utf-8' }).trim();
        const exports = execSync(`grep -r "^export " "${domainPath}" --include="*.ts" 2>/dev/null | wc -l`, { encoding: 'utf-8' }).trim();
        domains.push({ domain: dir.name, files: parseInt(files), loc: parseInt(loc), exports: parseInt(exports) });
      } catch (e) {}
    }
  } catch (e) {
    return output({ passed: false, error: e.message }, raw);
  }
  
  return output({ domains, total_domains: domains.length }, raw);
}

// arch dead-exports — find exported symbols with zero consumers
function cmdArchDeadExports(cwd, raw) {
  // This is a soft warning - always passes but reports findings
  const findings = [];
  try {
    // Find all exports in src/
    const exportCmd = `grep -rh "^export " src --include="*.ts" 2>/dev/null | grep -v "^export type" | sed 's/export \\{1,\\}//' | cut -d' ' -f1 | sort -u`;
    const exports = execSync(exportCmd, { cwd, encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
    
    for (const symbol of exports.slice(0, 50)) {
      // Check if symbol is used elsewhere (rough check via grep)
      try {
        const uses = execSync(`grep -r "${symbol}" src --include="*.ts" 2>/dev/null | wc -l`, { encoding: 'utf-8' }).trim();
        if (parseInt(uses, 10) <= 1) {
          findings.push({ symbol, consumers: parseInt(uses, 10) });
        }
      } catch (e) {}
    }
  } catch (e) {}
  
  // Soft gate - always passes, reports warnings
  return output({ passed: true, warning: findings.length > 0 ? 'dead exports found' : null, dead_exports: findings.slice(0, 10), total_checked: findings.length }, raw);
}

// arch circular-deps — detect circular import chains
function cmdArchCircularDeps(cwd, raw) {
  // Soft warning - always passes
  const circles = [];
  // Simplified check - look for "requires" pattern
  try {
    const imports = {};
    const tsFiles = execSync(`find src -name "*.ts" -not -name "*.test.ts" 2>/dev/null`, { cwd, encoding: 'utf-8' }).trim().split('\n').filter(Boolean);
    
    for (const file of tsFiles.slice(0, 100)) {
      const content = fs.readFileSync(path.join(cwd, file), 'utf-8');
      const matches = content.match(/from ['"]([^'"]+)['"]/g) || [];
      const deps = matches.map(m => m.match(/from ['"]([^'"]+)['"]/)[1]).filter(d => d.startsWith('.'));
      imports[file] = deps;
    }
    
    // Simple circular check
    for (const [file, deps] of Object.entries(imports)) {
      for (const dep of deps) {
        const resolved = path.resolve(path.dirname(file), dep);
        if (imports[resolved] && imports[resolved].includes(file)) {
          circles.push({ from: file, to: resolved });
        }
      }
    }
  } catch (e) {}
  
  return output({ passed: true, warning: circles.length > 0 ? 'circular deps found' : null, circular_deps: circles.slice(0, 5), count: circles.length }, raw);
}
```

**Step 6: Implement Gate Chain (Fail-Fast with Delegation)**

```javascript
// gate-chain — sequential fail-fast with delegation reporting
function cmdGateChain(cwd, raw) {
  const gates = [
    { id: 'project-contracts', fn: () => cmdProjectContracts(cwd, true) },
    { id: 'project-dependencies', fn: () => cmdProjectDependencies(cwd, true) },
    { id: 'project-sdk-surface', fn: () => cmdProjectSdkSurface(cwd, true) },
    { id: 'project-build', fn: () => cmdProjectBuild(cwd, true) },
    { id: 'planning-exists', fn: () => cmdPlanningExists(cwd, true) },
    { id: 'planning-health', fn: () => cmdPlanningHealth(cwd, true) },
    { id: 'planning-consistency', fn: () => cmdPlanningConsistency(cwd, true) },
    { id: 'git-branch-state', fn: () => cmdGitBranchState(cwd, true) },
  ];
  
  const results = [];
  for (const gate of gates) {
    const result = JSON.parse(gate.fn());
    results.push({ gate: gate.id, ...result });
    if (!result.passed) {
      // Fail-fast but trigger delegation report
      return output({
        passed: false,
        blocked_at: gate.id,
        gates_passed: results.length - 1,
        gates_total: gates.length,
        results,
        delegation_trigger: {
          action: 'REPORT_TO_USER',
          reason: `Gate "${gate.id}" failed`,
          evidence: result
        }
      }, raw);
    }
  }
  
  // Run architecture gates (soft)
  const archResult = cmdArchSrcDomains(cwd, true);
  const archData = JSON.parse(archResult);
  results.push({ gate: 'arch-src-domains', ...archData });
  
  return output({ passed: true, gates_passed: gates.length, gates_total: gates.length + 1, results }, raw);
}

// landscape — run all gates with full report
function cmdLandscape(cwd, raw) {
  const gates = [
    { id: 'project-contracts', fn: () => cmdProjectContracts(cwd, true) },
    { id: 'project-dependencies', fn: () => cmdProjectDependencies(cwd, true) },
    { id: 'project-sdk-surface', fn: () => cmdProjectSdkSurface(cwd, true) },
    { id: 'project-build', fn: () => cmdProjectBuild(cwd, true) },
    { id: 'planning-exists', fn: () => cmdPlanningExists(cwd, true) },
    { id: 'planning-health', fn: () => cmdPlanningHealth(cwd, true) },
    { id: 'planning-consistency', fn: () => cmdPlanningConsistency(cwd, true) },
    { id: 'git-branch-state', fn: () => cmdGitBranchState(cwd, true) },
    { id: 'arch-src-domains', fn: () => cmdArchSrcDomains(cwd, true) },
    { id: 'arch-dead-exports', fn: () => cmdArchDeadExports(cwd, true) },
    { id: 'arch-circular-deps', fn: () => cmdArchCircularDeps(cwd, true) },
  ];
  
  const results = [];
  for (const gate of gates) {
    const result = JSON.parse(gate.fn());
    results.push({ gate: gate.id, ...result });
  }
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  return output({
    passed: failed === 0,
    timestamp: new Date().toISOString(),
    summary: { total: results.length, passed, failed },
    results,
    verdict: failed === 0 ? 'PASS' : failed <= 2 ? 'DEGRADED' : 'FAIL'
  }, raw);
}
```

**Step 7: Implement CLI Router**

```javascript
// CLI entry point
const args = process.argv.slice(2);
const cwd = process.cwd();
const raw = args.includes('--raw');
const command = args[0];

if (!command) {
  console.error('Usage: node hm-verify.cjs <command> [--raw]\n' +
    'Commands: project contracts|dependencies|sdk-surface|build|tests, ' +
    'planning exists|health|consistency, ' +
    'git branch-state|last-commit|diff-stat, ' +
    'arch src-domains|dead-exports|circular-deps, ' +
    'gate-chain, landscape');
  process.exit(1);
}

const [layer, subcommand] = command.split(' ');
const rawIndex = args.indexOf('--raw');
if (rawIndex !== -1) args.splice(rawIndex, 1);

switch (command) {
  // Layer 1
  case 'project contracts': cmdProjectContracts(cwd, raw); break;
  case 'project dependencies': cmdProjectDependencies(cwd, raw); break;
  case 'project sdk-surface': cmdProjectSdkSurface(cwd, raw); break;
  case 'project build': cmdProjectBuild(cwd, raw); break;
  case 'project tests': cmdProjectTests(cwd, raw); break;
  
  // Layer 2
  case 'planning exists': cmdPlanningExists(cwd, raw); break;
  case 'planning health': cmdPlanningHealth(cwd, raw); break;
  case 'planning consistency': cmdPlanningConsistency(cwd, raw); break;
  
  // Layer 3
  case 'git branch-state': cmdGitBranchState(cwd, raw); break;
  case 'git last-commit': cmdGitLastCommit(cwd, raw); break;
  case 'git diff-stat': cmdGitDiffStat(cwd, args[2], raw); break;
  
  // Layer 4
  case 'arch src-domains': cmdArchSrcDomains(cwd, raw); break;
  case 'arch dead-exports': cmdArchDeadExports(cwd, raw); break;
  case 'arch circular-deps': cmdArchCircularDeps(cwd, raw); break;
  
  // Compound
  case 'gate-chain': cmdGateChain(cwd, raw); break;
  case 'landscape': cmdLandscape(cwd, raw); break;
  
  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
```

---

## Task 3: Create Reference Documents

**Files:**
- Create: `skills/context-entry-verify/references/gate-definitions.md`
- Create: `skills/context-entry-verify/references/gate-chain-order.md`

**Step 1: Create gate-definitions.md**

```markdown
# Gate Definitions

## Layer 1: Project Reality Gates

| Gate | What It Checks | Pass Criteria |
|------|----------------|---------------|
| `project contracts` | package.json has required fields | has name, version, main |
| `project dependencies` | npm ls --json shows no missing/invalid | 0 missing deps |
| `project sdk-surface` | @opencode-ai/sdk and plugin importable | Both installed |
| `project build` | tsc --noEmit passes | 0 errors |
| `project tests` | npm test passes | 0 failures |

## Layer 2: Planning Integrity Gates

| Gate | What It Checks | Pass Criteria |
|------|----------------|---------------|
| `planning exists` | .planning/ directory exists | true |
| `planning health` | STATE.md, ROADMAP.md, REQUIREMENTS.md exist | All present |
| `planning consistency` | Roadmap phases match disk dirs | 0 missing dirs |

## Layer 3: Git Evidence Gates

| Gate | What It Checks | Pass Criteria |
|------|----------------|---------------|
| `git branch-state` | git status --porcelain | Clean tree |
| `git last-commit` | git log -1 | Returns hash, message, author |
| `git diff-stat [ref]` | git diff --stat | Returns stat output |

## Layer 4: Architecture Gates (Soft)

| Gate | What It Checks | Always Passes? |
|------|----------------|----------------|
| `arch src-domains` | LOC, files, exports per src/ domain | Yes (reporting only) |
| `arch dead-exports` | Exported symbols with <2 consumers | Yes (warning) |
| `arch circular-deps` | Circular import chains | Yes (warning) |

## Compound Commands

| Command | Behavior |
|---------|----------|
| `gate-chain` | Fail-fast sequential, stops at first failure |
| `landscape` | Runs all gates, returns unified verdict |
```

**Step 2: Create gate-chain-order.md**

```markdown
# Gate Chain Order

## Why This Order Matters

The gate chain follows a dependency hierarchy from foundational to derived:

1. **project-contracts** → Everything depends on package.json being valid
2. **project-dependencies** → Can't build/test without deps installed
3. **project-sdk-surface** → Specifically need OpenCode SDK for this project
4. **project-build** → TypeScript must compile before we trust any code
5. **planning-exists** → Planning is required for structured work
6. **planning-health** → Planning docs must be present
7. **planning-consistency** → Planning must match disk state
8. **git-branch-state** → Clean tree required for valid commits

## Failure Cascade

If `project-dependencies` fails:
- Cannot run `project-build`
- Cannot run `project-tests`
- Planning gates still run (independent)
- Git gates still run (independent)

## Soft Gates (Always Pass)

Architecture gates run after the hard chain but do not block. They report warnings that inform but do not enforce.

## Delegation Trigger

When a gate fails, the `delegation_trigger` field activates:
- Agent reports failure to user
- Provides evidence (the full gate result JSON)
- User decides next action
- Agent does NOT proceed autonomously past failures
```
```

---

## Task 4: Create SKILL.md with Triggers and Auto-Run

**Files:**
- Modify: `skills/context-entry-verify/SKILL.md`

**Step 1: Write full SKILL.md**

```yaml
---
name: context-entry-verify
description: Deterministic verification skill providing hard proof gates against project reality. Auto-runs before work execution. Use when starting work, before execution, at gate checkpoints, or when verifying completion claims.
triggers:
  - starting work
  - before execution
  - gate checkpoints
  - verifying completion claims
auto_run: before-work-execution
mode: passive-listen
---

# Context-Entry Verify

Provides deterministic JSON-verified proof of project state.

## Auto-Run Behavior

Runs `hm-verify.cjs gate-chain --raw` **before** any work execution:
- If all gates pass → proceed with work
- If any gate fails → delegate report to user, wait for instruction

## Commands

| Command | Purpose | Blocks On Fail? |
|---------|---------|-----------------|
| `gate-chain` | Sequential fail-fast verification | YES |
| `landscape` | Full landscape report | NO (reports only) |
| `project build` | TypeScript compile check | YES |
| `project tests` | Run npm test | YES |
| `git branch-state` | Check for uncommitted changes | YES |

## Delegation Protocol

When `gate-chain` fails:
1. Parse `blocked_at` and `delegation_trigger` from JSON
2. Report to user: "Gate [X] failed with evidence: [Y]"
3. Await user instruction
4. Do NOT proceed past failure autonomously

## Usage Examples

```bash
# Quick gate check before work
node skills/context-entry-verify/scripts/hm-verify.cjs gate-chain --raw

# Full landscape report
node skills/context-entry-verify/scripts/hm-verify.cjs landscape --raw

# Individual gates
node skills/context-entry-verify/scripts/hm-verify.cjs project build --raw
node skills/context-entry-verify/scripts/hm-verify.cjs git branch-state --raw
```

## References

- [gate-definitions.md](references/gate-definitions.md) - What each gate checks
- [gate-chain-order.md](references/gate-chain-order.md) - Why this order matters
```
```

---

## Task 5: Test the Script

**Step 1: Run the script to verify it works**

```bash
node skills/context-entry-verify/scripts/hm-verify.cjs gate-chain --raw
```

**Expected output (PASS):**
```json
{
  "passed": true,
  "gates_passed": 8,
  "gates_total": 9,
  "results": [...]
}
```

**Expected output (FAIL):**
```json
{
  "passed": false,
  "blocked_at": "project-dependencies",
  "gates_passed": 1,
  "gates_total": 9,
  "delegation_trigger": {
    "action": "REPORT_TO_USER",
    "reason": "Gate project-dependencies failed",
    "evidence": {...}
  }
}
```

**Step 2: Run landscape for full report**

```bash
node skills/context-entry-verify/scripts/hm-verify.cjs landscape --raw
```

---

## Task 6: Integration with context-intelligence-entry SKILL.md

**Files:**
- Modify: `skills/context-intelligence-entry/SKILL.md` (add cross-reference)

**Step 1: Add cross-reference section**

Add to the References section of `context-intelligence-entry/SKILL.md`:

```markdown
## Verification Suite (Separate Skill)

For project reality verification (build, tests, git state), use **context-entry-verify**:

| Skill | Focus | When |
|-------|-------|------|
| context-intelligence-entry | Agent session health, rot detection | Session start, context uncertainty |
| context-entry-verify | Project truth, build gates | Before work, completion claims |
```

---

## Success Criteria

1. `node hm-verify.cjs gate-chain --raw` returns valid JSON with `passed` field
2. `node hm-verify.cjs landscape --raw` returns full report with all layers
3. Fail-fast works: if project-contracts fails, subsequent gates are not run
4. Architecture gates always return `passed: true` (soft warnings)
5. Delegation trigger appears in output when gate fails
6. SKILL.md documents triggers and auto-run behavior correctly

---

## File Checklist

```
skills/context-entry-verify/
├── SKILL.md                              # Skill definition
├── scripts/
│   └── hm-verify.cjs                     # Main script (~500 lines)
└── references/
    ├── gate-definitions.md               # Gate reference
    ├── gate-chain-order.md               # Chain rationale
    └── .gitkeep                          # Placeholder
```
