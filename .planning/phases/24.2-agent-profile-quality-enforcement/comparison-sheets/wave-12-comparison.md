# Wave 12 Comparison Sheet: UI Domain (Research & Check)

This document details the audit and comparison for Wave 12 agents (`hm-ui-researcher` and `hm-ui-checker`) against GSD equivalents, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-ui-researcher vs gsd-ui-researcher

| Compared Element | gsd-ui-researcher | hm-ui-researcher (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Vetting Safeties** | Uses CLI commands with instructions. | Integrates clean, specific source-code safety scanning for third-party component registries. | Standardizes static checks for networks, process env access, and dynamic code execution. |
| **State Integration** | Standard Markdown file outputs only. | Programmatically updates `.hivemind/state/session-continuity.json` and logs `"ui_spec_created"` events in `trajectory-ledger.json`. | Saves spec size, design system configs, and safety metadata in unified state files. |
| **Design Rules** | Guidelines for components and scales. | Strict rubrics for spacing grid (multiples of 4), typography caps (max 4 sizes, max 2 weights), and 60/30/10 colors. | Enforces strict consistency and removes visual style ambiguity. |

### Upgrades applied to `hm-ui-researcher`:
- Integrated shadcn initialization and third-party registry vetting protocols.
- Standardized grid, color, and typography design contracts.
- Added direct programmatic updates to `session-continuity.json` and `trajectory-ledger.json`.
- Conformed to 14+ section layout.

---

## 2. hm-ui-checker vs gsd-ui-checker

| Compared Element | gsd-ui-checker | hm-ui-checker (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Verification Logic** | Verification checklists. | Implements a robust 6-dimension evaluation rubric with exact line citations required. | Ensures that PASS/FLAG/BLOCK verdicts are evidence-based and objective. |
| **State Integration** | Verdict returned as text to CLI. | Programmatically updates `session-continuity.json` and appends `"ui_spec_verified"` events in `trajectory-ledger.json`. | Orchestrator and other features can query the exact verification metadata. |
| **Copywriting Rules** | Checklist suggestions. | Strict CTAs checking (no generic words like "Submit"), plus mandatory solution paths in error states. | Prevents bad visual patterns and placeholder slops before implementation starts. |

### Upgrades applied to `hm-ui-checker`:
- Integrated 6-dimension strict evaluation rules.
- Added exact verdict classification mappings (BLOCK vs FLAG vs PASS).
- Added programmatic state logs tracking.
- Conformed to 14+ section layout.
