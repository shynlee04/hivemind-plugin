# Session Inspection Export

- ses_id: `ses_2df75a56effe51P8oWfmLwLM2y`
- prepared_at: `2026-03-24T15:52:16.863Z`

## Assistant Output

## Agent Definition Files — Structured Summary

**Investigation scope:** All 13 agent files in `.opencode/agents/`
**Files verified:** All 13 exist at `/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/agents/`

---

### 1. `hiveminder.md` — Primary Orchestrator

| Field | Value |
|-------|-------|
| **Role** | Primary orchestrator — accepts user intent, plans execution, routes bounded packets to specialist agents, verifies delegated returns |
| **Mode** | `primary` |
| **Tools** | `write: false`, `edit: false`, `bash: *`, `task: * (deny) + [all 11 specialist agents + build/explore/plan/general]`, `todoread/todowrite`, `websearch`, `codesearch` |
| **Skills** | `use-hivemind`, `use-hivemind-delegation`, `agent-role-boundary`, `use-hivemind-context-integrity`, `hivemind-gatekeeping-delegation`, `use-hivemind-git-memory` |
| **Key Rules** | NEVER implements code directly; NEVER reads code files deeply (scan for routing only); NEVER self-certifies delegated work without evidence; NEVER runs build/test/lint directly; NEVER makes architectural decisions; NEVER loads domain skills (tdd, course-correction, research); delegates to all agents; full routing table defined |

---

### 2. `architect.md` — System Design Authority

| Field | Value |
|-------|-------|
| **Role** | System design authority — makes technical decisions, selects patterns, defines interfaces, plans structural foundation |
| **Mode** | `subagent` |
| **Tools** | `write: true` (`.json`, `.md`, `.opencode/`, `.hivemind/`, `.developing-skills/`), `edit: false`, `bash: *`, `webfetch: allow`, `task: code-skeptic, hiveq, hivexplorer` |
| **Skills** | `use-hivemind`, `use-hivemind-context-integrity`, `context-intelligence-entry`, `hivemind-codemap`, `agent-role-boundary`, `spec-distillation` |
| **Key Rules** | NEVER implements code in production files; NEVER makes decisions without trade-off analysis (context, options, decision, rationale, reversibility); NEVER ignores existing patterns; NEVER creates monolithic designs; MUST run `hivemind-codemap` before any design; outputs ADRs to `.hivemind/plans/` |

---

### 3. `code-skeptic.md` — Critical Analysis Specialist

| Field | Value |
|-------|-------|
| **Role** | Challenges assumptions, exposes hidden risks, demands evidence — reviews implementations and questions design decisions |
| **Mode** | `subagent` |
| **Tools** | `write: true`, `edit: true` (`.json`, `.md`, `.opencode/`, `.hivemind/`, `.developing-skills/`), `bash: allow`, `task: hiveq, hivexplorer`, `webfetch: deny` |
| **Skills** | `use-hivemind`, `use-hivemind-context-integrity`, `hivemind-codemap`, `course-correction-delegation`, `context-entry-verify`, `research-delegation` |
| **Key Rules** | NEVER makes code changes; NEVER approves code (provides evidence for/against only); NEVER makes architectural decisions; NEVER verifies requirements (hiveq's job); NEVER implements fixes; every claim must have file:line reference; severity classification (Critical/High/Medium/Low) mandatory |

---

### 4. `hiveq.md` — Verification Specialist

| Field | Value |
|-------|-------|
| **Role** | Goal-backward validation — verifies work achieved its GOAL, not just that tasks were marked complete |
| **Mode** | `subagent` |
| **Tools** | `write: false`, `edit: false`, `bash: allow`, `task: * (deny)`, `webfetch: deny` |
| **Skills** | `use-hivemind`, `use-hivemind-context-integrity`, `agent-role-boundary`, `tdd-delegation`, `context-entry-verify`, `hivemind-atomic-commit` |
| **Key Rules** | NEVER makes code changes; NEVER trusts summary claims; three-level verification mandatory (Existence → Substance → Wiring); ambiguous evidence = FAIL; must run actual commands (`npx tsc`, `npm test`, `npm run lint`, `npm run build`); dispatches to `hivexplorer` for context |

---

### 5. `hivemaker.md` — Implementation Specialist

| Field | Value |
|-------|-------|
| **Role** | Terminal implementation specialist — executes scoped code changes, file creation/modification per architect's design |
| **Mode** | `subagent` |
| **Tools** | `write: true`, `edit: true`, `patch: allow`, `offset-read: allow`, `bash: *`, `task: hivexplorer, hiveq` |
| **Skills** | `use-hivemind`, `use-hivemind-delegation`, `agent-role-boundary`, `use-hivemind-context-integrity`, `tdd-delegation`, `hivemind-atomic-commit` |
| **Key Rules** | NEVER makes architectural decisions; NEVER delegates implementation; NEVER edits framework assets; follows 4-tier autonomy (auto-fix bugs, auto-add missing critical, auto-fix blocking, ASK about architecture); 3-attempt limit on fixes; analysis paralysis guard (5+ reads without write → STOP); must self-verify with `npx tsc`, `npm test`, `npm run lint`, `npm run build` |

---

### 6. `hiveplanner.md` — Planning Specialist

| Field | Value |
|-------|-------|
| **Role** | Translates ambiguous intent into ordered steps, mapped dependencies, and handoff-ready planning artifacts |
| **Mode** | `subagent` |
| **Tools** | `write: true`, `edit: true`, `bash: *`, `task: allow`, `webfetch: deny` |
| **Skills** | `use-hivemind`, `use-hivemind-delegation`, `hivemind-gatekeeping-delegation`, `spec-distillation`, `hivemind-research`, `hivemind-research-framework` |
| **Key Rules** | NEVER implements code; NEVER delegates to implementation agents; NEVER creates plans without dependency analysis; NEVER omits success criteria; each plan step must have target agent, scope, dependencies, verifiable success criteria; dispatches to `hivexplorer` (codebase) and `hiverd` (external) |

---

### 7. `hivexplorer.md` — Repository Investigator

| Field | Value |
|-------|-------|
| **Role** | Terminal repository investigator — read-only codebase research, evidence collection with exact file:line references |
| **Mode** | `subagent` |
| **Tools** | `write: false`, `edit: false`, `bash: *`, `task: * (deny)`, `webfetch: deny` |
| **Skills** | `use-hivemind`, `use-hivemind-context-integrity`, `hivemind-codemap`, `research-delegation`, `hivemind-research-tools`, `use-hivemind-git-memory` |
| **Key Rules** | NEVER writes/edits/creates/deletes files; NEVER delegates (terminal agent); NEVER recommends implementation; NEVER makes architectural decisions; every claim must cite file:line; verification gate checks fresh file existence; writes reports to `.hivemind/activity/agents/hivexplorer/{pass_id}/` |

---

### 8. `hiverd.md` — External Research Specialist

| Field | Value |
|-------|-------|
| **Role** | Terminal external research specialist — gathers documentation, API, ecosystem, and market evidence from outside the codebase |
| **Mode** | `subagent` |
| **Tools** | `write: false`, `edit: false`, `bash: *`, `task: * (deny)`, `webfetch: allow`, `websearch: allow`, `codesearch: allow` |
| **Skills** | `use-hivemind`, `use-hivemind-context-integrity`, `research-delegation`, `hivemind-research`, `hivemind-research-framework`, `hivemind-research-tools` |
| **Key Rules** | NEVER edits/mutates repository files; NEVER delegates (terminal agent); NEVER makes unsourced claims; grades confidence (HIGH/MEDIUM/LOW/UNVERIFIED); source hierarchy: codesearch (1st) → webfetch (2nd) → websearch (3rd); flags stale sources (>1 year); writes to `.hivemind/activity/agents/hiverd/{pass_id}/` |

---

### 9. `hivehealer.md` — Remediation Specialist

| Field | Value |
|-------|-------|
| **Role** | Terminal remediation specialist — diagnoses breaks, applies surgical fixes, proves recovery |
| **Mode** | `subagent` |
| **Tools** | `write: true`, `edit: true`, `bash: *`, `task: hivexplorer, hiveq` |
| **Skills** | `use-hivemind`, `use-hivemind-context-integrity`, `course-correction-delegation`, `use-hivemind-git-memory`, `hivemind-system-debug`, `context-entry-verify` |
| **Key Rules** | NEVER delegates implementation; NEVER rewrites architecture; NEVER edits framework assets; NEVER applies fixes without diagnosis; smallest safe fix principle; 3-attempt limit on same root cause; if root cause is design flaw → STOP, report to architect; must verify fix passes and check for regressions |

---

### 10. `hitea.md` — Testing Infrastructure Specialist

| Field | Value |
|-------|-------|
| **Role** | Terminal testing specialist — builds testing infrastructure, test harnesses, fuzzing workflows, and test files |
| **Mode** | `subagent` |
| **Tools** | `write: true`, `edit: true`, `bash: *`, `task: hivexplorer, hiveq` |
| **Skills** | `use-hivemind`, `use-hivemind-delegation`, `use-hivemind-context-integrity`, `tdd-delegation`, `hivemind-atomic-commit`, `use-hivemind-git-memory` |
| **Key Rules** | NEVER delegates work; NEVER authors framework assets; NEVER implements features (tests only); NEVER modifies product code beyond testability wiring; NEVER writes tautological tests; RED gate: tests MUST fail initially; edge cases (null, empty, boundary, error) mandatory; follows regulated cycle: READ → DESIGN → RED → VERIFY FAIL → GREEN → EDGE CASES → REPORT |

---

### 11. `handoff.md` — Complex Workflow Orchestrator

| Field | Value |
|-------|-------|
| **Role** | Advanced handoff agent for complex multi-phase workflows (3+ phases), gatekeeper validation, and cross-domain coordination |
| **Mode** | `all` (can be primary or subagent) |
| **Tools** | `write: true`, `edit: true`, `bash: *`, `task: [all 11 agents + self]`, `todoread/todowrite`, `webfetch/websearch/codesearch: allow`, `mcp: gitmcp_*, context7_*, repomix_*, deepwiki_*` |
| **Skills** | `use-hivemind`, `use-hivemind-delegation`, `use-hivemind-context-integrity`, `hivemind-gatekeeping-delegation`, `hivemind-atomic-commit`, `use-hivemind-git-memory` |
| **Key Rules** | NEVER implements code directly; NEVER makes architectural decisions; NEVER skips phase transitions; NEVER handles simple delegation (use hiveminder); gatekeeper validation mandatory between phases; recovery points at every transition; cascading failure protocol: >50% parallel agents fail → STOP ALL; can dispatch to ALL agents including self |

---

### 12. `explore.md` — Repository Investigator (variant)

| Field | Value |
|-------|-------|
| **Role** | Terminal repository investigator — read-only codebase research, evidence collection, and synthesis (identical role to `hivexplorer.md`) |
| **Mode** | `subagent` |
| **Tools** | `write: false`, `edit: false`, `bash: *`, `task: * (deny)`, `webfetch: deny` |
| **Skills** | `use-hivemind`, `use-hivemind-context-integrity`, `hivemind-codemap`, `research-delegation`, `hivemind-research-tools`, `use-hivemind-git-memory` |
| **Key Rules** | Identical behavior rules to `hivexplorer.md`; terminal agent, no delegation, read-only; max 3 skill stack |

---

### 13. `general.md` — Repository Investigator (variant with write)

| Field | Value |
|-------|-------|
| **Role** | Terminal repository investigator — read-only codebase research (same description as hivexplorer/explore, but with write permissions enabled) |
| **Mode** | `subagent` |
| **Tools** | `write: true`, `edit: false`, `bash: *`, `task: * (deny)`, `webfetch: allow`, `webbrowse: allow`, `todoread/todowrite` |
| **Skills** | `use-hivemind`, `use-hivemind-context-integrity`, `hivemind-codemap`, `research-delegation`, `hivemind-research-tools`, `use-hivemind-git-memory` |
| **Key Rules** | Despite "read-only" description, has `write: true` permission; write restricted to `*.json`, `*.md`, `.opencode/`, `.hivemind/`; terminal agent, no delegation; same evidence discipline as hivexplorer |

---

## Architecture Summary

**Orchestration hierarchy:**
```
hiveminder (primary orchestrator)
  ├─ handoff (complex 3+ phase workflows)
  ├─ architect (design decisions)
  ├─ hiveplanner (task planning)
  ├─ hivemaker (code implementation)
  ├─ hiveq (verification)
  ├─ code-skeptic (critical review)
  ├─ hivehealer (debugging/remediation)
  ├─ hitea (test infrastructure)
  ├─ hivexplorer (codebase investigation — terminal)
  ├─ hiverd (external research — terminal)
  ├─ explore (codebase investigation — terminal, variant)
  └─ general (codebase investigation — terminal, variant with write)
```

**Terminal agents** (no delegation): `hivexplorer`, `hiverd`, `explore`, `general`
**Execution agents** (write code): `hivemaker`, `hitea`, `hivehealer`
**Design/review agents** (limited writes): `architect`, `code-skeptic`, `hiveplanner`
**Verification agents** (read-only): `hiveq`
**Orchestration agents**: `hiveminder` (primary), `handoff` (complex workflows)