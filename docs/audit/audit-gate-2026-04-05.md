# Audit Gate — 2026-04-05

> **MANDATORY READ** — Any agent (human or subagent) considering workflow execution, meta-concept changes, or code file modifications MUST consult this gate first. This document weights decisions against the comprehensive harness audit findings.

## Purpose

You are at a decision fork. Before proceeding with ANY of the following, read this gate and answer the checkpoint questions:

- Creating, editing, or deleting agents (`.opencode/agents/`)
- Creating, editing, or deleting skills (`.opencode/skills/`)
- Creating, editing, or deleting commands (`.opencode/commands/`)
- Modifying any `src/` TypeScript file
- Changing `package.json`, `AGENTS.md`, or architecture docs
- Starting a new workflow that touches audited artifacts

## Audit Verdict

| Metric | Value |
|--------|-------|
| **Overall Health** | ⚠️ WARNING |
| **Mandate Gate** | ❌ FAILED (5 of 7 gates) |
| **Claims Verified** | 42 total: 22 MATCH, 11 GAP, 2 HALLUCINATION, 7 OUTDATED |
| **Critical Issues** | 8 |
| **Warnings** | 14 |
| **Informational** | 12 |

Full report: `docs/audit/audit-report-2026-04-05.md`

---

## Decision Checkpoints

### Before Starting ANY New Workflow

Ask yourself:

1. **Does this workflow touch any CRITICAL artifact?** (See Critical Artifact Map below)
   - YES → You MUST address the critical issue first, or explicitly accept the risk
   - NO → Proceed to checkpoint 2

2. **Does this workflow duplicate or overlap with existing meta-concepts?** (See Context Poisoning Map below)
   - YES → You MUST justify why the new concept is distinct, or merge with existing
   - NO → Proceed to checkpoint 3

3. **Does this workflow assume a feature that the audit found MISSING?**
   - YES → You MUST NOT assume the feature exists. Check the Claim-vs-Reality table
   - NO → Proceed

4. **Does this workflow hardcode paths, assume macOS, or depend on external worktrees?**
   - YES → You MUST use relative paths and cross-platform compatible commands
   - NO → Proceed

5. **Will this workflow increase module LOC beyond 500?**
   - YES → You MUST split into separate modules or justify the exception
   - NO → Proceed

---

## Critical Artifact Map

These artifacts have known defects. Any workflow touching them inherits the defect risk.

| Artifact | Defect | Risk if Modified Without Fixing First |
|----------|--------|---------------------------------------|
| `.opencode/agents/coordinator.md` | Corrupt YAML, broken template literals, duplicate sections | Changes will compound corruption. Fix YAML structure first. |
| `src/plugin.ts` | 447 LOC business logic (target <100), contains permission/validation/circuit-breaker logic | Adding more logic deepens the violation. Extract to `src/lib/` first. |
| `.opencode/commands/hf-audit.md` | Hardcoded `/Users/apple/hivemind-plugin/.worktrees/` path | Will break on any other machine. Use relative paths. |
| `.opencode/commands/hf-create.md` | Hardcoded external worktree path | Same as above. |
| `.opencode/commands/hf-stack.md` | Hardcoded external worktree path | Same as above. |
| `.opencode/agents/researcher.md` | Near-identical to `explore.md` (same 410-line body) | Don't add a third research agent. Merge or differentiate first. |
| `.opencode/agents/explore.md` | Near-identical to `researcher.md` | Same as above. |
| `src/lib/types.ts` | NOT a leaf — imports from `task-status.js` | Dependency docs are wrong. Don't assume leaf behavior. |
| `.opencode/agents/hivefiver-orchestrator.md` | References non-existent `hivefiver-tool-builder` agent | Delegation will fail. Create the agent or remove the reference. |
| `src/lib/AGENTS.md` | Governance file in hard harness (`src/lib/`) | Gets published to npm. Move to root or `.opencode/`. |
| `package.json` | Publishes `.opencode/` including `node_modules/` and `trashskills/` | Bloats npm package. Fix `files` array. |
| `.opencode/skills/oh-my-openagent-reference copy/` | Duplicate skill, space in directory name | Breaks glob patterns. Delete the copy. |

---

## Context Poisoning Map

These meta-concepts overlap. Creating new ones in the same space will compound ambiguity.

| Overlapping Concepts | Overlap Type | Risk |
|---------------------|-------------|------|
| `meta-builder` ↔ `use-authoring-skills` | Trigger overlap on "create/audit skill" | HIGH — Non-deterministic which fires |
| `meta-builder` ↔ `agents-and-subagents-dev` | Trigger overlap on "create/build agent" | HIGH — Same |
| `repomix-exploration-guide` ↔ `repomix-explorer` | Content duplication | HIGH — One has no triggers, wastes context |
| `conductor` ↔ `coordinator` | Identical descriptions, different delegation | HIGH — Ambiguous routing |
| `researcher` ↔ `explore` | Near-identical 410-line bodies | HIGH — Same agent, two names |
| `conductor` ↔ `hivefiver` ↔ `coordinator` ↔ `hivefiver-orchestrator` | Four primary orchestrators | HIGH — No clear boundaries |
| `plan.md` ↔ `ultrawork.md` | Contradictory: one requires approval, one says "act" | MEDIUM |
| `hf-audit.md` ↔ `harness-audit.md` | Both respond to "audit skills" | MEDIUM |

**Rule:** Before creating a new agent/skill/command, check this table. If your concept overlaps with any row above, you MUST either:
- Merge with the existing concept, OR
- Explicitly document how your concept is distinct and why both are needed

---

## Claim-vs-Reality Table (Missing Features)

Do NOT assume these features exist. They are documented but NOT implemented.

| Documented Feature | Reality | Implication |
|-------------------|---------|-------------|
| 5 tools (~500 LOC) | Only 1 tool exists (`delegate-task`) | Don't reference tools that don't exist |
| CLI substrate (~500 LOC) | No `bin/` directory | Don't assume CLI commands exist |
| Auto-loop/ralph-loop | Not implemented in `src/` | Don't assume auto-loop behavior |
| Hooks (~800 LOC) | ~190 LOC embedded in `plugin.ts` | Hooks are not standalone modules |
| `types.ts` is leaf | Imports from `task-status.js` | Dependency chain is 3 levels, not 2 |

---

## Module Size Limits

| Module | Current LOC | Limit | Status |
|--------|------------|-------|--------|
| `src/lib/continuity.ts` | 638 | 500 | ❌ +28% over |
| `src/lib/lifecycle-manager.ts` | 705 | 500 | ❌ +41% over |
| `src/plugin.ts` | 447 | 100 | ❌ 4.47× over |
| All other modules | <500 | 500 | ✅ |

**Rule:** Any change that pushes a module over 500 LOC MUST include a refactoring plan.

---

## Cross-Platform Rules

1. **NO hardcoded absolute paths** — Use relative paths from project root
2. **NO macOS-specific paths** — `/Users/apple/` paths break everywhere else
3. **NO Unix-only commands in published artifacts** — `find`, `wc`, `awk`, `sed`, `timeout`, `yes` are not available on Windows
4. **Forward-slash paths in Node.js** — Works cross-platform via normalization
5. **External worktree references** — Must be configurable, not hardcoded

---

## Decision Flow

```
Want to execute workflow?
  │
  ├─ Touches critical artifact? ──YES──> Fix artifact first OR accept risk explicitly
  │                                       (document why in commit message)
  │ NO
  ├─ Overlaps with existing concept? ──YES──> Merge OR justify distinctness
  │ NO
  ├─ Assumes missing feature? ──YES──> STOP. Feature doesn't exist.
  │ NO
  ├─ Hardcodes paths / macOS-only? ──YES──> Use relative, cross-platform approach
  │ NO
  ├─ Pushes module over 500 LOC? ──YES──> Include refactoring plan
  │ NO
  └─ PROCEED — but log which checkpoints you passed
```

---

## Logging Requirement

When an agent proceeds past this gate, it MUST log (in commit message, PR description, or session notes):

```
Audit Gate Checkpoints:
- [ ] Critical artifacts: [none touched / X touched, risk accepted because...]
- [ ] Context poisoning: [no overlap / overlaps with X, distinct because...]
- [ ] Missing features: [none assumed / checked claim-vs-reality table]
- [ ] Cross-platform: [no hardcoded paths / uses relative paths]
- [ ] Module size: [no module exceeds 500 LOC / refactoring plan included]
```

---

*Gate created: 2026-04-05*
*Based on: docs/audit/audit-report-2026-04-05.md*
*This gate MUST be read before any workflow execution touching audited artifacts.*
*Do not delete this file. Update it when audit findings are resolved.*
