# Batch: Context Integrity

**Purpose**: Verifies, assesses, and researches project and session state before any work proceeds.
**Governance**: All skills in this batch share the principle that evidence before conclusion — no claim is trusted without machine-readable proof or graded sources.

## Skills

| Skill | Entry Point | Purpose | Dependencies |
|-------|------------|---------|--------------|
| context-entry-verify | SKILL.md | Deterministic JSON-verified proof of project state via gate-chain checks (build, tests, git, dependencies) | None (self-contained, zero npm deps) |
| context-intelligence-entry | SKILL.md | Session-level context-health probe with rot detection, trust scoring, and three modes (quick/rot/full) | context-entry-verify (for project-truth boundary) |
| git-continuity-memory | SKILL.md | Git-based continuity recovery, commit-history semantic retrieval, and session identity persistence across turns | context-intelligence-entry (verify session before trusting continuity) |
| hivemind-research | SKILL.md | Thin router that classifies research requests and delegates to framework (methodology) or tools (MCP protocols) | hivemind-research-framework, hivemind-research-tools |
| hivemind-research-framework | SKILL.md | Research methodology: 6 research types, question framing, 4-dimension evidence grading, confidence scoring, contradiction resolution | hivemind-research-tools (for MCP execution) |
| hivemind-research-tools | SKILL.md | MCP tool protocols for 8 servers (Context7, DeepWiki, Repomix, Tavily, Exa, etc.), chaining strategies, and fallback hierarchies | hivemind-research-framework (for grading rules) |

## Cross-Cutting Concerns

- **Evidence grading**: context-entry-verify uses JSON gate passes/fails; hivemind-research-framework uses 4-dimension evidence grades (Authority, Recency, Corroboration, Relevance). Both produce machine-parseable verdicts.
- **Distrust posture**: context-intelligence-entry implements trust-nothing mode; git-continuity-memory treats prior session memory as suspect; context-entry-verify provides hard proof that bypasses distrust.
- **Session continuity**: git-continuity-memory owns `sessions/continuity.json` and `longhaul/task-state.json`; context-intelligence-entry reads these at session start to determine freshness.
- **Deterministic output**: All skills produce structured JSON or templated markdown — no free-form conclusions without evidence fields.
- **Orchestrator protection**: Rot/full modes from context-intelligence-entry and deep research from hivemind-research should be delegated to subagents, not run inline in the orchestrator.

## Integration Points

- **Connects to batch-hivemind-context** via `use-hivemind-detox-refactor` router: context-intelligence-entry and context-entry-verify are the **context** branch family (Bundle A) that the detox router invokes at Stage 1 (triage), Stage 2 (context isolation), Stage 8 (restoration), and Stage 9 (verification).
- **Research skills feed delegation**: hivemind-research delegation packets use `use-hivemind-delegation` for subagent spawning of parallel research threads.
- **Spec distillation consumes research**: spec-distillation (in batch-hivemind-context) uses hivemind-research to resolve ambiguous requirements with evidence.
- **Git continuity bridges both batches**: git-continuity-memory records `activity_type` and `phase_type` enums shared with use-hivemind-delegation and hivemind-codemap.
- **Invariant ordering**: context-intelligence-entry must run before git-continuity-memory (verify session before trusting continuity). context-entry-verify gate-chain runs before any completion claim in batch-hivemind-context's Stage 8/9.
