# Context Rot Defense

Protocol for detecting, measuring, and recovering from context degradation. Fires during the Context Integrity Gate.

---

## Table of Contents

- [Distrust Levels](#distrust-levels)
- [3-Step Trust Check](#3-step-trust-check)
- [Freshness Probe Commands](#freshness-probe-commands)
- [Cross-Team Drift Detection](#cross-team-drift-detection)
- [Multi-Source Comparison Protocol](#multi-source-comparison-protocol)
- [Test-Signal Skepticism](#test-signal-skepticism)
- [Verification Gates](#verification-gates)
- [Context Rot Detection Triggers](#context-rot-detection-triggers)
- [Recovery Actions by Level](#recovery-actions-by-level)

---

## Distrust Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **CLEAN** | All sources corroborate. Code, docs, and git align. | Proceed with full confidence. |
| **SUSPECT** | Some documents are stale or unverified. Minor conflicts detected. | Verify critical claims before routing. Cross-check with code. |
| **DEGRADED** | Multiple sources conflict. Docs contradict code. Prior session memory unreliable. | Delegate a fresh context probe. Do not proceed without probe results. |
| **POLLUTED** | Stale material everywhere. Tests may emit false signals. Governance files may reference non-existent entities. | Quarantine stale material. Escalate to orchestrator. Block implementation until context is restored. |
| **POISONED** | Nothing trustworthy. Cannot verify any claim. Context is irrecoverable. | Block all work. Require human intervention to reset context. |

---

## 3-Step Trust Check

### Step 1: Freshness
- Documents older than **48 hours** are **suspect by default**.
- Dated filenames (e.g., `plan-2026-03-20.md`) are evidence/history only — never authority.
- Stable governance paths (`AGENTS.md`, `CONCERNSV1.md`) are authoritative unless contradicted by code.
- If freshness cannot be determined -> mark as **SUSPECT**.

### Step 2: Code vs Docs
- **Code wins over documentation** — always.
- If a document contradicts actual source code, repository structure, or build output -> code rules.
- Framework conventions, skill triggers, and routing rules exist to accelerate work, never to override observable behavior.
- Check source files first. Check git history second. Check type-check/build output third. **Only then** check documentation.

### Step 3: Prior Sessions
- Memory artifacts from prior sessions are **suspect by default** unless corroborated by:
  - Git history (commits, diffs)
  - Type-check results (`npx tsc --noEmit`)
  - Fresh file reads (current session)
- Session continuity state in `.hivemind/activity/sessions/continuity.json` is reliable only if git-anchored.

---

## Freshness Probe Commands

```bash
# Check recent git activity
git log --oneline -10

# Find recently modified files
find . -name "*.ts" -mtime -2 2>/dev/null

# Check build status
npm run build 2>&1 | tail -5

# Verify test suite
npm test 2>&1 | tail -10

# Check for uncommitted changes
git status --short
```

---

## Cross-Team Drift Detection

Assume other agents/teams work on adjacent code. Check for conflicts:

1. Run `git status` before dispatching any implementation
2. If uncommitted changes exist in target area -> investigate ownership
3. Use worktrees for isolation when conflict risk is high
4. Scope boundaries must account for other teams' work

---

## Multi-Source Comparison Protocol

When claims come from multiple sources, verify alignment:

| Source Priority | Authority |
|----------------|-----------|
| 1. Source code (actual files) | Highest — always wins |
| 2. Git history (commits, diffs) | High — proves what actually happened |
| 3. Build/test output | High — proves what actually works |
| 4. Stable governance docs | Medium — authoritative unless contradicted by 1-3 |
| 5. Prior session memory | Low — suspect by default |
| 6. Dated documents | Lowest — evidence only, never authority |

---

## Test-Signal Skepticism

Tests are evidence, not proof. Before trusting test output:

| Signal | Trustworthy? | Action |
|--------|-------------|--------|
| Test passes, implementation matches intent | YES | Trust the pass |
| Test passes, but implementation looks wrong | NO — false positive | Inspect the assertion; the test may encode wrong behavior |
| Test fails with setup/environment error | NO — noise | Isolate the setup issue from the logic issue |
| Test fails, but only on certain runs | NO — flaky | Do not use as evidence for architectural conclusions |
| Test passes but is trivially true (`assert(true)`) | NO — nonsensical | Quarantine the test |

---

## Verification Gates

### Gate 1: Project Reality
- Does the project build? (`npm run build`)
- Do tests pass? (`npm test`)
- Are dependencies installed?
- Fail Action: Context is at least DEGRADED.

### Gate 2: Planning Integrity
- Do referenced plan files exist?
- Are plan phases consistent with actual code state?
- Fail Action: Plans are stale. Re-derive from code reality.

### Gate 3: Git Evidence
- Is the working tree clean? (`git status`)
- Does git log match claimed recent work?
- Fail Action: Git state conflicts with claims.

### Gate 4: Architecture
- Do import paths resolve to existing files?
- Are type contracts consistent across modules?
- Fail Action: Architecture documentation is stale.

---

## Context Rot Detection Triggers

Automatic escalation to higher distrust levels:

| Trigger | Escalation |
|---------|------------|
| Document references non-existent file | SUSPECT -> DEGRADED |
| Test passes but implementation looks wrong | SUSPECT (false positive) |
| Build fails on clean checkout | DEGRADED -> POLLUTED |
| Multiple governance files conflict | DEGRADED |
| Git history contradicts documented state | POLLUTED |
| Cannot determine file ownership | POLLUTED |
| Core module imports from deleted path | POISONED |

---

## Recovery Actions by Level

### SUSPECT Recovery
1. Read the actual source file for each suspect claim.
2. Check `git log --oneline -10` for recent truth.
3. If corroboration found -> downgrade to CLEAN.

### DEGRADED Recovery
1. Dispatch context probe.
2. Map actual file structure vs documented structure.
3. Identify and quarantine conflicting sources.
4. Re-derive routing decisions from verified state only.

### POLLUTED Recovery
1. Halt all implementation work.
2. Full codebase scan.
3. Rebuild governance from code reality.
4. Human review required before resuming.

### POISONED Recovery
1. Block all agent work.
2. Require human to establish ground truth.
3. Re-initialize from clean git state.
4. No automated recovery possible.
