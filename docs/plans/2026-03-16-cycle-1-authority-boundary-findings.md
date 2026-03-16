# Cycle 1 Authority and Boundary Findings

## Objective

Persist the repo evidence that justifies Cycle 1 sequencing and acceptance gates.

## Current Findings

1. Packet 1 is complete in `docs/governance/2026-03-16-authority-sync-note.md`. It records that older debt prose about inline runtime tools, zero `tool.schema` adoption, and missing SDK integrations is stale against current source and package evidence, while also freezing the unresolved plugin assembly/CQRS tension instead of normalizing it away.
2. Packet 2 is complete in `docs/architecture/2026-03-16-plugin-boundary-map.md`. It classifies the live `src/plugin/opencode-plugin.ts` responsibilities into `assembly-allowed`, `policy-gated`, `extract-later`, and `needs-authority-clarification`, confirming that tool extraction has already happened but the plugin entry still contains helper and hook behavior that is not cleanly settled as assembly-only.
3. Packet 3 is complete in `docs/governance/2026-03-16-internal-vs-consumer-asset-matrix.md`. It makes `package.json` the shipping authority, keeps `AGENTS.md` as the repo-level surface classifier, and explicitly separates shipped root assets from `.opencode/**` mirror behavior and `.hivemind/**` runtime-generated state.
4. Packet 4 is complete in `docs/governance/2026-03-16-agents-upkeep-loop-spec.md`. It defines an evidence-triggered upkeep loop that updates AGENTS surfaces only when contradictions are proven, preserves unresolved tensions honestly, and keeps mirrors and runtime artifacts out of the authority chain.
5. Across the cycle, the most important repo-level conclusion is that several governance and sector prose surfaces lag current implementation, so current `src/**/*.ts` and `package.json` must continue to outrank stale migration/debt statements when deciding current truth.
6. Across the cycle, the main unresolved item is still verification closure rather than authoring completeness: the four deliverables exist and cross-reference the same authority model, but the cycle tracker still needs to record that completion is pending final acceptance-gate verification rather than assuming the cycle is fully closed.

## Packet Outcomes Recorded

- Packet 1: complete; authority contradictions were reconciled into a supersession order and unresolved tensions were explicitly frozen.
- Packet 2: complete; plugin-layer responsibility buckets were documented without expanding into implementation work.
- Packet 3: complete; shipped, internal, mirror, and runtime surfaces were classified from package and governance evidence.
- Packet 4: complete; the recurring AGENTS upkeep loop, triggers, thresholds, and refusal conditions were documented.

## Remaining Verification Items

- Confirm that the four deliverables satisfy the completion gate in `docs/plans/2026-03-16-cycle-1-authority-boundary-truth-pass.md:131` through `docs/plans/2026-03-16-cycle-1-authority-boundary-truth-pass.md:139`, especially the requirement that they agree on authority order, plugin boundaries, and consumer-versus-internal asset classes.
- Confirm that the cross-references among the four deliverables are sufficient for a final cycle-close decision and that no packet silently widened scope beyond documentation.
- Keep the plugin assembly-versus-write-path tension recorded as unresolved until a later cycle supplies authority or implementation evidence strong enough to close it.

## Non-Goals Confirmed

- No code edits in `src/`.
- No permission policy rewrite.
- No packaging or release changes.
- No redesign of `hm-init` or runtime attachment UX.
