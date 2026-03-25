# Context Health Check Protocol

Protocol for verifying context integrity before routing, implementing, or committing to decisions.

---

## 3-Step Check

### Step 1: Freshness
- Documents older than **48 hours** are **suspect by default**.
- Dated filenames (e.g., `plan-2026-03-20.md`) are evidence/history only — never authority.
- Stable governance paths (`AGENTS.md`, `CONCERNSV1.md`) are authoritative unless contradicted by code.
- If freshness cannot be determined → mark as **SUSPECT**.

### Step 2: Code vs Docs
- **Code wins over documentation** — always.
- If a document contradicts actual source code, repository structure, or build output → code rules.
- Framework conventions, skill triggers, and routing rules exist to accelerate work, never to override observable behavior.
- Check source files first. Check git history second. Check type-check/build output third. **Only then** check documentation.

### Step 3: Prior Sessions
- Memory artifacts from prior sessions are **suspect by default** unless corroborated by:
  - Git history (commits, diffs)
  - Type-check results (`npx tsc --noEmit`)
  - Fresh file reads (current session)
- Session continuity state in `.hivemind/activity/sessions/continuity.json` is reliable only if git-anchored.

---

## Distrust Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **CLEAN** | All sources corroborate. Code, docs, and git align. | Proceed with full confidence. |
| **SUSPECT** | Some documents are stale or unverified. Minor conflicts detected. | Verify critical claims before routing. Cross-check with code. |
| **DEGRADED** | Multiple sources conflict. Docs contradict code. Prior session memory unreliable. | Delegate a fresh `context-intelligence-entry` probe. Do not proceed without probe results. |
| **POLLUTED** | Stale material everywhere. Tests may emit false signals. Governance files may reference non-existent entities. | Quarantine stale material. Escalate to orchestrator. Block implementation until context is restored. |
| **POISONED** | Nothing trustworthy. Cannot verify any claim. Context is irrecoverable. | Block all work. Require human intervention to reset context. |

---

## Verification Gates

### Gate 1: Project Reality
- **Check:** Does the project build? (`npm run build`)
- **Check:** Do tests pass? (`npm test`)
- **Check:** Are dependencies installed? (`node_modules/` exists, `package-lock.json` consistent)
- **Check:** Does the directory structure match documented layout?
- **Fail Action:** Context is at least DEGRADED. Investigate before proceeding.

### Gate 2: Planning Integrity
- **Check:** Do referenced plan files exist?
- **Check:** Are plan phases consistent with actual code state?
- **Check:** Do delegation packets reference valid file paths?
- **Check:** Are gate criteria measurable (not vague)?
- **Fail Action:** Plans are stale. Re-derive from code reality.

### Gate 3: Git Evidence
- **Check:** Is the working tree clean? (`git status`)
- **Check:** Does git log match claimed recent work?
- **Check:** Are there uncommitted changes from other agents?
- **Check:** Do referenced commits exist and contain claimed changes?
- **Fail Action:** Git state conflicts with claims. Resolve before proceeding.

### Gate 4: Architecture
- **Check:** Do import paths resolve to existing files?
- **Check:** Are type contracts consistent across modules?
- **Check:** Does the actual layer structure match documented architecture?
- **Check:** Are there dead imports or references to removed modules?
- **Fail Action:** Architecture documentation is stale. Map actual structure before proceeding.

---

## Context Rot Detection Triggers

Automatic escalation to higher distrust levels when:

| Trigger | Escalation |
|---------|------------|
| Document references non-existent file | SUSPECT → DEGRADED |
| Test passes but implementation looks wrong | SUSPECT (false positive) |
| Build fails on clean checkout | DEGRADED → POLLUTED |
| Multiple governance files conflict | DEGRADED |
| Git history contradicts documented state | POLLUTED |
| Cannot determine file ownership | POLLUTED |
| Core module imports from deleted path | POISONED |

---

## Recovery Actions by Level

### SUSPECT Recovery
1. Read the actual source file for each suspect claim.
2. Check `git log --oneline -10` for recent truth.
3. If corroboration found → downgrade to CLEAN.

### DEGRADED Recovery
1. Dispatch `context-intelligence-entry` probe.
2. Map actual file structure vs documented structure.
3. Identify and quarantine conflicting sources.
4. Re-derive routing decisions from verified state only.

### POLLUTED Recovery
1. Halt all implementation work.
2. Full codebase scan via `hivexplorer`.
3. Rebuild governance from code reality.
4. Human review required before resuming.

### POISONED Recovery
1. Block all agent work.
2. Require human to establish ground truth.
3. Re-initialize from clean git state.
4. No automated recovery possible.
