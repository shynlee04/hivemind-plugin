# Src Canonical Ownership Constitution

Date: 2026-03-07
Status: active-constitution
Type: ownership-constitution

## Purpose

Define one active ownership model for the current refactor so planning, governance, and later code cycles stop reasoning from mixed authority.

## Constitutional Rules

### Rule 1: Canonical Runtime Owner

`src/**` is the canonical runtime and governance owner.

That includes:

- bootstrap and init
- `.hivemind` formation
- state persistence and schema enforcement
- tool registration
- core hook logic
- governance policy logic
- planning-root formation

### Rule 2: Authored Framework Source

The root framework asset folders are the authored source:

- `commands/`
- `agents/`
- `skills/`
- `workflows/`
- `templates/`
- `prompts/`
- `references/`

### Rule 3: `.opencode` Asset Role

`.opencode/<group>` asset folders are derived mirrors for OpenCode consumption.

They are not co-equal authored authorities.

### Rule 4: `.opencode` Plugin Role

`.opencode/plugins/**` is a delivery and adapter layer.

Its target role is:

- OpenCode hook registration
- transport-level payload adaptation
- project-local wrapper behavior
- fallback-only behavior when canonical `src` runtime surfaces are unavailable

Its target role is not:

- primary policy ownership
- primary governance ownership
- primary context assembly ownership
- primary lifecycle ownership

### Rule 5: Runtime vs Planning Truth

Runtime truth remains JSON and lives under `.hivemind` state and graph contracts.

Readable planning and governance SOT remain markdown-first under `.hivemind/project/planning`.

The refactor must not collapse these into one store.

### Rule 6: Lineage Separation

`hivefiver` and `hiveminder` remain separate lineages.

The refactor can normalize ownership across the repo without collapsing lineage boundaries.

### Rule 7: Phase 1 Safety

Phase 1 must normalize ownership before it consolidates hot per-turn runtime hooks.

That means:

- ownership first
- projection hardening second
- adapter separation third
- hot-hook consolidation planning fourth

## Immediate Consequence

Any active artifact that still describes `.opencode` as a co-equal runtime authority should be treated as stale and revised before later runtime refactor cycles begin.
