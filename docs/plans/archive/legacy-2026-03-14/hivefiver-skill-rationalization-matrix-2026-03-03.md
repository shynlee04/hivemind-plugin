# Hivefiver Skill Rationalization Matrix (2026-03-03)

## Objective

Denoise skill selection while preserving depth:

- Exactly 2 direct hivefiver entry skills
- Around 10 total top-level entry skills
- All other skills route as helpers/domain packs

## Direct Entry Contract

1. `hivefiver-prime`
2. `hivefiver-mode`

No other hivefiver skill is direct-entry at turn start.

## Top-Level Entry Pack (~10)

1. `hivefiver-prime`
2. `hivefiver-mode`
3. `context-first-gatekeeping`
4. `context-integrity`
5. `delegation-intelligence`
6. `gate-enforcement`
7. `compliance-checking`
8. `evidence-discipline`
9. `debug-orchestration`
10. `creative-ideating-room`

## Keep / Merge / Deprecate Matrix

| Skill | Decision | Role | Routed By | Notes |
|---|---|---|---|---|
| `hivefiver-prime` | KEEP | direct-entry | n/a | mandatory first skill |
| `hivefiver-mode` | KEEP | direct-entry | `hivefiver-prime` | stage router |
| `hivefiver-coordination` | KEEP | helper | `hivefiver-mode` | quality/gates helper |
| `hivefiver-context-enforcer` | KEEP | helper | `hivefiver-mode` | degraded/recovery only |
| `hivefiver-domain-pack-router` | KEEP | helper | `hivefiver-mode` | domain routing |
| `hivefiver-gsd-compat` | KEEP | helper | `hivefiver-mode` | lifecycle bridge |
| `hivefiver-guided-discovery` | KEEP | helper | `hivefiver-mode` | requirements clarification |
| `hivefiver-mcp-research-loop` | KEEP | helper | `hivefiver-mode` | MCP-backed research loop |
| `hivefiver-orchestrator` | KEEP | helper | `hivefiver-mode` | stage/meta orchestration |
| `hivefiver-persona-routing` | KEEP | helper | `hivefiver-mode` | persona lane routing |
| `hivefiver-ralph-tasking` | KEEP | helper | `hivefiver-mode` | task graph emit |
| `hivefiver-skill-auditor` | KEEP | helper | `hivefiver-mode` | pack audit |
| `hivefiver-spec-distillation` | KEEP | helper | `hivefiver-mode` | ambiguity reduction |
| `hivefiver-bilingual-tutor` | KEEP | helper | `hivefiver-mode` | bilingual onboarding |
| `agent-role-boundary` | KEEP | governance-entry | direct | role separation guard |
| `comparative-analysis` | KEEP | governance-helper | direct | option scoring |
| `compliance-checking` | KEEP | governance-entry | direct | contract conformance |
| `context-first-gatekeeping` | KEEP | governance-entry | direct | pre-action gate |
| `context-integrity` | KEEP | governance-entry | direct | drift/repair |
| `context-quality-escalation` | MERGE-CANDIDATE | governance-helper | `context-integrity` | merge escalation logic into integrity/enforcer |
| `creative-ideating-room` | KEEP | governance-entry | direct | deterministic ideation |
| `debug-orchestration` | KEEP | governance-entry | direct | debug workflow |
| `delegation-intelligence` | KEEP | governance-entry | direct | delegation strategy |
| `delegation-packet-contract` | MERGE-CANDIDATE | governance-helper | `delegation-intelligence` | packet schema can be embedded |
| `evidence-discipline` | KEEP | governance-entry | direct | claim-evidence contract |
| `gate-enforcement` | KEEP | governance-entry | direct | gate rules |
| `gx-context-engine` | KEEP | platform-helper | `hivefiver-mode` | GX runtime primitives |
| `hitea-adversarial-arena` | KEEP | testing-pack | routed | domain-specific testing |
| `hitea-chaos-engineering` | KEEP | testing-pack | routed | domain-specific testing |
| `hitea-mutation-testing` | KEEP | testing-pack | routed | domain-specific testing |
| `hitea-property-testing` | KEEP | testing-pack | routed | domain-specific testing |
| `hitea-visual-regression` | KEEP | testing-pack | routed | domain-specific testing |
| `ecosystem-diagnostic` | TODO-CREATE-OR-REMOVE | missing | n/a | listed path not present in tree |

## Routing Graph

```text
hivefiver-prime
  -> hivefiver-mode
      -> (one helper selected by stage)
          -> hivefiver-coordination (if gate work)
          -> hivefiver-context-enforcer (if degraded/recovery)
          -> domain helper (router/compat/discovery/research/tasking)
```

## Consolidation Wave Rules

- No physical deletion before two consecutive clean quality-check runs.
- Merge candidates (`context-quality-escalation`, `delegation-packet-contract`) move content first, then deprecate wrappers.
- Keep testing skills as routed domain pack; do not make them direct entry.
