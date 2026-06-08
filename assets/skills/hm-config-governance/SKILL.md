---
name: hm-config-governance
description: >
  Config-driven governance for the ToolIntelligenceEngine. Use when the user
  asks about 'governance rule', 'config tool', 'action.type', 'block list',
  'warn list', 'add rule', 'remove rule', 'set severity' — or any request to
  edit `.hivemind/configs.json` `governance.rules[]`. Pattern 1 (always-loaded)
  explains config-driven governance in one paragraph; Pattern 2 (when relevant)
  loads the workflow, template, reference, and command on demand. Tech-agnostic
  + stack-agnostic. NOT for runtime engine changes (those are in
  `src/features/tool-intelligence/`), NOT for new `action.type` enum values
  (those are schema changes), NOT for hardcoded severity overrides.
metadata:
  consumed-by:
    - "hm-platform-references"
    - "hm-orchestrator"
  lineage-scope: "hm-*"
  access: "FLEXIBLE"
  role: "config-governor"
  pattern: "P1-2-Loader"
  realm: "clean-code,doc"
version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - delegate-task
  - delegation-status
---

# Config Governance

`ToolIntelligenceEngine` is **config-driven**: severity always comes from
`.hivemind/configs.json` `governance.rules[]` and the `action.type` of each
enabled rule. The 4 detectors (R1-malformed-task, R2-child-recursive-task,
R3-root-task, R4-delegate-task-code-intent) classify events; the config
decides the severity. Default (no rule match) → `allow`. Adding a rule
means appending an entry to `governance.rules[]`; changing a rule's
severity means editing `action.type`; nothing about engine internals
changes.

## When This Skill Loads — Do This First

1. **Read the user's request.** If it mentions `'governance rule'`,
   `'config tool'`, `'action.type'`, `'block list'`, `'warn list'`,
   `'add rule'`, `'remove rule'`, or `'set severity'`, this skill is
   in scope. If the user is asking for a runtime engine change, STOP
   and route to `hm-architect` instead.
2. **Decide read vs edit.** Reading existing rules → load
   `assets/references/hm-config-governance.md` and answer in place.
   Editing rules → load the workflow + template below and walk the
   user through the 7-turn editor.
3. **Route to the agent.** Editing always goes through
   `hm-platform-references` (the `hm-config-govern` command's target
   agent). Do not edit `.hivemind/configs.json` from a specialist
   agent — the command is the canonical entry point.
4. **Validate after every change.** The workflow calls
   `validateConfigsFile(projectRoot)` at T4; the resulting engine
   singleton is reset at T6 via `resetToolIntelligenceEngine()`.

## Cross-References (Pattern 2 — load on demand)

| Resource | Path | When to load |
|---|---|---|
| Authoritative reference | `assets/references/hm-config-governance.md` | Always read first when adding/editing/debugging a rule. Covers action.type semantics, built-in rule IDs, anti-patterns. |
| Drop-in starter | `assets/templates/config-rules.template.json` | When the user wants to add their first rule or copy a known-good shape. |
| TUI workflow | `assets/workflows/hm-config-edit.md` | When the user wants the interactive 7-turn editor. The command routes here. |
| User-facing command | `assets/commands/hm-config-govern.md` | When the user wants the `/hm-config-govern` command reference (flags, scope, examples). |

All 4 paths resolve to existing files in the repo. The reference is the
**authoritative** source for action.type semantics and built-in rule IDs.

## How the Engine Consults Config

`ToolIntelligenceEngine` accepts an inline `governance.rules[]` array at
construction. For each `evaluateToolCall(event)`:

1. The 4 detectors classify the event into a `detectorRuleId` if a known
   pattern fires (R1: missing subagent_type, R2: child-session recursion,
   R4: code/artifact intent). R3 (root task dispatch) has no detector —
   it falls through to the config walker.
2. The walker (`findMatchingRule`) walks `governance.rules[]` in order
   and returns the first enabled rule whose `condition` matches the
   event's `toolName` / `sessionID` / `delegationDepth`.
3. R-prefixed rules only fire when the calling detector passed the
   matching id. Bare toolName matching is reserved for non-detector
   rules.
4. The matched rule's `action.type` becomes the decision `kind`.
   Default (no match) → `allow`.

This means a rule change is a pure config edit — no engine code changes.
The engine does the lookup, the config is the source of truth.

## Action Types — What Each Means

| `action.type`     | Engine behavior | When to use |
|-------------------|-----------------|-------------|
| `allow`           | Tool call proceeds silently. | Default. Use to permit a tool for a context where you'd otherwise warn. |
| `warn`            | Tool call proceeds; soft warning is logged + surfaced to the agent. | "I want to know about this, but don't stop it." |
| `block`           | Tool call is hard-rejected. | Hard safety boundary (e.g. malformed dispatch). |
| `escalate`        | Treated as `needs_jit_grant` at runtime; requires explicit JIT grant. | Human escalation required. |
| `needs_jit_grant` | Tool call is held; an explicit JIT grant must be issued to proceed. | Recursive task in child session, sensitive tools, etc. |

The set is closed. Adding a new `action.type` requires both a Zod schema
change and a runtime map update — out of scope for this skill.

## Built-in Rule IDs the Engine Consults

| Rule ID                        | Default if no config rule | What it gates |
|--------------------------------|---------------------------|---------------|
| `R1-malformed-task`            | `block`                   | `task` calls missing `subagent_type`. |
| `R2-child-recursive-task`      | `needs_jit_grant`         | `task` called from a child session without a JIT grant. |
| `R4-delegate-task-code-intent` | `block`                   | `delegate-task` whose prompt looks like code editing. |
| `default`                      | `allow`                   | Anything that doesn't match a higher-priority rule. |

Add a config rule with the matching `id` to override the default. The
config rule's `action.type` wins; the default is a last-resort fallback.

## How to Add a Rule (worked example)

User says: "I want `bash` and `write` to be hard-blocked for any tool
that isn't the root orchestrator."

1. Open `assets/templates/config-rules.template.json` to copy the shape.
2. Add an entry to `.hivemind/configs.json` under `governance.rules[]`:

   ```jsonc
   {
     "id": "R5-block-bash-write",
     "condition": { "toolNames": ["bash", "write"] },
     "action":   { "type": "block" },
     "enabled":  true
   }
   ```

3. Run the editor (`hm-config-govern` command) which will:
   - Validate the new shape against `.hivemind/configs.schema.json` (T4).
   - Show a before/after diff and ask for confirmation (T5).
   - Write atomically and call `resetToolIntelligenceEngine()` (T6).
   - Suggest a commit message: `feat(config): add rule R5-block-bash-write`.

4. Verify with a unit test under
   `tests/features/tool-intelligence/` that asserts the new rule's effect
   on `evaluateToolCall`.

## Authoring Tips

- **One rule per tool/category.** Avoid mega-rules with 10+ toolNames —
  split for clarity and per-tool `enabled: false` toggles.
- **Use `depth.max: 0`** to apply a rule only to the root session.
- **Use `depth.min: 1`** to apply to all child sessions (the common
  recursive-task case).
- **Keep `id` stable.** The engine uses the id as a key — renaming is a
  breaking change.
- **Test after editing.** Add a unit test that asserts the rule's effect
  on `evaluateToolCall`.

## Anti-Patterns

- Hardcoding severity in code. Always go through config.
- Adding a new `action.type` without updating both the Zod schema and
  the runtime map.
- Setting `action.type: "block"` on a rule that should be overridable.
  Use `warn` if you want soft.
- Leaving `enabled: false` rules in production config. Remove or set
  `enabled: true`.
- Editing `.hivemind/configs.json` from a specialist agent instead of
  routing through `hm-config-govern`. The command is the canonical
  entry point and applies validation, diff confirmation, and singleton
  reset automatically.

## GSD Compatibility

`gsd-*` primitives (in particular `gsd-prompt-guard`, `gsd-state`,
`gsd-tools`) are **deprecated** for runtime config governance. This
skill + the `hm-config-govern` command + the `hm-config-edit` workflow
+ the `hm-platform-references` agent form the replacement surface. The
`gsd-*` lineage lives in `.opencode/get-shit-done/` and is dev tooling
only — NOT shipped. New config-governance work MUST go through the
`hm-*` surface documented in this skill.

The `gsd-*` primitives were used during early development to scaffold
prompt-guard, state, and tool registries. They have been superseded by
the config-driven governance model where `.hivemind/configs.json` is
the single source of truth and `ToolIntelligenceEngine` walks the
`governance.rules[]` array on every event. There is no migration path
from `gsd-*` to `hm-*` because the runtime contract changed; any
`gsd-*` references in existing code should be left in place (do not
delete) but new work goes through the `hm-*` surface.
