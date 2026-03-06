# Devin Packet: Planning Root, `.hivemind` Composition, and Workflow Hierarchy

Date: 2026-03-06
Status: ready-for-manual-carry
Type: external-synthesis-packet

## Purpose

This packet is for manual use with Devin.

Its purpose is to get architecture-grade synthesis on the bigger-frame problem:

- reset and init create the early `.hivemind` structure
- later runtime automation reshapes it
- the planning root must become a readable source-of-truth
- deterministic runtime state and readable planning/governance artifacts must stop polluting each other

We want a better composition model, not a prompt rewrite.

## Settled Local Facts

These are the current local invariants and must be preserved:

- the completed March 6 runtime baseline stays complete and should not be reopened
- `brain.json` remains the canonical hot session metadata store
- `graph/*.json` remains the canonical structured task, trajectory, and memory store for packed context
- `hierarchy.json` remains the canonical tree-first traversal surface
- `hivemind_inspect.traverse` v1 already exists and must remain tree-first in this wave
- runtime child linkage remains runtime-only
- no fourth state store is allowed
- direct GX-Pack fallback runtime coverage is still pending a stable harness
- `.hivemind/project/planning/` exists as the readable planning root, but much of it is still shell-level rather than fully governed source-of-truth

## Problem Frame

The active concern is not only "what files exist now."

The real concern is:

- what reset and init should create deterministically
- what later runtime or workflow automation should update
- how readable planning artifacts should be structured and validated
- how tools, workflows, sessions, and research outputs should materialize into `.hivemind/project/planning`
- how to keep human readability and machine extraction without turning planning artifacts into polluted prompt mirrors

## Repo Slices To Inspect

Please inspect these repo surfaces when answering:

- `src/cli/init.ts`
- `src/cli/interactive-init.ts`
- `src/cli/scan.ts`
- `src/cli/sync-assets.ts`
- `src/lib/paths.ts`
- `src/lib/fs/planning-ops.ts`
- `src/lib/planning-materializer.ts`
- `src/lib/fs/planning-paths.ts`
- `src/lib/framework-context.ts`
- `src/lib/project-snapshot.ts`
- `.hivemind/project/planning/PROJECT.md`
- `.hivemind/project/planning/REQUIREMENTS.md`
- `.hivemind/project/planning/ROADMAP.md`
- `.hivemind/project/planning/STATE.md`
- `.hivemind/project/planning/MILESTONES.md`
- `.hivemind/project/planning/research/`
- `.hivemind/project/planning/debug/`
- `.hivemind/project/planning/phases/`
- `.hivemind/project/planning/todos/`
- `.hivemind/project/planning/codebase/`

## Reference Intent

We are strongly interested in adapting the strongest parts of a GSD-like planning hierarchy, but not copying it blindly.

We want a repo-specific answer for:

- a readable planning root
- structured validation flow
- phase and milestone hierarchy
- research and debug separation
- codebase mapping and verification artifacts
- workflow-managed updates into those artifacts

## Questions To Answer

### Q1. Composition Root

What should the deterministic composition sequence be from reset and init onward?

Please separate:

- files and folders created by bootstrap
- files and folders populated later by runtime
- files and folders populated by workflow or planning materialization
- files that are readable projections only

### Q2. Planning Root as Readable Source-of-Truth

What is the safest target hierarchy for `.hivemind/project/planning/` if it is meant to become the readable planning source-of-truth?

We need guidance on:

- root documents
- `research/`
- `debug/`
- `todos/`
- `codebase/`
- `phases/`
- validation and verification artifacts
- milestone archiving

### Q3. State vs Planning Separation

How should the system separate:

- deterministic runtime JSON state
- readable markdown planning and governance documents
- derived projections
- anomaly evidence

We want to preserve machine determinism where needed while making the planning root readable, navigable, and safe for later sessions.

### Q4. Workflow-to-Planning Materialization

How should auto-managed sessions, tools, workflows, and validations materialize into the planning root without creating prompt pollution or stale mirrors?

We need an answer for:

- what should write those planning artifacts
- what should only read them
- what should validate them
- what should be archived vs kept active

### Q5. Hierarchy and Numbering Strategy

The planning root needs better hierarchy and governance than simple loose date piles.

What repo-specific hierarchy should exist for:

- large project roots
- milestones
- phases
- plan vs summary vs context vs research vs verification documents
- numbered and named artifacts
- archival rules

### Q6. Migration Direction

Given the current repo shape, what is the safest migration path from shell-level planning root to governed planning root?

Please prefer staged migration rather than greenfield replacement.

## Constraints and Forbidden Recommendations

- do not recommend a fourth state store
- do not recommend flattening runtime state and planning artifacts into one format
- do not recommend making prompts the primary architecture
- do not recommend copying GSD verbatim without adapting it to this repo's lineage and runtime constraints
- do not recommend ignoring the completed March 6 baseline

## Required Answer Format

Please answer in this exact structure:

1. Current composition map
2. Recommended target planning-root hierarchy
3. Write/read/validation responsibilities by layer
4. Migration phases that preserve current invariants
5. Risks, false simplifications, and non-goals

## Quality Bar

- make the answer repo-specific
- keep reset/init as the composition root
- distinguish deterministic state from readable planning source-of-truth
- optimize for long-haul continuity, fast extraction, and controlled workflow governance
