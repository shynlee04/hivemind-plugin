# C6 Cluster Inventory: Assets — Shipped Primitives [AUDIT-03 - Deep Inventory]

**Cluster:** C6 — Assets (shipped OpenCode primitives: agents, skills, commands, workflows, rules, references, templates)
**Analysis Date:** 2026-06-06
**Inventory Base:** `assets/` (SOURCE — 472+ files), `.opencode/` (DEPLOY — 800+ files)

---

## 1. Cluster Overview

C6 is the shipped-primitives cluster that defines the Hivemind harness behavior through OpenCode configurable primitives. It has a **3-layer architecture**:

```
SOURCE (assets/)         — Authoritative source of truth for ALL shipped primitives
   │                          GSD-* primitives are NEVER in assets/
   │ sync-via: scripts/sync-assets.js
   ▼
DEPLOY (.opencode/)      — OpenCode-visible copies. User-editable files get .backup.
   │
   ▼
META-BUILDER (.hivefiver-meta-builder/) — Authoring lab used for mass changes. Not shipped.
```

**Constitutional rules (from AGENTS.md):**
- `assets/` = SOURCE of truth for ALL shipped primitives
- `.opencode/` = DEPLOYED copy (client-side manifestation). NEVER develop directly here.
- Exception: `gsd-*` primitives are developer tooling, NEVER in `assets/`, tracked in `.opencode/gsd-file-manifest.json`
- `scripts/sync-assets.js` copies from `assets/` to `.opencode/`. If `.opencode/` is deleted, `npm run build` regenerates everything.

### The 3-Lineage Primitive Model

| Lineage | Prefix | Classification | Directory | Shipped |
|---------|--------|---------------|-----------|---------|
| **HM (Harness Modules)** | `hm-*` | Subject of Development — product engine | `assets/agents/hm-*`, `assets/skills/hm-*`, `assets/commands/hm-*` | ✅ Shipped |
| **HF (Harness Framework)** | `hf-*` | Meta-Builder — authoring tools for primitives | `assets/agents/hf-*`, `assets/skills/hf-*`, `assets/commands/hf-*` | ✅ Shipped |
| **GSD (Get Shit Done)** | `gsd-*` | Internal developer tooling | `.opencode/agents/gsd-*` (NEVER in assets/) | ❌ Dev only |
| **Gate** | `gate-*` | Quality gate triad | `assets/skills/gate-*` | ✅ Shipped |
| **Stack** | `stack-*` | Stack reference | `assets/skills/stack-*` | ✅ Shipped |

---

## 2. Primitive Topology

### 2.1 Agent Topology

| Location | hm-* | hf-* | gsd-* | build.md | **Total** |
|----------|------|------|-------|----------|-----------|
| **SOURCE** (`assets/agents/`) | 32 | 11 | 0 | 1 | **44** |
| **DEPLOY** (`.opencode/agents/`) | 32 | 11 | 33 | 1 | **77** |
| **Drift** | 0 | 0 | +33 (dev) | 0 | **+33** |

**Agents by frontmatter mode:**
- `mode: all`: Most hm-* and hf-* agents (hidden: true for most hm-*)
- `mode: subagent`: All gsd-* agents (with `name:` field)
- `mode: orchestrator` or `mode: coordinator`: Not present — all agents use `mode: all`

**Agent quality observation:** hm-* agents have `mode: all` and `hidden: true`. gsd-* agents have `mode: subagent` with explicit `name:` field. This means hm-* agents are available for chat (all mode) but hidden from the agent picker.

### 2.2 Skill Topology

| Location | hm-* | hm-l2-* | hf-* | gate-* | stack-* | hivemind-* | unprefixed | **Total** |
|----------|------|---------|------|--------|---------|------------|------------|-----------|
| **SOURCE** (`assets/skills/`) | 19 | 21 | 13 | 3 | 6 | 1 | 8 | **71** |
| **DEPLOY** (`.opencode/skills/`) | 19 | 21 | 13 | 3 | 6 | 1 | 8 | **71** |
| **+ 12 .backup dirs** | — | — | — | — | — | — | — | **+12** |

**Critical finding: 21 hm-l2-* skills still in assets/ despite being designated "archived" in AGENTS.md.** The AGENTS.md file (under "Current Phase Context") states: "all 35 former hm-l2/l3-* skills have been archived to `.hivefiver-meta-builder/skills-lab/.archive-refactoring-skills/.archive/`". However, 21 `hm-l2-*` skills remain in `assets/skills/` AND in `.opencode/skills/`. Only 14 of the original 35 were actually moved. This is a **35% completion sync** — the archive is incomplete.

### 2.3 Command Topology

| Location | hm-* | hf-* | gsd-* | unprefixed | **Total** |
|----------|------|------|-------|------------|-----------|
| **SOURCE** (`assets/commands/`) | 106 | 7 | 0 | 12 | **125** |
| **DEPLOY** (`.opencode/commands/`) | 106 | 7 | 61 | 12 | **186** |
| **Drift** | 0 | 0 | +61 (dev) | 0 | **+61** |

Command categories in deploy:
- `hm-*`: 106 commands — mirror GSD's entire command surface
- `gsd-*`: 61 commands — dev tooling
- `hf-*`: 7 commands — meta-builder (hf-absorb, hf-audit, hf-configure, hf-create, hf-prompt-enhance, hf-prompt-enhance-to-plan, hf-stack)
- `unprefixed` (12): plan, start-work, ultrawork, deep-init, deep-research-synthesis-repomix, harness-audit, harness-doctor, steer, sync-agents-md, test-echo, test-list, test-spike-execute, test-status

### 2.4 Workflow Topology

| Location | Count | Notes |
|----------|-------|-------|
| **SOURCE** (`assets/workflows/`) | 103 | .md workflow definitions |
| **DEPLOY** (`.opencode/workflows/`) | 103 | + 103 .backup files |

### 2.5 Other Asset Counts

| Asset Type | SOURCE (`assets/`) | DEPLOY (`.opencode/`) |
|------------|-------------------|----------------------|
| Rules | 1 (`rules/`) | 1 (`rules/`) |
| Templates | 40 (`templates/`) | 40 |
| References | 70 (`references/`) | 70 |
| Agent Instructions | 32 (`agent-instructions/`) | N/A (dev reference only) |

**Grand Total SOURCE files:** 44 agents + 71 skills + 125 commands + 103 workflows + 40 templates + 70 references + 32 agent-instructions + 1 rule = **~486 shipped source files**

---

## 3. Source→Deploy Sync Analysis

### 3.1 Sync Mechanism

`scripts/sync-assets.js` is the bridge. Per AGENTS.md:
> Development workflow: edit in `assets/` → run `node scripts/sync-assets.js` → verify in `.opencode/`
> If `.opencode/` is deleted, running `node scripts/sync-assets.js` (or `npm run build`) regenerates everything.

User-modified files in `.opencode/` are backed up (`.backup` suffix) before overwrite during updates.

### 3.2 Drift Analysis

| Primitive Type | SOURCE Count | DEPLOY (shipped) | DRIFT | Status |
|---------------|-------------|-------------------|-------|--------|
| hm-* agents | 32 | 32 | 0 | ✅ IN SYNC |
| hf-* agents | 11 | 11 | 0 | ✅ IN SYNC |
| hm-* skills | 19 | 19 | 0 | ✅ IN SYNC |
| hm-l2-* skills | 21 | 21 | 0 | ⚠️ NOT ARCHIVED |
| hf-* skills | 13 | 13 | 0 | ✅ IN SYNC |
| gate-* skills | 3 | 3 | 0 | ✅ IN SYNC |
| stack-* skills | 6 | 6 | 0 | ✅ IN SYNC |
| hm-* commands | 106 | 106 | 0 | ✅ IN SYNC |
| hf-* commands | 7 | 7 | 0 | ✅ IN SYNC |
| Workflows | 103 | 103 | 0 | ✅ IN SYNC |
| Templates | 40 | 40 | 0 | ✅ IN SYNC |
| References | 70 | 70 | 0 | ✅ IN SYNC |

**Confirmation:** The source→deploy sync for shipped primitives is **exact**. There is zero drift between `assets/` and the shipped subset of `.opencode/`. The extra files in `.opencode/` are entirely `gsd-*` dev tooling (33 agents, 61 commands) and `.backup` files (12 skill dirs, 103 workflow files).

### 3.3 `.backup` File Proliferation

**103 workflow .backup files** + **12 skill .backup directories** in `.opencode/`. These are created by the sync script when user-modified files exist. Over time, if user modifications aren't committed to `assets/`, the `.backup` files accumulate. The 103 workflow backups suggest extensive direct editing in `.opencode/workflows/` rather than editing in `assets/workflows/` and syncing.

---

## 4. GSD Mimicry Analysis

### 4.1 Surface-Level Pattern Matching

The hm-* agent and command suite is an **explicit adaptation** of the GSD framework's pattern. Evidence:

1. **Command mirroring**: Every gsd-* command has an hm-* equivalent:
   - `gsd-plan-phase` → `hm-plan-phase`
   - `gsd-execute-phase` → `hm-execute-phase`
   - `gsd-map-codebase` → `hm-map-codebase`
   - `gsd-verify-work` → `hm-verify-work`
   - `gsd-ship` → `hm-ship`
   - (60+ more)

2. **Agent mirroring**: Agent roles follow the GSD taxonomy:
   - `gsd-code-reviewer` → `hm-code-reviewer`
   - `gsd-executor` → `hm-executor`
   - `gsd-codebase-mapper` → `hm-codebase-mapper`
   - `gsd-debugger` → `hm-debugger`
   - (30+ more)

3. **Self-documenting GSD origin**: Multiple hm-* agents explicitly mention their GSD ancestry:
   - `hm-planner.md`: "Uses GSD-style planning methodology adapted for Hivemind's programmatic execution model"
   - `hm-architect.md`: "Zero legacy `gsd-sdk` commands referenced" (checklist item)
   - `hm-shipper.md`, `hm-ui-auditor.md`, `hm-ecologist.md`, `hm-nyquist-auditor.md`, `hm-security-auditor.md`, `hm-ui-checker.md`: all say "without calling GSD SDK commands" or "Do not use legacy GSD SDK commands"

### 4.2 Key Differences (Where the Mimicry Fails)

| Dimension | GSD | hm-* (Hivemind adaptation) | Problem |
|-----------|-----|---------------------------|---------|
| **SDK** | `@opengsd/gsd-core` (npm package) | Hivemind tools (task, delegate-task, execute-slash-command) | hm-* agents reference gsd-core patterns but use different mechanisms |
| **Agent mode** | `mode: subagent` | `mode: all` + `hidden: true` | hm-* agents are available as chat agents (all mode), not just subagents |
| **Tool permissions** | No explicit `tools:` frontmatter | No explicit `tools:` frontmatter | Neither cluster restricts tool access |
| **Coordination** | GSD Core SDK for chaining | `task` tool with session stacking | Different mechanism, same surface pattern |
| **File structure** | `.opencode/get-shit-done/` shared core | No shared Hivemind core module | hm-* agents don't load from a shared kernel — each agent is fully self-contained |
| **XML structure** | `<role>` + `<documentation_lookup>` tags | Plain markdown with `## Role` + `## Execution Flow` | hm-* agents use prose sections instead of XML-scoped instructions |
| **Name field** | `name: gsd-agent-name` in frontmatter | No `name:` field in frontmatter | hm-* agents rely on file name for identification |

### 4.3 What GSD Has That hm-* Doesn't

GSD agents consistently have:
1. **Mandatory initial read** — A `<required_reading>` or `mandatory-initial-read.md` pattern that loads project context first
2. **Documentation lookup section** — `<documentation_lookup>` block with MCP tool usage for library research
3. **Context budget guidance** — Explicit loading strategies (load project skills first, read incrementally)
4. **Consistent XML role tags** — `<role>`, `<why_this_matters>`, `<templates>`, `<critical_rules>` sections
5. **Template injection** — Templates embedded in the agent definition via `<templates>` blocks

hm-* agents lack ALL of these structural elements.

---

## 5. L1/L2/L3 Drop Impact

### 5.1 Residual References Found

**Primary residual: `assets/agent-instructions/hm-l2-build.md` (258 lines)**
This document contains:
- Full Mermaid diagram with `L0 → HM_L1 → HM_L2 → HM_L3` hierarchy
- A table labeling ALL 33 gsd-* agents as "L2"
- References to `build.md` as "L0" and `hm-l0-orchestrator` as "L0"
- The filename itself (`hm-l2-build.md`) retains the old L2 suffix

**21 hm-l2-* skills still in `assets/skills/`**
Despite AGENTS.md stating "all 35 former hm-l2/l3-* skills have been archived," 21 hm-l2-* skills remain:
- `hm-l2-brainstorm`, `hm-l2-completion-looping`, `hm-l2-coordinating-loop`, `hm-l2-cross-cutting-change`, `hm-l2-debug`, `hm-l2-feature-ecosystem`, `hm-l2-gate-orchestrator`, `hm-l2-governance-config`, `hm-l2-lineage-router`, `hm-l2-phase-execution`, `hm-l2-phase-loop`, `hm-l2-planning-persistence`, `hm-l2-product-validation`, `hm-l2-production-readiness`, `hm-l2-refactor`, `hm-l2-requirements-analysis`, `hm-l2-roadmap-maintainability`, `hm-l2-skill-router`, `hm-l2-spec-driven-authoring`, `hm-l2-test-driven-execution`, `hm-l2-user-intent-interactive-loop`

Each of these skills has `hm-l2-` in its name, description, and trigger patterns. They were designed for the L2 hierarchy level.

### 5.2 Cross-Cutting Impact

| Primitive Type | Residual Evidence | Impact |
|---------------|-------------------|--------|
| **Skills** | 21 hm-l2-* skill names and descriptions reference L2 hierarchy | Skills self-identify as "L2" but no L1 or L3 counterparts exist |
| **Agent Instructions** | `hm-l2-build.md` has full L0→L1→L2→L3 Mermaid diagrams | This reference document is the architecture roadmap that was never updated |
| **Agents** | No explicit L1/L2/L3 in agent names, but descriptions reference depth ("Called by hm-orchestrator") | Hierarchy is now implicit (who-calls-whom) instead of explicit (level-based) |
| **Commands** | No residual hierarchy references in command names | Commands don't specify target level |
| **Coordination** | No agent knows which level it operates at | Delegation targets are inferred from description text rather than declared |

### 5.3 Implicit Hierarchy (Current State)

Without explicit L1/L2/L3 naming, agents express their "level" through their descriptions:
- **"Called by hm-orchestrator"** → ~20 agents (implied L2/L3)
- **"Spawned by execute-phase orchestrator"** → implied executor
- No Agent → other agent delegation chain is machine-readable; it's all human-readable prose

---

## 6. Agent Quality Analysis

### 6.1 Frontmatter Completeness

| Property | hm-* agents | hf-* agents | gsd-* agents |
|----------|------------|-------------|--------------|
| `name:` field | ❌ None | ❌ None | ✅ All have `name:` |
| `description:` | ✅ All have | ✅ All have | ✅ All have |
| `mode:` | `all` | `all` | `subagent` |
| `hidden:` | `true` (most) | Not set | Not set |
| `tools:` | ❌ None | ❌ None | ❌ None |
| `model:` | ❌ None | ❌ None | ❌ None |

**Missing `name:` field is problematic** because OpenCode's task tool (`task({ subagent_type: "hm-executor", ... })`) relies on the agent file name, not a frontmatter `name:` field. hm-* agents ALL omit `name:` from frontmatter — the file name is the identifier. This means renaming an agent file would break all task tool references.

### 6.2 Agent Descriptions — Quality Assessment

hm-* agent descriptions follow a consistent template pattern:
1. Role summary (1 sentence)
2. "Called by hm-orchestrator during the hm-* workflow" (routing info)
3. Artifact contract (what files they produce)
4. Execution flow (numbered steps)
5. Verification checklist

Sample quality assessment of 5 agents:

| Agent | Description Quality | Artifact Contract | Execution Flow | Cross-References |
|-------|-------------------|-------------------|----------------|-----------------|
| `hm-architect` | ✅ Clear | ✅ ARCHITECTURE.md + ADRs | ✅ 5 steps | References hm-orchestrator |
| `hm-executor` | ✅ Clear | ✅ SUMMARY.md + code changes | ✅ 5 steps | References hm-orchestrator, hm-planner |
| `hm-codebase-mapper` | ✅ Clear | ✅ INVENTORY-ASSET.md | ✅ 7 steps | References hm-orchestrator |
| `hm-debugger` | ⚠️ Adequate | ✅ DEBUG.md | ✅ 5 steps | References hm-orchestrator |
| `hm-l0-orchestrator` | ✅ Comprehensive | ✅ landscape.md + delegations | ✅ 13-step execution flow | References ALL other agents by name |

All hm-* agents have good description quality. No orphan agents were found — every agent references its caller.

### 6.3 Tool Permission Analysis

**NO hm-* or hf-* agent specifies explicit `tools:` frontmatter.** This means all agents inherit the default OpenCode tool set with no restrictions. By comparison, gsd-* agents also lack explicit `tools:` but their `mode: subagent` restricts them to subagent context.

This is a **security gap** — any hm-* agent can execute any tool, including:
- `bash` (arbitrary command execution)
- `Write` (file system mutation)
- `delegate-task` (subagent spawning)

The only restriction is the `mode: all` vs `mode: subagent` difference, which controls agent activation, not tool access.

---

## 7. Skills Quality Deep Dive

### 7.1 Skills Categorization Matrix

All 71 source skills categorized:

| Category | Count | Examples | Quality |
|----------|-------|----------|---------|
| **hm-* (current, proper prefix)** | 19 | `hm-l3-detective`, `hm-l3-deep-research`, `hm-l3-synthesis` | ✅ Proper triggers, good descriptions |
| **hm-l2-* (should be archived)** | 21 | `hm-l2-debug`, `hm-l2-refactor`, `hm-l2-tdd` | ⚠️ Outdated naming, correct triggers |
| **hf-* (meta-builder)** | 13 | `hf-agent-composition`, `hf-command-dev` | ✅ Proper lineage |
| **gate-* (quality triad)** | 3 | `gate-lifecycle-integration`, `gate-spec-compliance`, `gate-evidence-truth` | ✅ Well structured with references |
| **stack-* (reference)** | 6 | `stack-bun-pty`, `stack-vitest`, `stack-zod`, `stack-nextjs`, `stack-json-render` | ✅ Reference quality |
| **hivemind-* (governance)** | 1 | `hivemind-power-on` | ✅ Core loading skill |
| **unprefixed** | 8 | `iterative-loop`, `multi-agent-coordination`, `session-foundation`, `quality-gate-orchestration`, `wave-execution`, `completion-detection`, `cross-cutting-change-mgmt`, `user-intent-patterns` | ⚠️ Mixed — some are `.backup` only |

### 7.2 Outdated Patterns Detected

1. **hm-l2-* skills reference the old hierarchy** in their names and descriptions. The `hm-l2-` prefix was supposed to be dropped during the naming overhaul. These skills' trigger patterns reference "L2" implicitly through their agent-loading documentation.

2. **gsd-executor references in research files**: `hm-l2-planning-persistence/research/design-decisions.md` has extensive GSD pattern analysis referencing `gsd-executor`, `gsd-pause-work`, `gsd-resume-work`, `gsd-plan-phase`. These are research artifacts — they're internal reference documents, not skill behavior — so they're not actively harmful but create documentation drift.

3. **Rich-gate scorecards**: Skills `hm-l2-planning-persistence/metrics/rich-gate-scorecard.md` and `hf-delegation-gates/metrics/rich-gate-scorecard.md` reference `gsd-executor` as the auditor. These are stale evaluation metrics.

### 7.3 Overlap Detection

The following skills have **significant domain overlap**:

| Skills | Overlapping Domain | Analysis |
|--------|-------------------|----------|
| `hm-l2-coordinating-loop` vs `multi-agent-coordination` | Agent coordination | hm-l2 is Hivemind-specific; unprefixed is framework-agnostic. Both cover the same ground. |
| `hm-l2-completion-looping` vs `completion-detection` | Completion detection | hm-l2 covers looping + detection; unprefixed covers pure detection. Distinct but adjacent. |
| `hm-l2-phase-loop` vs `iterative-loop` | Iteration control | hm-l2 is phase-specific; unprefixed is general. Different naming but similar mechanism. |
| `hm-l2-cross-cutting-change` vs `cross-cutting-change-mgmt` | Cross-cutting changes | Near-identical domain. hm-l2 is Hivemind-specific; unprefixed is framework-agnostic. |

The 8 **unprefixed skills** (in `assets/skills/`) are framework-agnostic skills that directly overlap with hm-l2-* skills. Some have `.backup` only — they exist in `.opencode/skills/` as `.backup` directories but their `SKILL.md` is the active version.

### 7.4 Hallucination Detection

**No evidence of hallucinated capabilities was found.** Every skill references capabilities that exist within the Hivemind project:
- `hm-l3-deep-research/SKILL.md` references MCP tools (context7, tavily) — these exist
- `stack-json-render/SKILL.md` references `@json-render/react` — this is a real npm package
- `hm-l3-detective/SKILL.md` references `hm-tech-stack-ingest` as upstream — this exists
- `gate-spec-compliance/SKILL.md` references EARS templates in its `references/` dir — these exist

**However**, one borderline case: `stack-json-render/SKILL.md` line 231: "Read `node_modules/@json-render/react/dist/index.d.ts`". This path only exists if `@json-render/react` is installed. It may not be present in a fresh checkout without `npm install`.

### 7.5 Broken File References

**Skill references to internal files that resolve correctly:**
- `quality-gate-orchestration/SKILL.md` → `references/terminology-map.md` (✅ EXISTS)
- `gate-spec-compliance/SKILL.md` → `references/evaluation-checklist.md` (✅ EXISTS)
- `hm-l3-detective/SKILL.md` → `references/tech-registry.md` (✅ EXISTS)

All internal reference paths checked resolve to real files.

---

## 8. Command Coherence

### 8.1 Command Architecture

The 106 hm-* commands form a complete lifecycle management system:
- **Phase commands**: `hm-plan-phase`, `hm-execute-phase`, `hm-discuss-phase`, `hm-spec-phase`
- **Lifecycle commands**: `hm-ship`, `hm-verify`, `hm-verify-work`, `hm-pause-work`, `hm-resume-work`
- **Analysis commands**: `hm-audit`, `hm-review`, `hm-forensics`, `hm-profile`
- **Debug commands**: `hm-debug`
- **Project commands**: `hm-init-project`, `hm-new-project`, `hm-new-milestone`
- **Config commands**: `hm-config`, `hm-settings`
- **UI commands**: `hm-ui-phase`, `hm-ui-review`
- **Research commands**: `hm-research`, `hm-synthesize`, `hm-deep-research-synthesis-repomix`

The 7 hf-* commands handle meta-builder operations:
- `hf-absorb`, `hf-audit`, `hf-configure`, `hf-create`, `hf-prompt-enhance`, `hf-prompt-enhance-to-plan`, `hf-stack`

### 8.2 Command Routing

All hm-* commands route to `hm-orchestrator` or an hm-* agent via the `agent:` frontmatter field. The routing is consistent:
- `hm-plan-phase` → routes to hm-orchestrator → coordinator → planner
- `hm-execute-phase` → routes to hm-orchestrator → coordinator → executor
- `hm-code-review` → routes to hm-code-reviewer directly
- `hm-doctor` → routes to hm-orchestrator

**No orphan commands found.** Every command has a defined routing target.

### 8.3 GSD Command Duplication Pattern

The hm-* commands mirror GSD's command structure exactly. For example:
- GSD has 10 `gsd-*` commands for phase lifecycle; hm-* has 10 parallel `hm-*` commands
- GSD has `gsd-audit-fix`, `gsd-audit-milestone`, `gsd-audit-uat`; hm-* has `hm-audit`, `hm-audit-milestone`, `hm-audit-uat`
- GSD has `gsd-ui-phase`, `gsd-ui-review`; hm-* has `hm-ui-phase`, `hm-ui-review`

The duplication is complete — every GSD lifecycle command has an hm-* counterpart. The hm-* commands are not imports or wrappers around GSD commands; they are standalone implementations with different internal routing (Hivemind's task/delegate-task tools vs GSD Core SDK).

---

## 9. Cross-Cluster Integration

### 9.1 How C6 Connects to Other Clusters

| Cluster | What C6 Provides | Consumer |
|---------|-----------------|----------|
| **C1 (Governance)** | `assets/rules/universal-rules.md`, agent governance instructions | Loaded by `hm-l0-orchestrator` → enforced by C4 hooks |
| **C2 (Tracking)** | Agent instructions reference session-tracker, trajectory | Agent descriptions mention "use session-tracker" |
| **C3 (Delegation)** | hm-* agents referenced in task tool dispatched from C3 | C3 coordination tools dispatch hm-* agents by name |
| **C4 (Hooks)** | Skills loaded by hook transforms | Skills like `gate-*` are loaded by C4's `core-hooks.ts` |
| **C5 (Tools)** | Commands invoke C5 tools | Commands route to tools like `configure-primitive`, `hivemind-doc` |

### 9.2 Integration Gaps

1. **No agent→skill binding manifest.** There is no machine-readable document that maps which agents load which skills. The skill-agent bindings are embedded in SKILL.md descriptions and agent decision-making.

2. **No command→workflow→agent traceability.** The command chain (command → workflow → agent) is embedded in command YAML frontmatter and workflow step definitions. There is no central traceability document.

3. **Cross-lineage routing is manual.** The `hm-l0-orchestrator.md` agent definition hardcodes `hf-*` routing in its text:
   > "If the task requires meta-concept creation (agents, skills, commands, tools), route the user to the hf-orchestrator"
   
   This is a prose instruction, not a programmatic binding. There is no shared routing table that both hm-* and hf-* lineages reference.

---

## 10. Gaps & Flaws

### 10.1 Incomplete hm-l2-* Archive (High Impact)

**Files:** 21 `assets/skills/hm-l2-*` directories

**Issue:** AGENTS.md states "35 former hm-l2/l3-* skills have been archived." Only 14 of 35 were actually archived. 21 `hm-l2-*` skills remain in `assets/skills/` and are actively synced to `.opencode/skills/`. These skills reference the old L2 hierarchy in their names, descriptions, and trigger patterns.

**Impact:** Each of the 21 skills has a misleading name. The L2 hierarchy no longer exists, so "hm-l2-debug" suggests a level that doesn't exist. Skills like `hm-l2-lineage-router` and `hm-l2-skill-router` are core routing infrastructure — their "L2" label is actively misleading.

### 10.2 Residual L1/L2/L3 Architecture Document (High Impact)

**File:** `assets/agent-instructions/hm-l2-build.md` (258 lines)

**Issue:** This document contains full Mermaid diagrams with the old L0→L1→L2→L3 hierarchy, a complete agent census with depth labels, and references to `gsd-*` agents as "L2". It has not been updated since the hierarchy was dropped. It actively contradicts the current flat naming convention.

### 10.3 No Agent-Specific Tool Permissions (Medium Impact)

**Issue:** Zero hm-* or hf-* agents specify `tools:` frontmatter. This means every agent inherits the full OpenCode default tool set. An agent designed for architecture design (`hm-architect`) has access to `bash`, `delegate-task`, and `Write` — tools it shouldn't need.

**GSD comparison:** GSD agents also lack explicit `tools:` but their `mode: subagent` constrains their activation context. hm-* agents have `mode: all` with zero restrictions.

### 10.4 No `name:` Field in hm-* Agent Frontmatter (Medium Impact)

**Issue:** hm-* and hf-* agents omit `name:` from frontmatter. GSD agents include `name: gsd-*`. OpenCode's task tool dispatches by file name, which works — but renaming an agent file breaks all references silently.

### 10.5 Skills Overlap Between hm-l2-* and Unprefixed (Medium Impact)

**Files:** `assets/skills/hm-l2-coordinating-loop` vs `assets/skills/multi-agent-coordination` (and 3 more pairs)

**Issue:** 4 skill pairs cover the same domain with different naming conventions. The unprefixed versions are "framework-agnostic" while the hm-l2-* versions are Hivemind-specific. Both exist in the shipped package, creating confusion about which one an agent should load.

### 10.6 103 Workflow `.backup` Files (Low Impact)

**Files:** `.opencode/workflows/*.backup` (103 files)

**Issue:** Every workflow file has a `.backup` counterpart. These 103 backup files account for half of the workflow directory. They suggest the sync script has been creating backups on every deployment — possibly from auto-generated modifications to workflow files.

### 10.7 No `tools:` Enforcement in Agent Definitions (Medium Impact)

**Issue:** The `universal-rules.md` defines the quality gate triad but nowhere enforces that agents should have restricted tool access. The 33 gsd-* agents also lack explicit tool restrictions. The entire agent ecosystem operates on the OpenCode default tool set.

### 10.8 hm-* Agents Lack GSD's Structural XML Elements (Low Impact)

**Issue:** GSD agents have `<role>`, `<documentation_lookup>`, `<templates>`, `<critical_rules>` — hm-* agents use prose sections. While both work, the XML structure makes GSD agents more machine-readable and easier to validate programmatically.

### 10.9 Skills Load from `tools:` Frontmatter Workaround Comment (Low Impact)

**Files:** Multiple gsd-* agents reference "tools from agents with a `tools:` frontmatter restriction" in their comments.

**Issue:** This is a known OpenCode bug (anthropics/claude-code#13898) where MCP tools are stripped from agents with `tools:` frontmatter restrictions. The gsd-* agents document this workaround. hm-* agents do not mention it, but they also don't use `tools:` restrictions, so they're not affected.

### 10.10 `build.md` Agent — Single Point of Registration

**File:** `assets/agents/build.md` (and `.opencode/agents/build.md`)

**Issue:** The `build.md` agent is the developer profile agent with no lineage prefix. It references GSD developer profile data (GSD:profile-start markers). This is the only agent with no lineage and no standard naming convention. It's an orphan in the naming taxonomy.

### 10.11 No Central Agent Registry

**Issue:** The agent ecosystem is defined by filesystem presence (any `.md` file in `.opencode/agents/` is an agent). There is no agent registry or manifest file (aside from `.opencode/gsd-file-manifest.json` which only covers gsd-*). This means agent discovery is entirely file-system-based and there's no way to validate agent consistency programmatically.

---

## 11. Conflicts

### 11.1 L1/L2/L3 Naming Conflict

**Conflict:** The naming convention was dropped from agent/skill names, but 21 `hm-l2-*` skills still exist, `assets/agent-instructions/hm-l2-build.md` still documents the full hierarchy, and the names `hm-l2-*` appear in skill descriptions across the codebase.

**Impact:** The naming convention is in a limbo state — removed from agent names but present in skills, documentation, and reference files. This makes it impossible to determine whether a `hm-l2-*` skill is a current part of the system or a residual that should be archived.

### 11.2 Skills Namespace Conflict

**Conflict:** Skills exist in three overlapping namespaces:
1. `assets/skills/hm-l2-*` (supposedly archived, 21 remain)
2. `assets/skills/[a-z]*/` (8 unprefixed skills covering same domains)
3. `assets/skills/hm-*` (19 current skills)

Skills `hm-l2-coordinating-loop` and `multi-agent-coordination` cover the same domain with different naming. Agents loading skills must choose between them.

**Impact:** Skill loading is non-deterministic for overlapping domains. An agent processing a coordination task might load either or both skills.

### 11.3 GSD→HM Migration Completeness Conflict

**Conflict:** AGENTS.md states "Any synthesis from gsd-* must be transformed to hm-*/hf-* conventions." But:
- 21 hm-l2-* skills retain the old hierarchy naming (not fully transformed)
- `assets/agent-instructions/hm-l2-build.md` has full GSD lineage documentation
- Multiple hm-* agents explicitly reference "no GSD SDK commands" — implying the migration is recent and incomplete

**Impact:** The GSD→HM migration is partially complete. Skills have been renamed and agents rewritten, but the underlying architecture documentation and skill naming haven't been updated.

### 11.4 `build.md` Naming Convention Violation

**Conflict:** The `build.md` agent has no lineage prefix. Every other agent uses `hm-*`, `hf-*`, or `gsd-*`. The `build.md` agent is used for developer profile metadata (GSD:profile-start). Its purpose is different from the other agents — it's a configuration/metadata agent, not a runtime agent.

**Impact:** Naming inconsistency. Should be `hm-build.md` or removed entirely with its metadata integrated into the config system.

### 11.5 hm-* agents: `mode: all` vs `hidden: true` Tension

**Conflict:** hm-* agents use `mode: all` (available for chat) with `hidden: true` (hidden from agent picker). This creates an odd state where agents exist and can be invoked in chat (if you know their name) but don't appear in any agent list. The combination is unusual — typically `mode: subagent` + no `hidden:` would achieve the same effect with less confusion.

---

## 12. Key Findings

1. **The GSD→HM migration is incomplete.** 21 `hm-l2-*` skills remain despite AGENTS.md declaring them archived. The architecture document `assets/agent-instructions/hm-l2-build.md` retains the full L0→L1→L2→L3 hierarchy with Mermaid diagrams. Multiple hm-* agents have "no GSD SDK commands" checklists — evidence of a recent migration that was never fully completed.

2. **Source→deploy sync is exact** for shipped primitives — but the archive cleanse is only 36% complete. Only 14 of 35 old hm-l2/l3-* skills were moved to the archive. The remaining 21 are actively shipped in every deploy, confusing the naming convention and creating namespace conflicts with the 8 unprefixed skills.

3. **The hm-* agent ecosystem is a complete parallel rebuild of GSD**, not a thin wrapper. All 106 hm-* commands mirror GSD commands with different internal mechanisms (Hivemind's task/delegate-task vs GSD Core SDK). The 32 hm-* agents map 1:1 to GSD agent roles. Yet the architectural documentation (`hm-l2-build.md`) still describes the GSD hierarchy.

4. **Zero agent-level tool permissions** across the entire ecosystem. No hm-*, hf-*, or gsd-* agent specifies `tools:` frontmatter. All agents run with the full default OpenCode tool set, including `bash` for arbitrary command execution.

5. **The `hm-l2-planning-persistence` skill is the most outdated single artifact** — it has `gsd-executor` in its scorecard, `GSD pattern analysis` in its research documents, references `hm-l2-planner`/`hm-l2-persistor`/`hm-l2-executor` as consumers, and names `gsd-code-review` as a peer utility. None of these names exist in the current system.

6. **Eight unprefixed skills create an unresolved namespace conflict** with their `hm-l2-*` counterparts. An agent loading a coordination skill could pick `hm-l2-coordinating-loop` or `multi-agent-coordination` — with no guidance on which to prefer.

---

*C6 Inventory: 2026-06-06 — ~486 shipped source files analyzed (71 skills, 44 agents, 125 commands, 103 workflows, 40 templates, 70 references, 32 agent-instructions, 1 rule)*
