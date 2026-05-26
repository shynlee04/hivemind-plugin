# Wave 13 Comparison Sheet: UI Auditing & Nyquist Validation

This document details the audit and comparison for Wave 13 agents (`hm-ui-auditor` and `hm-nyquist-auditor`) against GSD equivalents, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-ui-auditor vs gsd-ui-auditor

| Compared Element | gsd-ui-auditor | hm-ui-auditor (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Screenshot Safety** | Relies on manual config warnings. | Strict `.gitignore` screenshot check runs automatically before any capture tool is used. | Prevents heavy binary screenshot assets from leaking into Git history. |
| **Telemetry Ingestion** | Markdown-only text reports. | Updates `session-continuity.json` and logs `"ui_reviewed"` event in `trajectory-ledger.json`. | Integrates visual metrics programmatically with orchestrator dashboards. |
| **Audit Coverage** | Eyeballs pages for layout issues. | 6-pillar structured audit (Copywriting, Visuals, Color, Typography, Spacing, Experience Design) with custom point system. | Enforces objective, measurable UX standards. |
| **Registry Vetting** | Simple CLI component listings. | Vetting checks scan registry components for network, dynamic eval, and environment exfiltration markers. | Protects codebase from compromised dependency registries. |

### Upgrades applied to `hm-ui-auditor`:
- Integrated Playwright MCP and CLI screenshot automation.
- Enforced grid-level spacing, font size constraints, and copywriting safety checks.
- Added direct programmatic updates to `session-continuity.json` and `trajectory-ledger.json`.
- Conformed to 14+ section layout.

---

## 2. hm-nyquist-auditor vs gsd-nyquist-auditor

| Compared Element | gsd-nyquist-auditor | hm-nyquist-auditor (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Evidence Validation** | Generic coverage listings. | Rigid L1-L5 evidence level checks; flags deceptive mock-only tests as gaps. | Forces verification tests to assert actual component behaviors, not stubs. |
| **Nyquist Sampling** | Basic test checklists. | Implements Nyquist Software Sampling (testing twice the complexity, boundary forks, and error catches). | Quantifies the mathematical sufficiency of test suites. |
| **State Integration** | Standard Validation Markdown files. | Programmatically updates `session-continuity.json` and records `"phase_validated"` events in `trajectory-ledger.json`. | Saves gap counts and remediation lists inside the shared continuity state. |

### Upgrades applied to `hm-nyquist-auditor`:
- Integrated Nyquist Software Sampling boundaries and state transition rules.
- Enforced test generation protocols using Vitest.
- Added programmatic state updates to `session-continuity.json` and `trajectory-ledger.json`.
- Conformed to 14+ section layout.
