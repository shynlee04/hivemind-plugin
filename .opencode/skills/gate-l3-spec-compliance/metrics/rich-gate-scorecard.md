# RICH Gate Scorecard — gate-spec-compliance

**Evaluated:** 2026-04-29 (SE-5.5 hardening pass)
**Evaluated by:** gsd-executor (SE-5.5 hardening pass)
**RICH Classification:** INTERNAL-USE (this project only, not shipped)
**Skill Pattern:** P2 (Hybrid)

## D1–D8 Quality Dimensions

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **D1—Conciseness** | PASS | SKILL.md: 236 lines, ~1,600 words. No bloat. Six distinct reference files carry domain depth. Checklist-style decision tree is efficiently structured. |
| **D2—Structure** | PASS | Valid YAML frontmatter with name, description (trigger phrases), metadata, allowed-tools. Body follows: On Load → Decision Tree → Gap Detection → EARS Validation → Anti-Patterns → Routing → Boundary Rules → Exit Criteria → Self-Correction. |
| **D3—Procedures** | PASS | Decision tree with 7 nodes (START→SPEC→CODE→TEST→PASS/FAIL). Gap detection algorithm with forward/backward sweeps. EARS template checklist. Anti-pattern detection methods. Imperative form throughout. |
| **D4—Bundled Resources** | PASS | 5 substantive reference files (evaluation-checklist, perspective-rubrics, anti-patterns, adopted-patterns, traceability-matrix-template). 1 template (compliance-report). 1 script (run-compliance-check.sh — 184 lines real logic). 1 eval file (evals.json — 5 scenarios, 31 assertions). |
| **D5—Routing Integration** | PASS | Clear chain: gate-lifecycle-integration (upstream) → gate-spec-compliance → gate-evidence-truth (downstream). Boundary rules for nearby skills (spec-driven-authoring, test-driven-execution, completion-looping). Skip conditions for wrong-context loading. hm-gate-orchestrator integration section added in SE-5.5. |
| **D6—Independence** | PARTIAL | Evals reference `.planning/`, `src/lib/`, `tests/lib/` — harness-local paths. Adopted-patterns references `src/` and `tests/` as "typical paths". Traceability matrix template uses `src/lib/`, `src/tools/` conventions. **HARDENING FIX APPLIED**: Adapter notes and detection-pattern replacements added in this hardening pass. |
| **D7—Gap Documentation** | PASS | Anti-pattern catalog documents missing capabilities. Boundary rules table clarifies handoff points. "Do NOT Load" section lists skip conditions. Missing skills (hm-requirements-analysis) noted in remediation routing. |
| **D8—Trigger Phrase Quality** | PASS | Description contains 8 concrete trigger phrases: "spec compliance", "verify against spec", "gap analysis", "compliance gate", "phase audit gate", "acceptance criteria check", "spec-to-code", "deployment readiness". Triggers match both gate workflow and user query patterns. |

## RICH Gate Dimensions

| Gate | Status | Evidence |
|------|--------|----------|
| **RICH-1 — Third-party synthesis** | PASS | Adopted-patterns.md synthesizes DO-178C (bidirectional traceability), EARS (requirement syntax), Trail of Bits (spec-to-code compliance), IEC 62304 (evidence hierarchy). Each pattern documented with source, adoption decision, and local transformation. |
| **RICH-2 — Transform-improve-adopt decision** | PASS | Pattern 1 (DO-178C): adopted bidirectional sweep, adapted from aerospace names. Pattern 2 (EARS): adopted for validation, adapted from authoring to checking. Pattern 3 (Falsifiable AC): adopted GIVEN/WHEN/THEN, extended with MEASURE/PASS/FAIL. Pattern 4 (Gap Detection): adopted four-gap taxonomy. Pattern 5 (Evidence Hierarchy): adopted from IEC 62304. |
| **RICH-3 — Horizontal integration** | PASS | Integration wiring section covers: Agents (gate context declaration), Commands (path provision), Tools (prompt-skim, prompt-analyze, session-patch), Plugin hooks (phase transitions), Runtime state (continuity/lifecycle records). Contextual perspective activation maps PM/Architect/Dev lenses. |
| **RICH-4 — Routing integration** | PASS | Full triad routing: upstream (gate-lifecycle-integration), downstream (gate-evidence-truth). Boundary rules for 5 adjacent skills. FAIL routing to hm-spec-driven-authoring, hm-debug. Triad position metadata in frontmatter. hm-gate-orchestrator integration section added in SE-5.5. |
| **RICH-5 — Professional bundled resources** | PASS | Non-generic: evaluation-checklist (123 lines of per-dimension criteria), perspective-rubrics (138 lines with PM/Architect/Dev scoring), anti-patterns (178 lines, 7 patterns with detection methods), adopted-patterns (157 lines, 5 synthesized patterns), traceability-matrix-template (90 lines with V-Model mapping). Script has real logic (184 lines, exits non-zero). |
| **RICH-6 — Independence audit** | PARTIAL→PASS | **HARDENED**: adopted-patterns.md now includes adapter notes (§Project-To-Project Adaptation). traceability-matrix-template.md now uses `<CODE_ROOT>/<module>.ts` detection patterns instead of `src/lib/`. Evals use test fixture paths (acceptable for internal-use skill). Script takes paths as arguments (no hardcoded assumptions). |
| **RICH-7 — Gap documentation** | PASS | Anti-pattern catalog: 7 documented gaps. Boundary rules: covers 5 adjacent skills. Remediation routing: documents `hm-requirements-analysis` as missing skill for requirement gap diagnosis. Missing gap: no automated test-assertion quality scanner (noted in self-correction). |
| **RICH-8 — Scoring integration** | PASS | **THIS FILE** is the scoring integration. D1-D8 + RICH gate scores included. Scorecard follows `.planning/RICH-SKILL-QUALITY-GATE.md` evidence packet format. |

## Exit Decision

**PASS** — All D1-D8 dimensions pass or partial→pass after hardening. RICH gate requirements met. Skill is functional and audited for internal use.

## Hardening Changelog (2026-04-28)

| Change | File | Impact |
|--------|------|--------|
| Added RICH-8 scorecard | `metrics/rich-gate-scorecard.md` (NEW) | Formal scoring integration |
| Added directory registration | `metrics/.gitkeep` (NEW) | Structure integrity |
| Added adapter notes | `references/adopted-patterns.md` (§Project-To-Project Adaptation) | RICH-6 fix |
| Replaced hardcoded paths | `references/traceability-matrix-template.md` | RICH-6 fix |
| Added triad metadata | `SKILL.md` frontmatter | Triad cross-reference |
| Added downstream ref | `SKILL.md` Overview § | Triad cross-reference |
| Added remediation routing | `SKILL.md` §Remediation Routing | FAIL recovery paths |
| Added metrics ref | `SKILL.md` §Bundled Resource Map | RICH-8 integration |
| Added hm-gate-orchestrator integration | `SKILL.md` §Gate Orchestrator Integration (SE-5.5) | Triad lifecycle management |
| Self-correction documented (4 modes) | `SKILL.md` §Self-Correction | Already had 4 modes — verified complete |
| Scorecard updated | `metrics/rich-gate-scorecard.md` (SE-5.5) | Re-evaluated with orchestrator ref |
