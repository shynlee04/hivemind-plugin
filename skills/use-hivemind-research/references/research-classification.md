# Research Classification

Research packets must classify both **depth** and **type** before tool selection. Depth sets the evidence budget. Type sets the tool chain.

## 4-Mode Depth Scaling

| Mode | Time Budget | Minimum Sources | Credibility Floor | Claims Coverage Target | Counter-Perspective Queries |
|---|---:|---:|---:|---:|---:|
| Quick | 3 minutes | 5 | 50 | 50% | 0 |
| Standard | 8 minutes | 10 | 60 | 75% | 1 |
| Deep | 15 minutes | 15 | 70 | 90% | 2 |
| UltraDeep | 30 minutes | 25 | 75 | 95% | 3+ |

### Mode Rules

- **Quick**: answer small reversible questions fast; do not over-extract.
- **Standard**: default mode for most engineering choices.
- **Deep**: use when migration cost, public impact, or architectural lock-in is real.
- **UltraDeep**: use for high-stakes, hard-to-reverse, or externally visible decisions.

## Decision-Stakes Calibration Matrix

| Decision Shape | Reversible? | Blast Radius | Recommended Mode | Notes |
|---|---|---|---|---|
| Simple lookup or orientation | Yes | Single task | Quick | Accept partial uncertainty |
| Package selection for a feature | Usually | Team-local | Standard | Require official docs plus one counter-view |
| Framework or architecture selection | Hard | Multi-team | Deep | Require repo, docs, and community evidence |
| Compliance, security, or migration commitment | No | Org-wide | UltraDeep | Require contradictions, caveats, and explicit unknowns |
| Brownfield production incident trace | Sometimes | Running systems | Deep | Prioritize current local truth over broad web coverage |

### Escalation Rules

- Escalate **Quick → Standard** if the first five sources disagree.
- Escalate **Standard → Deep** if major claims lack two independent sources.
- Escalate **Deep → UltraDeep** if the decision is difficult to undo or touches customer trust.

## Research Type Taxonomy

| Type | Core Question | Primary Inputs | Typical Tool Chain |
|---|---|---|---|
| `technology-eval` | Which option is best and why? | docs, repos, ecosystem signals | Context7 → Deepwiki/Repomix → Tavily/Exa |
| `codebase-investigation` | What does this codebase actually do? | local files, repo structure | Glob/Grep/Read → Repomix → Deepwiki |
| `cross-stack-analysis` | How do multiple dependencies or systems interact? | package graph, docs, compatibility notes | package scan → Context7 per dependency → Tavily/Exa |
| `greenfield-spec` | What should be built for a new initiative? | intent, constraints, landscape | spec framing → Exa/Tavily → Context7 |
| `brownfield-trace` | What exists now and where is the risk? | package.json, README, imports, local code | local scan → version trace → Context7/Deepwiki |

## Type Detection Heuristics

### `technology-eval`

Signals: compare, versus, trade-off, choose, alternative, migration target

### `codebase-investigation`

Signals: trace, find, where is, how is this wired, what owns, investigate repo

### `cross-stack-analysis`

Signals: compatibility, integration, interplay, stack, dependency graph, cross-service

### `greenfield-spec`

Signals: starting from scratch, new product, initial architecture, evaluate options for a new build

### `brownfield-trace`

Signals: existing system, current app, legacy, upgrade, drift, production behavior

## Classification Workflow

1. Assign a **stakes level**.
2. Map stakes to a **mode**.
3. Assign one **primary type**.
4. Record any **secondary types** for sub-questions.
5. Choose tools only after both mode and type are fixed.

## R0-R7 Diagnostic State Machine

| State | Symptom | Likely Cause | Action |
|---|---|---|---|
| R0 | Search started without framing | No scope calibration | Return to mode/type classification |
| R1 | Queries use outsider language only | No vocabulary discovery | Run Phase 0.5 vocabulary expansion |
| R2 | All sources agree too quickly | Echo chamber | Run counter-perspective queries |
| R3 | Findings stay in one domain | Domain blindness | Add adjacent domains and synonyms |
| R4 | Only recent or only old sources | Recency bias | Rebalance source mix |
| R5 | Many tabs, weak conclusions | Breadth without synthesis | Build claims-evidence table now |
| R6 | Unsure whether to stop | No explicit thresholds | Check mode targets and stop conditions |
| R7 | Can explain answer and unknowns | Research complete | Package evidence and validate |

### State Transitions

- R0 must move to R1 or the packet is malformed.
- R1 must clear before Deep or UltraDeep work continues.
- R2 or R3 triggers a mandatory counter-perspective pass.
- R5 blocks new search until at least one synthesis pass is written.
- R7 requires claims, evidence, caveats, and explicit unknowns.

## Multi-Type Requests

Some prompts naturally span multiple types. Use one primary type and split the rest into targeted sub-questions.

### Priority Order

1. `brownfield-trace` beats `technology-eval` when current production truth is in doubt.
2. `cross-stack-analysis` beats `technology-eval` when compatibility is the real risk.
3. `greenfield-spec` beats `technology-eval` when requirements are still unstable.

### Example

Prompt: `How does Next.js App Router compare to Remix for a large commerce app already using Shopify APIs?`

- Primary type: `cross-stack-analysis`
- Secondary types: `technology-eval`, `brownfield-trace`
- Recommended mode: `Deep`

## Stop Conditions by Mode

| Mode | Stop When |
|---|---|
| Quick | Minimum source count reached and no critical contradiction remains |
| Standard | Thresholds met and at least one counter-perspective query completed |
| Deep | Thresholds met, major claims have 2+ sources, and caveats are explicit |
| UltraDeep | Thresholds met, contradiction register is explicit, and no unresolved critical gaps remain |

## Classification Output Fields

Record these fields in every research packet:

- `mode`
- `depth`
- `primary_type`
- `secondary_types`
- `decision_stakes`
- `diagnostic_state`
- `credibility_floor`
- `source_target`
