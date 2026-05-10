# Advanced HiveMind Use Cases — Subagent Delegation & Iterative Workflows

**Created:** 2026-04-04
**Audience:** Product Managers — what these workflows look like from the user's seat
**Status:** DRAFT

---

## What This Document Is

Real user journeys. No jargon. No "graph traversal" or "MINDNETWORK nodes." Just: what a user says, what happens, what they get back.

Each use case shows:
- **What the user types** — the actual words
- **What happens behind the scenes** — which agents get spun up, in what order, who checks whose work
- **What the user sees** — the progress updates and final delivery
- **What could go wrong** — where the system catches itself and recovers

---

## Category 1: Full Delegation Cycles — User Says One Thing, System Does Everything

### Use Case 1.1: "Build me a new skill for code review"

**What the user types:**
> "Create a skill that reviews pull requests for our team. It should check for security issues, test coverage, and follow our coding standards."

**What happens behind the scenes:**

```
Step 1 — Intent Confirmation (user-intent-interactive-loop skill)
  → The coordinator asks up to 3 clarifying questions:
    - "What language is your codebase?" (user: TypeScript)
    - "Any existing skills this should reference?" (user: no)
    - "Should it run automatically or on-demand?" (user: on-demand via /review-pr)
  → Writes intent.json with scope, constraints, success criteria
  → Runs scripts/intent-verify.sh — all 6 checks pass → proceeds

Step 2 — Planning (planning-with-files skill)
  → Creates 3 files in project root:
    - task_plan.md: 4 phases — Structure, Content, Validation, Integration
    - findings.md: Research on existing skill patterns
    - progress.md: Session log
  → Each phase has checkboxes and status fields

Step 3 — Skill Authoring (use-authoring-skills skill)
  → Runs validate-gate.sh create "Create code review skill"
  → Decision tree matches "create a skill" → loads references/03-three-patterns.md
  → Picks P2 pattern (balanced depth — not too thin, not too heavy)
  → Writes SKILL.md with frontmatter, procedural steps, checklists
  → Runs validate-skill.sh → passes
  → Runs check-overlaps.sh → no conflicts with existing skills
  → Dispatches critic subagent to review the skill → critic finds minor frontmatter issue
  → Fixes issue → re-runs validation → passes

Step 4 — Command Creation (coordinator delegates to builder)
  → Creates .opencode/commands/review-pr.md
  → Command uses $ARGUMENTS injection for PR number
  → References the new code-review-skill

Step 5 — Final Validation
  → Runs harness-doctor command to verify: skill loads, command triggers, agent permissions correct
  → Updates progress.md: all phases complete
  → Commits: "feature: add code-review-skill — on-demand PR review with security checks"
```

**What the user sees:**
```
Turn 1: "Got it. Let me clarify a few things..." (3 questions)
Turn 2: "Here's the plan: 4 phases. Phase 1: skill structure. Phase 2: content. Phase 3: validation. Phase 4: command integration. Approve?"
Turn 3: "Phase 1 done. Writing SKILL.md now..."
Turn 4: "Phase 2 done. Running validation..."
Turn 5: "Critic found a minor issue — fixed. All checks pass."
Turn 6: "Done. New skill at .opencode/skills/code-review-skill/. Use /review-pr <number> to trigger it."
```

**Concepts involved:** user-intent-interactive-loop → planning-with-files → use-authoring-skills → builder agent → critic agent → coordinating-loop

**Scripts that actually run:**
- `scripts/intent-verify.sh` — validates intent.json has all required fields
- `scripts/verify-hierarchy.sh` — checks background skills are loaded
- `scripts/register-skill.sh` — registers skill as loaded in state
- `scripts/validate-gate.sh` — blocks if prerequisites not met
- `scripts/validate-skill.sh` — checks skill structure, frontmatter, content
- `scripts/check-overlaps.sh` — finds duplicate content across skills

**Cross-skill links that actually exist:**
- `use-authoring-skills` references `references/03-three-patterns.md` (decision tree path)
- `planning-with-files` reads/writes `task_plan.md`, `findings.md`, `progress.md`
- `user-intent-interactive-loop` loads 3 background skills first: `opencode-platform-reference`, `repomix-exploration-guide`, `opencode-non-interactive-shell`

---

### Use Case 1.2: "Fix our broken test suite"

**What the user types:**
> "Our tests are failing — 23 failures across 5 files. Fix them."

**What happens behind the scenes:**

```
Step 1 — Intent Classification (conductor agent)
  → Conductor classifies: "implement" → delegates to builder
  → But first: coordinates with researcher to understand the failures

Step 2 — Research Phase (researcher subagent)
  → Runs: npm test — captures all 23 failures
  → Groups failures by type:
    - 8 failures: type errors in session-api.ts
    - 7 failures: missing mock in lifecycle-manager.test.ts
    - 5 failures: timeout in concurrency.test.ts
    - 3 failures: assertion failures in helpers.test.ts
  → Writes findings.md with root cause analysis per group
  → Returns to coordinator

Step 3 — Planning (coordinator + planning-with-files)
  → Creates task_plan.md with 4 phases (one per failure group)
  → Orders by dependency: type errors first (may fix assertion failures too)
  → progress.md: Phase 1 → IN_PROGRESS

Step 4 — Fix Loop (builder subagent, iterates per phase)
  → Phase 1: Reads session-api.ts, finds SDK call pattern changed
    → Fixes 8 type errors → runs npm test — 15 failures remain
    → Commits: "fix: update session-api.ts SDK call patterns"
  → Phase 2: Reads lifecycle-manager.test.ts, finds missing mock
    → Adds mock → runs npm test — 8 failures remain
    → Commits: "fix: add missing mock in lifecycle-manager tests"
  → Phase 3: Reads concurrency.test.ts, finds race condition in test
    → Adds proper async/await → runs npm test — 3 failures remain
    → Commits: "fix: fix race condition in concurrency tests"
  → Phase 4: Reads helpers.test.ts, finds assertion logic outdated
    → Updates assertions → runs npm test — 0 failures
    → Commits: "fix: update helper test assertions"

Step 5 — Verification (critic subagent)
  → Runs full test suite 3x to confirm no flaky tests
  → Runs npm run typecheck — passes
  → Runs npm run build — passes
  → Verdict: PASS

Step 6 — Report
  → Updates progress.md: all phases complete
  → 4 commits, 23 failures → 0, all verification passes
```

**What the user sees:**
```
Turn 1: "Running tests now to understand the failures..."
Turn 2: "Found 23 failures in 4 groups. Fixing type errors first (8 failures)..."
Turn 3: "Type errors fixed. 15 remaining. Moving to mock issues..."
Turn 4: "Mocks fixed. 8 remaining. Fixing race conditions..."
Turn 5: "Race conditions fixed. 3 remaining. Updating assertions..."
Turn 6: "All tests pass. Ran full suite 3x — no flaky tests. 4 commits created."
```

**Concepts involved:** conductor agent → researcher subagent → builder subagent → critic subagent → planning-with-files → coordinating-loop

**What could go wrong — and how it recovers:**
- If builder's fix doesn't reduce failure count → critic catches it → builder tries different approach (max 3 retries per the error discipline rule in planning-with-files)
- If a fix introduces new failures → critic runs test suite → fails → builder reverts → tries alternative approach
- If 3 retries fail → escalates to user with "Tried X, Y, Z. Need your input on..."

---

## Category 2: Conditional Routing — System Decides What to Do Based on What You Say

### Use Case 2.1: "Something's wrong with my skills"

**What the user types:**
> "Some of my skills trigger correctly, some don't. I think there are overlaps."

**What happens behind the scenes:**

```
Step 1 — Intent Routing (meta-builder skill)
  → meta-builder receives: "doctor skills"
  → Routes to use-authoring-skills with "doctor" path
  → Decision tree matches "doctor" / "what's wrong with..." → loads references/12-anti-deception.md

Step 2 — Diagnostic Branch A: Trigger Analysis
  → IF user named specific skills:
    → Tests only those skills with 20-query eval set
  → IF user did NOT name skills (this case):
    → Scans all .opencode/skills/ directories
    → Tests each skill's trigger phrases against sample queries
    → Records: which skills trigger, which don't, which trigger incorrectly
  → Result: 8/11 skills triggering correctly, 3 with issues

Step 3 — Diagnostic Branch B: Overlap Detection
  → Runs check-overlaps.sh across all skills
  → Finds: researcher.md and explore.md have near-identical descriptions (410 lines each, same content)
  → Finds: oh-my-openagent-reference copy/ is a duplicate directory
  → Result: 2 overlaps detected

Step 4 — Diagnostic Branch C: Quality Assessment
  → Runs validate-skill.sh on each skill
  → Finds: 2 skills with frontmatter issues (missing metadata fields)
  → Result: 9/11 skills pass validation

Step 5 — Report Generation
  → Writes findings.md with:
    - Trigger health: 8/11 correct
    - Overlaps: researcher/explore duplicates, stale copy/ directory
    - Quality: 2 skills need frontmatter fixes
    - Recommendations: consolidate duplicates, clean up trash, fix frontmatter
```

**What the user sees:**
```
Turn 1: "Scanning all 11 skills for trigger accuracy..."
Turn 2: "Testing overlaps between skills..."
Turn 3: "Running quality validation..."
Turn 4: "Here's what I found:
  - 8 of 11 skills trigger correctly
  - researcher.md and explore.md are near-identical (same 410-line content)
  - oh-my-openagent-reference copy/ is a stale duplicate
  - 2 skills have frontmatter issues
  Want me to fix these?"
```

**Concepts involved:** meta-builder (router) → use-authoring-skills (doctor path) → references/12-anti-deception.md → builder agent (for fixes)

**Scripts that actually run:**
- `scripts/check-overlaps.sh` — finds duplicate content across skills
- `scripts/validate-skill.sh` — validates skill structure and content

**Cross-skill links:**
- `meta-builder` routing table: "doctor" / "what's wrong with..." → use-authoring-skills
- `use-authoring-skills` decision tree: "doctor" → references/12-anti-deception.md

---

### Use Case 2.2: "Help me understand this codebase"

**What the user types:**
> "I just joined this project. Can you give me a tour of how everything fits together?"

**What happens behind the scenes:**

```
Step 1 — Intent Classification (coordinator agent)
  → Classifies: research + exploration
  → Loads repomix-exploration-guide skill (codebase exploration patterns)
  → Loads opencode-platform-reference skill (platform capabilities)

Step 2 — Codebase Packing (repomix-explorer skill)
  → Runs repomix to pack the codebase into structured output
  → Uses --compress flag to reduce token usage by ~70%
  → Gets: directory structure, file counts, token counts

Step 3 — Pattern Discovery (researcher subagent)
  → Uses grep_repomix_output to find:
    - Entry points (index.ts, plugin.ts)
    - Main classes and exports
    - Import relationships
  → Maps the dependency graph
  → Writes findings.md with:
    - What each directory does
    - How modules connect
    - Where to look for common tasks

Step 4 — Synthesis (coordinator)
  → Reads findings.md
  → Creates a structured tour:
    - "Here's the entry point: src/plugin.ts (447 lines)"
    - "Core library lives in src/lib/ — 12 modules"
    - "Skills are in .opencode/skills/ — 11 total"
    - "Agents are in .opencode/agents/ — 7 total"
    - "Commands are in .opencode/commands/ — 6 total"
  → Maps common tasks to file locations (the "Where to find things" table from AGENTS.md)

Step 5 — Delivery
  → Presents the tour to user
  → Offers to deep-dive any specific area
```

**What the user sees:**
```
Turn 1: "Packing the codebase for analysis..."
Turn 2: "Mapping the structure. Found 12 core modules, 11 skills, 7 agents..."
Turn 3: "Here's your tour:
  - Entry point: src/plugin.ts — wires everything together
  - Core library: src/lib/ — types, state, helpers, concurrency, continuity
  - Skills: .opencode/skills/ — meta-builder routes, use-authoring-skills creates
  - Agents: .opencode/agents/ — coordinator orchestrates, builder implements, critic reviews
  - Commands: .opencode/commands/ — /plan, /start-work, /ultrawork
  Want me to deep-dive any area?"
```

**Concepts involved:** coordinator agent → repomix-exploration-guide → repomix-explorer → researcher subagent → opencode-platform-reference

**Scripts/commands that actually run:**
- `repomix --compress` — packs codebase with ~70% token reduction
- `grep_repomix_output` — searches packed output for patterns
- `read_repomix_output` — reads specific sections of packed output

---

## Category 3: Multi-Agent Coordination — Several Specialists Working Together

### Use Case 3.1: "Build a feature from scratch"

**What the user types:**
> "Add a new command that generates AGENTS.md files for every directory in the project."

**What happens behind the scenes:**

```
Step 1 — Planning (conductor agent via /plan command)
  → Conductor asks: "What should these AGENTS.md files contain?"
  → User: "Project structure, conventions, where to look for things."
  → Conductor creates task_plan.md with phases:
    Phase 1: Research existing patterns (researcher)
    Phase 2: Design command structure (coordinator)
    Phase 3: Implement command (builder)
    Phase 4: Test and verify (critic)

Step 2 — Research (researcher subagent)
  → Scans existing commands in .opencode/commands/
  → Reads all 6 command files to understand patterns
  → Finds: commands use $ARGUMENTS injection, agent frontmatter, subtask flags
  → Writes findings.md with command patterns and best practices
  → Returns to coordinator

Step 3 — Design (coordinator)
  → Designs command: /init-deep
  → Specifies: agent: conductor, subtask: false
  → Plans workflow: discover → score → generate → review
  → Updates task_plan.md with implementation details

Step 4 — Implementation (builder subagent)
  → Creates .opencode/commands/deep-init.md
  → Follows existing command patterns:
    - YAML frontmatter with description, agent, subtask
    - Procedural workflow with phases
    - TodoWrite checkpoints
    - Anti-patterns section
  → Runs: reads the file back → verifies structure → passes

Step 5 — Verification (critic subagent)
  → Reads the new command file
  → Checks against acceptance criteria:
    - [x] Has YAML frontmatter with required fields
    - [x] References correct agent (conductor)
    - [x] Has procedural workflow steps
    - [x] Has anti-patterns section
  → Runs: validates command syntax
  → Verdict: PASS

Step 6 — Integration
  → Updates progress.md: all phases complete
  → Commits: "feature: add /init-deep command — generates AGENTS.md files"
```

**What the user sees:**
```
Turn 1: "Let me plan this out. What should the AGENTS.md files contain?"
Turn 2: "Here's the plan: 4 phases. Research → Design → Implement → Verify. Approve?"
Turn 3: "Research done. Found patterns in existing 6 commands..."
Turn 4: "Design complete. Command will be /init-deep..."
Turn 5: "Implementation done. Command created at .opencode/commands/deep-init.md"
Turn 6: "All checks pass. Command ready to use."
```

**Concepts involved:** conductor agent → /plan command → researcher subagent → builder subagent → critic subagent → planning-with-files → coordinating-loop

**The actual command that gets created:** deep-init.md (303 lines) — which you can see at `.opencode/commands/deep-init.md`

---

### Use Case 3.2: "Run everything autonomously"

**What the user types:**
> "/ultrawork — migrate our JavaScript files to TypeScript"

**What happens behind the scenes:**

```
Step 1 — Ultrawork Activation (conductor agent via /ultrawork command)
  → /ultrawork command triggers: "Do not ask for clarification. Classify and act."
  → Conductor classifies: "implement" → delegates to builder
  → But first: explores codebase to understand scope

Step 2 — Exploration (researcher subagent)
  → Finds all .js files in the project
  → Counts: 847 JS files, 23 test files
  → Maps dependencies between files
  → Writes findings.md: migration order, circular dependencies, type-heavy modules

Step 3 — Planning (coordinator)
  → Creates task_plan.md:
    Phase 1: Convert type definitions first
    Phase 2: Convert utility functions
    Phase 3: Convert components
    Phase 4: Convert test files
    Phase 5: Run typecheck and fix errors
  → Orders by dependency: types → utilities → components → tests

Step 4 — Execution Loop (builder subagent, iterates per phase)
  → Each phase:
    1. Builder reads JS files
    2. Infers types from usage patterns
    3. Writes .ts equivalents
    4. Runs npm run typecheck
    5. If errors → fixes → re-checks (max 3 retries)
    6. Commits each batch
  → After each phase: critic runs verification
  → If critic finds issues → builder loops on fixes

Step 5 — Final Verification (critic subagent)
  → Runs full test suite
  → Runs npm run typecheck
  → Runs npm run build
  → All must pass before declaring done

Step 6 — Report
  → Updates progress.md: all phases complete
  → Reports: files migrated, type coverage, test results, commit count
```

**What the user sees:**
```
Turn 1: "Exploring codebase to understand scope..."
Turn 2: "Found 847 JS files. Planning migration order..."
Turn 3: "Phase 1 done: type definitions converted. Running typecheck..."
Turn 4: "Phase 2 done: utilities converted. 0 type errors..."
Turn 5: "Phase 3 done: components converted. 12 type errors — fixing..."
Turn 6: "Phase 4 done: tests converted. All passing..."
Turn 7: "Migration complete. 847 files converted, 94% type coverage, 0 test failures."
```

**Concepts involved:** /ultrawork command → conductor agent → researcher subagent → builder subagent → critic subagent → planning-with-files → coordinating-loop

**What could go wrong — and how it recovers:**
- If typecheck fails after 3 retries → coordinator escalates to user: "Tried X, Y, Z. These 12 files need manual review."
- If a file has circular dependencies → researcher flags it → coordinator reorders phases → builder retries
- If tests break after migration → critic catches it → builder reverts that batch → tries alternative approach

---

## Category 4: Iterative Workflows — The System Loops Until It Gets It Right

### Use Case 4.1: "Create a skill, but make it right"

**What the user types:**
> "Create a skill for security auditing. I want it thorough."

**What happens behind the scenes:**

```
Step 1 — Intent Confirmation (user-intent-interactive-loop)
  → Asks up to 3 questions:
    - "What should this skill audit — code, config, dependencies?" (user: all three)
    - "Any existing security tools to reference?" (user: no)
    - "Should it run automatically or on-demand?" (user: on-demand)
  → Writes intent.json with all 6 required fields
  → Runs scripts/intent-verify.sh — passes → proceeds

Step 2 — Planning (planning-with-files)
  → Creates task_plan.md with phases:
    Phase 1: Research security audit patterns
    Phase 2: Draft SKILL.md
    Phase 3: Validate and iterate
    Phase 4: Create supporting scripts
    Phase 5: Final review
  → findings.md: Research on security audit best practices
  → progress.md: Session log

Step 3 — Skill Drafting (use-authoring-skills)
  → Runs validate-gate.sh create "Create security audit skill"
  → Decision tree: "create a skill" → loads references/03-three-patterns.md
  → Picks P3 pattern (comprehensive — security needs depth)
  → Writes SKILL.md with:
    - Frontmatter: name, description, metadata
    - Procedural steps: scan code, check configs, audit dependencies
    - Validation gates: each check must pass before proceeding
    - Anti-patterns: what to avoid in security audits
  → Runs validate-skill.sh → FAILS: missing scripts/ directory
  → Creates scripts/ directory with validate-gate.sh, validate-skill.sh
  → Re-runs validate-skill.sh → passes
  → Runs check-overlaps.sh → passes

Step 4 — Critic Review (critic subagent)
  → Dispatches critic to review the skill
  → Critic checks against agentskills.io principles:
    - Procedures over declarations? ✓
    - Defaults, not menus? ✓
    - Match specificity to fragility? ✓
    - Checklists for multi-step workflows? ✓
    - Validation loops? ✓
    - Bundle scripts in scripts/? ✓
  → Critic finds: "Missing cross-platform adaptation section"
  → Builder adds platform adaptation table (OpenCode, Claude Code, Codex, Cursor)
  → Re-runs critic → PASS

Step 5 — Final Validation
  → Runs validate-gate.sh one more time → passes
  → Updates progress.md: all phases complete
  → Commits: "feature: add security-audit-skill — comprehensive code/config/dependency auditing"
```

**What the user sees:**
```
Turn 1: "Let me clarify — what should this skill audit?" (3 questions)
Turn 2: "Here's the plan: 5 phases. Research → Draft → Validate → Scripts → Review. Approve?"
Turn 3: "Research done. Drafting SKILL.md..."
Turn 4: "Validation found missing scripts/ — created. Re-validating..."
Turn 5: "Critic found missing cross-platform section — added. Re-reviewing..."
Turn 6: "All checks pass. Skill ready at .opencode/skills/security-audit-skill/."
```

**Concepts involved:** user-intent-interactive-loop → planning-with-files → use-authoring-skills → critic subagent → builder subagent → coordinating-loop

**The validation loop that actually runs:**
```
Write SKILL.md
  → validate-skill.sh
    → FAIL: missing scripts/
    → Create scripts/
    → Re-run validate-skill.sh
      → PASS
  → check-overlaps.sh
    → PASS
  → Dispatch critic subagent
    → FAIL: missing cross-platform section
    → Add section
    → Re-run validate-skill.sh
      → PASS
    → Re-run critic
      → PASS
  → validate-gate.sh (final)
    → PASS
```

**Scripts that actually run:**
- `scripts/intent-verify.sh` — validates intent before proceeding
- `scripts/validate-gate.sh` — blocks if prerequisites not met
- `scripts/validate-skill.sh` — checks skill structure and content
- `scripts/check-overlaps.sh` — finds duplicate content

---

### Use Case 4.2: "Fix this, but don't break anything else"

**What the user types:**
> "The coordinator agent's permission config is wrong — it should be able to use the task tool. Fix it, but make sure nothing else breaks."

**What happens behind the scenes:**

```
Step 1 — Intent Confirmation (user-intent-interactive-loop)
  → Asks: "Which permission specifically?" (user: task tool, currently denied)
  → Asks: "Any other changes?" (user: no, just that)
  → Writes intent.json with scope: coordinator.md, task permission
  → Runs scripts/intent-verify.sh — passes

Step 2 — Current State Check (researcher subagent)
  → Reads .opencode/agents/coordinator.md
  → Finds: permission.skill section has "*": ask with specific allows
  → But permission section does NOT have task: allow (it's missing entirely)
  → Reads other agent files to understand permission patterns
  → Writes findings.md: current state, expected state, impact analysis

Step 3 — Planning (coordinator + planning-with-files)
  → Creates task_plan.md:
    Phase 1: Fix coordinator.md permission config
    Phase 2: Verify no other agents affected
    Phase 3: Run harness-doctor to confirm system health
  → progress.md: Phase 1 → IN_PROGRESS

Step 4 — Implementation (builder subagent)
  → Reads coordinator.md
  → Adds: `task: allow` to permission section
  → Reads file back → verifies syntax
  → Runs: git diff — confirms only the intended change

Step 5 — Verification (critic subagent)
  → Reads the changed coordinator.md
  → Checks:
    - [x] task: allow added in correct location
    - [x] No other permissions changed
    - [x] YAML frontmatter still valid
  → Reads other agent files — confirms no unintended changes
  → Runs harness-doctor command — system health check passes
  → Verdict: PASS

Step 6 — Final Check
  → Runs git diff --stat — confirms 1 file changed, 1 insertion
  → Updates progress.md: all phases complete
  → Commits: "fix: add task permission to coordinator agent — enables subagent delegation"
```

**What the user sees:**
```
Turn 1: "Which permission needs fixing?" (clarification)
Turn 2: "Found the issue — task permission is missing. Here's the fix plan..."
Turn 3: "Permission added. Verifying no side effects..."
Turn 4: "All checks pass. 1 file changed, 1 line added. System health: OK."
```

**Concepts involved:** user-intent-interactive-loop → researcher subagent → builder subagent → critic subagent → planning-with-files → harness-doctor command

**What could go wrong — and how it recovers:**
- If the YAML frontmatter breaks → critic catches it → builder reverts → tries again with correct syntax
- If harness-doctor finds other issues → coordinator logs them → reports to user as separate findings (doesn't scope-creep)

---

## What Actually Exists vs What Doesn't

### Scripts that exist and work:

| Script | Location | What it does |
|--------|----------|-------------|
| `verify-hierarchy.sh` | Each skill's scripts/ | Checks background skills are loaded |
| `register-skill.sh` | Each skill's scripts/ | Registers skill in loaded-skills.json |
| `intent-verify.sh` | user-intent-interactive-loop/scripts/ | Validates intent.json fields |
| `validate-gate.sh` | use-authoring-skills/scripts/ | Blocks if prerequisites not met |
| `validate-skill.sh` | use-authoring-skills/scripts/ | Checks skill structure and content |
| `check-overlaps.sh` | use-authoring-skills/scripts/ | Finds duplicate content |
| `check-gate.sh` | coordinating-loop/scripts/ | Per-gate enforcement (G1-G5) |
| `validate-envelope.sh` | coordinating-loop/scripts/ | Validates task envelope sections |
| `run-ralph-loop.sh` | coordinating-loop/scripts/ | Validate → fix → re-dispatch cycle |
| `coordination-check.sh` | coordinating-loop/scripts/ | Pre-dispatch validation |
| `init-session.sh` | coordinating-loop/scripts/ | Creates .coordination/ directory |
| `loop-status.sh` | coordinating-loop/scripts/ | Reports current loop phase |

### Scripts referenced but may not exist yet:

| Script | Referenced in | Status |
|--------|--------------|--------|
| `graph-init.sh` | meta-builder/SKILL.md | Referenced as "optionally run" — may not exist |
| `validate-graph.sh` | meta-builder/SKILL.md | Referenced as "optionally run" — may not exist |
| `analyze-ci.sh` | Previous doc (invented) | Does NOT exist |
| `apply-fix.sh` | Previous doc (invented) | Does NOT exist |

### Cross-skill references that actually exist:

| From Skill | References | To Skill/Reference |
|-----------|-----------|-------------------|
| meta-builder | references/01-mindsnetwork-graph.md | Graph structure |
| meta-builder | references/02-deterministic-control.md | Execution protocol |
| meta-builder | references/03-long-horizon-persistence.md | Session recovery |
| meta-builder | references/04-skills-chaining.md | Skill stacking |
| meta-builder | references/05-hivefiver-agent.md | Hivefiver agent |
| user-intent-interactive-loop | references/01-question-protocols.md | Question patterns |
| user-intent-interactive-loop | references/02-context-preservation.md | Persistence |
| user-intent-interactive-loop | references/03-brainstorming-patterns.md | Ideation |
| user-intent-interactive-loop | references/04-long-session-management.md | Extended sessions |
| user-intent-interactive-loop | references/05-worked-examples.md | Examples |
| use-authoring-skills | references/03-three-patterns.md | Skill patterns |
| use-authoring-skills | references/05-skill-quality-matrix.md | Quality scoring |
| use-authoring-skills | references/07-iterative-refinement.md | Refactoring |
| use-authoring-skills | references/08-conflict-detection.md | Overlap detection |
| use-authoring-skills | references/09-script-authoring.md | Script writing |
| use-authoring-skills | references/10-eval-lifecycle.md | Eval writing |
| use-authoring-skills | references/11-description-optimization.md | Trigger fixes |
| use-authoring-skills | references/12-anti-deception.md | Anti-deception |
| coordinating-loop | references/01-handoff-protocols.md | Context transfer |
| coordinating-loop | references/02-sequential-vs-parallel.md | Execution modes |
| coordinating-loop | references/03-parent-child-cycles.md | Nested agents |
| coordinating-loop | references/04-ralph-loop-integration.md | Ralph-loop |

### Known issues in the current codebase:

| Issue | Impact | Location |
|-------|--------|----------|
| researcher.md and explore.md are near-identical (410 lines each, same content) | Confusing — two agents that do the same thing | .opencode/agents/researcher.md, .opencode/agents/explore.md |
| oh-my-openagent-reference copy/ is a stale duplicate | Wasted space, potential confusion | .opencode/skills/oh-my-openagent-reference copy/ |
| 4 trash skills in .opencode/trashskills/ | Clutter | .opencode/trashskills/ |
| .opencode/plugins/ and .opencode/rules/ are empty directories | Incomplete setup | .opencode/plugins/, .opencode/rules/ |
| deep-research-synthesis-repomix.md is 620 lines (reference doc, not standard command) | Unusual command format | .opencode/commands/deep-research-synthesis-repomix.md |

---

## Quick Reference: Which Command Does What

| Command | What it does | Who runs it |
|---------|-------------|-------------|
| `/plan` | Enter planning mode — agent interviews you to build a detailed plan | conductor |
| `/start-work` | Execute a task plan — reads task_plan.md and runs pending phases | conductor |
| `/ultrawork` | Full autonomous orchestration — explores, plans, executes until done | conductor |
| `/deep-init` | Generate AGENTS.md files for project directories | (script-based) |
| `/harness-doctor` | Run health check on harness installation | conductor |
| `/deep-research-synthesis-repomix` | Deep research with Repomix synthesis | (reference doc) |

---

## Quick Reference: Which Agent Does What

| Agent | Role | Can it edit files? | Can it spawn subagents? |
|-------|------|-------------------|----------------------|
| coordinator | Primary orchestrator — routes, delegates, tracks | Only .md and .json | Yes (task: allow) |
| conductor | Primary orchestrator — intent classification, delegation | No (edit: ask, write: ask) | Yes (delegate-task: allow) |
| hivefiver | Orchestrator — MINDNETWORK graph traversal | Only .md and .json | Yes (task: allow) |
| researcher | Read-only investigation | Only .md and .json | No (task: ask) |
| explore | Read-only investigation (near-identical to researcher) | Only .md and .json | No (task: ask) |
| builder | Code implementation | Yes (edit/write/bash: allow) | No (task: ask) |
| critic | Quality verification | No (edit/write: ask) | No (task: ask) |

---

## Quick Reference: Skill Loading Order

```
Background skills (load first, always):
  1. opencode-platform-reference — platform capabilities
  2. repomix-exploration-guide — codebase exploration
  3. opencode-non-interactive-shell — shell strategy

Core skill hierarchy (load in order):
  Layer 0: meta-builder — routes intent
  Layer 1: user-intent-interactive-loop — confirms intent
  Layer 2: planning-with-files — creates planning files
  Layer 3: coordinating-loop — dispatches subagents
  Layer 4: use-authoring-skills — domain execution

Reference skills (load as needed):
  - oh-my-openagent-reference — oh-my-openagent codebase
  - repomix-explorer — repomix CLI usage
```

---

*End of document. 8 use cases across 4 categories, all based on actual code, actual scripts, actual agent definitions.*
