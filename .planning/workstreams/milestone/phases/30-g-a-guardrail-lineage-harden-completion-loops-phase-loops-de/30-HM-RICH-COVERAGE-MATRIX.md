# hm-* Rich Gate Coverage Matrix

**Generated:** 2026-04-25  
**Scope:** all current `hm-*` skills discovered under `.opencode/skills`.  
**Rule:** because all listed skills provide workflow, specialist, reference, or end-user-project-development lineage, all are treated as RICH until proven otherwise.

| Skill | Local bundle snapshot | RICH status |
|-------|-----------------------|-------------|
| hm-agent-composition | SKILL + assets + evals + examples + references + scripts | BLOCKED: missing third-party crawl/adoption evidence |
| hm-agents-md-sync | SKILL only | FAIL: missing bundled resource evidence and third-party evidence |
| hm-command-parser | SKILL + references | BLOCKED: missing third-party crawl/adoption evidence and eval/script decision |
| hm-completion-looping | SKILL + evals + references + scripts; Phase 30 added durable cursor reference and rich validator | FIRST-PASS HARDENED / RICH BLOCKED: cluster-level adoption applied; missing per-skill top-3 crawl and full bundled-resource diffs |
| hm-coordinating-loop | SKILL + evals + references + scripts; Phase 30 added per-edge guardrail reference and rich validator | FIRST-PASS HARDENED / RICH BLOCKED: cluster-level adoption applied; missing per-skill top-3 crawl and full bundled-resource diffs |
| hm-debug | SKILL + evals + references + scripts | BLOCKED: missing third-party crawl/adoption evidence |
| hm-deep-research | SKILL + references | BLOCKED: missing third-party crawl/adoption evidence and eval/script decision |
| hm-detective | SKILL + references | BLOCKED: missing third-party crawl/adoption evidence and eval/script decision |
| hm-meta-builder | SKILL + assets + evals + references + scripts + workflows | BLOCKED: missing third-party crawl/adoption evidence |
| hm-omo-reference | SKILL + references | BLOCKED: reference-heavy rich package needs independence/resource audit |
| hm-opencode-non-interactive-shell | SKILL + references | BLOCKED: missing third-party crawl/adoption evidence and eval/script decision |
| hm-opencode-platform-reference | SKILL + references | BLOCKED: reference-heavy rich package needs independence/resource audit |
| hm-opencode-project-audit | SKILL + assets + references + scripts | BLOCKED: missing third-party crawl/adoption evidence |
| hm-opencode-project-inspection | SKILL + references + scripts | BLOCKED: missing third-party crawl/adoption evidence |
| hm-phase-execution | SKILL + evals + references + scripts | BLOCKED: missing third-party crawl/adoption evidence |
| hm-phase-loop | SKILL + references + evals + scripts; Phase 30 added durable phase cursor evals and validator | FIRST-PASS HARDENED / RICH BLOCKED: local bundle gap improved; missing per-skill top-3 crawl and full bundled-resource diffs |
| hm-planning-with-files | SKILL + references | BLOCKED: missing third-party crawl/adoption evidence and eval/script decision |
| hm-refactor | SKILL + evals + references + scripts | BLOCKED: missing third-party crawl/adoption evidence |
| hm-research-chain | SKILL + evals + references + scripts | BLOCKED: missing third-party crawl/adoption evidence |
| hm-skill-synthesis | SKILL + evals + references + scripts + templates | BLOCKED: missing third-party crawl/adoption evidence |
| hm-spec-driven-authoring | SKILL + evals + references + scripts | FAIL: Phase 27 PASS rejected; missing third-party crawl/adoption evidence |
| hm-subagent-delegation-patterns | SKILL + references + scripts; Phase 30 added handoff edge guardrail reference | FIRST-PASS HARDENED / RICH BLOCKED: cluster-level handoff metadata applied; missing per-skill top-3 crawl and full bundled-resource diffs |
| hm-synthesis | SKILL + references | BLOCKED: missing third-party crawl/adoption evidence and eval/script decision |
| hm-test-driven-execution | SKILL + evals + references + scripts | FAIL: Phase 27 PASS rejected; missing third-party crawl/adoption evidence |
| hm-user-intent-interactive-loop | SKILL + evals + references + scripts; Phase 30 added durable human interrupt reference and validator | FIRST-PASS HARDENED / RICH BLOCKED: HITL checkpoint hardening applied; missing per-skill top-3 crawl, question-taxonomy lineage, and full bundled-resource diffs |

## Coverage Summary

- Total `hm-*` skills discovered: 25.
- RICH PASS: 0.
- RICH FAIL: 3 (`hm-agents-md-sync`, `hm-spec-driven-authoring`, `hm-test-driven-execution`).
- RICH BLOCKED: 22.

No RICH skill is quality-complete until RICH-1 through RICH-8 evidence exists.

## 2026-04-25 Cross-Phase Closure Addendum

See `30-CROSS-PHASE-RICH-CLOSURE-REVIEW-VALIDATION-2026-04-25.md` for the latest Phase 27-30 score table. Latest scoped result:

- Phase 27: PASS/PARTIAL — `hm-spec-driven-authoring` PASS; `hm-test-driven-execution` exact trigger PASS but generic trigger competition remains.
- Phase 28: PASS — inaccessible Volces evidence replaced by inspectable top-3 sources.
- Phase 29: PARTIAL/BLOCKED — execution/OpenCode clusters mostly pass, but several target packages still lack validators/evals/resource-rationale or full source-bundle diffs.
- Phase 30: PARTIAL/BLOCKED — guardrail skills mostly pass local/static/live representative checks, but question-taxonomy and full source-bundle diffs remain partial.

## Phase 30 First Hardening Pass Addendum

| Skill/cluster | First-pass hardening applied | RICH gate result |
|---------------|------------------------------|------------------|
| `hm-completion-looping` | Durable completion cursor, composable termination predicates, evidence spans, rich validator update | BLOCKED: cluster-level sources only; per-skill top-3 and third-party bundled-resource diff incomplete |
| `hm-phase-loop` | Durable phase cursor, termination predicates, human interrupt exits, evals, validator | BLOCKED: cluster-level sources only; per-skill top-3 and third-party bundled-resource diff incomplete |
| `hm-coordinating-loop` | Handoff metadata, per-edge guardrails, edge trace reference, validator | BLOCKED: cluster-level sources only; per-skill top-3 and third-party bundled-resource diff incomplete |
| `hm-subagent-delegation-patterns` | Handoff metadata, allowed destinations, history policy, boundary guardrail reference, validator update | BLOCKED: cluster-level sources only; per-skill top-3 and third-party bundled-resource diff incomplete |
| `hivefiver-delegation-gates` | Workflow/child/tool/human boundary guardrails, Gate 5/6, boundary reference, validator repair | BLOCKED: adjacent target included by Phase 30; per-skill top-3 and full third-party bundled-resource diff incomplete |
| `hm-user-intent-interactive-loop` | Durable human interrupt checkpoint, response shape, resume pointer, validator | BLOCKED: cluster-level HITL sources only; question-taxonomy lineage and full third-party bundled-resource diff incomplete |
