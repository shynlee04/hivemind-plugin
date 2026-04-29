---
phase: SE-2-hm-artifact-hierarchy
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/SKILL.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/references/metadata-schema.json"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/references/state-transitions.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/references/file-formats.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/templates/task_plan.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/templates/findings.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/templates/progress.md"
  - ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/research/design-decisions.md"
autonomous: true
requirements: [SE-2-R01, SE-2-R02]
must_haves:
  truths:
    - "hm-planning-persistence skill exists with valid SKILL.md frontmatter and pipeline contract"
    - "The skill creates .hivemind/state/planning/<session-id>/ directory structure when invoked"
    - "All bundled resources (references/, templates/, research/) are present and complete"
    - "SKILL.md passes SKILL-CRITERIA-SHORT.md quality gate"
    - "Research design-decisions.md answers all 7 key design questions from CONTEXT.md"
  artifacts:
    - path: ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/SKILL.md"
      provides: "Skill entry point with frontmatter, pipeline contract, and procedural workflow"
      min_lines: 150
    - path: ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/research/design-decisions.md"
      provides: "Research evidence for all design choices per D-08 mandate"
      min_lines: 200
    - path: ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/references/file-formats.md"
      provides: "Canonical format definitions for task_plan.md, findings.md, progress.md"
      min_lines: 80
    - path: ".hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/templates/task_plan.md"
      provides: "Template with goal + phases + decisions structure"
      min_lines: 40
  key_links:
    - from: "hm-planning-persistence SKILL.md"
      to: ".hivemind/state/planning/<session-id>/"
      via: "directory creation on skill invocation"
      pattern: "mkdir.*\\.hivemind/state/planning"
    - from: "hm-planning-persistence SKILL.md frontmatter"
      to: "downstream pipeline skills (SE-3 through SE-6)"
      via: "pipeline contract YAML declaring reads/writes/upstream/downstream"
      pattern: "pipeline:"
---

<objective>
Create `hm-planning-persistence`, the new canonical planning persistence skill that replaces the disabled `hm-planning-with-files`. This is the foundation skill for the entire planning pipeline — it must exist before any downstream skills can be built or tested.

Purpose: Establish the persistence backbone that all pipeline skills (SE-3 through SE-6) consume. Per D-01, all planning artifacts persist to `.hivemind/state/planning/<session-id>/`. Per D-09, the skill must declare an explicit pipeline integration contract.
Output: Complete skill package with SKILL.md, bundled resources (references/, templates/), and research/design-decisions.md documenting all design choices.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/workstreams/skill-ecosystem/phases/SE-2-hm-artifact-hierarchy/SE-2-CONTEXT.md
@.hivefiver-meta-builder/SKILL-CRITERIA-SHORT.md
@.opencode/skills/donotusethis-hm-planning-with-files/SKILL-DISABLED.md

<interfaces>
<!-- Key patterns from the disabled skill that hm-planning-persistence replaces -->

From disabled hm-planning-with-files SKILL-DISABLED.md:
- Three-file system: task_plan.md (goal + phases + decisions), findings.md (research + discoveries), progress.md (session log + errors + handoffs)
- Tiered response: INIT → CHECKPOINT → ABSORB → PIVOT → LIGHT
- "Read Before Write" discipline
- Error Discipline: Log → Retry Once → Change Approach → Escalate
- Session Recovery protocol after /clear
- Subagent Envelope Pattern for handoffs

From SKILL-CRITERIA-SHORT.md:
- Skills must belong to: domain expertise, new capabilities, repeatable workflows, interoperability
- Correct lineage: hm-* = shipped (hm-planning-persistence IS hm-*)
- Correct hierarchy: sub-session level for delegated agents (NOT coordinator/orchestrator)
- Correct task group: How-to-Process (workflows, guardrails, pipelines)
- Description must land 90% pick rate
- SKILL.md ≤ 500 lines (progressive disclosure)
- Bundled resources: references/, scripts/, templates/ as needed
- NOT generic AI-written — synthesized from real patterns

Pipeline contract format (D-09):
```yaml
pipeline:
  stage: persistence
  reads: [".hivemind/state/session-continuity.json"]
  writes: [".hivemind/state/planning/<session-id>/task_plan.md", ".hivemind/state/planning/<session-id>/findings.md", ".hivemind/state/planning/<session-id>/progress.md"]
  upstream: ["hm-user-intent-interactive-loop", "hm-spec-driven-authoring"]
  downstream: ["hm-brainstorm", "hm-requirements-analysis", "hm-plan-generator", "hm-research-chain", "hm-code-review", "hm-uat-verify", "hm-autonomous-driver"]
```
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Structured Research — Pattern Analysis + Design Decisions</name>
  <files>.hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/research/design-decisions.md</files>
  <action>
Execute the D-08 Research-Before-Creation mandate for hm-planning-persistence. Produce `research/design-decisions.md` covering:

1. **Pattern Analysis of GSD equivalents:**
   - Deep-read the disabled skill at `.opencode/skills/donotusethis-hm-planning-with-files/SKILL-DISABLED.md` (already in context)
   - Deep-read its references/ if they exist (check disk)
   - Extract: What patterns work? What was disabled and why? What's worth keeping?
   - Analyze GSD workflows: `gsd-planning-with-files` (disabled), `gsd-execute-phase` (state tracking), `gsd-pause-work` (serialization), `gsd-resume-work` (reconstruction), `gsd-plan-phase` (format conventions)
   - Note: GSD skill files are at `.opencode/get-shit-done/skills/` — read their SKILL.md files to extract file format patterns

2. **Third-Party Comparison:**
   - Search skills.sh for "planning", "task-tracking", "persistence", "file-based-planning" patterns
   - Search repomix for equivalent project planning tools
   - Analyze obsidian-tasks, todo-tree conventions
   - Analyze Manus-style planning-with-files implementations
   - Document: What do they do differently? What conventions are emerging?

3. **Integration Surface:**
   - What exact artifacts does hm-planning-persistence read/write?
   - What format? (YAML frontmatter + markdown body, or pure markdown?)
   - How does it interact with existing `.hivemind/state/session-continuity.json`?
   - How does it interact with `.hivemind/state/delegations.json`?

4. **Error Modes:**
   - What happens when upstream artifacts are missing?
   - What happens when `.hivemind/` directory doesn't exist?
   - What happens on concurrent writes?
   - What happens on corrupted state files?

5. **Rejected Alternatives:**
   - Why not keep the disabled skill and fix it?
   - Why `.hivemind/state/planning/<session-id>/` instead of flat `.hivemind/state/planning/`?
   - Why markdown + YAML frontmatter instead of JSON?
   - Why not embed in session-continuity.json?

**Must answer all 7 key design questions from CONTEXT.md:**
   Q1: Session-isolated (`<session-id>/`) vs flat directory?
   Q2: Structured (YAML frontmatter) vs freeform (markdown)?
   Q3: Concurrency handling (advisory locks? single-writer? O_CLOEXEC?)
   Q4: Cleanup strategy (manual? TTL? explicit --cleanup?)
   Q5: Fallback path when `.hivemind/` doesn't exist?
   Q6: RICH-1 through RICH-8 requirements — which are achievable?
   Q7: Language-agnostic validation — how?

Use tavily-search and tavily-extract for third-party skill analysis (skills.sh, repomix). Use grep/read for GSD skill analysis. Document all sources with citations.
  </action>
  <verify>
    <automated>grep -c "^## " .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/research/design-decisions.md | xargs -I{} sh -c 'test {} -ge 5'</automated>
    <manual>Verify design-decisions.md has all 5 required sections (Pattern Analysis, Third-Party Comparison, Integration Surface, Error Modes, Rejected Alternatives) and answers all 7 key design questions.</manual>
  </verify>
  <done>
    research/design-decisions.md exists with ≥ 200 lines covering all 5 mandated research areas and answering all 7 key design questions. File is at `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/research/design-decisions.md`.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Create hm-planning-persistence SKILL.md + All Bundled Resources</name>
  <files>
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/SKILL.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/references/metadata-schema.json
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/references/state-transitions.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/references/file-formats.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/templates/task_plan.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/templates/findings.md
    .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/templates/progress.md
  </files>
  <action>
Create the complete hm-planning-persistence skill package at `.hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/`.

**Directory structure to create (with .gitkeep files in each):**
```
hm-planning-persistence/
├── SKILL.md
├── references/
│   ├── metadata-schema.json
│   ├── state-transitions.md
│   └── file-formats.md
├── templates/
│   ├── task_plan.md
│   ├── findings.md
│   └── progress.md
└── research/
    └── design-decisions.md  (already created in Task 1)
```

**SKILL.md requirements (per SKILL-CRITERIA-SHORT.md):**

1. **YAML frontmatter** with:
   - `name: hm-planning-persistence`
   - `description:` Must land 90% pick rate. NOT generic AI-written. Use language like: "Persist task state across sessions with a 3-file external memory system rooted in .hivemind/state/planning/. Use when planning complex multi-step tasks, recovering after context loss, handing off between agents, or when work spans multiple sessions. Produces task_plan.md, findings.md, progress.md in session-isolated directories. NOT for simple one-step tasks, in-memory todo lists, or generic planning advice."
   - `pipeline:` contract per D-09 (see interfaces block above for exact YAML)
   - `metadata: { layer: "2", role: "persistent-memory", pattern: "P3" }`
   - `allowed-tools: [Read, Write, Edit, Bash, Glob, Grep]`

2. **SKILL.md body** (≤ 500 lines, progressive disclosure):
   - Overview: What this skill does and why it exists
   - The Iron Law: "The filesystem IS persistent memory. Before any non-trivial change, read the plan."
   - Reference Map: Table linking to bundled resources
   - Tiered Response: INIT → CHECKPOINT → ABSORB → PIVOT → LIGHT (adapt from disabled skill)
   - First Action protocol: Check for existing files → read → create if missing
   - Core Discipline: Read Before Write (adapt from disabled skill)
   - Delegation Protocol: Subagent handoff patterns
   - Session Recovery: After /clear or interruption
   - Error Discipline: Log → Retry Once → Change Approach → Escalate
   - Fallback Behavior: If `.hivemind/` unavailable, use `.session/` with warning
   - Anti-Patterns table (adapt from disabled skill, add new ones)
   - Cross-References table linking to all pipeline skills
   - Kit Bundle Contents table

3. **Quality requirements:**
   - Language-agnostic: NO TypeScript, Python, or language-specific assumptions
   - Framework-independent: NO GSD, OMO, or Superpowers assumptions
   - NOT generic AI-written: Synthesize from disabled skill patterns + research findings
   - Progressive disclosure: SKILL.md is entry point; heavy detail in references/

**Bundled Resources to create:**

`references/file-formats.md` — Canonical format definitions:
- task_plan.md format (YAML frontmatter: goal, phases[], decisions[], created, updated + markdown body)
- findings.md format (YAML frontmatter: session, categories[], sources[] + markdown body with ## sections)
- progress.md format (YAML frontmatter: phase, status, last_action, errors[] + chronological markdown log)
- Define exact YAML schemas. Show filled-in examples.

`references/state-transitions.md` — Valid state transitions:
- Task states: PLANNED → IN_PROGRESS → COMPLETED | BLOCKED | CANCELLED
- Phase states: NOT_STARTED → IN_PROGRESS → COMPLETED
- Session states: ACTIVE → PAUSED → RESUMED → COMPLETED
- Transition rules with preconditions
- State machine diagram (ASCII art)

`references/metadata-schema.json` — JSON Schema for session metadata:
- Session ID format (uuid v4)
- Timestamp format (ISO 8601)
- Artifact paths relative to .hivemind/state/planning/<session-id>/
- Required vs optional fields

`templates/task_plan.md` — Template:
- Goal section (user's stated objective)
- Phases table (phase name, status, tasks, dependencies)
- Decisions log (decision ID, description, rationale, locked: true/false)
- Errors table (timestamp, error, attempt, approach, resolved)

`templates/findings.md` — Template:
- Research findings by category
- Technical discoveries
- Source references with citations
- Open questions

`templates/progress.md` — Template:
- Session log (timestamped entries)
- Phase transitions
- Subagent dispatch/return records
- Errors and recoveries
- Handoff notes

**After creating all files:** Verify the symlink from `.opencode/skills/hm-planning-persistence/` → lab directory exists. If not, create it: `ln -s ../../.hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence .opencode/skills/hm-planning-persistence`

**Self-check against SKILL-CRITERIA-SHORT.md before declaring done:**
- [ ] Belongs to "repeatable workflows" category
- [ ] Correct lineage: hm-* (shipped product)
- [ ] Correct hierarchy: sub-session level (delegated agents pick this)
- [ ] Correct task group: How-to-Process
- [ ] Description passes 90% pick rate check
- [ ] SKILL.md ≤ 500 lines
- [ ] Bundled resources: references/ + templates/ + research/
- [ ] NOT generic AI-written — patterns from disabled skill + research
  </action>
  <verify>
    <automated>
# Verify all required files exist
for f in \
  .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/SKILL.md \
  .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/research/design-decisions.md \
  .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/references/metadata-schema.json \
  .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/references/state-transitions.md \
  .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/references/file-formats.md \
  .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/templates/task_plan.md \
  .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/templates/findings.md \
  .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/templates/progress.md; do
  test -f "$f" || { echo "MISSING: $f"; exit 1; }
done

# Verify SKILL.md has required frontmatter fields
grep -q "^name: hm-planning-persistence" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/SKILL.md || { echo "MISSING: name field"; exit 1; }
grep -q "^description:" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/SKILL.md || { echo "MISSING: description"; exit 1; }
grep -q "^pipeline:" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/SKILL.md || { echo "MISSING: pipeline contract (D-09)"; exit 1; }

# Verify SKILL.md is under 500 lines
LINES=$(wc -l < .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/SKILL.md)
test "$LINES" -le 500 || { echo "SKILL.md is $LINES lines (max 500)"; exit 1; }

# Verify design-decisions.md has all 5 sections
for section in "Pattern Analysis" "Third-Party Comparison" "Integration Surface" "Error Modes" "Rejected Alternatives"; do
  grep -q "## $section" .hivefiver-meta-builder/skills-lab/active/refactoring/hm-planning-persistence/research/design-decisions.md || { echo "MISSING section: $section"; exit 1; }
done

echo "ALL CHECKS PASSED"
    </automated>
  </verify>
  <done>
All 8 files created. SKILL.md exists with valid frontmatter, pipeline contract, ≤ 500 lines, NOT generic AI-written. All bundled resources complete. Symlink from .opencode/skills/ verified. Skill passes SKILL-CRITERIA-SHORT.md quality gate self-check.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Skill author → Filesystem | SKILL.md instructs agents to create/modify files on disk |
| Agent → .hivemind/state/ | Agents write planning state to canonical state root |
| Session boundary | Planning state persists across sessions — stale data risk |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-SE2-01 | Tampering | .hivemind/state/planning/ files | mitigate | Skill instructs agents to validate file integrity before trusting state. Include corruption detection guidance in file-formats.md. |
| T-SE2-02 | Information Disclosure | .hivemind/state/planning/ contents | accept | Planning files contain task descriptions and findings, not secrets. Low-value target. |
| T-SE2-03 | Denial of Service | Directory bloat in .hivemind/state/planning/ | mitigate | Session-isolated directories per D-01. Include cleanup guidance in SKILL.md (manual deletion by session-id). SE-5 may add TTL-based archival. |
| T-SE2-04 | Spoofing | Stale planning state from previous session | mitigate | Session recovery protocol includes cross-reference step: "git diff --stat" to verify state matches reality. Include in SKILL.md. |
</threat_model>

<verification>
**Phase-level integration checks to run after Plan 01 completes:**
1. Verify `hm-planning-persistence` symlink exists at `.opencode/skills/hm-planning-persistence/`
2. Verify the pipeline contract in SKILL.md frontmatter declares correct stage, reads, writes, upstream, downstream
3. Verify all 8 bundled files pass existence check
4. Confirm research/design-decisions.md has all 5 sections and answers all 7 key questions
</verification>

<success_criteria>
- [ ] hm-planning-persistence skill directory exists at both locations (lab + .opencode symlink)
- [ ] SKILL.md has valid YAML frontmatter with pipeline contract per D-09
- [ ] SKILL.md is ≤ 500 lines and follows progressive disclosure
- [ ] All 7 bundled resource files exist with substantive content
- [ ] research/design-decisions.md ≥ 200 lines covering all 5 mandated sections
- [ ] Skill description is NOT generic AI-written — passes 90% pick rate heuristic
- [ ] Skill uses `.hivemind/state/planning/<session-id>/` as canonical path (D-01)
- [ ] Skill is language-agnostic and framework-independent
- [ ] Skill declares fallback to `.session/` when `.hivemind/` unavailable
</success_criteria>

<output>
After completion, create `.planning/workstreams/skill-ecosystem/phases/SE-2-hm-artifact-hierarchy/SE-2-01-SUMMARY.md`
</output>
