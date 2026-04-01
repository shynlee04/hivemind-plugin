# HiveMind Tool REFRAMED Analysis — 2026-04-01

## Why the First Audit Was Wrong

The 6 specialist agents judged tools by ONE question: "Was it called in recorded sessions?"

That's the WRONG question. The right question is:

**"IF this tool worked correctly AND agents were wired to trigger it, would it make the HiveMind system fundamentally superior to using innate tools?"**

A steering wheel has never been turned while the car is parked. That doesn't mean it should be removed.

---

## THE CORRECT LENS: Hypothesis-Based Value Analysis

For each tool, we evaluate:
1. **IF the bugs were fixed** — would the tool work?
2. **IF the description was clear** — would agents know to use it?
3. **IF the agent wiring was correct** — would it get triggered at the right moments?
4. **THEN what superior capability does it unlock that innate tools CANNOT provide?**
5. **AND how does it strengthen the HiveMind framework's concepts of hierarchy, relationships, and context engineering?**

---

## TOOL-BY-TOOL REFRAMED VERDICTS

### hivemind_trajectory — NOT dead. THE backbone of context continuity.

**What agents said:** "Never invoked. Can be replaced by JSON Read/Write. Remove."

**What they missed:**

IF trajectory worked correctly, it would be the **single most important tool in the system**. Here's why:

- **The problem it solves:** After compaction, an LLM agent loses all context about what it was doing and why. The trajectory ledger is the ONLY mechanism that survives compaction — it records purpose, lineage, workflow bindings, checkpoints, and events.
- **Innate tools CANNOT do this.** Read/Grep can read a JSON file, but they don't know WHICH file, WHAT the data means, or HOW to reconstruct context from it. The trajectory tool provides structured traversal that reconstructs "what happened, why, and what's next" — a narrative, not raw data.
- **Framework cohesion:** Trajectory is the thread that connects sessions → workflows → tasks → handoffs. Without it, every tool operates in isolation. With it, agents can resume work after compaction, after idle, after delegation returns.
- **The real reason it wasn't invoked:** Agents don't know WHEN to checkpoint. The hooks that should auto-trigger `trajectory attach` at session start and `trajectory checkpoint` at workflow shifts aren't wired. The tool isn't broken — the TRIGGER is missing.

**REFRAMED VERDICT: CRITICAL — Fix the trigger wiring, not the tool.**

---

### hivemind_task — NOT dead. The atomic unit of accountable work.

**What agents said:** "Sync I/O, double-write bug, can be replaced by JSON Read/Write. Marginal."

**What they missed:**

IF task worked with async I/O and unified status schema, it would transform how agents manage work:

- **The problem it solves:** Without task management, agents use free-form text to track what they're doing. "I'll refactor the tools, then run tests" — but when compaction hits, that plan is lost. Tasks persist. They have status, dependencies, evidence requirements, verification contracts.
- **Innate tools CANNOT do this.** An agent can Write a JSON file with task data, but: Who validates the status transition? Who enforces dependency ordering? Who verifies completion against acceptance criteria? Who links tasks to workflow authority? The task tool does ALL of this. JSON Read/Write does NONE of it.
- **Framework cohesion:** Tasks are the ONLY unit that connects to workflow authority (what phase are we in?), trajectory (what checkpoint was this task created at?), and handoffs (what tasks are being delegated?). Without tasks, the entire chain collapses.
- **The real reason it wasn't invoked:** The status schema conflict with create_contract means agents get confused about which tool owns tasks. Fix the schema, fix the I/O, and the tool becomes the backbone of accountable agent work.

**REFRAMED VERDICT: CRITICAL — Fix the schema and I/O, not the concept.**

---

### hivemind_handoff — NOT harmful. The ONLY safe delegation mechanism.

**What agents said:** "Hidden side-effects, schema bloat. Refactor heavily."

**What they missed:**

IF handoff had a clean schema without hidden writes, it would be the **linchpin of multi-agent accountability**:

- **The problem it solves:** When one agent delegates work to another, context is lost. The receiving agent doesn't know the scope, constraints, or what evidence is required. Handoffs encode ALL of this — scope, constraints, memory scope, success metrics, required evidence, return gates.
- **Innate tools CANNOT do this.** An agent can Write a JSON file with delegation notes, but: Who enforces the return gate? Who validates that the required evidence was actually provided? Who tracks the delegation chain from originator → executor → verifier? Handoffs do ALL of this. A JSON file does NONE of it.
- **Framework cohesion:** Handoffs are the BRIDGE between tasks and trajectories. A task says "do X." A handoff says "do X within these constraints, with these success metrics, and return THIS evidence to THAT agent." Without handoffs, delegation is unaccountable.
- **The real reason it had side-effects:** The tool tried to do too much — creating trajectories and tasks as side-effects. Simplify: handoff creates ONLY the handoff record. Let trajectory and task tools handle their own concerns (CQRS).

**REFRAMED VERDICT: CRITICAL — Simplify the schema, remove hidden writes.**

---

### hivemind_doc — NOT just useful. The intelligence multiplier.

**What agents said:** "50% failure rate on arguments. Marginal over innate tools."

**What they missed:**

IF doc had a clear argument schema, it would be **superior to every innate tool for structured reading**:

- **The problem it solves:** Agents waste context tokens reading entire files when they need one section. They grep for patterns and miss structural context. The doc tool provides skim (outline only), chunk (bounded sections), and search (semantic within-document) — all with token budgets.
- **Innate tools CANNOT do this.** Grep returns lines, not sections. Read returns entire files. Neither understands document structure (headings, code blocks, tables). The doc tool parses structure and returns exactly what's needed within token limits.
- **Framework cohesion:** Doc intelligence is how agents navigate the HiveMind knowledge base without exhausting context. Every investigation should START with doc.skim, then drill into doc.chunk — keeping context lean while maximizing information density.
- **The real reason it failed 50%:** The argument schema has confusing overlaps between `filePath`, `dirPath`, `query`, and `heading`. Agents don't know which combination to use for which action. Fix the schema, fix the tool.

**REFRAMED VERDICT: CRITICAL — Fix the arg schema, not the concept.**

---

### hivemind_journal — NOT redundant. The persistence layer for agent reasoning.

**What agents said:** "Hooks already write events. Redundant. Replace with Write tool."

**What they missed:**

IF journal was properly scoped, it would be the **ONLY mechanism that preserves agent reasoning across compaction**:

- **The problem it solves:** After compaction, the agent's reasoning is gone. "Why did I choose approach A over B?" — nobody knows. The journal records assistant_output (reasoning), diagnostic (what went wrong), and trajectory events (what changed). These survive compaction.
- **Innate tools CANNOT do this.** The Write tool writes to files, but it doesn't follow the journey-events format, doesn't auto-structure entries by timestamp, and doesn't integrate with trajectory. The journal tool enforces a structured format that other tools (trajectory, export_contract) can read and reconstruct.
- **Framework cohesion:** Journal is the write-side of CQRS for session events. Trajectory reads it. Export_contract serializes it. Handoff references it. It's the source of truth for "what happened and why."
- **The real reason it looked redundant:** 3 of 6 event types (user_message, tool_call, compaction) ARE already written by hooks. The fix: remove those 3 from the journal tool's surface, keep only assistant_output, trajectory, and diagnostic — the 3 that hooks CANNOT write.

**REFRAMED VERDICT: KEEP — Prune 3 redundant event types. The remaining 3 are irreplaceable.**

---

### hivemind_runtime_status — WORKS. Just needs visibility.

**What agents said:** "Good. Aggregates 5 sources."

**What they missed:**

This tool WORKS CORRECTLY. The only issue is discoverability:

- **The problem it solves:** An agent starts a session and doesn't know what runtime state exists. Are there active trajectories? Workflows? Tasks? Handoffs? Contracts? Runtime status answers ALL of these in one call.
- **Framework cohesion:** This is the agent's dashboard. It should be the FIRST tool called at session start (after trajectory.attach) to establish situational awareness.
- **The real issue:** Agents don't know to call it first. Wire it into the session-entry hook as a mandatory first call.

**REFRAMED VERDICT: KEEP — Wire into session start. Works correctly.**

---

### hivemind_runtime_command — OVERLOADED but irreplaceable for complex operations.

**What agents said:** "21 arguments. Strip 9 profile fields. Simplify."

**What they missed:**

The 21 arguments exist because this tool is the **CONTROL PLANE for the entire HiveMind system**:

- **The problem it solves:** Commands like hm-init, hm-doctor, hm-settings, and future commands ALL need to route through a single tool. The alternative is 10+ separate tools, each with its own schema, maintenance burden, and surface area.
- **Innate tools CANNOT do this.** Bash can run CLI commands, but it can't provide structured JSON output, can't enforce schema validation, and can't integrate with the plugin's type system. Runtime command does ALL of this.
- **Framework cohesion:** This is the CLI-in-a-tool. It's SUPPOSED to be complex because it's the unified entry point for all CLI operations.
- **The real issue:** The 9 profile fields should be auto-resolved from runtime bindings (language, expert level, governance mode) rather than passed by the agent. The tool should say "I detected your profile — confirm or override?" instead of requiring 9 explicit fields.

**REFRAMED VERDICT: KEEP — Auto-resolve profile fields. The complexity is justified.**

---

### hivemind_hm_init — NOT dead. Essential admin, just unfinished.

**What agents said:** "Never invoked. Can be replaced by bash. Remove."

**What they missed:**

hm_init is the **bootstrap mechanism for new projects**. Without it, there's no structured way to:

- Detect if a project is greenfield or brownfield
- Propose bootstrap actions (create .hivemind/, initialize paths, register skills)
- Get user authorization before making changes

**Innate tools CANNOT do this.** Bash can create directories, but it doesn't follow the HiveMind bootstrap protocol, doesn't detect project state, and doesn't ask for user authorization through the permission system.

**REFRAMED VERDICT: KEEP — Implement the bootstrap flow. Essential for new projects.**

---

### hivemind_hm_doctor — NOT dead. Essential diagnostics, just unfinished.

**What agents said:** "Never invoked. Can be replaced by bash. Remove."

**What they missed:**

hm_doctor is the **health check mechanism for HiveMind installations**. Without it, there's no structured way to:

- Detect configuration drift
- Find broken references
- Identify missing dependencies
- Propose and apply fixes

**Innate tools CANNOT do this.** Bash can run checks, but it doesn't follow the diagnostic protocol, doesn't scope results (skills vs agents vs config), and doesn't propose fixes through the permission system.

**REFRAMED VERDICT: KEEP — Implement the diagnostic flow. Essential for maintenance.**

---

### hivemind_hm_setting — WORKS. Configuration authority.

**What agents said:** "Adequate. Works."

**What they missed:**

This tool is the **single authority for all HiveMind configuration**. It works correctly. No changes needed.

**REFRAMED VERDICT: KEEP — Works correctly.**

---

### hivemind_create_contract — NOT broken. Architecturally important, just over-scoped.

**What agents said:** "Shadows task tool. Double-write bug. Refactor heavily."

**What they missed:**

The contract tool defines **workflow structure** — the relationship between planning, tasks, delegation modes, and chain actions. This is ARCHITECTURALLY important:

- **The problem it solves:** Without contracts, there's no way to define "this workflow has these phases, these tasks, these delegation modes, and these completion actions." Contracts encode the INTENT of a workflow, not just its state.
- **The real issue:** The tool tries to own task CRUD as well as contract structure. These are DIFFERENT concerns. Fix: remove task CRUD from the contract tool. Let the task tool own tasks. Let the contract tool own workflow structure.

**REFRAMED VERDICT: KEEP — Remove task CRUD. Keep the contract structure definition.**

---

### hivemind_export_contract — NOT marginal. Unique capability.

**What agents said:** "Can be replaced by JSON.stringify. Marginal."

**What they missed:**

IF export worked with the contract system, it would provide **compaction-safe state export** — a serialized snapshot of the entire work context that survives compaction and can be reconstructed by the next agent.

- **Innate tools CANNOT do this.** JSON.stringify doesn't validate against schemas, doesn't handle circular references, and doesn't produce a format that import_contract can reconstruct. The export tool does ALL of this.
- **Framework cohesion:** Export is the serialization bridge between sessions. Without it, compaction destroys context irreversibly.

**REFRAMED VERDICT: KEEP — Unique capability. Cannot be replaced by JSON.stringify.**

---

## THE REAL DIAGNOSIS

The first audit concluded: "Tools are dead. Remove them."

The reframed analysis concludes: **"The tools are the RIGHT tools. Three things are broken:**

1. **TRIGGER WIRING:** Tools exist but nothing triggers them at the right moments. Skills and hooks should auto-call trajectory.attach at session start, task.create when planning, handoff.create when delegating. This wiring is MISSING.

2. **DESCRIPTION CLARITY:** 5/12 tools have descriptions that describe implementation, not purpose. An LLM agent sees "feature contract store, schema validation, and intent engine" and has NO IDEA when to use it. Fix: every description needs "Use this WHEN..." and "Do NOT use this for X — use Y instead."

3. **SCHEMA CONFLICTS:** The task status enum mismatch between task tool and contract tool is a data corruption bomb. The handoff tool's hidden side-effects violate least surprise. These are FIXABLE bugs, not fundamental design flaws.

### What would happen if these 3 things were fixed?

- **Trajectory** becomes the context recovery backbone — every session starts with trajectory.attach, every workflow shift triggers trajectory.checkpoint, every delegation triggers trajectory.event
- **Task** becomes the atomic work unit — every plan creates tasks, every implementation activates tasks, every completion verifies against evidence
- **Handoff** becomes the safe delegation mechanism — every sub-session gets a handoff with scope, constraints, and evidence requirements
- **Doc** becomes the intelligence multiplier — every investigation starts with doc.skim, every deep read uses doc.chunk to stay within context limits
- **Journal** becomes the persistence layer — assistant reasoning and diagnostics survive compaction
- **The entire ID chain works:** sessionId → trajectoryId → workflowId → taskId → handoffId → contractId — a traceable, recoverable, accountable work pipeline

**THAT is the HiveMind vision. The tools are the right tools. They're just not wired, not described, and not conflict-free YET.**

---

## CORRECTED FINAL VERDICTS

| Tool | Previous Verdict | REFRAMED Verdict | Reason |
|------|-----------------|------------------|--------|
| hivemind_trajectory | DEAD/REMOVE | **CRITICAL — Fix triggers** | Backbone of context continuity. Irreplaceable after compaction. |
| hivemind_task | DEAD/MARGINAL | **CRITICAL — Fix schema + async** | Atomic work unit. Connects to every other concept. |
| hivemind_handoff | HARMFUL/REFACTOR | **CRITICAL — Simplify schema** | Only safe delegation mechanism. Enables multi-agent accountability. |
| hivemind_doc | USEFUL (50% fail) | **CRITICAL — Fix arg schema** | Intelligence multiplier. Superior to innate for structured reading. |
| hivemind_journal | REDUNDANT/REPLACE | **KEEP — Prune 3 event types** | Persistence layer for agent reasoning and diagnostics. |
| hivemind_runtime_status | GOOD | **KEEP — Wire into session start** | Agent self-awareness. Works correctly. |
| hivemind_runtime_command | OVERLOADED | **KEEP — Auto-resolve profile** | Control plane. Should be complex. |
| hivemind_hm_init | DEAD/REMOVE | **KEEP — IMPLEMENT** | Essential admin. Just unfinished. |
| hivemind_hm_doctor | DEAD/REMOVE | **KEEP — IMPLEMENT** | Essential diagnostics. Just unfinished. |
| hivemind_hm_setting | ADEQUATE | **KEEP** | Configuration authority. Works. |
| hivemind_create_contract | BROKEN/REFACTOR | **KEEP — Remove task CRUD** | Workflow structure definition. Architecturally important. |
| hivemind_export_contract | MARGINAL/REPLACE | **KEEP** | Compaction-safe state export. Unique capability. |

**ALL 12 TOOLS STAY.** Zero removals. The fix list is:
1. Wire triggers (hooks + skills)
2. Rewrite 5 descriptions
3. Fix task status schema conflict
4. Fix handoff hidden side-effects
5. Fix doc arg schema confusion
6. Implement hm_init + hm_doctor
7. Switch task to async I/O
8. Prune journal redundant event types
9. Auto-resolve runtime_command profile fields
10. Remove task CRUD from create_contract
