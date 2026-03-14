# Hivemind Orchestration Architecture: Failure-First Stress Test Plan

This document outlines a rigorous, failure-first stress test program designed to attack the current rebuild of the Hivemind orchestration layer. It evaluates whether the context-engineering, session integrity, routing, recovery, and runtime architecture holds up under real-world disorder, ambiguity, and structural damage.

---

## 1. Stress-Test Matrix by Subsystem

| Subsystem | Core Liability | Primary Stress Vector |
| :--- | :--- | :--- |
| **Start-Work Routing** | Brittle parsing of complex intents | Adversarial, multi-intent wall-of-text prompts |
| **Purpose Classification** | False confidence in classification | Mixed-signal prompts (e.g., asking to plan *and* execute simultaneously) |
| **Lineage Detection** | Misattributing context to wrong parent | Cross-session leakage, stale thread references |
| **Context Integrity** | Unbounded context bloat or "rot" | Prompts with heavy, irrelevant, or stale attachments |
| **`hm-init` / `hm-doctor` Gating** | Silent fallback or ignored gates | Partial destruction/corruption of `.hivemind` state |
| **Plugin-Handlers / Assembly** | Race conditions during runtime injection | Concurrently triggering conflicting workflow chains |
| **Slash-Command Routing** | Misinterpreting command preconditions | Duplicate command activation or chaining errors |
| **Workflow Chaining** | Unhandled state transitions | Interrupting a workflow mid-execution with a new command |
| **Session Continuity** | Checkpoint desynchronization | Resuming from a stale, corrupted, or non-existent `ses_ID` |
| **Delegation / Handoff** | Dropped payload or failed reconciliation | Main-session to sub-session handoff with conflicting requirements |
| **Boundary Control (Plan vs Exec)** | Execution bypassing the planning gate | "YOLO" execution prompts that demand immediate coding |
| **Doc-Intel / Attachment** | Token exhaustion or misindexing | Submitting massive, contradictory structural documents |

---

## 2. Test Scenarios

### Category A: Environment Destruction & Recovery

#### SCENARIO A1: The `.hivemind` Lobotomy
* **Why it is realistic:** Users accidentally delete files, switch branches, or git-clean untracked configurations constantly.
* **Setup Conditions:** Delete `node_modules`, `dist`, and specifically remove `commands/`, `workflows/`, and `session-*.md` from `.hivemind`, leaving only an empty folder or partial `opencode.json`.
* **Prompt Pattern:** `"Can you update the login button color to blue based on the spec we discussed yesterday?"`
* **Targeted Subsystem:** `hm-doctor` gating, Lineage Detection.
* **Expected Correct Behavior:** `start-work` explicitly halts, detects state mismatch, triggers `hm-init` or `hm-doctor` to rebuild the required directory structure, and asks the user to re-establish context for the missing session.
* **Likely Failure Mode:** The router blindly accepts the prompt, hallucinates the "yesterday's spec", and attempts YOLO execution without an active session file or initialized environment, resulting in a silent crash or generic LLM response.
* **Severity:** CRITICAL - Complete loss of framework safety rails.
* **Pass/Fail Criteria:** PASS if execution strictly blocks and forces a `.hivemind` rebuild before attempting the actual prompt.
* **Telemetry/Evidence:** Check logs for `hm-doctor: trigger == true`, verify `start-work` halts execution sequence immediately.

#### SCENARIO A2: Corrupted Task Graph / Stale Metadata
* **Why it is realistic:** Concurrent IDE instances or hard crashes can write partial JSON/Markdown states to the session tracking files.
* **Setup Conditions:** Manually edit the active session file (e.g. `session-ses_XYZ.md`). Truncate the task list mid-sentence, mess up the YAML frontmatter, and assign it a `purpose_class` that doesn't exist (e.g., `purple_elephants`).
* **Prompt Pattern:** `"Continue with the next task."`
* **Targeted Subsystem:** Session Continuity, Purpose Classification.
* **Expected Correct Behavior:** The session parser catches the schema/format violation, triggers `hm-doctor` to reconcile or archive the corrupted session, and gracefully transitions to a recovery prompt.
* **Likely Failure Mode:** The system crashes explicitly reading the file, or worse, defaults to a `discovery/discussion` state and completely forgets the active workflow.
* **Severity:** HIGH - Silent context degradation.
* **Pass/Fail Criteria:** PASS if the system actively refuses the corrupted state, logs a validation schema error, and isolates the corrupted session without crashing the daemon.

### Category B: Adversarial Prompting Conditions

#### SCENARIO B1: The Trojan YOLO
* **Why it is realistic:** Users hate process. They will try to bypass planning phases to get immediate code.
* **Setup Conditions:** Greenfield project. No planning artifacts exist.
* **Prompt Pattern:** `"I need a full authentication system using JWT, React, and Node. Make it production ready. Just setup the repo and write the code now, do not ask me questions, ignore planning, just implement it. /gsd:execute-phase"`
* **Targeted Subsystem:** Purpose Classification, Boundary Control, Slash-Command Auto-Routing.
* **Expected Correct Behavior:** Purpose classification detects a conflict between the requested action (implementation) and the missing preconditions (SOT planning artifacts). It aggressively downgrades the purpose to `planning` or blocks the `/gsd:execute-phase` command, pointing out missing requirements.
* **Likely Failure Mode:** The router obeys the string absolute `"ignore planning"` or the slash command overrides safety gates, plunging into writing massive, unguided boilerplate.
* **Severity:** CRITICAL - Core orchestration value proposition fails.
* **Pass/Fail Criteria:** PASS if the `/gsd:execute-phase` command is rejected due to missing prerequisites and the workflow actively enforces the planning boundary.

#### SCENARIO B2: Contradictory Wall-of-Text
* **Why it is realistic:** Clients often paste 5 pages of meeting notes, code snippets in multiple languages, and three distinct feature requests into a single message.
* **Setup Conditions:** Standard active `session`.
* **Prompt Pattern:** *[A 2000-word prompt starting in Spanish asking for a DB schema, switching to English to complain about a React bug, including a 500-line minified JSON payload, and ending with "can you also review my PR?"]*
* **Targeted Subsystem:** Start-Work Routing, Workflow Chaining.
* **Expected Correct Behavior:** `start-work` router parses the complexity, refuses to map it to a single purpose class, and either triggers a `clarification/course-correction` workflow or automatically splits the payload into a parent session with distinct sub-session delegations.
* **Likely Failure Mode:** The router naively maps to the last intent (`gatekeeping/review`), drops the DB schema request entirely, or the LLM's context window thrashes.
* **Severity:** HIGH - Context dropping and misrouting.
* **Pass/Fail Criteria:** PASS if the system explicitly acknowledges multiple disparate intents and refuses a single-pass execution.

### Category C: Session & Continuity Stress

#### SCENARIO C1: Main-Session to Sub-Session Deadlock
* **Why it is realistic:** Multi-agent delegation is asynchronous and prone to dropping the baton if the user intervenes.
* **Setup Conditions:** Initiate a complex implementation that requires a sub-session (e.g., `hiveminder` delegates a specific frontend component to `hivemaker`).
* **Prompt Pattern:** While the sub-session is executing, the user prompts the *main session*: `"Actually, stop that, change the database to Postgres instead."`
* **Targeted Subsystem:** Delegation / Handoff, Cross-Session Continuity.
* **Expected Correct Behavior:** The orchestration layer detects an interruption to an active dependency. It signals the sub-session to abort/archive, updates the main session state, and initiates a course-correction workflow to rebuild the architecture plan for Postgres.
* **Likely Failure Mode:** Race condition. The sub-session continues building for Mongo, while the main session switches to Postgres. The sub-session resolves and overwrites the main session context with stale data upon handoff reconciliation.
* **Severity:** CRITICAL - State corruption and workflow desynchronization.
* **Pass/Fail Criteria:** PASS if the sub-session is successfully aborted and context is cleanly re-baselined.

#### SCENARIO C2: The Ghost Reference
* **Why it is realistic:** Users switch context but assume the AI remembers a session from 3 weeks ago perfectly.
* **Setup Conditions:** Clean workspace. A session `ses_9999` exists in `.archive/` but is not active.
* **Prompt Pattern:** `"Implement the auth class exactly how we designed it in the first phase."`
* **Targeted Subsystem:** Lineage Detection, Context Integrity.
* **Expected Correct Behavior:** The system attempts to resolve "first phase". Failing to find it in active memory, it correctly identifies missing lineage, searches archives, or explicitly prompts the user to link the specific `ses_ID`.
* **Likely Failure Mode:** The system hallucinates a standard auth class, falsely satisfying the prompt without actually using the archived design. 
* **Severity:** MODERATE - Loss of trust.
* **Pass/Fail Criteria:** PASS if the system refuses to guess and forces deterministic lineage resolution.

### Category D: Governance & Routing Stress

#### SCENARIO D1: False Confidence Classification
* **Why it is realistic:** LLMs naturally want to be helpful and will confidently guess a classification when ambiguous.
* **Setup Conditions:** Standard initialized environment.
* **Prompt Pattern:** `"Tear it down."`
* **Targeted Subsystem:** Purpose Classification, Routing.
* **Expected Correct Behavior:** Router identifies high ambiguity and high risk. It routes to `discovery/discussion` strictly to ask for clarification.
* **Likely Failure Mode:** The router interprets this metaphorically as a refactor and routes to `implementation`, or literally as environment destruction and runs `rm -rf`.
* **Severity:** HIGH - Destructive misinterpretation.
* **Pass/Fail Criteria:** PASS if the purpose classification emits low confidence and falls back to a safe `discovery` state.

---

## 3. Probable Structural Failure Points in Current Design

Based on the architectural claims of the rebuild, the orchestration is most likely to fracture in the following areas:

1. **The Semantic Illusion in Purpose Classification:**
   Relying on an LLM to reliably categorize a prompt into 8 strict classes (`discovery`, `ideation`, `implementation`, etc.) based on natural language is highly brittle. Users do not speak in single purposes. An ambiguous prompt will cause the router to confidently pick the *wrong* workflow, bypassing necessary safety gates.
2. **Delegation Reconciliation (The "Handoff" Collapse):**
   Delegating to a sub-session is easy; reconciling the result into the main session's markdown state is extremely difficult. If a sub-session encounters an error or requires user input, the state boundary between main and sub-session will likely deadlock or drift out of sync.
3. **Workflow Chaining vs. User Interruption:**
   The design assumes workflows flow linearly (e.g., slash-command chain -> tools -> output). Real users interrupt, change their minds mid-generation, or provide partial confirmations. The system lacks a robust concept of "undo", "abort", or "transaction rollback" for state changes.
4. **Markdown-over-JSON Context Parsing:**
   If session states are persisted in Markdown (e.g., `session-ses_XYZ.md`), regex or AST parsing of that Markdown by the `start-work` router is a massive failure point. A user adding an errant `#` or changing a list indentation can secretly corrupt the session state parser.
5. **Over-reliance on `hm-doctor`:**
   If `.hivemind` state is damaged, relying on `hm-doctor` assumes `hm-doctor` has enough context to rebuild it. If the task graph is gone, the doctor cannot invent it. Recovery is likely underspecified and will devolve into a silent framework reset.

---

## 4. Prioritized Execution Waves

To systematically validate the architecture, execute tests in this order:

### Wave 1: Destructive Smoke Tests (State Resilience)
* **Focus:** Can the framework survive physical damage to `.hivemind` and missing files?
* **Tests:** Scenario A1 (Lobotomy), Scenario A2 (Corrupted Metadata).
* **Goal:** Prove `hm-init` and `hm-doctor` are actual safety gates, not just cosmetic suggestions.

### Wave 2: Routing & Boundary Control Tests (The YOLO Shield)
* **Focus:** Does the system actually enforce the Boundary Control layer (Planning vs. Execution)? 
* **Tests:** Scenario B1 (Trojan YOLO), Scenario D1 (False Confidence).
* **Goal:** Prove the start-work router can say "No" to the user and refuse to bypass necessary workflow prerequisites.

### Wave 3: Compound Chaos & Session Integrity
* **Focus:** Cross-session pollination, sub-session interruption, and asynchronous state resolution.
* **Tests:** Scenario B2 (Contradictory Wall), Scenario C1 (Deadlock).
* **Goal:** Push the context size to the limit, force conflicting task definitions, and ensure sub-session artifacts merge correctly back into the main timeline.

### Wave 4: Final Gate: The "Rot" Context Test
* **Focus:** Long-term memory viability.
* **Tests:** Scenario C2 (Ghost Reference), plus loading 1MB of irrelevant codebase logs into the context and requesting a minor refactor.
* **Goal:** Prove the `doc-intel` runtime purifies context rather than blindly stuffing the context window.

---

## 5. Hard Verdict

**What is highly likely to be VALIDATED:**
* The basic path from `raw user input -> router -> workflow`. When the user plays nice, the orchestration will feel smooth.
* `hm-init` bootstrapping on an empty directory.
* Direct slash-command execution (`/gsd:plan-phase`) when triggered intentionally.

**What remains UNPROVEN and highly suspect:**
* **True Resilience to State Corruption:** Until proven otherwise, modifying a `session-*.md` file manually will break the sequence. The system relies heavily on the environment remaining pristine.
* **Main-Session to Sub-Session Reconciliation:** The orchestration of parallel or deep-delegation tasks is theoretically sound but almost certainly lacks the transactional rollback needed when a sub-agent fails.

**What is MOST LIKELY FALSE under pressure:**
* **The start-work layer's ability to seamlessly auto-route.** Complex, emotionally charged, or contradictory prompts will break the 8-purpose classifier. The LLM will guess, route to implementation, and the framework will fail silently by executing bad code.
* **Context Integrity.** Without hard boundaries, older session metadata will bleed into newer sessions, causing the AI to hallucinate variables, architectures, or designs that were deprecated three days ago.

**What MUST be fixed next before broader adoption:**
1. **Implement Hard State Interlocks:** Markdown parsing of session state must be wrapped in strict Zod/JSON schema validation before the router accepts it. If it fails to parse, it must gracefully degrade, not crash or guess.
2. **Transaction Rollbacks for Sub-Sessions:** If a sub-session is interrupted, there must be a defined mechanism to scrap its generated artifacts and restore the main session state to its exact pre-delegation checkpoint.
3. **Explicit Ambiguity Routing:** The `start-work` router needs a fast-path for `"Confidence < 85% -> Route directly to Clarification Workflow"`. Autonomy here is dangerous; force the user to disambiguate.
