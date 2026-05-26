# Wave 15 Comparison Sheet: Shipping & Specifying

This document details the audit and comparison for Wave 15 agents (`hm-shipper` and `hm-specifier`) against GSD equivalents, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-shipper vs gsd-shipper

| Compared Element | gsd-shipper | hm-shipper (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Changelog Authoring** | Basic commits listing. | Clean SemVer (Semantic Versioning) categories mapping (Added, Fixed, Changed, Security, Breaking). | Produces industry-standard formatted release changelogs. |
| **State Integration** | Standard files written to disk. | Programmatically updates `session-continuity.json` and logs `"release_shipped"` event in `trajectory-ledger.json`. | Orchestrator and control loop trace the exact release history programmatically. |
| **Verification Gate** | Basic manual checks list. | 10 pre-release verification checks (Typecheck, Test suite, Linter, Build, Changelog, Migration, Env, Rollback, Manifest, Tag). | Guarantees code stability and environment consistency before release. |
| **Rollback Strategy** | Optional general description. | Strict, standardized Rollback Plan (Source Code Revert, Database Revert, Config Revert) included in manifest. | Minimizes recovery time and risks for live application updates. |

### Upgrades applied to `hm-shipper`:
- Integrated strict 10 pre-release verification checks.
- Enforced Semantic Versioning rules and categorized changelogs.
- Standardized rollback strategies.
- Added direct programmatic updates to `session-continuity.json` and `trajectory-ledger.json`.
- Conformed to 14+ section layout.

---

## 2. hm-specifier vs gsd-specifier

| Compared Element | gsd-specifier | hm-specifier (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Specification Format** | Generic requirements listing. | EARS (Easy Approach to Requirements Syntax) ubiquitous, event-driven, unwanted, state-driven, optional mapping. | Eliminates linguistic ambiguity and ensures requirements are falsifiable. |
| **Clarity Calibration** | General guidelines. | Ambiguity Scoring Rubric (1-5 score scale) with mandatory warnings for scores >=4. | Highlights unknown dependencies and vague areas before planning and coding start. |
| **State Integration** | Standard Markdown files only. | Programmatically updates `session-continuity.json` and logs `"spec_created"` events in `trajectory-ledger.json`. | Saves exact stats of mapped requirements and average ambiguity metrics. |

### Upgrades applied to `hm-specifier`:
- Integrated EARS requirement patterns.
- Implemented acceptance criteria and verification templates.
- Enforced ambiguity scoring (1-5 scale).
- Added programmatic state updates to `session-continuity.json` and `trajectory-ledger.json`.
- Conformed to 14+ section layout.
