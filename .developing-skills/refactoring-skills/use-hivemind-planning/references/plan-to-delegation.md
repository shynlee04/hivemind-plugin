# Plan → Delegation

## Mapping

| Plan Element | Delegation Element |
|---|---|
| Phase | Delegation packet |
| Slice | Subagent task |
| Gate | Verification before next phase |
| Gate criteria | `success_metrics` and `required_evidence` |

## Phase Numbering

| Range | Purpose |
|---|---|
| `01`–`09` | Standard phases |
| `10`–`19` | Extended / optional phases |
| `20`+ | Emergency / remediation phases |
| Sub-phases | `01.1`, `01.2` — granular slices within a phase |

## Task Extraction

From a plan phase, extract four elements before creating the delegation packet:

1. **Concern** — what changes (the scope boundary)
2. **Files** — what touches (file paths, directories)
3. **Gate** — what proves done (verification commands, test assertions)
4. **Packet** — compose into: `scope`, `constraints`, `success_metrics`, `evidence_required`

## Parallel Phases

Phases with **zero shared dependencies** may be dispatched in parallel.

Independence proof required before parallel dispatch:
- No shared files between phases
- No shared mutable state
- No sequential ordering constraint
- Gate criteria are independently verifiable

If any shared dependency exists → sequential dispatch. Do not guess at independence.
