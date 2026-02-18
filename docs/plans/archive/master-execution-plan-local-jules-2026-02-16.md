# Master Execution Plan - LOCAL + JULES - 2026-02-16

## 1. Purpose

Define one execution artifact for two teams that can be posted into Stitch and linked to GitHub `dev-v3`, including:

- Parallelizable workstreams
- Integration gates
- Story-mapped requirements
- Test criteria and test suite expectations

## 2. Sources and Constraints

- Backend backlog: `tasks/prd-backend.json` (33 stories)
- Frontend backlog: `tasks/prd-frontend.json` (17 stories)
- Repository: `https://github.com/shynlee04/hivemind-plugin`
- Base branch for all team delivery: `dev-v3`
- Framework context: `mode=gsd; gsd=true; spec_kit=false; bmad=false`
- Stack context: TypeScript, React, Ink/OpenTUI transition, OpenCode ecosystem

## 3. Operating Model (Stitch + GitHub)

### 3.1 Team ownership

- LOCAL owns backend stories `US-001` to `US-031`, plus `US-038`, `US-039`
- JULES owns frontend stories `US-032` to `US-037`, `US-040` to `US-050`

### 3.2 Git branching policy

- PR base branch: `dev-v3`
- Branch naming:
  - LOCAL: `local/us-<id>-<slug>`
  - JULES: `jules/us-<id>-<slug>`
- No direct push to `master`
- Run guard before any public-branch promotion: `npm run guard:public`

### 3.3 Required Stitch fields per story card

- `US-ID`
- `Owner` (LOCAL or JULES)
- `Depends On`
- `Git Branch`
- `PR URL`
- `Acceptance Criteria` (copied from PRD JSON)
- `Evidence` (`npm test`, `npx tsc --noEmit`, targeted suite if required)
- `Status` (Todo/In Progress/Review/Done)

## 4. Parallel Workstreams

Parallel groups are derived from dependency levels in each PRD file.

### 4.1 LOCAL parallel sets

- Foundation chain (sequential): `US-001 -> US-002 -> US-003`
- Parallel Set L-A (after `US-003`): `US-004`, `US-005`, `US-006`, `US-007`, `US-008`
- Parallel Set L-B (schema/I-O lane): `US-014`, `US-018`, `US-026`, `US-028`
- Parallel Set L-C (after `US-010`): `US-011`, `US-012`, `US-038`
- Parallel Set L-D (post splitter): `US-021`, `US-039`
- Final closure: `US-030` then `US-031`

### 4.2 JULES parallel sets

- Foundation story (sequential): `US-032`
- Parallel Set J-A (after `US-032`): `US-033`, `US-034`, `US-035`, `US-036`, `US-037`, `US-040`, `US-041`, `US-044`, `US-050`
- Parallel Set J-B:
  - Accessibility/test lane: `US-042`, `US-043`
  - View lane (after `US-044`): `US-045`, `US-046`, `US-047`, `US-048`
- Navigation closure: `US-049`

### 4.3 Cross-team integration threads

- Thread I1 (state contract): LOCAL `US-010`, `US-013`, `US-015` -> JULES `US-035`, `US-040`, `US-046`
- Thread I2 (telemetry contract): LOCAL `US-039` -> JULES `US-033`
- Thread I3 (dashboard launch/ops): LOCAL tool wiring `US-023` -> JULES command entry `US-041`

## 5. Integration Gates

### Gate G0 - Setup and Carding

Entry:

- Stitch project boards created for LOCAL and JULES
- Every story from both PRD files represented as one Stitch card

Exit criteria:

- All cards have owner, dependency links, branch pattern, and definition of done

### Gate G1 - Foundations Complete

Entry:

- LOCAL reached `US-003`
- JULES reached `US-032`

Exit criteria:

- LOCAL L-A and L-B started in parallel
- JULES J-A started in parallel
- All active cards include CI evidence commands

### Gate G2 - Contract Freeze (Backend -> Frontend)

Entry:

- LOCAL completed `US-010`, `US-011`, `US-012`, `US-013`, `US-015`
- JULES completed at least `US-033`, `US-035`, `US-040`, `US-044`

Exit criteria:

- Contract doc attached to Stitch epic (packer payload keys, token pressure field, refresh cadence)
- Integration smoke run executed on `dev-v3` PR branch

### Gate G3 - Integration Stabilization

Entry:

- LOCAL completed `US-020`, `US-021`, `US-023`, `US-038`, `US-039`
- JULES completed `US-041`, `US-045`, `US-046`, `US-047`, `US-048`, `US-049`

Exit criteria:

- Dashboard renders with live packer-fed data
- Token pressure appears in telemetry header
- Slash command entry launches dashboard and exits cleanly

### Gate G4 - Release Candidate on dev-v3

Entry:

- LOCAL `US-031` done
- JULES `US-042`, `US-043`, `US-050` done

Exit criteria:

- Full verification suite green
- No unresolved dependency cards
- `dev-v3` marked release-candidate ready in Stitch

## 6. Requirements to Story Mapping

### RQ-01 Graph schema integrity and FK safety

- Stories: `US-001`, `US-002`, `US-014`, `US-018`, `US-019`, `US-026`, `US-028`, `US-029`
- Required evidence: schema validation behavior + migration pass + tests green

### RQ-02 Cognitive packer and context compiler

- Stories: `US-010`, `US-011`, `US-012`, `US-013`, `US-015`, `US-017`, `US-038`
- Required evidence: deterministic pack output, budget behavior, lifecycle wiring

### RQ-03 Actor/session orchestration and token splitting

- Stories: `US-020`, `US-021`, `US-030`, `US-039`
- Required evidence: splitter threshold behavior + swarm execution path

### RQ-04 Tool consolidation and write-through safety

- Stories: `US-004`, `US-005`, `US-006`, `US-007`, `US-008`, `US-009`, `US-022`, `US-023`, `US-024`
- Required evidence: tool wrappers thin, library extraction complete, regression unaffected

### RQ-05 OpenTUI dashboard modernization and bilingual UX

- Stories: `US-032` through `US-037`, `US-040` through `US-050`
- Required evidence: OpenTUI migration, 5-view navigation, EN/VI behavior, rendering checks

### RQ-06 End-to-end LOCAL/JULES integration

- Stories: `US-038`, `US-039`, `US-041`, `US-043`, `US-049`
- Required evidence: cross-team smoke test on shared `dev-v3` integration branch

## 7. Test Criteria and Suite Matrix

### 7.1 Global pass criteria (every story PR)

- `npx tsc --noEmit`
- `npm test`
- Story acceptance checklist completed in Stitch card

### 7.2 Targeted suite expectations by requirement

- RQ-01: `tests/schemas.test.ts`, `tests/paths.test.ts`, `tests/migration.test.ts`
- RQ-02: `tests/messages-transform.test.ts`, `tests/sdk-context.test.ts`, `tests/round4-mems.test.ts`
- RQ-03: `tests/session-lifecycle-boundary.test.ts`, `tests/session-lifecycle-helpers.test.ts`, `tests/session-boundary.test.ts`, `tests/integration.test.ts`
- RQ-04: `tests/tool-gate.test.ts`, `tests/scan-actions.test.ts`, `tests/cli-scan.test.ts`, `tests/entry-chain.test.ts`
- RQ-05: `tests/dashboard-tui.test.ts`, `tests/governance-stress.test.ts`, `tests/config-health.test.ts`
- RQ-06: `tests/integration.test.ts`, `tests/ecosystem-check.test.ts`, `tests/evidence-gate.test.ts`

### 7.3 Gate-level verification commands

- Fast gate: `npx tsc --noEmit`
- Functional gate: `npm test`
- Public-branch policy gate (pre-master only): `npm run guard:public`

## 8. Definition of Done (Story -> Gate -> Program)

### Story done

- Acceptance criteria satisfied
- Required tests passed
- Stitch card has linked PR URL and evidence

### Gate done

- All required stories at that gate are Done
- Cross-team integration checks for the gate are green

### Program done

- All backend (33) and frontend (17) stories Done
- G0 through G4 closed in order
- `dev-v3` ready for release decision

## 9. Execution Order Summary

1. Open G0 and card all stories into Stitch with dependency links.
2. Run G1 foundations (`US-001..003` and `US-032`) and start parallel sets.
3. Freeze contracts at G2 and run backend-to-frontend integration smoke.
4. Complete stabilization at G3 with live telemetry + command launch checks.
5. Close G4 with full suite pass and mark release-candidate readiness on `dev-v3`.
