# AGENTS Upkeep Loop Spec - 2026-03-16

## Purpose

Define a repo-native, evidence-triggered upkeep loop for `AGENTS.md` instruction surfaces in this repository. The loop exists to keep authority claims current without treating mirrors, runtime artifacts, or stale intent notes as equal to live source and package truth.

This spec is grounded in the current authority freeze from `docs/governance/2026-03-16-authority-sync-note.md` and the repo-level authority contract in `AGENTS.md`. It adapts the deep-init lesson that upkeep should be iterative and evidence-led, not one-shot regeneration.

## Surface Classes And Authority Order

### 1. Root authority

- `AGENTS.md` is the repo-level authority for framework-wide boundaries, asset classes, and agent-contract semantics.
- Use root authority for claims about shipped versus internal versus runtime surfaces, contract fields, and repo-wide ownership rules.

### 2. Sector governance

- `src/*/AGENTS.md` files are sector-boundary documents.
- They are authoritative for local intent and boundary ownership only after their claims are checked against live code in that sector.
- If a sector document conflicts with current implementation, treat the code as current-state truth and the sector doc as stale until updated.

### 3. Mirrors and projections

- `.opencode/agents/**` is a synced development mirror of root `agents/**` only.
- Mirrors are never independent authority and must not introduce rules that do not exist in the root source.

### 4. Runtime artifacts

- `.hivemind/**` is runtime-generated output.
- Runtime artifacts are never an authoring input for AGENTS upkeep and must not be used to overwrite governance sources.

### 5. Current-state truth sources

- `package.json` is authoritative for shipped payload and executable/package reality.
- Current `src/**/*.ts` implementation is authoritative for whether migrations, hook adoption, tool extraction, or SDK usage are actually present now.
- `docs/governance/2026-03-16-authority-sync-note.md` is the current freeze note that records which prose is already known to be stale.

## Intake Triggers

Start the upkeep loop only when evidence crosses a concrete trigger.

### Hard triggers

- A root or sector AGENTS claim conflicts with `package.json` on what is shipped.
- A root or sector AGENTS claim conflicts with current `src/**/*.ts` implementation on whether a migration or capability is complete.
- A root or sector AGENTS file instructs contributors to mutate a surface that root governance classifies as mirror-only or runtime-generated.
- An authority freeze note, architecture note, or release note records a contradiction that is still unresolved in AGENTS prose.

### Targeted triggers

- A change lands in a sector under `src/**` and that sector's `AGENTS.md` describes ownership, constraints, or migration state that may now be outdated.
- Root `agents/**` contracts change and the matching `.opencode/agents/**` mirror needs resync.
- A documentation review finds a statement framed as current fact but supported only by stale roadmap language or debt checklists.

### Non-triggers

- Pure runtime churn under `.hivemind/**`.
- Mirror-only drift when root authority has not changed.
- Requests to regenerate all instruction surfaces without specific evidence.

## Evidence Thresholds

Do not update AGENTS surfaces on intuition. Use the smallest threshold that matches the scope.

### Threshold A - targeted correction

Use for a local sector update.

- At least one contradictory statement is identified in a specific AGENTS file.
- The contradiction is confirmed against one higher-authority source: live code for implementation truth, `package.json` for shipped truth, or root `AGENTS.md` for repo-wide boundary truth.

### Threshold B - root-level correction

Use for repo-wide or cross-surface updates.

- A root `AGENTS.md` statement is contradicted by current implementation or package truth.
- The contradiction is confirmed by two evidence points, such as `package.json` plus current source, or root AGENTS plus the authority sync note plus current source.
- The correction changes repo-wide routing, authority classification, or contributor expectations.

### Threshold C - sync propagation

Use for mirrors only after authority is settled.

- The authoritative root source has already been corrected or reconfirmed.
- The mirror differs only because it lags the authoritative source.
- No mirror-only wording is introduced.

### Hold threshold

Refuse update claims when evidence is ambiguous.

- The evidence shows tension but not a clear winner.
- The question is normative rather than factual, such as whether existing plugin logic counts as acceptable assembly-only behavior.
- In those cases, record the conflict as unresolved rather than normalizing one side into AGENTS prose.

## Sync Targets And Non-Targets

### Sync targets

- `AGENTS.md` when repo-wide authority, surface classification, or agent-contract semantics drift from verified truth.
- `src/*/AGENTS.md` when a sector boundary or current-state statement lags verified implementation in that sector.
- `.opencode/agents/**` only as a downstream mirror sync after root `agents/**` changes are validated.
- Governance notes in `docs/governance/**` when a freeze note or upkeep record is needed to explain why a sync happened.

### Non-targets

- `.hivemind/**` runtime outputs.
- `dist/**` compiled artifacts as an authority source for AGENTS wording.
- Release narratives such as `CHANGELOG.md` as the sole basis for current-state edits.
- Broad repo-wide rewrites triggered only by style preferences, naming preferences, or "deep-init" style regeneration requests without concrete contradictions.

## Refusal And Blocked Conditions

Return blocked or refuse the update when any of the following is true.

- The requested change treats `.opencode/**` or `.hivemind/**` as an authority source.
- The requested change would copy vendor- or Claude-specific assumptions into OpenCode/HiveMind-native governance text.
- The update would resolve a known contradiction without evidence from current source, package truth, or the authority sync note.
- The requested sync expands beyond the proven contradiction and becomes wholesale regeneration.
- The source of truth is split and unresolved, so the honest outcome is to carry a caveat or freeze note rather than rewrite AGENTS prose.

## Upkeep Loop

### Step 1 - classify the surface

- Decide whether the evidence concerns root authority, a sector document, a mirror, or a runtime artifact.
- If the item is a mirror or runtime artifact, do not treat it as the origin of truth.

### Step 2 - collect current evidence

- Read the relevant AGENTS surface.
- Check the corresponding higher-authority source: `package.json` for shipped claims, current `src/**/*.ts` for implementation claims, and `docs/governance/2026-03-16-authority-sync-note.md` for already-proven stale areas.
- Separate factual contradictions from open design questions.

### Step 3 - decide whether the threshold is met

- Apply Threshold A, B, or C.
- If no threshold is met, refuse regeneration and record why no upkeep action is justified.

### Step 4 - update only the authoritative surface that drifted

- Correct root `AGENTS.md` only for repo-wide truth.
- Correct `src/*/AGENTS.md` only for sector-local truth.
- Sync mirrors only after the root source is settled.
- Do not rewrite unaffected files.

### Step 5 - preserve unresolved tensions honestly

- If evidence proves staleness, correct the stale claim.
- If evidence proves only a conflict, keep the conflict visible as unresolved instead of converting it into false certainty.

### Step 6 - verify before claiming validity

- Re-read the updated AGENTS surface and verify that every changed factual statement points back to a higher-authority source.
- Confirm that authority order still holds: root before sector, source/package truth before prose, mirror after authority, runtime never as source.
- Confirm that non-target surfaces were not silently promoted into authority.
- Confirm that the update stayed OpenCode/HiveMind-native and did not import Claude-specific workflow assumptions.

## Verification Steps For Valid AGENTS Updates

Before claiming an AGENTS update is valid, check all of the following:

1. The updated statement is tied to a concrete evidence source in the repo, not memory.
2. Shipped-surface claims match `package.json`, not shorthand prose alone.
3. Implementation-state claims match current `src/**/*.ts`, not stale debt tables or roadmap text alone.
4. Root-versus-sector authority is preserved: repo-wide rules stay in `AGENTS.md`, local boundary rules stay in `src/*/AGENTS.md`.
5. `.opencode/**` remains mirror-only and `.hivemind/**` remains runtime-only.
6. Any unresolved contradiction is called unresolved, not silently flattened.
7. The update scope is minimal and evidence-triggered rather than a full regeneration pass.

## Current Repo Implications

Based on the current authority sync note, the upkeep loop should currently favor targeted corrections over blanket rewrites.

- Root authority remains valid for surface classification, but some current-state debt statements in `AGENTS.md` are already documented as stale.
- Sector documents under `src/**` should be checked against live code before being trusted for migration-status statements.
- Mirror sync is subordinate work, not a source of truth exercise.
- Runtime output must stay excluded from governance authorship decisions even when it exists locally.

## Future Work Boundary

This spec does not define new commands, generators, or automation. If the repo later automates AGENTS upkeep, that work should be proposed separately and only after this evidence model proves stable in manual use.
