# Plan #6 Revision 1 Delta
## Source
- Base plan: `.hivemind/activity/planning/plan-6.md`
- Verification input: `.hivemind/activity/verification/plan-6-hiveq-verify.md`
- Canonical paths authority: `src/features/event-tracker/paths.ts`

## Change Summary
1. Removed path-helper creation language from Plan #6.
   - Dropped directives to add new path functions for `session.json`, `delegation.md`, and `injection.md`.
   - Removed `paths.ts` modification from file-artifact scope.

2. Added explicit canonical helper reuse requirement.
   - Plan now mandates reuse of:
     - `getSessionMetadataPath` (`session.json`)
     - `getSessionDelegationPath` (`delegation.md`)
     - `getSessionInjectionPath` (`injection.md`)
   - Added explicit prohibition on adding, shadowing, or duplicating these helpers in Plan #6 scope.

3. Updated dependencies, steps, tests, and verification criteria.
   - Dependencies now treat `paths.ts` as authority to consume, not extend.
   - Implementation step for path extension replaced with Session Writer implementation step that imports existing helpers.
   - Test requirements now include explicit assertion of canonical helper reuse and no duplicate helper creation.
   - Verification criteria now include path-helper duplication prevention.

## Blocker Disposition
- HiveQ conditional blocker resolved in planning language.
- Plan #6 Revision 1 is aligned with existing canonical path builders and removes duplication risk.

## Output Artifacts
- Revised plan: `.hivemind/activity/planning/plan-6-revision-1.md`
- Delta note: `.hivemind/activity/planning/plan-6-revision-1-delta.md`
