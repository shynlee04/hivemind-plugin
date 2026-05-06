---
phase: 52-end-user-harness-workflow-acceptance
artifact: runtime-evidence-handoff
created: 2026-04-28T13:19:11Z
status: human_needed
source_phases:
  - 49-uat-tool-contract-and-pty-command-reliability
  - 50-opencode-primitive-restart-readiness
  - 51-stack-research-synthesis-skill-runtime-grounding
evidence_gate_verdict: fail_for_release_acceptance_until_l1_l2_runtime_proof_exists
automated_regression:
  focused_tests: "PASS — 9 files, 246 tests"
  typecheck: "PASS — tsc --noEmit"
  validate_restart_tool: "PASS — agents=58, commands=18, skills=49"
human_verification:
  - test: "Run a real orchestrator-led workflow through the production OpenCode harness surface"
    expected: "Delegation ID is created, subagent work completes, status polling returns terminal state, lineage/journal export contains the run"
    why_human: "Requires live parent/child OpenCode runtime and provider/session behavior; unit tests and docs are not sufficient"
  - test: "Interrupt and recover the workflow from persisted .hivemind state"
    expected: "Continuation resumes without false completion or lost task state"
    why_human: "Requires real interruption/resume behavior and state inspection from a live session"
  - test: "Exercise stack/research guidance in an end-user workflow"
    expected: "Relevant stack/research skills route to implementation guidance, synthesis handoff, and evidence gates without stale assumptions"
    why_human: "Phase 51 proved loader/discovery and mapping, not actual user-facing guidance quality"
gaps:
  - truth: "Release/acceptance evidence proves the full harness workflow end-to-end"
    status: partial
    reason: "Current evidence is mostly L4 tests plus L5 planning artifacts; no fresh L1/L2 parent-child runtime continuity proof was captured in this verifier pass"
    artifacts:
      - path: "session-ses_22ee.md"
        issue: "Contains user-facing UAT observations but also reported defects and did not close a complete lifecycle end-to-end"
      - path: ".planning/workstreams/milestone/phases/49-uat-tool-contract-and-pty-command-reliability/49-VERIFICATION-2026-04-28.md"
        issue: "Explicitly states live external OpenCode/provider runtime proof remains partial"
      - path: ".planning/workstreams/milestone/phases/51-stack-research-synthesis-skill-runtime-grounding/51-GROUNDING-MAP-2026-04-28.md"
        issue: "Explicitly states Phase 51 is local grounding evidence and does not claim provider-backed live session completion"
    missing:
      - "L1 live OpenCode run for delegate-task → delegation-status → run-background-command → session-journal-export"
      - "L2 persisted .hivemind continuity/lineage record from that same real run"
      - "Acceptance transcript distinguishing pass, partial, failed, and externally-blocked runtime behavior"
deferred:
  - truth: "Full end-user production harness acceptance"
    addressed_in: "Phase 52"
    evidence: "ROADMAP Phase 52 goal: Real users can complete production-ready Hivemind/OpenCode harness workflows end-to-end through orchestrator, subagent, tool, journal, and restart surfaces."
---

# Phase 52 Runtime Evidence Handoff

**Verified:** 2026-04-28T13:19:11Z  
**Verifier:** gsd-verifier  
**Status:** `human_needed` for acceptance; automated regression checks pass.  
**Evidence stance:** Do not treat Phase 49–51 artifacts as release/acceptance proof. They are implementation and local-readiness evidence that must feed Phase 52 live workflow validation.

## Goal-Backward Verification Frame

Phase 52 must prove the outcome stated in the roadmap:

> Real users can complete production-ready Hivemind/OpenCode harness workflows end-to-end through orchestrator, subagent, tool, journal, and restart surfaces.

For that to be true, the following must be observable in a real OpenCode runtime:

1. A parent/orchestrator starts a workflow and delegates to a specialist.
2. The child/subagent completes work and exposes a terminal status through `delegation-status`.
3. `run-background-command` supports a real command lifecycle: run, output, input when applicable, list, terminate.
4. `session-journal-export` exports lineage/journal evidence for the same workflow without silently relabeling filters.
5. `configure-primitive` and `validate-restart` support primitive readiness without corrupting `.opencode/`/`.hivemind/` boundaries.
6. Recovery after interruption resumes from persisted `.hivemind/` state without false completion.

## Evidence Catalog

| Claim / Surface | Evidence Found | Level | Verdict |
|---|---|---:|---|
| Phase 49 tool contracts have targeted regression coverage | Fresh focused command: `npx vitest run tests/tools/run-background-command.test.ts tests/tools/prompt-skim.test.ts tests/tools/prompt-analyze.test.ts tests/tools/session-journal-export.test.ts tests/tools/configure-primitive.test.ts tests/tools/validate-restart.test.ts tests/lib/runtime-validator.test.ts tests/lib/cross-primitive-validator.test.ts tests/schema-kernel/opencode-config.schemas.test.ts` → 9 files, 246 tests passed | L4 | Verified as unit/tool regression evidence |
| TypeScript project is type-clean for checked surfaces | Fresh `npm run typecheck` → `tsc --noEmit` completed with no errors | L4 | Verified |
| Active primitives are restart-valid under the project validator | Fresh `validate-restart` tool call → `Restart validation passed`, `agents: 58`, `commands: 18`, `skills: 49` | L1 for tool invocation; L4 for underlying validator coverage | Verified for validator tool surface; not proof of a real OpenCode app restart |
| Harness plugin registers the relevant tools | `src/plugin.ts` imports/registers `delegate-task`, `delegation-status`, `run-background-command`, `session-journal-export`, `configure-primitive`, `validate-restart` | L5 structural inspection | Useful context only; not runtime proof |
| `run-background-command` action contract rejects misleading `start/read` names and documents supported actions | `src/tools/run-background-command.ts` supports `run`, `output`, `input`, `list`, `terminate`; guidance says use `run` instead of `start` and `output` instead of `read` | L5 structural inspection + L4 tests | Verified at local regression level |
| Journal export has filter semantics separate from labels | `src/tools/session-journal-export.ts` filters lineage by `pipelineKey` or `planId` and applies `pipelineKeyLabel` separately | L5 structural inspection + L4 tests | Verified at local regression level |
| Phase 51 stack/research grounding exists | `51-GROUNDING-MAP-2026-04-28.md` maps stack/research skills to workflows and gates | L5 | Context only; not user-facing workflow proof |
| End-to-end orchestrator/subagent workflow works in production runtime | No fresh L1/L2 parent-child runtime transcript or continuity record was produced in this pass | None | Not verified; Phase 52 must prove |

## Gap Table

| Gap | Severity | Evidence | Required Closure |
|---|---|---|---|
| No L1/L2 proof for full parent → subagent → tool → journal lifecycle | BLOCKER for release/acceptance, not for starting Phase 52 | Phase 49 verification explicitly says live external OpenCode/provider runtime proof remains partial; Phase 51 grounding map says provider-backed live session completion is not claimed | Run and archive a real OpenCode workflow transcript plus `.hivemind` continuity/lineage record |
| Phase 51 proves loader/discovery and routing map, not actual guidance quality | WARNING | Grounding map exists; no end-user stack/research request was exercised here | Include one stack/research-guidance acceptance scenario in Phase 52 |
| Permission value readability can regress if object-shaped permissions reach runtime validator | WARNING | `agent-frontmatter.schema.ts` and `config-precedence.schema.ts` still allow `z.unknown()` permission values; runtime validator interpolates permission values in messages | Add Phase 52 scenario or follow-up test with object-shaped permission values and assert readable diagnostics |
| Prior UAT observations included tool UX defects and partial lifecycle closure | WARNING | `session-ses_22ee.md` documents original user-facing observations and defects | Retest the same user-visible cases through current tools rather than relying on the historical transcript |

## Regression Risks

1. **Evidence-level inflation:** Passing focused tests can be mistaken for live harness proof. Per evidence-gate rules, mock/local tests are L4 unless they hit real runtime boundaries.
2. **Structural proof trap:** Plugin registration and file inspection show that surfaces exist, but do not prove behavior under OpenCode sessions.
3. **Permission diagnostics:** Broad permission schemas may still allow non-string values that produce unclear diagnostics if not normalized before runtime validation.
4. **Workflow fragmentation:** Individual tools can pass while the composed user workflow fails at state handoff, status polling, or journal export.

## Required Phase 52 Acceptance Commands / Actions

These should be run as real user-facing acceptance scenarios, not just source inspection:

1. **Delegation lifecycle**
   - Invoke `delegate-task` from a parent session.
   - Poll with `delegation-status` until terminal.
   - Capture delegation ID, child session ID, terminal status, result metadata.

2. **PTY lifecycle**
   - Invoke `run-background-command` with `action: "run"`, executable + args.
   - Read first output with `action: "output"`.
   - Use `action: "list"`.
   - Terminate with `action: "terminate"`.

3. **Lineage export**
   - Invoke `session-journal-export` for the same session/workflow.
   - Confirm filter semantics select existing lineage rather than relabeling unrelated records.

4. **Primitive readiness**
   - Use `configure-primitive` in dry-run and read/list/inspect modes.
   - Run `validate-restart` afterward.
   - Confirm `.opencode/` remains primitives-only and runtime state remains under `.hivemind/`.

5. **Recovery**
   - Interrupt the workflow after delegation or command start.
   - Resume from persisted `.hivemind` state.
   - Confirm no false completion and no lost context.

## Bottom Line

Automated checks are green for the targeted surfaces:

- Focused tests: **PASS** — 9 files, 246 tests.
- Typecheck: **PASS**.
- Live `validate-restart` tool invocation: **PASS** — 58 agents, 18 commands, 49 skills.

However, the acceptance goal is not proven until Phase 52 captures live end-to-end OpenCode runtime evidence. Phase 52 should proceed, but it must not inherit a false `passed` status from Phase 49–51 summaries.

---

_Verified: 2026-04-28T13:19:11Z_  
_Verifier: gsd-verifier_
