# Hivemind Skill Packages Innovations

**Date:** 2026-03-19  
**Status:** High-level master outline  
**Planning mode:** Routed, conditional, multi-round  
**Execution posture:** Planning only, no pack implementation in this packet

## 1. Summary

This packet frames the HiveMind skill-pack initiative as a progressive branch. The first target is not “all packs” and not “one giant pack.” The first target is a strong, broad, thin Context-Intelligence entry pack that can later branch into specialist lanes without creating more collision, ceremony, or framework confusion.

The later companion pack exists for the same reason: the repo needs a HiveMind-specific authoring and audit lane, but that lane should not contaminate the must-load entry pack.

## 2. Route Options

| Option | Shape | Result |
|--------|-------|--------|
| 1. Recommended | Governance-first dual-track branch | Build Pack 1 first, keep later authoring/audit work as a separate but linked track |
| 2. Context-first acceleration | Draft Pack 1 immediately and defer companion and inventory decisions | Fast visible progress, higher drift risk |
| 3. Full-pack inventory first | Inventory and classify all candidate packs before drafting Pack 1 | Strong broad picture, slower path to usable entry behavior |

Option 1 is best because it matches the repo’s needs and the user’s requested philosophy at the same time. The user wants a progressive, skeletal, conditional route where the entry layer comes first but does not pretend to be the whole system. The repo also needs that ordering because naming, role boundaries, and evaluation posture are still open enough that rushing into authoring multiple packs would likely recreate overlap and governance drift.

Options 2 and 3 are weaker for different reasons. Context-first acceleration would get a draft into existence sooner, but it would do so before the companion boundary and scoring model are stable, which makes pack drift more likely. Full-pack inventory first is safer than rushing, but it moves attention away from the must-load entry problem the user is actually prioritizing and risks making the work feel exhaustive before it becomes useful.

## 3. Initiative Shape

### Core Principle

The initiative should widen by branch, not by accumulation. Each pack should own one clear problem class:

- entry defense
- domain narrowing
- specialist execution
- authoring and auditing
- evaluation and migration

### Non-Goals

- one single mega-pack
- direct copying of another framework’s pack system
- forcing a specialist pack at every session entry
- implementing packs before the route and naming posture are accepted

## 4. Milestone Skeleton

| Milestone | Goal | Branch condition | Output |
|-----------|------|------------------|--------|
| 0 | Transfer the draft work into `.planning` | complete | stable planning branch |
| 1 | Draft `context-intelligence` as Pattern 1 pack | user wants the must-load entry layer | Pack 1 draft |
| 2 | Add context-rot model and Pattern 2 references | Pack 1 wording is accepted | rot model + branch references |
| 3 | Draft the companion meta-builder pack | session focus shifts to skill creation or audits | companion pack draft |
| 4 | Inventory related packs and surfaces | user wants consolidation or migration decisions | matrix of packs/scripts/surfaces |
| 5 | Run evaluation and stress lanes | at least one pack draft exists | baseline and scored reports |

## 5. Branch Conditions

| If the next session is about... | Start with | Then branch to |
|--------------------------------|------------|----------------|
| Broad session entry, drift, or hierarchy confusion | `context-intelligence` | context-rot or workflow branch only if justified |
| Delegated subagent behavior | `context-intelligence` | delegation branch |
| Skill writing, pack authoring, or skill audits | `context-intelligence` | companion meta-builder pack, then evaluation lane |
| Pack consolidation, migration, or removal posture | `context-intelligence` | companion meta-builder pack, then inventory lane |
| Cross-framework path or load-surface conflict | `context-intelligence` | platform-aware research lane |

## 6. Pack Naming Posture

| Name | Status | Role |
|------|--------|------|
| `context-intelligence` | stable target | Pack 1 entry pack |
| `meta-builder-hivemind` | draft canonical candidate | companion pack for authoring, auditing, packaging |
| `hivemind-skill-writer` | accepted alias | user-facing shorthand until naming is frozen |

### Naming Rule

Do not let both companion names become separate physical packs. Freeze one canonical pack id once Cycle 3 is authorized.

## 7. Artifact Expectations By Milestone

| Milestone | Planning artifacts | Future pack artifacts |
|-----------|--------------------|-----------------------|
| 1 | Pack outline, core wording, route notes | `SKILL.md`, references index |
| 2 | Rot model and branch map | rot taxonomy, entry-state matrix, delegated scope reference |
| 3 | Companion architecture and evaluation posture | companion `SKILL.md`, audit templates, pack guidance refs |
| 4 | Inventory and classification matrix | pack family ledger, isolate/migrate/refactor decisions |
| 5 | Evaluation notes and scoring reports | baseline notes, stress results, skill-judge outputs |

## 8. What This Packet Should Protect Against

- over-constraining the entry pack
- naming forks
- specialist sprawl before Pack 1 is stable
- mixing framework-specific authoring guidance into the must-load entry layer
- declaring success before comparative evaluation exists

## 9. Out Of Scope

- Writing or deleting actual skill files
- Editing the active runtime roadmap to make this branch the main execution focus
- Running fake tests before a real draft pack exists
- Making pack retirement decisions without the inventory milestone

## 10. Authorization Rule

Every later cycle still requires explicit user approval. This packet is the orchestration guide for those cycles, not a standing approval to execute them.
