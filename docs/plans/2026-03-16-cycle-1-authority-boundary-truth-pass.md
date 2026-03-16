# Cycle 1 Authority and Boundary Truth Pass

> **For Claude:** REQUIRED SUB-SKILL: Use `executing-plans` to run this cycle packet-by-packet. Do not expand beyond Cycle 1.

**Goal:** Produce the four documentation deliverables that reconcile current authority claims, plugin-layer boundaries, consumer-facing asset expectations, and the recurring AGENTS upkeep loop.

**Architecture:** This cycle is documentation-only and evidence-led. It starts by reconciling conflicting authority surfaces, then fixes the decision frame for `src/plugin/`, then classifies shipped versus internal assets, and only then defines the upkeep loop that depends on those decisions.

**Tech Stack:** Markdown governance artifacts, repo evidence from `AGENTS.md`, `src/plugin/AGENTS.md`, `docs/architecture/sdk-native-architecture.md`, `CHANGELOG.md`, `src/plugin/opencode-plugin.ts`.

---

## Cycle Boundaries

- In scope: planning and authoring the Cycle 1 deliverables listed below.
- Out of scope: code movement, tool rewrites, permission rewrites, init UX redesign, external skill installation, release work, or any Cycle 2+ proposal.
- Rule: every claim in a deliverable must cite a current repo path and line reference before it is treated as authoritative.

## Required Deliverables

1. `docs/governance/2026-03-16-authority-sync-note.md`
2. `docs/architecture/2026-03-16-plugin-boundary-map.md`
3. `docs/governance/2026-03-16-internal-vs-consumer-asset-matrix.md`
4. `docs/governance/2026-03-16-agents-upkeep-loop-spec.md`

## Dependency Order

1. Authority sync note
2. Plugin boundary map
3. Internal-vs-consumer asset matrix
4. AGENTS upkeep loop spec

The order is strict: packets 2-4 depend on the truth decisions made in the packet before them.

## Work Packets

### Packet 1: Authority Reconciliation Packet

**Objective:** Freeze the current truth surface for Cycle 1 by reconciling stale and current authority statements.

**Inputs:**
- `docs/plans/2026-03-16-hivemind-smoother-development-roadmap.md`
- `AGENTS.md`
- `CHANGELOG.md`
- `docs/architecture/sdk-native-architecture.md`
- `src/plugin/AGENTS.md`

**Output:** `docs/governance/2026-03-16-authority-sync-note.md`

**Steps:**
- Compile all contradictory authority statements about plugin extraction, SDK adoption, runtime tools, removed modules, and consumer-facing shipped surfaces.
- Mark each statement as `current`, `stale`, or `needs-qualification`.
- Explicitly separate internal self-hosting reality from npm-consumer expectations.
- End with a short supersession table stating which current files win when conflicts exist.

**Success Criteria:**
- Every contradiction cited has a source path.
- The note names which surfaces are authoritative for Cycle 1.
- The note does not prescribe code changes beyond documenting current truth.

### Packet 2: Plugin Boundary Packet

**Objective:** Translate the authority note into an execution boundary map for `src/plugin/` and adjacent layers.

**Inputs:**
- `docs/governance/2026-03-16-authority-sync-note.md`
- `src/plugin/opencode-plugin.ts`
- `src/plugin/AGENTS.md`
- `AGENTS.md`

**Output:** `docs/architecture/2026-03-16-plugin-boundary-map.md`

**Steps:**
- Enumerate current plugin-entry responsibilities by hook/helper block.
- Classify each responsibility as `assembly-allowed`, `extract-later`, `policy-gated`, or `needs-authority-clarification`.
- Identify the minimum adjacent owner for each responsibility (`src/tools/`, `src/hooks/`, `src/shared/`, or `src/plugin/`).
- Record the boundary decision without changing implementation.

**Success Criteria:**
- All major `opencode-plugin.ts` responsibility blocks are classified.
- Boundary classifications align with the authority sync note.
- The map makes clear what stays in plugin assembly versus what only gets queued for later implementation cycles.

### Packet 3: Asset Surface Packet

**Objective:** Classify internal-only, mirrored, generated, and consumer-facing assets so future work does not mix self-hosting behavior with shipped behavior.

**Inputs:**
- `docs/governance/2026-03-16-authority-sync-note.md`
- workspace root inventory
- `AGENTS.md`
- `CHANGELOG.md`

**Output:** `docs/governance/2026-03-16-internal-vs-consumer-asset-matrix.md`

**Steps:**
- Inventory the required asset families: `agents/`, `.opencode/`, `commands/`, `skills/`, `workflows/`, `dist/`, `bin/`, `.hivemind/`, plus any supporting dev-only mirrors directly referenced by governance docs.
- Tag each asset family as `authoritative`, `consumer-facing shipped`, `dev mirror`, `runtime-generated`, `internal-only`, or `needs-qualification`.
- Add one column for consumer dependency risk if the asset currently relies on repo-local assumptions.
- Close with explicit statements about what npm consumers must receive versus what only repo contributors/self-hosting flows use.

**Success Criteria:**
- All mandated asset families are present.
- Consumer-facing versus internal-only distinctions are explicit.
- No row relies on implied knowledge from repo contributors.

### Packet 4: AGENTS Upkeep Packet

**Objective:** Define the recurring evidence-triggered loop that keeps AGENTS current after Cycle 1 decisions.

**Inputs:**
- `docs/governance/2026-03-16-authority-sync-note.md`
- `docs/architecture/2026-03-16-plugin-boundary-map.md`
- `docs/governance/2026-03-16-internal-vs-consumer-asset-matrix.md`
- `AGENTS.md`
- `src/plugin/AGENTS.md`

**Output:** `docs/governance/2026-03-16-agents-upkeep-loop-spec.md`

**Steps:**
- Define the upkeep loop stages: intake, evidence capture, qualification, update decision, sync targets, verification, and archival note.
- List the allowed triggers for AGENTS updates: failed verification, architecture drift, stale claims after implementation, recurring manual workaround, or consumer-facing mismatch.
- Specify required evidence for an AGENTS update and the minimum files that must stay in sync.
- Specify refusal conditions for editing AGENTS when evidence is weak or outside authority boundaries.

**Success Criteria:**
- The loop is evidence-triggered, not prompt-triggered.
- Sync targets between root and sector AGENTS are explicit.
- The spec defines a clear blocked condition when evidence is missing.

## Cycle Completion Gate

Cycle 1 is complete only when all four deliverables exist, cross-reference each other cleanly, and agree on these three decisions:

1. Which files are authoritative when repo docs disagree.
2. Which responsibilities belong in `src/plugin/` versus adjacent layers.
3. Which assets are consumer-facing versus internal/self-hosting only.

If any deliverable requires code changes to prove its point, record that as a next-cycle dependency instead of expanding scope.

## Handoff Notes For Execution

- Use one packet at a time; do not parallelize because each packet consumes decisions from the previous packet.
- Update the paired findings and progress trackers after each packet.
- Return `partial` if a contradiction cannot be resolved from current repo evidence.
- Return `blocked` if a required authority surface is missing, newer than current evidence without validation, or conflicts in a way that cannot be qualified.
