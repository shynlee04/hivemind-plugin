# Session Inspection Export

- ses_id: `ses_2da8eb42effeKCTUCBaEQJMyh0`
- prepared_at: `2026-03-25T14:43:33.336Z`

## Assistant Output

Here is the complete investigation report.

---

## Codebase Investigation Report

**Scope:** Agent configuration for front-facing agents in the HiveMind project
**Question:** Full config of each front-facing agent (hiveminder, hivefiver, build, plan), skill pre-loading, agent-skill relationships, and opencode.json mappings

---

### 1. Agent Configuration Architecture

There are **two tiers** of agent definitions:

| Tier | Location | Format | Authority |
|------|----------|--------|-----------|
| **Canonical Source** | `agents/*.deprecated.md` | YAML frontmatter + markdown body | Runtime authority — read by `opencode-agent-registry.ts` |
| **Runtime Projection** | `.opencode/agents/*.md` | YAML frontmatter + markdown body | Extended/enriched versions with skill declarations |

The registry at `src/shared/opencode-agent-registry.ts:40-50` defines exactly **9 registered agents**:

```
hivefiver, hivemaker, hiveminder, hiveplanner, hiveq, hivehealer, hivexplorer, hiverd, hitea
```

The projection mechanism (`opencode-agent-registry.ts:70-83`) only passes 4 frontmatter keys to the runtime: `description`, `mode`, `tools`, `permission`. It does **NOT** project the `skill`, `model`, `contract`, or `hidden` fields — those are canonical-only or `.opencode/agents/`-only.

---

### 2. Full Configuration of Each Front-Facing Agent

#### **Hiveminder** (Primary Orchestrator)

| Property | Value | Source |
|----------|-------|--------|
| **File** | `.opencode/agents/hiveminder.md` | Line 1-505 |
| **Mode** | `primary` | Line 3 |
| **Model** | Not specified (inherits global `minimax-coding-plan/MiniMax-M2.7` from `opencode.json`) | — |
| **Write** | `false` | Line 5 |
| **Edit** | `false` | Line 6 |

**Skills declared (frontmatter `skill:` block, lines 41-47):**
```yaml
skill:
  "use-hivemind": allow
  "use-hivemind-delegation": allow
  "agent-role-boundary": allow
  "use-hivemind-context-integrity": allow
  "hivemind-gatekeeping-delegation": allow
  "use-hivemind-git-memory": allow
```

**Skills mandated in-body (lines 422-428 — the "Skills Discipline" section):**
```
MUST load at session start:
  1. use-hivemind-context-integrity  — detect context rot
  2. hivemind-gatekeeping-delegation — enforce synthesis gates
  3. use-hivemind-git-memory         — resume from git anchors
```

**Task delegation permissions (lines 25-40):** Can delegate to ALL agents: `hiveminder`, `architect`, `code-skeptic`, `hiveq`, `hivemaker`, `hiveplanner`, `hivexplorer`, `hiverd`, `hivehealer`, `hitea`, `handoff`, `build`, `explore`, `plan`, `general`

**Bash permissions (lines 48-54):** `*` (full), including npx, git, npm, node, ls patterns.

---

#### **Hivefiver** (Framework Writer / Meta-Builder)

| Property | Value | Source |
|----------|-------|--------|
| **File** | `agents/hivefiver.deprecated.md` (canonical) | Line 1-83 |
| **Projection** | `.opencode/agents/` — **NO separate file exists** | — |
| **Mode** | `all` | Line 3 |
| **Model** | Not specified | — |
| **Write/Edit/Read/Bash** | All `true` | Lines 5-8 |

**Skills declared:** **NONE** in frontmatter. The legacy format uses `hivemind_doc: allow` (line 24) as a tool permission, not a skill.

**Task delegation permissions (lines 14-23):** `hivexplorer`, `hiveplanner`, `hiverd`, `hiveq`, `build`, `general`, `plan`, `explore`

**Contract block (lines 25-37):**
```yaml
contract:
  may_execute: true
  may_delegate: true
  terminal: false
  accept_gate: "Accept framework-asset authoring, repair, and alignment work..."
  scope_paths:
    - AGENTS.md
    - agents/**
    - commands/**
    - workflows/**
    - skills/**
```

**Critical note:** Hivefiver has NO `.opencode/agents/` projection file. The `agents/AGENTS.md:3` states it's "LEGACY SOURCE (Still Active)" and projected via `opencode-agent-registry.ts`. It exists only in `agents/hivefiver.deprecated.md`.

---

#### **Build** and **Plan** Agents

**`build` — DOES NOT EXIST as a standalone agent file.**

- No `build.md` in `.opencode/agents/`
- No `build.deprecated.md` in `agents/`
- Not in `OPENCODE_AGENT_REGISTRY_IDS` (`src/shared/opencode-agent-registry.ts:40-50`)
- Referenced only as a **task delegation permission** in:
  - `hiveminder.md` line 37: `"build": allow`
  - `hivefiver.deprecated.md` line 20: `"build": allow`

**`plan` — DOES NOT EXIST as a standalone agent file.**

- No `plan.md` in `.opencode/agents/`
- No `plan.deprecated.md` in `agents/`
- Not in `OPENCODE_AGENT_REGISTRY_IDS`
- Referenced only as a **task delegation permission** in:
  - `hiveminder.md` line 39: `"plan": allow`
  - `hivefiver.deprecated.md` line 22: `"plan": allow`

**`hiveplanner`** is the actual planning agent (exists as `.opencode/agents/hiveplanner.md`), and is what `plan` likely aliases to in routing context.

---

#### **Handoff** (Complex Workflow Orchestrator)

| Property | Value | Source |
|----------|-------|--------|
| **File** | `.opencode/agents/handoff.md` | Line 1-461 |
| **Mode** | `all` | Line 3 |
| **Model** | Not specified | — |
| **Write/Edit** | `true` | Lines 5-6 |

**Skills declared (frontmatter `skill:` block, lines 24-30):**
```yaml
skill:
  "use-hivemind": allow
  "use-hivemind-delegation": allow
  "use-hivemind-context-integrity": allow
  "hivemind-gatekeeping-delegation": allow
  "hivemind-atomic-commit": allow
  "use-hivemind-git-memory": allow
```

---

#### **Architect** (System Design Authority)

**Skills declared (lines 28-34):**
```yaml
skill:
  "use-hivemind": allow
  "use-hivemind-context-integrity": allow
  "context-intelligence-entry": allow
  "hivemind-codemap": allow
  "agent-role-boundary": allow
  "spec-distillation": allow
```

---

### 3. Complete Agent-Skill Matrix

| Agent | Skill Allowances (frontmatter) | In-Body Mandatory Skills |
|-------|-------------------------------|--------------------------|
| **hiveminder** | `use-hivemind`, `use-hivemind-delegation`, `agent-role-boundary`, `use-hivemind-context-integrity`, `hivemind-gatekeeping-delegation`, `use-hivemind-git-memory` | `use-hivemind-context-integrity`, `hivemind-gatekeeping-delegation`, `use-hivemind-git-memory` (max 3 active) |
| **hivefiver** | *(none — legacy format)* | *(none declared)* |
| **architect** | `use-hivemind`, `use-hivemind-context-integrity`, `context-intelligence-entry`, `hivemind-codemap`, `agent-role-boundary`, `spec-distillation` | *(none explicit)* |
| **code-skeptic** | `use-hivemind`, `use-hivemind-context-integrity`, `hivemind-codemap`, `course-correction-delegation`, `context-entry-verify`, `research-delegation` | *(none explicit)* |
| **hivemaker** | `use-hivemind`, `use-hivemind-delegation`, `agent-role-boundary`, `use-hivemind-context-integrity`, `tdd-delegation`, `hivemind-atomic-commit` | *(none explicit)* |
| **hiveplanner** | `use-hivemind`, `use-hivemind-delegation`, `hivemind-gatekeeping-delegation`, `spec-distillation`, `hivemind-research`, `hivemind-research-framework` | *(none explicit)* |
| **hiveq** | `use-hivemind`, `use-hivemind-context-integrity`, `agent-role-boundary`, `tdd-delegation`, `context-entry-verify`, `hivemind-atomic-commit` | *(none explicit)* |
| **hivehealer** | `use-hivemind`, `use-hivemind-context-integrity`, `course-correction-delegation`, `use-hivemind-git-memory`, `hivemind-system-debug`, `context-entry-verify` | *(none explicit)* |
| **hivexplorer** | `use-hivemind`, `use-hivemind-context-integrity`, `hivemind-codemap`, `research-delegation`, `hivemind-research-tools`, `use-hivemind-git-memory` | *(none explicit)* |
| **hiverd** | `use-hivemind`, `use-hivemind-context-integrity`, `research-delegation`, `hivemind-research`, `hivemind-research-framework`, `hivemind-research-tools` | *(none explicit)* |
| **hitea** | `use-hivemind`, `use-hivemind-delegation`, `use-hivemind-context-integrity`, `tdd-delegation`, `hivemind-atomic-commit`, `use-hivemind-git-memory` | *(none explicit)* |
| **handoff** | `use-hivemind`, `use-hivemind-delegation`, `use-hivemind-context-integrity`, `hivemind-gatekeeping-delegation`, `hivemind-atomic-commit`, `use-hivemind-git-memory` | *(none explicit)* |
| **general** | `use-hivemind`, `use-hivemind-context-integrity`, `hivemind-codemap`, `research-delegation`, `hivemind-research-tools`, `use-hivemind-git-memory` | *(none explicit)* |
| **explore** | `use-hivemind`, `use-hivemind-context-integrity`, `hivemind-codemap`, `research-delegation`, `hivemind-research-tools`, `use-hivemind-git-memory` | *(none explicit)* |

---

### 4. How Agents Know Which Skills to Load

There is **NO automatic skill pre-loading**. The mechanism is:

1. **Frontmatter `skill:` block** — declares which skills the agent is *permitted* to use. This is a **permission envelope**, not auto-loading. (`*.opencode/agents/*.md`, lines vary per agent)

2. **In-body "Skills Discipline" section** — the agent's markdown body instructs it (via prompt engineering) to load specific skills at session start. Only **hiveminder** has this explicit mandatory section (lines 416-428):
   ```
   You MUST load these skills at session start via the `skill` tool.
   Stack budget: Max 3 active skills loaded simultaneously.
   ```

3. **Skill loading is LLM-driven** — the agent reads its own prompt and decides when to call the `skill` tool. The frontmatter `skill: {name}: allow` entries gate *whether* the tool call succeeds, but the agent body text tells it *when* to load.

4. **No `opencode.json` agent-skill mapping** — the `opencode.json` file contains only `model`, `plugin`, and `provider` configuration. There is no agent-to-skill mapping table in any config file.

5. **`skills/registry-internal.yaml`** — is a skill metadata registry (name, domain, bundle, triggers, dependencies) but contains no agent-to-skill binding. It's an internal metadata file, not used by OpenCode for loading.

---

### 5. Model Configuration

| Agent | Model Override | Default |
|-------|---------------|---------|
| `general` | `minimax-coding-plan/MiniMax-M2.7` (line 4) | — |
| `explore` | `minimax-coding-plan/MiniMax-M2.7` (line 4) | — |
| `hiverd` | `minimax-coding-plan/MiniMax-M2.7` (line 4) | — |
| `hivehealer` | `minimax-coding-plan/MiniMax-M2.7` (line 4) | — |
| All others | *(none)* | Falls through to `opencode.json` → `model: "minimax-coding-plan/MiniMax-M2.7"` |

---

### 6. Gaps Identified

| Gap | Detail |
|-----|--------|
| **`build` agent** | Referenced in task permissions but has NO agent file anywhere. Likely intended as an OpenCode built-in agent or a future alias. |
| **`plan` agent** | Referenced in task permissions but has NO agent file. `hiveplanner` is the actual planning agent. |
| **hivefiver projection** | Has NO `.opencode/agents/` file — exists only in canonical `agents/hivefiver.deprecated.md`. May cause issues if the runtime expects a projection. |
| **No auto-skill-loading** | There is no config-driven mechanism to auto-load skills. It relies entirely on the LLM reading its own prompt and following instructions. |
| **`skill` field not projected** | `opencode-agent-registry.ts:37` only projects `description`, `mode`, `tools`, `permission` — the `skill` block is NOT in `RUNTIME_FRONTMATTER_KEYS`. Skill permissions from `.opencode/agents/` files work because those files are read directly by OpenCode, not through the registry projection. |