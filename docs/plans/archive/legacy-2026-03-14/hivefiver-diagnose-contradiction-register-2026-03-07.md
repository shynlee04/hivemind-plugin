# Hivefiver Diagnose Contradiction Register

Date: 2026-03-07
Status: active-diagnose-output
Type: contradiction-register

## Purpose

Record the highest-value contradictions and unstable situations that Diagnose found in current repo truth.

## Contradictions

| ID | Contradiction | Verified Evidence | Why It Matters |
|---|---|---|---|
| HF-DIAG-001 | `hivefiver` project-level scope is broader in planning and `AGENTS.md` than in plugin path enforcement | `AGENTS.md`, `.opencode/plugins/hiveops-governance/types.ts`, `.opencode/plugins/hiveops-governance/hooks/delegation.ts` | The planning story says `hivefiver` can operate across the project, but runtime scope boundaries for `hivefiver` still deny `src/` and `tests/` writes. |
| HF-DIAG-002 | Delegation narrative is broader in some docs than in plugin enforcement | `AGENTS.md`, `agents/hivefiver.md`, `.opencode/plugins/hiveops-governance/types.ts` | Planning and profile docs can imply broader orchestration, but runtime delegation for `hivefiver` is still limited to `hivexplorer`, `hiverd`, and `hiveplanner`. |
| HF-DIAG-003 | Diagnose/brownfield logic is described as if it has a single runtime home, but the repo actually spreads it across multiple surfaces | missing `src/lib/brownfield-scan.ts`, `src/lib/framework-context.ts`, `src/lib/staleness.ts`, `src/lib/orphan-quarantine.ts`, brownfield references/workflows | Later planning could keep citing a stale implementation surface unless we normalize the brownfield diagnosis map. |
| HF-DIAG-004 | Planning wants stronger diagnose-first discipline than current runtime tool gate enforces | `docs/plans/hivefiver-routing-precedence-model-2026-03-06.md`, `src/hooks/tool-gate.ts`, `src/lib/gatekeeper.ts` | Current runtime remains advisory in several places, so later planning must not overstate hard blocking behavior. |
| HF-DIAG-005 | Planning root is canonical, but fallback and transitional continuity surfaces still exist | `src/lib/framework-context.ts`, `.hivemind/checkpoints/long-haul-resync-checkpoint-2026-03-06.md`, `.hivemind/handoffs/long-haul-resync-handoff-2026-03-06.md` | Resume flows can still drift if later lanes forget that canonical planning-root authority and transitional continuity are not equal. |

## Strongest Current Guards

- `src/lib/tool-activation.ts` already prioritizes lock state, drift, long-session, and empty-hierarchy signals.
- `src/lib/gatekeeper.ts` already checks action focus, pending failure acknowledgement, pending tools, files touched, drift, and long-session thresholds.
- `.opencode/plugins/hiveops-governance/hooks/delegation.ts` already blocks out-of-topology delegation and unauthorized path writes.
- `src/lib/chain-analysis.ts` already detects empty and broken hierarchy chains.

## Diagnose Conclusion

The contradiction set is now narrow enough to support a later bounded planning handoff.
The main remaining problem is not lack of evidence. It is alignment work across planning narrative, runtime enforcement, and stale implementation references.
