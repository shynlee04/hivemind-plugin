# Runtime Sync Detachment Spec - 2026-03-21

## Goal

Detach automatic runtime mirroring of `.opencode/commands`, `.opencode/agents`, and `.opencode/skills` from normal `hm-init` and `hm-doctor` flows while preserving automatic creation of `.opencode/plugins/hivemind-context-governance.ts`.

## Verified Runtime Baseline

- `src/features/runtime-observability/sync.ts` currently writes the plugin stub plus mirrored command, agent, and skill projections.
- The same module currently deletes unmanaged mirrored `.md` files and skill directories during normal sync, with dry-run reporting exposed through `wouldDelete` and `protected` fields.
- `src/features/runtime-entry/init.handler.ts` and `src/features/runtime-entry/doctor.ts` currently call runtime sync during healthy bootstrap/repair and report mirrored command/agent evidence in their result payloads.
- `src/commands/slash-command/command-bundles.ts` remains the command authority, while `src/shared/opencode-agent-registry.ts` and `src/shared/opencode-skill-registry.ts` currently exist to build runtime markdown projection payloads.

## Approved Design

### Decision

Keep automatic runtime sync only for the local plugin stub. Remove command, agent, and skill projection from the default runtime entry path.

### Desired Runtime Behavior

- `hm-init` creates or refreshes `.opencode/plugins/hivemind-context-governance.ts`.
- `hm-doctor` recreates that same plugin stub only when recovery reaches the healthy path.
- `hm-harness` remains non-mutating.
- Normal entry flows do not create, refresh, or delete `.opencode/commands/**`, `.opencode/agents/**`, or `.opencode/skills/**`.
- Entry reports and user-facing docs describe plugin attachment only, not markdown mirroring.

## Scope Boundaries

### In Scope

- Refactor runtime sync so plugin stub attachment is isolated from content mirroring.
- Remove destructive deletion behavior from normal `init` and `doctor` flows by removing those mirrored surfaces from those flows.
- Update tests to prove the new runtime contract.
- Update docs and AGENTS surfaces that still claim command/agent/skill mirroring is part of bootstrap or repair.

### Out of Scope

- Removing root `commands/`, `agents/`, or `skills/` from the package.
- Rewriting bundle discovery, agent registry projection rules, or skill registry projection rules beyond what is needed to detach them from normal runtime entry.
- Shipping a new public projection CLI unless separately approved.
- Deleting existing user-local `.opencode/commands`, `.opencode/agents`, or `.opencode/skills` content as part of this change.

## Architectural Shape

### Runtime Sync Split

The runtime sync seam should separate into two concerns:

1. Plugin stub attachment: always available to runtime entry.
2. Markdown/content projection: explicit opt-in, dev-only, or future-manual surface.

The normal runtime entry path should depend only on concern 1.

### Reporting Contract Changes

Runtime entry reports should stop advertising mirrored command/agent evidence. The sync/report shape should become plugin-focused so result payloads, artifact refs, and readiness messaging match actual runtime behavior.

### Registry Ownership After Detachment

- `command-bundles.ts` still owns command authority.
- `opencode-agent-registry.ts` and `opencode-skill-registry.ts` remain package/dev projection helpers unless a later change removes or relocates them.
- Detached registries must not imply that normal bootstrap writes those projections.

## Context Map

### Runtime Code

| File | Purpose | Change Direction |
|------|---------|------------------|
| `src/features/runtime-observability/sync.ts` | writes plugin and mirrored surfaces | split plugin attach from content mirroring; narrow default result shape |
| `src/features/runtime-entry/init.handler.ts` | bootstrap flow and init report | consume plugin-only sync result; remove mirrored artifact/report references |
| `src/features/runtime-entry/doctor.ts` | repair flow and doctor report | same plugin-only reporting and artifact changes |

### Related Authorities

| File | Relationship |
|------|--------------|
| `src/commands/slash-command/command-bundles.ts` | source authority for shipped command assets; should no longer imply runtime mirroring |
| `src/shared/opencode-agent-registry.ts` | current projection helper; no longer part of normal entry path |
| `src/shared/opencode-skill-registry.ts` | current skill projection helper; no longer part of normal entry path |

### Tests To Update

| File | Expected Truth After Change |
|------|-----------------------------|
| `tests/runtime-surface-sync.test.ts` | asserts plugin stub sync only for default path, with no command/agent mirror expectation |
| `tests/sync-dry-run.test.ts` | removes default mirrored-surface deletion assumptions; verifies plugin-only behavior and any explicit projection path separately if retained |
| `tests/runtime-entry-contract.test.ts` | asserts init/doctor report plugin stub evidence only and no mirrored command expectations |

### Documentation Truth Updates

| File | Drift To Correct |
|------|------------------|
| `AGENTS.md` | runtime projection claims still overstate `.opencode/agents/**` dev projection as live entry behavior |
| `README.md` | bootstrap/repair sections currently claim command and agent mirroring |
| `docs/guide/installation.md` | install guide still says init mirrors command and agent assets |
| `src/shared/AGENTS.md` | runtime projection rule currently reads like active runtime entry behavior |
| `src/commands/slash-command/AGENTS.md` | registry note currently ties bundle registry to mirrored command surfaces |

## Acceptance Criteria

- Default runtime sync produces `.opencode/plugins/hivemind-context-governance.ts` and nothing else under `.opencode/**`.
- `hm-init` and healthy `hm-doctor` only report plugin stub sync evidence.
- No default runtime entry path deletes unmanaged `.opencode/commands/**`, `.opencode/agents/**`, or `.opencode/skills/**` content.
- Tests reflect plugin-only runtime sync truth and pass.
- User-facing and internal docs stop instructing users that bootstrap/repair mirror command, agent, or skill markdown into `.opencode/**`.

## Risks And Follow-Ups

- Existing tests or internal tooling may still assume `.opencode/commands/**` exists for runtime previews; those assumptions must be identified before code removal is finalized.
- Detached registries may become dead code if no explicit projection surface remains; that cleanup should be evaluated after the behavior change lands.
- Users with existing mirrored `.opencode/**` content may keep stale files locally; this change intentionally avoids destructive cleanup, so docs should clarify the new contract.
