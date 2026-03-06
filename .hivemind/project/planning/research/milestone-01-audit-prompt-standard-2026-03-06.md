# Milestone 01 Audit Prompt Standard

Date: 2026-03-06
Group: research
Status: active-reference

## Purpose

Milestone 01 is not implementation. It is a transfer-ready prompt standard that helps a fresh session reconstruct the true current situation of this repository, map contradictions, and define the next investigation/synthesis loops without inheriting polluted or stale context.

This artifact exists because the current `.hivemind` state contains multiple mirrors, partial authorities, and ongoing work. A new session must be told what is trustworthy, what is only weak evidence, and what must be treated as anomaly evidence instead of source-of-truth.

## What The Prompt Must Achieve

1. Describe the current repository situation truthfully, with clear separation between verified facts, inferred conclusions, and proposed next steps.
2. Force a deep-scan workflow before synthesis.
3. Keep implementation out of scope for Milestone 01.
4. Use diagram-first orientation so another session can understand the system shape quickly.
5. Preserve progressive disclosure so the receiving session starts compact, then expands only when the evidence requires it.
6. Prepare for a later synthesis pass that incorporates OpenCode SDK knowledge and current runtime behavior.

## True Situation Summary

- The runtime orientation model is fragmented across hooks, manifests, hierarchy state, graph files, and planning shells.
- The most populated live orientation surface is `.hivemind/state/hierarchy.json`.
- The planning root under `.hivemind/project/planning/` exists, but core files are still mostly template shells.
- `.hivemind/sessions/manifest.json` and `sessions/active/*/profile.json` do not currently provide a clean one-to-one identity map.
- Several designed runtime concepts exist in code, but are not fully wired as canonical startup authority.
- Inspection tooling is stronger for tree/state traversal than for joined lineage/handoff/delegation orientation.
- Ongoing work means a new session must prefer current code and current runtime state over older artifacts.
- The first milestone must therefore produce a reliable transfer prompt, not a code change package.

## Authority Model For Milestone 01

### Primary Authorities

- `.hivemind/config.json`
- `.hivemind/manifest.json`
- `.hivemind/state/hierarchy.json`
- `.hivemind/sessions/manifest.json`
- `src/cli/init.ts`
- `src/cli/interactive-init.ts`
- `src/cli/scan.ts`
- `src/cli/sync-assets.ts`
- `src/schemas/config.ts`
- `src/tools/hivemind-session.ts`
- `src/tools/hivemind-inspect.ts`
- `src/hooks/session-lifecycle.ts`
- `src/hooks/messages-transform.ts`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`

### Secondary Evidence

- `.hivemind/graph/trajectory.json`
- `.hivemind/graph/tasks.json`
- `.hivemind/graph/project/project.json`
- `.hivemind/handoffs/*.md`
- `.hivemind/handoffs/*.json`
- `.hivemind/project/planning/PROJECT.md`
- `.hivemind/project/planning/STATE.md`
- `.hivemind/project/planning/ROADMAP.md`
- `.hivemind/project/planning/REQUIREMENTS.md`
- `.hivemind/project/planning/MILESTONES.md`

### Explicit Exclusions From Authority

- `.hivemind/state/brain.json`
- `.hivemind/INDEX.md`
- `.hivemind/state/tasks.json`
- unresolved `sessions/active/*/profile.json` unless they are being used as anomaly evidence
- any planning or governance artifact older than the current live code reality and not revalidated in the new session

## Prompt Structure Standard

Every Milestone 01 transfer prompt must contain these parts in this order:

1. `AuditLaunchPacket` YAML
2. `Mindmap` Mermaid block
3. `Flowchart` Mermaid block
4. `Investigation Waves`
5. `Expected Outputs`
6. `Hard Rules`

## AuditLaunchPacket Requirements

The YAML packet must stay compact and typed.

Required keys:

- `milestone`
- `mode`
- `implementation_allowed`
- `objective`
- `current_truth`
- `primary_authorities`
- `secondary_evidence`
- `excluded_sources`
- `lineage_strategy`
- `operator_config_surfaces`
- `deep_scan_waves`
- `expected_outputs`
- `handoff_rules`

Optional keys:

- `anomalies_to_confirm`
- `ongoing_work_caveat`
- `opencode_sdk_synthesis_next`

## Diagram Standard

### Mermaid Mindmap

The mindmap must answer:

- what this milestone is
- which sources are trusted
- which sources are excluded
- where current contradictions live
- what scan lanes the receiving session should open first

### Mermaid Flowchart

The flowchart must answer:

- how the receiving session progresses from intake to deep scan to synthesis
- where it must stop and ask for clarification
- where it must branch into lineage-specific analysis
- where OpenCode SDK synthesis is intentionally deferred to a later wave

## Investigation Waves

The prompt must request these waves explicitly:

1. State authority audit
2. Session identity and lineage audit
3. Prompt injection and runtime orientation audit
4. Planning-root and handoff artifact audit
5. Operator-config and user-approach audit
6. OpenCode SDK synthesis preparation
7. Iterative contradiction resolution and summary synthesis

## Operator Config Inclusion Rules

The prompt must tell the receiving session to extract and use stable operator defaults from the CLI/config surfaces:

- profile preset
- language
- governance mode
- automation level
- expert level
- output style
- review/TDD constraints
- sync target
- sync mode

These are not implementation tasks in Milestone 01. They are part of the situation model because they define how the system expects to approach the user and what runtime asset surface is likely present.

## Progressive Disclosure Rules

The prompt must instruct the next session to:

- start from compact packet data only
- expand into raw files only when the packet says the data is primary authority or anomaly evidence
- avoid broad context dumping
- distinguish between stable operator defaults and volatile session overlays
- distinguish between repository truth and speculative future architecture

## Hard Rules For The Receiving Session

- Do not implement code in Milestone 01.
- Do not treat template planning files as populated truth unless new evidence appears.
- Do not flatten lineage, runtime, planning, and operator-profile concerns into one narrative blob.
- Always label statements as `verified`, `inferred`, or `proposed`.
- Prefer current code paths and current manifests over older descriptive docs.
- Treat contradictions as first-class outputs, not noise to be hidden.

## Expected Outputs From The Next Session

1. Current-state truth report
2. Contradictions and anomaly register
3. Lineage and routing map
4. Operator-config and user-approach map
5. Prompt-surface ownership map
6. OpenCode SDK synthesis intake brief
7. Proposed next investigation or implementation milestone

## Completion Condition

Milestone 01 is complete when a fresh session can read one prompt package, reconstruct the current system situation with diagrams, identify the main contradictions, and propose the next synthesis wave without implementing anything.
