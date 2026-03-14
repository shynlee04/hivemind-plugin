# Hivefiver Diagnose Ranked Remediation Routes

Date: 2026-03-07
Status: active-diagnose-output
Type: remediation-routes

## Purpose

Rank the best next planning responses to the verified Diagnose contradiction set.

## Ranked Routes

### Route 1

Planning-and-policy alignment first.

- Scope:
  - reconcile `AGENTS.md`, `agents/hivefiver.md`, and planning docs with actual plugin enforcement
  - normalize the brownfield diagnosis surface map so later plans stop citing absent files
  - keep implementation out of scope
- Why this ranks first:
  - it removes the biggest narrative contradictions without pretending runtime is already changed
  - it gives later mutation-capable planning one stable policy surface

### Route 2

Bounded Repair/Refactor planning for governance-alignment targets only.

- Scope:
  - identify what runtime enforcement, profile docs, and planning docs would need to converge
  - stay planning-only; no code mutation yet
- Why this ranks second:
  - it is useful, but it depends on Route 1 having clarified what is current truth versus target state

### Route 3

Broader Diagnose expansion across more historical artifacts.

- Scope:
  - continue auditing older continuity and historical evidence surfaces
- Why this ranks third:
  - evidence is already strong enough for the current contradiction set
  - broadening Diagnose further risks analysis drag instead of forward planning

## Recommended Route

Route 1 is the best next move.

The core issue is currently alignment, not evidence scarcity. A planning-and-policy alignment pass is the lowest-risk way to make later lane planning consistent with runtime truth.
