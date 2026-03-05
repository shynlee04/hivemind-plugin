# Live Architecture Themes

## Purpose

This document extracts only the architecture tensions that remain valid after reconciling external analyses against the current repository.

It is intentionally narrower than the external reports. Anything already fixed or contradicted by the current repo has been excluded.

## Theme A: Injection Surface Consolidation

### Verified Current State

- `src/hooks/session-lifecycle.ts` still assembles and injects a system-level HiveMind block.
- `src/hooks/messages-transform.ts` still prepends both:
  - cognitive packer output
  - a separate anchor header via `buildAnchorContext()`
- `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` still exists as a plugin-side message transform surface.
- `src/lib/injection-orchestrator.ts` now provides shared budget and cross-channel presence detection, so the overlap problem is smaller than before, but the ownership problem is not fully solved.

### Why This Still Matters

The repo has improved budget discipline, but the conceptual ownership of prompt material is still split across multiple surfaces. That makes it hard to answer:

- which surface owns stable session context
- which surface owns ephemeral guidance
- which surface owns compaction-only recovery context
- which injected material is authoritative when surfaces overlap

### Open Design Questions

- What must remain in `system[]` because it is stable, global, or compaction-resilient?
- What belongs only in `messages[] prepend` because it is rich but ephemeral?
- What belongs only in `messages[] append` because it is end-of-turn guidance?
- What plugin-side context should remain as fallback-only versus normal runtime behavior?
- Should the separate anchor header survive once the cognitive packer is treated as the canonical structured context?

## Theme B: State Authority Rationalization

### Verified Current State

The repo still draws meaning from three state families:

- `brain.json`
  - session metadata
  - counters
  - governance state
  - flat hierarchy projection
- `graph/*.json`
  - trajectory
  - tasks
  - mems
  - relational state
- `hierarchy.json`
  - tree
  - cursor
  - ancestor traversal

### Why This Still Matters

Different subsystems read different state families for related concepts. That is workable, but it creates persistent ambiguity around:

- which state is canonical for injection
- which state is canonical for navigation
- which state is canonical for session continuity
- which fields are true stored state versus derived projection

### Open Design Questions

- Should `cognitive-packer.ts` be the canonical context compiler across all injection surfaces?
- Which `brain.json` fields should remain persisted session metadata only?
- Which `brain.json` hierarchy fields should be treated as derived views from graph or tree state?
- Should `hierarchy.json` remain navigation-only, or should more prompt logic depend on it directly?

## Theme C: Typed Traversal and Inspect Formalization

### Verified Current State

- `src/tools/hivemind-inspect.ts` supports:
  - `scan`
  - `deep`
  - `drift`
  - `introspect`
- It does not yet support typed graph/tree traversal for:
  - ancestors
  - descendants
  - related mems
  - related anchors
  - file locks

### Why This Still Matters

Today, agents still depend too heavily on injected text and human-inferred structure. A typed traversal contract would let the system query structure instead of hallucinating it.

### Open Design Questions

- Should traversal be added as a new `action` on `hivemind_inspect` or as mode parameters on existing actions?
- Should traversal operate primarily on `hierarchy.json`, `graph/*.json`, or both?
- How much relationship material should traversal return by default versus behind flags like `include_mems` and `include_anchors`?

## Theme D: Delegation and Session Continuity

### Verified Current State

- `parentID` exists in split and continuation flows.
- `src/lib/session-split.ts` already uses lineage and recent dialogue concepts.
- `soft-governance.ts` captures task outputs into `cycle_log`.
- `CycleLogEntry` does not currently retain `task_id`.

### Why This Still Matters

Long-haul continuity depends on preserving:

- who delegated what
- how to resume it
- what state the delegated work was in
- which files and artifacts it produced

Right now the repo has continuity ingredients, but not one normalized delegation envelope.

### Open Design Questions

- Where should `task_id` be stored for safe resume:
  - `cycle_log`
  - exported cycle artifacts
  - both
- What structured output should delegated work return so resume and audit are deterministic?
- Which continuity fields belong in prompt context and which belong only on disk?

## Theme E: QA-Driven Clarification and Research Workflow

### Verified Current State

The repo already has pieces of the needed loop:

- session coherence and first-turn reasoning
- inspect and drift tooling
- memory and anchors
- compaction and split continuity
- agents, skills, and workflows

What it does not yet have is one clear operating model that connects:

- question-driven clarification
- slice-based exploration
- gap detection and re-entry into clarification
- research artifact assembly
- compaction-safe continuation

### Why This Still Matters

This is the largest product-level workflow gap that remains compatible with the current architecture. It can be built mostly by consolidating existing capabilities instead of adding a new subsystem.

### Open Design Questions

- How should a clarification packet be represented and surfaced?
- When should the system re-enter clarification after exploration?
- How should long-form research be stored:
  - file layout
  - YAML frontmatter
  - tags
  - hierarchy refs
  - cross-links
- How should research remain selectively retrievable rather than prompt-injected wholesale?

## Theme F: Role-Specific Injection Minimization

### Verified Current State

- Session role/kind logic exists in `src/lib/session-role.ts`.
- Parent-child session lineage exists in session split flows.
- Injection surfaces are not yet fully role-aware in a unified way.

### Why This Still Matters

Focused child sessions should likely receive less context than main sessions. The codebase now has enough role and lineage information to consider this seriously, but not enough confirmed OpenCode-native behavior yet to lock the design without another external query.

### Open Design Questions

- What is the minimum viable injected context for child sessions?
- Should role minimization be driven by:
  - session kind
  - `parentID`
  - agent role
  - all three
- Which surfaces should be reduced first:
  - plugin-side message context
  - system injection
  - cognitive-packer payload

## Priority Order For The Next Engineering Wave

1. Injection surface ownership
2. Delegation continuity envelope
3. Traversal contract
4. Clarification and research workflow
5. State authority rationalization
6. Role-specific injection minimization

## Themes To Explicitly Leave Out Of The Next Wave

- Re-solving budget hardening already shipped
- Re-solving compaction budget already shipped
- Re-solving mutation flush already shipped in `soft-governance.ts`
- Re-litigating missing files/tests already present in the repo

