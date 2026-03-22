---
name: use-hivemind-detox-refactor
description: Use when multi-stage framework refactor, recovery, or detox work needs local routing across context, delegation, git continuity, codemap, debugging, and staged restoration without depending on an external skill graph.
---

# use-hivemind-detox-refactor

Use this as the single advanced entry skill for multi-stage framework refactor and recovery work, especially when you need one local pack that can route context, delegation, git continuity, codemap, debugging, and staged restoration.

This router stays intentionally thin. It owns stage selection, branch-family selection, loop governance, escalation, and synthesis checkpoints. It does not own the deep mechanics of codemap generation, system-debug execution, delegation implementation, or git-continuity retrieval.

> **⚠️ POLLUTION WARNING — READ BEFORE PROCEEDING**
>
> When this skill is activated, **assume the workspace is POLLUTED until proven otherwise.**
> This means: documents may be stale, tests may emit false signals, governance files may
> reference non-existent entities, prior session context may be wrong, and remembered facts
> are suspect. The front agent (you, the orchestrator) must operate under these rules:
>
> 1. **Do not trust inherited context.** Verify from code, git, or build output before acting.
> 2. **Do not load deep work into your session.** Delegate scans, audits, and debug to subagents.
> 3. **Do not make completion claims without evidence.** Use `context-entry-verify` for proof.
> 4. **Treat every document as advisory.** Code wins when documents contradict observable behavior.
> 5. **Declare the rot level explicitly** at session start using `context-intelligence-entry`.
>
> Read the pack-level `AGENTS.md` for the full operational notice to inject into the workspace.

## Session Freshness Discipline

The front agent's session is the most expensive context in the system. Protect it.

1. **The orchestrator routes and synthesizes.** It does NOT scan, debug, or audit inline.
2. **Deep work is always delegated.** Codemap passes, file-by-file audits, debug reproduction loops, and exhaustive scans run in subagent sessions — never in the main session.
3. **Only compressed carry-forward enters the main session.** When a subagent returns, carry only: (a) ≤5 key findings, (b) blocked routes, (c) recommended next action, (d) output paths. Discard detailed results — they live in their output files.
4. **At turn boundaries, emit a continuity checkpoint.** Use `git-continuity-memory` to write `sessions/continuity.json` and `longhaul/task-state.json` so the next turn can resume without re-scanning.
5. **If the main session grows stale or overloaded,** delegate a fresh `context-intelligence-entry` probe rather than trusting accumulated context.

## Context Budget Discipline

Every piece of context loaded into the orchestrator has a cost. Enforce these limits:

| Content Type | Load Into Orchestrator? | Instead |
|---|---|---|
| Full file contents from scans | NO | Delegate scan, receive carry-forward summary |
| Detailed test output | NO | Delegate verification, receive PASS/FAIL + failure evidence |
| Raw debug logs | NO | Delegate debug, receive hypotheses + evidence |
| Seam inventories (full) | NO | Delegate codemap, receive seam-count + critical seam list |
| Delegation return contracts | YES (compressed) | Read status + findings + blocked_routes |
| Continuity checkpoints | YES | Read to determine next action |
| Control references and stage contracts | YES (minimal) | Read only the rule or field set needed for routing |
| Work-product artifacts from delegated scans/debug | NO | Read summary fields and output paths only |
| Pack-level AGENTS.md | YES (once) | Inject at session start |
| Stage model / branch families | YES (once) | Reference for routing decisions |

**Rule:** If you are about to read more than ~50 lines of content from a subagent's output, you are loading too much. Read the summary fields and output paths only.

## Shared Contract Keys

Use these keys pack-wide when the router coordinates long-haul work:

- identity: `ses_id`, `task_id`, `pass_id`, `batch_id`, `packet_id`, `loop_id`, `slice_id`, `stage_id`
- routing: `activity_type`, `phase_type`, `mode`, `execution_mode`, `scope`, `out_of_scope`
- continuity: `branch`, `worktree`, `worktree_role`, `open_loop_ids`, `open_packet_ids`, `resume_from`
- evidence: `confirmed`, `inferred`, `unverified`, `confidence`, `artifacts_written`
- cleanup gate: `surface_class`, `ownership_evidence`, `projection_safety`, `cleanup_allowed`

When a child result omits these keys, the router should treat the return as incomplete rather than silently improvising missing state.

## Delegation-First Mandate

This router exists because the workspace is too polluted or complex for a single agent session to hold. Respect that:

1. **Every stage beyond triage (Stage 1) should produce a delegation packet** before deep work begins.
2. **The front agent selects the family and emits the packet.** The subagent does the work.
3. **If the front agent catches itself doing deep file reads, pattern matching, or multi-file analysis,** it is violating the mandate. Stop and delegate.
4. **Sequential delegation is the default.** Parallel delegation is allowed only after Stage 4 partitioning produces isolated slices.
5. **When resuming from a prior turn,** read `{activity}/sessions/continuity.json` and `{activity}/longhaul/task-state.json` FIRST — do not re-derive state from scratch.

## Router Ownership
- own stage selection and branch-family entry
- own project-condition routing and stop conditions
- own sequential vs parallel authorization gates
- own synthesis checkpoints and late-stage stabilization
- own session freshness and context budget enforcement
- refuse to become another broad master builder
- refuse to load deep work into the orchestrator session

## Branch Families

| Family | Role | Current Shape |
| --- | --- | --- |
| `context` | trust, diagnostics, authority baseline, verification proof | `context-intelligence-entry` + `context-entry-verify` |
| `delegation` | bounded partitioning, role envelopes, handoff discipline | `hivemind-delegation-protocol` |
| `git-memory` | continuity, retrieval, recovery anchors | `git-continuity-memory` |
| `codemap` | whole-codebase mapping, high/low scan lattice, seam inventory | `hivemind-codemap` |
| `system-debug` | reproducibility, narrowing, containment, debug-to-refactor transition | `hivemind-system-debug` |

Read `references/branch-families.md` before expanding the center.

## Use This For
- strategic detox of polluted or overgrown framework surfaces
- staged restoration of degraded routing, memory, delegation, or governance flows
- investigation-first recovery where debugging and refactor must stay integrated
- skill-pack redesign that needs explicit templates, metrics, and follow-up outputs

## Do Not Use This For
- ordinary product implementation unrelated to framework repair
- generic one-off git or debugging help without structural routing needs
- direct routing into archived, deprecated, or phantom skill targets

## Preconditions
- this refactored pack is the active skill surface
- root `skills/` and `.opencode/**` are evidence only unless explicitly chosen for migration work
- unsupported `MUST LOAD`, `auto-run`, or privileged-router claims are treated as suspect until verified
- the task is about investigation, repair, recovery, or redesign of framework control flows

## Three Core Patterns

### Pattern 1: Smallest Useful Family
- Load only the target branch family and the minimum local references.
- Read bundled references, templates, and tests before proposing changes.
- Prefer local family skills over deleted sibling skills outside this directory.

### Pattern 2: Context Isolation Through Delegation
- Split work by branch family, seam, or concern.
- Use `hivemind-delegation-protocol` for every real handoff.
- Use parallel delegation only after Stage 4 partitioning.

### Pattern 3: One Advanced Router
- Classify the concern.
- Select the stage path.
- Select the minimum branch family set.
- Emit the correct report template and next bounded action.

## Stage Workflow

| Stage | Objective | Main Branch Families | Primary Output |
| --- | --- | --- | --- |
| 1. Triage and contamination assessment | classify the defect and choose the smallest safe family entry | router + `spec-distillation` when the request is still noisy | investigation report |
| 2. Context isolation | set authority boundaries and execution slices | `context` + `hivemind-delegation-protocol` | partition plan |
| 3. History and memory retrieval | decide if git continuity is trustworthy enough to guide recovery | `git-continuity-memory` | continuity manifest + knowledge synthesis |
| 4. Architectural decomposition | split the problem into bounded structural slices | `hivemind-codemap` | detox assessment report |
| 5. Risk containment | define rollback, quarantine, and safe sequencing | `hivemind-system-debug` + `hivemind-delegation-protocol` | partition plan |
| 6. Systematic debugging | reproduce, narrow, collect evidence, contain risk | `hivemind-system-debug` | debug stage report |
| 7. Refactor strategy selection | choose reusable refactor technique per slice | router refactor techniques + `hivemind-codemap` | refactor stage report |
| 8. Staged restoration | land bounded restorative change only after loop closure and cleanup proof | selected local family owners + `context-entry-verify` | refactor stage report |
| 9. Verification and regression control | verify restored slices and regression boundaries | `context-entry-verify` | verification handoff |
| 10. Documentation and memory reintegration | emit retrieval and synthesis outputs for future recovery | `git-continuity-memory` + router templates | knowledge synthesis |
| 11. Follow-up stabilization | capture remaining risks and next bounded actions | router templates + `context-entry-verify` | stabilization report |

The 11-stage workflow is the expanded execution form of the current 8-step emergence path. Read `references/stage-model.md`, `references/stage-contracts.md`, and `references/emergence-path.md` together.

## Restoration Gate

Stage 8 is not permission for blind cleanup.

Before any cleanup, deletion, or restoration that mutates a questionable surface, the router must confirm:

1. `open_loop_ids` and `open_packet_ids` are empty for the target surface.
2. `surface_class` and `ownership_evidence` are recorded.
3. `projection_safety` is explicit, especially for `.opencode/**`, generated mirrors, and mixed local-config surfaces.
4. `cleanup_allowed` is still `no` until the prior three checks pass.
5. destructive cleanup has explicit user approval.

If any item fails, stop and route back to Stage 2, Stage 4, or Stage 6 instead of continuing.

## Transitional Bundle Mapping

| Bundle | Scope | Primary Target Skills |
| --- | --- | --- |
| A | entry diagnostics and hard verification | `context-intelligence-entry`, `context-entry-verify` |
| B | deterministic delegation and handoff packets | `hivemind-delegation-protocol` |
| C | git continuity and semantic retrieval | `git-continuity-memory` |
| D | codemap and staged refactor routing | `hivemind-codemap`, `spec-distillation`, router refs |
| E | debug containment and restoration proof | `hivemind-system-debug`, `context-entry-verify` |

Read `references/capability-bundles.md` only as a bridge from the earlier bundle model to the branch-family model.

## Linked Knowledge Expectations
- Read `references/linked-knowledge.md` before assuming family behavior.
- Read `references/retrieval-network.md` before trusting continuity claims.
- Read `references/deterministic-delegation.md` before dispatching subagents from this router.
- Read codemap-family references before choosing `quick`, `deep`, `exhaustive`, `native`, `repomix`, or `hybrid` scan paths.

## Reusable Refactor Techniques
1. `authority extraction`
2. `route tombstoning`
3. `seam isolation`
4. `staged strangler restoration`

Use these only after Stages 2-6 complete. Read `references/refactor-techniques.md` for fit, prerequisites, and output artifacts.

## Deterministic Delegation
- Stage 2 and Stage 5 default to sequential isolation.
- Stage 4 is the only stage that can authorize parallel swarms.
- Read `references/deterministic-delegation.md` and emit `templates/partition-plan.md` before dispatching any parallel swarm.
- Use `hivemind-delegation-protocol` as the local delegation family.
- Route whole-codebase mapping through `hivemind-codemap` rather than overloading the center.
- Route unresolved breakage through `hivemind-system-debug` before choosing refactor.

## Report Outputs
- `templates/investigation-report.md`
- `templates/detox-assessment-report.md`
- `templates/knowledge-synthesis-report.md`
- `templates/debug-stage-report.md`
- `templates/refactor-stage-report.md`
- `templates/partition-plan.md`
- `templates/verification-handoff.md`
- `templates/continuity-manifest.md`
- `templates/stabilization-report.md`
- `templates/follow-up-guidance.md`

## Governance Recovery Emphasis
- Governance recovery is a first-class outcome, not a documentation afterthought.
- Stages 10-11 must make authority surfaces, reintegration rules, and remaining drift explicit before the router can be considered complete.

## Immediate Refusals
- any route that depends on deleted sibling skills outside this pack for the normal path
- any route to missing targets such as `permission-design`, `Domain specialist`, `use-hivemind-session-resume`, `session-memory-resume`, or `delegation-handoff`
- any live route into `_archived` or `_deprecated_hive`
- any request to trust `.opencode/**` as remediation authority
- any attempt to push codemap or system-debug mechanics back into this central router

## Terminal State
- the concern is classified
- the stage path is selected
- the family set is selected
- the required report template is chosen
- blocked routes, failure indicators, and the next bounded action are explicit
