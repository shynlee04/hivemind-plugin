# src/tools/ — Tool Constitution

## Purpose
- Define what counts as a real callable HiveMind tool surface.
- Keep tool families separate from internal runtime hooks and from slash-command bundles.
- Ensure every tool contributes directly to runtime flow, workflow/task/trajectory integrity, context engineering, or retrieval/inspection utility.

## Taxonomy
- `custom tool`
  An OpenCode-callable limb with a stable name, argument schema, output contract, and direct agent value.
- `runtime hook`
  Internal hook/runtime bridge surface used by plugin/runtime code. Hooks are not public tools even if they expose `execute()`.
- `slash-command bundle`
  Command/runtime orchestration surface loaded from `/commands/*.md` and bundle metadata. Commands are not tools.

## Current Surfaces
- `src/tools/`
  Actual agent-callable tool families now live here.
- `src/hooks/runtime-bridge/`
  Instruction-backed hook bridges for context injection, prompt transformation, runtime loading, and workflow integration.
- `src/commands/slash-command/`
  Command bundles and handlers for `hm-*` orchestration. These are command surfaces, not tool families.

## MVP Direction
- Stable public tool families should converge toward:
  - `hivemind_task`
  - `hivemind_trajectory`
  - `hivemind_handoff`
  - `hivemind_doc`
  - `hivemind_inspect`
  - `hivemind_runtime_status` as a narrow admin/diagnostic tool only
- Anything outside those families must justify why it is a tool instead of:
  - a core/library function
  - a runtime hook
  - a CLI command
  - a slash-command bundle

## Packing Standard
- Every real tool family should be packed like a product surface:
  - `index.ts`
  - `types.ts`
  - `tools.ts`
  - optional support modules such as `constants.ts`, `executor.ts`, `validators.ts`, `prompt-builder.ts`
- Prefer factory creation for tools with runtime/config/dependency injection.
- Keep registration centralized at the plugin/tool-registry edge.

## Design Rules
- Tools must be superior to built-ins for a specific repeated job, not generic catch-all wrappers.
- Tool descriptions are part of the control plane and must state:
  - when to use
  - when not to use
  - required parameters
  - dangerous or privileged modes
- Use an `action` enum only when actions share:
  - one resource family
  - one permission/risk profile
  - one mental model
- Split into separate tools when invocation timing, side-effect level, or output shape materially diverges.

## Integrity Rules
- Tools must not infer authority from sessions alone when workflow/task/trajectory state exists.
- Mutation-oriented tools must map effects back to workflow/task/trajectory context where applicable.
- Non-interactive shell assumptions apply everywhere.
- `/commands/*.md` may document command behavior, but command markdown must not silently become tool authority.
- Do not ship new public tools that overlap built-in OpenCode tools unless replacement behavior is intentional and explicit.

## Non-Goals
- Do not preserve archived chunky tool monoliths as-is.
- Do not call runtime hooks “tools” in new docs or types.
- Do not expand the public tool set before the existing families are coherent and discoverable.
