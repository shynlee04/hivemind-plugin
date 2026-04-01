# OpenCode Harness — User Stories and Use Cases

**Document:** user-stories-2026-04-02.md  
**Version:** 3.0  
**Date:** 2026-04-02  
**Status:** Platform-Grounded Specification (v3.0 Corrected)  

---

## 1. Actor Definitions

| Actor | Description |
|-------|-------------|
| **Human User** | Developer or engineer interacting with the OpenCode CLI to accomplish software engineering tasks |
| **Conductor Agent** | Primary orchestrator agent (Tab-cycle accessible, `primary` mode) that receives user requests, classifies intent, and delegates to specialists via the harness `delegate-task` custom tool. Combines OMO's Prometheus (intent classification + routing) and Atlas (session lifecycle management) roles for MVP. Known trade-off documented in LIM-010 — future iterations may split into separate Planner and Executor agents |
| **Researcher Agent** | Specialist agent for codebase investigation, pattern discovery, and evidence gathering (read-only) |
| **Builder Agent** | Specialist agent for code implementation, bug fixes, and refactoring (full write access) |
| **Critic Agent** | Specialist agent for code review, correctness verification, and test execution (read-only + bash for tests) |
| **OpenCode Platform** | The host runtime that loads the harness plugin, fires events, manages session lifecycle, and provides SDK client |
| **Harness Plugin** | The control-plane plugin (`HarnessControlPlane`) registered via `@opencode-ai/plugin` that hooks into platform lifecycle events, registers custom tools (`delegate-task`, `context-checkpoint_save`, `context-checkpoint_restore`), manages delegation, and enforces guardrails |

---

## 2. Epic: Delegated Multi-Agent Orchestration

### US-001: User Submits a Task

**As a** Human User  
**I want to** describe a software engineering task in natural language  
**So that** the system can classify intent, route by category/complexity, and delegate to the appropriate specialist agent

**Traces to:** AGT-002, AGT-003, AGT-004, CAT-001–CAT-009

**Acceptance Criteria:**
- [ ] User can describe a task at the OpenCode CLI prompt
- [ ] The Conductor agent receives the task and classifies intent into one of: research, implement, review, plan, hybrid (AGT-003)
- [ ] For `plan` and `hybrid` intents, the Conductor handles the task in the main session
- [ ] For `research`, `implement`, and `review` intents, the Conductor delegates via the harness's `delegate-task` custom tool (registered via plugin `tool()` factory — NOT the platform's built-in Task tool) (AGT-004, PERM-008)
- [ ] The Conductor routes tasks through category-based routing with 4 categories matching the requirements (CAT-001):
  - `research` — codebase investigation: researcher agent, temperature 0.1, steps 60 (CAT-003)
  - `implementation` — code changes: builder agent, temperature 0.15, steps 80 (CAT-004)
  - `review` — code verification: critic agent, temperature 0.05, steps 40 (CAT-005)
  - `visual-engineering` — UI/visual tasks: builder agent, temperature 0.25 (CAT-006, P1)
- [ ] An explicit agent parameter overrides a category's default agent (CAT-007). Conflicting agent + category combinations generate a warning but use the explicit agent (CAT-008)
- [ ] The Conductor reads relevant wisdom files before delegating
- [ ] The delegation includes all 6 sections in the prompt: TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT (CAT-009)

**Edge Cases:**
- E-001: Ambiguous intent — Conductor makes a reasonable assumption and proceeds (in `/ultrawork` mode) or asks clarifying questions (in `/plan` mode)
- E-002: Task exceeds delegation depth limit (3 levels) — Conductor receives an error and handles it gracefully (GRD-001, GRD-007)
- E-003: Descendant budget exhausted (10 per root) — Conductor receives an error and informs the user. The limit is configurable via the harness-internal `MAX_DESCENDANTS` constant, NOT a platform-provided setting (GRD-002, GRD-008)
- E-004: Invalid agent name specified — System rejects with validation error

---

### US-002: Research Specialist Investigates Codebase

**As a** Conductor Agent  
**I want to** delegate investigation tasks to the Researcher agent via the harness's `delegate-task` custom tool  
**So that** I get thorough, evidence-based findings without risking file modifications

**Traces to:** AGT-001, AGT-005, PERM-004, TOOL-001–TOOL-005, CAT-009

**Acceptance Criteria:**
- [ ] Researcher agent receives a prompt with all 6 delegation sections: TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT (CAT-009)
- [ ] Researcher operates in read-only mode: denied `edit`, `write`, `bash` permissions. Allowed tools: `read`, `glob`, `grep`, `list`, `webfetch`, `websearch`, `codesearch` (AGT-005)
- [ ] Researcher is denied ALL task spawning via `"task": { "*": "deny" }` permission glob pattern — cannot spawn any subagent type (PERM-004)
- [ ] [AGENT INSTRUCTION] Researcher follows the 5-phase methodology: Scope → Broad Sweep → Deep Read → Cross-Reference → Synthesize
- [ ] [AGENT INSTRUCTION] Every claim in the Researcher's output cites file:line references
- [ ] Researcher runs on the configured model with temperature 0.1 (CAT-003)
- [ ] Researcher is limited to 60 max steps via agent's `steps` config (AGT-009)
- [ ] The delegation prompt includes `EXPECTED OUTCOME`: "Evidence-based findings with file:line citations for every claim"
- [ ] The delegation prompt includes `MUST DO`: "Follow 5-phase methodology, cite all references"
- [ ] The delegation prompt includes `MUST NOT DO`: "Do not fabricate results, do not modify files, do not skip citation of sources"

**Edge Cases:**
- E-005: No matching files found for search patterns — [AGENT INSTRUCTION] Researcher reports insufficiency rather than fabricating results
- E-006: Contradictory evidence discovered — [AGENT INSTRUCTION] Researcher reports all contradictory evidence, not just confirming evidence
- E-007: Search yields too many results — [AGENT INSTRUCTION] Researcher narrows scope and reports filtering strategy
- E-008: Harness circuit breaker trips (16 consecutive similar calls) — Session is terminated with an error. This is separate from the platform's `doom_loop` permission action (GRD-004)

---

### US-003: Builder Agent Implements Code Changes

**As a** Conductor Agent  
**I want to** delegate implementation tasks to the Builder agent via the harness's `delegate-task` custom tool  
**So that** code changes are made atomically, following existing patterns, with proper verification

**Traces to:** AGT-001, AGT-006, PERM-005, TOOL-001–TOOL-005, CAT-009

**Acceptance Criteria:**
- [ ] Builder agent receives a prompt with all 6 delegation sections: TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT (CAT-009)
- [ ] Builder has full file modification access (`edit`, `write` allowed) and shell access (`bash` allowed) (AGT-006)
- [ ] Builder is denied ALL task spawning via `"task": { "*": "deny" }` permission glob pattern — all delegation routes through the conductor's `delegate-task` custom tool (PERM-005)
- [ ] [AGENT INSTRUCTION] Builder follows the 5-step workflow: Read Everything → Map Patterns → Plan Change → Implement Atomically → Verify
- [ ] [AGENT INSTRUCTION] Builder matches existing code style (indentation, naming, import ordering, error handling patterns)
- [ ] [AGENT INSTRUCTION] Builder makes atomic changes — one change at a time, verifying after each
- [ ] [AGENT INSTRUCTION] Builder does NOT introduce orphaned code, placeholder code, or unnecessary dependencies
- [ ] [AGENT INSTRUCTION] Builder does NOT add comments unless explicitly requested
- [ ] Builder runs on the configured model with temperature 0.15 (CAT-004)
- [ ] The delegation prompt includes `EXPECTED OUTCOME`: "Atomic code changes matching existing patterns, verified with tests"
- [ ] The delegation prompt includes `MUST DO`: "Read target files first, make one change at a time, verify after each change"
- [ ] The delegation prompt includes `MUST NOT DO`: "Do not leave orphaned code, do not add placeholder TODOs, do not skip verification"

**Edge Cases:**
- E-009: File to modify does not exist — [AGENT INSTRUCTION] Builder reports an error rather than creating it unexpectedly
- E-010: Existing patterns are inconsistent — [AGENT INSTRUCTION] Builder follows the majority pattern and notes the inconsistency
- E-011: Test suite fails after change — [AGENT INSTRUCTION] Builder attempts to fix the failure before reporting completion
- E-012: Harness circuit breaker trips (16 consecutive similar calls via `tool.execute.before` hook) — Session is terminated. Platform's `doom_loop` permission is set to `"allow"` so the platform does not double-abort at its 3-identical-call detection. The harness circuit breaker at threshold 16 is a SEPARATE mechanism (GRD-004, PERM-002)

---

### US-004: Critic Agent Verifies Code Changes

**As a** Conductor Agent  
**I want to** delegate review tasks to the Critic agent via the harness's `delegate-task` custom tool  
**So that** every code change is verified for correctness, security, performance, and convention compliance

**Traces to:** AGT-001, AGT-007, PERM-006, TOOL-001–TOOL-005, CAT-009

**Acceptance Criteria:**
- [ ] Critic agent receives a prompt with all 6 delegation sections: TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT (CAT-009)
- [ ] Critic operates in read-only file access mode: denied `edit` and `write` permissions, but allowed `bash` restricted to test execution (AGT-007)
- [ ] Critic is denied ALL task spawning via `"task": { "*": "deny" }` permission glob pattern (PERM-006)
- [ ] [AGENT INSTRUCTION] Critic follows the 8-step review process: Understand Contract → Read Diff → Verify Acceptance Criteria → Correctness Check → Security Check → Performance Check → Conventions Check → Run Tests
- [ ] [AGENT INSTRUCTION] Critic marks each acceptance criterion as MET or NOT MET with file:line evidence
- [ ] [AGENT INSTRUCTION] Critic categorizes findings as Critical (must fix), Warning (should fix), or Info (nice to have)
- [ ] [AGENT INSTRUCTION] Critic returns a verdict: PASS, FAIL, or CONDITIONAL
- [ ] Critic runs on the configured model with temperature 0.05 (near-deterministic) (CAT-005)
- [ ] Critic is limited to 40 max steps via agent's `steps` config (AGT-009)
- [ ] The delegation prompt includes `EXPECTED OUTCOME`: "Comprehensive review with file:line evidence, categorized findings, and clear verdict"
- [ ] The delegation prompt includes `MUST DO`: "Read all changed files, verify all acceptance criteria, run tests if available"
- [ ] The delegation prompt includes `MUST NOT DO`: "Do not approve changes without evidence, do not skip security checks, do not ignore test failures"

**Edge Cases:**
- E-013: No diff to review — [AGENT INSTRUCTION] Critic reports that no changes were found
- E-014: Test suite does not exist — [AGENT INSTRUCTION] Critic notes the absence of tests as a finding
- E-015: Critical security vulnerability found — [AGENT INSTRUCTION] Critic marks as FAIL and provides specific remediation steps
- E-016: Conditional verdict — [AGENT INSTRUCTION] Critic specifies the exact conditions that must be met for a PASS

---

### US-005: Conductor Synthesizes Results

**As a** Human User  
**I want to** receive a synthesized summary of all specialist work  
**So that** I understand what was done, what was found, and what remains

**Traces to:** AGT-002, LIF-001, BGT-001

**Acceptance Criteria:**
- [ ] After all delegated sessions complete, the Conductor collects results from each specialist
- [ ] [AGENT INSTRUCTION] The Conductor verifies results against the original task requirements
- [ ] [AGENT INSTRUCTION] The Conductor resolves any conflicts between specialist outputs
- [ ] The Conductor updates the plan status (`task_plan.md`) after each phase
- [ ] [CODE-ENFORCED] The Conductor records wisdom (learnings, decisions, issues) to `.harness/wisdom/` directory
- [ ] The Conductor presents a final summary to the user

**Edge Cases:**
- E-017: A delegated session fails — Conductor handles the failure, reports it, and decides whether to retry or escalate
- E-018: Multiple specialists produce conflicting findings — [AGENT INSTRUCTION] Conductor resolves conflicts and notes the resolution rationale
- E-019: Background session does not complete within timeout (180s) — Conductor reports the timeout with full status context

---

## 3. Epic: Command Workflows

### US-006: Strategic Planning Mode (`/plan`)

**As a** Human User  
**I want to** enter planning mode before implementation  
**So that** complex work is broken down into phases with clear acceptance criteria before any code is changed, including mandatory gap analysis and plan review

**Traces to:** CMD-001, CMD-005, PLN-001–PLN-004

**Acceptance Criteria:**
- [ ] User types `/plan` at the OpenCode CLI (CMD-001)
- [ ] The Conductor agent activates in planning mode (runs in the main session, not as a subtask)
- [ ] [AGENT INSTRUCTION] The Conductor uses interview-mode planning with clearance-check criteria:
  - Clarification dimensions required before planning: scope, constraints, dependencies, acceptance criteria, success metrics
  - How Conductor determines sufficient context: reads clearance-check list after each response, auto-transitions to planning when all dimensions are satisfied
  - Defaults/assumptions protocol if user cannot provide clarity: proceed with documented assumptions and flag for review during execution
- [ ] The Conductor researches the codebase to understand the current state
- [ ] The Conductor creates `task_plan.md` with numbered phases, acceptance criteria, and dependencies (CMD-005)
- [ ] The Conductor presents the plan to the user for approval
- [ ] The Conductor directs the user to run `/start-work` to begin execution
- [ ] Planning stays separate from execution — no code changes are made during planning
- [ ] Before final plan generation, Conductor delegates to Researcher for gap analysis via `delegate-task` custom tool (PLN-001, PLN-002)
- [ ] After plan generation, Conductor delegates to Critic for plan review via `delegate-task` custom tool (PLN-003, PLN-004)

**Edge Cases:**
- E-020: User provides insufficient context — [AGENT INSTRUCTION] Conductor uses clearance-check criteria to ask specific clarifying questions rather than making assumptions
- E-021: Task is trivial (≤3 steps) — [AGENT INSTRUCTION] Conductor notes that planning may be unnecessary but still creates a lightweight plan
- E-022: Existing `task_plan.md` found — [AGENT INSTRUCTION] Conductor reads it and offers to update or create a new one

---

### US-006a: Gap Analysis Before Plan Finalization

**As a** Conductor Agent  
**I want to** have a specialist review the draft plan for gaps before presenting it to the user  
**So that** hidden assumptions, ambiguities, and missing edge cases are caught early

**Traces to:** PLN-001, PLN-002, PLN-004

**Acceptance Criteria:**
- [ ] After Conductor generates a draft plan, a specialist (Researcher) reviews it via `delegate-task` custom tool
- [ ] [AGENT INSTRUCTION] The specialist checks for: hidden assumptions, ambiguous acceptance criteria, missing dependencies, unaddressed edge cases, AI-slop patterns
- [ ] [AGENT INSTRUCTION] The specialist reports findings as: Critical (must fix before proceeding), Warning (should fix), Info (nice to address)
- [ ] [AGENT INSTRUCTION] Conductor incorporates critical findings into the plan before presenting to the user
- [ ] [AGENT INSTRUCTION] Non-critical findings are noted in the plan for awareness during execution

---

### US-006b: Plan Review Before Approval

**As a** Conductor Agent  
**I want to** have a specialist validate the plan quality before presenting it to the user  
**So that** file references exist, acceptance criteria are testable, and all requirements are addressed

**Traces to:** PLN-003, PLN-004

**Acceptance Criteria:**
- [ ] After gap analysis and plan refinement, a specialist (Critic) reviews the plan via `delegate-task` custom tool (PLN-003)
- [ ] [AGENT INSTRUCTION] The specialist validates: 100% of file references exist, 80%+ of tasks have explicit sources, 90%+ have concrete acceptance criteria
- [ ] [AGENT INSTRUCTION] The specialist reviews for: logical flow, testability, feasibility, completeness (PLN-004)
- [ ] [AGENT INSTRUCTION] The specialist returns a verdict: APPROVED, NEEDS_REVISION, or REJECTED with specific issues
- [ ] [AGENT INSTRUCTION] Conductor only presents the plan to the user after Critic approval

---

### US-007: Plan Execution (`/start-work`)

**As a** Human User  
**I want to** execute an approved plan  
**So that** each phase is completed by the appropriate specialist and progress is tracked

**Traces to:** CMD-002, CMD-006

**Acceptance Criteria:**
- [ ] User types `/start-work` at the OpenCode CLI (CMD-002)
- [ ] The Conductor reads `task_plan.md` and identifies pending phases
- [ ] The Conductor creates or updates `.harness/boulder.json` for structured task state: plan reference, current phase, completed phases, errors, continuation context
- [ ] For each pending phase, the Conductor delegates via the harness's `delegate-task` custom tool (registered via plugin `tool()` factory) to the appropriate specialist agent (AGT-004, PERM-008)
- [ ] Per-delegation tool restrictions are enforced via the plugin's `tool.execute.before` hook, which inspects the current session's delegation metadata and rejects tool calls outside the delegated agent's permitted tool set (PERM-007)
- [ ] All specialist agents have `task: { "*": "deny" }` preventing re-delegation (PERM-004, PERM-005, PERM-006)
- [ ] The Conductor updates the plan status after each phase (in_progress → complete) in both `task_plan.md` and `.harness/boulder.json`
- [ ] The Conductor logs errors encountered in the plan file
- [ ] The Conductor supports resumption via `progress.md` — if interrupted, it picks up where it left off by reading `.harness/boulder.json` for structured state (CMD-006)
- [ ] The `progress.md` file serves as human-readable summary only; authoritative state lives in `.harness/boulder.json`

**Edge Cases:**
- E-023: No `task_plan.md` exists — Conductor reports that no plan is available and suggests running `/plan` first
- E-024: A phase fails — Conductor logs the error, marks the phase as failed in `.harness/boulder.json`, and asks the user how to proceed
- E-025: Session interrupted mid-phase — Conductor reads `.harness/boulder.json` on resumption and continues from the last completed phase

---

### US-008: Fully Autonomous Orchestration (`/ultrawork`)

**As a** Human User  
**I want to** delegate a task for fully autonomous execution  
**So that** the system handles everything from intent classification through verification without requiring my input at each step

**Traces to:** CMD-003, CMD-007

**Acceptance Criteria:**
- [ ] User types `/ultrawork` followed by a task description (CMD-003)
- [ ] The Conductor classifies intent without asking clarifying questions (CMD-007)
- [ ] The Conductor explores the codebase to understand context
- [ ] The Conductor creates a plan internally
- [ ] The Conductor executes each phase via the harness's `delegate-task` custom tool with appropriate specialists
- [ ] The Conductor verifies results via the Critic agent after each implementation phase
- [ ] The Conductor iterates on failures until the task is complete or a hard limit is reached
- [ ] The Conductor presents a final report to the user

**Edge Cases:**
- E-026: Task requires human judgment — Conductor makes a reasonable assumption and proceeds, noting the assumption in the final report
- E-027: Harness circuit breaker trips (16 consecutive similar calls) — Session is terminated. Platform's `doom_loop` permission is set to `"allow"` (the platform detects at 3 identical calls but does not prompt/block because the action is "allow"). The harness circuit breaker in `tool.execute.before` is a separate, richer mechanism (GRD-004, PERM-002)
- E-028: All retries exhausted — Conductor reports the final state with all errors encountered

---

### US-009: Harness Diagnostics (`/harness-doctor`)

**As a** Human User  
**I want to** run a health check on the harness system  
**So that** I can verify all components are properly configured and functioning

**Traces to:** CMD-004

**Acceptance Criteria:**
- [ ] User types `/harness-doctor` at the OpenCode CLI
- [ ] The Conductor runs a 5-point grounded health check (CMD-004):
  1. **Plugin loaded** — Verify the harness plugin is loaded and registered
  2. **Continuity store valid** — Verify the continuity file exists and is valid JSON
  3. **Agent files exist** — Verify agent definition files exist for conductor, researcher, builder, and critic
  4. **Command files exist** — Verify command files exist for `/plan`, `/start-work`, and `/ultrawork`
  5. **Skill files exist** — Verify skill files exist for required skills
- [ ] The Conductor reports pass/fail for each check with details

**Edge Cases:**
- E-029: Plugin not loaded — Doctor reports failure and suggests checking the plugin path in opencode.json
- E-030: Agent files missing — Doctor reports which files are missing and their expected locations
- E-031: Continuity file corrupted — Doctor reports that the file is not valid JSON

---

## 4. Epic: Session Lifecycle and Continuity

### US-010: Delegated Session Creation

**As a** Conductor Agent  
**I want to** create a child session with proper permission boundaries via the harness's `delegate-task` custom tool  
**So that** the specialist agent operates within its designated capabilities

**Traces to:** TOOL-001–TOOL-005, GRD-001–GRD-008, PERM-001–PERM-008, SDK-001–SDK-007, CON-001, BUD-001

**Acceptance Criteria:**
- [ ] The `delegate-task` tool accepts parameters: `category` (required), `task` (required), `agent` (optional override), `model` (optional override), `temperature` (optional override), `context` (optional additional context) (TOOL-001)
- [ ] The tool resolves routing via the routing module to determine effective agent, model, and temperature (TOOL-002)
- [ ] The tool enforces guardrails: depth limit (max 3), descendant budget (max 10 per root), circuit breaker state (TOOL-003, GRD-001, GRD-002)
- [ ] The tool creates a child session via `client.session.create({ title })` and prompts it via `client.session.prompt({ body: { model, parts } })` (TOOL-004, SDK-001)
- [ ] The tool formats the delegation prompt using the 6-section template (TOOL-005, CAT-009)
- [ ] The system walks the parent chain to determine the current delegation depth (GRD-001)
- [ ] The system rejects the request if depth exceeds 3 (GRD-007)
- [ ] The system identifies the root session for harness-internal descendant budget tracking (BUD-001)
- [ ] The system reserves a slot in the root's descendant budget via harness-internal state management (`state.ts` Map-based storage), NOT via any platform API (BUD-001)
- [ ] The system acquires a harness-internal concurrency queue slot via the concurrency module (`concurrency.ts`) with per-key limits. This is a harness-owned abstraction, NOT a platform-provided API (CON-001)
- [ ] The system dispatches the prompt (sync or async based on mode) using `client.session.prompt()` (SDK-002)
- [ ] The system records continuity metadata to durable storage (harness-managed JSON file on disk)

**Edge Cases:**
- E-032: Child session creation fails — System rolls back the harness-internal budget reservation and rethrows the error (BUD-001)
- E-033: Child session creation succeeds but continuity record write fails — System handles partial state (budget committed but no continuity record)
- E-034: Parent chain contains a cycle — System detects the cycle and prevents infinite traversal (EVT-005)
- E-035: Harness-internal concurrency lane is at capacity — System queues the request and waits for a slot to open (CON-006)
- E-036: Dispatch fails — System patches the lifecycle to `failed`, releases the queue, and rethrows

---

### US-011: Session Completion Detection

**As a** Harness Plugin  
**I want to** detect when a delegated session has completed  
**So that** I can return results to the caller and clean up resources

**Traces to:** LIF-001–LIF-006, EVT-001–EVT-006, BGT-001–BGT-004, SDK-002

**Acceptance Criteria:**
- [ ] For synchronous delegation: System uses `client.session.prompt()` and awaits the result (SDK-002, LIF-005)
- [ ] For asynchronous delegation: System uses `client.session.prompt()` combined with `client.event.subscribe()` SSE stream listening for session completion events (SDK-002, LIF-006, EVT-001)
- [ ] SSE is the primary completion detection mechanism; polling is used as degraded-mode fallback only if SSE connection fails (LIF-006)
- [ ] System throws on timeout with full status context
- [ ] System updates the lifecycle phase throughout the observation period (LIF-001)
- [ ] System releases the harness-internal concurrency queue slot on completion or failure (CON-001)
- [ ] System patches the lifecycle state to `completed` or `failed` (LIF-001)
- [ ] The `failed` status is sticky — once failed, idle/completed signals do NOT override (LIF-003)

**Edge Cases:**
- E-037: Session completes without assistant output — System throws an error indicating no output was produced
- E-038: Background observer fails — System adds a warning but does not throw (non-blocking) (BGT-004)
- E-039: Session status transitions from running to failed — System detects the failure and patches the lifecycle accordingly
- E-040: Session status is sticky failed — System does not override a failed status with subsequent idle/completed signals (LIF-003)

---

### US-012: Session Continuity Persistence

**As a** Harness Plugin  
**I want to** persist session state to disk  
**So that** session context survives process restarts and context compaction

**Traces to:** PER-001–PER-009, ARCH-007

**Acceptance Criteria:**
- [ ] State changes are persisted to a harness-managed continuity JSON file on disk with debouncing (default 100ms batch window), flushing synchronously on critical state changes (session completion, error states) (PER-003)
- [ ] The continuity file path is configurable via harness-specific environment variables (`OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE`). These are harness-internal configuration variables, NOT platform-native environment variables (PER-001, ARCH-007)
- [ ] On plugin initialization, the system loads the continuity store from disk (PER-002)
- [ ] All reads from the continuity store return deep clones (no mutation leaks) (PER-004)
- [ ] Invalid records are silently dropped during normalization (PER-005)
- [ ] Corrupt JSON files result in an empty store (no crash) (PER-006)
- [ ] Missing or empty files result in an empty store (PER-007)
- [ ] The system supports partial updates (patch) to continuity records (PER-008)

**Edge Cases:**
- E-041: Disk write fails — System continues with in-memory state but loses durability guarantee
- E-042: Continuity file is corrupted by an external process — System detects the parse failure and starts with an empty store (PER-006)
- E-043: Concurrent writes to continuity file — Debouncing (100ms batch window) reduces write frequency; synchronous flush on critical changes prevents data loss (PER-003)

---

### US-013: Context Checkpoint Save and Restore

**As an** AI Agent  
**I want to** save my working context before context compaction  
**So that** I can restore my state after the context window is pruned

**Traces to:** CHK-001–CHK-005, TOOL-006–TOOL-011

**Acceptance Criteria:**
- [ ] Agent calls the `context-checkpoint_save` tool (a harness-registered custom tool via plugin `tool()` factory, NOT a platform primitive) with: summary (required), active files (optional), pending tasks (optional), decisions (optional), errors (optional) (CHK-001, TOOL-006)
- [ ] The tool persists the checkpoint to a separate harness-managed JSON file (not the continuity store) keyed by session ID (CHK-003, TOOL-007)
- [ ] Each session has exactly one checkpoint — new saves overwrite the previous one (CHK-004, TOOL-008)
- [ ] Agent calls the `context-checkpoint_restore` tool (also a harness-registered custom tool) after compaction (CHK-001, TOOL-009)
- [ ] The tool reads the checkpoint and returns formatted markdown with all saved state (TOOL-010)
- [ ] If no checkpoint exists for the given session, the tool returns a clear "no checkpoint found" message (TOOL-011)
- [ ] The checkpoint storage path is configurable via the harness-specific `OPENCODE_HARNESS_STATE_DIR` environment variable (CHK-005)

**Edge Cases:**
- E-044: No checkpoint exists for the session — Restore tool reports that no checkpoint was found (TOOL-011)
- E-045: Checkpoint file is corrupted — Restore tool handles parse errors gracefully
- E-046: Agent saves multiple checkpoints — Each new save overwrites the previous one (no history) (CHK-004)

---

### US-014: Tool Call Budget Enforcement

**As a** System Operator  
**I want to** limit the number of tool calls per session  
**So that** runaway sessions cannot consume unlimited resources

**Traces to:** GRD-003

**Acceptance Criteria:**
- [ ] The system counts every tool call per session
- [ ] The system enforces a maximum of 400 tool calls per session (GRD-003)
- [ ] When the budget is exceeded, the system throws an error and aborts execution
- [ ] The budget count is included in the `_harness` metadata injected into tool outputs
- [ ] Platform's `doom_loop` permission is set to `"allow"` (a permission action, NOT a configurable threshold). The platform always detects at 3 consecutive identical tool calls; setting the action to `"allow"` means it does NOT prompt the user. The harness's own circuit breaker at threshold 16 is a separate, richer detection mechanism (PERM-002, GRD-004)

**Edge Cases:**
- E-047: Session is at budget-1 calls and makes 2 calls in rapid succession — System catches overflow on the budget+1st call
- E-048: Budget enforcement interacts with circuit breaker — Circuit breaker at 16 similar calls may trip before the 400-call budget is reached (by design)

---

### US-015: Circuit Breaker for Tool Call Loops

**As a** System Operator  
**I want to** detect and halt repeated semantically similar tool calls  
**So that** agent loops are caught before they consume resources

**Traces to:** GRD-004, GRD-005, PERM-002

**Acceptance Criteria:**
- [ ] The system creates a stable signature for each tool call (tool name + serialized args) (GRD-005)
- [ ] The system counts consecutive similar signatures
- [ ] After 16 consecutive similar calls (configurable threshold), the harness-internal circuit breaker trips (GRD-004)
- [ ] The circuit breaker is implemented in the plugin's `tool.execute.before` hook — NOT using the platform's `doom_loop` mechanism (GRD-004)
- [ ] When tripped, the system throws an error and aborts execution
- [ ] The loop detection state is included in the `_harness` metadata
- [ ] **Architectural separation:** The platform's `doom_loop` is a permission action (allow/ask/deny) that detects at exactly 3 consecutive identical calls (same tool name + same serialized arguments). Setting `"doom_loop": "allow"` in root permissions prevents the platform from prompting the user — it silently permits. The harness circuit breaker is a SEPARATE mechanism at threshold 16 that catches semantically similar patterns. These two mechanisms serve different purposes and coexist (PERM-002, GRD-004)

**Edge Cases:**
- E-049: Agent makes 15 similar calls, then a different call, then repeats — Counter resets on the different call
- E-050: Tool args are semantically identical but serialized differently — Stable stringify ensures deterministic comparison (GRD-005)
- E-051: Args contain unserializable values — System returns `<unserializable>` and continues

---

### US-016: Concurrency Control for Delegated Sessions

**As a** System Operator  
**I want to** limit concurrent sessions per model/agent/category  
**So that** the system does not overwhelm the API or host machine

**Traces to:** CON-001–CON-006

**Acceptance Criteria:**
- [ ] The system implements harness-internal lane-based async concurrency queues with per-key limits. Functions like `acquire()`, `release()`, and queue management are in `src/lib/concurrency.ts` and are harness-owned abstractions, NOT platform-provided APIs (CON-001)
- [ ] Queue keys are built deterministically from model/agent/category with priority: model > agent+category > agent > category > default (CON-002)
- [ ] Default limit is 3–5 concurrent executions per lane, configurable per lane key pattern (CON-003)
- [ ] When a lane is at capacity, new requests are queued (CON-006)
- [ ] Queued requests are dispatched in FIFO order when a slot opens
- [ ] Double-release is handled idempotently — no-op on second release (CON-004)
- [ ] Lanes are auto-deleted when idle (active=0 and pending=0) (CON-005)

**Edge Cases:**
- E-052: Multiple requests for the same lane arrive simultaneously — System queues them and dispatches one at a time (CON-006)
- E-053: Release is called twice for the same acquisition — Second release is a no-op (CON-004)
- E-054: Lane has pending requests and process crashes — Pending requests are lost (harness-internal in-memory only)

---

## 5. Epic: Wisdom and Learning

### US-017: Cross-Task Wisdom Accumulation

**As a** Conductor Agent  
**I want to** record and retrieve learnings across tasks  
**So that** the system improves over time and does not repeat mistakes

**Traces to:** SKL-003, SKL-007

**Acceptance Criteria:**
- [ ] The system maintains a `.harness/wisdom/` directory with three files:
  - `learnings.md` — patterns discovered, conventions, gotchas (with date stamps)
  - `decisions.md` — architecture decisions with context, options, chosen, rationale
  - `issues.md` — recurring problems with symptom, root cause, fix
- [ ] [AGENT INSTRUCTION] When spawning a subagent, the system injects relevant wisdom into its prompt via agent instructions
- [ ] [AGENT INSTRUCTION] Only relevant wisdom is injected (not the entire file) — keyword-based filtering
- [ ] Wisdom entries are date-stamped
- [ ] The `wisdom-accumulation` skill enforces cleanup rules: remove entries older than 7 days, merge duplicates, keep files under 100 lines (SKL-007, P1)

**Edge Cases:**
- E-055: Wisdom file does not exist — System creates it on first write
- E-056: Wisdom file exceeds size limits — The `wisdom-accumulation` skill guides cleanup (SKL-007)
- E-057: Duplicate wisdom entries — Skill guides merging (SKL-007)

---

## 6. Epic: Context Management

### US-018: Context Compaction with State Preservation

**As an** AI Agent  
**I want to** retain awareness of my operational state after context window pruning  
**So that** I can continue working effectively without losing track of delegation state

**Traces to:** CTX-001–CTX-004, NFR-005

**Acceptance Criteria:**
- [ ] Before context compaction, the system injects a structured harness state snapshot via the platform's `experimental.session.compacting` plugin hook using `output.context.push()` (CTX-001, CTX-004)
- [ ] The snapshot includes: delegation metadata, lifecycle state, queue status, warnings, continuity data (CTX-002)
- [ ] The snapshot is formatted as structured text that the agent can parse and use
- [ ] After compaction, the agent has awareness of: root session ID, delegation depth, specialist agent, category, model, concurrency key, effective prompt state, continuity status, lifecycle phase

**Edge Cases:**
- E-058: Compaction occurs during an active delegation — System captures the current state snapshot before pruning
- E-059: Snapshot exceeds compaction budget — System prioritizes the most critical fields (delegation metadata, lifecycle phase)
- E-060: Compaction hook throws an error — System handles the failure gracefully without crashing the session (wrapped in try/catch at plugin level)

---

### US-019: Metadata Injection into Tool Outputs

**As an** AI Agent  
**I want to** see my operational context in every tool response  
**So that** I can self-monitor my resource usage and delegation state

**Traces to:** CTX-003, CTX-004

**Acceptance Criteria:**
- [ ] Every tool output includes a `_harness` metadata object
- [ ] [PRIMARY MECHANISM] The metadata is injected via `tool.execute.before` hook as a pre-amble in the tool arguments (visible in agent context)
- [ ] [EXPERIMENTAL] If `tool.execute.after` supports output modification, the metadata is appended to the tool's response body (platform capability not confirmed)
- [ ] The metadata includes: total tool calls, warnings, loop detection state, delegation metadata (root session, depth, budget, agent, category, model, concurrency key), effective prompt state, continuity status, lifecycle snapshot
- [ ] The metadata is machine-parseable (structured format)
- [ ] The metadata is visible to the agent without modifying the tool's actual output behavior

**Edge Cases:**
- E-061: Tool output is already in a structured format — System appends `_harness` as an additional field via `tool.execute.before` argument injection
- E-062: Tool output is plain text — System appends `_harness` metadata as a trailing block via `tool.execute.before` argument injection
- E-063: `tool.execute.after` output modification fails — System falls back to argument injection mechanism

---

## 7. Epic: Shell Safety

### US-020: Non-Interactive Shell Execution

**As a** System Operator  
**I want to** ensure all shell commands complete without human input  
**So that** agents can run headless without hanging on interactive prompts

**Traces to:** GRD-006

**Acceptance Criteria:**
- [ ] [MECHANISM 1 — ENVIRONMENT INJECTION] The system sets environment variables via the platform's `shell.env` plugin hook: `output.env.CI = true`, `output.env.GIT_TERMINAL_PROMPT = 0`, `output.env.NO_COLOR = 1`, `output.env.TERM = dumb` (GRD-006)
- [ ] [MECHANISM 2 — COMMAND INTERCEPTION] The system intercepts and rejects interactive commands via `tool.execute.before` hook
- [ ] The system bans interactive commands: vim, vi, nano, less, more, man, top, htop, btop
- [ ] The system bans interactive interpreters without non-interactive flags
- [ ] The system bans ssh/telnet without `-c` flag
- [ ] The system bans apt without `-y` flag
- [ ] The system bans sudo without `-n` flag
- [ ] Risky commands are wrapped with `timeout`
- [ ] The system enforces banned commands at the code level via `tool.execute.before` hook, not just through agent instructions

**Edge Cases:**
- E-064: Agent attempts to use a banned command — System rejects the command and suggests a non-interactive alternative
- E-065: Command hangs indefinitely — Timeout wrapper terminates the command after the configured duration

---

## 8. Epic: Background Task Management

### US-021: Cancel a Running Delegated Session

**As a** Conductor Agent  
**I want to** cancel a running delegated session that is misbehaving or no longer needed  
**So that** I can reclaim resources and prevent runaway execution

**Traces to:** BGT-001, BGT-002, SDK-006

**Acceptance Criteria:**
- [ ] The system provides a harness-internal background task manager API with cancel capability (BGT-001)
- [ ] The system supports task cancellation via the platform's `client.session.abort()` method (BGT-002, SDK-006)
- [ ] The system marks the session as `cancelled` in the lifecycle state
- [ ] The system releases the harness-internal concurrency slot occupied by the cancelled session
- [ ] The system updates `.harness/boulder.json` to reflect the cancellation
- [ ] The system returns a summary of what was accomplished before cancellation

**Edge Cases:**
- E-066: Session does not exist — System reports an error
- E-067: Session is already completed — System reports that cancellation is not needed

---

### US-022: Harness-Internal Spawn Capacity Tracking

**As a** Conductor Agent  
**I want to** understand how many delegation slots are available  
**So that** I can make informed decisions about parallel delegation

**Traces to:** BUD-001, CON-001

**Acceptance Criteria:**
- [ ] The harness-internal descendant budget tracker (in `state.ts`) provides visibility into available budget per root session (BUD-001)
- [ ] The harness-internal concurrency module (in `concurrency.ts`) provides visibility into per-lane active and pending counts (CON-001)
- [ ] The conductor can query this harness-internal state to determine if delegation is feasible before committing to session creation
- [ ] Capacity tracking is entirely harness-internal — there are no platform APIs for spawn capacity

**Edge Cases:**
- E-068: No capacity available — System reports which lanes are at capacity and current queue lengths
- E-069: Race condition between capacity query and session creation — Harness-internal budget uses reserve/commit/rollback semantics to handle this (BUD-001)

---

### US-023: Harness-Internal Concurrency Slot Acquisition

**As a** System Operator  
**I want to** ensure concurrency slots are acquired before session creation  
**So that** I avoid race conditions where multiple delegations compete for limited resources

**Traces to:** CON-001, BUD-001

**Acceptance Criteria:**
- [ ] The harness-internal concurrency module (`concurrency.ts`) provides `acquire()` and `release()` functions for lane-based slot management (CON-001)
- [ ] The harness-internal budget tracker (`state.ts`) provides reserve/commit/rollback semantics for descendant budget (BUD-001)
- [ ] Before session creation, the system acquires a concurrency slot and reserves a budget slot via these harness-internal mechanisms
- [ ] On session creation failure, the system rolls back both reservations
- [ ] On session creation success, the slot remains reserved until session completion
- [ ] These are harness-internal abstractions — there are no platform APIs for concurrency slot management

**Edge Cases:**
- E-070: Acquisition succeeds but session creation fails — System rolls back both concurrency slot and budget reservation (BUD-001)
- E-071: Double release for same slot — Idempotent handling, second release is a no-op (CON-004)

---

## 9. Cross-Cutting Concerns

### 9.1 Error Handling Across All User Stories

| Scenario | System Behavior |
|----------|----------------|
| Child session creation fails | Rollback harness-internal budget reservation, release harness-internal concurrency slot, rethrow error to caller (BUD-001, CON-001) |
| Dispatch fails | Patch lifecycle to `failed`, release harness-internal queue, rethrow |
| Background observer fails | Add warning (non-blocking), continue (BGT-004) |
| Continuity file corrupted | Return empty store, no crash (PER-006) |
| Checkpoint file corrupted | Handle parse error gracefully, report to agent |
| Tool call budget exceeded (400) | Throw error, abort session execution (GRD-003) |
| Harness circuit breaker trips (16 similar) | Throw error, abort session execution (GRD-004) |
| Harness-internal concurrency queue full | Queue request, wait for slot (CON-006) |
| Parent chain cycle detected | Detect and prevent infinite traversal (EVT-005) |
| SDK API call fails | Throw last error with context (SDK-005) |
| Disk write fails | Continue with in-memory state, lose durability |
| Invalid continuity record | Silently drop during normalization (PER-005) |
| `tool.execute.before` hook fails | Abort operation, rethrow error to prevent malformed state |
| `tool.execute.after` hook fails | Log warning, continue (non-blocking) |
| Compaction hook fails | Handle gracefully, prevent session crash |

### 9.2 State Consistency Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| In-memory state matches disk state | Debounced writes (100ms) with synchronous flush on critical changes (PER-003) |
| No mutation leaks from continuity reads | Deep clones on all reads (PER-004) |
| Budget accuracy | Harness-internal two-phase commit (reserve → commit/rollback) in `state.ts` (BUD-001) |
| Idempotent queue release | `released` flag prevents double-release (CON-004) |
| Sticky failed status | Once failed, idle/completed signals do not override (LIF-003) |
| Cycle-free parent chains | Visited set during parent chain traversal (EVT-005) |

### 9.3 Performance Characteristics

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Continuity read (cached) | O(1) | In-memory map lookup (NFR-006) |
| Continuity read (cold) | O(n) | Disk read + parse + normalize |
| Continuity write | O(n) | JSON write (debounced 100ms) |
| Harness-internal queue acquire | O(1) amortized | Async wait if lane full (CON-001) |
| Harness-internal queue release | O(1) | Process next pending or decrement |
| Parent chain walk | O(d) | d = depth, max 3 (GRD-001) |
| Tool signature generation | O(k) | k = serialized args size (GRD-005) |
| Route resolution | O(1) | Map lookup |

### 9.4 SDK Error Handling Strategy

The harness uses the `@opencode-ai/sdk` client passed to the plugin via the `client` parameter. The following are actual platform SDK methods (Section 9 of requirements):

- **Session CRUD:** `client.session.create()`, `client.session.get()`, `client.session.list()`, `client.session.delete()`, `client.session.update()`, `client.session.prompt()`, `client.session.abort()`, `client.session.share()`, `client.session.children()`, `client.session.messages()`
- **Events:** `client.event.subscribe()` — returns SSE stream
- **TUI:** `client.tui.appendPrompt()`, `client.tui.showToast()`, `client.tui.executeCommand()`
- **App:** `client.app.log()`, `client.app.agents()`

| Scenario | Handling Strategy |
|----------|------------------|
| SDK call fails | Throw last error with context (SDK-005) |
| Session not found | Log error, abort operation, inform user |
| SSE connection fails | Fall back to polling as degraded mode (LIF-006) |
| `client.session.abort()` fails | Log error, continue cleanup of harness-internal state |

---

## 10. OMO Pattern Coverage

This section documents alignment with OMO (Open Multi-Agent Orchestration) proven patterns.

### MP-1: 3-Agent Planning Pipeline — **RESOLVED**

**OMO Pattern:** Prometheus (interview-based strategic planner with clearance checks) → Metis (gap analyzer) → Momus (plan reviewer)

**Implementation:**
- US-006: Interview-mode planning with clearance-check criteria (dimensions: scope, constraints, dependencies, acceptance criteria, success metrics)
- US-006a: Gap Analysis — delegated to Researcher via `delegate-task` custom tool before plan finalization
- US-006b: Plan Review — delegated to Critic via `delegate-task` custom tool before plan approval
- Auto-transition from interview to planning when clearance-check satisfied

**Status:** All 3 agents represented as formal user stories with acceptance criteria

---

### MP-2: 6-Section Delegation Prompt — **RESOLVED**

**OMO Pattern:** TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT

**Implementation:**
- US-001 AC-8: Mandates all 6 sections for delegation (CAT-009)
- US-002, US-003, US-004: Acceptance criteria verify that delegation prompts include all 6 sections
- Each specialist story includes explicit `EXPECTED OUTCOME`, `MUST DO`, and `MUST NOT DO` examples

**Status:** All 6 sections mandated across all delegation user stories

---

### MP-3: Category-Based Routing — **RESOLVED**

**OMO Pattern:** Category-based routing mapping to agent/model/temperature combinations

**Implementation:**
- US-001: Category-based routing with 4 categories matching the requirements (CAT-001):
  - `research` → researcher agent, temperature 0.1 (CAT-003)
  - `implementation` → builder agent, temperature 0.15 (CAT-004)
  - `review` → critic agent, temperature 0.05 (CAT-005)
  - `visual-engineering` → builder agent, temperature 0.25 (CAT-006)
- Explicit agent parameter overrides category default (CAT-007)
- Route resolution via routing module with source tracking (RTE-001–RTE-004)

**Status:** Category routing aligned with requirements (4 categories)

---

### MP-4: Interview-Mode Planning with Clearance Checks — **RESOLVED**

**OMO Pattern:** Prometheus uses structured interview protocol with clearance-check lists, auto-transitions to planning

**Implementation:**
- US-006: Clearance-check criteria defined (what dimensions must be clarified, how Conductor determines sufficient context, defaults/assumptions protocol)
- Conductor reads clearance-check list after each user response
- Auto-transition from interview to planning when all dimensions satisfied

**Status:** Interview-mode with clearance checks implemented

---

### MP-5: Model-Specific Prompt Variants — **NOT IMPLEMENTED (FUTURE ENHANCEMENT)**

**OMO Pattern:** Per-agent prompt variants for Claude, GPT, and Gemini models

**Current Implementation:** Single prompt templates for all models

**Known Limitation:** LIM-009 — Agent prompts lack model-specific variants

---

### MP-6: Plan-Scoped Notepad System — **PARTIALLY IMPLEMENTED**

**OMO Pattern:** Plan-scoped notepad directories with structured files per plan

**Current Implementation:**
- Global `.harness/wisdom/` directory (learnings.md, decisions.md, issues.md)
- Not plan-scoped — wisdom from one task is available across tasks

**Status:** Global wisdom implemented, plan-scoped notepads deferred to future iteration

---

### MP-7: Mandatory Pre-Plan Gap Analysis — **RESOLVED**

**OMO Pattern:** Metis consultation required before final plan generation

**Implementation:**
- US-006a: Gap Analysis — delegated to Researcher via `delegate-task` custom tool before plan finalization
- Reviews for: hidden assumptions, ambiguous acceptance criteria, missing dependencies, unaddressed edge cases

**Status:** Mandatory gap analysis implemented as formal user story

---

### MP-8: Background Task Lifecycle — **RESOLVED**

**OMO Pattern:** launch/track/cancel for full task lifecycle

**Implementation:**
- US-010: Delegated session creation via `delegate-task` custom tool
- US-011: Session completion detection via SSE events from `client.event.subscribe()`
- US-021: Cancel a running delegated session via `client.session.abort()`
- US-022, US-023: Harness-internal spawn capacity tracking and slot acquisition

**Status:** Full background task lifecycle management implemented

---

### Summary Matrix: OMO Pattern Alignment

| Pattern | Status | User Stories | Notes |
|---------|--------|-------------|-------|
| MP-1: 3-Agent Planning Pipeline | **RESOLVED** | US-006, US-006a, US-006b | All 3 agents formalized |
| MP-2: 6-Section Delegation Prompt | **RESOLVED** | US-001, US-002, US-003, US-004 | All 6 sections mandated |
| MP-3: Category-Based Routing | **RESOLVED** | US-001 | 4 categories aligned with requirements |
| MP-4: Interview-Mode Planning | **RESOLVED** | US-006 | Clearance-check criteria implemented |
| MP-5: Model-Specific Prompt Variants | **FUTURE** | — | Deferred (LIM-009) |
| MP-6: Plan-Scoped Notepad | **PARTIAL** | US-017 | Global wisdom, plan-scoped deferred |
| MP-7: Mandatory Gap Analysis | **RESOLVED** | US-006a | Formalized as user story |
| MP-8: Background Task Lifecycle | **RESOLVED** | US-010, US-011, US-021, US-022, US-023 | Full lifecycle |

---

## Validation History

### Version 3.0 Corrections (2026-04-02)

This version corrects all contradictions between the user stories and the platform-grounded requirements (v3.0).

| ID | Issue | Resolution |
|----|--------|------------|
| V3-1 | Delegation described as using "platform's built-in Task tool" | **Fixed:** All delegation now explicitly routes through the harness's `delegate-task` custom tool (registered via plugin `tool()` factory). US-001, US-002, US-003, US-004, US-007, US-008 updated. |
| V3-2 | Category routing listed 5 categories (quick, research, deep, writing, unspecified) not matching requirements | **Fixed:** Aligned with requirements CAT-001: 4 categories — `research`, `implementation`, `review`, `visual-engineering`. US-001 and MP-3 updated. |
| V3-3 | `doom_loop` described as "configurable threshold" or "triggers at 3" | **Fixed:** All doom_loop references now state it is a permission action (allow/ask/deny), not a threshold. Platform detects at 3 identical calls regardless; setting `"allow"` prevents user prompts. US-014, US-015, E-012, E-027 updated. |
| V3-4 | `reserveConcurrencySlot()` and `getAvailableSpawnCapacity()` referenced as if platform APIs | **Fixed:** US-010, US-022, US-023 rewritten to describe these as harness-internal mechanisms in `concurrency.ts` and `state.ts`. All invented API names removed. |
| V3-5 | Custom tools (`delegate-task`, `context-checkpoint_*`) treated as platform primitives | **Fixed:** US-013 now explicitly states these are "harness-registered custom tools via plugin `tool()` factory, NOT platform primitives." US-010 updated similarly. |
| V3-6 | Environment variables (`OPENCODE_HARNESS_STATE_DIR`, etc.) presented as platform-native | **Fixed:** US-012, US-013 now specify these are "harness-specific environment variables, NOT platform-native environment variables" per ARCH-007. |
| V3-7 | `/harness-doctor` described as aspirational 8-point health diagnostics | **Fixed:** US-009 reduced to 5 concrete, testable checks matching CMD-004: plugin loaded, continuity file valid, agent files exist, command files exist, skill files exist. |
| V3-8 | Permission model described `delegate-task` as denied via `permission.task` glob | **Fixed:** All specialist agents use `task: { "*": "deny" }` to prevent ANY subagent spawning (PERM-004/005/006). The `delegate-task` custom tool is a separate mechanism from the platform's `task` tool. Per-delegation restrictions are enforced via `tool.execute.before` hook (PERM-007). |
| V3-9 | Missing [AGENT INSTRUCTION] tags on non-code-enforceable criteria | **Fixed:** Added [AGENT INSTRUCTION] tags to all acceptance criteria that are agent instruction quality bars, not code-enforceable. |
| V3-10 | Missing requirement traceability on stories | **Fixed:** Added "Traces to:" field to every user story linking to specific requirement IDs. |
| V3-11 | SDK error handling section referenced invented error types | **Fixed:** Section 9.4 now only references actual SDK methods from the requirements. Removed invented error type names. |
| V3-12 | Conductor role description unclear about MVP trade-off | **Fixed:** Actor definitions updated to state conductor combines Prometheus + Atlas for MVP, referencing LIM-010. |

### Previous Validation (Version 2.0)

**Auditor:** Architecture Validator  
**Date:** 2026-04-02  
**Method:** User-story-by-user-story validation against OpenCode platform capabilities and OMO proven patterns.

### CRITICAL Issues — **RESOLVED (v2.0)**

#### C-1: Custom delegate-task vs Built-in Task Tool
**Original Finding:** User stories stated custom `delegate-task` bypassing platform's Task tool

**Fix Applied (v2.0):** Updated to use platform's Task tool for delegation.

**Further Correction (v3.0):** The v2.0 fix was itself incorrect. The requirements clearly state that `delegate-task` IS a harness-registered custom tool (PERM-008, TOOL-001). Delegation goes through this custom tool, which internally uses `client.session.create()` + `client.session.prompt()` (SDK methods). The platform's built-in `task` tool is set to `"ask"` at root level to prevent bypassing the harness (PERM-003). All specialist agents have `task: { "*": "deny" }` to prevent any subagent spawning.

---

#### C-2: Platform's Built-in doom_loop vs Custom Circuit Breaker
**Original Finding:** Overlapping safety nets not acknowledged

**Fix Applied (v2.0):** Added architectural decision noting the coexistence.

**Further Correction (v3.0):** Clarified that `doom_loop` is a permission ACTION (allow/ask/deny), not a configurable threshold. The platform always detects at 3 identical calls. Setting `"allow"` prevents user prompts. The harness circuit breaker at 16 is a separate mechanism in `tool.execute.before`.

---

#### C-3: US-019 Metadata Injection — Platform Hook Capability Unclear
**Original Finding:** Feasibility of `tool.execute.after` output modification not confirmed

**Fix Applied:** Specified primary mechanism as `tool.execute.before` hook. `tool.execute.after` output modification marked as EXPERIMENTAL.

**Status:** ✅ RESOLVED

---

## Summary Matrix: Post-Validation Alignment

| Dimension | Requirements | User Stories | Status |
|-----------|-------------|-------------|--------|
| Agent count | 4 (conductor + 3 specialists) | 4 agents | Aligned ✅ |
| Delegation mechanism | `delegate-task` custom tool via plugin `tool()` factory | Routes through `delegate-task` | Aligned ✅ |
| Delegation prompt | 6 sections (CAT-009) | All 6 sections mandated | Aligned ✅ |
| Planning pipeline | 3-phase (plan → gap analysis → review) | US-006, US-006a, US-006b | Aligned ✅ |
| Category routing | 4 categories (research, implementation, review, visual-engineering) | 4 categories | Aligned ✅ |
| Concurrency | Harness-internal lane-based (CON-001) | Harness-internal acquire/release | Aligned ✅ |
| Circuit breaker | Harness-internal at threshold 16 (GRD-004) | Harness-internal in `tool.execute.before` | Aligned ✅ |
| doom_loop | Permission action "allow" (PERM-002) | Documented as permission action | Aligned ✅ |
| Tool budget | 400 per session (GRD-003) | 400 per session | Aligned ✅ |
| Custom tools | Plugin-registered via `tool()` (PERM-008, CHK-001) | Described as plugin-registered | Aligned ✅ |
| Environment variables | Harness-specific (ARCH-007) | Marked as harness-specific | Aligned ✅ |
| `/harness-doctor` | 5 concrete checks (CMD-004) | 5 concrete checks | Aligned ✅ |
| Shell safety | `shell.env` hook (GRD-006) | Two mechanisms documented | Aligned ✅ |
| State persistence | Harness-managed JSON on disk (PER-001) | Harness-managed continuity file | Aligned ✅ |
| Conductor role | Combines Prometheus + Atlas for MVP (AGT-002, LIM-010) | Documented as MVP trade-off | Aligned ✅ |
| SDK methods | Real methods only (Section 9) | Real methods only | Aligned ✅ |

---

## Overall Assessment

**The user stories document is now fully aligned with the platform-grounded requirements (v3.0).** All corrections from the v3.0 requirements validation have been applied:

1. ✅ Delegation routes through the harness's `delegate-task` custom tool (plugin-registered via `tool()` factory), NOT the platform's built-in Task tool
2. ✅ `doom_loop` is documented as a permission action (allow/ask/deny), NOT a configurable threshold
3. ✅ All custom tools (`delegate-task`, `context-checkpoint_*`) described as harness-registered, not platform primitives
4. ✅ No invented platform API references (`reserveConcurrencySlot()`, `getAvailableSpawnCapacity()` removed)
5. ✅ All environment variables marked as harness-specific, not platform-native
6. ✅ `/harness-doctor` reduced to 5 concrete, testable checks
7. ✅ Conductor's MVP role combination (Prometheus + Atlas) documented with LIM-010 reference
8. ✅ Only real SDK methods referenced
9. ✅ Category routing aligned to 4 categories from requirements
10. ✅ Every user story traces to specific requirement IDs
11. ✅ Agent instruction quality bars marked with `[AGENT INSTRUCTION]` tags
12. ✅ OMO pattern coverage updated to match corrected requirements
