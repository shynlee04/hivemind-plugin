# Wave 14 Comparison Sheet: Documentation Quality

This document details the audit and comparison for Wave 14 agents (`hm-doc-writer` and `hm-doc-verifier`) against GSD equivalents, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-doc-writer vs gsd-doc-writer

| Compared Element | gsd-doc-writer | hm-doc-writer (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Authoring Quality** | Basic templates for README/getting-started. | Strict guidelines for factual API claims, verification markers, and layout constraints. | Assures that examples, config guides, and API schemas are verified in-code before generation. |
| **State Integration** | Standard Markdown files only. | Programmatically updates `session-continuity.json` and records `"docs_updated"` event in `trajectory-ledger.json`. | Unified tracking preserves documentation compilation histories across sessions. |
| **Clean Output** | Basic markdown generation. | Progressive disclosure structure: high-level overviews followed by deep-dives, with zero internal process leak. | Keeps generated user-facing docs clean from agent-specific planning/phase jargon. |

### Upgrades applied to `hm-doc-writer`:
- Enforced documentation quality standards (all API claims directly code-backed, path checks, runnable examples).
- Added direct programmatic updates to `session-continuity.json` and `trajectory-ledger.json`.
- Conformed to 14+ section layout.

---

## 2. hm-doc-verifier vs gsd-doc-verifier

| Compared Element | gsd-doc-verifier | hm-doc-verifier (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Verification Rubric** | Standard markdown scanning commands. | Rigid classifications for API signatures, configuration schemas, file paths, and runtime behaviors. | Exposes false assertions with file:line references and correct values. |
| **State Integration** | CLI verdicts returned to orchestrator. | Programmatically updates `session-continuity.json` and appends `"docs_verified"` events in `trajectory-ledger.json`. | Saves exact stats of verified, false, and unverifiable claims in continuity state. |

### Upgrades applied to `hm-doc-verifier`:
- Integrated claim status classifications (VERIFIED, FALSE, UNVERIFIABLE).
- Implemented structured verification templates and JSON output schema.
- Added programmatic state updates to `session-continuity.json` and `trajectory-ledger.json`.
- Conformed to 14+ section layout.
