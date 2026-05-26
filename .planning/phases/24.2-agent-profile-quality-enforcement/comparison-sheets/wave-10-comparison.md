# Wave 10 Comparison Sheet: Debugging & Security

This document details the audit and comparison for Wave 10 agents (`hm-debugger` and `hm-security-auditor`) against GSD equivalents or skills, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-debugger vs gsd-debugger

| Compared Element | gsd-debugger | hm-debugger (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Debugging Loop** | Standard troubleshooting commands. | Implements a robust scientific hypothesis testing framework with predicted evidence and falsification tests. | Ensures debugging is structured, systematic, and avoids guesswork or random code mutations. |
| **Telemetry Persistence** | basic text logs. | Updates `.hivemind/state/session-continuity.json` and `trajectory-ledger.json` programmatically with tested hypotheses. | Retains diagnostic state across cycles and allows resumes. |
| **Knowledge Base** | Unintegrated. | Appends resolutions to `.planning/debug/knowledge-base.md` to skip investigation cycles for repeating bugs. | Enables historical pattern-matching to resolve repeating bugs faster. |

### Upgrades applied to `hm-debugger`:
- Replaced all legacy `gsd-sdk` commands.
- Integrated Rubber Duck, Delta, and Binary search debugging techniques.
- Conformed to 14+ section layout.

---

## 2. hm-security-auditor vs gsd-security-auditor

| Compared Element | gsd-security-auditor | hm-security-auditor (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **STRIDE Framework** | Checks mitigation lists. | Structured boundary mapping (client→API, service→DB, internal→external) and checks all 6 STRIDE categories. | Provides complete coverage of architectural trust boundaries. |
| **State Integration** | Standard Markdown report only. | Programmatically updates `session-continuity.json` and `trajectory-ledger.json` with closed/open threat counts. | Keeps track of security telemetry at the orchestrator layer. |
| **Package Legitimacy** | basic check. | Implements an exhaustive Package Legitimacy Gate (typosquatting, publish date, downloads). | Protects codebase from malicious or slopsquatted dependencies. |

### Upgrades applied to `hm-security-auditor`:
- Replaced legacy commands with programmatic state log modifications.
- Unified severity findings and structured completion formats.
- Conformed to 14+ section layout.
