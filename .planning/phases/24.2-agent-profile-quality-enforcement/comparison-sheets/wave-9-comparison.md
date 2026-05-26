# Wave 9 Comparison Sheet: Integration & Debugging

This document details the audit and comparison for Wave 9 agents (`hm-integration-checker` and `hm-debug-session-manager`) against GSD equivalents or skills, highlighting the superior design choices implemented in the Hivemind versions.

---

## 1. hm-integration-checker vs gsd-integration-checker

| Compared Element | gsd-integration-checker | hm-integration-checker (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Ecosystem Design** | Relies on Next.js structures (`app/api`, `pages/api`) and front-end layouts. | Adapts to Hivemind's modular framework architecture (`src/coordination/`, `src/task-management/`, `src/tools/`). | Custom-tailored to map harness runtime extensions rather than plain web applications. |
| **Telemetry Persistence** | No native state telemetry logging. | Programmatically updates `.hivemind/state/session-continuity.json` and `trajectory-ledger.json` with E2E flow status and API check counts. | Retains detailed integration stats and regression details in persistent session logs. |
| **Integration Verds** | Basic CLI-based output reports. | Outputs detailed integration reports complying with the Vercel React JSON Renderer format. | Prepares integration status for live dashboard visualization. |

### Upgrades applied to `hm-integration-checker`:
- Excised legacy Next.js assumptions from the default execution paths.
- Removed all `gsd-sdk` CLI references.
- Conformed to 14+ section layout.

---

## 2. hm-debug-session-manager vs gsd-debug-session-manager

| Compared Element | gsd-debug-session-manager | hm-debug-session-manager (Hivemind) | Superior Points in Hivemind |
|---|---|---|---|
| **Model Resolution** | Queries models via `gsd-sdk query resolve-model`. | Reads debugger agent configuration from `.hivemind/configs.json`. | Avoids external process invocations for model configuration. |
| **Debugger Target** | Dispatches legacy `gsd-debugger` subagent. | Dispatches `hm-debugger` and manages cycle iterations. | Aligns with Hivemind-native debugger agent contracts. |
| **Telemetry Persistence** | basic text logs. | Updates `.hivemind/state/session-continuity.json` and `trajectory-ledger.json` with checkpoints, active hypotheses, and cycles count. | Integrates with the central session tracker to support cross-restart debug resumes. |

### Upgrades applied to `hm-debug-session-manager`:
- Unified state updates with Hivemind-native JSON logs.
- Replaced all legacy GSD references.
- Conformed to 14+ section layout.
