# Phase 28: Rich Third-Party Research for G-C Research Lineage

**Date:** 2026-04-25  
**Phase:** 28-g-c-research-lineage-apply-proven-d1-d8-quality-pattern-to-h  
**Scope:** `hm-deep-research`, `hm-detective`, `hm-synthesis`, `hm-research-chain`; supplemental non-baseline notes for `hm-skill-synthesis` and `hivefiver-context-absorb`.  
**Overall readiness:** PARTIAL — enough evidence to plan targeted updates, not enough to claim RICH PASS.

## 1. Phase 28 Baseline Read

- Phase 28 is explicitly blocked because top-3 third-party repository crawling and bundled-resource review were missing. `[VERIFIED: .planning/phases/28.../28-01-PLAN.md:30-32]`
- The Phase 28 plan targets four skills: `hm-deep-research`, `hm-detective`, `hm-synthesis`, and `hm-research-chain`. `[VERIFIED: .planning/phases/28.../28-01-PLAN.md:7-12]`
- The baseline file marks `hm-deep-research`, `hm-detective`, and `hm-synthesis` as having `SKILL.md` plus references only, and marks `hm-research-chain` as having `SKILL.md`, evals, references, and scripts. `[VERIFIED: .planning/phases/28.../28-RICH-GATE-BASELINE.md:3-8]`
- Local inspection confirmed resource shape: `hm-deep-research`, `hm-detective`, and `hm-synthesis` each contain `SKILL.md` plus `references/`; `hm-research-chain` contains `SKILL.md`, `references/`, `evals/`, and `scripts/`. `[VERIFIED: local directory reads 2026-04-25]`
- Supplemental skills `hm-skill-synthesis` and `hivefiver-context-absorb` are not in the Phase 28 plan target list, but were inspected because the delegation prompt named them as likely related. `[VERIFIED: .planning/phases/28.../28-01-PLAN.md:7-12] [VERIFIED: user delegation prompt 2026-04-25]`

## 2. Local Bundled Resource Inventory

| Skill | Local bundled resources observed | RICH implication |
|---|---|---|
| `hm-deep-research` | `references/brainstorming-shaping.md`, `case-comparison.md`, `edge-cases.md`, `interface-tradeoffs.md`, `requirements-vs-spec.md`, `research-patterns.md` | Strong conceptual reference pack, but no scripts/evals/examples. `[VERIFIED: local directory read]` |
| `hm-detective` | `references/document-pipeline.md`, `reading-modes.md`, `surgical-edits.md`, `swarm-recovery.md`, `tech-registry.md`, `token-budget.md` | Strong mode taxonomy and recovery references, but no evals/scripts/examples. `[VERIFIED: local directory read]` |
| `hm-synthesis` | `references/artifact-export.md`, `compression-tiers.md`, `corpus-gate.md`, `cross-dep-analysis.md`, `interface-extraction.md`, `pattern-classifier.md`, `validated-playbooks.md` | Strong reference pack; corpus-gate and classifier already align with third-party evidence requirements. `[VERIFIED: local directory read]` |
| `hm-research-chain` | `references/chain-stages.md`, `tool-matrix.md`, `evals/evals.json`, `scripts/validate-skill.sh` | Best package shape among baseline skills, but validator currently requires a “6-NON Defence Table” that is absent from `SKILL.md`. `[VERIFIED: local read of validate-skill.sh:13-14 and SKILL.md:1-113]` |
| `hm-skill-synthesis` | `references/01-github-ingestion.md` through `05-template-library.md`, `evals/`, `scripts/`, `templates/` | Richer package shape than the baseline four; useful as an internal exemplar but out of Phase 28 baseline scope unless scope is expanded. `[VERIFIED: local directory read]` |
| `hivefiver-context-absorb` | `references/01-wave-protocol-detail.md`, `02-yaml-merge-operations.md`, `03-xml-body-schema.md`, `04-tool-selection-matrix.md` | Relevant to ingestion/absorption cluster, but not in Phase 28 baseline target list. `[VERIFIED: local directory read]` |

## 3. Third-Party Sources Selected by Domain Cluster

### Cluster A — Deep Research / Evidence Gathering (`hm-deep-research`)

| Rank | Source | Evidence inspected | Relevance | Decision |
|---|---|---|---|---|
| 1 | `parallel-web/parallel-agent-skills@parallel-deep-research` | skills.sh page and GitHub directory listing show a single `SKILL.md`; skill requires explicit deep/exhaustive trigger, starts async `parallel-cli research run`, uses processor tiers, polls to markdown/json files, and preserves `interaction_id` for follow-up chaining. `[CITED: https://skills.sh/parallel-web/parallel-agent-skills/parallel-deep-research] [VERIFIED: GitHub contents API: parallel-web/parallel-agent-skills/skills/parallel-deep-research]` | Strong pattern for async long-running research, output file persistence, and follow-up lineage. | **ADAPT**: add explicit “deep only” trigger boundary and interaction/run-id lineage concept; do not adopt vendor-specific `parallel-cli` dependency. |
| 2 | `qodex-ai/ai-agent-skills@deep-research-agent` | skills.sh page describes six research stages; GitHub directory includes `examples/research_planner.py`, `source_evaluator.py`, `research_synthesizer.py`, and `research_report_generator.py`. `[CITED: https://skills.sh/qodex-ai/ai-agent-skills/deep-research-agent] [VERIFIED: GitHub contents API: qodex-ai/ai-agent-skills/skills/deep-research-agent/examples]` | Strong exemplar for bundled examples beyond `SKILL.md` and source-evaluation/report-generation separation. | **ADOPT/ADAPT**: add lightweight example/templates for planner/evaluator/synthesizer/report generator roles; keep language-agnostic rather than Python-only. |
| 3 | `lingzhi227/agent-research-skills@deep-research` | skills.sh page defines strict six-phase academic review with phase gates, required output files, peer-review priority, paper DB, code repo survey, and final report assembly. `[CITED: https://skills.sh/lingzhi227/agent-research-skills/deep-research]` | Strongest gate discipline and “do not synthesize before deep reading” rule. | **ADAPT**: add phase-gate checklist and required-output verification for deep research tasks; **REJECT** hardcoded local paths and academic-only assumptions for general OpenCode harness use. |
| BLOCKED | `skills.volces.com@deep-research` | skills registry listed it as #2 with 159 installs, but direct skills.sh fetch returned 404; Tavily found only an LLMBase mirror snippet and no directly inspectable source package. `[VERIFIED: npx skills find output 2026-04-25] [VERIFIED: fetch 404 2026-04-25] [VERIFIED: Tavily search 2026-04-25]` | Cannot review bundled resources or SKILL body directly in this session. | **BLOCKED per-skill** until package can be installed/listed or a direct source URL is found. |

### Cluster B — Codebase Detective / Investigation (`hm-detective`)

| Rank | Source | Evidence inspected | Relevance | Decision |
|---|---|---|---|---|
| 1 | `ed3dai/ed3d-plugins@investigating-a-codebase` | skills.sh page defines use cases for verifying design assumptions, finding existing patterns, locating features, and confirming existence; workflow is entry points → multiple search strategies → follow traces → verify → definitive report. `[CITED: https://skills.sh/ed3dai/ed3d-plugins/investigating-a-codebase]` | Closest direct match to `hm-detective`; reinforces assumption verification and “not found” reporting. | **ADOPT**: add explicit design-assumption verification table: confirmed/discrepancy/addition/missing. |
| 2 | `ceedaragents/cyrus@investigate` | skills.sh page defines compact codebase research flow: search, read, gather context, answer; output uses exact code references and concise Linear-compatible markdown. `[CITED: https://skills.sh/ceedaragents/cyrus/investigate]` | Useful for final answer discipline and collapsible detail sections, but less rich than local `hm-detective`. | **ADAPT**: add concise answer-first report pattern; **REJECT** Linear-specific formatting as default. |
| 3 | `sickn33/antigravity-awesome-skills@error-detective` / `@debugger` | skills.sh pages focus on error/log detective and root cause debugging; GitHub contents show `SKILL.md` only for both inspected skill directories. `[CITED: https://skills.sh/sickn33/antigravity-awesome-skills/error-detective] [CITED: https://skills.sh/sickn33/antigravity-awesome-skills/debugger] [VERIFIED: GitHub contents API: sickn33/antigravity-awesome-skills/skills/error-detective and skills/debugger]` | Useful for symptom→cause and evidence-backed hypotheses, but narrower than general codebase detective. | **ADAPT** root-cause hypothesis/evidence format for debugging submode; **DEFER** log-specific regex/query details. |

### Cluster C — Synthesis / Artifact Export (`hm-synthesis`)

| Rank | Source | Evidence inspected | Relevance | Decision |
|---|---|---|---|---|
| 1 | `anthropics/knowledge-work-plugins@research-synthesis` / `product-management/skills/synthesize-research` | skills.sh page for `research-synthesis` provides output template with executive summary, themes, quotes/evidence, insights→opportunities, recommendations, questions, and methodology; GitHub repo contains `product-management/skills/synthesize-research/SKILL.md` as a large source file. `[CITED: https://skills.sh/anthropics/knowledge-work-plugins/research-synthesis] [VERIFIED: GitHub contents API: anthropics/knowledge-work-plugins/product-management/skills/synthesize-research]` | Strong for structured synthesis outputs and methodology limitations. | **ADOPT** output sections for synthesis artifacts: executive summary, evidence-backed themes, recommendations, limitations. |
| 2 | `liangdabiao/claude-code-stock-deep-research-agent@synthesizer` | skills.sh page defines synthesizer role, phases for review/organize, consensus building, contradiction resolution, structured synthesis, quality enhancement, and quality scoring dimensions. `[CITED: https://skills.sh/liangdabiao/claude-code-stock-deep-research-agent/synthesizer]` | Strongest source for consensus levels, contradiction taxonomy, and quality scoring. | **ADAPT** consensus levels and contradiction taxonomy into `hm-synthesis`; avoid stock-domain specificity. |
| 3 | `oimiragieo/agent-studio@research-synthesis` | skills.sh page requires research before creating artifacts, mandates multi-source conflict detection, query limits, report size limits, and design decisions with source/rationale. `[CITED: https://skills.sh/oimiragieo/agent-studio/research-synthesis]` | Strong guardrails against source hoarding and silent contradiction adoption. | **ADOPT** conflict matrix and report size/query-budget guardrails; **ADAPT** `.claude` path assumptions to `.opencode`/phase artifacts. |

### Cluster D — Research Chain / Orchestration (`hm-research-chain`)

| Rank | Source | Evidence inspected | Relevance | Decision |
|---|---|---|---|---|
| 1 | Local `hm-research-chain` package | Chain stages are detect → research → synthesize → artifact; references define time-boxed stage contracts; tool matrix maps API signatures to Context7, current events to Tavily, codebase structure to Repomix. `[VERIFIED: .opencode/skills/hm-research-chain/SKILL.md:37-79] [VERIFIED: references/chain-stages.md:1-19] [VERIFIED: references/tool-matrix.md:1-9]` | Baseline already expresses canonical chain but lacks third-party adoption record and has validator drift. | **ADAPT** with third-party evidence below and fix validator/SKILL mismatch before PASS. |
| 2 | `parallel-web/parallel-agent-skills@parallel-deep-research` | Async start/poll and run/interact identifiers model long-running research as a chain with continuation state. `[CITED: https://skills.sh/parallel-web/parallel-agent-skills/parallel-deep-research]` | Useful for chain continuity and background work. | **ADAPT** continuation IDs and separate “start” vs “poll” stage semantics. |
| 3 | `lingzhi227/agent-research-skills@deep-research` | Strict phase execution requires verifying prior phase output files before starting the next phase. `[CITED: https://skills.sh/lingzhi227/agent-research-skills/deep-research]` | Strong phase-gate precedent for `hm-research-chain`. | **ADAPT** phase-gate protocol and required-output checklist. |

### Cluster E — Skill Synthesis / Skill Creation (`hm-skill-synthesis`, supplemental)

| Rank | Source | Evidence inspected | Relevance | Decision |
|---|---|---|---|---|
| 1 | Local `hm-skill-synthesis` | Contains five references, evals, trigger evals, seven scripts, and templates. `[VERIFIED: local directory read]` | Internal exemplar for RICH-complete skill-package shape. | **ADOPT as internal structural exemplar only** if Phase 28 scope expands. |
| 2 | `shipshitdev/library@skill-capture` | skills.sh page defines five phases: identification, destination planning, content drafting, distillation, verification; output includes `SKILL.md` and `plugin.json`. `[CITED: https://skills.sh/shipshitdev/library/skill-capture]` | Good fit for turning session learnings into reusable skills. | **ADAPT** capture/distillation/verification phases; **REJECT** plugin.json requirement if not compatible with OpenCode package shape. |
| 3 | `oimiragieo/agent-studio@research-synthesis` | Requires research before artifact creation and design decisions with source and alternatives. `[CITED: https://skills.sh/oimiragieo/agent-studio/research-synthesis]` | Strong source-backed creation guardrail. | **ADOPT** as pre-creation evidence gate for skill synthesis. |

### Cluster F — Context Absorb / Knowledge Ingestion (`hivefiver-context-absorb`, supplemental)

| Rank | Source | Evidence inspected | Relevance | Decision |
|---|---|---|---|---|
| 1 | `sanyuan0704/sanyuan-skills@wiki-ingest` | skills.sh page defines one-page-per-entity, directory taxonomy, existing-index check, entity extraction, create/update, cross-reference update, index update, log append; GitHub references include `page-templates.md`. `[CITED: https://skills.sh/sanyuan0704/sanyuan-skills/wiki-ingest] [VERIFIED: GitHub contents API: sanyuan0704/sanyuan-skills/skills/wiki-ingest/references]` | Strong fit for persistent context graph and cross-reference integrity. | **ADOPT** entity-per-page, index/log, cross-reference update patterns for context absorb. |
| 2 | `mindmorass/reflex@knowledge-ingestion-patterns` | skills.sh page defines content-type-specific ingestion patterns, chunking for retrieval, metadata, context preservation, deduplication, and schemas for PDFs/web/research notes. `[CITED: https://skills.sh/mindmorass/reflex/knowledge-ingestion-patterns]` | Strong technical ingestion guidance; aligns with context chunking and metadata. | **ADAPT** content-type chunking and metadata schemas; avoid implementation-language lock-in. |
| 3 | `garrytan/gbrain@idea-ingest` | skills.sh page requires raw source preservation, author page, bidirectional cross-links, inline source citations, primary-subject filing, and sync. `[CITED: https://skills.sh/garrytan/gbrain/idea-ingest]` | Strong provenance and back-link discipline for absorbed context. | **ADAPT** raw-source/provenance/backlink rules; **REJECT** gbrain-specific commands as direct dependency. |

## 4. Pattern 1/2/3 Alternatives and Decisions

### Pattern 1 — Strict Sequential Research Gates

**Source evidence:** Lingzhi deep research requires strict phase order and verifies output files before moving to next phase. `[CITED: https://skills.sh/lingzhi227/agent-research-skills/deep-research]`  
**Alternative:** Current `hm-deep-research` uses a flexible seven-step research loop without concrete phase-output file gates. `[VERIFIED: loaded hm-deep-research SKILL.md 2026-04-25]`  
**Decision:** **ADAPT** into `hm-deep-research` and `hm-research-chain` as optional “high-stakes/deep mode” gates: frame → detect → source gather → deep read/extract → synthesize → artifact; verify artifact existence before advancing.  
**Why not adopt fully:** Academic paper counts and hardcoded user paths are not general-purpose OpenCode harness patterns. `[CITED: https://skills.sh/lingzhi227/agent-research-skills/deep-research]`

### Pattern 2 — Source Evaluation + Contradiction Matrix

**Source evidence:** Qodex splits planning, source evaluation, synthesis, and report generation into distinct examples; Agent Studio requires multi-source conflict detection and a claim matrix. `[CITED: https://skills.sh/qodex-ai/ai-agent-skills/deep-research-agent] [CITED: https://skills.sh/oimiragieo/agent-studio/research-synthesis]`  
**Alternative:** Current skills mention citations and contradictions but do not provide runnable examples or a standard claim/conflict matrix artifact. `[VERIFIED: local skill/resource inspection 2026-04-25]`  
**Decision:** **ADOPT** source-evaluation criteria and conflict matrix structure across `hm-deep-research` and `hm-synthesis`; add examples or templates rather than scripts where execution environment varies.  
**Gap:** Need actual bundled template files before RICH PASS.

### Pattern 3 — Artifact Persistence, Continuation, and Provenance

**Source evidence:** Parallel deep research persists markdown/json output and `interaction_id`; wiki/idea ingest sources require index/log updates, raw-source preservation, and cross-links. `[CITED: https://skills.sh/parallel-web/parallel-agent-skills/parallel-deep-research] [CITED: https://skills.sh/sanyuan0704/sanyuan-skills/wiki-ingest] [CITED: https://skills.sh/garrytan/gbrain/idea-ingest]`  
**Alternative:** Current `hm-synthesis` contains artifact export guidance, but Phase 28 baseline skills do not all include evals/scripts proving artifacts are linked to sources. `[VERIFIED: local skill/resource inspection 2026-04-25]`  
**Decision:** **ADAPT** persistent artifact index/log and continuation IDs as harness-neutral concepts; **REJECT** vendor CLIs (`parallel-cli`, `gbrain`) as required dependencies.  
**Gap:** Need RICH evidence catalog linking each local reference/template/eval to adopted source patterns.

## 5. Per-Skill RICH Status After This Research

| Skill | Status | Evidence-backed reason | Next action |
|---|---|---|---|
| `hm-deep-research` | READY TO PATCH, not PASS | Has strong local references and three usable third-party patterns; missing bundled examples/evals and still has one blocked registry source (`skills.volces.com`). `[VERIFIED: local read] [CITED: selected sources above]` | Add phase-gate template, source-evaluator template, conflict matrix, and trigger evals. |
| `hm-detective` | READY TO PATCH, not PASS | Strong local reading modes; third-party sources support design-assumption verification and exact “not found” reporting; lacks evals/scripts. `[VERIFIED: local read] [CITED: ed3dai/ed3d-plugins@investigating-a-codebase]` | Add assumption-verification checklist/template and trigger evals for “verify design assumptions”. |
| `hm-synthesis` | READY TO PATCH, not PASS | Strong local compression/export references; third-party sources support contradiction handling, consensus scoring, and methodology limits; lacks evals/scripts. `[VERIFIED: local read] [CITED: anthropics/knowledge-work-plugins, liangdabiao synthesizer, agent-studio]` | Add conflict matrix, consensus scoring, and artifact quality checklist/evals. |
| `hm-research-chain` | BLOCKED UNTIL VALIDATOR DRIFT FIXED | Has strongest baseline package shape, but `scripts/validate-skill.sh` requires “6-NON Defence Table” while inspected `SKILL.md` does not contain it. `[VERIFIED: validate-skill.sh:13-14] [VERIFIED: hm-research-chain/SKILL.md:1-113]` | Either add the required table or update validator to reflect actual gate; then enrich chain gates with third-party patterns. |
| `hm-skill-synthesis` | OUT OF BASELINE / SUPPLEMENTAL | Rich local package shape and relevant third-party sources, but Phase 28 plan did not list it as a target. `[VERIFIED: 28-01-PLAN.md:7-12]` | Defer unless Coordinator expands Phase 28 target list. |
| `hivefiver-context-absorb` | OUT OF BASELINE / SUPPLEMENTAL | Relevant ingestion sources identified, but Phase 28 plan did not list it as a target. `[VERIFIED: 28-01-PLAN.md:7-12]` | Defer unless Coordinator expands Phase 28 target list. |

## 6. Blockers and Gaps

1. `skills.volces.com@deep-research` remains **per-skill BLOCKED** because direct skills.sh fetch returned 404 and no source package was inspectable in this session. `[VERIFIED: fetch 404 2026-04-25]`
2. `hm-research-chain` has validator drift: the validator checks for “6-NON Defence Table,” but the inspected SKILL body lacks that table. `[VERIFIED: .opencode/skills/hm-research-chain/scripts/validate-skill.sh:13-14] [VERIFIED: .opencode/skills/hm-research-chain/SKILL.md:1-113]`
3. The three baseline non-chain skills still lack eval/script packages, so Phase 28 cannot claim RICH PASS without adding and validating those resources. `[VERIFIED: local directory reads 2026-04-25]`
4. This artifact selects top-3 sources by **domain cluster**, not per-skill exhaustive top-3 for all six mentioned skills; per-skill exhaustive crawl is blocked by scope/time and by the non-baseline status of `hm-skill-synthesis` and `hivefiver-context-absorb`. `[VERIFIED: user request allowed domain clusters where per-skill top-3 is too large]`

## 7. Execution Readiness

**Ready for next execution wave:** YES, with constraints.

Recommended next wave:

1. Patch only the four Phase 28 baseline skills unless scope is explicitly expanded. `[VERIFIED: 28-01-PLAN.md target_skills]`
2. For `hm-deep-research`, add phase gates, source evaluator/conflict matrix template, and one eval file. `[CITED: qodex, lingzhi, agent-studio sources above]`
3. For `hm-detective`, add design-assumption verification and “not found” evidence reporting templates/evals. `[CITED: ed3dai investigating-a-codebase]`
4. For `hm-synthesis`, add consensus/contradiction matrix, methodology limitations, and synthesis quality score templates/evals. `[CITED: anthropics research-synthesis] [CITED: liangdabiao synthesizer]`
5. For `hm-research-chain`, resolve validator drift first, then add chain phase-gate/continuation patterns. `[VERIFIED: validator drift evidence above]`

Do **not** mark Phase 28 complete until a later verifier confirms updated package resources exist and RICH + D1-D8 checks pass. `[ASSUMED: verifier workflow requirement based on Phase 28 plan tasks and project gate discipline]`

## 8. Source Index

### Local phase and skill sources

- `.planning/phases/28-g-c-research-lineage-apply-proven-d1-d8-quality-pattern-to-h/28-01-PLAN.md`
- `.planning/phases/28-g-c-research-lineage-apply-proven-d1-d8-quality-pattern-to-h/28-RICH-GATE-BASELINE.md`
- `.planning/phases/28-g-c-research-lineage-apply-proven-d1-d8-quality-pattern-to-h/STATE.md`
- `.opencode/skills/hm-deep-research/`
- `.opencode/skills/hm-detective/`
- `.opencode/skills/hm-synthesis/`
- `.opencode/skills/hm-research-chain/`
- `.opencode/skills/hm-skill-synthesis/`
- `.opencode/skills/hivefiver-context-absorb/`

### Third-party sources

- https://skills.sh/parallel-web/parallel-agent-skills/parallel-deep-research
- https://skills.sh/qodex-ai/ai-agent-skills/deep-research-agent
- https://skills.sh/lingzhi227/agent-research-skills/deep-research
- https://skills.sh/ed3dai/ed3d-plugins/investigating-a-codebase
- https://skills.sh/ceedaragents/cyrus/investigate
- https://skills.sh/sickn33/antigravity-awesome-skills/error-detective
- https://skills.sh/sickn33/antigravity-awesome-skills/debugger
- https://skills.sh/anthropics/knowledge-work-plugins/research-synthesis
- https://skills.sh/liangdabiao/claude-code-stock-deep-research-agent/synthesizer
- https://skills.sh/oimiragieo/agent-studio/research-synthesis
- https://skills.sh/shipshitdev/library/skill-capture
- https://skills.sh/sanyuan0704/sanyuan-skills/wiki-ingest
- https://skills.sh/mindmorass/reflex/knowledge-ingestion-patterns
- https://skills.sh/garrytan/gbrain/idea-ingest

### GitHub/API sources inspected

- `parallel-web/parallel-agent-skills`, path `skills/parallel-deep-research/`
- `qodex-ai/ai-agent-skills`, path `skills/deep-research-agent/` and `examples/`
- `sickn33/antigravity-awesome-skills`, paths `skills/error-detective/` and `skills/debugger/`
- `sanyuan0704/sanyuan-skills`, path `skills/wiki-ingest/references/`
- `anthropics/knowledge-work-plugins`, path `product-management/skills/synthesize-research/`

## 9. Assumptions Log

| ID | Claim | Risk if wrong | Follow-up |
|---|---|---|---|
| A1 | Phase 28 completion requires a later verifier to confirm updated RICH + D1-D8 checks. | Could over-constrain execution if Coordinator only wanted research artifact. | Coordinator/planner should decide whether this artifact is sufficient to unblock patch planning. |
