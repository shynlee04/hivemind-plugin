# Sector-2 Migration Notes

## Purpose
Track migration from overlapping role definitions to Diamond contracts.

## Changes
1. Agent profiles were reduced to boundary contracts.
2. Command frontmatter normalized to contract v2 keys.
3. Canonical workflow family files added:
   - `feature-sprint`
   - `bug-remediation`
   - `spec-generation`
   - `research-synthesis`
   - `verification-gate`
4. Delegation packet schema added in `src/schemas/delegation-packet.ts`.
5. Skill registry added at `skills/registry.yaml` with bundle and disclosure governance.
6. Sync profiles added in `modules/profiles/{core,balanced,full,legacy-compat}.yaml`.
7. Doctor recovery command added for `.hivemind` lineage repair (`doctor --doctor-mode report|repair`).

## Deprecation Matrix (Compatibility Window)
- `hivefiver-start` -> `hivefiver init`
- `hivefiver-intake` -> `hivefiver init`
- `hivefiver-specforge` -> `hivefiver spec`
- `hivefiver-skillforge` -> `hivefiver architect`
- `hivefiver-gsd-bridge` -> `hivefiver build`
- `hivefiver-ralph-bridge` -> `hivefiver validate`
- `hivefiver-doctor` -> `hivefiver audit`

## Profile Defaults
- Default runtime profile: `core` (canonical-only, no legacy aliases).
- Compatibility profile: `legacy-compat` (aliases enabled, non-default).
- Init flow now supports `syncMode`: `none|core|balanced|full`.
