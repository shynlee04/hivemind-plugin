---
version: 2.0
complexity_before: 9
complexity_after: 5
confidence: 7
phases_completed: [skim, investigation-lanes, clarification-gate, repackage]
original_word_count: 352
enhanced_word_count: 2840
findings_count: 27
risk_level: CRITICAL
generated: 2026-04-06
pipeline: prompt-enhance-repackage
---

# Enhanced Session Context Prompt

This document is the restructured output of a 4-phase prompt-enhance pipeline.
The original user prompt was decomposed from a single 352-word monolithic request
into 7 sequential phases with measurable acceptance criteria.

---

<intent>

Audit the harness-experiment workspace to establish a proven baseline of runtime
architecture capabilities (background agents, delegation, concurrency, session
recovery, context governance, injection engine, specialist classification), then
use that baseline as the migration gate for selectively bringing validated content
from .worktrees/product-detox into this workspace.

</intent>

---

<context_workspace>

## Workspace: harness-experiment

- Path: /Users/apple/hivemind-plugin/.worktrees/harness-experiment
- Type: npm package (opencode-harness) — TypeScript plugin for OpenCode
- Source: 33 TypeScript files in src/, 13 test files in tests/
- Build status: typecheck PASSING (tsc --noEmit clean)
- Entry points: opencode-harness → dist/index.js, opencode-harness/plugin → dist/plugin.js
- Dependencies: @opencode-ai/plugin >= 1.1.0 (peer), Node >= 20.0.0

## .hivefiver-meta-builder/ (lab structure)

Six subdirectories with content in active/ and some in refactoring/:

| Lab | Path | Active Content |
|-----|------|---------------|
| agents-lab | agents-lab/active/ | refactoring/ (1 subdirectory) |
| commands-lab | commands-lab/active/ | refactoring/ (1 subdirectory) |
| skills-lab | skills-lab/active/ | 2 spec files + refactoring/ |
| workflows-lab | workflows-lab/active/ | refactoring/ (1 subdirectory) |
| references-lab | references-lab/active/ | refactoring/ (1 subdirectory) |
| plans | (empty active/) | — |

Root files: AGENTS.md, ONBOARDING-WORKFLOW-PROTOCOL.md

## .opencode/ (runtime primitives)

| Category | Count | Notable Entries |
|----------|-------|----------------|
| agents/ | 18 .md files | coordinator, builder, researcher, critic, explore, conductor, hivefiver-*, prompt-* |
| skills/ | 16 directories | meta-builder, oh-my-openagent-reference, coordinating-loop, use-authoring-skills, planning-with-files, user-intent-interactive-loop, command-dev, custom-tools-dev, skill-synthesis, repomix-explorer, opencode-platform-reference, opencode-non-interactive-shell, repomix-exploration-guide, harness-audit, agents-and-subagents-dev |
| commands/ | 12 .md files | start-work, plan, deep-init, deep-research-synthesis-repomix, harness-doctor, ultrawork, hf-audit, hf-create, hf-prompt-enhance, hf-stack |
| rules/ | (exists) | execution-loop.md, coordinator-rules.md, skill-activation.md, anti-patterns.md, commit-governance.md |
| plugins/ | (exists) | harness-control-plane.ts |
| tools/ | (exists) | — |

## Key Reference Documents

| Document | Path |
|----------|------|
| distinguish-hivefiver-meta-builder | docs/meta-builder/distinguish-hivefiver-meta-builder.md |
| updating-for-hivefiver-onboarding | docs/meta-builder/updating-for-hivefiver-onboarding.md |
| spec-briefing | docs/meta-builder/spec-briefing.md |
| prompt-enhancer-deepwiki-instruction | docs/meta-builder/prompt-enhancer-deepwiki-instruction.md |
| Architecture proposal | docs/draft/architecture-proposal-hivemind-v3.md |

## Planning Triplet (STALE — last updated Apr 4)

| File | Path | Status |
|------|------|--------|
| task_plan.md | (root) | Stale |
| findings.md | (root) | Stale |
| progress.md | (root) | Stale |

## oh-my-openagents Reference

- NOT present at .sdk-lib/ in this workspace
- Available as SKILL: oh-my-openagent-reference (in .opencode/skills/)
- Original source: /Users/apple/hivemind-plugin/.worktrees/product-detox/.sdk-lib/oh-my-openagents/
- GitHub: Search for "oh-my-openagent" repository for docs and guides

## Hygiene Items in Workspace Root

Multiple stale session files from previous debugging (session-ses_*.md, fucking-*.md,
hallucinated-*.md, skill-failure-test-*.md) — not referenced by current work, should
be cleaned up.

</context_workspace>

---

<context_product_detox>

## Workspace: product-detox

- Path: /Users/apple/hivemind-plugin/.worktrees/product-detox
- Size: 697MB
- Contains: .sdk-lib/oh-my-openagents/ (primary knowledge source for injection engine patterns)

## Tool Config Pollution (11 tool-specific directories)

.claude, .cursor, .roo, .windsurf, .trae, .qwen, .crush, .qoder, .iflow,
.sisyphus, .codexdisabled, .gemini, .kilo, .agent, .agents, .beads, .factory,
.developing-skills, .experimental-planning

## Validated Content Present

- .sdk-lib/oh-my-openagents/ — agent definitions, plugin system, hooks, circuit breaker,
  concurrency manager, session continuity, skill loader, dynamic prompt builder
- .opencode/ — product-detox's own OpenCode configuration
- .hivemind/ — product-detox's harness state

## .env File Present

An .env file (802 bytes) exists in product-detox root. This MUST be excluded from
any migration — it likely contains secrets or environment-specific configuration.

</context_product_detox>

---

<requirements_decomposed>

The original prompt contains 10 interleaved workstreams. They are decomposed into
7 sequential phases, each with a clear entry condition and output.

## Phase 1: Baseline Audit (READ-ONLY)

Prove what actually works in harness-experiment right now.

- Run typecheck (PASSING — confirmed)
- Run test suite (npm test) — document pass/fail/skip counts
- Map all 33 source files to their purpose and LOC count
- Verify plugin loads without errors (import check)
- Document which AGENTS.md promises are implemented vs aspirational

Entry: None (start immediately)
Output: baseline-audit-YYYY-MM-DD.md in .hivefiver-meta-builder/plans/

## Phase 2: Reference Knowledge Synthesis

Learn from oh-my-openagents the patterns needed for runtime architecture.

- Study oh-my-openagent-reference skill (already loaded in .opencode/skills/)
- Extract: plugin system patterns, hook lifecycle, agent dispatch, session continuity
- Extract: circuit breaker, concurrency manager, category routing, tool restrictions
- Study docs/meta-builder/distinguish-hivefiver-meta-builder.md for meta-builder concepts
- Study docs/meta-builder/updating-for-hivefiver-onboarding.md for onboarding protocol
- Search online for oh-my-openagents GitHub repo documentation

Entry: Phase 1 complete
Output: knowledge-synthesis-YYYY-MM-DD.md in references-lab/active/

## Phase 3: Runtime Architecture Proving

Build and prove the core runtime features one at a time.

Sub-phases (each must pass its own acceptance test before the next starts):

3a. Background Agents — agents run in background, spawn in new panes, auto-cleanup
3b. Delegation Chain — task persistence, parent-child session tracking
3c. Concurrency Control — keyed semaphore, FIFO queue (already partially in concurrency.ts)
3d. Session Recovery — context integrity across session boundaries
3e. Context Governance — rules that persist and enforce across long sessions
3f. Injection Engine — runtime injection of rules, commands, skills, tools with conditions
3g. Specialist Classification — configurable agent presets for domains, category routing
3h. Tool Budget/Circuit Breaker — per-session tool call limits, threshold-based shutdown

Entry: Phase 2 complete
Output: Each sub-phase produces a test file proving the feature works

## Phase 4: Lab Validation (.hivefiver-meta-builder/)

Test all primitive concepts as .md files in labs, with symlinks to .opencode/.

- agents-lab/active/ — test each agent definition loads and triggers correctly
- commands-lab/active/ — test each command parses frontmatter and executes
- skills-lab/active/ — test each skill activates on correct trigger
- workflows-lab/active/ — test workflow orchestration chains execute
- references-lab/active/ — verify reference documents are current

Entry: Phase 3 complete
Output: lab-validation-report-YYYY-MM-DD.md

## Phase 5: Schema Definition

Convert proven runtime primitives into event-triggered, function-call-triggered code.

- Define YAML schema for agent frontmatter (triggers, conditions, tools, temperature)
- Define YAML schema for command frontmatter (arguments, bash injection, agent binding)
- Define YAML schema for skill frontmatter (trigger patterns, prerequisites, layers)
- Generate TypeScript types from schemas
- Generate event emitters and trigger evaluators from schemas
- Wire schema-validated definitions into the plugin's tool/hook system

Entry: Phase 4 complete
Output: src/lib/schemas/ directory with generated code + tests

## Phase 6: Migration Gate

Determine what to bring from product-detox based on proven baseline.

- Inventory product-detox content (excluding pollution directories and .env)
- Match product-detox capabilities against proven harness-experiment baseline
- Create selective migration list (what to bring, what to rebuild, what to discard)
- Execute migration item by item with validation after each

Entry: Phase 5 complete + user approval of migration list
Output: migration-manifest-YYYY-MM-DD.md

## Phase 7: Integration Verification

Prove all systems work together as a cohesive runtime.

- Full test suite passes
- Plugin loads and wires all tools + hooks
- Background agents spawn, report, and clean up
- Delegation chains persist across session boundaries
- Injection engine applies rules conditionally
- Specialist routing dispatches to correct agents
- Schema validation catches malformed definitions

Entry: Phase 6 complete
Output: integration-report-YYYY-MM-DD.md + git tag

</requirements_decomposed>

---

<guardrails>

## Mandatory Safety Constraints

1. **User Space Freeze**: No changes to files in user's home directory or outside
   the two worktrees without explicit per-file approval.

2. **Symlink Integrity**: Before any operation touching .opencode/ or
   .hivefiver-meta-builder/, verify all symlinks resolve. Log broken links immediately.

3. **No Merge Rule**: Never merge product-detox into harness-experiment. Content
   is selectively copied, not merged. No git merge, no git cherry-pick without
   explicit user instruction.

4. **Exclusion List**: The following from product-detox are NEVER migrated:
   - .env (secrets)
   - All 11+ tool config directories (.claude, .cursor, .roo, etc.)
   - node_modules/
   - .git/ internals
   - Any file containing API keys, tokens, or credentials

5. **Pre-flight Check**: Before any agent touches .opencode/ contents, run a
   pre-flight check: list all files to be modified, verify symlinks, confirm
   no broken references. Halt on any failure.

6. **Atomic Verification**: After each phase completes, run typecheck + tests
   before proceeding. If either fails, halt and report.

7. **Planning Triplet**: task_plan.md, findings.md, progress.md must be updated
   at every phase boundary. Never create new planning files — edit in place.

8. **No Orphaned Code**: Every line written must be reachable. No TODO comments,
   no stubs, no placeholder implementations.

9. **Module Size Limit**: Max 500 LOC per module. If a module exceeds this,
   decompose before proceeding.

10. **Context Budget**: Monitor context usage. If compaction_count > 0, pause
    and create a context handoff before continuing.

</guardrails>

---

<acceptance_criteria>

## Per-Phase Success Criteria

| Phase | Criterion | Measurement |
|-------|-----------|-------------|
| 1. Baseline Audit | All source files mapped | 33 files documented with purpose + LOC |
| 1. Baseline Audit | Tests documented | Pass/fail/skip counts recorded |
| 1. Baseline Audit | Implementation gap identified | AGENTS.md promises vs reality table |
| 2. Knowledge Synthesis | oh-my-openagents patterns extracted | Document with 8+ pattern categories |
| 2. Knowledge Synthesis | Both meta-builder docs analyzed | Key concepts summarized |
| 3. Runtime Architecture | Each sub-phase 3a-3h has passing test | 8 test files, all green |
| 3. Runtime Architecture | Background agents spawn + cleanup | Observable in test output |
| 3. Runtime Architecture | Injection engine applies rules | Conditional rule test passes |
| 4. Lab Validation | All lab items load without error | Validation report shows 0 failures |
| 4. Lab Validation | Symlinks verified | All resolve to valid targets |
| 5. Schema Definition | YAML schemas defined for 3 primitive types | Agent, Command, Skill schemas |
| 5. Schema Definition | TypeScript types generated | src/lib/schemas/ compiles clean |
| 5. Schema Definition | Event triggers functional | Trigger evaluator tests pass |
| 6. Migration Gate | Migration list approved by user | User sign-off recorded |
| 6. Migration Gate | Each item validated post-copy | typecheck + tests pass after each |
| 7. Integration | Full test suite green | npm test exits 0 |
| 7. Integration | Plugin loads | Import check passes |
| 7. Integration | All systems synchronous | Integration test proves coordination |

## Global Success Criteria

- npm run typecheck exits 0
- npm test exits 0
- No orphaned files in workspace root
- Planning triplet current (updated within last session)
- All lab symlinks healthy
- No .env or secrets in workspace

</acceptance_criteria>

---

<knowledge_sources>

## Where to Find Each Referenced Resource

| Resource | Correct Location | Access Method |
|----------|-----------------|---------------|
| oh-my-openagents source | .opencode/skills/oh-my-openagent-reference/ | Load skill via skill tool |
| oh-my-openagents raw files | product-detox/.sdk-lib/oh-my-openagents/ | Read tool (cross-worktree) |
| oh-my-openagents GitHub | Search GitHub for "oh-my-openagent" | Web search + GitHub tools |
| distinguish-hivefiver-meta-builder.md | docs/meta-builder/distinguish-hivefiver-meta-builder.md | Read tool |
| updating-for-hivefiver-onboarding.md | docs/meta-builder/updating-for-hivefiver-onboarding.md | Read tool |
| spec-briefing.md | docs/meta-builder/spec-briefing.md | Read tool |
| Architecture proposal | docs/draft/architecture-proposal-hivemind-v3.md | Read tool |
| OpenCode platform reference | .opencode/skills/opencode-platform-reference/ | Load skill via skill tool |
| OpenCode non-interactive shell | .opencode/skills/opencode-non-interactive-shell/ | Load skill via skill tool |
| Repomix exploration guide | .opencode/skills/repomix-exploration-guide/ | Load skill via skill tool |
| Agents (18 definitions) | .opencode/agents/*.md | Read tool |
| Skills (16 definitions) | .opencode/skills/*/SKILL.md | Read tool |
| Commands (12 definitions) | .opencode/commands/*.md | Read tool |
| Rules (5 governance) | .opencode/rules/*.md | Read tool |
| Plugin entry | .opencode/plugins/harness-control-plane.ts | Read tool |

</knowledge_sources>

---

<exclusion_list>

## What NOT to Bring from product-detox

### Absolute Exclusions (never migrate)

- .env (802 bytes — secrets/environment config)
- .claude/ (tool-specific config)
- .cursor/ (tool-specific config)
- .roo/ (tool-specific config)
- .windsurf/ (tool-specific config)
- .trae/ (tool-specific config)
- .qwen/ (tool-specific config)
- .crush/ (tool-specific config)
- .qoder/ (tool-specific config)
- .iflow/ (tool-specific config)
- .sisyphus/ (tool-specific config)
- .codexdisabled/ (tool-specific config)
- .gemini/ (tool-specific config)
- .kilo/ (tool-specific config)
- .agent/ (tool-specific config)
- .agents/ (tool-specific config)
- .beads/ (tool-specific config)
- .factory/ (tool-specific config)
- .developing-skills/ (tool-specific config)
- .experimental-planning/ (tool-specific config)
- node_modules/ (regenerated)
- .git/ internals (separate repo history)
- .vscode/ (IDE config)

### Conditional Exclusions (evaluate before migrating)

- .sdk-lib/oh-my-openagents/ — extract patterns, do not copy wholesale
- .opencode/ — compare with harness-experiment's .opencode/, merge selectively
- .hivemind/ — compare state files, may be product-detox specific
- .archive/ — old content, evaluate relevance
- Any file matching *.secret*, *.key*, *.token*, *credential*

</exclusion_list>

---

<execution_plan>

## Phase-by-Phase Execution

### Phase 1: Baseline Audit
- **Input**: workspace as-is
- **Agent**: researcher (read-only investigation)
- **Steps**:
  1. Run `npm run typecheck` — confirm passing
  2. Run `npm test` — record results
  3. Catalog all 33 src/ files with LOC and purpose
  4. Map AGENTS.md promises to implemented features
  5. Document test coverage gaps
  6. Write baseline-audit-YYYY-MM-DD.md to .hivefiver-meta-builder/plans/
- **Output**: Complete workspace baseline document
- **Gate**: Document reviewed by user before Phase 2

### Phase 2: Knowledge Synthesis
- **Input**: baseline audit, oh-my-openagent-reference skill, meta-builder docs
- **Agent**: researcher (knowledge extraction) + deep-research (online validation)
- **Steps**:
  1. Load oh-my-openagent-reference skill
  2. Extract 8 pattern categories: plugin system, hooks, agent dispatch, session continuity,
     circuit breaker, concurrency, category routing, tool restrictions
  3. Read docs/meta-builder/distinguish-hivefiver-meta-builder.md
  4. Read docs/meta-builder/updating-for-hivefiver-onboarding.md
  5. Search online for oh-my-openagents GitHub documentation
  6. Cross-reference patterns with harness-experiment's existing implementation
  7. Write knowledge-synthesis-YYYY-MM-DD.md to references-lab/active/
- **Output**: Pattern catalog with implementation mapping
- **Gate**: Synthesis reviewed by user before Phase 3

### Phase 3: Runtime Architecture (8 sub-phases)
- **Input**: knowledge synthesis, existing source code
- **Agent**: builder (implementation) + critic (review) per sub-phase
- **Steps per sub-phase**:
  1. Write test for the feature (TDD)
  2. Implement minimum code to pass test
  3. Run typecheck + tests
  4. If fails, debug and fix
  5. If passes, commit with format "phase-3{letter}: {feature} — proven via test"
  6. Update progress.md
- **Sub-phase order**: 3a→3b→3c→3d→3e→3f→3g→3h
- **Output**: 8 passing test files + implementation code
- **Gate**: All 8 sub-phases green before Phase 4

### Phase 4: Lab Validation
- **Input**: proven runtime features, lab .md files
- **Agent**: critic (validation) + builder (fixes)
- **Steps**:
  1. Inventory all files in agents-lab/active/, commands-lab/active/, skills-lab/active/,
     workflows-lab/active/, references-lab/active/
  2. For each lab item, verify it loads/triggers correctly via symlink to .opencode/
  3. Verify all symlinks resolve (ls -la check)
  4. Document any broken references
  5. Fix or remove broken items
  6. Write lab-validation-report-YYYY-MM-DD.md
- **Output**: Validation report with 0 failures
- **Gate**: All labs validated before Phase 5

### Phase 5: Schema Definition
- **Input**: validated lab primitives, proven runtime features
- **Agent**: builder (schema design + code generation)
- **Steps**:
  1. Define YAML schema for Agent frontmatter
  2. Define YAML schema for Command frontmatter
  3. Define YAML schema for Skill frontmatter
  4. Generate TypeScript types from schemas in src/lib/schemas/
  5. Build event emitter system for triggers
  6. Build trigger evaluator for conditional activation
  7. Wire schemas into plugin's tool/hook system
  8. Write tests for schema validation
  9. Run typecheck + tests
- **Output**: src/lib/schemas/ directory with generated code + tests
- **Gate**: All schema tests pass before Phase 6

### Phase 6: Migration Gate
- **Input**: proven baseline, product-detox inventory
- **Agent**: researcher (inventory) + coordinator (approval routing)
- **Steps**:
  1. Inventory product-detox excluding .env and pollution directories
  2. Match each item against harness-experiment's proven capabilities
  3. Categorize: BRING (copy), REBUILD (implement fresh), DISCARD (not needed)
  4. Present migration manifest to user for approval
  5. Execute approved migrations one item at a time
  6. After each item: run typecheck + tests
  7. Write migration-manifest-YYYY-MM-DD.md
- **Output**: Migration manifest with user sign-off
- **Gate**: User approves migration list. Each item validated post-copy.

### Phase 7: Integration Verification
- **Input**: all previous phase outputs
- **Agent**: critic (final validation)
- **Steps**:
  1. Run full test suite (npm test)
  2. Run typecheck (npm run typecheck)
  3. Verify plugin loads (import check)
  4. Verify background agents spawn + cleanup
  5. Verify delegation chains persist
  6. Verify injection engine applies rules conditionally
  7. Verify specialist routing dispatches correctly
  8. Verify schema validation catches malformed definitions
  9. Clean up workspace root (remove stale session files)
  10. Update planning triplet to current state
  11. Write integration-report-YYYY-MM-DD.md
  12. Git tag: v0.1.0-baseline-proven
- **Output**: Integration report + git tag
- **Gate**: All verification steps pass

</execution_plan>

---

<open_questions>

## Items Needing User Clarification

### Q1: "Healer and Builder" Definition
The original prompt mentions "the healer and builder to introduce the foundationally
working baseline." Is this:
  (a) Two specific agents (healer = diagnostic/repair, builder = implementation)?
  (b) A metaphor for the overall process?
  (c) Something else?
**Impact**: Affects agent-lab definitions and Phase 3 agent assignments.

### Q2: Acceptance Criteria for "Proven"
The prompt says features must be "proven and proven." What constitutes proof?
  (a) Unit tests passing?
  (b) Integration tests + manual verification?
  (c) A live demo scenario?
**Default if unanswered**: Passing automated tests + typecheck (strictest automated gate).

### Q3: Priority Order for Runtime Features
Phase 3 lists 8 sub-phases. If context budget is limited, which are the MUST-HAVE
features that block migration? Suggested priority order:
  1. Background Agents (3a) — core capability
  2. Delegation Chain (3b) — task persistence
  3. Concurrency Control (3c) — safety
  4. Session Recovery (3d) — continuity
  5. Injection Engine (3f) — runtime steering
  6. Context Governance (3e) — cross-session rules
  7. Specialist Classification (3g) — domain routing
  8. Circuit Breaker (3h) — safety net
**Default if unanswered**: Use suggested order above.

### Q4: Scope of Schema-Generated Code
Phase 5 converts YAML frontmatter into event-triggered code. Should this be:
  (a) A code generator that outputs .ts files (build-time)?
  (b) A runtime interpreter that reads .md files at plugin load?
  (c) A hybrid (generate types at build, interpret triggers at runtime)?
**Impact**: Fundamental architecture decision for Phase 5.

### Q5: Stale Session Files Cleanup
The workspace root contains ~15 stale session/debug files (session-ses_*.md,
fucking-*.md, etc.). Can these be deleted as part of Phase 1 cleanup?
**Default if unanswered**: Archive to .archive/ rather than delete.

</open_questions>
