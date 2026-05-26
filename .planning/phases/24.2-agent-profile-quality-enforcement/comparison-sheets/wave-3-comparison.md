# Wave 3 Comparison Sheet: Synthesis & Design

This document details the audit and comparison for Wave 3 agents (`hm-synthesizer` and `hm-architect`) against GSD equivalents or skills, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-synthesizer vs gsd-research-synthesizer / gsd-doc-synthesizer

| Compared Element | GSD Synthesizers | hm-synthesizer (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Conflict Resolution** | Flat precedence rules (ADR > SPEC > PRD). | Matrix-based contradiction resolution (Recency + Source Authority priority scale). | Dynamically weights newer official announcements/changelogs against stale documentation. |
| **State Integration** | Processes files in a static directory. | Integrates with `session-tracker` to read historical lineage and preceding phase research. | Prevents loss of context across multiple disconnected sessions or parallel researcher runs. |
| **Output Quality** | Simple markdown tables or plain text logs. | Programmatically formatted `SUMMARY.md` mapped to downstream `hm-roadmapper` ingestion schemas. | Enables automatic compilation of milestone and roadmap files without human manual stitching. |

### Upgrades applied to `hm-synthesizer`:
- Enforced a rigorous multi-stage execution flow (indexing, agreement identification, recency-based resolution, and gap flagging).
- Added a structured Return format providing precise counts of resolved/unresolved contradictions and research gaps.
- Full 14+ section layout complying with AGENTS.md requirements.

---

## 2. hm-architect vs GSD Design Primitives

| Compared Element | GSD Design | hm-architect (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Interface Design** | Basic description in phase plans. | Enforces a formal "design an interface" protocol generating and comparing 3+ radically different designs. | Evaluates sync vs async, hexagonal vs layered, and centralized vs distributed patterns before coding. |
| **Traceability** | None; plans reference features informally. | Bidirectional traceability mapping architectural boundaries to requirement IDs. | Guarantees every architectural component directly addresses a documented requirement. |
| **Security by Design** | Handled downstream during review. | Infuses ASVS secure design principles (e.g. least privilege, fail secure, defense in depth) into component design. | Prevents structural security flaws early in the design cycle rather than retroactively. |

### Upgrades applied to `hm-architect`:
- Expanded Architecture Decision Record (ADR) template to include a mandatory "Compliance" section detailing programmatic verification.
- Enforced circular dependency check rules and explicit surface authority boundaries in `ARCHITECTURE.md`.
- Full 14+ section layout conforming to codebase standard.
