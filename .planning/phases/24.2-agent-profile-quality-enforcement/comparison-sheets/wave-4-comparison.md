# Wave 4 Comparison Sheet: Codebase Mapping

This document details the audit and comparison for Wave 4 agents (`hm-codebase-mapper` and `hm-pattern-mapper`) against GSD equivalents or skills, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-codebase-mapper vs gsd-codebase-mapper

| Compared Element | gsd-codebase-mapper | hm-codebase-mapper (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Mapping Modes** | Simple file scanning. | Multi-tier reading modes (SCAN, READ, DEEP) mapped to time budgets. | Optimizes token usage by dynamically adjusting scan depth based on directory file counts. |
| **Integrations** | Flat directory printing. | Lineage-aware graph visualization references mapping to `.planning/graphs/`. | Integrates with local repository mapping tools to maintain a fresh, queryable dependency graph. |
| **Output Schema** | basic directory logs. | Rich codebase intelligence files (STRUCTURE.md, ARCHITECTURE.md, CONVENTIONS.md, STACK.md, CONCERNS.md). | Standardizes the files to feed directly into the Nyquist validation layer. |

### Upgrades applied to `hm-codebase-mapper`:
- Enforced strict CQRS boundary and 9-surface authority verification rules.
- Prevented artifact clashes: `hm-codebase-mapper` reads and documents existing structure but does not design new architecture (delegated strictly to `hm-architect`).
- Full 14+ section layout complying with AGENTS.md requirements.

---

## 2. hm-pattern-mapper vs gsd-pattern-mapper

| Compared Element | gsd-pattern-mapper | hm-pattern-mapper (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Pattern Context** | Extracts snippets on request. | Programmatic JSDoc and Type definition pattern extraction. | Enforces strict validation of extracted patterns against TypeScript compiler configs. |
| **Error Handling** | Basic try/catch mapping. | Standardized Hivemind runtime error handling patterns (e.g. `[Harness]` prefix error throws). | Guarantees new code uses unified logging, tracing, and exception throwing standards. |
| **Testing Patterns** | Mock-only suggestions. | Test pattern mapping targeting Vitest frameworks (`stack-l3-vitest`). | Aligns test scaffolding directly with test-driven execution (`hm-l2-test-driven-execution`) needs. |

### Upgrades applied to `hm-pattern-mapper`:
- Enforced mandatory JSDoc style and type compliance checking rules.
- Specified default templates for core Hivemind components (e.g. tools, hooks, handlers).
- Full 14+ section layout conforming to codebase standards.
