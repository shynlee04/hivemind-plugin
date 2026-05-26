# Wave 6 Comparison Sheet: Roadmapping & Maintenance

This document details the audit and comparison for Wave 6 agents (`hm-roadmapper` and `hm-intel-updater`) against GSD equivalents or skills, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-roadmapper vs gsd-roadmapper

| Compared Element | gsd-roadmapper | hm-roadmapper (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Delivery Model** | Solo developer anti-enterprise layout. | Multi-wave session integration roadmap. | Focuses on L0 orchestrator delegation boundaries and L2 concurrency limits. |
| **Governance** | Flat milestone tracking. | Enforces 5 **Critical Governance Reflections** (TBD validation, Architecture Absorption, Core Protocol Chain, Phase Interdependency, and Knowledge Sources Validation). | Guarantees that roadmap changes are checked for codebase absorption and tech compliance gates. |
| **Recovery Hooks** | Relies on manual edits. | Integrates with `session-tracker` to discover resumable/forked sessions from historical paths. | Enables continuity recovery of interrupted tasks across system restarts. |

### Upgrades applied to `hm-roadmapper`:
- Specified direct dependency mapping target parameters to L0 routing engines.
- Refined the summary checklist format to expose `UI hint: yes` attributes and stacking tags.
- Full 14+ section layout complying with AGENTS.md.

---

## 2. hm-intel-updater vs gsd-intel-updater

| Compared Element | gsd-intel-updater | hm-intel-updater (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Ecosystem Layout** | Relies on GSD framework layout detection (`.kilo` vs standard). | Traces modular Hivemind package structure (`src/coordination/`, `src/task-management/`, etc.). | Custom-tailored to parse modern harness assembly surfaces rather than legacy folder trees. |
| **CLI Fallbacks** | Uses GSD CLI command `gsd-tools intel patch-meta`. | Uses native Node.js filesystem modules or local tools to extract module metadata. | Eliminates dependency on GSD framework CLI commands, resolving zsh execution errors. |
| **Self-Check Gate** | Flat check against GSD tools validation. | Validates generated schema compliance against Hivemind Kernel schemas. | Ensures output compatibility with Vercel's React JSON Renderer dashboard (`stack-l3-json-render`). |

### Upgrades applied to `hm-intel-updater`:
- Replaced all legacy `gsd-tools` CLI references with programmatic extraction instructions.
- Enforced circular dependency boundary detection and export verification hooks.
- Full 14+ section layout conforming to codebase standards.
