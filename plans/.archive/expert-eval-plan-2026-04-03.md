# Expert Real-World Eval Ecosystem

**Branch:** `expert-eval-ecosystem`
**Description:** Build a system of real-world expert-level eval scenarios that test all 5 skills individually and as a connected ecosystem — not mere script checks, but full natural-use-case simulations that prove the harness works end-to-end.

## Goal

Create a comprehensive eval system that tests the 5-skill ecosystem in realistic, expert-level usage scenarios. Current evals only cover basic trigger/no-trigger classification (25 test cases, all 3-8 word prompts, no assertions, no script execution, no end-to-end chains). This plan adds: (1) 15+ realistic expert scenarios across individual skills, (2) 5 end-to-end chain evals exercising LAYER 0→4, (3) an eval runner harness that actually executes scripts and compares outputs, and (4) agentskills.io-compliant eval schemas with assertions, input files, and benchmark tracking.

## Implementation Steps

### Step 1: Define Eval Schema Upgrade + Runner Harness
**Files:** `.skills-lab/refactoring-skills/eval-harness/`, `.skills-lab/refactoring-skills/*/evals/evals.json` (all 5)
**What:** Create the eval runner infrastructure: a bash script (`eval-runner.sh`) that reads evals.json, executes the relevant scripts (preflight.sh, intent-verify.sh, check-gate.sh, validate-gate.sh, etc.) with mock inputs, compares actual vs expected output, and produces a results report. Also upgrade all 5 evals.json to agentskills.io schema: add `assertions` arrays, `files` references, and `id` fields.
**Testing:** Run `eval-runner.sh` against existing 25 evals — all should produce pass/fail results with evidence strings.

### Step 2: Create Realistic Expert Eval Scenarios — Individual Skills (3 per skill = 15 total)
**Files:** `.skills-lab/refactoring-skills/*/evals/evals.json` (append 3 per skill), `.skills-lab/refactoring-skills/eval-harness/fixtures/` (mock state files)
**What:** Add 3 expert-level eval scenarios per skill with realistic prompts (20-50 words, file paths, context, backstory). Each scenario includes:
- A realistic user prompt (not 3-8 words — actual complex requests)
- Mock state files (intent.json, task_plan.md, loaded-skills.json, coordination envelopes)
- Assertions that verify script outputs, file creation, and state transitions
- Expected gate pass/fail results

**meta-builder expert evals:**
- E1: "Turn this 200-line command file into a skill for my team" with @file reference → GROUP_2, route to use-authoring-skills + stack skill-creator
- E2: "I have 4 different skill creation requests — audit one, create one, fix one, convert one" → GROUP scoring with 4 stacked skills
- E3: "Is this a skill creation task? @src/auth/login.ts — the JWT validation is wrong" → should NOT trigger (bug fix, not skill work)

**user-intent-interactive-loop expert evals:**
- E1: "I want to improve our skill authoring process but I'm not sure where to start — we have 12 skills across 3 platforms" → PROBE phase, 3 questions, intent.json with 6 conditions
- E2: "We were working on the deep-research skill yesterday, what was the status?" → UNDERSTAND phase, read planning files, resume from checkpoint
- E3: "Build a new CLI tool for our team — it needs to parse markdown, generate PDFs, and upload to Notion" → PROBE → scope bounded → delegate to coordinating-loop

**planning-with-files expert evals:**
- E1: "Plan out a new API documentation skill with 8 reference files, 3 platform targets, and a validation pipeline" → init-session, 5+ phases, task_plan.md with Goal
- E2: "Continue where we left off — last session we finished phase 2 but the test harness failed" → resume, goal-refresh, strike tracking
- E3: "The test harness keeps failing with a TypeError on line 42 of validate-skill.sh" → 3-strike protocol, escalation after 3 attempts

**coordinating-loop expert evals:**
- E1: "Create 3 reference files for the deep-research skill in parallel, then validate them all against the agentskills.io spec" → parallel dispatch, 3 envelopes, ralph-loop validation
- E2: "Update SKILL.md first, then update all 12 reference files to match the new frontmatter format" → sequential (shared mutable state), G1→G5 gate chain
- E3: "Fix the validation errors from the last ralph-loop cycle — there are 3 critical issues in the frontmatter" → ralph-loop, max 3 cycles, escalation

**use-authoring-skills expert evals:**
- E1: "Convert this markdown command file into a fully compliant skill with frontmatter, references, scripts, and evals" → create path, P2 pattern, full STEP 1→10 checklist
- E2: "Audit this skill pack — it has 56 flaws according to the failure analysis. Fix all CRITICAL and HIGH issues" → audit path, quality matrix, iterative fix loop
- E3: "This skill never triggers when I ask for it — optimize the description, triggers, and eval queries" → fix-triggers path, trigger optimization, train/validation split

**Testing:** Run each eval scenario through eval-runner.sh. Each must produce pass/fail with evidence.

### Step 3: Create End-to-End Chain Evals (5 scenarios exercising LAYER 0→4)
**Files:** `.skills-lab/refactoring-skills/eval-harness/chain-evals/`, `.skills-lab/refactoring-skills/eval-harness/fixtures/chain-*`
**What:** 5 full-chain evals that simulate real expert workflows from start to finish. Each chain eval exercises the complete loading order and data flow:

**Chain-1: "Create a new skill from scratch"**
- User: "Create a skill for API rate limiting that works across OpenCode and Claude Code"
- LAYER 0: meta-builder routes → use-authoring-skills + skill-creator
- LAYER 1: user-intent-interactive-loop PROBEs → intent.json with scope/success/constraints
- LAYER 2: planning-with-files creates task_plan.md with 5 phases
- LAYER 3: coordinating-loop dispatches parallel agents for references + scripts
- LAYER 4: use-authoring-skills creates complete skill pack, validates, commits
- Assertions: loaded-skills.json has correct order, intent.json has 6 conditions, task_plan.md has Goal, coordination envelopes valid, final skill passes validate-skill.sh

**Chain-2: "Audit and fix an existing skill"**
- User: "Audit the meta-builder skill — it's not routing correctly for multi-intent requests"
- LAYER 0: meta-builder routes → use-authoring-skills (audit path)
- LAYER 1: user-intent-interactive-loop UNDERSTANDs → reads existing state
- LAYER 2: planning-with-files resumes session, adds fix phases
- LAYER 3: coordinating-loop dispatches sequential agents (audit → fix → validate)
- LAYER 4: use-authoring-skills runs audit, identifies issues, fixes, re-validates
- Assertions: audit report generated, issues categorized by severity, fixes applied, re-validation passes

**Chain-3: "Convert a command file into a skill"**
- User: "@file commands/rate-limiter.md — turn this into a skill"
- LAYER 0: meta-builder routes → use-authoring-skills (create from template)
- LAYER 1: user-intent-interactive-loop PROBEs → confirms scope
- LAYER 2: planning-with-files creates session with conversion phases
- LAYER 3: coordinating-loop dispatches parallel agents for frontmatter + references + scripts
- LAYER 4: use-authoring-skills converts, validates, optimizes triggers
- Assertions: input file parsed, frontmatter compliant, references generated, scripts functional, triggers optimized

**Chain-4: "Session recovery after /clear"**
- User: "/clear" then "continue where we left off on the deep-research skill"
- LAYER 0: meta-builder routes → planning-with-files (resume)
- LAYER 1: user-intent-interactive-loop UNDERSTANDs → reads progress.md, task_plan.md
- LAYER 2: planning-with-files goal-refresh, resumes from last completed phase
- LAYER 3: coordinating-loop checks gate status, resumes from last valid checkpoint
- LAYER 4: use-authoring-skills continues from last validated state
- Assertions: session state recovered, no data loss, goal-refresh triggered, checkpoint restored

**Chain-5: "Multi-skill stacked workflow"**
- User: "Create a new skill, then set up a test harness for it, then optimize its triggers"
- LAYER 0: meta-builder routes → use-authoring-skills + stacks coordinating-loop + planning-with-files
- LAYER 1: user-intent-interactive-loop PROBEs → confirms 3-part scope
- LAYER 2: planning-with-files creates task_plan.md with 3 sections
- LAYER 3: coordinating-loop orchestrates sequential phases (create → test → optimize)
- LAYER 4: use-authoring-skills executes each phase with validation gates
- Assertions: 3 phases completed in order, each phase validated before next, final skill passes all gates

**Testing:** Each chain eval runs through eval-runner.sh with `--chain` flag. Must verify state transitions between layers.

### Step 4: Create Mock State Fixtures + Eval Runner
**Files:** `.skills-lab/refactoring-skills/eval-harness/fixtures/`, `.skills-lab/refactoring-skills/eval-harness/eval-runner.sh`, `.skills-lab/refactoring-skills/eval-harness/run-all.sh`
**What:** 
- Create mock state fixtures for each eval scenario (intent.json, task_plan.md, loaded-skills.json, coordination envelopes, etc.)
- Build eval-runner.sh that: sets up fixture state → runs relevant scripts → captures stdout/stderr → compares against assertions → produces results JSON
- Build run-all.sh that runs all evals (individual + chain) and produces a summary report with pass rates, timing, and evidence
- Output format: `results/{eval-name}/with_skill/results.json` and `results/{eval-name}/without_skill/results.json` (agentskills.io workspace structure)

**Testing:** `run-all.sh` executes all 40 evals (25 existing + 15 individual expert + 5 chain) and produces a benchmark report.

### Step 5: Create Benchmark Tracking + Iteration Loop
**Files:** `.skills-lab/refactoring-skills/eval-harness/benchmark.json`, `.skills-lab/refactoring-skills/eval-harness/feedback.json`, `.skills-lab/refactoring-skills/eval-harness/iterate.sh`
**What:**
- benchmark.json aggregates pass_rate, time, tokens per configuration (per-skill and per-chain)
- feedback.json template for human review of each eval result
- iterate.sh runs the improvement loop: run evals → review failures → fix skills/scripts → rerun → compare
- Train/validation split for trigger queries (60/40 split, 3 runs per query)
- Trigger optimization: max 5 iterations, select by validation pass rate

**Testing:** Run iterate.sh with a known-broken eval — should detect failure, allow fix, rerun, and show improvement delta.

## Dependencies

- All P0/P1/P2 fixes from previous phases must be committed and deployed
- External skills (opencode-platform-reference, repomix-exploration-guide, opencode-non-interactive-shell) must exist on disk — or the eval harness must mock their absence gracefully

## Success Criteria

1. All 40 evals (25 existing + 15 expert individual + 5 chain) pass with evidence
2. eval-runner.sh produces machine-readable results with assertions, timing, and evidence
3. Chain evals verify state transitions between all 5 layers
4. Benchmark report shows pass rates per skill and per chain
5. iterate.sh demonstrates improvement loop (run → fix → rerun → compare)
6. All evals use agentskills.io-compliant schema (skill_name, evals, prompt, expected_output, assertions, files)
