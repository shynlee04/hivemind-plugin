# use-hivemind-detox-refactor Emergence Map

## Purpose
- Make the emergence path of `use-hivemind-detox-refactor` explicit across the linked `hivemind-*` skill network.
- Convert the current concern-level router into a staged detox-refactor architecture with clear bundle roles, report outputs, and follow-up flow.

## Verified Current State
- `skills/use-hivemind-detox-refactor/` exists and already defines bundles, guards, and refusals.
- Active root `skills/**` do not currently point back to `use-hivemind-detox-refactor`; the live root graph is mostly outbound-only from the router package.
- The strongest references to the router still live in design/planning artifacts, not in inbound root skill links.
- Therefore the current problem is not missing existence; it is missing emergence and staged operational clarity.

## Network Inventory
| Skill | Current Role | Main Risk / Blocker | Recommended Action | Target Router Role |
| --- | --- | --- | --- | --- |
| `use-hivemind` | broad framework entry router | claims first-load authority and routes to missing `Domain specialist` | refactor + constrain | Bundle A intake only |
| `context-intelligence-entry` | context-health/evidence pack | unsupported mandatory posture; heavy heuristic harness | refactor + constrain | Bundle A baseline evidence |
| `use-hivemind-context-integrity` | context-rot router | vocabulary mismatch with script output | refactor | Bundle A contract-normalization target |
| `use-hivemind-context-verify` | verification router | duplicates stronger verifier | migrate or narrow | Bundle A duplicate-route cleanup |
| `context-entry-verify` | strongest verification implementation | planning-gate noise outside convention | keep + refine | late-stage verification authority |
| `use-hivemind-hierarchy` | hierarchy router | phantom routes: `permission-design`, `profile management`, `governance enforcement` | refactor + constrain | Bundle B route-repair target |
| `agent-role-boundary` | role-boundary reference authority | policy only, no runtime enforcement | keep | Bundle B reference authority |
| `use-hivemind-delegation` | delegation router | downstream writer not truly implemented | refactor + constrain | Bundle B bounded handoff classifier |
| `hivemind-delegation-write` | intended delegation implementation | asset directories effectively empty; cross-pack leaks | refactor or rebuild | Bundle B implementation target |
| `use-hivemind-git-memory` | git-memory entry router | phantom resume route and weak script discipline | refactor + constrain | Bundle C intake/classification |
| `git-atomic-memory` | semantic memory implementation | missing packaged scripts; phantom resume/handoff references | refactor | Bundle C recovery substrate |
| `hivemind-skill-write` | meta-builder authoring surface | can dominate before audit is stabilized | isolate + refactor | Bundle D target |
| `spec-distillation` | intake/spec cleanup skill | already improved; not core governance | keep | supporting intake/spec lane |
| `use-hivemind-detox-refactor` | detox router | still too thin on staged path and linked knowledge expectations | refactor in isolation | primary advanced entry |

## Emergence Path
1. `Stage 1 - Intake and concern classification`
   - classify the request into the smallest detox concern and bundle
   - refuse archived, deprecated, or phantom routes immediately
2. `Stage 2 - Authority and contamination baseline`
   - verify root authority, projection drift, route validity, and unsupported enforcement claims
3. `Stage 3 - Retrieval and continuity check`
   - decide whether git/memory/history is trustworthy enough to guide recovery
4. `Stage 4 - Deterministic partitioning`
   - split work by bundle/domain and choose sequential vs parallel isolation
5. `Stage 5 - Root-cause debugging and containment`
   - gather evidence, reproduce, narrow, contain, and define rollback boundaries
6. `Stage 6 - Refactor strategy selection`
   - choose reusable refactor techniques per slice
7. `Stage 7 - Staged restoration`
   - execute bounded cleanup bundle-by-bundle
8. `Stage 8 - Governance reintegration and stabilization`
   - verify, update `AGENTS.md`/nested governance docs, emit synthesis and follow-up reports

## Three Required Usage Patterns

### Pattern 1: Steal the skills
- Purpose: deep synthesis before edits.
- Inputs: bundle targets, linked assets, references, scripts.
- Outputs: knowledge-synthesis report, bundle risk inventory, missing-asset inventory.
- Router placement: pre-refactor support for Stages 2-4.

### Pattern 2: Context isolation through subagents
- Purpose: keep broad governance rot from contaminating the main thread.
- Inputs: bundle target, scope boundary, execution mode, result contract.
- Outputs: bounded evidence summary, no speculative redesign.
- Router placement: Stage 4 partitioning and Stage 5 deep investigation.

### Pattern 3: Advanced routing through one entry skill
- Purpose: choose bundle, helper lane, depth, and output contract.
- Inputs: project condition, rot severity, continuity quality, incident type.
- Outputs: stage path, helper lane, blocked routes, next bounded step.
- Router placement: full workflow owner.

## Supporting Capability Bundles The Router Must Make Explicit

### Git continuity and semantic retrieval
- Entry: `use-hivemind-git-memory`
- Substrate: `git-atomic-memory`
- Required additions: manifest outputs, explicit worktree/branch rules, removal of phantom resume targets, stronger commit discipline.

### Systematic debugging
- Primary external lane: `context-map` -> `systematic-debugging` -> `verification-before-completion`
- Must be integrated in Stages 2, 3, and 5.

### Reusable refactor techniques
1. `Authority extraction`
   - move each concern to one real owner
2. `Route tombstoning`
   - block phantom targets instead of guessing replacements
3. `Seam isolation`
   - split cross-bundle leaks into explicit boundaries
4. `Staged strangler restoration`
   - replace polluted routes in bounded slices with verification gates between slices

### Deterministic delegation and orchestration
- Use pure read-only `explore` swarms for synthesis-only scans.
- Use sequential delegation when bundle order matters.
- Use parallel delegation only after Stage 4 defines independent slices.

### `AGENTS.md` governance recovery
- Treat as late-stage reintegration, not entry routing.
- Use `create-agentsmd` -> `technical-writer` -> `agent-architect` only after authority and bundle ownership are settled.

## Template Map
- Existing repo-level starting points:
  - `templates/audit-report-template.md`
  - `templates/research-report-template.md`
  - `templates/verification-report-template.md`
  - `templates/gate-checklist-template.md`
- The isolated refactor package should ship local templates for:
  - detox assessment
  - debug stage report
  - refactor stage report
  - knowledge synthesis
  - stabilization follow-up

## Immediate Implementation Sequence
1. Refactor `.developing-skills/refactored-skills/use-hivemind-detox-refactor/` into a stage-based package with explicit bundle roles.
2. Add package-local references for emergence path, stage model, and capability bundles.
3. Add package-local report templates so the router can emit operational outputs instead of only a bounded next step.
4. Only after the isolated proof is coherent, decide what to upstream into root `skills/use-hivemind-detox-refactor/`.
