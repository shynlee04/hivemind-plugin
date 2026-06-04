# hm-planning-persistence: Design Decisions

> Research evidence for all design choices per D-08 mandate.
> Phase: SE-2 | Date: 2026-04-28 | Author: gsd-executor

---

## Pattern Analysis of GSD Equivalents

### Disabled hm-planning-with-files (SKILL-DISABLED.md)

The disabled skill established the 3-file system pattern that has proven effective across multiple agent workflows:

**Patterns that WORK:**

1. **Three-File Separation of Concerns** — task_plan.md (goal + phases + decisions), findings.md (research + discoveries), progress.md (session log + errors + handoffs). Each file has a distinct purpose. The separation prevents file bloat and keeps the plan lean while allowing research data to grow independently.

2. **Tiered Response System** — INIT → CHECKPOINT → ABSORB → PIVOT → LIGHT. Not every action needs full ritual. The tiered approach prevents over-ceremony on routine actions while ensuring critical state transitions are captured.

3. **"Read Before Write" Discipline** — Before any non-trivial change, re-read the plan file. This is the core anti-drift mechanism. Context compaction and subagent returns cause memory drift; the file is the anchor.

4. **Error Discipline** — Log → Retry Once → Change Approach → Escalate. Structured error handling prevents silent retries and forced escalation after 2+ failures.

5. **Session Recovery Protocol** — After /clear or interruption: read all 3 files, cross-reference with `git diff --stat`, reconcile, resume. This pattern allows agents to recover context autonomously without human intervention.

6. **Subagent Envelope Pattern** — Explicit read/write boundaries for subagents (e.g., "Read: task_plan.md. Write: findings.md. Do NOT modify: task_plan.md"). This prevents subagents from corrupting coordinator-owned planning state.

7. **Anti-Patterns Table** — The Todo Relier, Goal Forgetter, Error Hider, Plan Bloater, Plan Skipper, Skill Writer. Named anti-patterns with detection and correction columns give agents specific patterns to guard against.

**Why the skill was disabled:**

1. **HIERARCHY ENFORCEMENT scripting** — The hm-coordinating-loop had a `verify-hierarchy.sh` script that REQUIRED planning-with-files to be loaded. This caused hard failures when the skill wasn't present, creating a blocking dependency cascade.

2. **Generic AI-written language** — The description and body read as polished but generic. Lacked domain-specific patterns synthesized from real project use cases.

3. **Flat file creation** — Wrote to project root (`task_plan.md` directly in CWD). No session isolation meant collision on multi-agent or overlapping sessions.

4. **No pipeline integration contract** — Skills that consumed planning state had no explicit contract. They assumed file names and locations without declared interfaces.

5. **No structured metadata format** — All three files used pure markdown without any structured frontmatter. This made machine parsing and validation impossible.

**What's worth keeping:**
- The 3-file system (task_plan, findings, progress) is the right decomposition
- Tiered response prevents over-ceremony
- "Read Before Write" is the correct anti-drift mechanism
- Error discipline with escalation prevents silent loops
- Subagent envelope pattern prevents state corruption
- Anti-patterns table is an effective guardrail mechanism

**What must change for hm-planning-persistence:**
- Session-isolated directories: `.hivemind/state/planning/<session-id>/` instead of project root
- YAML frontmatter on all planning files for machine parsing
- Explicit pipeline contract in SKILL.md frontmatter (D-09)
- No hard dependency enforcement — soft boundary only (D-04)
- Fallback path when `.hivemind/` unavailable
- Language-agnostic, framework-independent instructions

### GSD Workflow Analysis

**gsd-execute-phase** — Wave-based parallelization pattern. Tracks plan execution across waves with checkpoint states. Key pattern: `wave: N` and `type: checkpoint:*` in plan frontmatter. The execute-phase skill reads plan status from frontmatter, not from separate tracking files. This is more efficient than the 3-file approach for single-agent execution but doesn't support multi-agent handoff.

**gsd-pause-work** — Serializes mid-phase state for later resume. Key pattern: writes `continue.md` with current phase, task progress, and open decisions. Minimal state — just enough to reconstruct context. Lesson for hm-planning-persistence: don't serialize everything, serialize the minimum needed for reconstruction.

**gsd-resume-work** — Reconstructs context from `continue.md`. Reads the serialized state, verifies against git history, and resumes. Key pattern: cross-reference with reality (`git diff --stat`) to detect drift between serialized state and actual filesystem state.

**gsd-plan-phase** — Plan file format conventions. Task breakdown with `type="auto"` and `type="checkpoint:*"`. Dependency analysis via `depends_on` field. The GSD plan format is more structured and declarative than the freeform phases in the disabled skill. Lesson: bring YAML frontmatter structure from GSD plans into planning persistence.

---

## Third-Party Comparison

### planning-with-files (agent-skills-hub, skills.sh)

The most popular Manus-style planning skill on skills.sh. Key differences from our approach:

| Aspect | planning-with-files | hm-planning-persistence |
|--------|-------------------|-------------------------|
| File location | Project root (flat) | Session-isolated (.hivemind/state/planning/<session-id>/) |
| Templates | In skill directory ($CLAUDE_PLUGIN_ROOT/templates/) | In skill package (templates/) |
| Format | Pure markdown | YAML frontmatter + markdown body |
| Session model | Implicit (file mtimes) | Explicit (session-id directories) |
| Multi-agent | File-level permissions via skill | Subagent envelope pattern + session isolation |
| Cleanup strategy | None (manual deletion) | Session-id scoped (delete by session) |
| Trigger phrases | "Create plan first", "2-Action Rule" | Pipeline contract + cross-reference discoverability |
| Platform target | Claude Code specific | OpenCode, Claude Code, any skills-compatible platform |

Key insight: planning-with-files is a successful pattern because it's simple. But it fails at multi-agent scenarios because flat file placement in project root causes collisions. Session-isolated directories are the correct evolution.

### Manus-Style Workflow Pattern

The Manus pattern (popularized by the $2B valuation) uses 3 markdown files as "working memory." The core insight: **context windows are volatile RAM, the filesystem is persistent memory.** This same insight powers hm-planning-persistence but with structured improvements:

- Manus uses `notes.md` (catch-all) vs our `findings.md` (research-focused). Manus's approach is simpler but blurs the line between research data and plan structure.
- Manus creates files in project root. Our session-isolated approach prevents collision.
- Manus has no pipeline integration — skills don't declare that they read/write these files. Our D-09 contracts make integration explicit.

### obsidian-tasks and todo-tree Conventions

File-based task management tools like obsidian-tasks and todo-tree provide useful conventions:
- Checkbox syntax (`- [ ]`, `- [x]`) for task status
- Frontmatter for metadata (due dates, priorities, tags)
- Tree-based organization (parent → child tasks)

Lessons applied: hm-planning-persistence templates use checkbox syntax for phase tasks and YAML frontmatter for machine-readable metadata (session ID, timestamps, phase status).

### File-Based Task Planning Skills (MCP Market)

Multiple MCP-market skills use file-based planning with similar patterns. The common thread across all implementations:
1. Create files on first invocation
2. Read files on subsequent invocations
3. Update files at phase boundaries
4. None handle multi-agent concurrency well
5. None have explicit pipeline contracts

The gap in the ecosystem (that hm-planning-persistence fills) is: **explicit pipeline contracts + session isolation + multi-agent envelope protocol.**

---

## Integration Surface

### Artifacts Read by hm-planning-persistence

| Artifact | Path | Purpose | Format |
|----------|------|---------|--------|
| Session continuity | `.hivemind/state/session-continuity.json` | Detect active session, recover session ID | JSON |
| Delegations state | `.hivemind/state/delegations.json` | Track subagent dispatch/return records | JSON |
| Existing planning files | `.hivemind/state/planning/<session-id>/task_plan.md` | Resume from previous state | YAML frontmatter + markdown |
| Existing findings | `.hivemind/state/planning/<session-id>/findings.md` | Resume research context | YAML frontmatter + markdown |
| Existing progress | `.hivemind/state/planning/<session-id>/progress.md` | Resume session log | YAML frontmatter + markdown |

### Artifacts Written by hm-planning-persistence

| Artifact | Path | Purpose | Format |
|----------|------|---------|--------|
| task_plan.md | `.hivemind/state/planning/<session-id>/task_plan.md` | Goal, phases, decisions, errors | YAML frontmatter + markdown body |
| findings.md | `.hivemind/state/planning/<session-id>/findings.md` | Research discoveries, technical data | YAML frontmatter + markdown body |
| progress.md | `.hivemind/state/planning/<session-id>/progress.md` | Session log, errors, handoffs | YAML frontmatter + chronological markdown |

### Interaction with Existing Hivemind State

- **session-continuity.json**: hm-planning-persistence reads this to detect the active session ID. If no session is active, it generates a new UUID session ID. It does NOT modify session-continuity.json — that's owned by the continuity module.
- **delegations.json**: hm-planning-persistence reads delegation records to populate progress.md with subagent dispatch/return entries. It does NOT write to delegations.json.
- **.hivemind/state/planning/**: This is the canonical directory for planning state. Sub-directories are session-scoped (by session-id) to prevent collisions.

### Pipeline Contract (D-09)

```yaml
pipeline:
  stage: persistence
  reads:
    - ".hivemind/state/session-continuity.json"
    - ".hivemind/state/delegations.json"
    - ".hivemind/state/planning/<session-id>/task_plan.md"
    - ".hivemind/state/planning/<session-id>/findings.md"
    - ".hivemind/state/planning/<session-id>/progress.md"
  writes:
    - ".hivemind/state/planning/<session-id>/task_plan.md"
    - ".hivemind/state/planning/<session-id>/findings.md"
    - ".hivemind/state/planning/<session-id>/progress.md"
  upstream:
    - "hm-user-intent-interactive-loop"
    - "hm-spec-driven-authoring"
  downstream:
    - "hm-coordinating-loop"
    - "hm-phase-execution"
    - "hm-phase-loop"
    - "hm-debug"
    - "hm-refactor"
    - "hm-test-driven-execution"
    - "hm-completion-looping"
    - "hm-subagent-delegation-patterns"
    - "hm-meta-builder"
    - "hm-research-chain"
    - "hf-delegation-gates"
```

---

## Error Modes

### What happens when upstream artifacts are missing?

1. **session-continuity.json missing**: Generate new session ID (UUID v4). Log warning in progress.md: "No session continuity found — started new session <id>."
2. **delegations.json missing**: Proceed without delegation history. Log warning: "No delegation records available."
3. **Planning files missing on resume**: This is the INIT case — create all 3 files from templates. No error.
4. **Planning files partially missing**: Read what exists. Create missing files from templates. Log the gap in progress.md.

### What happens when `.hivemind/` directory doesn't exist?

This is the non-Hivemind project case. FALLBACK behavior:
1. Check for `.hivemind/` directory
2. If absent, use `.session/` at project root as fallback
3. Write a warning in progress.md: "NOTE: .hivemind/ not found. Using .session/ fallback. Install Hivemind harness for full pipeline integration."
4. All other behavior is identical — just the root path changes

### What happens on concurrent writes?

Single-writer assumption. Planning files are session-scoped to a single session ID. Within a session, only one agent (the coordinator or delegated agent) writes to a given file at a time. The subagent envelope pattern enforces this: "Read: task_plan.md. Write: findings.md. Do NOT modify: task_plan.md."

For cross-session conflict (two sessions writing to different `<session-id>/` directories): no conflict — isolation is by directory.

For intra-session conflict (two agents writing to same file): this is a design error, not a runtime error. The subagent envelope pattern prevents it. If it occurs, last-write-wins with a corruption detection note.

### What happens on corrupted state files?

1. **Malformed YAML frontmatter**: Parse what's parseable. Log corruption in progress.md. Attempt recovery from markdown body.
2. **Missing required frontmatter fields**: Use defaults where safe (e.g., status=UNKNOWN). Log missing fields in progress.md.
3. **Unparseable file**: Rename to `<file>.corrupted-<timestamp>`. Create fresh file from template. Log the corruption event in progress.md.
4. **Git conflict markers in planning files**: Detect `<<<<<<<` / `>>>>>>>` patterns. Log as "unresolved merge conflict — resolve git conflicts first."

The error philosophy: **never lose data. Degrade gracefully. Log everything.**

---

## Rejected Alternatives

### Why not keep the disabled skill and fix it?

The disabled skill had fundamental architectural flaws that couldn't be fixed incrementally:
- Flat file placement in project root (no session isolation)
- Pure markdown format (no structured frontmatter)
- No pipeline integration contract (implicit coupling)
- Already disabled with "donotusethis-" prefix — indicates acknowledged fatal flaws
- The HIERARCHY ENFORCEMENT scripting was a symptom of deeper architectural coupling

Fixing it would require all the same changes as building new (session isolation, YAML frontmatter, pipeline contracts) but would carry legacy naming and assumptions. Building new with a clean design, informed by what worked and what didn't, is the correct approach.

### Why `.hivemind/state/planning/<session-id>/` instead of flat `.hivemind/state/planning/`?

1. **Multi-agent collision**: Without session isolation, two concurrent planning sessions overwrite each other's task_plan.md.
2. **Cleanup**: Session-scoped directories are trivially deletable. Flat files require identifying which session owns each file.
3. **Discovery**: Agents can discover their session directory by session ID without parsing file contents.
4. **Future-proofing**: Session-isolated directories enable features like session comparison, historical replay, and TTL-based archival at directory granularity.
5. **Pattern from GSD**: GSD uses `phase-XX/` directories for isolation. Session-scoped follows the same principle.

### Why markdown + YAML frontmatter instead of JSON?

1. **Human readability**: Planning files are read by both agents AND humans. Markdown renders in any editor. JSON is machine-optimized, not human-optimized.
2. **Progressive parsing**: YAML frontmatter can be partially parsed (extract what you need). JSON requires complete parse or failure.
3. **Ecosystem compatibility**: Markdown is the universal format for agent skills documentation. Using markdown for planning files keeps the ecosystem consistent.
4. **Template simplicity**: `task_plan.md` with YAML frontmatter is trivially templateable. JSON requires escaping and structured generation.
5. **GSD precedent**: GSD plans use YAML frontmatter + markdown body. Consistency with the existing ecosystem.

### Why not embed planning state in session-continuity.json?

1. **Separation of concerns**: session-continuity.json is a runtime state file owned by the harness continuity module. Planning state is conceptually different — it's task-oriented, not session-oriented.
2. **File size bloat**: Embedding full planning state (task_plan, findings, progress) would bloat session-continuity.json, making it slow to read and write.
3. **Different write patterns**: session-continuity.json is updated frequently (on every tool call). Planning files are updated at phase boundaries. Different update frequencies = different files.
4. **Independent lifecycle**: Planning files persist beyond a single session. session-continuity.json is per-session. Mixing them creates lifecycle confusion.

---

## Key Design Questions (from CONTEXT.md)

### Q1: Session-isolated (`<session-id>/`) vs flat directory?

**Decision: Session-isolated (`<session-id>/`)** per D-01.

Rationale: Session isolation prevents multi-agent collision, enables trivial cleanup by session ID, and future-proofs for session comparison and TTL-based archival. The flat approach from the disabled skill caused the collision problem that session isolation explicitly prevents.

Structure: `.hivemind/state/planning/<session-id>/task_plan.md` (and findings.md, progress.md)

### Q2: Structured (YAML frontmatter) vs freeform (markdown)?

**Decision: YAML frontmatter + markdown body.**

Rationale: YAML frontmatter provides machine-parseable metadata (session ID, timestamps, phase status, pipeline stage) while markdown body provides human-readable content. This hybrid approach gives us the best of both: programmatic state queries PLUS human readability.

Frontmatter fields for each file:
- task_plan.md: goal, phases[], decisions[], created, updated, session_id
- findings.md: session, categories[], sources[], last_updated
- progress.md: phase, status, last_action, errors[], session_id, last_updated

### Q3: Concurrency handling (advisory locks? single-writer? O_CLOEXEC?)

**Decision: Single-writer assumption enforced by subagent envelope pattern.**

Rationale: Planning state is session-scoped. Within a session, the coordinator agent owns task_plan.md writes. Subagents write only to findings.md or progress.md (as directed by the envelope pattern). Cross-session isolation is by directory. No locking needed — the envelope pattern IS the concurrency control.

If concurrent write is detected (file modified during write), log the conflict in progress.md. Treat as a coordination failure, not a filesystem failure.

### Q4: Cleanup strategy (manual? TTL? explicit --cleanup?)

**Decision: Manual cleanup by session-id for now. SE-5 may add TTL-based archival.**

Rationale: Session-isolated directories make cleanup trivial — delete the directory. No need for complex TTL or archival in SE-2. The skill documents that users can `rm -rf .hivemind/state/planning/<session-id>/` to clean up. SE-5 (quality gate phase) may add `hm-planning-persistence --cleanup --older-than 7d`.

### Q5: Fallback path when `.hivemind/` doesn't exist?

**Decision: `.session/` at project root with explicit warning.**

Rationale: hm-planning-persistence ships as part of the Hivemind harness. But it must work gracefully in non-Hivemind projects (standalone OpenCode, Claude Code with skills only). The fallback ensures the skill is useful everywhere, not just in Hivemind-initialized projects.

Behavior:
1. Check for `.hivemind/` directory
2. If present: use `.hivemind/state/planning/<session-id>/` (canonical)
3. If absent: use `.session/<session-id>/` (fallback)
4. Log warning in progress.md when using fallback
5. All other behavior identical regardless of path root

### Q6: RICH-1 through RICH-8 requirements — which are achievable?

**Decision: RICH-1 (Trigger Precision) + RICH-2 (Metadata Completeness) + RICH-4 (Progressive Disclosure) + RICH-8 (Language-Agnostic) are achievable in SE-2. RICH-3, RICH-5, RICH-6, RICH-7 require SE-5+ (quality gate phase).**

- **RICH-1 (Trigger Precision)** ✅ ACHIEVABLE: Description optimized for 90% pick rate. Specific trigger phrases in description: "persist task state across sessions", "recover after context loss", "hand off between agents".
- **RICH-2 (Metadata Completeness)** ✅ ACHIEVABLE: YAML frontmatter with pipeline contract, metadata block, allowed-tools. All reference files have TOC. Templates have filled-in examples.
- **RICH-3 (Eval Coverage)** ❌ DEFERRED: Requires formal evaluation suite with variance analysis. SE-5 quality gate phase.
- **RICH-4 (Progressive Disclosure)** ✅ ACHIEVABLE: SKILL.md ≤ 500 lines. Heavy detail in references/. Templates in templates/. Research in research/.
- **RICH-5 (Cross-Platform)** ❌ DEFERRED: Requires testing across 3+ agent platforms (OpenCode, Claude Code, Copilot, Gemini CLI). SE-5.
- **RICH-6 (Anti-Regression)** ❌ DEFERRED: Requires formal regression test suite. SE-5.
- **RICH-7 (Versioning)** ❌ DEFERRED: Requires versioned package with semver and changelog. SE-5.
- **RICH-8 (Language-Agnostic)** ✅ ACHIEVABLE: No TypeScript, Python, or language-specific assumptions. Shell commands use portable patterns. File operations are generic (Read/Write/Edit tools, not language APIs).

### Q7: Language-agnostic validation — how?

**Decision: Human review of SKILL.md against a language-agnostic checklist.**

Validation checklist:
- [ ] No language names appear in procedural instructions (TypeScript, Python, Go, Rust, Java, etc.)
- [ ] No package manager references (npm, pip, cargo, go mod, etc.)
- [ ] No framework references (GSD, OMO, Superpowers, React, Next.js, etc.)
- [ ] Shell examples use POSIX-compatible patterns (no bash-specific `[[` without `bash` prefix)
- [ ] Tool references are generic (Read, Write, Edit, Bash, Glob, Grep — available across platforms)
- [ ] File paths are relative and portable (no absolute paths, no OS-specific conventions)
- [ ] Templates are markdown-only (no code blocks that imply a specific language)
- [ ] "How to" instructions don't assume a specific tech stack

This checklist is applied during code review (SE-4 phase) and verified by the integration verification step (SE-7).

---

## Research Sources

1. **Internal**: Disabled skill `donotusethis-hm-planning-with-files/SKILL-DISABLED.md` and references/ (file-templates.md, phase-schemas.md, session-context-protocol.md)
2. **GSD ecosystem**: gsd-execute-phase, gsd-pause-work, gsd-resume-work, gsd-plan-phase workflow patterns
3. **Third-party skills**: planning-with-files (agent-skills-hub on skills.sh, source in lobehub.com/skills), Manus-style file-based planning (github.com/othmanadi/planning-with-files)
4. **Standards**: agentskills.io skill creation guidelines, skills.sh ecosystem patterns
5. **Internal architecture**: Q6 decision (.hivemind/ as state root), D-01 through D-10 authorized decisions, SKILL-CRITERIA-SHORT.md
6. **Task management tools**: obsidian-tasks checkbox conventions, todo-tree hierarchical patterns

---

## Summary of Key Design Choices

| Decision | Choice | Primary Rationale |
|----------|--------|-------------------|
| Storage location | `.hivemind/state/planning/<session-id>/` | Session isolation prevents collision (D-01) |
| File format | YAML frontmatter + markdown body | Machine-parseable metadata + human-readable content |
| Number of files | 3 (task_plan, findings, progress) | Proven decomposition from disabled skill |
| Concurrency model | Single-writer via subagent envelope pattern | Simpler than advisory locks; sufficient for agent workflows |
| Cleanup strategy | Manual by session-id | Session isolation makes this trivial |
| Fallback path | `.session/` at project root | Usable without Hivemind harness |
| Tiered response | INIT → CHECKPOINT → ABSORB → PIVOT → LIGHT | Prevents over-ceremony on routine actions |
| Pipeline integration | Explicit YAML contract in frontmatter (D-09) | Decouples skills from implicit assumptions |
| Skill lineage | hm-* (shipped product) | Per D-03 — all planning skills are shipped with Hivemind |
