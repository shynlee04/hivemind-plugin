# PLAN.md Protocol → Governance Skill Activation Map

> This reference maps PLAN.md's 9-step mandatory refactor protocol to root governance skill activation.
> Load when coordinating a multi-step cycle and need to know which skills gate each step.

## Protocol Step → Skill Activation

| Step | Protocol Phase | Primary Skill | Supporting Skills | Gate? |
|:---:|---|---|---|:---:|
| 1 | **Expand** | `entry-resolution` (classify scope, route lineage) | `platform-adapter` (detect runtime) | — |
| 2 | **Investigate** | `research-methodology` (structured evidence gathering) | `context-integrity` (validate stale-ness) | — |
| 3 | **Research on Knowledge Detail** | `research-methodology` (MCP/web validation) | `evidence-discipline` (prove unstable claims) | — |
| 4 | **Decision** | `agent-role-boundary` (who decides?) | `spec-distillation` (freeze spec candidates) | — |
| 5 | **Sub-Plan** | `delegation-framework` (packet schema, scope) | `ralph-tasking` (PRD/bead structure) | — |
| 6 | **Authorize** | — (human operator gate) | `wrong-start-resolver` (if mismatch detected) | ✅ |
| 7 | **Execute** | `delegation-framework` (spawn + validate) | `agent-role-boundary` (enforce role), `evidence-discipline` (proof) | — |
| 8 | **Gatekeeping** | `verification-methodology` (goal-backward) | `evidence-discipline` (minimum evidence bar) | ✅ |
| 9 | **Atomic Commit** | `evidence-discipline` (commit-only-if-verified) | `context-integrity` (persist decisions) | ✅ |

## Skill Ladder (PLAN.md §5) → Governance Layer

The PLAN.md skill ladder prescribes external skills (`using-superpowers → brainstorming → spec-driven-development → writing-plans → test-driven-development`). The root governance skills operate as an **always-on base layer** beneath the ladder:

```
┌─────────────────────────────────────────────┐
│  External Skill Ladder (loaded progressively) │
│  using-superpowers → brainstorming → spec...  │
├─────────────────────────────────────────────┤
│  Root Governance Layer (always active)        │
│  entry-resolution, agent-role-boundary,       │
│  delegation-framework, evidence-discipline,   │
│  verification-methodology, context-integrity, │
│  platform-adapter, wrong-start-resolver       │
├─────────────────────────────────────────────┤
│  Domain Skills (loaded by lineage/intent)     │
│  meta-builder-governance, spec-distillation,  │
│  ralph-tasking, research-methodology          │
└─────────────────────────────────────────────┘
```

## Verification Gates (PLAN.md §9)

| Gate | Verifying Skill | Evidence Type |
|------|----------------|---------------|
| Runtime authority | `verification-methodology` | Owner is sole active authority for slice |
| Donor | `evidence-discipline` | Accepted logic no longer needs `.opencode` dependency |
| Drift | `verification-methodology` | `src` and `dist` agree on shipped behavior |
| State | `verification-methodology` | `.hivemind` stores correctly classified |
| Regression | `evidence-discipline` | Boundary tests hold or intentionally replaced |
