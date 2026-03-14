# Src Canonical Cycle 1 Ownership Normalization

Date: 2026-03-07
Status: active-cycle
Type: execution-guide

## Goal

Execute the first bounded refactor-planning cycle that normalizes ownership language and control-plane assumptions before any code-level consolidation begins.

## Cycle Position

This cycle executes Cycle 1 from `src-canonical-phase-1-refactor-master-plan-2026-03-07.md`.

It is planning-only.

It does not mutate the hot runtime overlap surfaces yet.

## What This Cycle Must Settle

### 1. Authored Source vs Derived Mirror

The cycle must make one active answer explicit across the planning root and supporting strategy docs:

- root framework asset folders are the authored source
- `.opencode/<group>` asset folders are derived mirrors for OpenCode consumption

### 2. Runtime Owner vs Adapter

The cycle must make one active answer explicit:

- `src/**` is the canonical runtime and governance owner
- `.opencode/**` is adapter, delivery, and fallback-only territory

### 3. Planning Root Continuation Story

The cycle must ensure the planning root now resumes from the source-canonical refactor frame instead of from the earlier generic lane-order dispute.

## Work Rounds

### Round A: Ownership Constitution

Objective:

- normalize the current planning/control artifacts to the same ownership language

Focus surfaces:

- `AGENTS.md`
- `.hivemind/project/planning/**`
- active supporting strategy docs under `docs/plans/`

Expected outcome:

- active docs stop treating `.opencode` as a parallel authority
- active docs stop describing `src/**` and `.opencode/**` as co-equal runtime owners

### Round B: Mirror Policy Clarification

Objective:

- make the source-to-mirror relationship explicit for commands, skills, agents, workflows, templates, prompts, and references

Focus surfaces:

- `src/cli/sync-assets.ts`
- `src/cli/init.ts`
- `src/lib/hivefiver-integration.ts`
- planning artifacts that describe asset authority

Expected outcome:

- future code cycles can harden the sync path without first rediscovering the intended ownership model

### Round C: Plugin Boundary Narrowing

Objective:

- define the target role of `.opencode/plugins/hiveops-governance/**` without implementing the runtime merge yet

Focus surfaces:

- `.opencode/plugins/hiveops-governance/index.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- `.opencode/plugins/hiveops-governance/hooks/delegation.ts`
- `.opencode/plugins/hiveops-governance/hooks/events.ts`

Expected outcome:

- the plugin-side target is documented as transport adapter, event adapter, and fallback-only shell
- authoritative governance logic is reserved for later consolidation under `src/**`

## Deliverables

- one active cycle guide
- one ownership constitution or matrix if needed
- planning-root updates that point future work at the source-canonical model
- a clean next gate for Cycle 2 planning

## Boundaries

- do not edit the hot hook logic yet
- do not collapse `.opencode/plugins/**` into `src/**` yet
- do not change runtime state authority
- do not merge lineages
- do not let asset-mirror cleanup drift into behavior changes

## Acceptance Criteria

- active planning/control artifacts name root framework folders as authored source
- active planning/control artifacts name `.opencode` asset folders as derived mirrors
- active planning/control artifacts name `src/**` as canonical runtime owner
- active planning/control artifacts narrow `.opencode/plugins/**` to adapter/fallback target behavior
- the next gate is about Cycle 2 asset projection hardening, not re-arguing Cycle 1 ownership

## Exit Gate

This cycle ends by opening the Cycle 2 gate only.

Cycle 2 remains separate because it is the first place where code-level refactor planning around `sync-assets`, `init`, and HiveFiver asset audits becomes appropriate.
