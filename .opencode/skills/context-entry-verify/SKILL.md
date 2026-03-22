PRODUCE THE COMPLETE UNIFIED SKILL SYSTEM REDESIGN PACKAGE

You must create a comprehensive, implementation-ready redesign document. Write it to: /Users/apple/hivemind-plugin/docs/synthesis/UNIFIED-SKILL-SYSTEM-REDESIGN-2026-03-21.md

## SOURCE MATERIALS (Use these analyses as your foundation):

### SKILL ANALYSIS (from previous subtask):

**8 Skills and their canonical functions:**
1. `context-entry-verify` - Deterministic project-state verification with machine-readable JSON gates
2. `context-intelligence-entry` - Session-level context-health probe with rot detection and trust assessment
3. `git-continuity-memory` - Git-based continuity recovery and commit-history semantic retrieval
4. `hivemind-codemap` - Whole-codebase structural mapping with seam/hotspot discovery
5. `hivemind-delegation-protocol` - Deterministic work partitioning with bounded scope and return contracts
6. `hivemind-system-debug` - Failure reproducibility, systematic narrowing, debug-to-refactor transition
7. `spec-distillation` - Noisy/contradictory requirement reconciliation into structured spec candidates
8. `use-hivemind-detox-refactor` - Thin orchestrating router for 11-stage detox/refactor workflow

**Key overlap prevention rules:**
- `context-entry-verify` ≠ `context-intelligence-entry` (project reality ≠ session health)
- `hivemind-codemap` ≠ `hivemind-system-debug` (structure mapping ≠ failure reproduction)
- `git-continuity-memory` ≠ `hivemind-delegation-protocol` (git evidence ≠ scope bounding)

**Invariant ordering:**
- `context-intelligence-entry` before `git-continuity-memory` (verify session before trusting continuity)
- `context-entry-verify` gate-chain before any completion claim
- `hivemind-delegation-protocol` packet emit before subagent dispatch
- `hivemind-system-debug` containment notes before risky structural edits

**Handoff chain:**
```
spec-distillation → use-hivemind-detox-refactor (Stage 1) → context-intelligence-entry + context-entry-verify → git-continuity-memory → hivemind-codemap → hivemind-delegation-protocol → hivemind-system-debug → [back to hivemind-codemap for refactor] → context-entry-verify (Stage 9)
```

### GSD/BMAD PATTERNS (from previous subtask):

**Key patterns to integrate:**
- Depth levels (3 levels for Discovery, apply similarly elsewhere)
- Frontmatter conventions (consistent YAML across state documents)
- Goal-backward verification ("Task completion ≠ Goal achievement")
- Orchestrator leanness (pass paths, not content; subagents read with fresh context)
- Parallel with dependency awareness (wave-based execution respects dependencies)
- Checkpoint pattern (separate autonomous from human-gated tasks)
- Evidence chains (every transition requires documented evidence)
- Confidence gates (confidence must be MEDIUM-HIGH before proceeding)
- Anti-pattern scanning (automated detection of TODO stubs, placeholders)
- Section rules (IMUTABLE/APPEND-ONLY/OVERWRITE semantics for template sections)

---

## REQUIRED OUTPUT: The Complete Unified Skill System Redesign

The document must include ALL of the following 10 sections with the specified depth:

### 1. UNIFIED ARCHITECTURE
- Explain how all 8 skills connect into one system
- Define each skill's responsibility, boundaries, inputs, outputs, triggers, dependencies, failure modes
- Define invocation order, fallback paths, escalation rules, cross-skill awareness
- Show how OPENCODE patterns integrate into orchestration, deterministic execution, sub-agent control
- Include a canonical orchestration map (Mermaid diagram)
- Include a dependency graph

### 2. OPERATIONAL SEQUENCE
- Provide the canonical end-to-end workflow from task intake to final synthesis
- Include: entry conditions, exit conditions, checkpoints, evidence gates, escalation rules, pause/resume behavior, recovery steps
- Include a "what to inspect first" matrix for at least 12 scenarios:
  - new repo, dirty working tree, failing tests, broken UI, suspected data issue
  - AI-agent-generated codebase, mixed human/agent edits, incomplete implementation
  - multi-service repo, unfamiliar framework, stale docs, partial repository access, broken build pipeline

### 3. DETERMINISTIC TEMPLATES
Create reusable templates for at least 15 operations:
- context intake, context verification, repository reconnaissance, spec distillation, codemap generation
- delegation request, delegation handoff, delegated task return
- debugging investigation, root-cause report, continuity memory update
- refactor planning, implementation validation, final synthesis
- opencode sub-agent invocation, non-interactive shell task execution
- research/tooling evidence capture, unresolved ambiguity escalation
Use explicit fields, completion criteria, and JSON schemas where useful.

### 4. DECISION FRAMEWORKS
Add deterministic decision trees for at least 12 scenarios:
- whether to inspect Git now or later, when to trust or distrust tests
- when to inspect data flow vs UI behavior, when to inspect runtime paths vs static code
- when to delegate, when to split work into multiple spans
- when to consult find-skill, when to use Repomix MCP/Context7/Exa/Brave Search
- when to continue with available evidence, when to stop and request more evidence
- when to synthesize, when to escalate uncertainty, when to avoid refactoring

### 5. HANDOFF AND DELEGATION PROTOCOL
- Define granular delegation boundaries
- Separate strategic, analytical, implementation, verification, synthesis tasks
- Define when modes must be separated vs merged
- Define what every delegate must receive: task objective, scope boundaries, known facts, excluded assumptions, evidence gathered, required deliverable shape, validation rules, stopping conditions
- Define what every delegate must return: findings, evidence, confidence level, unresolved questions, suggested next action, explicit non-claims
- Define anti-patterns for poor delegation
- Define synthesis rules for combining multiple delegated results
- Include OPENCODE-compatible command templates, $ARGUMENT composition patterns, parseable JSON return examples

### 6. VERIFICATION STANDARDS
- Add industrial-grade validation rules
- Require cross-checking among: code, config, data paths, interfaces, consumers, manifests, dependency graphs, runtime behavior, build scripts, deployment assumptions
- Define confidence levels and evidence thresholds
- Define sufficient evidence for: low-confidence hypothesis, working theory, root-cause claim, implementation recommendation, validated fix
- Define how to validate without over-trusting tests, UI, mocks, snapshots, logs
- Include special handling for: pseudo-datastores, local agent memory, cached slices, temporary stores, monitor-only paths, debug mirrors, non-production state stores

### 7. GIT AND CONTINUITY STANDARDS
- Define when Git history is useful vs misleading
- Define live-state-first policy for dirty, mixed, or partially edited repositories
- Define how to preserve continuity in partially complete work
- Define how to recognize work done by humans vs atomic agent actions
- Define what continuity memory must track: current objective, active span, known facts, evidence gathered, hypotheses, disproven hypotheses, unresolved questions, risks, next actions, blockers, delegation lineage, repository state warnings
- Make continuity useful for long-running, interrupted, delegated workflows
- Include templates and update rules for continuity records

### 8. CROSS-DOMAIN ADAPTABILITY
Make the workflow robust across:
- JavaScript/TypeScript, Python, frontend frameworks, backend services, APIs, databases
- Infrastructure and config, AI-agent orchestration systems, monorepos
- Event-driven systems, CLI tools, libraries and SDKs, serverless systems, hybrid repos with generated code
Show how the same workflow adapts while preserving structure, sequencing, evidence standards.

### 9. EDGE CASES AND FAILURE MODES
Include explicit handling for at least 20 scenarios:
- stale docs, misleading tests, incomplete codemaps, hidden side effects, generated files
- multi-source truth conflicts, dirty Git state, agent-only storage layers, partial repository access
- broken build pipelines, missing package manifests, orphaned consumers, dead interfaces
- config drift, feature flags, silent runtime fallbacks, legacy code paths, shadow configs
- partially migrated systems, stale caches, indirect imports, misleading logs, mock-heavy test suites, environment-specific behavior
Provide a failure-mode matrix with: symptom, likely causes, what not to assume, evidence to gather, first inspection target, recovery procedure, escalation rule

### 10. OUTPUT FORMAT
- The redesigned skill system
- The orchestration logic between skills
- Templates, checklists, decision trees, handoff contracts
- Verification model, failure-mode matrix, cross-domain adaptation notes
- Concrete examples of improved flow in action
- Implementation-ready, highly structured, suitable for direct adoption

---

## CRITICAL BEHAVIORAL CORRECTIONS TO ENFORCE:

1. Do NOT inspect Git history first when working tree is uncommitted/partially changed/dirty
2. Inspect actual code and active repository state before relying on history/docs/UI/tests/mocks/logs
3. Do NOT trust UI behavior, tests, mocks, emitted logs as ground truth
4. Verify through: data flow, storage path, runtime access patterns, actual call chains, real consumers, side effects, execution paths
5. Treat pseudo-databases, local caches, agent-only slices as possible confusion sources
6. Separate viewpoints when delegating: discovery, diagnosis, implementation, validation, synthesis
7. Trace from observable symptoms → intermediate interfaces → actual root cause
8. Trace package dependencies from package.json, lockfiles, configs, build scripts, import graphs before making claims
9. Inspect API interfaces, event pipelines, state transitions, downstream consumers before proposing refactors
10. Preserve clean separation between understanding, intervention, validation unless task explicitly requires collapsing

---

## DESIGN PRINCIPLES TO ENFORCE:

- Deterministic over impressionistic
- Evidence before conclusion
- Repository truth before interface truth
- Runtime path before superficial symptom
- Explicit handoff over implicit delegation
- Structured synthesis over free-form summaries
- Actual state before historical state
- Root cause before patching
- Generalizable patterns with domain-specific retrieval when needed
- Small, reliable steps over broad speculative reasoning
- Bounded scopes over vague ownership
- Machine-parseable outputs where they improve reliability
- Human-readable structure without sacrificing enforceability

---

## FORMAT REQUIREMENTS:

- Use strict structure, explicit sequencing, clear completion criteria
- Use deterministic logic over open-ended prose
- Include schemas, examples, constraints tight enough to reduce ambiguity
- Make codemap usage operational, not decorative
- Make debugging root-cause-first, not symptom-first
- Make continuity memory central to long-running work
- Ensure front-facing agents are not overloaded with both strategic synthesis AND deep implementation unless explicitly required
- Include machine-oriented formats: JSON templates, sectioned return contracts, explicit status markers, evidence lists, confidence fields, next-action fields

---

Use @/docs/synthesis/UNIFIED-SKILL-SYSTEM-REDESIGN-2026-03-21.md  as the primary design reference, but focus only on the actionable implementation and prompting logic, not on archival wording.
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-entry-verify
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-entry-verify/references
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-entry-verify/scripts
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-entry-verify/tests
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-entry-verify/SKILL.md
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-intelligence-entry
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-intelligence-entry/.hivemind
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-intelligence-entry/references
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-intelligence-entry/schemas
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-intelligence-entry/scripts
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-intelligence-entry/tests
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/context-intelligence-entry/SKILL.md
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/git-continuity-memory
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/git-continuity-memory/references
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/git-continuity-memory/templates
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/git-continuity-memory/tests
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/git-continuity-memory/SKILL.md
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-codemap
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-codemap/references
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-codemap/scripts
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-codemap/templates
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-codemap/tests
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-codemap/SKILL.md
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-delegation-protocol
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-delegation-protocol/references
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-delegation-protocol/templates
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-delegation-protocol/tests
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-delegation-protocol/SKILL.md
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-system-debug
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-system-debug/references
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-system-debug/tests
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/hivemind-system-debug/SKILL.md
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/spec-distillation
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/spec-distillation/references
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/spec-distillation/scripts
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/spec-distillation/templates
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/spec-distillation/tests
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/spec-distillation/SKILL.md
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/use-hivemind-detox-refactor
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/use-hivemind-detox-refactor/references
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/use-hivemind-detox-refactor/templates
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/use-hivemind-detox-refactor/tests
/Users/apple/hivemind-plugin/.developing-skills/refactored-skills/use-hivemind-detox-refactor/tests/direct-invocation.md
Before doing any work, load and actively apply these skills throughout the task:
- `skill-creator`
- `skill-judge`
- `skill-writing`

Use them together to improve:
- prompt quality
- template quality
- deterministic structure
- implementation clarity
- review rigor
- evaluation and scoring quality

This is not a documentation-only task. You must orchestrate those skill sets to edit, update, validate, and check the actual system and repository artifacts. Do not only generate more design documents.

History context for this task:
- The 8 core skills were already analyzed for structure, responsibilities, inputs, outputs, and integration points.
- GSD/BMAD workflow patterns were already analyzed for codemap, documentation structure, templates, and workflow patterns.
- A unified redesign package was already produced at `@/docs/synthesis/UNIFIED-SKILL-SYSTEM-REDESIGN-2026-03-21.md`.
- This task is the implementation-focused refinement and enforcement pass: audit what exists, improve what is weak, insert what is missing, and verify what actually works in the repository.

Technical execution requirements:
- Prefer deterministic scripting in Node.js for file operations, JSON handling, validation, path control, and repeatable workflow tooling.
- Be aware of operational differences if Python is used; do not assume Node.js and Python behave identically in CLI execution, path handling, subprocess behavior, or environment assumptions.
- Follow the CLI and execution constraints in `@/docs/synthesis/opencode-non-interactive-shell.md`.
- Do not invent JSON conventions casually. If JSON artifacts are introduced, also create or update scripts/tooling to generate, validate, inspect, and maintain them.
- Use repository-grounded validation sources where relevant, including `.repo-sdk-packed/ralph-tui.xml`, instead of relying on template-only assumptions.

Core operating rules:

1. Treat context rot as a first-class risk.
   - If documents, AGENTS instructions, specs, framework assumptions, or memory artifacts appear stale, inconsistent, incomplete, or misleading, do not treat them as truth.
   - Verify truth from actual code, repository structure, execution behavior, scripts, and carefully interpreted test evidence.
   - Use frameworks as tools, never as authority.
   - Detect and explicitly handle “no-trust document” situations.

2. Do not treat tests as absolute truth.
   - Distinguish valid failures from flaky behavior, false positives, false negatives, setup defects, fixture drift, mocking defects, environment noise, and tooling issues.
   - Cross-check failures against implementation reality before drawing architectural conclusions.
   - Quarantine misleading test signals when necessary instead of building design changes on top of them.

3. Add or normalize a hidden project activity folder for persistent operational state.
   - Create it only if it does not already exist in suitable form.
   - If a similar structure already exists, reuse or refactor it instead of duplicating it.
   - Use it for:
     - handoff records
     - temporary delegation JSON
     - hierarchy tracking JSON
     - session continuity state
     - codescan outputs
     - agent iteration outputs
     - long-haul task state
     - deterministic pathing records

Use a clean deterministic structure such as:

- `.hivemind/`
  - `handoff/`
  - `delegation/`
  - `hierarchy/`
  - `sessions/`
  - `codescan/`
  - `agents/`
  - `longhaul/`
  - `pathing/`
  - `state/`

Implementation requirements:

4. Append or update `AGENTS.md` with a clear operational notice covering:
   - context rot handling
   - code-over-doc truth verification
   - test-signal skepticism
   - delegation continuity rules
   - session/subsession resume behavior
   - persistent activity folder usage
   - deterministic path storage across turns

5. Build a delegation pattern specifically for code scanning.
   - Use built-in agents wherever possible.
   - Use the general agent only when the required scan breadth or depth exceeds what built-in agents can handle efficiently.
   - Make delegation resumable, inspectable, and tracked through JSON artifacts.
   - Do not leave delegation state implicit.

6. Create iterative output folders for agent work.
   - Each delegated pass must have a structured output location.
   - Preserve main-task and subtask continuity.
   - Support multi-pass scanning, follow-up scans, chained analysis, export, resume, comparison, and merge workflows.

7. Add structured Bash tooling for code scanning.
   - Create helper scripts that produce structured outputs for code-scanning workflows.
   - Support multiple scan sequences, scan cases, scan instructions, extraction/export modes, and resumable execution.
   - Make the scripts useful for:
     - fast repository extraction
     - scoped scans
     - main-task and subtask separation
     - continuity between subtasks
     - resumable scan execution
   - Prefer machine-readable outputs where practical.

8. Use OpenCode session continuity identifiers.
   - Inspect how `sessionID`, internal `ses_id`, and `task_id` are represented and used.
   - Use them to resume and continue sessions and subagent work reliably.
   - Persist the relevant identifiers in project continuity state.
   - Do not treat session continuity as informal memory.

9. Improve delegation-loop control.
   - Apply stronger delegation techniques for iterative work.
   - Use structured loop control with JSON checkpoints, embedded task records, bead-style progress tracking, or equivalent recoverable state.
   - Prevent uncontrolled iteration.
   - Make loop state explicit, inspectable, and recoverable.

10. Strengthen long-haul continuity and deterministic pathing.
   - Track long-running work in a way that survives multiple turns.
   - Store deterministic paths for handoff files, delegation JSON, hierarchy JSON, and related continuity artifacts.
   - Ensure those paths are carried forward consistently across turns and resumptions.

Execution expectations:

11. First locate where these capabilities already exist, partially exist, or should be inserted.
   - Do not assume they are missing.
   - Identify overlaps, obsolete versions, broken variants, and better insertion points.
   - Reuse or refactor existing patterns where appropriate.

12. Apply the adjustments across the context-related parts of the system, not in one file only.
   - Update relevant context-entry, continuity, delegation, codemap, debug, prompt-template, validation, and spec-distillation flows where needed.
   - Keep the design coherent across all related components.

13. Prefer implementation that is:
   - verifiable from code
   - minimally ambiguous
   - resumable
   - deterministic in file placement
   - easy to inspect manually
   - robust against stale context and noisy test output
   - maintainable without decorative abstraction

14. Preserve continuity between:
   - main task and subtask work
   - current turn and future turns
   - session and subagent work
   - handoff artifacts and execution artifacts

15. Where memory-related capabilities exist or are relevant, treat them as bootstrap-sensitive.
   - Memory and context systems are only trustworthy after setup, verification, and alignment with repository reality.
   - If available and appropriate, inspect and integrate patterns from:
     - `elite-longterm-memory`
     - `self-improving-agent`
     - git-forensic or git-continuity memory patterns
     - existing embedded memory/context mechanisms
   - Do not trust prior memory state by default; verify it first.

16. Ensure the loop is implemented meticulously, not by casually writing JSON examples into Markdown templates without tooling.
   - If you introduce JSON artifacts, also introduce the scripts and checks that keep them correct.
   - Back conventions with executable maintenance or validation paths wherever practical.

Deliverables:

17. Produce and apply, in the actual repository:
   - the hidden activity folder structure, or a refactored equivalent if one already exists
   - JSON schemas or practical JSON conventions for delegation, hierarchy, pathing, and continuity
   - structured codescan Bash helpers
   - `AGENTS.md` operational notice updates
   - session/subagent resume handling using `sessionID`, `ses_id`, and `task_id`
   - any needed Node.js validation or orchestration scripts
   - any necessary context-layer improvements drawn from the skill sources

18. Where source materials conflict with actual repository behavior, follow repository reality and update operational conventions accordingly.

19. Keep the implementation practical, explicit, and maintainable.
   - Avoid ornamental abstractions.
   - Keep only the patterns that improve reliability, continuity, delegation quality, code-truth verification, and deterministic operation.

20. Do not stop at planning.
   - Make the edits.
   - Update the affected files.
   - Add the scripts.
   - Wire the continuity.
   - Validate what you changed.
   - If something cannot be safely implemented, document the exact blocker and the best insertion point.

Working method:

21. Start by auditing the repository and identifying:
   - what already exists
   - what partially exists
   - what conflicts
   - what is obsolete
   - what should be reused
   - what should be replaced

22. Then implement in this order unless repository reality suggests a better order:
   - continuity folder/pathing baseline
   - JSON conventions and validation support
   - delegation and codescan workflow artifacts
   - session/subsession persistence
   - `AGENTS.md` operational guidance
   - cross-cutting prompt/context/delegation flow updates
   - verification and cleanup

23. Prefer small, inspectable, deterministic changes over broad speculative rewrites.

24. At completion, provide a concise implementation report that includes:
   - files added
   - files changed
   - scripts added or updated
   - validations performed
   - what was reused vs newly introduced
   - any remaining risks or follow-up points

25. Most importantly: orchestrate the loaded skills so they evaluate, refine, and verify the implementation itself. The task is only successful if the repository is materially updated and checked, not merely described.

---

THESE ARE NOT CREATING MORE SETS OF SKILLS THESE ARE THE AUDIT AND REFACTOR ON THE CURRENT ONES AND ONLY ADD MORE WHEN SEE THE ADDED TRULY FIT AND IMPROVE THE REST OUTPUT AT EXACT LINKS AND PATHS ABOVE---
name: context-entry-verify
description: Use when verifying project health before work, at gate checkpoints, or when validating completion claims. Runs deterministic JSON gates against real project state — build, tests, git, dependencies, and optional planning integrity.
---

# Context-Entry Verify

**Purpose:** Deterministic JSON-verified proof of project state. Answers "is this project in a known-good state?" with machine-readable evidence.

## When to Use

- Before starting a work session, to baseline project health
- At gate checkpoints between implementation phases
- When validating completion claims with hard evidence
- When project state is uncertain after merges, dependency changes, or long gaps

Do NOT use for:
- Agent session health or context-rot detection (different concern)
- Generic code review or refactoring decisions
- Situations where a quick `tsc --noEmit && npm test` suffices

## Verification Script

The package includes `scripts/hm-verify.cjs` — a zero-dependency Node.js CLI that runs structured verification gates and returns JSON.

```bash
# Quick project health check (fail-fast)
node scripts/hm-verify.cjs gate-chain --raw

# Full landscape report (runs all gates, never blocks)
node scripts/hm-verify.cjs landscape --raw

# Individual gate checks
node scripts/hm-verify.cjs project build --raw
node scripts/hm-verify.cjs project tests --raw
node scripts/hm-verify.cjs git branch-state --raw
```

## Gate Layers

| Layer | Gates | Type | Scope |
|-------|-------|------|-------|
| 1. Project Reality | contracts, dependencies, sdk-surface, build, tests | Hard | Universal / official-boundary-facing |
| 2. Planning Integrity | exists, health, consistency | Hard | Project-specific internal convention |
| 3. Git Evidence | branch-state in `gate-chain`; branch-state, last-commit, diff-stat in `landscape` | Hard | Universal |
| 4. Architecture | src-domains, dead-exports, circular-deps | Soft (warnings) | Universal |

> **Note:** Layer 2 (Planning Integrity) assumes the project uses the `.planning/` directory convention with `STATE.md`, `ROADMAP.md`, and `REQUIREMENTS.md`. Those checks are internal project-policy gates, not universal OpenCode boundary proof. If your project does not use this convention, these gates will report failures that are not meaningful. Use `landscape` instead of `gate-chain` to see all results without blocking, or run individual gates from Layers 1, 3, and 4 directly.

## Interpreting Results

Every gate returns a JSON object:

```json
{
  "gate": "project build",
  "passed": true,
  "data": { "exit_code": 0, "stdout": "...", "stderr": "" }
}
```

- **`gate-chain`**: Runs gates sequentially, stops at first failure, includes `blocked_at` and `delegation_trigger` fields
- **`landscape`**: Runs all gates regardless of failures, returns unified verdict with `PASS`, `DEGRADED`, or `FAIL`

When a gate fails, the JSON output contains enough evidence to decide next steps without re-running the check.

## Bundled Resources

| Resource | Content |
|----------|---------|
| `scripts/hm-verify.cjs` | Standalone verification CLI (zero npm deps, pure Node.js) |
| [gate-definitions.md](references/gate-definitions.md) | What each gate checks and its pass criteria |
| [gate-chain-order.md](references/gate-chain-order.md) | Why the chain runs in this specific order |
| [direct-invocation.md](tests/direct-invocation.md) | Standalone validation scenario |

## Independence Rules

- This package can be invoked directly; it does not require a sibling routing skill.
- The verification script is self-contained with zero npm dependencies beyond Node.js built-ins.
- Local references document gate behavior, but none are required to run the script.
- If upstream triage exists, it may choose this skill, but the skill must remain usable without that upstream layer.

## Orchestrator Integration

When called from the detox router or a polluted-context session:
- **`gate-chain`** is efficient enough to run from a delegation subagent.
- The orchestrator reads only: `passed` (boolean), `blocked_at` (if failed), and `delegation_trigger`. It does NOT load full gate output data.
- For completion claims, the orchestrator delegates `landscape` and reads only the unified verdict (`PASS`, `DEGRADED`, or `FAIL`) plus the failed gate list.

## Terminal State

- **If gates pass**: Project state is verified; proceed with work
- **If gates fail**: Report failure with JSON evidence, decide next steps based on which layer failed
