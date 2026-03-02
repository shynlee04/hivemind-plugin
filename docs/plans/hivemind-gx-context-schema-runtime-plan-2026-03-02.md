# Hivemind GX Context-Schema Runtime Plan (Plugin-Only)

Date: 2026-03-02
Owner: hivefiver
Mode: plugin-only enforcement and orchestration

## Intent

Build a substantial module focused on context engineering, schema governance, and runtime steering proof through deterministic delegation.

## Scope Boundaries

- In scope: `.opencode/**`, `.hivemind/**`, `docs/**`
- Out of scope: `src/**`, `tests/**`, core SDK internals

## Source-of-Truth References

- `docs/OPENCODE-ARCHITECTURE-NARRATIVE.md`
- `docs/OPENCODE-CONCEPTS-ADVANCED.md`
- `docs/OPENCODE-DETERMINISTIC-CONTEX-AGENT-DELEGATION.md`
- `docs/opencode-full-sdk-mechanism.md`
- `docs/OPENCODE-KNOWLEDGE-MASTER-INDEX.md`
- `docs/OPENCODE-KNOWLEDGE-SYNTHESIS-MAP.md`
- `docs/OPENCODE-META-BUILDER-MODULE.md`
- `docs/OPENCODE-PRIMARY-COORDINATOR-AGENT.md`

## Architecture Focus

## 1) Steering Runtime Proof

- Capture deterministic delegation traces at runtime in `.hivemind/state/enforcement-trace.jsonl`.
- Record allow/deny decisions with depth, target, and objective hash.
- Emit evidence-friendly trace entries for gate checks and handoff exports.

## 2) Schema + Graph Continuity

- Upgrade TODO engine to enforce a max of 40 subtasks per hierarchy node.
- Maintain bidirectional mapping in sidecar state:
  - `.hivemind/state/todo.json` (task state)
  - `.hivemind/state/todo-links.json` (node->tasks and task->node)
- Keep one active task invariant and deterministic dependency status.

## 3) Command-Workflow-Skill Chain

Minimal command surface (few commands, broad orchestration):

1. `/hivefiver-gx-orchestrate` - entry command for steering and delegation proof runs.
2. `/hivefiver-gx-validate` - semantic chain and gate validation.
3. `/hivefiver-gx-export` - purified handoff export + SOT registration.

Workflow chain:

- `gx-orchestrate.md` -> `gx-validate.md` -> `gx-export.md`

Skill stack:

- `hivemind-context-schema-runtime` (new)
- `hivefiver-mode` (existing)
- `hivefiver-coordination` (existing)

Script stack:

- `gx-entry-guard.sh`
- `gx-mid-guard.sh`
- `gx-todo-sync.sh`
- `gx-semantic-validate.sh`
- `gx-handoff-purify.sh`
- `gx-sot-register.sh`

## 4) SOT Chain and Purification

- Purify handoff payloads into schema-aligned JSON artifacts.
- Export JSONL summaries for grep/glob/regex retrieval.
- Auto-register artifacts with SOT index and parent-child chain links.

## Acceptance Gates

- G0 Entry Integrity: scope and prerequisites validated.
- G1 Spec Integrity: criteria declared for each chain stage.
- G2 Orchestration Integrity: delegation depth, dependencies, and role boundaries enforced.
- G3 Evidence Integrity: runtime trace + semantic validation outputs attached.
- G4 Export Integrity: purified handoff and SOT registrations retraceable.

## Implementation Sequence

1. Extend plugin/runtime and tool engines with trace + graph-link logic.
2. Add GX script suite for deterministic lifecycle enforcement.
3. Add command trio with script-injected enforcement blocks.
4. Add linked workflows and new skill package with references.
5. Run quality checks and runtime-gate evidence capture.

## Deterministic Next Steps

1. Implement runtime trace logging and TODO graph-link constraints.
2. Wire command/workflow/skill/script chain and verify cross-references.
3. Validate evidence outputs, update STATE.md, export handoff.
