# OpenCode Conductor — Lifecycle Automation Research Findings

**Date:** 2026-04-08
**Source:** Gemini CLI Conductor Extension (`~/.gemini/extensions/conductor/`)
**Purpose:** Extract Context → Spec → Plan → Implement lifecycle patterns for HiveMind V3 Phase 2 runtime feature design.

---

## 1. Lifecycle State Machine (Phases, Transitions, Guards)

### Finding 1.1: Three-Tier Status State Machine with Markdown-Encoding

Conductor encodes state directly in markdown checkbox syntax across two levels — the **Tracks Registry** (`conductor/tracks.md`) and individual **Implementation Plans** (`conductor/tracks/<id>/plan.md`).

- **`[ ]`** = Pending (not started)
- **`[~]`** = In Progress (actively being worked on)
- **`[x]`** = Completed (done, verified, checkpointed)

This encoding is parsed by splitting file content on `---` separators and extracting status markers from headings and list items. The status transitions are strictly unidirectional: `[ ]` → `[~]` → `[x]`. There is no built-in rollback within the state machine itself — rollback is handled by the separate `/conductor:revert` command via git history analysis.

**Sources:**
- `implement.toml` lines 30-31: "parse this file by splitting its content by the `---` separator... extract the status (`[ ]`, `[~]`, `[x]`)"
- `workflow.md` lines 20, 62: "change the task from `[ ]` to `[~]`" / "update its status from `[~]` to `[x]`"
- `setup.toml` lines 44-51: Resume fast-forward table maps artifact existence to target sections, preventing redundant state transitions.

### Finding 1.2: Phase-Level Checkpointing with Git SHA Anchors

Each phase in `plan.md` carries a `[checkpoint: <sha>]` anchor appended to its heading. This serves as both a state transition gate and a git history reference point. The checkpoint is created as a dedicated commit (`conductor(checkpoint): Checkpoint end of Phase X`) with a verification report attached via `git notes`.

The checkpoint protocol triggers automatically when the last task of a phase completes. It performs: (1) test coverage verification for all changed files since the previous checkpoint, (2) automated test execution with max-2-retry debugging, (3) manual verification plan proposal requiring explicit user confirmation, (4) checkpoint commit creation, (5) git notes attachment, (6) plan SHA recording.

**Sources:**
- `workflow.md` lines 69-135: Full "Phase Completion Verification and Checkpointing Protocol" (10 steps)
- `workflow.md` line 76: "Read `plan.md` to find the Git commit SHA of the *previous* phase's checkpoint"
- `plan.md` (real artifact, line 3): `## Phase 1: Core SSE Infrastructure & OpenTUI Setup [checkpoint: 39432e5]`

### Finding 1.3: Setup Resume Protocol with Artifact-Based State Detection

The `/conductor:setup` command implements a resume protocol that detects partial setup state by checking for artifact existence in priority order. If `index.md` exists but tracks are incomplete, it deletes the tracks directory and restarts track generation. If `workflow.md` exists, it skips to index generation. This prevents redundant interactive questioning and enables recovery from interrupted sessions.

**Sources:**
- `setup.toml` lines 40-53: Priority table mapping artifact existence to target sections
- `setup.toml` line 405: "If you are resuming this section because a previous setup was interrupted, check if the `conductor/tracks/` directory exists but is incomplete. If it exists, **delete** the entire `conductor/tracks/` directory"

---

## 2. Spec Generation (How Context Becomes Specs)

### Finding 2.1: Interactive Spec Drafting with Batched Questioning

Spec generation uses the `ask_user` tool with batched questions (up to 4 per call) to gather requirements. Questions are classified as either **Additive** (multi-select, for brainstorming scope) or **Exclusive Choice** (single-select, for foundational commitments). Each question includes 2-4 pre-populated options with labels and descriptions, plus an automatic "Other" option for custom input.

For **Feature** tracks: 3-4 clarifying questions about implementation details, interactions, inputs/outputs.
For **Bug/Chore** tracks: 2-3 questions about reproduction steps, scope, success criteria.

The drafted spec is embedded directly in the confirmation prompt for inline review, with "Approve" or "Revise" options. The revision loop continues until explicit approval.

**Sources:**
- `newTrack.toml` lines 53-84: Questioning phase with classification rules and batched ask_user calls
- `newTrack.toml` lines 88-103: User confirmation loop with embedded draft content

### Finding 2.2: Context-Aware Spec Generation from Project Artifacts

Spec questions are not generic — they are informed by reading the project's `product.md`, `tech-stack.md`, and `product-guidelines.md` via the **Universal File Resolution Protocol**. For brownfield projects, the setup phase performs a read-only code analysis (respecting `.geminiignore`/`.gitignore`) to infer tech stack, architecture, and project goals before generating specs. This ensures specs reference actual project context rather than hypothetical constructs.

**Sources:**
- `newTrack.toml` lines 32-33: "Read and understand the content of the project documents (**Product Definition**, **Tech Stack**, etc.)"
- `setup.toml` lines 96-115: Brownfield initialization protocol with code analysis, file triage, and context extraction
- `GEMINI.md` lines 7-27: Universal File Resolution Protocol for locating context files via index.md links

### Finding 2.3: Spec Structure Standardization

Generated specs follow a standardized structure: Overview, Functional Requirements, Non-Functional Requirements, Acceptance Criteria, and Out of Scope. This structure is enforced by the prompt template, not by schema validation. The spec serves as the requirements source of truth for subsequent plan generation.

**Sources:**
- `newTrack.toml` line 86: "draft the content for the track's `spec.md` file, including sections like Overview, Functional Requirements, Non-Functional Requirements (if any), Acceptance Criteria, and Out of Scope"
- Real artifact `spec.md` (opentui_integration_20260317): Contains Overview, Functional Requirements, Non-Functional Requirements sections

---

## 3. Plan Creation (How Specs Become Plans)

### Finding 3.1: Workflow-Driven Plan Structure Injection

Plan generation reads the project's `workflow.md` file and adapts the plan structure to match the defined methodology. If the workflow specifies TDD, each feature task is automatically decomposed into "Write Tests" and "Implement Feature" sub-tasks. This is not a separate planning step — it is embedded in the plan generation prompt itself.

Additionally, if the workflow defines a "Phase Completion Verification and Checkpointing Protocol," the planner automatically injects a meta-task at the end of each phase: `- [ ] Task: Conductor - User Manual Verification '<Phase Name>' (Protocol in workflow.md)`.

**Sources:**
- `newTrack.toml` lines 113-118: "The plan structure MUST adhere to the methodology in the **Workflow** file (e.g., TDD tasks for 'Write Tests' and 'Implement')"
- `newTrack.toml` lines 118-119: "Inject Phase Completion Tasks" with exact format specification
- `setup.toml` line 492-496: Same injection logic for initial track generation

### Finding 3.2: Hierarchical Task Decomposition with Status Markers

Plans use a strict three-level hierarchy: **Phases** (markdown `##` headings) → **Tasks** (`- [ ] Task: ...`) → **Sub-tasks** (`    - [ ] ...`). Every task and sub-task carries a status marker. Completed tasks append their commit SHA (first 7 characters) after the task text.

The plan is the single source of truth for execution state. Task selection during implementation is strictly sequential — "Choose the next available task from `plan.md` in sequential order."

**Sources:**
- `newTrack.toml` lines 115-117: Status marker format requirements
- `workflow.md` lines 18-21: Sequential task selection and status transition rules
- Real artifact `plan.md` (opentui_integration_20260317): Shows Phases → Tasks → Sub-tasks hierarchy with SHA annotations

### Finding 3.3: Track ID Generation and Uniqueness Enforcement

Track IDs follow the format `<shortname>_<YYYYMMDD>`. Before creating a new track, the system checks for existing track directories and extracts short names to prevent collisions. If a duplicate short name is detected, track creation halts with a user-facing error message.

**Sources:**
- `newTrack.toml` lines 139-140: "Extract the short names from these track IDs... If the proposed short name for the new track matches an existing short name, halt the `newTrack` creation"
- `newTrack.toml` line 140: Track ID format `shortname_YYYYMMDD`
- `setup.toml` line 498: "Generate and Store Track ID" with same format

---

## 4. Implementation Orchestration (How Plans Become Code)

### Finding 4.1: Workflow-Delegated Task Execution Loop

The `/conductor:implement` command does not hardcode implementation steps. Instead, it reads the `workflow.md` file and delegates task execution to the procedures defined therein. The workflow file becomes the runtime execution engine. The implement command's role is purely orchestration: select track → load context → iterate tasks → defer to workflow → update status.

The task iteration loop is explicit: "You MUST now loop through each task in the track's **Implementation Plan** one by one." For each task, the workflow's "Task Workflow" section is executed precisely, including TDD red-green-refactor, coverage verification, and commit procedures.

**Sources:**
- `implement.toml` lines 87-90: "Iterate Through Tasks... For Each Task, You MUST: Defer to Workflow: The **Workflow** file is the **single source of truth** for the entire task lifecycle"
- `implement.toml` line 91: "Every human-in-the-loop interaction... MUST be conducted using the `ask_user` tool"

### Finding 4.2: Per-Task Git Integration with Notes Attachment

Each completed task triggers a specific git workflow: (1) commit code changes, (2) get commit hash, (3) draft task summary, (4) attach summary via `git notes add -m`, (5) update plan.md with `[x]` status and SHA, (6) commit plan update. This creates an auditable chain linking every plan item to its implementation commit and metadata.

**Sources:**
- `workflow.md` lines 47-67: Steps 8-11 of Standard Task Workflow (commit, git notes, SHA recording, plan commit)
- `workflow.md` lines 52-59: Git notes attachment with full summary format

### Finding 4.3: Post-Track Documentation Synchronization

After a track reaches `[x]` status, Conductor runs a synchronization protocol that analyzes the completed spec against project-level documents (`product.md`, `tech-stack.md`, `product-guidelines.md`). It proposes diff-format updates for each affected document, requiring explicit user approval before applying changes. Product guidelines updates are strictly controlled — only triggered by significant strategic shifts (rebrand, philosophy change), not routine features.

**Sources:**
- `implement.toml` lines 100-172: Full "SYNCHRONIZE PROJECT DOCUMENTATION" protocol
- `implement.toml` lines 146-148: "CRITICAL WARNING: This file defines the core identity... should be modified with extreme caution and ONLY in cases of significant strategic shifts"

---

## 5. Failure Handling (What Happens When Phases Fail)

### Finding 5.1: Max-Two-Retry Debugging with Escalation Gate

The Phase Completion Verification Protocol implements a strict failure handling pattern: if automated tests fail during phase verification, the agent may propose a fix a **maximum of two times**. If tests still fail after the second proposed fix, the agent **must stop**, report the persistent failure, and ask the user for guidance. This prevents infinite debug loops and forces human intervention at a defined threshold.

**Sources:**
- `workflow.md` lines 83-87: "If tests fail, you **must** inform the user and begin debugging. You may attempt to propose a fix a **maximum of two times**. If the tests still fail after your second proposed fix, you **must stop**, report the persistent failure, and ask the user for guidance"

### Finding 5.2: Git-Aware Revert with Ghost Commit Detection

The `/conductor:revert` command handles failure scenarios where implementation needs to be undone. It implements a 4-phase protocol: (1) Interactive target selection, (2) Git reconciliation with "ghost commit" detection (handles rebased/squashed commits by searching for similar messages), (3) Final execution plan confirmation, (4) Execution with conflict detection.

For merge conflicts during revert, the agent halts and provides manual resolution instructions. After revert, it verifies the plan state and performs file edits if the plan is out of sync.

**Sources:**
- `revert.toml` lines 76-94: Phase 2 — Git reconciliation with ghost commit handling
- `revert.toml` lines 131-134: "Handle Conflicts: If any revert command fails due to a merge conflict, halt and provide the user with clear instructions for manual resolution"
- `revert.toml` line 133: "Verify Plan State: After all reverts succeed, read the relevant **Implementation Plan** file(s) again to ensure the reverted item has been correctly reset"

### Finding 5.3: Tool Call Failure Halting Protocol

Every Conductor command begins with a universal directive: "You must validate the success of every tool call. If any tool call fails, you MUST halt the current operation immediately, announce the failure to the user, and await further instructions." This is a fail-fast pattern that prevents cascading errors from corrupting project state.

Additionally, the setup check protocol verifies core context files exist before any operation. If `product.md`, `tech-stack.md`, or `workflow.md` are missing, the operation halts with a directive to run `/conductor:setup`.

**Sources:**
- `implement.toml` line 6: "CRITICAL: You must validate the success of every tool call. If any tool call fails, you MUST halt the current operation immediately"
- `newTrack.toml` lines 16-23: Setup check with halt on missing files
- `review.toml` lines 27-30: Same pattern with explicit missing file listing

### Finding 5.4: Review-Driven Fix Workflow with Decision Branching

The `/conductor:review` command implements a structured decision tree when issues are found: (1) Classify severity (Critical/High/Medium/Low), (2) Present findings with file:line references and diff suggestions, (3) Branch on user decision — "Apply Fixes" (auto-apply), "Manual Fix" (halt for user), or "Complete Track" (ignore warnings). Review fixes are tracked as a separate "Review Fixes" phase in the plan with their own commit SHA.

**Sources:**
- `review.toml` lines 136-156: Review decision branching with ask_user tool
- `review.toml` lines 174-198: Track-specific review fix handling with plan update

---

## 6. Applicability to HiveMind V3

### Finding 6.1: Strong Alignment — Track/Phase Model Maps to HiveMind's Delegation Packets

Conductor's track system (spec → plan → implement → verify → checkpoint) maps well to HiveMind V3's delegation packet concept. Each track is analogous to a delegated task with requirements (spec), execution plan (plan.md), and verification (checkpoint protocol). The key difference is that Conductor operates at the **project management layer** (markdown files + git) while HiveMind operates at the **runtime layer** (TypeScript plugin + SDK calls).

**Adaptation approach:** HiveMind could adopt Conductor's artifact structure (`spec.md`, `plan.md`, `metadata.json`) as the wire format for delegation packets, replacing the current in-memory task representation. This would make delegation durable across session restarts.

**Sources:**
- `newTrack.toml` lines 142-152: metadata.json structure with track_id, type, status, timestamps
- `AGENTS.md` (HiveMind): "Delegation packet" terminology in table
- `continuity.ts` (HiveMind): Current durable JSON persistence mechanism

### Finding 6.2: Workflow-as-Configuration Pattern Is Directly Portable

Conductor's pattern of reading `workflow.md` at runtime to determine execution behavior (TDD vs. non-TDD, per-task vs. per-phase commits, checkpoint protocols) is directly applicable to HiveMind. Instead of hardcoding lifecycle behavior in TypeScript, HiveMind could load a workflow configuration file that defines: task lifecycle steps, verification gates, commit frequency, and failure handling thresholds.

This aligns with HiveMind's existing architecture where `workflow.md` is already referenced in the conductor directory and the plugin layer is meant to be thin (no business logic).

**Sources:**
- `implement.toml` lines 87-90: Workflow delegation pattern
- `AGENTS.md` (HiveMind): "Plugin (assembly)" — "zero business logic in the plugin layer"
- `workflow.md` (Conductor): Full task lifecycle definition externalized from code

### Finding 6.3: Checkpoint Protocol Provides Blueprint for HiveMind's Session Recovery

Conductor's Phase Completion Verification and Checkpointing Protocol (10 steps, workflow.md lines 69-135) provides a concrete blueprint for HiveMind's session recovery feature. The key elements are:

1. **Scope determination** via git diff between checkpoints
2. **Test coverage verification** for changed files
3. **Automated test execution** with bounded retry (max 2)
4. **Manual verification plan** requiring explicit user confirmation
5. **Checkpoint commit** with verification report in git notes
6. **SHA recording** in plan for future reference

HiveMind's `continuity.ts` already implements durable JSON persistence. Adding checkpoint SHA tracking and git-notes-style verification reports would bridge the gap between Conductor's markdown-based approach and HiveMind's runtime approach.

**Sources:**
- `workflow.md` lines 69-135: Full checkpoint protocol
- `AGENTS.md` (HiveMind): "continuity.ts — Durable JSON persistence (~635 LOC)"
- `AGENTS.md` (HiveMind): "Session recovery" listed as runtime feature

### Finding 6.4: Gaps — Conductor Lacks Multi-Track Concurrency and Agent Delegation

Conductor is fundamentally **single-track, single-agent, sequential**. It has no concept of:
- Running multiple tracks in parallel
- Delegating tasks to specialized subagents
- Task queuing or priority-based scheduling
- Circuit breaker patterns or tool budget management

These are core HiveMind V3 features that would need to be designed independently. Conductor's value is in the **lifecycle artifact structure** and **verification protocol**, not in concurrency or delegation patterns.

**Sources:**
- `implement.toml` lines 48-50: "Find the first track in the parsed tracks file that is NOT marked as `[x]`" — sequential only
- `AGENTS.md` (HiveMind): "task queuing, category system, concurrency control" as runtime features
- `AGENTS.md` (HiveMind): "CIRCUIT_BREAKER_THRESHOLD, MAX_TOOL_CALLS_PER_SESSION" in plugin.ts

### Finding 6.5: Universal File Resolution Protocol Is a Reusable Pattern

Conductor's **Universal File Resolution Protocol** (GEMINI.md lines 7-27) provides a robust pattern for locating files via index.md links with fallback to default paths. This is directly applicable to HiveMind's skill/agent/command loading system, where artifacts need to be discovered across `.opencode/` directories.

The protocol's key insight is **indirection through index files** rather than hardcoded paths, enabling flexible directory structures while maintaining reliable file discovery.

**Sources:**
- `GEMINI.md` lines 7-27: Full Universal File Resolution Protocol with 5-step process
- `AGENTS.md` (HiveMind): ".opencode/ — Soft meta-concepts (skills, agents, commands)"

---

## Appendix: Artifact Reference

| Artifact | Location | Purpose |
|----------|----------|---------|
| `product.md` | `conductor/product.md` | Product definition, goals, users |
| `product-guidelines.md` | `conductor/product-guidelines.md` | Brand, UX, prose style rules |
| `tech-stack.md` | `conductor/tech-stack.md` | Languages, frameworks, databases |
| `workflow.md` | `conductor/workflow.md` | Task lifecycle, TDD, commit rules |
| `tracks.md` | `conductor/tracks.md` | Registry of all tracks with status |
| `tracks/<id>/spec.md` | `conductor/tracks/<id>/spec.md` | Track-specific requirements |
| `tracks/<id>/plan.md` | `conductor/tracks/<id>/plan.md` | Hierarchical implementation plan |
| `tracks/<id>/metadata.json` | `conductor/tracks/<id>/metadata.json` | Track metadata (id, type, status, timestamps) |
| `tracks/<id>/index.md` | `conductor/tracks/<id>/index.md` | Track context index with links |
| `index.md` | `conductor/index.md` | Project context index with links |

## Appendix: Command Reference

| Command | Purpose | Key Artifacts Modified |
|---------|---------|----------------------|
| `/conductor:setup` | Initialize project context | product.md, tech-stack.md, workflow.md, tracks.md |
| `/conductor:newTrack` | Create spec + plan for new feature | tracks/<id>/spec.md, tracks/<id>/plan.md, tracks.md |
| `/conductor:implement` | Execute track tasks sequentially | tracks/<id>/plan.md (status updates), git commits |
| `/conductor:status` | Display progress overview | Reads tracks.md + all plan.md files |
| `/conductor:review` | Review completed work against standards | Reads plan.md, guidelines, runs tests |
| `/conductor:revert` | Undo track/phase/task via git history | Git history, plan.md status reset |
