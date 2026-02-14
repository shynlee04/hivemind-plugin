
# 🧠 HIVEMIND CONTEXT GOVERNANCE: MASTER SOURCE OF TRUTH (SOT)

**Current System State:** `v2.6.0` | **Active Branch:** `dev/iteration-6-tui-cleanup`
**Current Phase:** Phase 3 (Stabilize & Structure - "Untying the Knots")

## 1. PROJECT IDENTITY & DOMAIN SEGREGATION

HiveMind is **not** a standard application; it is a **Meta-Framework Plugin** operating within the OpenCode Ecosystem. It sits between the platform and the user's host project to intercept, organize, and govern AI agent behavior, preventing context drift and enforcing multi-session memory.

**The Fundamental Misunderstanding (Why AI fails here):**
Agents and humans have been confusing the *Engine* with the *Display*. Agents act blindly, expecting large, unstructured markdown files to magically serve as memory.

**Strict Separation of Concerns:**

* **The Engine (The Heart & Brain):** Background automation driven by OpenCode SDK hooks (`session.prompt`, `experimental.session.compacting`, `tool.execute.after`), file-system watchers, JSON schemas, and automated atomic git commits. *The Engine drives the intelligence silently; it forces agent compliance.*
* **The Display (The Dashboard):** The Ink TUI, CLI Wizard, and Toasts. These exist *only* for human observability and interception. They do not run logic; they display what the Engine has already executed. Toasts must be actionable, not decorative spam.
* **The Host Project:** The target app being built. HiveMind must seamlessly utilize innate OpenCode mechanisms (Commands, Skills, Agents, Permissions) as its API, reading `package.json` and tech stacks to avoid acting blind.

---

## 2. CORE COMMANDMENTS FOR AI AGENTS (THE MINDSET)

*If you are an AI Agent reading this to debug, plan, or write code, you MUST obey these operational principles:*

1. **Control the Smallest Unit First:** The framework lives or dies by the "Sub-Task" (the brain cell). If you cannot guarantee a 100% hit rate in tracking, completing, and enforcing atomic commits for a single sub-task, do not attempt to orchestrate higher-level codebase plans.
2. **Automation Over Expectation:** Never trust the AI to "magically" remember rules. Automation must guarantee state via forced schema parsing and SDK hooks.
3. **Zero Trust for Flat Files:** The AI must never blindly read raw `.md` files. Unless an artifact contains a **YAML Frontmatter** header (ID, stamp, type, mode, staleness) and is linked to the active `hierarchy.json`, it is considered poisoned/stale context.
4. **Soft Governance Only:** DO NOT attempt to hard-block native tool execution. Govern by *enforcing context injection*, forcing re-reads at checkpoints, and escalating prompt pressure (INFO → WARN → CRITICAL → DEGRADED).
5. **Complexity Layering (Trial & Error):** Favor *depth over width* when navigating gray areas. If a specific OpenCode SDK integration is complex, propose and write a small, isolated script to test the interaction before wiring it into the main framework.

---

## 3. THE DATA LAYER: HIERARCHY & RELATIONSHIPS

The current `.hivemind` folder is a chaotic, flat dump of timestamped files. This poisons agent context and destroys token budgets. It must be rebuilt into a strictly relational database mapped to the filesystem.

* **Manifest-Driven Traversal:** Agents must not glob-read raw directories. They must read `manifest.json` files or auto-generated `INDEX.md` files (symlinked tables of contents) to fast-track navigation.
* **Hierarchical Workspace Reorg:**
* `/state/` -> Active Engine State (`brain.json`, `hierarchy.json`, `tasks.json`, `loop-state.json`).
* `/sessions/` -> Active sessions (YAML frontmatter enforced) and `/archive/` for time-staled exports.
* `/plans/` -> Trajectories, phase plans, debug plans.
* `/mems/` -> Long-term semantic memory (`mems.json`).


* **Time-to-Stale:** Auto-archive mechanisms must sever the hierarchy chain for data older than a set threshold to prevent ghost context.

---

## 4. SYSTEM DYNAMICS: THE 4 ENTRY POINTS

Agent context must be manipulated programmatically across four distinct lifecycle stages. The AI does not decide what to read; the Engine *feeds* the AI what it needs to know using OpenCode SDK mechanisms.

| Entry Point | SDK Mechanism Needed | Expected Engine Behavior |
| --- | --- | --- |
| **1. New Session** | `session.create` / CLI Init | Detect Greenfield vs. Brownfield. If Brownfield, scan architecture automatically. Pull only the active Phase Plan, critical Anchors, and recent Mems. **The agent must never start blind.** |
| **2. Mid-Turn** | `insertReminders` (SDK) | Hook into the user message array. Silently inject synthetic `<system-reminder>` parts dynamically containing active TODOs, current sub-task status, and drift warnings *without stopping the agent*. |
| **3. Compaction** | `experimental.session.compacting` | Intercept the compaction prompt. Inject `hierarchy.json` and active Tasks so the continuation prompt retains structural memory. Switch to "aggressive manifest-only mode" (<1000 chars) after 3+ compactions. |
| **4. Human Intent** | `/commands` & Tool Hooks | Map user prompts (e.g., "investigate") to predefined Skills (`find-skill`). Spawn specific hidden sub-agents via the `Task` tool. Force atomic commits for code changes vs. Mems for synthesized knowledge. |

---

## 5. TASK & TODO GOVERNANCE (THE SMALLEST UNIT)

Tasks are not abstract strings of text; they are strictly governed programmatic nodes.

* **Enforced Delegation:** Complex tasks are skeletonized. Main Tasks split into Sub-Tasks. Sub-tasks must be delegated to scoped sub-agents.
* **Batch Completion:** A Main Task cannot be marked complete until all delegated Sub-Tasks report completion via manifest validation—not AI trust.
* **Forced Atomic Commits:** Whenever a sub-task alters a file (code or artifact), a `tool.execute.after` hook triggers a **forced, timestamped Git commit** via BunShell with a standardized metadata message.
* **The Re-read Chain:** Ticking a task as complete is a trigger. The completion hook *forces* the Engine to re-read related plan sections, update sibling tasks, and adjust trajectories based on conditional changes.

---

## 6. PHASED MASTER ROADMAP (THE UNKNOTTING)

**Current Stage Status:** Tests are currently passing on Dev, but the underlying data layer is silently corrupting. *Execution must be strictly sequential. Do not build Phase B if Phase A is broken.*

### 🛑 PHASE A: Stabilize & Untie the Knot (CURRENT PRIORITY)

*Fix the broken foundation before the agents can think.*

1. **Bug Triage (T1-T3 Data Flow Gaps):**
* Fix `export_cycle` desyncing `brain.json` from `hierarchy.json`.
* Stop `declare_intent` from overwriting templates with legacy formats.
* Fix Stale auto-archive failing to reset `hierarchy.json` (Ghost Context).
* Wire up dead code in `trackSectionUpdate()`.


2. **Structure Reorg:** Execute the `.hivemind` folder reorg (Section 3). Implement `paths.ts` globally.
3. **First-Turn Context:** Ensure Turn 0 always pulls prior context so the agent never starts blind.

### 🟡 PHASE B: Session Lifecycle & Task Governance

1. **Session Objects:** Wire sessions as first-class SDK objects. Auto-export valid JSON + MD on session close to `archive/exports/`.
2. **Task Manifest (`tasks.json`):** Wire OpenCode `todowrite`/`todoread` tool hooks to actively write every action to the manifest.
3. **Atomic Commits:** Wire the BunShell script to force git commits on file-changing sub-tasks.

### 🟢 PHASE C: Agent Tools & Mems Brain

1. **Extraction Tools:** Equip SDK tools with `npx repomix` and enforce `--json` outputs for fast, structured codebase reads.
2. **Semantic Mems:** Save complex reasoning chains to `mems.json`. Enable `recall_mems` via SDK `client.find.text()` for semantic search.
3. **Ralph Loop:** Enable cross-compaction orchestration state that survives 5+ compactions.

### 🔵 PHASE D: Packing Automation & First-Run UX

1. **Smart Governance:** Bind OpenCode Slash Commands (`/hivemind-scan-deep`), Skills, and hidden Agent profiles to automate context injections.
2. **Interactive Wizard:** Fix the silent auto-bootstrap race condition. Force the `@clack/prompts` TUI wizard on `hivemind init` to ensure host project awareness.
3. **Documentation:** Complete the Bilingual (EN/VI) README rewrite explaining this exact architecture.

---

### 🤖 INITIALIZATION PROTOCOL FOR AI AGENTS

**If you are an AI Agent summoned to work on this repository, your immediate response must be:**

1. **Acknowledge this SOT:** State clearly that you understand the strict separation between the Engine (SDK hooks) and the Display (TUI), and the supremacy of the "Smallest Unit."
2. **Verify State:** Acknowledge that the active branch is `dev-v3`.
3. **Target Phase A:** Do NOT propose UI enhancements or command creations. Propose a targeted, surgical execution plan exclusively for **PHASE A (Untie the Knot)** to fix the `export_cycle` and `declare_intent` critical bugs.
4. Wait for human approval before modifying files.