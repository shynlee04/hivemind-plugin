# use-hivemind Master Entry Point Architecture

**Date:** 2026-03-20
**Status:** Architecture Design
**Lineage:** hivefiver (meta-builder)
**Framework:** HiveMind Context Governance
**Entry Level:** L1 (First Load)
**Pattern:** P0 (Bundle orchestrator with conditional references)

---

## Executive Summary

The `use-hivemind` skill is the **MASTER ENTRY POINT** for the entire HiveMind framework. It must:

1. **Load FIRST** - Before any `use-hivemind-*` branch skills
2. **Wrap all hierarchy** - Define conditional loading, granularity of turns vs workflows
3. **Define delegation network** - Which agents load what, how granular, when conditional
4. **Set the mindset** - Everything else resolves from this skill
5. **Know platform differences** - OpenCode vs Claude Code vs Cursor vs Codex vs Gemini
6. **Know framework sync** - How HiveMind syncs with this project
7. **Reference properly** - Agent chaining, commands, prompts, CLI, orchestration, delegation, handoff, steer, sessions, workflows, tools, plugins, extensions, rules, permissions, context

---

## Part 1: Skill Anatomy

### 1.1 Frontmatter Specification

```yaml
---
name: use-hivemind
description: |Master entry point for HiveMind framework. MUST LOAD FIRST at session start, after compaction, on context uncertainty, or when user mentions "hive", "hivemind", "framework", "meta", "skill". Sets entire framework context, resolves lineages, establishes delegation network, and provides platform-specific activation guidance. All other use-hivemind-* skills branch from this activator.
domain: framework/governance
bundle: governance-core
entry_level: L1
pattern: P0
triggers:
  - "use hivemind"
  - "hive framework"
  - "what is hivemind"
  - "start hivemind"
  - "load hivemind"
  - "hivemind skills"
  - "framework guide"
  - "meta framework"
secondary_triggers:
  - "how does hivemind work"
  - "which lineage"
  - "hiveminder or hivefiver"
  - "skill routing"
  - "agent hierarchy"
depends_on: []
enables:
  - use-hivemind-context-integrity
  - use-hivemind-context-verify
  - use-hivemind-skill-writer
  - use-hivemind-git-memory
  - use-hivemind-delegation
  - use-hivemind-hierarchy
  - use-hivemind-session-resume
knowledge_delta_score: 0.95
status: active
owner: hivemind-core
disclosure_level: L0
---
```

### 1.2 Section Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USE-HIVEMIND MASTER ANATOMY                       │
├─────────────────────────────────────────────────────────────────────┤
│  1. when_to_activate.yml     - Activation triggers and conditions     │
│  2. when_not_to_activate.yml  - Deactivation and skip rules           │
│  3. two_lineages.md           - hivefiver vs hiveminder distinction   │
│  4. platform_detection.md     - Multi-platform activation contracts   │
│  5. conditional_loading.md    - Turn-by-turn vs workflow loading      │
│  6. delegation_network.md     - Agent-to-skill mapping                │
│  7. knowledge_references.md   - Governance artifact links             │
│  8. gap_analysis.md           - Missing pieces and future expansion   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: When to Activate

### 2.1 Activation Conditions

| Condition | Trigger Type | Action |
|-----------|--------------|--------|
| **Session Start** | Automatic | Load on first message |
| **Compaction Recovery** | Automatic | Load after `/clear` or context truncation |
| **User Mentions** | Semantic | "hive", "hivemind", "framework", "meta", "skill" |
| **Context Confusion** | Detection | Agent unsure which lineage or workflow |
| **Platform Mismatch** | Detection | Framework files exist but wrong platform detected |
| **Lineage Query** | Semantic | "hiveminder or hivefiver", "which lineage" |
| **Skill Routing Query** | Semantic | "which skill", "skill hierarchy" |

### 2.2 Activation Bypass Rules

**DO NOT Activate When:**

| Condition | Threshold | What to Use Instead |
|-----------|-----------|---------------------|
| Context depth >70% | Skip activation | Defer to `context-intelligence-entry` |
| Session state degraded | `interrupted` or `degraded` | Skip activation |
| Active skills ≥3 | Stack budget exhausted | Skip activation |
| Domain work (not framework) | User doing project work | Use domain-specific skills directly |
| Another meta-skill active | Conflict | Defer to active meta-skill |
| First message is trivial | Simple query | Handle directly |

---

## Part 3: Two Lineages Model

### 3.1 Lineage Distinction

The HiveMind framework supports **TWO distinct lineages** with different purposes:

| Lineage | Purpose | Primary Agent | Work Type |
|---------|---------|---------------|-----------|
| **hivefiver** | Meta-builder |`hivefiver.md` | Framework development, skill creation, agent orchestration |
| **hiveminder** | Project-oriented | `hiveminder.md` | Product development, implementation, verification |

### 3.2 Lineage Detection Logic

```yaml
LINEAGE DETECTION:
├── Check current agent name:
│   ├── hivefiver → LINEAGE = meta-builder
│   ├── hiveminder →LINEAGE = project-oriented
│   └── Other → Check session context for lineage hint
│
├── Check task context:
│   ├── "write a skill", "create agent", "fix framework" → hivefiver
│   ├── "implement feature", "fix bug", "add test" → hiveminder
│   └── Ambiguous → Ask clarifying question
│
└── Check file paths:
    ├── `.opencode/skills/`, `.opencode/agents/` → hivefiver
    └── `src/`, `tests/`, `docs/` → hiveminder
```

### 3.3 Lineage-Specific Delegation

| Lineage | When to Use | Delegate To | Skills Route |
|---------|-------------|-------------|--------------|
| **hivefiver** | Framework work | Sub-hivefiver agents | `use-hivemind-skill-writer`, `hivemind-skill-write` |
| **hiveminder** | Project work | Sub-hiveminder agents | Domain skills, GSD agents |

---

## Part 4: Platform Detection

### 4.1 Supported Platforms

| Platform | Detection Mechanism | Skill Loading |
|----------|---------------------|---------------|
| **OpenCode** | `.opencode/` dir, `opencode.json`, `AGENTS.md` | `skill` tool loads `.opencode/skills/*/SKILL.md` |
| **Claude Code** | `.claude/` dir, `CLAUDE.md` | `skill` tool loads skills |
| **Cursor** | `.cursor/` dir, `cursor.json`, `.cursorrules` | Rules system |
| **Codex** | `.codex/` dir, `CODEX.md` | Task context |
| **Gemini** | `.gemini/` dir with `agents/`, `commands/` | Prompt engineering |
| **Windsurf** | `.windsurf/` dir, `windsurf.json` | TBD|
| **Kilocode** | `.kilocode/` dir | TBD |
| **Antigravity** | `.antigravity/` dir | TBD |

### 4.2 Platform-Specific Activation

```yaml
PLATFORM ACTIVATION:
├── OpenCode:
│   ├── Load: skill tool with name "use-hivemind"
│   ├── Verify: AGENTS.md exists in project root
│   ├── Permissions: Check permission.bash, permission.task, permission.skill
│   └── Hooks: Validate event, tool.execute.before, tool.execute.after registries
│
├── Claude Code:
│   ├── Load: skill tool with name "use-hivemind"
│   ├── Verify: CLAUDE.md exists in project root
│   ├── Permissions: Check MCP tool access
│   └── Prompts: Validate agent prompt chain
│
├── Cursor:
│   ├── Load: Rules system with cursorrules import
│   ├── Verify: cursor.json or .cursorrules exists
│   └── Configuration: Validate rules precedence
│
├── Codex:
│   ├── Load: Task context injection
│   ├── Verify: CODEX.md exists
│   └── Instructions: Validate instruction files
│
└── Gemini:
    ├── Load: Prompt engineering injection
    ├── Verify: agents/ and commands/ structure
    └── Prompts: Validate prompt templates
```

### 4.3 Platform Terminology Mapping

| Concept | OpenCode | Claude Code | Cursor | Codex | Gemini |
|---------|----------|-------------|--------|-------|--------|
| **Skill** | SKILL.md loaded via `skill` tool | Skill file | Rule | Task | Prompt |
| **Agent** | `.opencode/agents/*.md` | Agent config | Rules config | Task config | Prompt config |
| **Tool** | Built-in capability | MCP tool | Editor capability | API | Model capability |
| **Task** | Work unit with delegation | Work item | Action | Task | Request |
| **Rule** | Permission boundary | Permission | Cursorrule | Constraint | Instruction |
| **Permission** | Access control | Tool permission | File access | API scope | Model scope |
| **Context** | Loaded instruction surface | Message history | Rule context | Task context | Prompt context |
| **Session** | Conversation instance | Chat instance | Editor session | Task run | Conversation |

---

## Part 5: Conditional Loading Rules

### 5.1 Granularity Model

| Granularity | When to Use | Loading Pattern |
|-------------|-------------|-----------------|
| **Per-Turn** | Fine-grained control, context budget | Load one skill at a time |
| **Per-Workflow** | Predictable multi-step work | Load skill set at workflow start |
| **Per-Session** | Persistent context needed | Loadonce, cache for session duration |
| **Conditional** | Dynamic based on context | Load when condition met |

### 5.2 Session Start Loading

```yaml
SESSION START:
├── ALWAYS LOAD:
│   └── use-hivemind (this skill) - Sets framework context
│
├── CONDITIONALLY LOAD:
│   ├── If context_health >70%:
│   │   └── context-intelligence-entry (rot check)
│   │
│   ├── If session_resumed:
│   │   └── use-hivemind-session-resume (state retrieval)
│   │
│   └── If delegation_context:
│       └── use-hivemind-delegation (handoff processing)
│
└── NEVER LOAD AT START:
    ├── use-hivemind-skill-writer (only for skill work)
    ├── use-hivemind-git-memory (only for git memory)
    └── Domain-specific skills (only for domain work)
```

###5.3 Context Confusion Loading

```yaml
CONTEXT CONFUSION DETECTED:
├── Drift > threshold:
│   └── use-hivemind-context-integrity
│
├── Pollution detected:
│   └── use-hivemind-context-verify
│
├── Chain break:
│   └── use-hivemind-delegation
│
├── Platform mismatch:
│   └── Platform resolution workflow
│
└── Lineage unclear:
    └── Ask clarifying question
```

### 5.4 Workflow Loading

```yaml
WORKFLOW START:
├── Skill authoring workflow:
│   └── use-hivemind-skill-writer → hivemind-skill-write → hivemind-skill-doctor
│
├── Context recovery workflow:
│   └── use-hivemind-context-integrity → context-intelligence-entry → context-entry-verify
│
├── Delegation workflow:
│   └── use-hivemind-delegation → opencode-delegation
│
├── Git memory workflow:
│   └── use-hivemind-git-memory → git-atomic-memory
│
└── Session resume workflow:
    └── use-hivemind-session-resume → use-hivemind-git-memory
```

---

## Part 6: Delegation Network

### 6.1 Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ORCHESTRATOR LEVEL                           │
│  hiveminder (project) / hivefiver (meta-builder)                    │
│  - Do not Read, Write, Edit, Execute, Plan, Search                 │
│  - DO delegate, handoff, coordinate, orchestrate, gatekeep          │
└─────────────────────────────────────────────────────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ SUB-AGENTS      │ │ SUB-AGENTS      │ │ SUB-AGENTS      │
│ (hivefiver)     │ │ (hiveminder)    │ │ (Shared)        │
│                 │ │                 │ │                 │
│ hivehealer      │ │ hivehealer      │ │ hivexplorer     │
│ hiveq           │ │ hiveq           │ │ hiverd          │
│ hiveplanner     │ │ hiveplanner     │ │                 │
│ hivemaker       │ │ hivemaker       │ │                 │
│ hitea           │ │ hitea           │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         GSD AGENTS (24)                              │
│  Workflow execution agents for specific task types                  │
│  gsd-planner, gsd-executor, gsd-verifier, gsd-debugger, etc.        │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Agent Skill Routing

| Agent | Role | Skills Route |
|-------|------|---------------|
| **hivefiver** | Meta-builder orchestrator | `use-hivemind-skill-writer`, `hivemind-skill-write` |
| **hiveminder** | Project orchestrator | Domain skills, GSD agent dispatch |
| **hivexplorer** | Read/investigate | `research-methodology`, `context-intelligence-entry` |
| **hiverd** | Research/synthesis | `research-methodology`, `spec-distillation` |
| **hiveq** | Quality audit | `hivemind-skill-doctor`, `context-entry-verify` |
| **hiveplanner** | Planning | `ralph-tasking`, `spec-distillation` |
| **hivemaker** | Implementation | Domain-specific implementation skills |
| **hivehealer** | Debugging/repair | `hivemind-skill-doctor`, systematic debugging |
| **hitea** | Testing/verification | `context-entry-verify`, TDD patterns |

### 6.3 Delegation Patterns

```yaml
DELEGATION PATTERNS:
├── TaskTool Pattern (OpenCode):
│   ├── Bounded packet with clear scope
│   │   └── TaskTool call with explicit subagent_type
│   ├── Result contract established
│   │   └── Return format specified
│   └── Parent context preserved
│       └── Handoff packet processing
│
├── Action Gate Pattern:
│   ├── Trust score threshold
│   │   └── Minimum trust required for action type
│   ├── Rot level check
│   │   └── Context health gate
│   └── Permission envelope
│       └── Permission boundary enforcement
│
└── Bounded Packet Pattern:
    ├── Scope declaration
    │   └── What subagent can/cannot do
    ├── Previous turn artifacts
    │   └── Handoff context
    └── Result contract
        └── Expected return format
```

---

## Part 7: Knowledge References

### 7.1 Framework Sync Knowledge

| Artifact | Purpose | Location |
|----------|---------|----------|
| `AGENTS.md` | Framework governance | Project root |
| `opencode.json` | OpenCode configuration | Project root |
| `.opencode/agents/*.md` | Agent definitions | `.opencode/agents/` |
| `.opencode/skills/*/SKILL.md` | Skill definitions | `.opencode/skills/` |
| `skills/registry.yaml` | Skill registry | `skills/` |
| `src/schema-kernel/` | Contract authority | `src/schema-kernel/` |
| `src/sdk-supervisor/` | Orchestration authority | `src/sdk-supervisor/` |

### 7.2 Custom Tools Reference

| Tool | Location | Purpose |
|------|----------|---------|
| `hivemind_runtime_status` | `src/tools/runtime/` | Runtime state inspection |
| `hivemind_runtime_command` | `src/tools/runtime/` | Runtime command execution |
| `hivemind_doc` | `src/tools/doc/` | Documentation operations |
| `hivemind_task` | `src/tools/task/` | Task management |
| `hivemind_trajectory` | `src/tools/trajectory/` | Trajectory tracking |
| `hivemind_handoff` | `src/tools/handoff/` | Handoff packet processing |

### 7.3 SDK Hooks Reference (17 Available)

| Hook | Status | Usage |
|------|--------|-------|
| `event` | Used | All OpenCode lifecycle events |
| `chat.message` | Available | Track messages per-session |
| `chat.params` | Available | Control temperature/topP/topK |
| `chat.headers` | Available | Custom auth headers |
| `permission.ask` | Used | Gate file/state mutations |
| `command.execute.before` | Used | Pre-command context injection |
| `tool.execute.before` | Used | Pre-validate tool args |
| `tool.execute.after` | Used | Post-tool observation |
| `tool.definition` | Available | Dynamically modify tool definitions |
| `shell.env` | Used | Inject environment variables |
| `system.transform` | Used | Modify system prompt |
| `messages.transform` | Used | Transform message history |
| `session.compacting` | Used | Customize compaction prompt |
| `config` | Available | React to config changes |
| `auth` | Available | OAuth and API key flows |
| `text.complete` | Available | Streaming text injection |

### 7.4 Permission Patterns

```yaml
PERMISSION PATTERNS:
├── Agent Frontmatter:
│   ├── permission.bash: boolean
│   ├── permission.task: boolean
│   ├── permission.question: boolean
│   └── permission.skill: string[]
│
├── Action Gates:
│   ├── read_files: trust.score ≥ 0.4
│   ├── write_files: trust.score ≥ 0.6 AND rot ≤ DEGRADED
│   ├── delete_files: trust.score ≥ 0.8 AND rot ≤ SUSPECT
│   ├── execute_commands: trust.score ≥ 0.7 AND rot ≤ DEGRADED
│   ├── delegate: trust.score ≥ 0.6 AND rot ≤ POLLUTED
│   └── claim_completion: trust.score ≥ 0.8 AND rot ≤ DEGRADED│
└── Context Envelope:
    ├── Session context: session_id, lineage, parent_context
    ├── Permission context: permission envelope, action gates
    └── Trust context: trust.score, rot_level
```

---

## Part 8: Gap Analysis

### 8.1 Missing Components

| Component | Status | Priority | Action |
|-----------|--------|----------|--------|
| `use-hivemind` master skill | **MISSING** | P0 | Create this skill |
| `use-hivemind-context-integrity` | MISSING | P0 | Create entry router |
| `use-hivemind-context-verify` | MISSING | P0 | Create entry router |
| `use-hivemind-delegation` | MISSING | P1 | Create entry router |
| `use-hivemind-git-memory` | MISSING | P1 | Rename from git-atomic-memory |
| `use-hivemind-hierarchy` | MISSING | P1 | Rename from agent-role-boundary |
| `use-hivemind-session-resume` | MISSING | P2 | Create entry router |
| Platform adapters | PARTIAL | P2 | Complete Windsurf, Kilocode, Antigravity |

### 8.2 Skills Requiring Alignment

| Current Name | Target Name | Status | Action |
|--------------|-------------|--------|--------|
| `git-atomic-memory` | `use-hivemind-git-memory` | EXISTS | Rename and create entry router |
| `context-intelligence-entry` | Implementation for `use-hivemind-context-integrity` | EXISTS | Create entry router |
| `context-entry-verify` | Implementation for `use-hivemind-context-verify` | EXISTS | Create entry router |
| `agent-role-boundary` | `use-hivemind-hierarchy` | EXISTS | Rename and thin routing layer |
| `hivemind-skill-writer` | Role confusion | EXISTS | Merge and clarify entry vs implementation |

### 8.3 Future Expansion Points

| Expansion | Description | Prerequisite |
|-----------|-------------|--------------|
| Platform adapters for Windsurf | Mapping rules for Windsurf IDE | Platform detection |
| Platform adapters for Kilocode | Mapping rules for Kilocode | Platform detection |
| Platform adapters for Antigravity | Mapping rules for Antigravity | Platform detection |
| Voice-activated workflow | Voice commands for skill activation | All entry skills complete |
| Multi-language support | Skill descriptions in multiple languages | Core skills stable |
| Learning mode | Track skill effectiveness and improve | Skill metrics infrastructure |

---

## Part 9: Implementation Checklist

### 9.1 Phase 1: Master Skill Creation (P0)

- [ ] Create `.opencode/skills/use-hivemind/SKILL.md`
- [ ] Add frontmatter with all required fields
- [ ] Implement `when_to_activate` section
- [ ] Implement `when_not_to_activate` section
- [ ] Implement `two_lineages` section
- [ ] Implement `platform_detection` section
- [ ] Implement `conditional_loading` section
- [ ] Implement `delegation_network` section
- [ ] Implement `knowledge_references` section
- [ ] Implement `gap_analysis` section
- [ ] Create reference files in `references/` directory
- [ ] Validate with Skill-Judge ≥3.5
- [ ] Add to `skills/registry.yaml`

### 9.2 Phase 2: Entry Skill Alignment (P0)

- [ ] Create `use-hivemind-context-integrity/SKILL.md`
- [ ] Create `use-hivemind-context-verify/SKILL.md`
- [ ] Rename `git-atomic-memory` → `use-hivemind-git-memory`
- [ ] Resolve `hivemind-skill-writer` conflict
- [ ] Validate all entry skills with Skill-Judge ≥3.5

### 9.3 Phase 3: Delegation Network (P1)

- [ ] Create `use-hivemind-delegation/SKILL.md`
- [ ] Create `use-hivemind-hierarchy/SKILL.md`
- [ ] Document action gate thresholds
- [ ] Implement permission envelope enforcement
- [ ] Validate delegation patterns

### 9.4 Phase 4: Session Management (P2)

- [ ] Create `use-hivemind-session-resume/SKILL.md`
- [ ] Implement session state retrieval
- [ ] Implement git anchor integration
- [ ] Implement handoff packet processing

---

## Part 10: Conflict Prevention Matrix

### 10.1 Skill Boundary Rules

| Rule | Description | Enforcement |
|------|-------------|-------------|
| **Entry Only** | `use-hivemind` ONLY routes, never implements | SKILL.md routing section |
| **No Trigger Overlap** | Same trigger phrase routes to ONE skill only | Registry validation |
| **Max 5 Triggers** | Each skill has maximum 5 primary trigger phrases | Skill-Judge Trigger ≥3.0 |
| **Hierarchy Preserved** | L0→ L1 → L2 strict ordering | Entry level in frontmatter |
| **No Duplicate Files** | Skill exists in ONE location (`.opencode/skills/`) | File audit |

### 10.2 Trigger Phrase Exclusivity

| Trigger | Skill | No Overlap With |
|---------|-------|-----------------|
| "use hivemind" | use-hivemind (this skill) | All other use-hivemind-* (branches) |
| "context drift" | use-hivemind-context-integrity | context-intelligence-entry (implementation) |
| "write a skill" | use-hivemind-skill-writer | hivemind-skill-write (implementation) |
| "audit skill" | use-hivemind-skill-writer → routes to hivemind-skill-doctor | (proper routing) |
| "git memory" | use-hivemind-git-memory | git-atomic-memory (implementation) |
| "delegate" | use-hivemind-delegation | delegation-framework (deprecated) |
| "role boundary" | use-hivemind-hierarchy | agent-role-boundary (deprecated) |
| "resume session" | use-hivemind-session-resume | session-memory-resume (uncreated) |

---

## References

| Reference | Location | Purpose |
|-----------|----------|---------|
| AGENTS.md | Project root | Framework governance authority |
| use-hivemind-skill-writer SKILL.md | `.opencode/skills/` | Entry router pattern |
| use-hivemind-skill-family-plan | `docs/plans/` | Skill family refactoring |
| use-hivemind-ecosystem-refactor-plan | `docs/plans/` | Ecosystem refactoring |
| context-intelligence-entry SKILL.md | `.opencode/skills/` | Context entry pattern |
| skills/registry.yaml | `skills/` | Skill registry |

---

## Handoff Instructions

When delegating implementation:

1. **Include this architecture document** as authoritative specification
2. **Specify phase number** (start with Phase 1: Master Skill Creation)
3. **Enforce TTD cycle** — RED first, then GREEN, then REFACTOR
4. **Validate with Skill-Judge** before claiming completion
5. **Report format:**
   - Phase X.1: Skill created/updated
   - Phase X.2: Registry updated
   - Phase X.3: Validation passed
   - Verification: Skill-Judge scores

---

**Status:** Architecture complete, ready for implementation

**Next Step:** User authorization to begin Phase 1 (Master Skill Creation)