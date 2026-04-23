# XML Markup Grammar

All 24 GSD agents use the same XML block vocabulary. These blocks are the composition language — they tell the agent what to do, in what order, with what constraints.

## Block Catalog

### `<role>` — Identity Injection

**Purpose:** Define who this agent is, what it does, and its core responsibility.

**Position:** Always first block after frontmatter.

**Required attributes:** None (plain text content).

**Structure:**
```xml
<role>
You are a GSD {agent-type}. You {core action}.

Spawned by {command/workflow}.

Your job: {one-sentence mission}.

**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<files_to_read>` block, you MUST use the `Read` tool
to load every file listed there before performing any other actions.
</role>
```

**Example (executor):**
```xml
<role>
You are a GSD plan executor. You execute PLAN.md files atomically, creating
per-task commits, handling deviations automatically, pausing at checkpoints,
and producing SUMMARY.md files.

Spawned by `/gsd-execute-phase` orchestrator.

Your job: Execute the plan completely, commit each task, create SUMMARY.md,
update STATE.md.
</role>
```

**Anti-pattern:** Don't put operational rules in `<role>`. The role is identity only. Rules go in `<deviation_rules>`, `<core_principle>`, etc.

---

### `<execution_flow>` — Ordered Step Sequence

**Purpose:** The agent's main loop. Contains `<step>` blocks in execution order.

**Position:** After `<role>` and optional context blocks.

**Required attributes:** None.

**Structure:**
```xml
<execution_flow>

<step name="load_context" priority="first">
...
</step>

<step name="analyze">
...
</step>

<step name="generate">
...
</step>

<step name="verify">
...
</step>

<step name="report">
...
</step>

</execution_flow>
```

**Key rule:** Steps execute top-to-bottom. No branching, no conditionals inside the flow — conditionals live inside individual steps.

---

### `<step name="...">` — Named Step Block

**Purpose:** A single step in the execution flow with inputs, actions, and outputs.

**Required attributes:** `name` (lowercase, underscores for spaces).

**Optional attributes:** `priority` (values: "first", "last").

**Structure:**
```xml
<step name="load_context" priority="first">
Read ALL files from `<files_to_read>`. Extract:
- What to extract
- From where
- Store how
</step>
```

**Naming conventions observed across 24 agents:**

| Prefix | Purpose | Examples |
|--------|---------|----------|
| `load_*` | Context gathering | `load_context`, `load_plan`, `load_project_state`, `load_context` |
| `analyze_*` | Analysis/processing | `analyze_gaps`, `analyze_threats` |
| `generate_*` | Creation | `generate_tests` |
| `run_*` | Execution | `run_and_verify`, `verify_and_write` |
| `check_*` | Verification | (none standalone — checks are inside steps) |
| `report` | Output generation | `report` (always last) |

**I/O contract pattern:**
- Input: from previous step's output or `<files_to_read>` block
- Output: extracted data, written files, or return format
- Failure condition: documented inside the step body

---

### `<structured_returns>` — Deterministic Output Formats

**Purpose:** Define the exact markdown format the agent returns to the orchestrator.

**Position:** After `<execution_flow>`.

**Required attributes:** None.

**Structure:**
```xml
<structured_returns>

## FORMAT_NAME

```markdown
## FORMAT_NAME

**Phase:** {N} — {name}
**Metric:** {value}/{total}

### Details
| Column | Value |
|--------|-------|
| {id} | {value} |

{output_path}: {path}
```

## ALT_FORMAT

...

</structured_returns>
```

**Naming patterns observed:**
- `SECURED` / `OPEN_THREATS` / `ESCALATE` (security auditor)
- `GAPS FILLED` / `PARTIAL` / `ESCALATE` (nyquist auditor)
- `VERIFIED` / `FAILED` / `UNCERTAIN` (verifier — per-truth status)
- `CHECKPOINT REACHED` (executor — with sub-types)

---

### `<success_criteria>` — Validation Checklist

**Purpose:** Checkbox list the agent uses to verify it completed its job correctly.

**Position:** Last block in the file (before any appendices).

**Required attributes:** None.

**Structure:**
```xml
<success_criteria>
- [ ] All `<files_to_read>` loaded before any action
- [ ] Each gap analyzed with correct test type
- [ ] Tests follow project conventions
- [ ] Structured return provided
</success_criteria>
```

**Rule:** Each criterion must be independently verifiable. No "does a good job" or "follows best practices."

---

### `<core_principle>` — Philosophy Block

**Purpose:** Non-negotiable mindset or philosophy that governs agent behavior.

**Position:** After `<role>`, before `<execution_flow>`.

**Structure:**
```xml
<core_principle>
**Task completion ≠ Goal achievement**

A task "create chat component" can be marked complete when the component
is a placeholder. The task was done — a file was created — but the goal
"working chat interface" was not achieved.
</core_principle>
```

**Usage:** Only in agents that need mindset shifts (verifier, planner). Not in execution-only agents.

---

### `<project_context>` — Discovery Protocol

**Purpose:** Standardized context discovery — AGENTS.md → skills → rules chain.

**Position:** After `<role>` (or after `<core_principle>` if present).

**Required:** Appears verbatim in all 24 agents.

**Structure:**
```xml
<project_context>
Before {action}, discover project context:

**Project instructions:** Read `./AGENTS.md` if it exists in the working
directory. Follow all project-specific guidelines, security requirements,
and coding conventions.

**Project skills:** Check `.claude/skills/` or `.agents/skills/` directory
if either exists:
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill (lightweight index ~130 lines)
3. Load specific `rules/*.md` files as needed during {action}
4. Follow skill rules relevant to your current task
</project_context>
```

---

### `<deviation_rules>` — Numbered Auto-Apply Rules

**Purpose:** Rules the agent applies automatically when encountering unplanned work.

**Position:** After `<execution_flow>`.

**Structure:**
```xml
<deviation_rules>
**While executing, you WILL discover work not in the plan.** Apply these
rules automatically. Track all deviations for Summary.

**RULE 1: Auto-fix bugs**
**Trigger:** Code doesn't work as intended
**Action:** Fix inline → verify → track

**RULE 2: Auto-add missing critical functionality**
**Trigger:** Code missing essential features
**Action:** Add → test → verify → track

**RULE 3: Auto-fix blocking issues**
**Trigger:** Something prevents completing current task
**Action:** Unblock → verify → track

**RULE 4: Ask about architectural changes**
**Trigger:** Fix requires significant structural modification
**Action:** STOP → return checkpoint → user decision required

**SCOPE BOUNDARY:**
Only fix issues DIRECTLY caused by current task's changes.
</deviation_rules>
```

**Rule priority:** Rules 1-3 auto-apply. Rule 4 stops and asks.

---

### `<checkpoint_protocol>` — Pause/Resume Gates

**Purpose:** Define when and how the agent pauses for human input.

**Position:** Inside or after `<execution_flow>`.

**Structure:**
```xml
<checkpoint_protocol>
When encountering `type="checkpoint:*"`: **STOP immediately.**

**checkpoint:human-verify** — Visual/functional verification after automation.
**checkpoint:decision** — Implementation choice needed.
**checkpoint:human-action** — Truly unavoidable manual step.
</checkpoint_protocol>
```

---

### Optional Blocks

| Block | Purpose | Used By |
|-------|---------|---------|
| `<mcp_tool_usage>` | MCP server instruction | executor, planner |
| `<context_fidelity>` | User decision enforcement | planner |
| `<scope_reduction_prohibition>` | Anti-simplification guard | planner |
| `<analysis_paralysis_guard>` | Stuck detection (read-without-action limit) | executor |
| `<authentication_gates>` | Error-as-gate for auth failures | executor |
| `<discovery_levels>` | Research depth routing | planner |
| `<philosophy>` | Agent-specific philosophy | planner |
| `<required_reading>` | External file references | verifier |

## Nesting Rules

```
SKILL.md
├── <role>                          # Top-level, always first
├── <mcp_tool_usage>                # Optional, top-level
├── <project_context>               # Top-level, after role
├── <core_principle>                # Optional, top-level
├── <execution_flow>                # Top-level
│   └── <step name="...">           # Inside execution_flow only
│       └── <step name="...">       # Nested steps allowed (rare)
├── <deviation_rules>               # Top-level, after execution_flow
├── <checkpoint_protocol>           # Top-level or inside execution_flow
├── <structured_returns>            # Top-level, after execution_flow
├── <success_criteria>              # Top-level, always last
└── <required_reading>              # Top-level, anywhere
```

**Never nest:** `<structured_returns>` inside `<execution_flow>`, or `<deviation_rules>` inside `<step>`. Returns and rules are top-level contracts.
