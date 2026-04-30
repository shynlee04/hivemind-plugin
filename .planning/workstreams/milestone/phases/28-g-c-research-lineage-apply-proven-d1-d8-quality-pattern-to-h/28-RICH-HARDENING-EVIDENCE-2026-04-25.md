# Phase 28 Rich Hardening Evidence — 2026-04-25

## Scope

Baseline skills hardened:

- `hm-deep-research`
- `hm-detective`
- `hm-synthesis`
- `hm-research-chain`

Supplemental skills left unchanged:

- `hm-skill-synthesis` — out of baseline; already has richer package shape.
- `hivefiver-context-absorb` — out of baseline; relevant ingestion evidence deferred.

## Pattern Application Matrix

| Pattern | Applied to | Evidence |
|---|---|---|
| Pattern 1: strict sequential research gates | `hm-deep-research`, `hm-research-chain` | `hm-deep-research/workflows/sequential-research-gates.md`; `hm-research-chain` Stage 4 + stop rules. |
| Pattern 2: source evaluation + contradiction matrix | `hm-deep-research`, `hm-synthesis`, `hm-detective` | `hm-deep-research/templates/source-evaluation.md`; `hm-deep-research/templates/contradiction-matrix.md`; `hm-synthesis/templates/contradiction-consensus.md`; `hm-detective/templates/assumption-verification.md`. |
| Pattern 3: artifact persistence / continuation / provenance | `hm-deep-research`, `hm-synthesis`, `hm-research-chain` | `hm-deep-research/workflows/sequential-research-gates.md`; `hm-synthesis` provenance export gate; `hm-research-chain/templates/chain-continuation.md`. |

## Per-Skill RICH Gate Result

| Skill | Result | Reason |
|---|---|---|
| `hm-deep-research` | PARTIAL/BLOCKED | Pattern resources added and validators pass, but `skills.volces.com@deep-research` remains inaccessible. |
| `hm-detective` | PARTIAL | Assumption verification resources added and validators pass; still needs independent RICH + D1-D8 scoring. |
| `hm-synthesis` | PARTIAL | Contradiction/consensus resources added, stale validator references fixed, validators pass; still needs independent RICH + D1-D8 scoring. |
| `hm-research-chain` | PARTIAL | Validator drift fixed and continuation/provenance template added; still needs independent RICH + D1-D8 scoring. |

## Validation Commands Run

```text
bash .opencode/skills/hm-deep-research/scripts/validate-rich-package.sh
bash .opencode/skills/hivefiver-use-authoring-skills/scripts/validate-skill.sh .opencode/skills/hm-deep-research

bash .opencode/skills/hm-detective/scripts/validate-rich-package.sh
bash .opencode/skills/hivefiver-use-authoring-skills/scripts/validate-skill.sh .opencode/skills/hm-detective

bash .opencode/skills/hm-synthesis/scripts/validate-rich-package.sh
bash .opencode/skills/hivefiver-use-authoring-skills/scripts/validate-skill.sh .opencode/skills/hm-synthesis

bash .opencode/skills/hm-research-chain/scripts/validate-skill.sh .opencode/skills/hm-research-chain
bash .opencode/skills/hivefiver-use-authoring-skills/scripts/validate-skill.sh .opencode/skills/hm-research-chain

node -e "JSON.parse(...)" for all target eval files
bash .opencode/skills/hivefiver-use-authoring-skills/scripts/check-overlaps.sh <skill-dir> for all target skills
```

## Remaining Blockers

1. Inaccessible source package: `skills.volces.com@deep-research`.
2. Independent RICH + D1-D8 scoring has not been performed after hardening.
3. Overlap scans report existing duplication warnings in several reference packs; final closure should decide whether those are acceptable or require a deduplication wave.

## Exit Decision

Do not mark Phase 28 PASS. The correct state is **partial hardening complete, RICH PASS blocked pending independent scoring and blocked-source decision**.
