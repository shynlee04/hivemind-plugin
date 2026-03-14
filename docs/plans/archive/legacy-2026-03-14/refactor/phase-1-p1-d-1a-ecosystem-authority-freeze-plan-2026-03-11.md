# Phase 1 P1-D.1a Ecosystem Authority Freeze Plan

**Date**: 2026-03-11
**Status**: Authorized planning packet
**Category**: refactor
**Phase**: Phase 1
**Lane**: `P1-D.1a`
**Owner**: `PLAN.md` remains the only human-readable SOT

---

## Purpose

Freeze the ecosystem-level manifestation model for `.hivemind/` before any further aggressive runtime refactor continues.

This packet is intentionally high-level and routed. It is not an implementation specification.

---

## Why This Reroute Exists

Current repo evidence shows that canonical task authority is ahead of the wider `.hivemind` ecosystem:

- runtime/task authority in `src/**` is increasingly canonical
- session and plan registries remain under-materialized or empty
- workflow/template/command/script surfaces can still shape `.hivemind/` indirectly
- startup/readability surfaces lag behind the actual runtime state

Continuing with narrower task semantics before freezing this wider ecosystem would increase hidden authority splits.

---

## Authoritative Inputs

Use these inputs in priority order:

1. `PLAN.md`
2. `docs/audits/phase1-audit-report-2026-03-08.md`
3. `docs/deep-scan/sector-A-core-session.md`
4. `docs/deep-scan/sector-B-planning-hierarchy.md`
5. `docs/deep-scan/sector-D-graph-fs.md`
6. `docs/deep-scan/sector-E-hooks-cli.md`
7. `docs/deep-scan/sector-F-agents-tools.md`
8. `docs/deep-scan/sector-G-commands.md`
9. `docs/deep-scan/sector-H-skills.md`
10. `docs/deep-scan/sector-I-workflows-templates.md`
11. `docs/deep-scan/sector-J-scripts-misc.md`
12. live repo evidence from `src/`, `.opencode/`, and `.hivemind/`

If these inputs disagree, `PLAN.md` wins, then live code/runtime evidence, then the dated audit and deep-scan packets.

---

## Routed Multi-Round Sequence

### Round 1 — `P1-D.1a`
Goal:
- freeze the registry-led manifestation model for `.hivemind/`

Decision target:
- root manifest = topology/inventory only
- session manifest = canonical session registry
- plan manifest = canonical plan registry
- `state/tasks.json` = operational write model
- `graph/tasks.json` = durable global task graph
- readable markdown/index files = projections only

### Round 2 — `P1-D.1b`
Goal:
- classify every live `.hivemind` surface as:
  - `authority`
  - `projection`
  - `quarantine`
  - `evidence`
  - `archive`
  - `compatibility`

Decision target:
- projection and compatibility surfaces must stop driving runtime decisions

### Round 3 — `P1-D.1c`
Goal:
- isolate/archive dead or noisy producers that can still poison `.hivemind/`

Primary target groups:
- duplicate bootstrap and entry scripts
- overlapping startup formation paths
- stale boundary scripts
- wrapper-only transport surfaces
- legacy planning/readability fallbacks
- workflow/template outputs that masquerade as authority

### Round 4 — `P1-C.2b.c`
Goal:
- encode main/sub-session survival only after the wider ecosystem model is frozen

Decision target:
- child-session tasks become delegates of canonical parent-linked tasks, not shadow TODO universes

### Round 5 — `P1-D.2`
Goal:
- restructure `.hivemind/` around the frozen manifest-first model

Decision target:
- state-shape reconciliation
- lineage-separated pathing
- readable startup flow
- explicit compatibility boundaries

### Round 6 — `P1-E` + `P1-F`
Goal:
- normalize commands/agents/skills/workflows/scripts and close integrity claims

Decision target:
- owner/mirror roles explicit
- routing claims backed by live links and real surfaces

---

## Two-Lineage Operating Contract

This reroute assumes:

- `hivefiver` is the framework/meta-builder lineage
- `hiveminder` is the project/runtime lineage
- delegated agent teams serve one of those lineages; they do not create a third authority lane

Any artifact or state surface that cannot cleanly express lineage, delegation relation, or authority class must be downgraded until normalized.

---

## Archive / Isolation Decision Frame

For every messy surface touched in follow-on rounds, classify it as:

- `retain`
- `isolate`
- `compatibility-only`
- `archive/remove`

Do not leave unnamed debt in place.

---

## Stop Rules

Stop the current round and branch back to planning if:

- a surface appears to be both authority and projection
- a cycle needs to widen from one target group to multiple unrelated groups
- a proposed deletion would remove the only readable/operator-facing explanation of current state before a replacement exists
- lineage ownership cannot be expressed without inventing a third orchestration lane

---

## Non-Goals For This Packet

- no runtime code changes
- no `.hivemind/` restructuring
- no new state files
- no command/agent/workflow rewrites

This packet exists only to freeze the next aggressive route.
