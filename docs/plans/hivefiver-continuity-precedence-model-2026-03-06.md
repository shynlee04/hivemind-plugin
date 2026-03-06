# Hivefiver Continuity Precedence Model

Date: 2026-03-06
Status: active-model
Type: cross-cutting-continuity-model

## Purpose

Define which continuity surfaces are active authority, which are transitional, and how later lane plans should resume work safely.

## Active Continuity Order

1. Canonical planning root under `.hivemind/project/planning/`
2. Canonical `hivefiver` phase packet under `.hivemind/project/planning/phases/01-hivefiver-module/`
3. Supporting synthesis mirrors under `docs/plans/`
4. Transitional checkpoint and handoff artifacts

## Repo-Truth Basis

- Canonical planning-root detection now prefers `.hivemind/project/planning/` and only falls back to legacy `.planning/`.
  - Evidence:
    - `src/lib/framework-context.ts`
    - `src/lib/paths.ts`
- Long-haul checkpoint and handoff artifacts remain useful continuity context, but they are not the primary planning root.
  - Evidence:
    - `.hivemind/checkpoints/long-haul-resync-checkpoint-2026-03-06.md`
    - `.hivemind/handoffs/long-haul-resync-handoff-2026-03-06.md`

## Active Versus Transitional Classification

| Surface | Classification | Use |
|---|---|---|
| `.hivemind/project/planning/config.json` | active control surface | planning-root config and conventions |
| `.hivemind/project/planning/PROJECT.md` through `STATE.md` | active readable SOT | project-level orientation and progress |
| `.hivemind/project/planning/phases/01-hivefiver-module/*.md` | active canonical lane packet | phase and lane continuation |
| `docs/plans/*.md` current dated packet mirrors | active supporting mirrors | synthesis, comparison, carry support |
| Milestone 01 prompt family | active synthesis input | audit and investigation wrappers only |
| long-haul checkpoint and handoff | transitional continuity | historical resume context |
| legacy `.planning/` | compatibility-only | fallback only, not preferred authority |

## Resume Protocol

When later lane plans or new sessions resume `hivefiver` work, the order should be:

1. planning-root config
2. planning-root SOT (`PROJECT`, `ROADMAP`, `REQUIREMENTS`, `STATE`, `MILESTONES`)
3. canonical phase packet chain
4. supporting dated synthesis mirrors
5. transitional checkpoint and handoff artifacts only if additional historical context is needed

## Continuity Rules

- Planning-root authority outranks transitional handoff language.
- Canonical phase files outrank mirrored `docs/plans` summaries if wording diverges.
- Repo-truth code evidence outranks all continuity artifacts if they drift.
- `brain.json` remains hot runtime session metadata evidence, not planning-root routing authority.

## Non-Goals

- no new continuity registry
- no second planning root
- no resumption by broad markdown globbing
- no treating prompt wrappers as continuity authority
