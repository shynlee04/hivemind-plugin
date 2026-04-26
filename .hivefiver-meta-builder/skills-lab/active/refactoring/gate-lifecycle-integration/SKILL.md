---
name: gate-lifecycle-integration
description: >
  Internal quality gate that evaluates whether Hivemind harness implementations
  correctly participate in the runtime lifecycle — covering CQRS boundaries,
  actor hierarchy, event-driven wiring, classification fit (src/ vs .opencode/
  vs .hivemind/), and OpenCode SDK surface compliance. Activates during code
  review, phase audit, milestone verification, integration check, and deployment
  readiness workflows. Use when performing a lifecycle gate check, auditing
  harness module integration, verifying CQRS boundary compliance, checking
  delegation hierarchy constraints, evaluating tool/hook registration correctness,
  running a harness quality gate, or validating plugin composition integrity.
---

# Gate: Lifecycle Integration

Internal quality gate. Not for end-user shipping. Activates during every
gatekeeping workflow related to Hivemind harness or OpenCode integration work.

## Activation Detection

Load this skill when any of these conditions match the current workflow:

- Code review of files in `src/`
- Phase audit or milestone verification touching harness modules
- Integration check after tool/hook/delegation changes
- Deployment readiness assessment for the npm package
- Any workflow referencing `gate-lifecycle-integration`

## Do NOT Load

Skip this skill when:

- Working on `.opencode/` soft meta-concept authoring (skills, agents, commands) — not a lifecycle concern
- Performing end-user feature development unrelated to harness internals
- Running non-Hivemind project code reviews
- Writing documentation, README files, or changelogs
- The artifact is a `SHARED` or `SCHEMA` module (use lighter classification check instead)

## Contextual Perspective Activation

Identify the current context, then activate the matching lens pair.
Load `references/perspective-rubrics.md` for full scoring criteria.

| Context | Primary Lens | Secondary Lens | Emphasis |
|---------|-------------|----------------|---------|
| Code review | Dev | Architect | Interface correctness, code quality |
| Phase audit | Architect | PM | Architecture integrity, scope retention |
| Milestone verification | PM | Architect | Deliverable completeness |
| Integration check | Architect | Dev | Cross-module wiring, SDK compliance |
| Deployment readiness | All three | — | Full evaluation across all dimensions |

Announce which lens pair is active before beginning evaluation.

## Evaluation Decision Tree

Follow this tree for each artifact under review. Start at the classification
node, then execute the matching checklist from `references/evaluation-checklist.md`.

```
START → Classify the artifact:
  ├─ TOOL (implements tool() in plugin)?
  │   → Check: tool registration, Zod schema, response envelope,
  │     SDK mutations, state persistence, LOC < 200
  ├─ HOOK (implements hook handler)?
  │   → Check: hook factory registration, signature correctness,
  │     error boundary, CQRS compliance, sessionID extraction
  ├─ LIBRARY (src/lib/ module)?
  │   → Check: dependency graph compliance, LOC < 500, no `any`,
  │     [Harness] error prefix, test coverage exists
  ├─ PLUGIN.TS (composition root)?
  │   → Check: LOC < 200, all tools registered, no inline business
  │     logic, PTY lazy-loaded
  └─ DELEGATION participant?
      → Check: DelegationManager usage, valid category, depth limit,
        queue key, dual-signal, recovery guarantee
```

For each branch, consult `references/evaluation-checklist.md` for the
per-dimension audit criteria.

## Anti-Pattern Detection

Scan for the following anti-patterns during evaluation. Full catalog with
detection methods and evidence requirements lives in
`references/anti-patterns.md`.

| ID | Severity | Summary |
|----|----------|---------|
| AP-01 | BLOCK | WRITE FROM READ-SIDE — hook calling `patchSessionContinuity()` outside exceptions |
| AP-02 | BLOCK | DIRECT SDK CALL FROM HOOK — hook calling `client.session.create/prompt/abort` |
| AP-03 | BLOCK | MISSING DISPOSAL — observer never cleaned up on session end |
| AP-04 | BLOCK | SYNC BLOCK IN ASYNC HOOK — synchronous I/O in hook handlers |
| AP-05 | BLOCK | INVALID LIFECYCLE TRANSITION — transitioning from terminal state |
| AP-06 | BLOCK | UNBOUNDED DELEGATION DEPTH — exceeding `MAX_DELEGATION_DEPTH` (3) |
| AP-07 | WARN | OBSERVER WITHOUT ERROR BOUNDARY |
| AP-08 | WARN | STALE CONTINUITY CACHE |
| AP-09 | WARN | HARDCODED TIMEOUTS (use adaptive polling constants) |
| AP-10 | WARN | CATEGORY MISMATCH (not in `VALID_DELEGATION_CATEGORIES`) |
| AP-11 | WARN | ORPHANED DELEGATION (no parent cleanup) |

Any BLOCK-level finding stops the gate. Document findings using
`templates/gate-report.md`.

## CQRS Boundary Rules

WRITE-SIDE (Tools):
- Implements `tool()` in plugin return object
- Has Zod schema in `schema-kernel/`
- Calls SDK mutations via `session-api.ts` wrappers
- May call `patchSessionContinuity()` for state writes
- Returns structured tool response from `shared/tool-response.ts`
- NEVER reads event stream directly

READ-SIDE (Hooks):
- Implements hook handler functions in plugin return object
- Observes events from OpenCode event stream
- May read continuity state (read-only access)
- NEVER calls `patchSessionContinuity()` (except documented exceptions)
- NEVER calls `delegationManager.dispatch()`
- Principle: events flow from write to read, never the reverse

## Classification Fit Verification

Every artifact must land in exactly one of three roots:

| Root | Contents | State? |
|------|----------|--------|
| `src/` (hard harness) | Tools, hooks, plugin, shared, lib | No persistent state |
| `.opencode/` (soft meta) | Skills, agents, commands, rules, permissions | No internal state |
| `.hivemind/` (deep module) | Journals, lineage, runtime state, memory | Canonical state |

Cross-contamination between roots is a BLOCK finding. If lifecycle integration
fails classification fit, STOP — redesign needed before proceeding.

## Delegation Hierarchy Constraints

Validate against these constants from `src/lib/types.ts`:

- `MAX_DELEGATION_DEPTH`: 3 (overridable via RuntimePolicy)
- `MAX_DESCENDANTS_PER_ROOT`: 10
- `VALID_DELEGATION_CATEGORIES`: research, implementation, review, visual-engineering, deep, quick
- Dual-signal completion: `session.idle` + stability timer (`STABLE_POLLS_REQUIRED`: 3)
- Grace period: `TASK_CLEANUP_DELAY_MS`: 10 minutes

## Cross-Skill Routing

After evaluation completes:

- **LIFECYCLE INTEGRATION PASSES** → Route to `gate-spec-compliance` for
  specification-level verification. Lifecycle correctness is a prerequisite
  for spec compliance.
- **LIFECYCLE INTEGRATION FAILS** (classification) → STOP. Redesign required.
  Classification violations cannot be fixed incrementally.
- **LIFECYCLE INTEGRATION FAILS** (other) → Document in gate report, fix,
  re-run this gate before routing to `gate-spec-compliance`.

## Evaluation Output

1. Fill `templates/gate-report.md` with findings per dimension
2. Record PASS/FAIL per anti-pattern check
3. Record the active perspective lens and scores
4. If PASS: note the routing instruction to `gate-spec-compliance`
5. If FAIL: list required remediations with file:line references

## Adopted Patterns

This skill synthesizes patterns from third-party research. See
`references/adopted-patterns.md` for the full catalog:

- Gateguard fact-forcing: scripts report facts, agents judge
- ISO 25010 grounding: quality characteristics mapped to dimensions
- CQRS verification: write/read boundary enforcement

## Bundled Resources

| Resource | Purpose |
|----------|---------|
| `references/evaluation-checklist.md` | Per-dimension audit criteria per artifact type |
| `references/perspective-rubrics.md` | PM/Architect/Dev scoring rubrics |
| `references/anti-patterns.md` | Full AP-01 through AP-14 catalog |
| `references/adopted-patterns.md` | Synthesized third-party research patterns |
| `evals/evals.json` | Test scenarios for skill validation |
| `templates/gate-report.md` | Standardized report template |
| `scripts/run-gate-eval.sh` | Deterministic 5-dimension evaluation runner |
