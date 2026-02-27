# Alignment Matrix — Master Plan Gaps & Sector Readiness

> Load this reference in Mode 3 (INTEGRATE) and Mode 5 (REFACTOR).
> Update this matrix after each wave delivery to track progress.

---

## Gap Tracking

| Gap ID | Description | Score (0-10) | Sector-2 Provides | Sector-1 Must Build | Wave Target |
|---|---|---|---|---|---|
| GAP-1 | Command Chaining | 3/10 | 43 commands with `group` + `required_skills` | `execution_context` + `kind: router` wiring | Wave 2A-2B |
| GAP-2 | SOT Planning Layer | 0/10 | N/A | `.hivemind/project/planning/` hierarchy | Wave 1B |
| GAP-3 | Progressive Disclosure | 0/10 | `skill_bundles` declared per workflow step | `skill-loader.ts` runtime | Wave 4 |
| GAP-4 | Code Intelligence | 1/10 | codemap/codewiki manifests exist (empty) | Population + planning integration | Wave 5 |
| GAP-5 | Auto-Session | 0/10 | N/A | session-classifier + materializer | Wave 2C |

---

## Sector-2 Readiness Checklist

Sector-2 structural foundation that Sector-1 can wire into:

| # | Readiness Item | Status | Evidence |
|---|---|---|---|
| 1 | All workflows are v2-compliant | Verify | `scripts/structural-audit.sh` S-03 check |
| 2 | All commands have `required_skills` | Verify | `scripts/structural-audit.sh` S-02 check |
| 3 | All agents have `tasks`/`workflows`/`prompts` | Verify | `scripts/structural-audit.sh` S-01 check |
| 4 | Guards exist on all workflows | Verify | grep `guards:` in all workflow YAML |
| 5 | Skill bundles are mapped | Verify | registry.yaml has `bundle` for every entry |

**Contract boundary**: Sector-1 builds the RUNTIME (code, loaders, routers). Sector-2 provides the CONFIGURATION (YAML, templates, references). Neither touches the other's domain.

---

## Wave Delivery Progress

Track wave completion status. Update after each wave gate passes.

| Wave | Name | Status | Gate Criteria | Gate Date |
|---|---|---|---|---|
| Wave 1 | Foundation Wiring | Complete | 12/12 router commands + validator | 2026-02-27 |
| Wave 2A | HiveFiver Workflow YAMLs | In Progress | ~10 workflow YAMLs wired | — |
| Wave 2B | Hiveminder Command Wiring | Pending | ~10 commands fully wired | — |
| Wave 2C | Auto-Session Foundation | In Progress | planning-materializer.ts + session hooks | — |
| Wave 3 | Convergence | Pending | Track-A + Track-B integrated | — |
| Wave 4 | Progressive Disclosure | Pending | skill-loader runtime operational | — |
| Wave 5 | Code Intelligence | Pending | codemap populated + planning-linked | — |
| Wave 6 | Polish & Release | Pending | Full audit pass + public guard | — |

---

## Integration Risk Register

Known risks at Sector-1 <-> Sector-2 boundary:

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Zod schema drift | Sector-1 rejects valid Sector-2 YAML | Medium | C-03 check in every wave gate |
| Sync overwrites user config | User customizations destroyed | High (if not mitigated) | Smart-merge implemented (Wave 1) |
| Workflow v1 remnants | Old workflows bypass guards | Low (after Wave 1) | S-03 check catches v1 workflows |
| Skill registry orphans | Skills exist but are invisible to loader | Medium | S-08 bidirectional check |
| Command without execution_context | Commands execute without workflow guardrails | High (pre-Wave 2) | S-02 blocks unwired commands |

---

## How to Update This Matrix

After each wave delivery:

1. Re-run `scripts/structural-audit.sh` — captures S-01 through S-10
2. Update Gap scores based on new capabilities
3. Update Wave status and gate date
4. Re-assess integration risks
5. Save updated matrix as evidence for the wave gate report
