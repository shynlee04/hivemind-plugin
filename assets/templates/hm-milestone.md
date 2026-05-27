# Milestone Planning — [Milestone Name/ID]

## 1. High-Level Objectives
Summarize the goal of this milestone, context, and key problems solved.

## 2. Phase Sequencing & Decomposition
List the planned phases and execution order:
- [ ] **Phase 1: [Name]** — [Short description & key deliverables]
- [ ] **Phase 2: [Name]** — [Short description & key deliverables]
- [ ] **Phase 3: [Name]** — [Short description & key deliverables]

## 3. Success Metrics & Exit Criteria
Define the criteria required to mark the milestone as completed:
- All unit/integration tests pass with 100% success rate.
- Zero TS compile errors or unresolved compiler warnings.
- L3 quality gate triad completely cleared for all sequential phases.
- Documentation and AGENTS.md aligned with zero drift.

## 4. Risks & Remediation Plan
Detail potential risks (e.g., dependency conflicts, api rate limits) and countermeasures:
- **Risk 1**: `[Risk Description]` -> **Mitigation**: `[Remediation steps]`
- **Risk 2**: `[Risk Description]` -> **Mitigation**: `[Remediation steps]`

## 5. Milestone Verification Checklist
Checklist to run during milestone audits:
- [ ] Run complete codebase test suite: `npm test`
- [ ] Run typecheck validation: `npm run typecheck`
- [ ] Audit workspace structure using `harness-doctor`
- [ ] Verify AGENTS.md documentation is fully up-to-date
