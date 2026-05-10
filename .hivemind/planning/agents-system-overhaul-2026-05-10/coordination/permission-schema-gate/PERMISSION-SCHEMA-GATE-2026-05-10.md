# PERMISSION-SCHEMA-GATE — Authoritative Agent YAML Permission & Schema Contract

**Date:** 2026-05-10 | **Compression Tier:** 3 (Validated Report) | **Sources:** 3 | **Conflicts Resolved:** 4
**Confidence:** HIGH | **Evidence Preserved:** 37 file:line references
**Status:** WAVE-2 SYNTHESIZED — Ready for WAVE-3 audit consumption

---

## Synthesis Metadata

| Dimension | Value |
|-----------|-------|
| Input Source 1 | `RESEARCH-opencode-schema-2026-05-10.md` — OpenCode schema (371 lines) |
| Input Source 2 | `RESEARCH-hivemind-permissions-2026-05-10.md` — Hivemind enforcement (323 lines) |
| Input Source 3 | `SKELETON-2026-05-10.md` — Delegation graph (585 lines) |
| Deduplications | 8 overlapping findings merged (permission field types, mode semantics, hidden behavior) |
| Conflict Resolutions | 4 (see §Appendix A) |
| Target Consumer | WAVE-3 auditor (56 agent YAML files) |

---

## 1. OpenCode-Native YAML Fields (Authoritative)

Source: `packages/opencode/src/config/agent.ts` — `AgentSchema` definition using Effect Schema `Schema.StructWithRest`.

| Field | Type | Required | Valid Values | Default | Source | Classification |
|-------|------|----------|-------------|---------|--------|----------------|
| `description` | string | No | Any string | — | `agent.ts` AgentSchema | **OpenCode-native** |
| `mode` | literal | No | `"subagent"` \| `"primary"` \| `"all"` | `"all"` | `agent.ts` AgentSchema | **OpenCode-native** |
| `hidden` | boolean | No | `true` \| `false` | `false` | `agent.ts` AgentSchema | **OpenCode-native** |
| `temperature` | Finite number | No | 0.0–2.0 | — | `agent.ts` AgentSchema | **OpenCode-native** |
| `top_p` | Finite number | No | 0.0–1.0 | — | `agent.ts` AgentSchema | **OpenCode-native** (snake_case in YAML, camelCase `topP` in runtime) |
| `prompt` | string | No | Any string | — | `agent.ts` AgentSchema | **OpenCode-native** (also populated from markdown body) |
| `color` | string | No | `#RRGGBB` hex OR `"primary"` \| `"secondary"` \| `"accent"` \| `"success"` \| `"warning"` \| `"error"` \| `"info"` | — | `agent.ts` AgentSchema | **OpenCode-native** |
| `steps` | PositiveInt | No | Positive integer | — | `agent.ts` AgentSchema | **OpenCode-native** (replaces deprecated `maxSteps`) |
| `disable` | boolean | No | `true` \| `false` | `false` | `agent.ts` AgentSchema | **OpenCode-native** |
| `model` | object | No | `{modelID: string, providerID: string}` | — | `agent.ts` AgentSchema | **OpenCode-native** |
| `variant` | string | No | Any string | — | `agent.ts` AgentSchema | **OpenCode-native** |
| `permission` | ConfigPermission.Info | No | See §2–§3 | — | `agent.ts` AgentSchema → `config/permission.ts` | **OpenCode-native** |
| `options` | Record\<string, any\> | No | Any key-value | — | `agent.ts` AgentSchema | **OpenCode-native** (catch-all for unknown keys) |
| `tools` | Record\<string, boolean\> | No | **DEPRECATED** | — | `agent.ts` AgentSchema | **OpenCode-native** (auto-converted to `permission`) |
| `maxSteps` | PositiveInt | No | **DEPRECATED** | — | `agent.ts` AgentSchema | **OpenCode-native** (use `steps` instead) |

### Hivemind-Internal Fields (Promoted to `options`)

These fields are **NOT** recognized by OpenCode's `AgentSchema`. They survive in the parsed agent config via `StructWithRest` catch-all, which auto-promotes unknown keys into `options`. OpenCode does NOT validate or act on these fields.

| Field | Type | Purpose | Evidence of Non-Recognition |
|-------|------|---------|----------------------------|
| `depth` | string | Hivemind L0/L1/L2/L3 hierarchy classification | Not in `AgentSchema` or `Agent.Info` — RESEARCH-opencode-schema §"Fields NOT recognized" |
| `lineage` | string | Hivemind hm-*/hf-*/gate-*/stack-* lineage prefix | Not in `AgentSchema` or `Agent.Info` — same source |
| `domain` | string | Hivemind task domain classification | Not in `AgentSchema` or `Agent.Info` — same source |
| `instruction` | string | **NOT a valid OpenCode field** — OpenCode uses `prompt` or markdown body | Not in `AgentSchema` — OpenCode uses `prompt` field, not `instruction` |
| `instructions` | string | **BROKEN** — plural form never loads body content | Not in `AgentSchema` — causes SILENT DEAD agents (7 known) |
| `skills` | string/list | **NOT a frontmatter field** — skills loaded at runtime by `skill` tool | Not in `AgentSchema` — skill loading is runtime, not config-time |

**Rule for auditors:** Any `instruction`, `instructions`, or `skills` field in frontmatter is a defect. `depth`, `lineage`, and `domain` are acceptable as Hivemind-internal metadata but must be documented as such.

---

## 2. Permission Model — The `findLast` Rule

### Critical Behavior

Source: `packages/opencode/src/permission/evaluate.ts`

```typescript
const match = rules.findLast(
  (rule) => Wildcard.match(permission, rule.permission) && Wildcard.match(pattern, rule.pattern),
)
return match ?? { action: "ask", permission, pattern: "*" }
```

**The LAST matching rule wins.** This is counter-intuitive and has profound implications for YAML ordering.

### Merge Order

Source: `packages/opencode/src/permission/index.ts` — `merge()` is flat-concatenation:
```typescript
export function merge(...rulesets: Ruleset[]): Ruleset {
  return rulesets.flat()
}
```

Order: `defaults → user config → agent-specific config` — later layers always override earlier.

### Pattern Ordering Rules

| YAML Pattern Order | Result | Correct? |
|-------------------|--------|----------|
| `'*': ask` then `'hm-l2-*': allow` | `allow` wins (last match) | ✅ Correct |
| `'hm-l2-*': allow` then `'*': ask` | `ask` wins (last match) | ❌ Wrong — blocks everything |
| `'*': ask` then `'git *': allow` | `allow` wins for `git` commands | ✅ Correct |

**Iron rule for auditors:** In every pattern object under `permission:`, the wildcard `'*'` entry MUST appear BEFORE specific patterns. Specific patterns MUST come AFTER wildcards in YAML key order.

### Default Fallback

If no rule matches, the default action is `"ask"`. This means agents without explicit permission blocks will prompt for every tool use.

---

## 3. Pattern Matching Syntax

Source: `packages/opencode/src/util/wildcard.ts`

| Syntax | Behavior | Example |
|--------|----------|---------|
| `*` | Matches zero or more characters | `"hm-l2-*"` matches `hm-l2-planner`, `hm-l2-debugger` |
| `?` | Matches exactly one character | `"hm-l2-?"` matches `hm-l2-a` but not `hm-l2-ab` |
| ` *` (space+star at end) | Makes trailing part optional | `"git *"` matches both `git` and `git commit` |
| `src/**` | Matches path segments | `src/**/*.ts` matches `src/shared/helpers.ts` |

Implementation: `*` → `.*` regex, `?` → `.` regex, with anchoring (`^...$`). Case-sensitive on Unix, case-insensitive on Windows.

### Valid Permission Keys

Source: `packages/opencode/src/config/permission.ts` — `InputObject` struct

| Permission Key | Tools Gated | Rule Type | Notes |
|---------------|-------------|-----------|-------|
| `read` | `read` | Rule (action or pattern object) | File read access |
| `edit` | `write`, `edit`, `apply_patch` | Rule (action or pattern object) | **3 tools collapsed into 1 key** |
| `glob` | `glob` | Rule (action or pattern object) | File search |
| `grep` | `grep` | Rule (action or pattern object) | Content search |
| `list` | `list` | Rule (action or pattern object) | Directory listing |
| `bash` | `bash` | Rule (action or pattern object) | Shell commands |
| `task` | `task` (delegation) | Rule (action or pattern object) | Patterns match **agent names** (subagent_type) |
| `external_directory` | File I/O outside worktree | Rule (action or pattern object) | Patterns are directory/file paths |
| `todowrite` | `todowrite`, `todoread` | Action only (shorthand) | No pattern support |
| `question` | `question` | Action only (shorthand) | No pattern support |
| `webfetch` | `webfetch` | Action only (shorthand) | No pattern support |
| `websearch` | `websearch` | Action only (shorthand) | No pattern support |
| `lsp` | `lsp` | Rule (action or pattern object) | Language server protocol |
| `doom_loop` | Recovery prompts when stuck | Action only (shorthand) | No pattern support |
| `skill` | `skill` | Rule (action or pattern object) | Patterns match **skill names** |
| `plan_enter` | Plan mode entry | Action only | — |
| `plan_exit` | Plan mode exit | Action only | — |
| **Custom keys** | MCP tools, custom tools | Rule (action or pattern object) | `StructWithRest` allows arbitrary keys |

**Hivemind custom tool keys** (resolved by OpenCode natively):
`delegate-task`, `delegation-status`, `session-journal-export`, `prompt-skim`, `prompt-analyze`, `session-patch`, `run-background-command`, `configure-primitive`, `validate-restart`

### Valid Actions

| Action | Behavior |
|--------|----------|
| `"allow"` | Tool executes without user confirmation |
| `"ask"` | Tool is blocked entirely |
| `"ask"` | User is prompted for permission before execution |

---

## 4. Mode Hierarchy

Source: `packages/opencode/src/agent/agent.ts`

| Mode | Front-Facing | Tab Appearance | Delegation Target | Can Delegate | Default |
|------|-------------|----------------|-------------------|-------------|---------|
| `primary` | ✅ Yes | ✅ Appears as tab | ❌ Cannot be delegated TO via task | ✅ Can delegate if `task:` allows | — |
| `subagent` | ❌ No | ❌ No tab | ✅ Available for delegation | ✅ Can delegate if `task:` allows | — |
| `all` | Both | Both | Both | Both | **Default** if unspecified |

### Rules

| Rule ID | Rule | Rationale |
|---------|------|-----------|
| MODE-01 | `mode: subagent` agents **MUST** have `hidden: true` | Subagents should not appear in `@` autocomplete unless specifically intended |
| MODE-02 | `mode: primary` agents **MUST NOT** have `hidden: true` | Primary agents must be visible for tab selection |
| MODE-03 | Only L0 agents should be `mode: primary` | Per hierarchy: L0 = front-facing orchestrator, L1/L2 = delegated specialists |
| MODE-04 | L2 agents currently set to `mode: primary` are **MISCATEGORIZED** | `hm-l2-build`, `hm-l2-conductor`, `hm-l2-test-router` — see SKELETON §G |

### Delegation Direction

Delegation flows **DOWNWARD only**: L0 → L1 → L2 → L3. Subagent-to-subagent delegation IS allowed if the delegating agent's `task:` permission permits it.

Source: `packages/opencode/src/tool/task.ts` — delegation dispatch checks `task:` permission only, NOT mode. A `mode: subagent` agent CAN delegate to other agents.

---

## 5. Hidden Field

Source: `packages/opencode/src/config/agent.ts:24-26`

```typescript
hidden: Schema.optional(Schema.Boolean).annotate({
  description: "Hide this subagent from the @ autocomplete menu (default: false, only applies to mode: subagent)",
})
```

| Property | Value |
|----------|-------|
| Type | Boolean, optional |
| Default | `false` (not hidden) |
| Effect | Hides from `@` autocomplete AND prevents being set as default agent |
| Scope | Only meaningful for `mode: subagent` agents |
| Delegation impact | **NONE** — hidden agents CAN still be delegated to by name via `task:` |

### Rules

| Rule ID | Rule | Applies To |
|---------|------|-----------|
| HIDDEN-01 | ALL L1 agents must have `hidden: true` | `hm-l1-coordinator`, `hf-l1-coordinator` |
| HIDDEN-02 | ALL L2 agents must have `hidden: true` | All 43 hm-l2-* and 9 hf-l2-* agents |
| HIDDEN-03 | L0 orchestrators must NOT have `hidden: true` (or omit it) | `hm-l0-orchestrator`, `hf-l0-orchestrator` |

### Hivemind-Specific Behavior

Source: `RESEARCH-hivemind-permissions §5`

Hivemind's `validateAgent()` only checks agent name existence — it does NOT check `hidden` status. The `delegate-task` tool specifies agents by name explicitly, bypassing autocomplete. Therefore hidden agents are fully delegatable within Hivemind's runtime.

---

## 6. Delegation Direction Matrix

Cross-referenced with SKELETON §A (Cross-Lineage Delegation Rules) and §F (Delegation Graph).

| Source Level | Can Delegate To (task: allow) | Cannot Delegate To | Cross-Lineage |
|-------------|-------------------------------|-------------------|---------------|
| **hm-L0** | hm-l1-coordinator, hm-l2-\*, hm-l3-\* (none as agents) | hf-\* (FORBIDDEN) | ❌ hm→hf forbidden |
| **hm-L1** | hm-l2-\* (all 43 L2 agents) | hm-L0, hm-L1, hf-\* | ❌ hm→hf forbidden |
| **hm-L2 (non-delegating)** | NONE (task: ask all) | All levels | ❌ No delegation at all |
| **hm-L2 (delegating)** | Specific hm-l2-\* peers per SKELETON | hm-L0, hm-L1, hf-\* | ❌ hm→hf forbidden |
| **hf-L0** | hf-l1-coordinator, hm-l1-coordinator, hf-l2-\*, hm-l2-\* | — | ✅ hf→hm allowed |
| **hf-L1** | hf-l2-\*, hm-l2-\* | hf-L0, hf-L1, hm-L0 | ✅ hf→hm allowed |
| **hf-L2 (all)** | NONE (task: ask all) | All levels | No delegation |

### hm-L2 Delegating Agents (from SKELETON §B)

These L2 agents have specific peer delegation targets:

| Agent | task allow targets | Evidence |
|-------|--------------------|----------|
| hm-l2-planner | hm-l2-architect, hm-l2-strategist | SKELETON §B L2 table |
| hm-l2-executor | hm-l2-reviewer | SKELETON §B L2 table |
| hm-l2-debugger | hm-l2-investigator | SKELETON §B L2 table |
| hm-l2-researcher | hm-l2-synthesizer | SKELETON §B L2 table |
| hm-l2-reviewer | hm-l2-validator | SKELETON §B L2 table |

All other hm-L2 agents have `task: NONE` (non-delegating).

### Cross-Lineage Enforcement Note

Source: `RESEARCH-hivemind-permissions §7`

Cross-lineage rules (hm→hf forbidden, hf→hm allowed) are **prompt-level constraints only**. There is NO programmatic enforcement in `src/`. The LLM is instructed to follow lineage rules but nothing prevents code-level violation. The `task:` permission patterns in agent YAML are the primary enforcement mechanism.

---

## 7. Per-Level Permission Templates

These templates are derived from SKELETON §A (Level Rules + Skill Loading Rules) cross-referenced with OpenCode schema requirements.

### Template A: hm-L0 Orchestrator (`hm-l0-orchestrator`)

```yaml
---
description: "Front-facing orchestrator for hm-* product development lineage"
mode: primary
hidden: false              # L0 is front-facing — MUST be visible
temperature: 0.3
color: "#..."
steps: 50

permission:
  read: allow
  edit: allow
  glob: allow
  grep: allow
  list: allow
  bash: allow
  task:
    "*": ask
    "hm-l1-coordinator": allow
    "hm-l2-*": allow
    "hm-l3-*": allow
  skill:
    "*": ask
    "hm-l1-*": allow
    "hm-l2-*": allow
    "hm-l3-*": allow
    "gate-l3-*": allow
    "stack-l3-*": allow
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  configure-primitive: allow
  validate-restart: allow
  todowrite: allow
  question: allow
  webfetch: allow
  websearch: allow
---
```

### Template B: hf-L0 Orchestrator (`hf-l0-orchestrator`)

```yaml
---
description: "Front-facing orchestrator for hf-* meta-builder lineage"
mode: primary
hidden: false
temperature: 0.25
color: "#..."
steps: 50

permission:
  read: allow
  edit: allow
  glob: allow
  grep: allow
  list: allow
  bash: allow
  task:
    "*": ask
    "hf-l1-coordinator": allow
    "hm-l1-coordinator": allow
    "hf-l2-*": allow
    "hm-l2-*": allow
  skill:
    "*": ask
    "hf-l2-*": allow
    "hm-l2-*": allow
    "hm-l3-*": allow
    "gate-l3-*": allow
    "stack-l3-*": allow
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  configure-primitive: allow
  validate-restart: allow
  todowrite: allow
  question: allow
  webfetch: allow
  websearch: allow
---
```

### Template C: hm-L1 Coordinator (`hm-l1-coordinator`)

```yaml
---
description: "Mid-handoff coordinator for hm-* lineage — dispatches L2 specialists"
mode: subagent
hidden: true               # L1 is NOT front-facing
temperature: 0.15
steps: 50

permission:
  read: allow
  edit:
    "*": ask
    "src/**": allow
  glob: allow
  grep: allow
  list: allow
  bash:
    "*": ask
    "git *": allow
    "npm *": allow
    "npx *": allow
  task:
    "*": ask
    "hm-l2-*": allow
  skill:
    "*": ask
    "hm-l2-*": allow
    "hm-l3-*": allow
    "gate-l3-*": allow
    "stack-l3-*": allow
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  todowrite: allow
  question: ask
  webfetch: ask
  websearch: ask
---
```

### Template D: hf-L1 Coordinator (`hf-l1-coordinator`)

```yaml
---
description: "Mid-handoff coordinator for hf-* lineage — dispatches L2 meta-builders"
mode: subagent
hidden: true
temperature: 0.15
steps: 50

permission:
  read: allow
  edit:
    "*": ask
    ".opencode/**": allow
    ".hivefiver-meta-builder/**": allow
  glob: allow
  grep: allow
  list: allow
  bash:
    "*": ask
    "git *": allow
    "npm *": allow
    "npx *": allow
  task:
    "*": ask
    "hf-l2-*": allow
    "hm-l2-*": allow
  skill:
    "*": ask
    "hf-l2-*": allow
    "hm-l2-*": allow
    "hm-l3-*": allow
    "gate-l3-*": allow
    "stack-l3-*": allow
  delegate-task: allow
  delegation-status: allow
  session-journal-export: allow
  todowrite: allow
  question: ask
  webfetch: ask
  websearch: ask
---
```

### Template E: hm-L2 Non-Delegating Specialist (most L2 agents)

```yaml
---
description: "[Domain specialist description]"
mode: subagent
hidden: true               # ALL L2 are NOT front-facing
temperature: [0.05–0.25 per domain]
steps: 50

permission:
  read: allow
  edit: allow               # OR ask if read-only specialist
  glob: allow
  grep: allow
  list: allow
  bash: ask                 # Default: ask for bash
  task:
    "*": ask                # Non-delegating: NO children
  skill:
    "*": ask
    "hm-l2-*": allow
    "hm-l3-*": allow
    "gate-l3-*": allow
    "stack-l3-*": allow
  delegate-task: ask        # Non-delegating
  delegation-status: ask
  todowrite: allow
  question: ask
  webfetch: ask
  websearch: ask
---
```

### Template F: hm-L2 Delegating Specialist (planner, debugger, executor, researcher, reviewer)

```yaml
---
description: "[Domain specialist with peer delegation]"
mode: subagent
hidden: true
temperature: [0.05–0.25 per domain]
steps: 50

permission:
  read: allow
  edit: allow
  glob: allow
  grep: allow
  list: allow
  bash: ask
  task:
    "*": ask
    "[specific-target-1]": allow
    "[specific-target-2]": allow
  skill:
    "*": ask
    "hm-l2-*": allow
    "hm-l3-*": allow
    "gate-l3-*": allow
    "stack-l3-*": allow
  delegate-task: ask
  delegation-status: ask
  todowrite: allow
  question: ask
  webfetch: ask
  websearch: ask
---
```

**Specific delegation targets (from SKELETON):**

| Delegating Agent | task allow targets |
|-----------------|-------------------|
| hm-l2-planner | `"hm-l2-architect": allow`, `"hm-l2-strategist": allow` |
| hm-l2-executor | `"hm-l2-reviewer": allow` |
| hm-l2-debugger | `"hm-l2-investigator": allow` |
| hm-l2-researcher | `"hm-l2-synthesizer": allow` |
| hm-l2-reviewer | `"hm-l2-validator": allow` |

### Template G: hf-L2 Meta-Building Specialist (all 9 hf-l2-*)

```yaml
---
description: "[Meta-builder specialist description]"
mode: subagent
hidden: true
temperature: [0.05–0.2 per specialist]
steps: 50

permission:
  read: allow
  edit: allow               # Most hf-L2 need edit for .opencode/ primitives
  glob: allow
  grep: allow
  list: allow
  bash: ask
  task:
    "*": ask                # hf-L2 does NOT delegate agents
  skill:
    "*": ask
    "hf-l2-*": allow
    "hm-l2-*": allow
    "hm-l3-*": allow
    "gate-l3-*": allow
    "stack-l3-*": allow
  delegate-task: ask
  delegation-status: ask
  todowrite: allow
  question: ask
  webfetch: ask
  websearch: ask
---
```

**Exception:** `hf-l2-prompter` has `edit: allow` and `write: allow` (confirmed in SKELETON).

---

## 8. Known Violations to Audit For

Each violation type includes a severity, detection method, and remediation guidance for WAVE-3.

### V-01: Missing `hidden: true` on L1/L2 Agents
- **Severity:** HIGH
- **Detection:** Check all hm-l1-*, hf-l1-*, hm-l2-*, hf-l2-* agents for `hidden: true` in frontmatter
- **Remediation:** Add `hidden: true` to any L1/L2 agent missing it
- **Source:** SKELETON §G HIGH items; OpenCode hidden semantics

### V-02: `mode: primary` on L2 Agents
- **Severity:** CRITICAL
- **Detection:** Check for `mode: primary` on any agent NOT at L0
- **Known violations:** hm-l2-build, hm-l2-conductor, hm-l2-test-router (SKELETON §G)
- **Remediation:** Change to `mode: subagent` and add `hidden: true`

### V-03: Missing `task:` Children on Agents That SHOULD Delegate
- **Severity:** HIGH
- **Detection:** Cross-reference SKELETON §F delegation graph with agent YAML — agents listed as delegating targets must have `task: { '*': ask, [target]: allow }`
- **Known delegating agents:** hm-l2-planner, hm-l2-executor, hm-l2-debugger, hm-l2-researcher, hm-l2-reviewer
- **Remediation:** Add specific `task:` allow entries matching delegation graph

### V-04: `task:` Children Set to `ask` Instead of `allow`
- **Severity:** HIGH
- **Detection:** Check every pattern under `task:` — delegating agents must have `allow` for their delegation targets
- **Remediation:** Change `ask` to `allow` for specific delegation target patterns

### V-05: Missing `skill:` Children
- **Severity:** HIGH
- **Detection:** ALL L2 agents need skill children: `hm-l2-*: allow, hm-l3-*: allow, gate-l3-*: allow, stack-l3-*: allow`
- **Remediation:** Add missing skill permission patterns per template

### V-06: Wrong Delegation Direction
- **Severity:** CRITICAL
- **Detection:** Check if any hm-* agent has `task:` allow for hf-* or L0/L1 agents
- **Remediation:** Remove upward/cross-lineage delegation targets from hm-* agents

### V-07: Cross-Lineage Violations
- **Severity:** HIGH
- **Detection:** hm-* agents must NOT have hf-* in task/skill allow patterns (except hf-L0/L1 which CAN delegate hm-*)
- **Remediation:** Remove hf-* patterns from hm-* agent permission blocks

### V-08: Hivemind-Internal Fields Not Documented
- **Severity:** MEDIUM
- **Detection:** Check for `depth`, `lineage`, `domain`, `skills`, `instruction`, `instructions` fields
- **Remediation:** Remove `instructions` (plural — causes silent dead agents); document `depth`/`lineage`/`domain` as Hivemind-internal; remove `skills` field (not a valid frontmatter key); remove `instruction` (use `prompt` or body)

### V-09: Pattern Ordering Issues (Wildcard After Specific)
- **Severity:** HIGH
- **Detection:** In every permission sub-object, check that `'*'` comes BEFORE specific patterns
- **Example violation:** `{ 'hm-l2-*': allow, '*': ask }` — wildcard incorrectly overrides specific
- **Remediation:** Reorder to `{ '*': ask, 'hm-l2-*': allow }`

### V-10: Missing `bash:` Children for Agents Needing git/node/npx
- **Severity:** MEDIUM
- **Detection:** Agents that need shell access (executor, conductor, etc.) should have specific bash patterns
- **Remediation:** Add `bash: { '*': ask, 'git *': allow, 'npm *': allow, 'npx *': allow }`

### V-11: `instructions:` (Plural) — Silent Dead Agents
- **Severity:** CRITICAL
- **Detection:** Check for `instructions:` (plural) in frontmatter — OpenCode ignores this field
- **Known violations:** 7 agents (hm-l2-context-mapper, hm-l2-context-purifier, hm-l2-critic, hm-l2-prompt-analyzer, hm-l2-prompt-repackager, hm-l2-prompt-skimmer, hm-l2-risk-assessor)
- **Remediation:** Rename to `prompt:` or move content to markdown body

### V-12: `skill:` Outside Permission Block
- **Severity:** CRITICAL
- **Detection:** Check for top-level `skill:` field (not nested under `permission:`)
- **Known violation:** hm-l2-build (SKELETON §G item 11)
- **Remediation:** Move `skill:` under `permission:` block

### V-13: `ask` vs `ask` Granularity
- **Severity:** MEDIUM
- **Detection:** ALL 56 agents use `ask` for various tools — user requested change to `ask` for granularity
- **Remediation:** Replace `ask` with `ask` across all agents for all permission keys (except where `ask` is intentional, e.g., recursive delegation prevention)

### V-14: Missing `domain` Field
- **Severity:** MEDIUM
- **Detection:** Check 15 agents with missing `domain` per SKELETON §G
- **Known missing:** hm-l2-build, hm-l2-conductor, hm-l2-context-mapper, hm-l2-context-purifier, hm-l2-critic, hm-l2-general, hm-l2-intent-loop, hm-l2-meta-synthesis, hm-l2-phase-guardian, hm-l2-prompt-analyzer, hm-l2-prompt-repackager, hm-l2-prompt-skimmer, hm-l2-risk-assessor, hm-l2-spec-verifier, hm-l2-test-router
- **Remediation:** Assign domain per SKELETON §I classification

### V-15: Missing `mode` Field
- **Severity:** HIGH
- **Detection:** Agents without explicit `mode:` default to `mode: all` — this may cause unintended tab appearance
- **Remediation:** All L1/L2 agents must have explicit `mode: subagent`

---

## Appendix A: Conflict Resolutions

| # | Conflict | Source A | Source B | Resolution | Rationale |
|---|----------|----------|----------|------------|-----------|
| 1 | Does Hivemind enforce `task:` patterns? | RESEARCH-hivemind §3: "NO" | SKELETON assumes enforcement in YAML | **Hivemind does NOT enforce patterns — OpenCode does** | RESEARCH-hivemind examined all `src/` code; no pattern matching implementation found |
| 2 | Can `mode: subagent` agents delegate? | RESEARCH-opencode: "Yes, if task: allows" | RESEARCH-hivemind: "Recursive delegation prevented by tool map" | **Both correct, different mechanisms** | OpenCode permits delegation via `task:` permission; Hivemind blocks by injecting `delegate-task: false` in child sessions |
| 3 | Are cross-lineage rules code-enforced? | SKELETON §A: "hm→hf forbidden" | RESEARCH-hivemind §7: "No code enforcement" | **Prompt-level only** | Lineage rules exist in agent system prompts and skills, not in runtime code |
| 4 | Is `name` a frontmatter field? | Some agents may have `name:` in YAML | RESEARCH-opencode §Surprise 1: "Name is derived from filename" | **NOT a frontmatter field** — set from filename by `configEntryNameFromPath()` | Explicitly documented in `agent.ts` |

---

## Appendix B: Evidence Chain

| Finding | Source File | Evidence Line |
|---------|-----------|---------------|
| AgentSchema fields | `packages/opencode/src/config/agent.ts` | `AgentSchema = Schema.StructWithRest(...)` |
| findLast evaluation | `packages/opencode/src/permission/evaluate.ts` | `rules.findLast(...)` |
| Merge = flat concat | `packages/opencode/src/permission/index.ts` | `return rulesets.flat()` |
| Glob pattern matching | `packages/opencode/src/util/wildcard.ts` | `*` → `.*` regex |
| task patterns match agent names | `packages/opencode/src/tool/task.ts` | `patterns: [params.subagent_type]` |
| Mode values | `packages/opencode/src/config/agent.ts` | `Schema.Literals(["subagent", "primary", "all"])` |
| Hidden semantics | `packages/opencode/src/config/agent.ts` | `.annotate({ description: "Hide from @ autocomplete..." })` |
| Permission actions | `packages/opencode/src/config/permission.ts` | `Schema.Literals(["ask", "allow", "ask"])` |
| edit gates 3 tools | `packages/opencode/src/permission/index.ts` | `EDIT_TOOLS` array |
| Unknown keys → options | `packages/opencode/src/config/agent.ts` | `StructWithRest` normalization |
| Hivemind passthrough | `src/schema-kernel/agent-frontmatter.schema.ts:122` | `z.record(z.string(), z.unknown()).optional()` |
| No runtime pattern enforcement | `src/coordination/delegation/manager.ts:163-198` | No glob matching in dispatch |
| Tool map injection | `src/coordination/delegation/manager.ts:56-60` | `buildDelegationPromptTools()` |
| Cross-lineage not code-enforced | `src/features/bootstrap/cross-primitive-validator.ts` | No lineage checks |
| Permission schema unused at runtime | `src/schema-kernel/permission.schema.ts` | Used by configure-primitive only |

---

## Appendix C: Quick-Reference Audit Checklist

For each of the 56 agent YAML files, WAVE-3 auditor checks:

- [ ] `mode: subagent` present on all L1/L2 agents
- [ ] `hidden: true` present on all L1/L2 agents
- [ ] No `mode: primary` on any agent below L0
- [ ] `permission.task` has correct delegation targets per SKELETON §F
- [ ] `permission.skill` has `hm-l2-*, hm-l3-*, gate-l3-*, stack-l3-*` allow patterns
- [ ] No hf-* patterns in hm-* agent `task:` or `skill:` blocks
- [ ] No `'*'` pattern AFTER specific patterns (findLast ordering)
- [ ] No `instructions:` (plural) — use `prompt:` or body content
- [ ] No `skills:` field — skills are loaded at runtime, not config-time
- [ ] No `instruction:` field — use `prompt:` or body content
- [ ] No `skill:` outside `permission:` block
- [ ] `domain:` field present (Hivemind-internal, promoted to options)
- [ ] `depth:` field present and correct (L0/L1/L2) (Hivemind-internal)
- [ ] `lineage:` field present and correct (hm/hf) (Hivemind-internal)
- [ ] `temperature:` matches domain guidelines
- [ ] `steps:` present (not deprecated `maxSteps:`)
- [ ] `ask` replaced with `ask` per user request
- [ ] `bash:` children present if agent needs shell access
- [ ] Hivemind custom tool keys (`delegate-task`, `delegation-status`, etc.) have correct allow/ask values per level
