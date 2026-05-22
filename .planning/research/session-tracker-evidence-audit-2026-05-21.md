# Session Tracker Evidence Audit — 2026-05-21

## Scope

Audit target: Phase 21 session-tracker design-fix evidence review.

Compared exported session evidence against persisted tracker state for:

- `ses_1bafdc626ffeJtA6rWs1bDsI12` (`/session-ses_1baf.md`)
- `ses_1bb1cf1e0ffe478KZ4HwJgUCN6` (`/session-ses_1bb1.md`)
- `ses_1bda22cc3ffebCEHYfj5Djbuyc` (`/session-ses_1bda.md`)

Compared persistence roots:

- `.hivemind/session-tracker/{sessionId}/session-continuity.json`
- `.hivemind/session-tracker/{sessionId}/hierarchy-manifest.json`
- representative child records under `.hivemind/session-tracker/{sessionId}/*.json`
- `.hivemind/session-tracker/project-continuity.json`
- `.hivemind/state/delegations.json`

Compared relevant runtime surfaces:

- `src/tools/hivemind/session-hierarchy.ts`
- `src/tools/hivemind/hivemind-session-view.ts`
- `src/tools/hivemind/session-tracker.ts`
- `src/features/session-tracker/capture/tool-capture.ts`
- `src/features/session-tracker/capture/event-capture.ts`
- `src/features/session-tracker/persistence/session-index-writer.ts`
- `src/features/session-tracker/persistence/hierarchy-manifest.ts`
- `src/task-management/continuity/delegation-persistence.ts`

## Session / Task Mapping Table

| Root session | Export evidence | Persistence root | Exported child/task IDs observed | Persisted manifest children | Exact mismatches |
|---|---|---|---|---|---|
| `ses_1bafdc626ffeJtA6rWs1bDsI12` | `session-ses_1baf.md` lines with `task_id` include `ses_1b58caa55ffe40hi3IUSt7AGSn`, `ses_1b59c269affeyfaR0ObMeG3zaq`, `ses_1b59c3a5cffe8AxkHzLmH3oH1t`, `ses_1b639a7dfffe2u0LHQdOHVXrxw`, `ses_1b639cdd1ffeFEXEU66QJFhh71` | `.hivemind/session-tracker/ses_1bafdc626ffeJtA6rWs1bDsI12/` | 5 direct `task_id` values found in export | 13 children in manifest | `ses_1b59c269affeyfaR0ObMeG3zaq` appears in export + continuity tree but is missing from manifest; manifest has extra descendants and the current audit child `ses_1b57e02beffeC55AfgTK5SGMea` |
| `ses_1bb1cf1e0ffe478KZ4HwJgUCN6` | `session-ses_1bb1.md` lines with `task_id` include `ses_1b902b053ffeMCzAvDEJWgt1bl` through `ses_1b93c726bffeSSU1Zy23loFJY8` | `.hivemind/session-tracker/ses_1bb1cf1e0ffe478KZ4HwJgUCN6/` | 15 direct `task_id` values found in export | 49 children in manifest | `ses_1b90978a3ffeL0CQ237aUWVYgr` appears in export + continuity tree but is missing from manifest; manifest contains many later descendants not surfaced by export `task_id` lines |
| `ses_1bda22cc3ffebCEHYfj5Djbuyc` | `session-ses_1bda.md` explicit delegation-status outputs show `ses_1bda03a34ffek7NUrdj7Rv6V0Y` and `ses_1bda014dcffe6gPMzd3L0SQ34B` as `delegate-task` children (`session-ses_1bda.md:260-340`) | `.hivemind/session-tracker/ses_1bda22cc3ffebCEHYfj5Djbuyc/` | 2 direct child IDs visible from export status blocks; later child sessions also exist in persistence | 8 children in manifest | 4 L1 children persisted with `unknown` metadata; 2 L2 children exist only in persistence (`ses_1c56bddc2ffe3DEHK2jkYCGQAz`, `ses_1c5660edcffeEBRK8DMQIl5VNp`) and are not represented in exported root session transcript |

## Hierarchy Correctness Findings

### 1. `session-hierarchy get-children` returns malformed child identifiers

**Evidence**

- Continuity tree entries do **not** store `sessionID`; they store only the key plus `file`, `depth`, `status`, `delegatedBy`, `children` (`src/features/session-tracker/types.ts:251-263`, `src/features/session-tracker/persistence/session-index-writer.ts:208-214`).
- `normalizeChildren()` in `src/tools/hivemind/session-hierarchy.ts:79-85` falls back to `String(entry.file ?? "")` when `entry.sessionID` is absent.
- Result: tool output reports child IDs as filenames with `.json` suffix, e.g. `ses_1bafc53ceffeiytsZeOGWOIcpJ.json` instead of `ses_1bafc53ceffeiytsZeOGWOIcpJ`.
- Live tool evidence for `ses_1bafdc626ffeJtA6rWs1bDsI12` and `ses_1bb1cf1e0ffe478KZ4HwJgUCN6` shows `sessionId` values ending with `.json` and flattens every child to depth `1`.

**Impact**

- Hierarchy navigation is not trustworthy for downstream tooling or audits.
- Any consumer using `get-children` output as canonical session IDs will mis-route follow-up reads.

**Severity:** Critical

### 2. Continuity tree and hierarchy manifest drift on direct children

**Evidence**

- `ses_1bafdc626ffeJtA6rWs1bDsI12/session-continuity.json:245-329` contains direct child `ses_1b59c269affeyfaR0ObMeG3zaq` with nested descendants.
- The same child is missing from `ses_1bafdc626ffeJtA6rWs1bDsI12/hierarchy-manifest.json:1-178`.
- `ses_1bb1cf1e0ffe478KZ4HwJgUCN6/session-ses_1bb1.md` contains `task_id: ses_1b90978a3ffeL0CQ237aUWVYgr`, while `ses_1bb1cf1e0ffe478KZ4HwJgUCN6/hierarchy-manifest.json:1-646` omits that child.
- The continuity writer and manifest writer are separate write paths (`src/features/session-tracker/persistence/session-index-writer.ts`, `src/features/session-tracker/persistence/hierarchy-manifest.ts`) and can diverge.

**Impact**

- The tool that reads continuity and the tool that reads manifest can disagree on which L1 children exist.
- Root-to-child chain recovery becomes nondeterministic.

**Severity:** High

### 3. Delegate-task child sessions are being persisted as placeholder / anonymous records

**Evidence**

- Exported root session `session-ses_1bda.md:260-340` identifies `ses_1bda03a34ffek7NUrdj7Rv6V0Y` as `hm-l2-researcher` and `ses_1bda014dcffe6gPMzd3L0SQ34B` as `hm-l2-auditor`.
- Persisted child records for those same IDs show `delegatedBy.agentName: "unknown"`, blank model, blank description, `mainAgent.name: "pending"` (`.hivemind/session-tracker/ses_1bda22cc3ffebCEHYfj5Djbuyc/ses_1bda03a34ffek7NUrdj7Rv6V0Y.json:1-18` and sibling files).
- `src/features/session-tracker/capture/tool-capture.ts:125-137` only special-cases `skill`, `read`, and `task`; `delegate-task` falls through `handleOther()` and loses structured args.
- `src/features/session-tracker/capture/event-capture.ts:428-467` creates immediate child files with fallback `subagentType ?? "unknown"` and `mainAgent: { name: "pending", model: "" }`.

**Impact**

- Delegate-task sessions are discoverable as sessions, but their persisted identity and context are degraded.
- Audits cannot reliably reconstruct who created a child or why.

**Severity:** Critical

## Context / Meta Persistence Findings

### 4. Tracker `.md` files are lossy operational summaries, not faithful session exports

**Evidence**

- Exported files and tracker copies are materially different in size and content (`session-ses_1bda.md` vs `.hivemind/session-tracker/ses_1bda22cc3ffebCEHYfj5Djbuyc/ses_1bda22cc3ffebCEHYfj5Djbuyc.md`).
- Example: tracker copy logs many tools as `{"callID": ...}` only (`ses_1bda22...md:33-80`), while the exported session contains full inputs/outputs for the same operations (`session-ses_1bda.md:250-423` and surrounding blocks).
- `src/features/session-tracker/capture/tool-capture.ts:391-400` intentionally collapses non-special-cased tools to metadata-only `callID` blocks.

**Impact**

- Recording fidelity is insufficient for forensic reconstruction of complex sessions.
- Root causes for failed advanced workflows cannot be reconstructed from tracker `.md` alone.

**Severity:** High

### 5. Session-view synthesizes incorrect root metadata from the wrong fields

**Evidence**

- `hivemind-session-view` reads `session-continuity.json` and expects root-level `status`, `childCount`, `delegationDepth`, `parentSessionID` (`src/tools/hivemind/hivemind-session-view.ts:105-115`).
- Real continuity files for audited roots contain `turnCount`, `toolSummary`, and nested `hierarchy`, but no root-level `status`, `childCount`, or `delegationDepth` (`ses_1baf.../session-continuity.json:1-361`, `ses_1bb1.../session-continuity.json:1-3952`, `ses_1bda.../session-continuity.json:1-101`).
- Live `hivemind-session-view` output therefore reports `status: "unknown"` and `childCount: 0` for all three audited roots despite real children existing.

**Impact**

- Unified session view understates active hierarchy and makes root sessions appear empty.

**Severity:** High

### 6. `delegations.json` is not a usable source of live delegation truth

**Evidence**

- `.hivemind/state/delegations.json` contains a single synthetic/error sample unrelated to any audited session.
- `persistDelegations()` returns early when `config.commit_docs` is false (`src/task-management/continuity/delegation-persistence.ts:58-64`), coupling runtime delegation persistence to a document-commit toggle.
- `hivemind-session-view` filters persisted delegations by `childSessionId === sessionId || id === sessionId` (`src/tools/hivemind/hivemind-session-view.ts:69-72`), so it would miss parent-root lookups even if records existed.

**Impact**

- Delegation persistence can silently stop entirely depending on config.
- Session-view and any audit reading `.hivemind/state/delegations.json` will underreport or completely miss real delegations.

**Severity:** Critical

## Missing or Malformed Records

1. **Missing manifest entries for direct child sessions**
   - `ses_1b59c269affeyfaR0ObMeG3zaq` missing from `ses_1baf.../hierarchy-manifest.json`
   - `ses_1b90978a3ffeL0CQ237aUWVYgr` missing from `ses_1bb1.../hierarchy-manifest.json`

2. **Malformed `get-children` session IDs**
   - Returned IDs include `.json` suffix due fallback to `file` instead of session key.

3. **Placeholder delegate-task child metadata**
   - `ses_1bda03a34ffek7NUrdj7Rv6V0Y`
   - `ses_1bda014dcffe6gPMzd3L0SQ34B`
   - `ses_1bd795788ffeUiClJLADe1OanX`
   - `ses_1bd76264effeOydeUGCUkkxcPT`

4. **Root status/child counters absent in continuity but expected by read-side tools**
   - Causes `status: "unknown"` and `childCount: 0` in session-view.

5. **Delegation store incomplete / effectively disabled**
   - No live delegation rows for the audited sessions in `.hivemind/state/delegations.json`.

## Suspected Fault Surfaces

### Highest-probability write-side surfaces

- `src/task-management/continuity/delegation-persistence.ts`
  - `persistDelegations()` is wrongly gated by `commit_docs`.

- `src/features/session-tracker/capture/event-capture.ts`
  - `writeImmediateChildFile()` creates placeholder child records before full delegation metadata is available.

- `src/features/session-tracker/capture/tool-capture.ts`
  - `handleTask()` only handles native `task`; `delegate-task` is treated as generic metadata-only.

- `src/features/session-tracker/persistence/session-index-writer.ts`
  - Continuity tree stores child keys without `sessionID`, forcing read-side heuristics.
  - Separate continuity mutations can drift from manifest mutations.

- `src/features/session-tracker/persistence/hierarchy-manifest.ts`
  - Flattened manifest is missing at least some direct children visible in exports/continuity.

### Highest-probability mapping/read-side surfaces

- `src/tools/hivemind/session-hierarchy.ts`
  - `normalizeChildren()` fallback to `file` corrupts identifiers and depth semantics.

- `src/tools/hivemind/hivemind-session-view.ts`
  - Reads nonexistent root continuity fields and filters delegations too narrowly.

## Candidate Bug List

| Severity | Candidate bug | Evidence | Suspected surface |
|---|---|---|---|
| Critical | Delegation persistence is accidentally disabled by `commit_docs` config | `delegation-persistence.ts:58-64`; audited sessions absent from `.hivemind/state/delegations.json` | `src/task-management/continuity/delegation-persistence.ts` |
| Critical | `delegate-task` children are created with anonymous placeholder metadata and never backfilled correctly | `session-ses_1bda.md:260-340` vs child JSON files with `unknown/pending`; `tool-capture.ts:125-137`; `event-capture.ts:428-467` | `src/features/session-tracker/capture/event-capture.ts`, `src/features/session-tracker/capture/tool-capture.ts` |
| Critical | `session-hierarchy get-children` emits filenames as session IDs | live tool output + `session-hierarchy.ts:79-85` + continuity tree structure | `src/tools/hivemind/session-hierarchy.ts` |
| High | Manifest and continuity drift on L1 parent sessions | missing `ses_1b59c269...` / `ses_1b90978a...` in manifests but present in exports + continuity | `src/features/session-tracker/persistence/session-index-writer.ts`, `src/features/session-tracker/persistence/hierarchy-manifest.ts`, relevant capture callers |
| High | Session-view reports `status: unknown`, `childCount: 0` for active roots | live tool output + continuity schema mismatch | `src/tools/hivemind/hivemind-session-view.ts` |
| High | Tracker `.md` persistence is too lossy for forensic reconstruction of complex sessions | tracker copy vs exported transcript mismatch; `handleOther()` only stores `callID` | `src/features/session-tracker/capture/tool-capture.ts`, `src/features/session-tracker/persistence/session-writer.ts` |

## Explicit Assumptions and Confidence

1. **Assumption:** Exported `session-ses_*.md` files are authoritative OpenCode transcript exports, while `.hivemind/session-tracker/{sessionId}/{sessionId}.md` is Hivemind’s own derived capture.
   - **Confidence:** High
   - **Reason:** File sizes/content diverge drastically, yet session IDs match and tracker copy uses Hivemind-specific frontmatter + tool block format.

2. **Assumption:** Missing rows in `.hivemind/state/delegations.json` are a real persistence failure, not just pruning.
   - **Confidence:** High
   - **Reason:** file contains only one unrelated sample/error row, and writer has an explicit early-return gate tied to `commit_docs`.

3. **Assumption:** Some manifest omissions may be historical carry-over from earlier session-tracker revisions rather than only a current write-path bug.
   - **Confidence:** Medium
   - **Reason:** audited sessions predate this audit; continuity and manifest can already be out of sync before current tool invocation.

4. **Assumption:** Placeholder `unknown` delegate-task children are caused by immediate `session.created` capture occurring before richer delegation metadata is available.
   - **Confidence:** High
   - **Reason:** exported transcript identifies agent names; placeholder writer path explicitly defaults to `unknown` / `pending` when only pending registry data exists.

## Bottom Line

The audited evidence does **not** support trusting current session-tracker hierarchy and delegation persistence as a single coherent truth source. The most urgent faults are: (1) delegation persistence being gated off by `commit_docs`, (2) delegate-task child sessions being captured as anonymous placeholder records, and (3) read-side hierarchy/session-view tools mis-parsing or under-reading the persistence they already have.
