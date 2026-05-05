---
phase: HER-0-ecosystem-remap-audit
plan: 05
type: execute
wave: 2
depends_on: ["HER-0-01"]
files_modified:
  - .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-verify.md
autonomous: true
requirements: [HER-0-D]

must_haves:
  truths:
    - "Every tool registration in plugin.ts is verified against the OpenCode SDK tool() API"
    - "Every hook registration is verified against the OpenCode SDK hook() API"
    - "Unverified SDK claims (session.error, session.deleted, sendPromptAsync) are explicitly flagged"
  artifacts:
    - path: ".planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-verify.md"
      provides: "SDK integration verification with evidence levels and citations"
      min_lines: 200
      contains: "VERIFIED"
  key_links:
    - from: "lane-d-runtime-verify.md"
      to: "src/plugin.ts"
      via: "tool/hook registrations"
      pattern: "plugin\\.ts"
    - from: "lane-d-runtime-verify.md"
      to: "Context7 /websites/opencode_ai_plugins"
      via: "SDK documentation verification"
      pattern: "Context7"
---

<objective>
Verify OpenCode SDK integration claims at standard depth — spot-check representative sample of tool/hook registrations, escalate to deep verification if drift is detected.

Purpose: The RESEARCH.md identified 4 critical gaps (session.error, session.deleted, sendPromptAsync, experimental.session.compacting). This plan resolves them and verifies the rest of the SDK integration.

Output: lane-d-runtime-verify.md
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-RESEARCH.md
@src/plugin.ts
@src/hooks/types.ts

<interfaces>
<!-- RESEARCH.md Section: OpenCode Runtime Integration -->
Verified API surfaces (from Context7 on 2026-05-05):
- Plugin type: `export const MyPlugin: Plugin = async (ctx) => { return { ... } }`
- tool() helper: `tool({ description, args: Zod schema, execute: async (args, context) => {} })`
- tool.schema: Zod-based schema helpers
- session.idle event: `event.type === "session.idle"`
- event hook: `event: async ({ event }) => { ... }`
- experimental.session.compacting: `output.context.push(...)` or `output.prompt = "..."`
- tool.execute.before/after hooks

Critical gaps to resolve:
1. session.error — used in plugin.ts lines 79-87 but NOT in Context7 docs
2. session.deleted — same location, NOT in Context7 docs
3. sendPromptAsync — used in session-api.ts but NOT in official plugin docs
4. experimental.session.compacting — may have changed since implementation

Source files to verify:
- src/plugin.ts — 16 tool registrations, CQRS hook wiring
- src/hooks/ (8 files) — create-core-hooks.ts, create-session-hooks.ts, etc.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Verify tool/hook registrations against OpenCode SDK</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-verify.md
  </files>
  <action>
Standard-depth verification of SDK integration. For each tool and hook registration in src/plugin.ts:

**Tools (16 registrations per RESEARCH):**
1. Extract each `tool({ ... })` call from plugin.ts
2. For a representative sample (6-8 tools = ~40%), verify against Context7 or OpenCode docs:
   - tool() signature matches SDK spec
   - Zod schema args match SDK expectations
   - execute handler signature matches
3. Tag each: VERIFIED (SDK docs confirm), UNVERIFIED (no docs found), DRIFT (API changed)

**Hooks (event observers):**
1. Extract each hook from src/hooks/create-core-hooks.ts, create-session-hooks.ts, etc.
2. Verify hook type against SDK (tool.execute.before, tool.execute.after, event, experimental.session.compacting)
3. For session.idle handling: verify event type string matches SDK

**Critical Gap Resolution:**
For the 4 known gaps (session.error, session.deleted, sendPromptAsync, experimental.session.compacting):
1. Search the OpenCode GitHub repo using `github_search_code` for "session.error" and "session.deleted"
2. Check if these are official event types or harness-internal transforms
3. For sendPromptAsync: check if it's in the OpenCode SDK package exports
4. Document findings with evidence level and source URL

Output format:
```
## Tool Registration Verification
| Tool | Registration Line | Signature Match | Status | Evidence |

## Hook Registration Verification
| Hook | Registration Line | Event Type | Status | Evidence |

## Critical Gap Resolution
| Gap | Finding | Evidence Level | Source URL |
```

Write output to `map/lane-d-runtime-verify.md`. Target: 200-400 lines.
  </action>
  <verify>
    <automated>grep -c 'VERIFIED\|UNVERIFIED\|DRIFT' .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-verify.md | grep -qv '0' && echo "PASS: Lane D has status tags" || echo "FAIL: no status tags"</automated>
  </verify>
  <done>
All tool/hook registrations spot-checked against SDK. Critical gaps resolved (session.error, session.deleted, sendPromptAsync). Evidence citations included.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Assess SDK drift risk and escalation need</name>
  <files>
    .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-verify.md
  </files>
  <action>
Based on Task 1 findings, produce a drift risk assessment:

1. **Count statuses:** How many VERIFIED vs UNVERIFIED vs DRIFT?
2. **If DRIFT count > 0:** Escalate flag — SDK may have breaking changes that need immediate attention in HER-1+
3. **If UNVERIFIED count > 50%:** Note that standard depth was insufficient — recommend deep verification in a follow-up
4. **Compatibility matrix:** For each verified API surface, note the OpenCode version (if determinable from docs)

Append to lane-d-runtime-verify.md:
```
## Drift Risk Assessment
- VERIFIED: N/N tools, N/N hooks
- UNVERIFIED: N (list)
- DRIFT: N (list — HIGH PRIORITY for HER-1+)
- Overall risk: LOW / MEDIUM / HIGH
- Escalation needed: YES/NO
- Recommended depth for follow-up: standard / deep
```
  </action>
  <verify>
    <automated>grep -c 'Drift Risk Assessment' .planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/map/lane-d-runtime-verify.md | grep -qv '0' && echo "PASS: Risk assessment section present" || echo "FAIL: missing risk assessment"</automated>
  </verify>
  <done>
Drift risk assessment complete. Escalation flag set if any DRIFT found. Recommended follow-up depth specified.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Context7/docs → Lane D | External documentation may be stale (MEDIUM risk per RESEARCH A2) |
| GitHub search → Lane D | Code search results may not reflect latest release |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-HER0-05 | I | SDK doc accuracy | mitigate | Cross-reference Context7 with GitHub source search; flag unverifiable claims |
</threat_model>

<verification>
- lane-d-runtime-verify.md covers all 16 tool registrations
- All 4 critical gaps have findings
- Drift risk assessment section exists
</verification>

<success_criteria>
- Representative sample of tool registrations verified against SDK
- Critical gaps (session.error, session.deleted, sendPromptAsync) have documented findings
- Risk assessment with escalation flag
</success_criteria>

<output>
After completion, create `.planning/workstreams/harness-ecosystem-recovery/phases/HER-0-ecosystem-remap-audit/HER-0-05-SUMMARY.md`
</output>
