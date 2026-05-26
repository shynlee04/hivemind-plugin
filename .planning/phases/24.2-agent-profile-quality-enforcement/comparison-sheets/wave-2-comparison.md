# Wave 2 Comparison Sheet: Research Domain

This document details the audit and comparison for Wave 2 agents (`hm-project-researcher` and `hm-phase-researcher`) against GSD equivalents or skills, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-project-researcher vs gsd-project-researcher

| Compared Element | gsd-project-researcher | hm-project-researcher (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Context Awareness** | Hardcoded `<required_reading>` block checks. | Programmatic retrieval of existing project state via Hivemind `session-tracker` and metadata hooks. | Dynamically adapts to the current state of active and completed sessions in the workspace. |
| **Search Strategies** | GSD SDK command `gsd-sdk query websearch` for Brave search fallback. | Native Brave Search/Tavily/Exa/Firecrawl integrations mapped to local tools or CLI tools directly, bypassing the legacy GSD SDK wrapper. | Reduces external dependency on GSD SDK; handles tool failures gracefully. |
| **Output Formats** | Flat markdown templates. | Enhanced markdown templates containing schema anchors for JSON parser compliance. | Integrates with Hivemind GUI dashboard templates (e.g. `stack-l3-json-render`) for structured frontend rendering. |

### Upgrades applied to `hm-project-researcher`:
- Expanded templates (SUMMARY, STACK, FEATURES, ARCHITECTURE, PITFALLS) to align with structured schema targets.
- Programmatic lookup of local packages (directly reading `package.json` and lockfiles) before querying external docs.
- Integration of Exa Semantic Search and Firecrawl Scraping protocols as first-class, tool-enabled instructions.
- Strict 14+ section layout ensuring full compliance with AGENTS.md.

---

## 2. hm-phase-researcher vs gsd-phase-researcher

| Compared Element | gsd-phase-researcher | hm-phase-researcher (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Claim Provenance** | Basic text tagging (`[VERIFIED]`, `[ASSUMED]`). | Multi-level evidence tagging coupled with lineage graph verification. | Links claims directly to parent-child session hierarchy tracking, preserving the rationale chain. |
| **Package Legitimacy Gate** | Runs `slopcheck` via raw pip install commands. | Programmatic `slopcheck` execution combined with strict Node/Python package name verification hooks. | Enforces strict, automated gates before packages are recommended, preventing dependency confusion attacks. |
| **Runtime State Inventory** | Manual state questionnaire. | Integrated state verification checklist mapping OS/DB state changes directly to the Hivemind state root (`.hivemind/`). | Guarantees that refactored or renamed keys are tracked across all runtime persistence files. |
| **Validation & Security** | Flat ASVS and Nyquist mappings. | ASVS control mapping and Nyquist validation maps explicitly linking phase requirement IDs to Vitest tests. | Bridges research directly to automated test frameworks (`stack-l3-vitest`) for execution-time validation. |

### Upgrades applied to `hm-phase-researcher`:
- Incorporated the comprehensive Package Legitimacy Gate protocol (including `slopcheck` fallback handling).
- Added detailed Runtime State Inventory checklist for refactoring/migration phases.
- Integrated Nyquist Validation mapping (ID → Vitest tests) and ASVS security control mapping.
- Structured returns mapping output explicitly to orchestrator expectations, with D-02 gating annotations.
- Full 14+ section layout conforming to the codebase standards.
