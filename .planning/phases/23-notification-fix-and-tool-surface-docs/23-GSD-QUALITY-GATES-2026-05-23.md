# GSD Quality System — Deep Analysis

> **Source:** GSD Repomix output `5875fd23ec62fc70` — docs/AGENTS.md (plan-checker, verifier, nyquist-auditor, security-auditor), docs/ARCHITECTURE.md (gates, drift gate), docs/FEATURES.md (quality features)
> **Date:** 2026-05-23
> **Evidence Level:** L3 (documented observation from GSD docs)
> **Audience:** Hivemind engineers building quality gate system

---

## 1. OVERVIEW

GSD has multiple quality layers throughout the pipeline. Unlike Hivemind's tripartite gate system (lifecycle → spec → evidence), GSD's quality system is distributed across dedicated checker/verifier/auditor agents and in-line gates at decision points. [L21336-L21444]

GSD's approach can be summarized as:

```
Research Gate → Plan Checker (8 dims) → Requirements Coverage Gate → Decision Coverage Gate
→ Execution → Verifier (goal-backward + test quality audit) → Nyquist Auditor → Security Auditor
→ Integration Checker → Codebase Drift Gate → Conversation UAT
```

Hivemind's approach:

```
Lifecycle Gate → Spec Compliance Gate → Evidence Truth Gate
(3 gates, highly structured, evidence hierarchy)
```

The key difference: GSD has MORE gates but each is SIMPLER (binary PASS/FAIL). Hivemind has FEWER gates but each is DEEPER (L1-L5 evidence hierarchy). [L21336-L21360]

---

## 2. PLAN CHECKER (8 Verification Dimensions)

**Agent:** `gsd-plan-checker` [L21336-L21360]
**Spawned by:** `/gsd-plan-phase`  
**Read-only:** Yes (no Write, no Edit)  
**Model:** Sonnet  
**Output:** PASS/FAIL verdict with specific feedback  
**Max iterations:** 3 (if FAIL, planner replans and checker re-checks)

**The 8 dimensions:**

### Dimension 1: Requirement Coverage
Every REQ-ID from REQUIREMENTS.md must be traceable to at least one task in the plan. If a requirement has no matching task, the checker flags it as a gap. This prevents "forgetting" requirements during planning.

### Dimension 2: Task Atomicity
Each task must be single-purpose and self-contained. A task that says "implement auth AND add logging AND write tests" fails atomicity — it should be split into three tasks. This ensures each task fits in a single context window.

### Dimension 3: Dependency Ordering
Plans must respect declared dependency ordering. If Plan A depends on Plan B but is scheduled in the same wave, the checker flags the ordering violation. Plans within a wave must be truly independent (no shared mutable state, no sequential processing).

### Dimension 4: File Scope
Files to be modified must be within the declared scope of the phase. A task that modifies `src/api/` when the phase scope is `src/components/` is flagged. This prevents scope creep during execution.

### Dimension 5: Verification Commands
Every plan must include at least one verification command (how to verify the task is complete). A plan without verification is incomplete. Example: `npm test src/foo.test.ts` or `curl http://localhost:3000/api/health`.

### Dimension 6: Context Fit
The plan must fit in a single context window (200K tokens). If the combined size of all plan files + context exceeds the window, the checker FAILS. This prevents "plans that overflow the executor's context" bugs.

### Dimension 7: Gap Detection
Detects gaps between requirements and tasks. This is more nuanced than "coverage" — it checks for missing intermediate steps. Example: if a plan says "migrate database" but doesn't include "test migration rollback", the checker flags a gap.

### Dimension 8: Nyquist Compliance (when enabled)
When Nyquist validation is enabled, checks that every requirement has a matching test. If a requirement is testable but has no test, the checker flags a gap. This is turned on/off via `workflow.nyquist_validation`.

[L21338-L21360]

---

## 3. VERIFIER (Goal-Backward Analysis)

**Agent:** `gsd-verifier` [L21360-L21380]
**Spawned by:** `/gsd-execute-phase` (after all executors complete)  
**Read:** Yes (Write for VERIFICATION.md output)  
**Model:** Sonnet  
**Output:** `{phase}-VERIFICATION.md`

### Goal-Backward Analysis

The verifier does NOT check "were the tasks completed?" — it checks "does the codebase now achieve the phase goal?" This is a subtle but critical distinction.

Example: A phase goal is "Add rate limiting to API". The verifier checks:
- Is rate limiting actually enforced? (telemetry, curl test)
- Are limits configurable? (config file, env vars)
- Do exceeded limits return correct error codes? (test output)
- Are different limits applied per route? (per original REQUIREMENTS.md)

If all plans were executed but the goal is NOT achieved (e.g., rate limiting logic has a bug), the verifier FAILS.

### Milestone Scope Filtering (v1.32)

When the verifier finds gaps that are addressed in later phases of the same milestone, it marks them as "deferred" instead of reporting failures. This prevents false negatives during milestone execution. [L21372-L21376]

### Test Quality Audit (v1.32) — Unique Innovation

The verifier checks that tests actually PROVE what they claim. This goes beyond "do tests exist?" to "are the tests meaningful?":

| Check | What it catches | Severity |
|-------|----------------|----------|
| **Disabled/skipped tests** | Tests that exist but never run (`it.skip`, `test.skip`, `xdescribe`) | BLOCKING — test exists but proves nothing |
| **Circular test patterns** | System generating its own expected values (e.g., API response matched against itself) | BLOCKING — test can never fail |
| **Assertion strength** | Existence assertions (`expect(foo).toBeDefined()`) vs value assertions (`expect(foo).toBe(42)`) vs behavioral assertions (`expect(mock.call).toHaveBeenCalledWith(...)`) | LOWERING — weak assertions reduce evidence value |
| **Expected value provenance** | Where do the expected values come from? Hand-written? Auto-generated? From the implementation? If the implementation produces the expected value (circular), the test is meaningless | BLOCKING — test cannot detect regression |

[L21376-L21380]

---

## 4. NYQUIST AUDITOR (Test Gap Filling)

**Agent:** `gsd-nyquist-auditor` [L21382-L21394]
**Spawned by:** `/gsd-validate-phase`  
**Has Edit access:** Yes (but ONLY for test files)  
**Model:** Sonnet  
**Max attempts:** 3 per gap

**Contract constraints:**
- NEVER modifies implementation code — only test files
- Max 3 attempts per gap (if test still fails after 3 attempts, flags as escalation for user)
- Flags implementation bugs as escalations for user (not silent fix)

This is a critical boundary: the Nyquist auditor is allowed to WRITE tests but never to MODIFY implementation. If a test fails because the implementation is buggy, the auditor escalates to a human rather than silently "fixing" the implementation.

---

## 5. SECURITY AUDITOR

**Agent:** `gsd-security-auditor` [L21650-L21680]
**Spawned by:** `/gsd-secure-phase`  
**Has Edit access:** Yes (for SECURITY.md output)  
**Model:** Sonnet  
**Output:** `{phase}-SECURITY.md`

**Verification scope:**
- Verifies each threat by its DECLARED disposition (mitigate / accept / transfer)
- Does NOT scan blindly for new vulnerabilities — verifies declared mitigations only
- Implementation files are read-only — never patches implementation code
- Supports ASVS levels 1/2/3 for verification depth

**Security audit is NOT a vulnerability scan.** It's a compliance check against a pre-declared threat model (from PLAN.md). This is a deliberate design choice: unlimited vulnerability scanning would be too expensive and too noisy.

---

## 6. CODEBASE DRIFT GATE (Post-Execution)

**Not an agent — an inline gate in the workflow** [L22538-L22548]

After the last wave of `/gsd-execute-phase` commits, the workflow runs a non-blocking `codebase_drift_gate` step between `schema_drift_gate` and `verify_phase_goal`.

**How it works:**
1. Reads `last_mapped_commit` from `.planning/codebase/STRUCTURE.md` frontmatter
2. Runs `git diff --name-only last_mapped_commit..HEAD`
3. Counts 4 kinds of structural elements:
   - New directories outside mapped paths
   - New barrel exports at `(packages|apps)/<name>/src/index.*`
   - New migration files
   - New route modules under `routes/` or `api/`
4. If count ≥ `workflow.drift_threshold` (default 3):
   - `warn` (default): prints suggested `/gsd-map-codebase --paths …` command
   - `auto-remap`: spawns `gsd-codebase-mapper` scoped to affected paths

**Important characteristics:**
- Non-blocking: drift detection can never fail verification
- Any error in detection or remap is logged and phase continues
- `last_mapped_commit` is stored per-file in YAML frontmatter

---

## 7. CROSS-PHASE REGRESSION GATE

**Agent:** `gsd-integration-checker` [L21220]
**Spawned by:** `/gsd-audit-milestone`  
**Read-only:** Yes  
**Model:** Sonnet  
**Output:** Integration verification report

Checks:
1. Do earlier phase artifacts still exist and function correctly?
2. Do interfaces between phases still match?
3. Are there missing integration points?

This is a milestone-level check, not phase-level. It runs when a milestone is being completed, not after every phase.

---

## 8. REQUIREMENTS COVERAGE GATE

**Inline gate** [L22407-L22420]

Verifies every REQ-ID from REQUIREMENTS.md maps to at least one plan. Runs at planning time (before execution) so missing requirements are caught early.

This is different from the plan checker's requirement coverage check:
- **Requirements Coverage Gate:** Checks that every requirement has SOME plan addressing it
- **Plan Checker (Dimension 1):** Checks that every requirement has a SPECIFIC task addressing it

---

## 9. DECISION COVERAGE GATE

**Inline gate (BLOCKING in plan-phase, NON-BLOCKING in execute-phase)** [L22410-L22415]

Verifies every `<decision>` from CONTEXT.md is reflected in the plans/shipped artifacts.

- **BLOCKING at plan time:** If a user decision (e.g., "use Node built-in crypto, no external deps") is not reflected in any plan, the gate blocks
- **NON-BLOCKING at execute time:** If a shipped artifact doesn't reflect a decision, the gate warns but doesn't fail

This prevents "user says one thing, planner ignores it, executor builds something else" — a real problem in multi-agent systems.

---

## 10. PACKAGE LEGITIMACY GATE (Supply Chain Security)

**Multi-layer gate spanning research→planning→execution** [L22680-L22720]

### Threat Model
GSD automates the path from "researcher names a package" to "executor runs `npm install`". ~20% of AI-generated package references are hallucinated. ~43% of those names recur consistently across prompts, making pre-registration economically viable for attackers.

### Three Layers

| Layer | Component | Action |
|-------|-----------|--------|
| Research | gsd-phase-researcher | Runs `slopcheck install <pkgs> --json`; writes `## Package Legitimacy Audit` table to RESEARCH.md; strips `[SLOP]` packages entirely |
| Planning | gsd-planner | Reads Audit table; inserts `checkpoint:human-verify` before `[ASSUMED]`/`[SUS]` install tasks; adds `T-{phase}-SC` STRIDE supply-chain row to `<threat_model>` |
| Execution | gsd-executor | RULE 3 excludes package installation from auto-fix scope; failed installs surface as checkpoints, never silent substitutions |

### Provenance System
Three verdicts + graceful degradation:

| Verdict | Meaning | Action |
|---------|---------|--------|
| `[SLOP]` | Verified hallucinated/unsafe package | Removed entirely from RESEARCH.md |
| `[SUS]` | Suspicious (low age, few downloads, no source repo) | Checkpoint:human-verify before install |
| `[OK]` | Approved (healthy registry metadata) | No checkpoint added |
| `[ASSUMED]` | Web-sourced (not registry-verified) | Treated as SUS — always gets checkpoint |

**Ecosystem coverage:**
- `npm view` (Node.js)
- `pip index versions` (Python)
- `cargo search` (Rust)

**Graceful degradation:** If `slopcheck` is unavailable, every package tagged `[ASSUMED]`. Research and planning proceed; never hard-fails.

---

## 11. CODE REVIEW PIPELINE

**Two agents, two workflows:**

```
/gsd-code-review → gsd-code-reviewer → REVIEW.md (severity-classified findings)
/gsd-code-review --fix → gsd-code-fixer → REVIEW-FIX.md (atomic per-fix commits)
```

[L24542-L24550]

**gsd-code-reviewer** detects:
- Bugs: logic errors, null/undefined checks, off-by-one, type mismatches, unreachable code
- Security: injection, XSS, hardcoded secrets, insecure crypto
- Quality: code organization, naming, duplication, error handling

**gsd-code-fixer** applies fixes from REVIEW.md:
- Treats REVIEW.md suggestions as guidance (not literal patches)
- One atomic git commit per fix (reviewable, revertable)
- Honors CLAUDE.md and project-skill rules during fixes

---

## 12. COMPARISON WITH HIVEMIND QUALITY SYSTEM

| Quality Gate | GSD | Hivemind | Strengths |
|-------------|-----|----------|-----------|
| **Pre-planning** | Research gate (unresolved questions block) | None | GSD |
| **Plan validation** | 8-dim plan-checker (max 3 iterations) | gate-l3-spec-compliance | Different (GSD broader, Hivemind deeper) |
| **Supply chain** | Package Legitimacy Gate (3 layers) | None | GSD |
| **Execution verification** | Goal-backward analysis + test quality audit | gate-l3-evidence-truth (L1-L5) | Different (GSD checks goals, Hivemind checks evidence) |
| **Test quality** | Assertion strength, circular patterns, disabled tests | None | GSD |
| **Security** | Threat mitigation verification (ASVS) | None | GSD |
| **Cross-phase** | Integration checker | None | GSD |
| **Drift detection** | Codebase drift gate (structural changes) | None | GSD |
| **Code review** | /gsd-code-review → REVIEW.md → fix → REVIEW-FIX.md | hm-l2-reviewer | GSD (more structured) |
| **Spec compliance** | Requirements coverage + decision coverage | gate-l3-spec-compliance (bidirectional traceability) | Hivemind (more rigorous with traceability) |
| **Evidence hierarchy** | Binary PASS/FAIL | L1-L5 with file:line references | Hivemind |
| **Lifecycle compliance** | None | gate-l3-lifecycle-integration (9-surface mutation authority) | Hivemind |
| **Mock detection** | None | gate-l3-evidence-truth (mock-only detection) | Hivemind |
| **Orchestration** | Sequential: plan-checker → verifier → auditor | gate-l3-lifecycle-integration → gate-l3-spec-compliance → gate-l3-evidence-truth | Both valid |

---

## 13. HIVEMIND'S UNIQUE QUALITY ADVANTAGES

Hivemind has capabilities that GSD lacks entirely:

1. **L1-L5 Evidence Hierarchy** — Every claim tagged with evidence level. GSD uses binary PASS/FAIL. Hivemind's approach enables partial credit, graded quality assessment, and explicit knowledge gaps.

2. **9-Surface Mutation Authority** — gate-l3-lifecycle-integration checks which surfaces an agent modifies (src/ vs .opencode/ vs .hivemind/) and validates against CQRS boundaries. GSD has no equivalent concept.

3. **Mock-Only Detection** — gate-l3-evidence-truth can detect "integration testing" that's actually mocked at all layers. GSD has no such check.

4. **Bidirectional Spec Traceability** — gate-l3-spec-compliance traces spec→implementation AND implementation→spec, detecting untraced implementation (feature creep) in addition to untraced requirements (gaps).

---

## 14. ACTIONABLE RECOMMENDATIONS FOR HIVEMIND

### RECOMMENDATION A: Test Quality Audit (HIGH IMPACT)

**Add to gate-l3-evidence-truth or hm-l2-critic:**

```
When verifying test evidence, check:
1. [BLOCKING] Are any tests disabled? (it.skip, xdescribe, test.skip)
2. [BLOCKING] Are there circular patterns? (system generates own expected values)
3. [LOWERING] What assertion strength? (existence < value < behavioral)
4. [BLOCKING] Expected value provenance? (hand-written, auto-generated, from impl?)
```

### RECOMMENDATION B: Package Legitimacy Gate (HIGH IMPACT)

**Add to hm-l3-deep-research or hm-l2-production-readiness:**

```
When research recommends external packages:
1. Run registry-specific verification: npm view / pip index / cargo search
2. Tag: [VERIFIED] / [ASSUMED] / [SUS] / [SLOP]
3. [SLOP] → strip from recommendations
4. [ASSUMED]/[SUS] → add checkpoint:human-verify
5. Ecosystem coverage: Node, Python, Rust (at minimum)
```

### RECOMMENDATION C: Codebase Drift Detection (MEDIUM IMPACT)

**Add to hm-l2-phase-execution:**

```
After execution wave completes:
1. Read last_mapped_commit from codebase docs frontmatter
2. git diff --name-only last_mapped_commit..HEAD
3. Check: new directories, new barrel exports, new route modules
4. If ≥ threshold: WARN with remap suggestion
```

### RECOMMENDATION D: Decision Coverage Gate (MEDIUM IMPACT)

**Add to hm-l2-spec-driven-authoring or hm-l2-phase-loop:**

```
After planning, check:
1. Every decision from the brief/spec is reflected in at least one plan task
2. If any decision is missing: BLOCK (re-plan to include it)
3. After execution: check again (NON-BLOCKING this time)
```

### RECOMMENDATION E: Research Gate (MEDIUM IMPACT)

**Add between research and planning phases:**

```
Before entering planning:
1. Scan RESEARCH.md for [UNRESOLVED] markers
2. If any exist: BLOCK planning → return to research
3. If none: proceed to planning
```

### RECOMMENDATION F: Pre-Plan Scope Validation (LOW IMPACT)

**Add to hm-l2-spec-driven-authoring's output validation:**

```
Verify for each plan file:
1. Every REQ-ID from spec maps to at least one task
2. Every file to be modified is within phase scope
3. Verification commands are specified for each task
4. Plan fits in one context window (200K tokens)
```

---

## 15. KEY TAKEAWAYS

1. **GSD has 10+ quality gates** vs Hivemind's 3-gate triad. However, GSD's gates are simpler (binary PASS/FAIL) while Hivemind's are deeper (L1-L5 evidence hierarchy). The optimal is a hybrid: Hivemind's gate depth + GSD's gate breadth.

2. **The Package Legitimacy Gate** is GSD's most important innovation for AI coding agents. Supply-chain security is critical when AI agents recommend and install dependencies autonomously.

3. **GSD's test quality audit** (assertion strength, circular patterns, disabled tests) verifies that tests actually PROVE something. Hivemind's gate-l3-evidence-truth checks that evidence EXISTS but not that it's MEANINGFUL.

4. **GSD's codebase drift gate** is a simple but effective post-execution check. Hivemind has no equivalent.

5. **Hivemind's evidence hierarchy + mock detection + 9-surface mutation authority** have no equivalent in GSD. These are unique Hivemind advantages.

6. **Recommendation priority:** Package Legitimacy Gate > Test Quality Audit > Codebase Drift Detection > Decision Coverage Gate > Research Gate.
