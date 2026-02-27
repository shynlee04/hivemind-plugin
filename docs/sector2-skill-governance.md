# Sector-2 Skill Governance

## Objective
Treat skills as explicit knowledge-delta assets, not generic prompt blobs.

## Source of Truth
- Registry: `skills/registry.yaml`
- Runtime mirror: `.opencode/skills/`
- Rule: root registry + root skill folders decide lifecycle state; mirror is deployment output.

## Skill Lifecycle
1. Discover
- Search local inventory first.
- Reuse existing skill when knowledge delta is sufficient.

2. Create/Refine
- Add or update `skills/<name>/SKILL.md`.
- Register metadata in `skills/registry.yaml`.

3. Judge
- Validate with `scripts/validate-framework.sh`.
- Review overlap, stale ownership, and disclosure correctness.

4. Activate/Deprecate
- Change `status` in registry (`active|experimental|deprecated|merge_candidate`).
- Keep deprecated skills available only during compatibility windows.

## Mandatory Metadata
Each skill entry must define:
- `name`
- `domain`
- `bundle`
- `knowledge_delta_score` (0..1)
- `status`
- `owner`
- `disclosure_level` (`L0|L1|L2|L3`)
- `triggers[]`
- `supersedes[]`
- `depends_on[]`

## Bundles
- `governance-core`: context/session/delegation governance primitives
- `routing-core`: intent and routing intelligence
- `planning-core`: decomposition and sequencing
- `research-core`: source discovery and synthesis
- `verification-core`: evidence and quality gates
- `repair-core`: debugging and remediation
- `meta-core`: framework architecture and compatibility

## Progressive Disclosure
- `L0` bootstrap-minimal
- `L1` command-required
- `L2` workflow-step-specific
- `L3` escalation-only

Policy:
- Do not load `L3` skills in normal command routing.
- Load only bundles required by the current workflow step.

## Local-First Resolution
1. Resolve from root `skills/` + `skills/registry.yaml`.
2. Resolve mirror `.opencode/skills` for deployment/runtime only.
3. External marketplaces are opt-in; never auto-load by default.

## Hygiene Rules
- Active skills with low delta are invalid.
- Duplicate/overlapping active skills should be marked `merge_candidate`.
- Commands must reference skills listed in registry.
- Skills must not own permissions or delegation policy.

## Operational Commands
- Validate contracts:
  - `bash scripts/validate-framework.sh`
- Type/test gates:
  - `npx tsc --noEmit`
  - `npm test`
