---
name: context-intelligence-entry
description: "Context-Intelligence Entry Pack - MUST LOAD at session start, after compaction, when detecting drift, or when delegation scope is unclear. Defends against context rot, pollution, and poisoning. Triggers on ANY session initialization including: help me, continue, start working, what did we do, what's the status, or any first message. Framework detection auto-runs on load with structured JSON output including action gates. Do NOT proceed without running this skill first when context state is uncertain."
---

# Context-Intelligence Entry Pack

**Core principle:** Context rot is invisible until it's catastrophic. Detect it before you act.

## ⚡ TWO MODES (Different Use Cases)

### Mode 1: Quick State Read (~50ms) - RUN EVERY TIME

**For workflow continuity. Fast state read. NO analysis:**

```bash
node scripts/context-harness-init.cjs --quick
```

**Returns ONLY:**
- `session_type`: NEW or RESUMED
- `state`: `{ task_plan_exists, agents_md_exists, session_exists, git_clean }`
- `can_proceed`: true/false
- `issues`: workflow blockers (uncommitted, stale session)

**Does NOT return:**
- Planning hierarchy
- Workflow analysis
- Platform detection
- Context flood analysis
- Rotation level scoring

**When to run:**
- Every session start
- Before git commits
- Before starting work
- After `/clear`

---

### Mode 2: Rot Check (~1s) - RUN WHEN AGENT DECIDES

**Deterministic PASS/FAIL. Specific criteria:**

```bash
node scripts/context-harness-init.cjs --rot
```

**Returns:**
- `result`: PASS or FAIL
- `passes`: [{ check, reason }]
- `failures`: [{ check, reason, fix }]
- `action_gate`: { read_files, write_files, delete_files, execute_commands }

**Checks (deterministic):**
| Check | PASS | FAIL |
|-------|------|------|
| Governance | AGENTS.md exists | AGENTS.md missing |
| Session | Valid OR first run | Corrupt/unreadable |
| Git | Clean working tree | Merge conflicts |
| Plan | refs exist | refsto non-existent path |
| Trust | Single authority | Multiple AGENTS.md |

**When to run:**
- Agent detects inconsistency
- Agent mentions "rot", "pollution", "drift"
- After major changes
- Before claiming completion

---

### Mode 3: Full Analysis (~5s) - RUN EXPLICITLY

**Deep analysis (--full flag). All dimensions:**

```bash
node scripts/context-harness-init.cjs --full
```

**Only when explicitly requested.**

---

## Quick State Read Output

```json
{
  "mode": "quick",
  "session_type": "NEW",
  "state": {
    "task_plan_exists": true,
    "agents_md_exists": true,
    "session_exists": false,
    "git_clean": true
  },
  "issues": [],
  "can_proceed": true
}
```

## Rot Level Enforcement (DETERMINISTIC)

**PASS/FAIL criteria - no scoring, no heuristics:**

| Check | PASS | FAIL |
|-------|------|------|
| Governance | `AGENTS.md` exists | `AGENTS.md` missing |
| Session | `.hivemind/session` exists OR first run | Session corrupt/unreadable |
| Git | Clean working tree | Merge conflict markers in tracked files |
| Plan | `task_plan.md` references exist | Plan refs non-existent path |
| Trust | Single authority in scope | Multiple `AGENTS.md` in scope |

**Result:** `PASS` or `FAIL: [reasons]`

**No scores. No heuristics. Deterministic.**

## Trust Score Thresholds (From `trust.score`)

| Trust | Level | Permissions |
|-------|-------|-------------|
| ≥ 0.8 | HIGH | All actions permitted |
| 0.6-0.79 | MEDIUM | Elevated risk actions require confirmation |
| < 0.6 | LOW | Read-only, confirm everything |

**Formula:** `Effective Trust = Σ(Signal × Weight) / Σ(Weight)`

## Action Gates (From `action_gate` JSON field)

**These are ENFORCED by the script output - do NOT bypass:**

| Action | Gate | Condition |
|--------|------|-----------|
| Read files | `action_gate.read_files` | trust.score ≥ 0.4 |
| Write files | `action_gate.write_files` | trust.score ≥ 0.6 AND rot ≤ DEGRADED |
| Delete files | `action_gate.delete_files` | trust.score ≥ 0.8 AND rot ≤ SUSPECT |
| Execute commands | `action_gate.execute_commands` | trust.score ≥ 0.7 AND rot ≤ DEGRADED |
| Delegate | `action_gate.delegate` | trust.score ≥ 0.6 AND rot ≤ POLLUTED |
| Claim completion | `action_gate.claim_completion` | trust.score ≥ 0.8 AND rot ≤ DEGRADED |

## Context Flood Detection (From `context_flood` JSON)

**IMPORTANT DISTINCTION: Filesystem Bloat vs Context Rot**

| Type | Definition | Counts as Rot? |
|------|------------|----------------|
| **Runtime Context Rot** | Affects active agent context | YES |
| **Filesystem Bloat** | Files on disk, not in context | NO |

### What Counts as ROT (affects runtime):

| Issue | Impact | rot Points |
|-------|--------|------------|
| Broken plan links | Plan references non-existent path | +1 each |
| Orphaned implementation | Code not linked to any plan | +1 each (capped) |
| Governance conflicts | Multiple authority files in active scope | +2 each |
| Broken symlinks | Runtime errors | +1 each |
| Merge conflict markers | Blocks execution | +1 each |

### What is NOT Rot (filesystem only):

| Issue | Why it doesn't matter |
|-------|----------------------|
| Documents across platforms | Only primary platform is loaded |
| Organized hierarchies | Proper structure, not confusing |
| Dormant directories | Not in active scope |
| Artifacts in proper places | Where they belong |

**If `context_flood.has_flood === true`:**
1. Check which issues are runtime-affecting
2. Ignore filesystem bloatunless it affects active scope
3. Focus on broken links and governance conflicts

## Framework Detection (From `dimensions.platform_surface`)

**Script detects these platforms:**

| Directory | Platform | Primary Indicator |
|-----------|----------|-------------------|
| `.opencode` | OpenCode | `opencode.json`, `AGENTS.md` |
| `.claude` | Claude Code | `CLAUDE.md` |
| `.codex` | Codex | `CODEX.md` |
| `.cursor` | Cursor | `cursor.json`, `.cursorrules` |
| `.gemini` | Gemini | `agents/`, `commands/` |
| `.github` | GitHub | `skills/gsd-*` |
| `.qwen` | Qwen | `QWEN.md` |

**Framework scoring** (from `primary_framework_score`):
- Primary = highest scoring platform
- Score < 0.5 = weak signal
- Multiple platforms with similar scores = conflict |

## Entry Protocol (ALWAYS FOLLOW)

1. **OBSERVE** — Run the detection script first
2. **ASSESS** — Read `rot_level` and `trust.score` from JSON
3. **ENFORCE** — Follow `action_gate` permissions
4. **ALERT** — If `context_flood.has_flood === true`, warn user
5. **RECOVER** — If rot_level ≥ DEGRADED, stop and rebuild

## Safe Operational Patterns

| Pattern | Practice |
|---------|----------|
| Atomic commits | Plan + code pairs together |
| Worktree isolation | Use `.worktree` when uncertain |
| Discovery first | Scripts read-only by default |
| Time awareness | Date conflict → latest valid wins |
| No absolutes | Prefer patterns, regex, fuzzy matching |

## Platform Adaptation

> The script adapts to detected platform directories:

| Platform | Detection Mechanism |
|----------|---------------------|
| OpenCode | `.opencode/` dir, `opencode.json` |
| Claude Code | `.claude/` dir, `CLAUDE.md` |
| Codex | `.codex/` dir, `CODEX.md` |
| Cursor | `.cursor/` dir, `cursor.json` |
| Gemini | `.gemini/` dir with `agents/`, `commands/` |
| Custom | Any `.*` directory with `skills/` or `commands/` |

## References (For Deep Dives)

| Reference | Trigger | Content |
|-----------|---------|---------|
| [context-rot-taxonomy.md](references/context-rot-taxonomy.md) | Any rot detected | Full severity model + 24 detection dimensions |
| [entry-state-matrix.md](references/entry-state-matrix.md) | Session start/resume | State definitions and required actions |
| [delegation-scope.md](references/delegation-scope.md) | Delegation received | Scope inheritance rules + anti-patterns |
| [trust-matrix.md](references/trust-matrix.md) | Trust evaluation | Scoring methodology + signal weights |
| [platform-surface.md](references/platform-surface.md) | Cross-platform work | Directory mappings + path patterns |

## Verification Suite (Separate Skill)

For project reality verification (build, tests, git state), use **context-entry-verify**:

| Skill | Focus | When |
|-------|-------|------|
| context-intelligence-entry | Agent session health, rot detection | Session start, context uncertainty |
| context-entry-verify | Project truth, build gates | Before work, completion claims |

## Execution Script

```bash
node skills/context-intelligence-entry/scripts/context-harness-init.cjs --format=json
```

**JSON Output Structure:**

```json
{
  "session_type": "NEW|RESUMED|DEGRADED|DELEGATED|INTERRUPTED",
  "rot_level": "CLEAN|SUSPECT|DEGRADED|POLLUTED|POISONED",
  "trust": { "score": 0.0-1.0, "level": "HIGH|MEDIUM|LOW" },
  "action_gate": { "read_files": true, "write_files": false, ... },
  "context_flood": { "has_flood": true, "flood_score": 59, ... },
  "dimensions": {
    "platform_surface": {
      "checks": {
        "primary_framework": "OpenCode",
        "primary_framework_score": 1.5,
        "all_frameworks": [...]
      }
    }
  },
  "recommendations": [...]
}
```

## Anti-Patterns (NEVER DO)

| Pattern | Problem |
|---------|---------|
| "I remember what I was doing" | After compaction you're guessing |
| "The context is fine" | If rot_level > CLEAN, it's not fine |
| "I'll recover context later" | Later = after more drift |
| "Compaction didn't lose anything" | Prove it - run the script |
| Bypass action_gate permissions | The gates exist for a reason |
| Ignore context_flood warnings | Flood causes future rot |