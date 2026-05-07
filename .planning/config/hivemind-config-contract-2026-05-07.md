<!-- generated-by: gsd-doc-writer -->
# Hivemind Config Contract — 2026-05-07

**Artifact group:** Config / governance  
**Phase:** Phase 0 — Governance Baseline  
**Status:** Blocking baseline for config-plane planning  
**Evidence level:** L5 documentation/governance evidence only  
**Runtime readiness:** Not claimed. Runtime proof requires later L1-L3 evidence.

---

## Purpose

This artifact locks the Phase 0 configuration vocabulary and required config-to-consumer expectations. It is source-backed by `package.json`, the architecture map, and the existing config traceability artifact.

---

## Config Loading Baseline

The existing config traceability artifact records this loading chain:

```text
plugin startup
  -> getConfig(projectRoot)
  -> readConfigs(projectRoot)
  -> missing file uses defaults
  -> existing file parses JSON, migrates legacy keys, validates with Zod
  -> invalid file falls back to defaults
  -> cached typed HivemindConfigs is consumed by hooks/libs
```

This is L5 documentation evidence. A later runtime gate must prove behavior with tests or live execution.

---

## Required Config Fields and Consumers

| Field | Default / current status | Known consumers from traceability | Phase 0 contract |
|---|---|---|---|
| `conversation_language` | Default `"en"`; traced as wired | governance block, behavioral profile resolver | Must instruct conversation language and remain visible in behavioral context. Future enforcement proof must verify runtime prompt injection. |
| `documents_and_artifacts_language` | Default `"en"`; traced as wired | governance block, behavioral profile resolver | Must instruct generated document/artifact language and remain visible in behavioral context. |
| `mode` | Default `"expert-advisor"`; traced as wired | governance block, behavioral profile resolver | Must select behavior mode. Canonical modes: `expert-advisor`, `hivemind-powered`, `free-style`. |
| `user_expert_level` | Default `"intermediate-high-level"`; traced as wired | governance block, behavioral profile resolver | Must select expertise framing and behavioral profile expertise. |
| `delegation_systems` | Default nested object; traced as dead | none | Must not be claimed runtime-active until wired to delegation dispatch gates or explicitly marked deferred. |

---

## Delegation Systems Contract

`delegation_systems` is a governance-sensitive field because it names dispatch pathways:

| Subfield | Intended meaning | Current Phase 0 status |
|---|---|---|
| `native_task` | Use host/native task delegation when available. | Contract only; no verified runtime consumer in traceability artifact. |
| `delegate_task` | Use Hivemind `delegate-task` tool / WaiterModel dispatch. | Contract only; delegation exists but field-specific gating is not proven. |
| `background_delegation` | Use background command/process delegation where authorized. | Contract only; must be gated before runtime claims. |

Downstream phases must either wire this field to runtime behavior or label it as deferred. Leaving it silently dead fails Phase 0 config acceptance.

---

## Planned Config Consumers

| Consumer family | Planned role | Boundary |
|---|---|---|
| `hivemind init` | Create config defaults during bootstrap. | BOOT continuation only after Phase 0 gate. |
| `hivemind doctor` | Validate config shape, defaults, dead/deferred fields, primitive counts, and state root integrity. | Planned CLI proof; not delivered by Phase 0. |
| `hf-doctor` command family | Meta-authoring diagnostic commands for primitives, skills, agents, commands, lineage, and authoring health. | Planned meta-authoring commands; must not mutate runtime state unless explicitly designed as write-side tools. |
| `hf-meta-authoring` command family | Create/audit/repair meta-concepts under `.hivefiver-meta-builder/` before reflection into `.opencode/`. | Planned meta-authoring commands; must preserve shipped/dev/internal boundaries. |
| Behavioral profile resolver | Apply `mode`, `user_expert_level`, and language settings. | Existing traceability says wired; runtime proof still belongs to later gates. |
| Governance block / hook layer | Inject mode/language/expertise instructions into OpenCode prompt transforms. | Hook layer must remain read/response-shaping; no durable writes. |

---

## Required vs Optional Settings

| Setting | Phase 0 classification | Reason |
|---|---|---|
| `conversation_language` | Required contract field with default | User-facing behavior changes by language. |
| `documents_and_artifacts_language` | Required contract field with default | Generated artifact language must be deterministic. |
| `mode` | Required contract field with default | Behavior mode controls governance style. |
| `user_expert_level` | Required contract field with default | Expertise framing changes prompt behavior. |
| `delegation_systems` | Required schema field, unresolved runtime field | Must not remain silently dead. |
| workflow toggles | Mixed: wired, future-consumer, or deferred | Must be individually classified by traceability before use in claims. |

---

## Falsifiable Acceptance Criteria

| ID | Criterion | Verification | Blocks |
|---|---|---|---|
| P0-CFG-01 | Phase 0 docs name the five governance-sensitive config fields and their current consumer status. | Inspect this artifact. | BOOT config bootstrap and MCM config integration. |
| P0-CFG-02 | `delegation_systems` is not presented as runtime-active until a consumer is verified. | Inspect this artifact and downstream roadmap/state text. | Delegation/routing claims. |
| P0-CFG-03 | Planned `hf-doctor` and `hf-meta-authoring` command families are documented as planned, not delivered. | Inspect planned config consumers. | MCM and meta-authoring command work. |
| P0-CFG-04 | Config claims are classified as L5 unless later runtime tests or live CLI proof are attached. | Inspect evidence-level statements. | BOOT doctor/init readiness. |

---

## Gate Result

This artifact is L5 governance evidence. It blocks config-plane ambiguity but does not prove runtime config behavior.
