# HiveMind Refactor Master Plan

**Date**: 2026-03-07
**Status**: Active
**Owner**: Root `PLAN.md` is the only human-readable Source of Truth for the refactor program.

---

## 1. Charter

This file is the sole refactor SOT.

Everything else is subordinate:

- `hivemind-comprehensive-audit-report.md` is a reference document only.
- `.opencode/` is a conditional donor surface only.
- `.hivemind/` is runtime/planning evidence, not the master plan.
- `dist/` is shipped-runtime evidence, not design authority.

The target end-state is:

1. `src/` becomes the only master code surface.
2. `.opencode/` no longer contains required runtime dependencies.
3. Redundant control planes, duplicated logic, and overlapping authorities are removed.
4. Every refactor phase follows one fixed protocol:
   `expand -> investigate -> research on knowledge detail -> decision -> sub-plan -> authorize -> execute -> gatekeeping -> atomic commit`

No future session may treat any other document as equal to this plan.

---

## 2. Validated Baseline

The following findings are accepted as validated enough to drive the refactor:

1. `src/` and `.opencode/` have functioned as overlapping governance/control planes, and residual overlap remains.
   `src/index.ts` registers the main runtime hooks. The former `.opencode/plugins/hiveops-governance/*` control plane has now been removed, but `.opencode/tool/*` still contains residual governance/state-writing and artifact-writing surfaces that must be classified, isolated, and either absorbed or reduced to thin wrappers.
2. The former `.opencode` fallback layer was only partial, and residual `.opencode` authority must now be treated as targeted remaining debt rather than active plugin ownership.
   The plugin-side fallback/injection layer no longer defines the current runtime, but the remaining `.opencode/tool/*` surfaces still preserve a secondary authority path until the next Phase 1 cycles freeze ownership.
3. `dist/` is the effective shipped runtime.
   Published installs execute `dist/**`, not `src/**`, so `src` vs `dist` drift is a real architectural risk.
4. `.hivemind/` has split authority across runtime state, graph state, session records, planning artifacts, and compatibility stores.
   Some of these are active, some are stale, and some are legacy/compatibility only. The TODO/task stream must now be regulated explicitly: `graph/tasks.json` is the global navigation/SOT surface, `state/tasks.json` is the materialized operational write model, `brain.offtrack_todo_pending` is the poisoning-survival quarantine lane, and `state/todo.json` is compatibility output only.
5. Session identity is fragmented.
   Current behavior mixes runtime UUIDs, manifest stamps, session profile directories, and legacy JSON export identifiers.
6. Mirror/parity checks are not reliable until owner/mirror roles are declared first.
   Source-vs-mirror ambiguity currently invalidates parity as a truth signal.

The following findings are accepted with adjustment:

1. The other team correctly identified overlap and duplication, but their report is not authoritative.
2. `.opencode/` contains useful patterns, but it is not presumed superior.
3. `.hivemind/project/planning/` remains an important evidence surface, but root `PLAN.md` supersedes it as the master refactor plan.

The following must not drive decisions unless re-validated in a specific phase:

1. Any claim that `.opencode/` should remain an independent long-term runtime layer.
2. Any claim that parity drift alone proves which side is correct.
3. Any edge-case lifecycle statement not directly corroborated by code and current state evidence.

---

## 3. Authority Ledger

| Surface | Current Role | Refactor Role | Rule |
|---|---|---|---|
| `PLAN.md` | New root master plan | Sole human-readable SOT | Always wins over reports, notes, and planning fragments |
| `src/` | Authored runtime logic | Final master code surface | Receives accepted donor logic and owns final runtime semantics |
| `.opencode/` | Mixed mirror + control plane + framework assets | Conditional donor only | Mine selectively, migrate into `src`, then remove dependency |
| `.hivemind/` | Runtime/planning evidence | Evidence + operational data | Use for validation and lifecycle mapping, not as plan authority |
| `dist/` | Shipped executable runtime | Runtime evidence | Must mirror approved `src` behavior; never define design by itself |
| `hivemind-comprehensive-audit-report.md` | External audit | Reference only | Use for claim comparison, not direct adoption |
| Platform adapters (`.agent/`, `.claude/`, `.cursor/`, etc.) | Skill routing overlays | Must resolve to valid targets or be deleted | Dead symlinks are rot vectors; broken links must be fixed, explicitly gated, or removed before any phase closes that depends on skill routing |

### `.opencode` Donor Conditions

A pattern from `.opencode/` may move into `src/` only if all are true:

1. It solves a proven problem in the validated baseline.
2. It does not preserve a second runtime/control plane.
3. It can be implemented without keeping `.opencode/` as a required dependency.
4. It fits the final `src`-owned state and hook model.
5. It can be verified with tests or deterministic repo evidence.

If any condition fails, the pattern is rejected and scheduled for removal instead of migration.

---

## 4. Long-Haul Cycle Model

This refactor is a long-haul program, not a one-shot execution.

Every phase must be broken into human-authorized cycles.

Each cycle may do only one of the following:

1. tighten or correct `PLAN.md`,
2. produce one subordinate dated planning packet,
3. run one bounded investigation wave,
4. execute one approved narrow slice,
5. run one verification and closeout wave.

Cycle rules:

- no cycle may assume authorization for the next cycle
- the operator must explicitly authorize each next cycle after reviewing the prior output
- if a cycle discovers new ambiguity, drift, or contamination risk, it must stop at `sub-plan` or `gatekeeping`, not continue into execution
- no subordinate packet may compete with `PLAN.md`; packets are navigation aids, not authority sources
- each cycle must end with one explicit status: `authorized for next cycle requested`, `blocked`, `closed`, or `branch backward required`

Phase rules:

- each phase may contain multiple cycles
- each phase must begin with a sub-planning cycle before any implementation cycle
- no phase may advance forward while the current cycle is unresolved
- if a phase needs re-interpretation, update `PLAN.md` first before changing downstream packets

## 5. Skill And Agent Routing Ladder

Skills and agents must be loaded progressively, not all at once.

Mandatory skill order:

1. `using-superpowers`
   - required at the start of each cycle to determine what other skills are mandatory
2. `brainstorming`
   - required before changing plan structure, architecture, workflow shape, execution strategy, or behavior expectations
3. `spec-driven-development`
   - required when a phase or sub-phase does not yet have a validated working specification or packet
4. `writing-plans`
   - required only after the spec layer is approved and the next step is to convert it into executable tasks
5. `test-driven-development`
   - required only inside an explicitly authorized implementation cycle before production code changes

Subagent routing rules:

- read-only explorers may be used during `expand`, `investigate`, and `research on knowledge detail`
- parallel subagents may be used only when scopes are demonstrably independent
- implementation subagents may be used only after `sub-plan` is frozen and the operator has authorized execution
- no two execution agents may own overlapping file sets in the same cycle
- subagents must consume filtered evidence from the active cycle, not broad document dumps

Research validation rules:

- unstable claims about packages, agent patterns, SDKs, models, plugins, hooks, or tooling must be validated with current MCP or web-backed sources
- local repository documents may inform hypotheses, but they do not replace code evidence or current external validation for unstable topics
- if validation fails or conflicts remain unresolved, the cycle must stop and request the next authorization with the uncertainty recorded

## 6. Mandatory Refactor Protocol

Every phase and sub-phase must follow this exact order:

### Step 1: Expand

- Define the narrow phase scope.
- List touched surfaces.
- State the exact question this phase is answering.

### Step 2: Investigate

- Read the real code paths and active state evidence for only that scope.
- Build a fact set.
- Do not assume previous documents are correct.

### Step 3: Research On Knowledge Detail

- Validate unstable technical assumptions against current docs/tools when needed.
- Compare donor candidates from `.opencode/` against the fact set.
- Record what is stronger, weaker, or incompatible.

### Step 4: Decision

- Choose one authority path.
- Mark competing claims as `accepted`, `adjusted`, `rejected`, or `unverified`.
- Freeze the decision before execution starts.

### Step 5: Sub-Plan

- Translate the approved narrow slice into one bounded cycle packet or direct `PLAN.md` directive.
- Declare owned files, invariants, verification commands, stop conditions, and the exact skill/agent routing for the cycle.
- Keep the sub-plan small enough to close in one cycle.

### Step 6: Authorize

- Request explicit operator authorization before execution or before opening a new downstream packet.
- Do not treat prior authorization as reusable across cycles.
- If authorization is missing, stop here and report the ready-to-run cycle.

### Step 7: Execute

- Only implement the approved narrow slice.
- Do not expand scope mid-phase.
- Do not start the next phase while the current one is unresolved.
- Follow the skill and agent routing declared in `sub-plan`.

### Step 8: Gatekeeping

- Run the phase verification commands and evidence checks.
- Record residual risks.
- Decide either:
  - `phase closed`
  - `phase blocked`
  - `branch backward to preceding slice`

### Step 9: Atomic Commit

- If the cycle is closed and the retained changes belong to one coherent concern, commit them atomically.
- One cycle must not mix planning hardening, runtime refactors, and unrelated cleanup in the same commit.
- If the cycle is blocked, branched backward, or partially verified, do not commit; stop and request the next authorization.

No session may skip from investigation straight to execution.
No session may skip from sub-plan to execution without authorization.

---

## 7. Refactor Program Phases

### Phase 0: SOT Normalization

**Goal**: Use this file to replace competing planning authority.

**Outputs**:

- root `PLAN.md`
- accepted/adjusted/rejected claim ledger
- initial authority ledger

**Close when**:

- future sessions can operate from this file alone
- the external audit is demoted to reference-only status in practice

### Phase 1: Governance And Control-Plane Unification

**Goal**: End the dual-control-plane condition and freeze one manifest-first ecosystem authority model for `.hivemind` formation.

This phase is a hierarchical umbrella, not one flat execution wave.

**Umbrella decision target**:

- one `src`-owned governance flow
- no `.opencode` runtime control plane left behind
- one dependency-aware map from runtime authority to command and platform surfaces
- one manifest-first `.hivemind` formation model spanning sessions, plans, tasks, workflows, and evidence surfaces
- one ingress/egress classification ledger for every surface that can materialize into `.hivemind/`
- one explicit two-lineage ecosystem contract for `hivefiver` and `hiveminder`, including their delegated agent teams

#### Phase 1 Lanes

| Lane | Core Question | Depends On | Unblocks | Close When |
|---|---|---|---|---|
| `P1-A` Runtime prompt/control-plane authority | Which hook surfaces own per-turn governance injection and fallback semantics? | Phase 0 | `P1-B`, `P1-C`, `P1-D` | canonical prompt/control ownership is frozen and fallback-only behavior is explicitly bounded |
| `P1-B` Entry and intent authority | Who owns `session.created`, bootstrap detection, lineage writes, and lineage-vs-purpose classification? | `P1-A` framing | `P1-C`, `P1-D`, `P1-E` | one entry/intent owner is chosen and lineage routing is separated from session-mode classification |
| `P1-C` Delegation and blocking authority | Where do topology, scope, and hard-stop governance rules live? | `P1-A`, informed by `P1-B` | `P1-D`, `P1-E` | one `src` enforcement contract replaces split GX-Pack blocking vs core advisory behavior |
| `P1-D` State manifestation, compaction, and session-end ownership | How do sessions, plans, tasks, manifests, compaction, and session closeout collapse to one `.hivemind` manifestation model? | `P1-B`, informed by `P1-C` | `P1-C.2b.c`, Phase 2 | one manifest-first/readable/write-authority model is frozen and projection/compatibility surfaces stop behaving like hidden runtime owners |
| `P1-E` Command and agent contract normalization | How do root commands/agents become owner surfaces while mirrors stop behaving like peer authorities? | `P1-B`, `P1-C` | Phase 3 | command and agent contracts align with the frozen governance model and owner/mirror roles are explicit |
| `P1-F` Platform-integrity and symlink gate | Which phantom skill references and broken adapter links block command/skill routing claims? | Runs alongside `P1-E` | `P1-E` closeout, Phase 3a | every skill-routing claim is backed by resolving links or an explicit deferred gate |

#### Phase 1 Cross-Lane Rule

`P1-F` is a scoped integrity gate, not a universal runtime blocker.

Broken symlinks and adapter drift block any lane that claims command, skill, or platform-routing integrity.
They do not block unrelated runtime-hook decisions in `P1-A` through `P1-D`.

#### Phase 1 Sequencing Override

After `P1-C.2b.b`, no further task-semantic expansion, command normalization, or broad runtime migration may proceed until the ecosystem formation model for `.hivemind/` is frozen.

The authorized sequencing override is:

1. `P1-D.1a` ecosystem authority freeze
2. `P1-D.1b` `.hivemind` ingress regulation
3. `P1-D.1c` dead-surface isolation / archive wave
4. `P1-C.2b.c` main/sub-session task survival model
5. `P1-D.2` manifest-first `.hivemind` restructure and lineage-separated state-path migration
6. `P1-E` command/agent normalization and `P1-F` integrity gate

This override exists because deep-scan and live repo evidence now agree on one core problem: task authority has advanced faster than session/planning/startup readability, so continuing to enrich task semantics before freezing the wider ecosystem would amplify `.hivemind` chaos instead of containing it.

#### Phase 1 Audit Cross-Reference

The designated Phase 1 dated audit artifact is `docs/audits/phase1-audit-report-2026-03-08.md`.
That artifact now exists and has been re-verified against current repository truth.
It is a dated Phase 1 reference packet, not a peer authority to `PLAN.md`.

The binding investigation basis for P1 lanes is:

1. this Phase 1 findings ledger inside `PLAN.md`,
2. the dated audit artifact in `docs/audits/phase1-audit-report-2026-03-08.md`,
3. the validated deep-scan inventory in `docs/deep-scan/sector-A-core-session.md`, `sector-B-planning-hierarchy.md`, `sector-C-code-intel.md`, `sector-D-graph-fs.md`, `sector-E-hooks-cli.md`, `sector-F-agents-tools.md`, `sector-G-commands.md`, `sector-H-skills.md`, `sector-I-workflows-templates.md`, and `sector-J-scripts-misc.md` as codebase mapping/reference input,
4. live repo evidence from `src/`, `.opencode/tool/`, and `.hivemind/`.

If the dated audit artifact and `PLAN.md` diverge, `PLAN.md` wins and the audit artifact must be corrected before the containing cycle closes.
If the deep-scan inventory and live code diverge, live code wins and the deep-scan packet must be corrected before the containing cycle closes.

Key audit findings driving P1 lanes:

| Finding | Lane | Action |
|---------|------|--------|
| Dual intent classification (ID-1) | `P1-B` | Unified classifier in `src/lib/` replacing both `session-intent-classifier.ts` and disabled `classify-intent.sh` |
| `lineage: "unresolved"` never updated (SL-1) | `P1-B` | Classify lineage on `session.created` in `event-handler.ts` |
| No lineage-separated state paths (SL-2) | `P1-D` | Lineage-namespaced `.hivemind/state/{lineage}/` paths |
| No delegation router (DL-1) | `P1-C` | Build delegation router using lineage + intent |
| Dual gate systems (GV-1) | `P1-C` | Consolidate `hiveops_gate.ts` → `gatekeeper.ts` |
| Dual SOT systems (GV-2) | `P1-C` | Absorb `hiveops_sot.ts` under the `src` SOT governance umbrella; direct `.opencode` ownership of `sot-index.json` must end |
| Dual TODO systems (GV-3) | `P1-C`, `P1-D` | Freeze graph-sovereign TODO authority: `graph/tasks.json` is the global TODO SOT, `state/tasks.json` is the operational write model, `brain.offtrack_todo_pending` is the quarantine lane, and `todo.json` survives only as compatibility/export output |
| 3 `.opencode/tool/` files write directly to `.hivemind/state/`; `hiveops_export.ts` reads state and writes handoff/checkpoint artifacts (GV-1–4 adjusted) | `P1-C`, `P1-D` | Isolate direct state writers first, then classify `hiveops_export.ts` separately as artifact-path debt |
| Dead GX-Pack PLUGIN_MESSAGE_MARKERS (GV-6) | `P1-A` | Remove dead `plugin-message` channel |
| Bootstrap HARD STOP fixed (GV-5) | `P1-A` | ✅ Completed — auto-run directive |
| Runtime truth outpaces readable manifests (MF-1) | `P1-D.1a`, `P1-D.1b` | Freeze a registry-led manifest-first model and stop treating empty or missing manifests as trustworthy evidence of absence |
| Startup formation is split between plugin boot, planning scaffold, and shell bootstrap paths (MF-2) | `P1-B` closeout, `P1-D.1a`, `P1-D.1c` | Choose one startup formation owner, downgrade duplicate bootstrap/script paths, and stop allowing hidden startup side contracts |
| Planning hierarchy and session hierarchy remain separate but under-explained (MF-3) | `P1-D.1a`, `P1-E` | Explicitly define how plan chains (`root/sub/atomic`) relate to session chains (`trajectory/tactic/action`) without pretending they are the same tree |
| Workflow/template ecosystems can materialize state-like outputs without a frozen ingress policy (MF-4) | `P1-D.1a`, `P1-D.1b`, `P1-E` | Classify which workflows/templates are authority drivers vs projections/evidence so `.hivemind` is not shaped by ambiguous stage outputs |

#### Phase 1 TODO Authority Contract

Phase 1 freezes the TODO/task sovereignty target as:

1. `.hivemind/graph/tasks.json` = durable global TODO/navigation SOT
2. `.hivemind/state/tasks.json` = canonical operational write model owned by `src/tools`
3. `brain.offtrack_todo_pending` = contamination-resistant quarantine lane for deferred intent
4. `.hivemind/state/todo.json` = compatibility/export-only projection
5. OpenCode native todo = UI bridge only; never governance authority

No future P1 cycle may treat `todo.json` or native OpenCode todo surfaces as primary runtime authority.

#### Phase 1 Two-Lineage Ecosystem Contract

Phase 1 now freezes the ecosystem model as two front-facing lineages with delegated support teams, not one blended artifact universe:

1. `hivefiver` = framework/meta-builder lineage
   - owns framework evolution, governance assets, compatibility windows, and framework-healing work
   - may delegate to framework-support specialists, but their outputs must still land through the same `src` + manifest-governed authority model
2. `hiveminder` = project/runtime lineage
   - owns project-facing orchestration, implementation-facing task flow, and project session continuity
   - may delegate to project-support specialists, but their outputs must still land through the same `src` + manifest-governed authority model
3. session, task, plan, workflow, and artifact surfaces must either:
   - declare/derive lineage and delegation relation cleanly, or
   - be classified as `projection`, `quarantine`, `evidence`, `archive`, or `compatibility`
4. no future P1 cycle may allow commands, workflows, hooks, tools, or scripts to materialize `.hivemind` outputs outside canonical queue/manifest/task paths and still claim runtime authority

#### Phase 1 `.hivemind` Formation Target

Phase 1 now freezes the startup/readability target for `.hivemind/` as:

1. `.hivemind/manifest.json` = root formation/inventory manifest, not a per-turn decision surface
2. `.hivemind/state/manifest.json` = hot-state authority index for active runtime stores
3. `.hivemind/sessions/manifest.json` = canonical session registry
4. `.hivemind/plans/manifest.json` = canonical planning registry
5. `.hivemind/graph/tasks.json` = global task/navigation authority; other `graph/*.json` stores are governed by explicit ingress classification, not assumption
6. `.hivemind/INDEX.md`, `.hivemind/sessions/index.md`, and other human-readable summaries are projections only; they may aid navigation, but they are not startup or runtime authority
7. compatibility surfaces such as `.hivemind/state/todo.json`, legacy flat brain/hierarchy projections, legacy `.planning/` roots, and legacy session/profile shims may survive temporarily, but they must not shape startup routing or runtime decisions

No future P1 cycle may introduce a new startup read path that bypasses `src/lib/paths.ts`, canonical manifest readers, or the upcoming ingress policy.
If live runtime state and manifest/readability projections diverge, live `src`-owned authority wins and the manifest/projection side must be regenerated or downgraded before the cycle closes.

For operator readability during Phase 1, the expected human-facing read order is:

1. `.hivemind/manifest.json` → what major surfaces exist
2. `.hivemind/state/manifest.json` → which hot-state files are live
3. `.hivemind/sessions/manifest.json` → which sessions are current vs archived
4. `.hivemind/plans/manifest.json` → which plans are active vs stale
5. `.hivemind/graph/tasks.json` → what is globally in flight

Human operators should not have to start from `brain.json` just to understand the current shape of the system. One explicit Phase 1 objective is to make `.hivemind/` navigable from manifests first, then inspect deep state only when needed.

#### Phase 1 Status Ledger

**Completed**:

- `P1-A` subset 1: prompt-path classifier fallback demotion (commit `697b07a`)
- `P1-A` subset 2: bootstrap lifecycle fix — `STATE_BOOTSTRAP_STOP_DIRECTIVE` auto-run directive, `soft-governance.ts` denial message, `session-lifecycle-helpers.ts` auto-init, `hivemind-bootstrap.ts` JSDoc (2026-03-09)
- `P1-A` subset 3: Dead GX-Pack `PLUGIN_MESSAGE_MARKERS` cleared in `injection-orchestrator.ts`, plugin-message budget zeroed (60/40 bootstrap, 50/50 mid-session ratio fix) (2026-03-09)
- `P1-A` deprecated: Deleted `.opencode/plugins/hiveops-governance/` (9 files), updated 4 test files (2026-03-09)
- `P1-B` subset 1: Lineage classifier `classifyLineageScope()` added to `session-intent-classifier.ts`, wired into `event-handler.ts::ensureSessionCreatedBootstrap()` for canonical `state.session.lineage_scope` assignment — deterministic agent-name resolution (9 agents) + keyword fallback (2026-03-09)
- Phase 1 investigation wave completed; findings are partially absorbed into `PLAN.md` and materialized in `docs/audits/phase1-audit-report-2026-03-08.md` as a re-verified dated reference artifact
- `P1-C.1`: `.opencode/tool/*` isolation packet completed — `hiveops_gate.ts`, `hiveops_sot.ts`, and `hiveops_todo.ts` are frozen as direct `.hivemind/state` writer debt, while `hiveops_export.ts` is frozen as artifact-path debt; closest `src` ownership targets and wrapper-only conditions are recorded in `docs/plans/refactor/phase-1-p1-c-1-opencode-tool-isolation-packet-2026-03-10.md`
- `P1-C.2a`: gate/SOT/export extraction landed — canonical `src/tools/` owners now exist for gate, SOT, and export behavior, and the legacy `.opencode/tool/` surfaces are reduced to compatibility wrappers only
- `P1-C.2b` subset 1: TODO sovereignty lock landed — canonical task authority now routes through `src/tools/hiveops-todo.ts`, `state/tasks.json`, and `graph/tasks.json`; `state-snapshot.ts` and `hiveops-export.ts` now read canonical task authority instead of treating `todo.json` as runtime truth
- `P1-C.2b.a`: lineage identity enrichment landed — canonical tasks now carry `lineage_owner`, `owner_agent`, `origin_session_id`, `parent_session_id`, and `session_kind`; `hiveops-todo`, `todo.updated` ingestion, and manifest→graph sync propagate those fields, and task-manifest flush now materializes `state/tasks.json` before graph sync
- `P1-C.2b.b`: workflow topology classification landed — canonical tasks now carry `workflow_topology`; manual TODO creation defaults to `unclassified` or auto-upgrades to `dependent` when dependencies exist, `todo.updated` preserves inbound topology or defaults safely, and manifest→graph sync keeps topology visible in the global task graph
- `P1-D.1a` subset 1: document-intelligence authority slice landed — `hivemind_doc` is now the canonical document tool, `hivemind_doc_weaver` is normalized and isolated as a compatibility wrapper, and `planning-materializer.ts` now uses `doc-intel` section upserts instead of its own ad-hoc markdown section mutator logic (2026-03-11)
- `P1-D.1b`: ingress regulation slice landed — `src/lib/hivemind-ingress-policy.ts` now classifies `.hivemind` surfaces into `authority`, `projection`, `quarantine`, `evidence`, `archive`, and `compatibility`; canonical task readers assert authority-classified sources, `state-snapshot.ts` emits warnings for compatibility reads, and `hiveops-export.ts` now reads/writes through explicit ingress classes (2026-03-11)

**Active**:

- `P1-D.1a`: ecosystem authority freeze is now the active Phase 1 umbrella slice — sessions, planning, tasks, workflows, hooks, tools, commands, skills, and scripts that can deterministically or programmatically shape `.hivemind/` must be frozen into one registry-led manifestation model before more task-semantic expansion proceeds
- `P1-B` closeout: bootstrap/profile authority alignment remains unresolved — canonical brain-state lineage is classified on `session.created`, but session profile seeding still starts with `agent: "unresolved"` and must be frozen to one owner before `P1-B` can be treated as closed
- `P1-D.1b`: `.hivemind` ingress regulation is now frozen as the foundation rulebook — compatibility/projection surfaces are classified and canonical readers have started enforcing the boundary, but broader readers and producers still need to be cut over or downgraded
- `P1-D.1c`: dead-surface isolation/archive wave is now the immediate follow-on slice inside Phase 1 — messy concept-related surfaces in `src/lib/`, `src/tools/`, `src/hooks/`, CLI/bootstrap logic, workflows, and scripts must now be classified against the ingress ledger before later migration waves touch them
- `P1-D`: state-authority planning remains active; `.hivemind` state shape, startup formation ownership, bootstrap/profile ownership, and lineage-separated pathing are still unresolved

**Next**:

- `P1-D.1a`: freeze the registry-led `.hivemind` ecosystem model — root manifest = topology only, session/plan manifests = authoritative registries, `state/tasks.json` = operational write model, `graph/tasks.json` = durable global task graph, readable markdown = projection only
- `P1-D.1b`: aggressive `.hivemind` ingress regulation cycle — classify each state/artifact surface as `authority`, `projection`, `quarantine`, `evidence`, `archive`, or `compatibility`, and forbid projections from driving runtime decisions
- `P1-D.1c`: aggressive isolation/archive cycle — downgrade duplicate bootstrap, planning, workflow-output, and script-era surfaces before they can keep poisoning `.hivemind`; this is now the next execution slice after the ingress ledger landed
- `P1-C.2b.c`: main/sub-session survival model for canonical tasks — child-session tasks must become explicit delegates of parent-linked global tasks instead of shadow TODO universes, but only after `P1-D.1a` through `P1-D.1c`
- `P1-D.2`: aggressive state-shape reconciliation between live `.hivemind` stores and current `BrainState` ownership, plus lineage-separated state-path migration in `.hivemind/`
- `P1-E`: Command/agent contract normalization
- `P1-F`: Symlink integrity gate

#### Phase 1 Compatibility Isolation / Archive Watchlist

The following surfaces are now explicitly queued for isolation and archive/deprecation decisions during `P1-D.1` and `P1-E`; they are not yet dead by decree, but they are no longer allowed to hide in the background as unnamed debt:

1. `src/lib/framework-context.ts` legacy `.planning/` fallback reads
2. `src/lib/chain-analysis.ts` flat `brain.json.hierarchy` compatibility path
3. `src/lib/manifest.ts` deprecated graph task read/write shims
4. `src/tools/hivemind-inspect.ts` direct flat-state inspection assumptions that predate ingress classification
5. `src/lib/session_coherence.ts` archive/body parsing fallback that bypasses stronger task/graph authority
6. `src/cli/init.ts`, `src/lib/fs/planning-ops.ts`, and `src/hooks/event-handler.ts` overlapping startup formation responsibilities for manifests, session scaffolding, planning roots, and bootstrap side effects
7. `scripts/auto-init.sh`, `scripts/detect-entry.sh`, and `scripts/classify-intent.sh` duplicate bootstrap/entry/classification shell paths that can still seed unresolved or mixed-era state assumptions
8. `scripts/check-state-write-boundary.sh` and `scripts/check-docs-ownership-boundary.sh` stale references to the deleted plugin surface and missing `agents/hivefiver-reserved.md`
9. `.opencode/tool/*.ts` wrapper-only transport surfaces after the `src/tools` cutover
10. `src/hooks/tool-gate.ts` deprecated/helper-only compatibility exports that survive only for older callers
11. `src/tools/hivemind-bootstrap.ts` unresolved-lineage bootstrap shims that still mirror older state assumptions
12. `.hivemind/anchors/`, `.hivemind/mems/`, `.hivemind/INDEX.md`, and `.hivemind/sessions/index.md` as readability/compatibility surfaces only until regenerated from manifest-backed truth
13. workflow/template stage-output surfaces that can materialize state-like artifacts without a frozen ingress policy, especially under `.opencode/workflows/` and `.opencode/templates/`
14. `src/tools/hivemind-doc-weaver.ts` as a compatibility-only wrapper pending full caller normalization onto `hivemind_doc`
15. `.hivemind/state/runtime-profile.json`, `.hivemind/state/context-recovery.json`, and `.hivemind/state/health-metrics.json` as compatibility-era state projections that must not silently re-enter runtime authority
16. `.hivemind/sessions/active/*/profile.json` as bootstrap/session shims that remain unresolved until `P1-B` closeout freezes profile authority

Any future cycle that touches one of these surfaces must classify it as `retain`, `isolate`, `compatibility-only`, or `archive/remove` before the cycle closes.

### Phase 2: State, Session, And Identity Unification

**Goal**: reduce `.hivemind/` to a coherent authority model.

**Focus**:

- brain/session model
- graph/task/session manifest relationships
- session identity normalization
- handoff/export/resume authority
- planning evidence vs runtime evidence boundaries

**Decision target**:

- one canonical identity model
- one canonical session lifecycle model
- explicit classification of active vs compat vs stale stores

### Phase 3: Tool, Command, And Donor Absorption

**Goal**: absorb valid `.opencode` patterns into `src` and burst redundancies.

**Focus**:

- duplicated tool/command domains
- donor evaluation against the conditions above
- migration of accepted logic into `src`
- deletion list for rejected or obsolete `.opencode` surfaces
- broader skill ecosystem cleanup after the Phase 1 command/platform gate is frozen

**Decision target**:

- tool-centric `src` surface
- no imperative markdown command surface driving architecture

#### Phase 3a: Skill Ecosystem Integrity

**Goal**: complete the broader skill-surface cleanup after the Phase 1 gating pass.

**Focus**:

- 22 phantom registry entries (root `skills/registry.yaml` tracks entries that exist only in `.opencode/skills/`)
- 40 broken symlinks across 11 platform adapter directories (all target `.agents/skills/` which does not exist)
- concept/mechanic separation: universal skill concepts in root `skills/`, platform bindings in `.opencode/skills/`
- broken `docs/plans/AGENTS.md` symlink

**Decision target**:

- every registry entry matches an existing directory
- every symlink resolves to an existing target or is deleted
- skill routing on all supported platforms works without silent failures

### Phase 4: Runtime, Build, And Publish Hardening

**Goal**: make shipped runtime reflect approved `src` semantics.

**Focus**:

- `src` vs `dist` parity
- build graph and publish entries
- dashboard/bin sidecars
- reinstall/reset behavior

**Decision target**:

- `dist` becomes a faithful derivative, not a drifting truth source

### Phase 5: Phasewise Cleanup And Deletion

**Goal**: remove compatibility debris only after the replacement path is proven.

**Focus**:

- leftover `.opencode` runtime dependencies
- stale session/planning/manifest stores
- duplicated scripts and dead command surfaces

**Decision target**:

- sole `src` master
- explicit retained evidence surfaces only

---

## 8. Branching Rule

A later phase may branch backward only when:

1. execution reveals a wrong upstream authority decision,
2. a donor candidate fails one of the donor conditions,
3. a gate exposes missing evidence in a prior phase.

When that happens:

- stop the current phase,
- record the exact upstream dependency that failed,
- reopen only the minimum preceding slice,
- re-close it before resuming forward motion.

No lateral expansion without a recorded branch decision.

---

## 9. Verification Gates

Every execution phase must declare and run its gate set before completion claims.

Minimum gate categories:

1. runtime authority gate
   - verifies the selected owner is the only active authority for that slice
2. donor gate
   - proves accepted `.opencode` logic no longer needs `.opencode` runtime dependency
3. drift gate
   - verifies `src` and `dist` do not disagree on shipped behavior for the slice
4. state gate
   - verifies active vs compat vs stale `.hivemind` stores are correctly classified
5. regression gate
   - verifies existing boundary tests still hold or are intentionally replaced

6. symlink integrity gate
   - verifies all symlinks resolve to existing targets
   - detects broken platform-adapter skill references across all adapter directories
   - validates that no dead reference propagates into runtime behavior or skill routing

This gate is scoped.
It blocks only the lanes and phases that claim command, skill, or adapter-routing integrity.

If a gate cannot be run yet, the phase cannot be closed as complete.
If a gate result is pending, the next cycle may be prepared but not presumed authorized.

---

## 10. Artifact Rules

Any future artifact produced under this plan must:

1. be grouped into a clear category directory,
2. use date-stamped naming,
3. state whether it is `SOT`, `reference`, `evidence`, or `temporary`.

Examples:

- `docs/audits/architecture/control-plane-ledger-2026-03-07.md`
- `docs/plans/refactor/phase-1-governance-unification-2026-03-07.md`
- `docs/plans/refactor/phase-1-cycle-1-governance-sub-plan-2026-03-07.md`
- `docs/evidence/runtime/src-dist-drift-2026-03-07.md`

No new document may silently compete with `PLAN.md`.

---

## 11. Immediate Next Moves

**Current cycle**: `P1-D.1b` completed; `.hivemind` ingress classes are now explicitly frozen, canonical task/export readers are bound to that rulebook, and the next slice can attack dead-surface isolation/archive from a stronger foundation

The current execution slice covers:

1. Keep the Phase 1 plan/audit chain aligned with live repo evidence so the next migration slice starts from current truth instead of stale plugin-era assumptions.
2. Treat the validated deep-scan inventory under `docs/deep-scan/` as mapping/reference input for this phase without allowing it to outrank live code.
3. Keep `P1-B` frozen as implemented-but-not-closed:
   - canonical `state.session.lineage_scope` classification is now wired into `event-handler.ts::ensureSessionCreatedBootstrap()`;
   - bootstrap/profile authority is still unresolved because session profiles still seed with `agent: "unresolved"`.
4. Freeze `P1-C.1` classifications for residual `.opencode/tool/*` authority:
   - `hiveops_gate.ts`, `hiveops_sot.ts`, and `hiveops_todo.ts` are direct state-writer debt;
   - `hiveops_export.ts` is artifact-path debt coupled to state reads;
   - OpenCode-facing wrapper survival is allowed only as a temporary transport exception.
5. Freeze the graph-sovereign TODO contract in code:
   - `.hivemind/graph/tasks.json` is the durable TODO/navigation SOT;
   - `.hivemind/state/tasks.json` is the canonical write model owned by `src/tools`;
   - `brain.offtrack_todo_pending` is the poisoning-survival quarantine lane;
   - `.hivemind/state/todo.json` is compatibility/export output only.
6. Freeze lineage identity on canonical tasks:
   - `lineage_owner`, `owner_agent`, `origin_session_id`, `parent_session_id`, and `session_kind` now survive both manual TODO writes and `todo.updated` ingestion;
   - task-manifest flush materializes `state/tasks.json` before graph sync so hooks no longer bypass the canonical write model.
7. Freeze workflow topology on canonical tasks:
   - `workflow_topology` now survives both manual TODO writes and `todo.updated` ingestion;
   - manual TODO creation defaults to `unclassified` and auto-upgrades to `dependent` when dependency edges are supplied without an explicit topology;
   - deps/list views can now expose topology without inferring it ad hoc from raw dependency arrays.
8. Freeze the first enforceable `.hivemind` ingress rulebook:
   - `.hivemind` surfaces now classify as `authority`, `projection`, `quarantine`, `evidence`, `archive`, or `compatibility`;
   - canonical task reads assert `state/tasks.json` and `graph/tasks.json` as authority-classified sources;
   - `state-snapshot.ts` now emits ingress warnings when compatibility surfaces like `runtime-profile.json`, `context-recovery.json`, and `health-metrics.json` are still read;
   - `hiveops-export.ts` now treats gates as authority reads and handoff/checkpoint files as evidence writes.
9. Prepare the next aggressive execution slices with narrower ownership boundaries:
   - `P1-D.1c` dead-surface isolation/archive wave;
   - stale boundary-script references must be cleaned so the repo-level regression gate stops failing for dead-surface reasons instead of runtime reasons;
   - `P1-C.2b.c` main/sub-session survival can only resume after the ingress/archive foundations stop letting compatibility and readability surfaces pose as authority;
   - keep deletion bias as the default, not the exception.

**Planned follow-on cycles** (each requires separate authorization):

- `P1-D.1c` dead/compat isolation cycle:
  freeze the first archive tranche for messy lib/tool/hook surfaces, then quarantine or archive the ones that no longer own live runtime behavior so the next aggressive `src/lib` / `hooks` / `schema` refactor stops reasoning through stale compatibility code.
- `P1-C.2b.c` main/sub-session survival cycle:
  make child-session tasks explicit delegates of parent-linked canonical tasks instead of separate shadow TODO universes; main sessions keep global navigation authority while child sessions attach scoped outputs and evidence.
- `P1-D.2` aggressive lineage migration cycle:
  implement lineage-separated state/session paths, resolve profile vs canonical state ownership, and remove the remaining `lineage` / `lineage_scope` ambiguity from active runtime stores.
- `P1-E.1` command/agent normalization cycle:
  proceed only after `P1-C` and `P1-D` freeze runtime authority boundaries.
- `P1-F.1` symlink/platform integrity cycle:
  run alongside `P1-E` once command/skill routing claims become part of the closeout criteria.

If a future session cannot map its work directly to one section of this file, it must stop and re-anchor before proceeding.

---

## 12. Context-Rot Defense Protocol

Context rot is the silent degradation of decision-quality evidence across sessions, compaction events, handoffs, and time.

Every phase must treat context rot as an architectural threat, not an operational inconvenience.

### Signal Staleness Taxonomy

| Classification | Meaning | Action |
|---|---|---|
| `live` | Generated or verified within the current cycle | May drive decisions directly |
| `recoverable` | From a prior cycle but can be re-verified with a known command or inspection | Must be re-verified before use |
| `stale` | From a prior cycle with no automated re-verification path | Must not drive decisions; may inform hypotheses only |
| `phantom` | Referenced in a registry, ledger, or plan but the target does not exist | Must be flagged, tracked, and resolved or deleted before the containing phase closes |

Examples of phantom signals: a registry entry for a skill directory that does not exist, a symlink whose target is missing, a planning packet that references a deleted file.

### Evidence Decay Rule

Any evidence older than 2 completed cycles must be re-verified before it drives a decision in steps 4 (Decision), 7 (Execute), or 8 (Gatekeeping) of the mandatory protocol.

If re-verification fails, the evidence is reclassified as `stale` and the cycle must record the gap.

### Compaction Survival Rules

When a compaction event fires:

1. **Must survive**: active hierarchy cursor, current session identity, current cycle status, authority ledger summary
2. **May survive** (budget permitting): trajectory context, active plan status, last 3 violation records
3. **Must be dropped**: full historical turn data, resolved violations older than 2 cycles, orphaned entity references

No compaction injection may exceed 30% of the available compaction budget. If both runtime hooks and governance overlays inject, they must share the budget, not compete for it.

### Session Boundary Defense

At every session boundary (new session, post-compaction, post-handoff):

1. Re-read this `PLAN.md` to confirm current phase, cycle status, and authority assignments.
2. Verify the active cycle's `sub-plan` or `PLAN.md` directive is still valid.
3. Check for phantom signals: broken symlinks, missing referenced files, stale timestamps.
4. If any phantom or stale signal is detected, record it and request authorization before proceeding.

### Document Staleness Protocol

Every reference document (including `hivemind-comprehensive-audit-report.md`) must carry:

- a `Last Verified` date in its header
- a `Status` designation: `SOT`, `reference`, `evidence`, or `temporary`

A reference document whose `Last Verified` date is older than 7 calendar days loses citation authority until re-verified. Unverified documents may inform investigation but must not drive decisions.

### Symlink Integrity as Rot Signal

Broken symlinks are the most visible form of structural rot.

Any phase that touches skill routing, platform adapters, or registry files must run the symlink integrity gate (§9 gate 6) before closing.

A broken symlink count > 0 at phase close is a blocking finding unless the broken links are explicitly scheduled for resolution in the next cycle.
