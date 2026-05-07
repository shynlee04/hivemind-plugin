# Pre-Phase OMO Adaptation Checklist — 2026-05-07

**Document type:** Checklist / gate blueprint  
**Route:** Option 3 — Sector Governance Foundation Phase  
**Status:** Docs-only gate blueprint; runtime readiness blocked  
**Evidence level:** L5 documentation evidence only

Runtime readiness: FAIL/BLOCK until L1-L3 runtime proof exists

---

## Entry Gate

| Gate Item | Required Evidence | Status |
|---|---|---|
| Scope confirms docs-only foundation | Task packet excludes `src/**` and `.opencode/**` edits. | PASS for this artifact set |
| Current active route identified | `.planning/ROADMAP.md:16-27` shows CA-04 active route, not exact Option 3 phase name. | PASS with concern |
| Hivemind identity preserved | `.planning/PROJECT.md:5-8` and `.planning/codebase/ARCHITECTURE.md:38-44`. | PASS |
| Runtime readiness claim blocked | Checklist states exact evidence honesty phrase. | PASS |

---

## Required Pre-Phase Inventory

| Inventory Area | Required Action Before Implementation | Blocker If Missing |
|---|---|---|
| Code files | Inventory target files and line-count/module-size risks before any `src/**` edit. | BLOCK |
| Overlapping surfaces | Map `src/`, `.opencode/`, `.hivemind/`, `.planning/`, and `tests/` affected surfaces. | BLOCK |
| Conflicts | Detect contradictions between CA-04 priority work and Option 3 governance sequencing. | BLOCK |
| Shallow non-E2E risks | Identify whether proof is unit-only, documentation-only, mocked, or live runtime. | BLOCK |
| Existing consumers | List actor/consumer/purpose for each future command/workflow/session change. | BLOCK |
| State ownership | Identify typed owner for every `.hivemind/` state directory touched. | BLOCK |

---

## Lifecycle / Pipeline Surface Checklist

| Surface | Category | Required Check | Status Before Runtime Work |
|---|---|---|---|
| `src/tools/**` | Command/write-side | Verify schemas, mutation authority, response envelope, and tests. | BLOCK until inventoried |
| `src/hooks/**` | Lifecycle/read-side | Verify no durable writes and hook category fit. | BLOCK until inventoried |
| `src/lib/**` | Deep module logic | Verify owner module, dependency direction, max LOC, and state contracts. | BLOCK until inventoried |
| `src/cli/**` | CLI/bootstrap | Verify init entrypoints, non-interactive behavior, and recovery semantics. | BLOCK until planned |
| `.opencode/**` | Primitives | Verify primitives-only boundary and lineage naming. | BLOCK for this phase |
| `.hivemind/**` | Internal state | Verify Q6 state root and typed owner. | BLOCK until owner defined |
| `.planning/**` | Documentation/governance | Verify date-stamped categorized artifacts. | PASS for this phase |
| `tests/**` | Verification | Verify unit/integration/E2E coverage and live evidence level. | BLOCK until future runtime work |

---

## Naming and Actor/Consumer/Purpose Gate

| Check | Acceptance Criterion | Status |
|---|---|---|
| Naming conventions | Future docs and primitives SHALL preserve hm/hf/gate/stack naming and date-stamped planning artifacts. | PASS for docs |
| Actor map | Every future phase SHALL define actor, consumer, purpose, and boundary before changes. | PASS as blueprint |
| Consumer proof | Every config or command field SHALL identify at least one runtime consumer before delivered status. | BLOCK for runtime |
| State root | Runtime state SHALL remain `.hivemind/`; `.opencode/` SHALL remain primitives-only. | PASS as criterion |

---

## OpenCode SDK / Server API Checkpoints

| Checkpoint | Required Evidence | Gate Status |
|---|---|---|
| SDK session creation | Live or integration proof that child sessions can be created with intended parent linkage. | FAIL/BLOCK |
| Tool registration | Runtime proof that tools register and execute under current `@opencode-ai/plugin` API. | FAIL/BLOCK for new work |
| Hook registration | Runtime proof that hook signatures match current OpenCode SDK/plugin surfaces. | FAIL/BLOCK for new work |
| Command execution | Proof that command parsing and workflow routing execute non-interactively. | FAIL/BLOCK |
| Continuity read/write | Proof that persistence writes to `.hivemind/` through authorized modules. | FAIL/BLOCK for new modules |

---

## Quality Gate Blueprint

| Gate Order | Gate | What It Checks | Docs-Only Verdict |
|---|---|---|---|
| 1 | Lifecycle Integration | 9-surface mutation authority, CQRS boundaries, actor hierarchy, event-driven wiring. | PARTIAL — docs map exists; runtime proof missing |
| 2 | Spec Compliance | Bidirectional traceability, gap detection, EARS acceptance criteria. | PARTIAL — docs have traceable requirements |
| 3 | Evidence Truth | L1-L5 evidence hierarchy and runtime proof. | FAIL/BLOCK — only L5 documentation evidence exists |

---

## Metrics and Blockers

| Metric | Required Threshold Before Runtime Work | Current Docs-Only Status |
|---|---|---|
| Required artifacts exist | 4/4 date-stamped artifacts | Expected PASS after write |
| Source traceability | Every requirement links to source evidence or explicit gap | PASS in artifacts |
| Runtime readiness | L1-L3 runtime/integration proof available | FAIL/BLOCK |
| Source code mutation | No `src/**` changes in docs-only phase | Must verify |
| Primitive mutation | No `.opencode/**` changes in docs-only phase | Must verify |
| E2E proof | At least one live integration/E2E path for runtime claims | FAIL/BLOCK |

---

## Blueprint for Future Phases

1. **OMO Architecture Adaptation Research / Context Alignment** — finalize adapt/reject boundaries and traceability.
2. **Hivemind Sector AGENTS.md Target Architecture** — lock sector guidance strategy without writing sector files.
3. **Command vs Workflow vs Session/Task Continuity Map** — separate lifecycle/pipeline surfaces and owners.
4. **Sector AGENTS.md Docs Implementation** — write actual sector guidance only after this checklist and gates pass.
5. **Bootstrap/init CLI** — future runtime phase requiring SDK/CLI proof and tests.
6. **Config realm cleanup** — future runtime/config phase requiring consumer proof for each field.
7. **Routing workflow foundation** — future f-04 workflow router design and implementation phase.
8. **Session/task continuity management** — future typed ownership and lifecycle proof phase.

---

## Blocked-State Rule

Any future implementer SHALL return BLOCKED if the requested work depends on OMO folder copying, Bun-only runtime assumptions, direct persistence writes outside authorized modules, `.sisyphus`/`.omx` roots, or runtime readiness claims based only on documentation.
