# Src Canonical Asset Projection Contract

Date: 2026-03-07
Status: active-contract
Type: projection-contract

## Purpose

Define the target contract for Cycle 2 so asset projection can be hardened without reopening runtime authority or hot-hook ownership prematurely.

## Contract Summary

- root framework asset folders are authored source
- `.opencode/<group>` folders are derived mirrors
- `src/cli/sync-assets.ts` is the canonical projection engine
- `src/cli/init.ts` is the canonical bootstrap caller of projection
- `src/lib/hivefiver-integration.ts` is the canonical asset-readiness and onboarding policy layer

## Authored Source Groups

- `commands/`
- `agents/`
- `skills/`
- `workflows/`
- `templates/`
- `prompts/`
- `references/`

## Derived Mirror Targets

- `.opencode/commands/`
- `.opencode/agents/`
- `.opencode/skills/`
- `.opencode/workflows/`
- `.opencode/templates/`
- `.opencode/prompts/`
- `.opencode/references/`

## Canonical Responsibility Split

### `src/cli/sync-assets.ts`

Owns:

- target resolution
- profile resolution
- inventory production
- parity checks
- overwrite/backup/prune rules
- frontmatter merge rules
- asset validation

### `src/cli/init.ts`

Owns:

- when projection runs
- which profile is requested at bootstrap
- plugin registration
- AGENTS/CLAUDE injection
- onboarding seeding after projection

### `src/lib/hivefiver-integration.ts`

Owns:

- readiness audit
- required asset set definitions
- onboarding graph task seeding
- intent-side recommendations when projection is stale or incomplete

## Target Changes For Cycle 2 Planning

### Audit Model

Target:

- readiness audits should treat root framework assets as authored authority
- `.opencode` gaps should be treated as mirror/projection drift, not as equal authored gaps

### Init Model

Target:

- init should be explicit that projection is source-to-mirror materialization
- init should not reinforce dual-authority language when it reports asset readiness

### Sync Model

Target:

- sync should remain the only path that materializes root assets into `.opencode`
- sync reports should be the canonical evidence for mirror health

## Invariants

- do not treat `.opencode` mirrors as authored source
- do not bypass `src/cli/sync-assets.ts`
- do not redesign plugin runtime ownership here
- do not change planning-vs-runtime state boundaries
- do not mix root asset authority with plugin hook authority

## External Validation Note

Official OpenCode plugin documentation confirms that project-level plugins are auto-loaded and plugin hooks run in sequence.

That supports keeping `.opencode/plugins/**` as a thin integration boundary and avoiding a second full policy engine there.
