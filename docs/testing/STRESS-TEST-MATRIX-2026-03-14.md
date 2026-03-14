# HiveMind Rebuild Stress-Test Matrix

**Document Type**: Stress-Test Specification  
**Date**: 2026-03-14  
**Purpose**: Failure-first validation of orchestration architecture  
**Mode**: Rigorous, adversarial, architecture-focused  
**Author**: hiveminder (orchestrator)  
**Source Investigation**: 6-subagent codebase inventory  

---

## Executive Summary

This stress-test program is designed to expose the difference between architectural claims and implementation reality. The current rebuild claims sophisticated orchestration, but investigation reveals:

| Claimed | Implemented | Gap |
|---------|-------------|-----|
| `.hivemind/` state directory | Does NOT exist | 🔴 FATAL |
| Session lifecycle hooks | Archived, not active | 🔴 FATAL |
| CLI implementation (`src/cli.ts`) | Does NOT exist | 🔴 FATAL |
| `hm-init` / `hm-doctor` handlers | Guidance text only | 🔴 FATAL |
| Workflow chain execution | String literals, no executor | 🔴 FATAL |
| Session persistence | In-memory only | 🔴 FATAL |
| Context integrity checking | Empty stub | 🟠 HIGH |
| Tests | Import from non-existent files | 🔴 FATAL |

**Verdict**: The routing layer exists but has nowhere to route. Recovery, continuity, and workflow execution are unimplemented or archived.

---

## Part I: Stress-Test Matrix by Subsystem

### 1.1: START-WORK ROUTING SUBSYSTEM

#### Test SWR-01: Fresh User, No .hivemind

| Field | Value |
|-------|-------|
| **Scenario Name** | Fresh bootstrap detection |
| **Why Realistic** | Every new user or clean clone faces this state |
| **Setup** | Delete `.hivemind/` if exists; ensure clean repo |
| **User Input** | `"I want to plan a new feature for my project"` |
| **Targeted Subsystem** | `readiness-gates.ts`, `start-work-router.ts` |
| **Expected Correct Behavior** | Returns `hm-init` as BLOCKING gate; refuses to proceed until bootstrap |
| **Likely Failure Mode** | Router returns command ID but no CLI exists to execute it |
| **Severity** | 🔴 FATAL — User cannot proceed at all |
| **Pass Criteria** | Gate blocks, clear message, bootstrap command exists and runs |
| **Evidence to Capture** | Router output, gate status, CLI existence check |

#### Test SWR-02: Corrupt .hivemind State

| Field | Value |
|-------|-------|
| **Scenario Name** | State corruption detection |
| **Why Realistic** | Git merge conflicts, partial writes, version mismatches |
| **Setup** | Create `.hivemind/` with missing `state/` dir, broken `brain.json` |
| **User Input** | `"Continue the feature work from last session"` |
| **Targeted Subsystem** | `readiness-gates.ts` (hm-doctor gate), coherence checking |
| **Expected Correct Behavior** | Detects unhealthy state; returns `hm-doctor` as BLOCKING gate |
| **Likely Failure Mode** | Gate returns string but doctor implementation is archived |
| **Severity** | 🔴 FATAL — Recovery impossible |
| **Pass Criteria** | Corruption detected, repair mechanism exists and runs |
| **Evidence to Capture** | Health check output, doctor command execution status |

#### Test SWR-03: Sub-session Entry Without Parent

| Field | Value |
|-------|-------|
| **Scenario Name** | Orphaned sub-session |
| **Why Realistic** | Link from another session, stale reference, lost parent |
| **Setup** | No active session; simulate `session_id` header with non-existent parent |
| **User Input** | `"Fix the failing test from delegated session"` |
| **Targeted Subsystem** | `session-state.ts`, sub-session detection logic |
| **Expected Correct Behavior** | Detects missing parent; forces fresh session with warning |
| **Likely Failure Mode** | Session kernel is in-memory only; no persistence = no parent lookup |
| **Severity** | 🟠 HIGH — Continuity broken but not crash |
| **Pass Criteria** | Graceful fallback, no crash, clear message |
| **Evidence to Capture** | Session state detection, fallback behavior |

#### Test SWR-04: Adversarial Prompt Misclassification

| Field | Value |
|-------|-------|
| **Scenario Name** | Ambiguous intent exploitation |
| **Why Realistic** | Users often mix planning, research, and implementation in one prompt |
| **Setup** | Normal bootstrap state |
| **User Input** | `"So I was thinking about how we could maybe refactor the session handling - but first can you research what other frameworks do, and also there's a failing test I need fixed, and should we add TDD for this?"` |
| **Targeted Subsystem** | `purpose-classifier.ts` |
| **Expected Correct Behavior** | Detects ambiguity; flags for clarification or splits into sequential routing |
| **Likely Failure Mode** | Keyword matching picks first match; routes incorrectly; user goals unmet |
| **Severity** | 🟠 HIGH — Wrong workflow, wasted effort |
| **Pass Criteria** | Ambiguity detected or forced single-purpose path with acknowledged tradeoff |
| **Evidence to Capture** | Classification output, confidence score, routing decision |

#### Test SWR-05: Language Switch Mid-Session

| Field | Value |
|-------|-------|
| **Scenario Name** | Multilingual continuity |
| **Why Realistic** | International teams, mixed-language environments |
| **Setup** | Active session in English |
| **User Input** | Follow-up in different language: `"Ahora quiero revisar los tests que escribimos"` |
| **Targeted Subsystem** | Session continuity, context preservation |
| **Expected Correct Behavior** | Context preserved; language adapted; session recognized |
| **Likely Failure Mode** | Session is in-memory; lost on language switch if it triggers new request |
| **Severity** | 🟡 MEDIUM — Context loss, not crash |
| **Pass Criteria** | Previous context accessible after language switch |
| **Evidence to Capture** | Session ID continuity, context retrieval |

---

### 1.2: PURPOSE CLASSIFICATION SUBSYSTEM

#### Test PC-01: Overlapping Taxonomy

| Field | Value |
|-------|-------|
| **Scenario Name** | Dual-classification conflict |
| **Why Realistic** | Code has 8-class (PurposeClass) AND 7-class (IntentType) taxonomies |
| **Setup** | Normal entry |
| **User Input** | `"Debug why the tests are failing and then plan the fix"` |
| **Targeted Subsystem** | `purpose-classifier.ts`, `intent-classifier.ts` |
| **Expected Correct Behavior** | Single classification with acknowledged multi-intent |
| **Likely Failure Mode** | Two classifiers produce different results; routing confusion |
| **Severity** | 🟠 HIGH — Duplicate systems fighting |
| **Pass Criteria** | One canonical classification path, other ignored or merged |
| **Evidence to Capture** | Both classifier outputs, which one wins |

#### Test PC-02: Keyword Exploitation

| Field | Value |
|-------|-------|
| **Scenario Name** | Keyword gaming |
| **Why Realistic** | Users may inadvertently trigger wrong classification |
| **Setup** | Normal entry |
| **User Input** | `"Can you TEST the waters and EXPLORE what REVIEW means in this context?"` |
| **Targeted Subsystem** | `purpose-classifier.ts` keyword matching |
| **Expected Correct Behavior** | Disambiguation or conservative default |
| **Likely Failure Mode** | First match wins (tdd from "test"?); wrong workflow |
| **Severity** | 🟡 MEDIUM — Misrouting |
| **Pass Criteria** | Prompts for clarification or picks most conservative interpretation |
| **Evidence to Capture** | Classification confidence, matched keywords |

#### Test PC-03: Keyword Absence

| Field | Value |
|-------|-------|
| **Scenario Name** | Novel intent expression |
| **Why Realistic** | Users express intent without recognized keywords |
| **Setup** | Normal entry |
| **User Input** | `"The thing is kinda broken and I want it to work better"` |
| **Targeted Subsystem** | `purpose-classifier.ts` fallback logic |
| **Expected Correct Behavior** | Default to conservative class (discovery) with clarification prompt |
| **Likely Failure Mode** | Undefined defaults to undefined; routing breaks |
| **Severity** | 🟠 HIGH — No routing, dead end |
| **Pass Criteria** | Graceful default, clarification triggered |
| **Evidence to Capture** | Default class selection, clarification prompt |

---

### 1.3: LINEAGE DETECTION SUBSYSTEM

#### Test LD-01: Framework vs Product Ambiguity

| Field | Value |
|-------|-------|
| **Scenario Name** | Mixed-scope prompt |
| **Why Realistic** | Real work often spans framework and product |
| **Setup** | Normal entry |
| **User Input** | `"I need to refactor the plugin hooks to support my feature"` |
| **Targeted Subsystem** | `lineage-router.ts` keyword matching |
| **Expected Correct Behavior** | hivefiver detected (keywords: plugin, hook); routes to meta-builder |
| **Likely Failure Mode** | Multiple keyword matches; unclear which lineage |
| **Severity** | 🟡 MEDIUM — Wrong lineage, wrong agent |
| **Pass Criteria** | Clear lineage selection with reason |
| **Evidence to Capture** | Matched keywords, lineage decision, reason |

#### Test LD-02: No Keywords Matched

| Field | Value |
|-------|-------|
| **Scenario Name** | Implicit lineage |
| **Why Realistic** | Users don't know framework keywords |
| **Setup** | Normal entry; user is working in src/ |
| **User Input** | `"Add a button to the dashboard"` |
| **Targeted Subsystem** | `lineage-router.ts` fallback |
| **Expected Correct Behavior** | Defaults to hiveminder (product lineage) |
| **Likely Failure Mode** | Default uses `activeLineage ?? 'hiveminder'` — works if activeLineage set |
| **Severity** | 🟢 LOW — Works as designed |
| **Pass Criteria** | Correct product lineage default |
| **Evidence to Capture** | Lineage decision, fallback reason |

#### Test LD-03: Cross-Lineage Leakage

| Field | Value |
|-------|-------|
| **Scenario Name** | Context poisoning across lineages |
| **Why Realistic** | Prior session left framework artifacts in product context |
| **Setup** | Active session with hivefiver lineage artifacts; user pivots to product |
| **User Input** | `"Now implement this feature in my app"` |
| **Targeted Subsystem** | Lineage isolation, context integrity |
| **Expected Correct Behavior** | Detect lineage switch; clear framework context; start fresh product context |
| **Likely Failure Mode** | Context not cleared; framework reasoning pollutes product work |
| **Severity** | 🔴 FATAL — Context poisoning vector |
| **Pass Criteria** | Clean lineage boundary; no cross-contamination |
| **Evidence to Capture** | Context comparison before/after lineage switch |

---

### 1.4: CONTEXT INTEGRITY SUBSYSTEM

#### Test CI-01: Drift Detection Activation

| Field | Value |
|-------|-------|
| **Scenario Name** | Turn drift accumulation |
| **Why Realistic** | Long sessions drift without detection |
| **Setup** | Active session; simulate 30+ turns |
| **User Input** | Continued work after 30 turns |
| **Targeted Subsystem** | `coherence.ts` drift detection |
| **Expected Correct Behavior** | Drift detected; warning issued; compact_session recommended |
| **Likely Failure Mode** | `checkCoherence()` is EMPTY STUB — no detection |
| **Severity** | 🔴 FATAL — Drift accumulates silently |
| **Pass Criteria** | Drift counter active, warning at threshold |
| **Evidence to Capture** | Turn count, drift warning status, coherence check output |

#### Test CI-02: Compaction Recovery

| Field | Value |
|-------|-------|
| **Scenario Name** | Post-compaction context recovery |
| **Why Realistic** | Compaction fires; critical context lost |
| **Setup** | Simulate compaction event |
| **User Input** | `"Continue from where we were"` |
| **Targeted Subsystem** | Session anchors, memory recall |
| **Expected Correct Behavior** | Anchors preserved; `think_back()` restores critical decisions |
| **Likely Failure Mode** | No anchors saved; no memory persistence; start from zero |
| **Severity** | 🔴 FATAL — Intelligence loss event |
| **Pass Criteria** | Key decisions recoverable via anchors |
| **Evidence to Capture** | Anchor existence, recall success |

#### Test CI-03: Stale Context Detection

| Field | Value |
|-------|-------|
| **Scenario Name** | Artifact age validation |
| **Why Realistic** | Referenced documents >48h old may be misleading |
| **Setup** | Reference old plan document |
| **User Input** | `"Follow the plan from last week"` |
| **Targeted Subsystem** | Artifact freshness checking |
| **Expected Correct Behavior** | Detect stale reference; warn or validate |
| **Likely Failure Mode** | No freshness check; stale plan applied to changed reality |
| **Severity** | 🟠 HIGH — Wrong direction |
| **Pass Criteria** | Stale artifact flagged before execution |
| **Evidence to Capture** | Artifact timestamp, staleness detection |

---

### 1.5: HM-INIT / HM-DOCTOR GATING SUBSYSTEM

#### Test GATE-01: HM-INIT Execution

| Field | Value |
|-------|-------|
| **Scenario Name** | Bootstrap actually works |
| **Why Realistic** | First-time user experience |
| **Setup** | Clean repo, no `.hivemind/` |
| **User Input** | Trigger `hm-init` via readiness gate |
| **Targeted Subsystem** | CLI, init command handler |
| **Expected Correct Behavior** | `.hivemind/` created, state files initialized, governance injected |
| **Likely Failure Mode** | `src/cli.ts` DOES NOT EXIST — command cannot run |
| **Severity** | 🔴 FATAL — System unusable for new users |
| **Pass Criteria** | Bootstrap completes, state verified |
| **Evidence to Capture** | CLI execution, directory creation, file contents |

#### Test GATE-02: HM-DOCTOR Execution

| Field | Value |
|-------|-------|
| **Scenario Name** | Recovery actually works |
| **Why Realistic** | Corrupted state recovery |
| **Setup** | Corrupted `.hivemind/` (missing files, broken JSON) |
| **User Input** | Trigger `hm-doctor` via readiness gate |
| **Targeted Subsystem** | CLI, doctor command handler |
| **Expected Correct Behavior** | Corruption detected, repaired, state validated |
| **Likely Failure Mode** | Doctor implementation ARCHIVED (604 lines in archive) — not runnable |
| **Severity** | 🔴 FATAL — Recovery impossible |
| **Pass Criteria** | Doctor runs, repairs state, exits success |
| **Evidence to Capture** | Doctor execution, repair actions, validation result |

#### Test GATE-03: HM-HARNESS Execution

| Field | Value |
|-------|-------|
| **Scenario Name** | High-control work validation |
| **Why Realistic** | Risky operations need readiness check |
| **Setup** | Request high-control operation without workflow setup |
| **User Input** | `"Deploy this untested change to production"` |
| **Targeted Subsystem** | hm-harness gate, workflow readiness |
| **Expected Correct Behavior** | Advisory gate fires; workflow setup recommended |
| **Likely Failure Mode** | Harness command has no implementation |
| **Severity** | 🟠 HIGH — Safety gate bypassed |
| **Pass Criteria** | Gate fires, user warned, workflow setup prompted |
| **Evidence to Capture** | Gate status, harness execution attempt |

---

### 1.6: PLUGIN-HANDLERS SUBSYSTEM

#### Test PH-01: Command Resolution

| Field | Value |
|-------|-------|
| **Scenario Name** | Command bundle lookup |
| **Why Realistic** | Start-work router returns command ID; needs resolution |
| **Setup** | Start-work returns `'hm-plan'` |
| **User Input** | Planning request |
| **Targeted Subsystem** | `command-resolution.ts`, command bundles |
| **Expected Correct Behavior** | Bundle resolved, workflow chain extracted |
| **Likely Failure Mode** | Bundle exists but workflowChain is dead strings |
| **Severity** | 🟠 HIGH — Routing succeeds, execution fails |
| **Pass Criteria** | Command bundle loads, chain identifiers present |
| **Evidence to Capture** | Bundle lookup, chain identifiers |

#### Test PH-02: Session Inheritance

| Field | Value |
|-------|-------|
| **Scenario Name** | Sub-session inherits parent context |
| **Why Realistic** | Delegation creates child sessions |
| **Setup** | Active parent session; spawn sub-session |
| **User Input** | Delegation request |
| **Targeted Subsystem** | `session-inheritance.ts` |
| **Expected Correct Behavior** | Child inherits relevant parent context, bounded scope |
| **Likely Failure Mode** | Session is in-memory only; inheritance not persisted |
| **Severity** | 🟠 HIGH — Child has no memory of parent |
| **Pass Criteria** | Inheritance structure created with parent reference |
| **Evidence to Capture** | Inheritance decision, scope bounds |

---

### 1.7: SLASH-COMMAND AUTO-ROUTING SUBSYSTEM

#### Test SCR-01: Command Discovery

| Field | Value |
|-------|-------|
| **Scenario Name** | Find command by ID |
| **Why Realistic** | Router returns command ID, needs dispatch |
| **Setup** | Valid command ID returned |
| **User Input** | Any request routing to slash command |
| **Targeted Subsystem** | `command-discovery.ts` |
| **Expected Correct Behavior** | Command file found, frontmatter parsed, body loaded |
| **Likely Failure Mode** | Command found but body is guidance only, not executable |
| **Severity** | 🟡 MEDIUM — Command loads but no action |
| **Pass Criteria** | Command loads, frontmatter valid |
| **Evidence to Capture** | Command path, frontmatter, body content |

#### Test SCR-02: Missing Command

| Field | Value |
|-------|-------|
| **Scenario Name** | Command not found |
| **Why Realistic** | Router may return invalid ID |
| **Setup** | Invalid command ID |
| **User Input** | Request routing to non-existent command |
| **Targeted Subsystem** | `command-discovery.ts` |
| **Expected Correct Behavior** | Graceful fallback or error message |
| **Likely Failure Mode** | Undefined behavior, potential crash |
| **Severity** | 🟠 HIGH — Dead end for user |
| **Pass Criteria** | Clear error, fallback routing |
| **Evidence to Capture** | Error handling, fallback path |

---

### 1.8: WORKFLOW CHAINING SUBSYSTEM

#### Test WC-01: Chain Execution

| Field | Value |
|-------|-------|
| **Scenario Name** | WorkflowChain actually runs |
| **Why Realistic** | Core orchestration claim |
| **Setup** | Command bundle with workflowChain: `['bootstrap.profile', 'bootstrap.governance']` |
| **User Input** | Trigger hm-init |
| **Targeted Subsystem** | Workflow chain executor |
| **Expected Correct Behavior** | Chain steps execute in sequence, each completes before next |
| **Likely Failure Mode** | NO EXECUTOR EXISTS — chain is string literals |
| **Severity** | 🔴 FATAL — Core claim is entirely hollow |
| **Pass Criteria** | Steps execute, state transitions, completion verified |
| **Evidence to Capture** | Step execution logs, state transitions |

#### Test WC-02: Wave Execution

| Field | Value |
|-------|-------|
| **Scenario Name** | Multi-wave workflow |
| **Why Realistic** | YAML defines waves, steps, guards |
| **Setup** | Load `sequential-delegation-workflow.yaml` |
| **User Input** | Complex delegation request |
| **Targeted Subsystem** | YAML workflow parser, wave executor |
| **Expected Correct Behavior** | Waves execute in order, guards checked, skills loaded |
| **Likely Failure Mode** | No YAML parsing; no execution; files are decorative |
| **Severity** | 🔴 FATAL — 21 workflow YAML files are orphans |
| **Pass Criteria** | YAML parsed, wave structure executed |
| **Evidence to Capture** | Parse attempt, execution status |

#### Test WC-03: Guard Evaluation

| Field | Value |
|-------|-------|
| **Scenario Name** | Workflow guard blocks execution |
| **Why Realistic** | Safety gate within workflow |
| **Setup** | Workflow with entry_criteria not met |
| **User Input** | Request workflow execution |
| **Targeted Subsystem** | Guard evaluation logic |
| **Expected Correct Behavior** | Workflow blocked, clear criteria message |
| **Likely Failure Mode** | Guards defined but never evaluated |
| **Severity** | 🟠 HIGH — Safety gate bypassed |
| **Pass Criteria** | Guard evaluated, blocking enforced |
| **Evidence to Capture** | Guard check result, block reason |

---

### 1.9: SESSION CONTINUITY SUBSYSTEM

#### Test SC-01: Session Persistence

| Field | Value |
|-------|-------|
| **Scenario Name** | Session survives process restart |
| **Why Realistic** | Server restarts, client disconnection |
| **Setup** | Active session; simulate process restart |
| **User Input** | Reconnect to session |
| **Targeted Subsystem** | Session kernel, state persistence |
| **Expected Correct Behavior** | Session restored from persisted state |
| **Likely Failure Mode** | Session kernel is IN-MEMORY ONLY; lost on restart |
| **Severity** | 🔴 FATAL — Continuity claim is false |
| **Pass Criteria** | Session state recovered after restart |
| **Evidence to Capture** | Pre-restart state, post-restart recovery |

#### Test SC-02: Multiple Active Sessions

| Field | Value |
|-------|-------|
| **Scenario Name** | Concurrent session handling |
| **Why Realistic** | Multiple parallel efforts |
| **Setup** | Two active sessions; user references one |
| **User Input** | `"Switch to session for the auth feature"` |
| **Targeted Subsystem** | Session management, switching |
| **Expected Correct Behavior** | Correct session loaded, context switched |
| **Likely Failure Mode** | No session directory exists; sessions not addressable |
| **Severity** | 🔴 FATAL — Multi-session claim is false |
| **Pass Criteria** | Session switch succeeds, correct context loaded |
| **Evidence to Capture** | Session listing, switch operation |

#### Test SC-03: Session Dependency

| Field | Value |
|-------|-------|
| **Scenario Name** | Dependent session blocking |
| **Why Realistic** | Session B needs Session A to complete first |
| **Setup** | Session A incomplete; Session B depends on A |
| **User Input** | Try to start Session B |
| **Targeted Subsystem** | Dependency detection, cross-session validation |
| **Expected Correct Behavior** | Block Session B until Session A validated |
| **Likely Failure Mode** | No dependency tracking; both run concurrently, conflict |
| **Severity** | 🟠 HIGH — Invalid execution order |
| **Pass Criteria** | Dependency detected, blocking enforced |
| **Evidence to Capture** | Dependency graph, blocking status |

---

### 1.10: DELEGATION / HANDOFF SUBSYSTEM

#### Test DH-01: Sub-agent Dispatch

| Field | Value |
|-------|-------|
| **Scenario Name** | Valid delegation packet |
| **Why Realistic** | Core orchestration: main delegates to sub-agent |
| **Setup** | Parent session delegates implementation task |
| **User Input** | `"Delegate this to hivemaker"` |
| **Targeted Subsystem** | Delegation packet, sub-agent dispatch |
| **Expected Correct Behavior** | Packet created, sub-agent receives context, executes, returns |
| **Likely Failure Mode** | Packet structure exists but sub-agent has nowhere to execute |
| **Severity** | 🟠 HIGH — Orchestration illusion |
| **Pass Criteria** | Sub-agent receives packet, executes, returns evidence |
| **Evidence to Capture** | Packet contents, sub-agent response |

#### Test DH-02: Parallel vs Sequential Decision

| Field | Value |
|-------|-------|
| **Scenario Name** | Parallel task splitting |
| **Why Realistic** | Independent tasks can run concurrently |
| **Setup** | User requests two independent tasks |
| **User Input** | `"Research X and investigate Y in parallel"` |
| **Targeted Subsystem** | Delegation intelligence, parallel dispatch |
| **Expected Correct Behavior** | Tasks identified as independent; dispatched in parallel |
| **Likely Failure Mode** | Delegation is orchestration illusion; no actual parallel execution |
| **Severity** | 🟡 MEDIUM — Sequential fallback is acceptable |
| **Pass Criteria** | Parallel detection; correct dispatch mode |
| **Evidence to Capture** | Independence analysis, dispatch decision |

#### Test DH-03: Handoff Validation

| Field | Value |
|-------|-------|
| **Scenario Name** | Sub-agent result verification |
| **Why Realistic** | Sub-agent claims completion; must verify |
| **Setup** | Sub-agent returns "done" status |
| **User Input** | Receive sub-agent result |
| **Targeted Subsystem** | `evidence-discipline`, result validation |
| **Expected Correct Behavior** | Evidence checked; claim validated or rejected |
| **Likely Failure Mode** | "Done" accepted without verification; false completion |
| **Severity** | 🟠 HIGH — Unverified work accepted |
| **Pass Criteria** | Evidence required, validated before acceptance |
| **Evidence to Capture** | Validation checklist, pass/fail decision |

---

### 1.11: PLANNING / RESEARCH / IMPLEMENTATION BOUNDARY SUBSYSTEM

#### Test PRIB-01: Planning Lock

| Field | Value |
|-------|-------|
| **Scenario Name** | Planning phase prevents implementation |
| **Why Realistic** | TDD gate: plan before code |
| **Setup** | Active planning session |
| **User Input** | `"Just implement it already"` |
| **Targeted Subsystem** | TDD gate, phase boundaries |
| **Expected Correct Behavior** | Block implementation; require planning approval first |
| **Likely Failure Mode** | No phase enforcement; implementation allowed prematurely |
| **Severity** | 🟠 HIGH — Process discipline broken |
| **Pass Criteria** | Gate blocks, planning completion required |
| **Evidence to Capture** | Phase status, gate check |

#### Test PRIB-02: Research Context Injection

| Field | Value |
|-------|-------|
| **Scenario Name** | Research phase gets appropriate context |
| **Why Realistic** | Research needs different context than implementation |
| **Setup** | Research-classified request |
| **User Input** | `"Research best practices for session management"` |
| **Targeted Subsystem** | `doc-surface-router.ts`, context scoping |
| **Expected Correct Behavior** | Research surfaces loaded; implementation context excluded |
| **Likely Failure Mode** | Same context for all phases; over/under injection |
| **Severity** | 🟡 MEDIUM — Context pollution |
| **Pass Criteria** | Phase-appropriate context loaded |
| **Evidence to Capture** | Context surfaces loaded, exclusions |

---

### 1.12: DOC-INTEL / ATTACHMENT HANDLING SUBSYSTEM

#### Test DI-01: Attachment Processing

| Field | Value |
|-------|-------|
| **Scenario Name** | Attached document integration |
| **Why Realistic** | Users attach files, code snippets, plans |
| **Setup** | User attaches large document |
| **User Input** | Attach + `"Follow this plan"` |
| **Targeted Subsystem** | `hivemind_doc` tool, attachment handling |
| **Expected Correct Behavior** | Attachment processed, indexed, referenced correctly |
| **Likely Failure Mode** | Attachment ignored or processed incorrectly |
| **Severity** | 🟠 HIGH — Lost user input |
| **Pass Criteria** | Attachment appears in context, referenced correctly |
| **Evidence to Capture** | Attachment processing status, retrieval |

#### Test DI-02: Large Document Handling

| Field | Value |
|-------|-------|
| **Scenario Name** | Token budget with attachments |
| **Why Realistic** | Attachments can exceed token budget |
| **Setup** | User attaches 50k token document |
| **User Input** | `"Analyze this whole document"` |
| **Targeted Subsystem** | Token budget, document intelligence |
| **Expected Correct Behavior** | Budget enforced; document chunked or summarized |
| **Likely Failure Mode** | Budget exceeded; context truncated mid-document |
| **Severity** | 🟠 HIGH — Corrupted context |
| **Pass Criteria** | Budget respected, document accessible via chunking |
| **Evidence to Capture** | Token count, chunking behavior |

---

## Part II: Execution Waves

### WAVE 1: Destructive Smoke Tests (Validate Survival)

**Purpose**: Does the system survive when infrastructure is destroyed?

| Test ID | Name | Priority |
|---------|------|----------|
| GATE-01 | HM-INIT Execution | BLOCKER |
| GATE-02 | HM-DOCTOR Execution | BLOCKER |
| SWR-01 | Fresh Bootstrap Detection | BLOCKER |
| SWR-02 | Corrupt State Detection | BLOCKER |

**Wave 1 Pass Criteria**: System can bootstrap fresh and recover from corruption.

**Expected Result**: FAIL — No CLI exists, no implementation.

---

### WAVE 2: Routing and Session-Integrity Tests (Validate Core Claims)

**Purpose**: Does the routing layer actually route correctly?

| Test ID | Name | Priority |
|---------|------|----------|
| SWR-03 | Sub-session Entry Without Parent | P0 |
| WC-01 | Chain Execution | P0 |
| WC-02 | Wave Execution | P0 |
| SC-01 | Session Persistence | P0 |
| PC-01 | Overlapping Taxonomy | P1 |
| LD-01 | Framework vs Product Ambiguity | P1 |
| PH-01 | Command Resolution | P1 |

**Wave 2 Pass Criteria**: Routing produces correct destinations; sessions persist.

**Expected Result**: PARTIAL FAIL — Routing works, chaining fails, persistence fails.

---

### WAVE 3: Compound Chaos Tests (Validate Robustness)

**Purpose**: Does the system handle realistic disorder?

| Test ID | Name | Priority |
|---------|------|----------|
| SWR-04 | Adversarial Prompt Misclassification | P1 |
| LD-03 | Cross-Lineage Leakage | P0 |
| CI-01 | Drift Detection Activation | P0 |
| CI-02 | Compaction Recovery | P0 |
| SC-02 | Multiple Active Sessions | P1 |
| SC-03 | Session Dependency | P1 |
| DH-01 | Sub-agent Dispatch | P1 |
| PRIB-01 | Planning Lock | P1 |

**Wave 3 Pass Criteria**: Chaos produces graceful degradation, not crash.

**Expected Result**: FAIL — No drift detection, no compaction recovery, no session isolation.

---

### WAVE 4: Final Gate Tests (Trust for Production)

**Purpose**: Can this system be trusted for real usage?

| Test ID | Name | Priority |
|---------|------|----------|
| CI-03 | Stale Context Detection | P0 |
| DH-03 | Handoff Validation | P0 |
| DI-01 | Attachment Processing | P1 |
| DI-02 | Large Document Handling | P1 |
| GATE-03 | HM-HARNESS Execution | P1 |

**Wave 4 Pass Criteria**: All safety gates functional, evidence validation enforced.

**Expected Result**: FAIL — Evidence discipline not enforced, stale detection missing.

---

## Part III: Structural Failure Point Analysis

### P1: Management and Orchestration Are Still Shallow

**Evidence**: 
- 21 workflow YAML files define rich orchestration but have ZERO execution code
- `workflowChain` arrays are string literals with no resolver
- Command bundles define workflow chains that never execute

**Root Cause**: Architecture documented before implementation; spec-as-code illusion.

**Severity**: 🔴 FATAL — Core orchestration claim is entirely unimplemented.

---

### P2: Routing Logic Is Brittle

**Evidence**:
- Keyword matching in `purpose-classifier.ts` picks first match
- Multiple overlapping taxonomies (8-class, 7-class, 6-class archived)
- No confidence scoring or disambiguation

**Root Cause**: Simple regex-based classification; no ML or semantic analysis.

**Severity**: 🟠 HIGH — Misrouting likely under ambiguity.

---

### P3: Context-Engineering Looks Good in Theory But Collapses Under Ambiguity

**Evidence**:
- `checkCoherence()` is empty stub with TODO comments
- `src/lib/detection.ts` (857 lines) is archived, not active
- Governance counters exist in docs but not in runtime

**Root Cause**: Implementation archived during refactor; replacement not completed.

**Severity**: 🔴 FATAL — Context integrity is documented but not enforced.

---

### P4: Cross-Session Integrity Likely Drifts

**Evidence**:
- Session kernel is IN-MEMORY ONLY (`src/core/session/kernel.ts`)
- `.hivemind/` directory DOES NOT EXIST
- Session state is `active.json` (81 lines) — minimal, no history

**Root Cause**: Persistence layer removed/archived; never restored.

**Severity**: 🔴 FATAL — Continuity claim is false. Every session is fresh.

---

### P5: Command Bundles Overfire, Misfire, or Bypass Safety Gates

**Evidence**:
- Command bundles load correctly
- But workflow chains don't execute
- `hm-harness` gate returns advisory but no implementation
- Harness command file is guidance only (27 lines)

**Root Cause**: Command surface exists; execution surface missing.

**Severity**: 🔴 FATAL — Safety gates are decorative, not functional.

---

### P6: Recovery from Damaged `.hivemind` State Is Underspecified

**Evidence**:
- `hm-doctor` implementation is ARCHIVED (604 lines)
- No active recovery code exists
- CLI entry point (`src/cli.ts`) DOES NOT EXIST
- Test imports reference non-existent `src/cli/init.js`

**Root Cause**: Bootstrap layer removed during refactor; never restored.

**Severity**: 🔴 FATAL — Recovery impossible. System cannot self-heal.

---

### P7: Tool Availability Confused with Workflow Readiness

**Evidence**:
- `readiness-gates.ts` returns gate objects correctly
- But returned command IDs have no handlers
- Workflows reference skill_bundles that don't connect to skills
- No validation that workflow steps can actually execute

**Root Cause**: Availability checks not implemented; just name strings.

**Severity**: 🔴 FATAL — Readiness is nominal, not actual.

---

## Part IV: Hard Verdict

### Validated Claims

| Claim | Status | Evidence |
|-------|--------|----------|
| Start-work routing logic | ✅ VALIDATED | 232 lines working code |
| Purpose classification | ✅ VALIDATED | 62 lines, 8 classes |
| Lineage detection | ✅ VALIDATED | 37 lines, keyword matching |
| Readiness gate detection | ✅ VALIDATED | 32 lines, returns correct objects |
| Plugin context composition | ✅ VALIDATED | Works, tested |
| Command bundle loading | ✅ VALIDATED | Loads from markdown |

### Unproven Claims

| Claim | Status | Gap |
|-------|--------|-----|
| Bootstrap via `hm-init` | ❌ UNPROVEN | No CLI, no implementation |
| Recovery via `hm-doctor` | ❌ UNPROVEN | Implementation archived |
| Workflow chain execution | ❌ UNPROVEN | String literals only |
| Wave execution | ❌ UNPROVEN | YAML is decoration |
| Session persistence | ❌ UNPROVEN | In-memory only |
| Cross-session continuity | ❌ UNPROVEN | No state directory |
| Drift detection | ❌ UNPROVEN | Empty stub |
| Compaction recovery | ❌ UNPROVEN | No anchors |
| Delegation execution | ⚠️ PARTIAL | Packet exists, no backing infrastructure |

### Claims Likely False Under Pressure

| Claim | Why False | Stress Condition |
|-------|-----------|-------------------|
| "The system prevents context poisoning" | No enforcement code active | Ambiguous prompts, cross-lineage work |
| "Recovery from corruption works" | Doctor archived, rest API returns strings | Corrupt `.hivemind` |
| "Sessions persist across restarts" | In-memory only | Process restart |
| "Workflow chains orchestrate steps" | No executor exists | Any workflow request |
| "Context integrity is enforced" | Empty stub, archived detection | Long sessions, drift |
| "Evidence must be validated" | No validation code active | Sub-agent claims |

---

## Part V: Must-Fix Before Broader Adoption

### Immediate (Blockers)

1. **Restore CLI implementation** — Without `src/cli.ts`, the system is unusable
2. **Restore or reimplement `hm-init`** — Bootstrap is impossible
3. **Restore or reimplement `hm-doctor`** — Recovery is impossible
4. **Implement workflow chain executor** — Core orchestration claim
5. **Implement session persistence** — Continuity claim is false

### High Priority (Safety Gaps)

6. **Implement coherence checking** — Replace empty stub
7. **Implement drift detection** — Restore from archive or reimplement
8. **Implement gate validation** — Safety gates cannot be bypassed
9. **Implement session boundaries** — Current implementation is cosmetic

### Medium Priority (Quality Gaps)

10. **Consolidate taxonomy** — One classification system, not three
11. **Implement disambiguation** — Confidence scores, clarification prompts
12. **Implement evidence validation** — Not just packet structure

---

## Appendix: Test Execution Template

```bash
# WAVE 1: Destructive Smoke Tests
rm -rf .hivemind node_modules dist
npm install
npm run build

# Test GATE-01: Verify CLI exists
test -f dist/cli.js && echo "CLI EXISTS" || echo "CLI MISSING"

# Test GATE-02: Verify hm-init runs
node dist/cli.js hm-init && echo "INIT SUCCESS" || echo "INIT FAILED"

# Test SWR-01: Simulate fresh user
npx tsx -e "
import { resolveStartWork } from './src/hooks/start-work/start-work-router.js';
const decision = resolveStartWork({ userMessage: 'plan a feature' });
console.log('GATES:', decision.readinessGates);
"

# Test WC-01: Verify workflow chain execution
npx tsx -e "
import { resolveStartWork } from './src/hooks/start-work/start-work-router.js';
const decision = resolveStartWork({ userMessage: 'initialize the project' });
console.log('WORKFLOW CHAIN:', decision.recommendedWorkflowChain);
// Verify chain executes (it won't)
"
```

---

**END OF STRESS-TEST MATRIX**

**Document Status**: Complete  
**Next Action**: Execute Wave 1 tests; document failures  
**Owner**: hiveminder  
**Review Required By**: hivefiver (meta-builder) before any further rebuild claims
