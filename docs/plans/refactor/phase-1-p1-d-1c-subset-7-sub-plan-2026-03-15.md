# Phase 1 - P1-D.1c Subset 7: Command/Workflow Intake Normalization Sub-Plan

## Expand
The objective is to execute "P1-D.1c subset 7" from `PLAN.md`. This involves normalizing the `/hivefiver*` stage taxonomy and workflow-era startup assumptions. The current repository contains numerous legacy commands (`commands/hivefiver-*.md`) and workflows (`workflows/hivefiver-*.yaml`) that heavily rely on deprecated bash scripts, `.opencode/skills` auto-executions, and legacy workflow bootstrap patterns. These violate the modern architectural boundaries where commands are prompt contracts (`commands_are_prompts=true`), and deterministic routing belongs in `src` plugins/tools.

## Investigate
An initial inspection of the repository reveals the following targets:
*   **Commands**:
    *   `commands/hivefiver-architect.md`
    *   `commands/hivefiver-audit.md`
    *   `commands/hivefiver-build.md`
    *   `commands/hivefiver-continue.md`
    *   `commands/hivefiver-discovery.md`
    *   `commands/hivefiver-doctor.md`
    *   `commands/hivefiver-intake.md`
    *   `commands/hivefiver-plan-spawn.md`
    *   `commands/hivefiver-spec.md`
    *   `commands/hivefiver-start.md`
    *   *Observation*: These commands utilize embedded auto-executed `!bash` commands pointing to legacy `.opencode/skills/hivefiver-coordination/scripts/` which violate the non-interactive shell mandate and the `runtime_owner=plugins-tools-hooks` directive.

*   **Workflows**:
    *   `workflows/hivefiver-enterprise.yaml`
    *   `workflows/hivefiver-enterprise-architect.yaml`
    *   `workflows/hivefiver-floppy-engineer.yaml`
    *   `workflows/hivefiver-mcp-fallback.yaml`
    *   `workflows/hivefiver-vibecoder.yaml`
    *   *Observation*: These workflows contain legacy stage definitions (`bootstrap`, `skill_bundles`, etc.) that overlap with the canonical `src/` intake/session engine contracts (e.g., `hm-harness`, `hm-init`, `hivemind_runtime_command`).

## Research
According to the `opencode-runtime-knowledge` and `hivemind-route-bridge` constraints:
1.  **Commands are Prompts**: Markdown commands are single-purpose prompt contracts, not deterministic workflow engines.
2.  **Runtime Authority**: Deterministic routing and hook behavior belong in plugins, tools, and runtime code (`src/**`), not in bash scripts invoked by commands.
3.  **Bridge Mandate**: We must use `hivemind_runtime_command` for `hm-*` bundles instead of manually creating `.hivemind` files or using bash bootstraps. The transition is gated by `hm-harness`.

Therefore, the legacy `.opencode/scripts` references inside `commands/` must be stripped out or replaced with instructions to utilize the canonical `hm-*` tools (or the `hivemind_runtime_command` tool). Workflows need to be archived or updated to simply declare intent rather than hardcoding imperative execution steps that the `src/` session engine now handles.

## Decision
1.  **Archive Legacy Workflows**: Move the outdated `workflows/hivefiver-*.yaml` files to the `.archive/deprecated-workflows/2026-03-15/` directory, as the intake routing is now natively handled by the `hm-harness` and `hm-init` kernel control planes.
2.  **Normalize Commands**: Strip the `!bash` script executions from `commands/hivefiver-*.md`. Refactor these commands to act as pure prompt templates that instruct the agent to use `hivemind_runtime_command` (e.g., invoking `hm-harness`, `hm-init`, `hm-doctor`) to achieve the requested workflow states.
3.  **Consolidate Taxonomy**: Deprecate overly specific `/hivefiver-` commands that duplicate core workflow transitions, collapsing them into a cohesive set of primary entry points (`hivefiver-start`, `hivefiver-doctor`, etc.) that rely on the new canonical session contracts.

## Sub-plan

### Owned Files
*   `commands/hivefiver-*.md`
*   `workflows/hivefiver-*.yaml`

### Invariants
*   **Prompt-Only Commands**: `commands_are_prompts=true` (Commands must not contain embedded deterministic bash routing scripts).
*   **Canonical Routing**: Deterministic routing lives in plugin runtime, accessed via tools (`hivemind_runtime_command`).
*   **Lineage Integrity**: Intake normalization must not bypass the `hm-init` / `hm-harness` bootstrap profile checks.

### Verification Commands
```bash
# Verify no legacy script executions remain in commands
grep -r "!bash" commands/hivefiver-*.md
# Run typecheck and tests to ensure no core runtime assumptions were broken by command/workflow removal
npm run typecheck
npm test
```

### Stop Conditions
*   **HARD STOP**: If running `npm test` fails due to a core `src/` dependency expecting one of the archived `hivefiver-*.yaml` workflow structures.
*   **Completion**: All `hivefiver-*.md` commands are pure prompt contracts without `!bash` side-effects, and legacy `hivefiver-*.yaml` workflows are safely quarantined in `.archive/`.
