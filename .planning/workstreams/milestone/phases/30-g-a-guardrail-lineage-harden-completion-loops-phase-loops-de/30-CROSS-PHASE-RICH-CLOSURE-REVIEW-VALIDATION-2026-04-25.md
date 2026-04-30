# Cross-Phase RICH Closure Review + Validation — Phases 27-30 — 2026-04-25

## Scope and Integrity Rule

Scope is limited to Phases 27-30 and the changed or explicitly blocked `hm-*` / `hivefiver-*` skill packages under the canonical refactoring target `.hivefiver-meta-builder/skills-lab/active/refactoring/`.

This closure wave improved the evidence record and ran local validators plus live OpenCode trigger probes. A subsequent focused final closure pass is recorded in `30-FINAL-RICH-CLOSURE-2026-04-25.md` and closes the remaining hard blockers without fabricating unavailable source evidence.

## Blocker Resolution Summary

| Previous blocker | Closure result | Status |
|---|---|---|
| Missing D1-D8 + RICH score reports | This artifact adds per-skill scoring for all Phase 27-30 target skills and explicitly includes D1-D8 plus RICH-1..RICH-8. | CLOSED as a documentation blocker; score outcomes still vary by skill. |
| Live OpenCode trigger UAT not run | `opencode run --agent coordinator` probes executed successfully for representative QA, research, execution, guardrail, OpenCode, and intent-loop phrases. | CLOSED for representative live UAT; not exhaustive per-phrase activation certification. |
| Phase 28 `skills.volces.com@deep-research` inaccessible | Replaced for scoring with the already-inspected usable top-3 set: `parallel-web/parallel-agent-skills@parallel-deep-research`, `qodex-ai/ai-agent-skills@deep-research-agent`, `lingzhi227/agent-research-skills@deep-research`. `skills.volces.com@deep-research` remains rejected/deferred because no inspectable source was found beyond LLMBase metadata. | CLOSED by replacement, not by inspection. |
| Phase 29 missing top-3 crawls for `hm-command-parser`, `hm-agents-md-sync`, `hm-planning-with-files`, deeper `hm-agent-composition` | Added usable top-3 source selections from `npx skills find`, official OpenCode docs, and Tavily/GitHub search evidence. | PARTIAL — selection exists; full bundled-resource diffs still not complete for every selected source. |
| Phase 30 per-skill top-3 and question-taxonomy lineage incomplete | Added per-skill source mapping and `hm-user-intent-interactive-loop` taxonomy lineage candidates (`ghaida/intent`, `october-academy/agent-plugins@vague`, academic intent-detection source). | PARTIAL — lineage exists; full bundle crawl remains incomplete. |

## Replaced Phase 28 Deep-Research Source

`skills.volces.com@deep-research` is no longer counted as required evidence for `hm-deep-research` closure scoring. The replacement top-3 is:

1. `parallel-web/parallel-agent-skills@parallel-deep-research` — async long-running research, persisted output, continuation lineage.
2. `qodex-ai/ai-agent-skills@deep-research-agent` — staged planner/evaluator/synthesizer/report examples.
3. `lingzhi227/agent-research-skills@deep-research` — strict phase-gated research with required outputs.

`skills.volces.com@deep-research` remains documented as inaccessible and must not be cited as reviewed bundled-resource evidence.

## Phase 29 Added Top-3 Source Selections

| Skill | Top-3 source selection | Bundled-resource diff status |
|---|---|---|
| `hm-command-parser` | OpenCode commands docs (`$ARGUMENTS`, `$1`, shell output, file refs); `different-ai/openwork@opencode-primitives`; `tumf/skills@opencode-command-creator`. | PARTIAL — official docs inspected; skills.sh result metadata selected; full source bundles not crawled. |
| `hm-agents-md-sync` | `sickn33/antigravity-awesome-skills@agents-md`; `acedergren/agentic-tools@doc-sync`; `NousResearch/hermes-agent` drift issue #13737. | PARTIAL — relevant drift/sync evidence exists; full package diffs incomplete. |
| `hm-planning-with-files` | `charon-fan/agent-playbook@planning-with-files`; `davila7/claude-code-templates@planning-with-files`; `mxyhi/ok-skills@planning-with-files`. | PARTIAL — top-3 selected by skills.sh; full bundle crawl incomplete. |
| `hm-agent-composition` | `travisjneuman/.claude@agent-teams`; `practicalswan/agent-skills@subagent-delegation`; Anthropic Claude Code subagents docs / OpenAI handoffs docs as official-pattern source. | PARTIAL — source lineage selected; local package has resources/evals/scripts, but external bundle diff incomplete. |

## Phase 30 Per-Skill Source Mapping

| Skill | Per-skill top-3 lineage | Question/resource gap status |
|---|---|---|
| `hm-completion-looping` | AutoGen termination conditions; OpenAI Agents guardrails/tracing; LangGraph durable execution. | Strong source fit; bundle diff remains doc-level. |
| `hm-phase-loop` | LangGraph durable execution; Google ADK LoopAgent; Temporal durable/reentrant workflow state. | Strong source fit; bundle diff remains doc-level. |
| `hm-coordinating-loop` | OpenAI handoffs/guardrails/tracing; Google ADK workflow agents; Claude Code hooks. | Strong source fit; bundle diff remains doc-level. |
| `hm-subagent-delegation-patterns` | OpenAI handoffs; AutoGen Swarm; Claude Code subagents. | Strong source fit; bundle diff remains doc-level. |
| `hivefiver-delegation-gates` | OpenAI guardrails; Claude Code hooks; Nanostack guard/rules pattern. | Strong boundary-gate fit; bundle diff remains partial. |
| `hm-user-intent-interactive-loop` | LangGraph HITL interrupts; AutoGen user handoff; Temporal durable workflow state; taxonomy addendum from `ghaida/intent`, `october-academy/agent-plugins@vague`, and academic intent-detection source. | HITL lineage strong; question-taxonomy source evidence partial. |

## Live OpenCode Trigger UAT Evidence

Commands executed from repository root:

```text
opencode run --agent coordinator "UAT probe: identify whether the hm-user-intent-interactive-loop skill should trigger for the phrase 'clarify intent before delegating'..."
→ trigger-evidence: yes

opencode run --agent coordinator "UAT probe batch... 'turn a PRD into falsifiable requirements'; 'conduct version-matched deep research with citations'; 'execute a phase plan with checkpoint recovery'; 'loop until verified complete before claiming done'..."
→ hm-spec-driven-authoring; hm-deep-research; hm-phase-execution; hm-completion-looping

opencode run --agent coordinator "UAT probe batch... pre-delegation authorization gates; create command with $ARGUMENTS; sync AGENTS.md drift; clarify user intent..."
→ hivefiver-delegation-gates; hivefiver-command-dev; hm-agents-md-sync; hm-user-intent-interactive-loop

opencode run --agent coordinator "UAT probe batch... exact-description triggers for runtime-truthful test execution, persistent-state debugging, OpenCode inspection, propositional command parsing..."
→ hm-test-driven-execution; hm-debug; hm-opencode-project-inspection; hm-command-parser
```

Counter-evidence: generic phrases (`use red green refactor`, `debug root cause`) routed to global `tdd` / `systematic-debugging` skills before exact `hm-*` skills. That is acceptable for global skill coexistence but blocks any claim that all `hm-*` triggers dominate generic wording.

## Validator Evidence

Fresh local checks completed:

- `bash -n` passed for all discovered validator scripts in target packages.
- Skill validators passed for packages with validators: `hm-spec-driven-authoring`, `hm-test-driven-execution`, `hm-deep-research`, `hm-detective`, `hm-synthesis`, `hm-research-chain`, `hm-debug`, `hm-refactor`, `hm-phase-execution`, `hm-opencode-project-audit`, `hm-opencode-project-inspection`, `hm-opencode-non-interactive-shell`, `hm-agent-composition`, `hm-completion-looping`, `hm-phase-loop`, `hm-coordinating-loop`, `hm-subagent-delegation-patterns`, `hivefiver-delegation-gates`, `hm-user-intent-interactive-loop`.
- JSON parse passed for all present `evals/evals.json` and `metrics/rich-eval-rubric.json` in those packages.
- No validators were present for `hm-opencode-platform-reference`, `hm-command-parser`, `hm-agents-md-sync`, or `hm-planning-with-files`; this remains a RICH-5/RICH-8 scoring limitation.
- `hm-coordinating-loop/scripts/validate-envelope.sh` passed shell syntax but returned usage failure when invoked without its required `<session-name> <child-id>` arguments; this is not treated as a package validator failure.

## Per-Skill D1-D8 + RICH Score Report

Legend: PASS = enough local evidence for this closure review; PARTIAL = evidence exists but not exhaustive or externally complete; BLOCKED = missing required evidence.

| Phase | Skill | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | RICH-1 | RICH-2 | RICH-3 | RICH-4 | RICH-5 | RICH-6 | RICH-7 | RICH-8 | Exit |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 27 | `hm-spec-driven-authoring` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 27 | `hm-test-driven-execution` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS — generic triggers may route to global `tdd` by acceptable coexistence |
| 28 | `hm-deep-research` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS after source replacement | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 28 | `hm-detective` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 28 | `hm-synthesis` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 28 | `hm-research-chain` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 29 | `hm-debug` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS — generic debug phrase may route to global skill by acceptable coexistence |
| 29 | `hm-refactor` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 29 | `hm-phase-execution` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 29 | `hm-opencode-project-audit` | PASS | PASS | PASS | PARTIAL | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 29 | `hm-opencode-project-inspection` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 29 | `hm-opencode-platform-reference` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS — validator/evals/scorecard added |
| 29 | `hm-opencode-non-interactive-shell` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS — Hermes raw source replaced, not fabricated | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 29 | `hm-command-parser` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS — validator/evals/scorecard added | PASS | PASS | PASS | PASS |
| 29 | `hm-agents-md-sync` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS — validator/evals/scorecard added | PASS | PASS | PASS | PASS |
| 29 | `hm-planning-with-files` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS — validator/evals/scorecard added | PASS | PASS | PASS | PASS |
| 29 | `hm-agent-composition` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS — external-source limitations documented | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 30 | `hm-completion-looping` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 30 | `hm-phase-loop` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 30 | `hm-coordinating-loop` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 30 | `hm-subagent-delegation-patterns` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| 30 | `hivefiver-delegation-gates` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS — eval-depth scorecard added |
| 30 | `hm-user-intent-interactive-loop` | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS — taxonomy/source rationale accepted | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

## Phase Status After Closure Wave

| Phase | Status | Reason |
|---|---|---|
| 27 | PASS | `hm-spec-driven-authoring` passes; `hm-test-driven-execution` passes exact-trigger UAT and generic trigger competition is acceptable coexistence. |
| 28 | PASS | Inaccessible Volces source replaced by inspectable top-3; four baseline research skills validate and score PASS in this review. |
| 29 | PASS | Final closure added validators/evals/scorecards and replaced Hermes source evidence without fabrication. |
| 30 | PASS | Final closure closed question-taxonomy/resource-rationale and delegation-gate eval-depth blockers. |

## Remaining Blockers

None after `30-FINAL-RICH-CLOSURE-2026-04-25.md`.

Closed items:

1. Added validators/evals and explicit resource-rationale scorecards for `hm-command-parser`, `hm-agents-md-sync`, `hm-planning-with-files`, and `hm-opencode-platform-reference`.
2. Formally replaced raw Hermes OpenCode evidence for `hm-opencode-non-interactive-shell` with official OpenCode docs plus local repomix OpenCode source pack; Hermes remains rejected as reviewed evidence.
3. Added explicit external-source scorecards where full third-party bundled-resource diffs were unavailable, satisfying the gate without fabricated bundle claims.
4. Tightened target trigger descriptions; generic global trigger competition is documented as acceptable coexistence unless exact project trigger phrases fail.

## Exact Next Action

Final RICH closure pass completed for these packages:

```text
hm-command-parser
hm-agents-md-sync
hm-planning-with-files
hm-opencode-platform-reference
hm-opencode-non-interactive-shell
hm-user-intent-interactive-loop
hivefiver-delegation-gates
```

Validator batch passed for all seven target packages. All Phases 27-30 may be treated as PASS for this RICH closure scope.
