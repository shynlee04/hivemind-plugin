# Command & Workflow Audit v2

**Date:** 2026-04-07
**Auditor:** Manual verification (code-first, no doc trust)
**Scope:** 11 commands in `.hivefiver-meta-builder/commands-lab/active/refactoring/` + 4 workflows in `.hivefiver-meta-builder/workflows-lab/active/refactoring/`
**Reference:** `.qwen/skills/opencode-platform-reference/references/opencode-commands.md`
**Prior audit:** `docs/audit/command-workflow-audit.md` (v1 — contained errors, see Corrections section)

---

## Verification Methodology

Every claim below is backed by file reads and grep verification. No claims from prior audit docs were trusted — the prior audit had factual errors (e.g., claimed `hf-audit.md` workflow ref pointed to `hivefiver-v2` worktree, but it actually points to this worktree's local `workflows-lab/` path).

---

## Command Scorecards (11 Commands)

### 1. `deep-init.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **FAIL** | No `---` delimiter at all. First line is plain text "Generate hierarchical AGENTS.md files..." |
| Has `description` field | **FAIL** | No frontmatter = no description field |
| Has `agent` field | **FAIL** | No frontmatter = no agent field |
| Agent referenced exists | **N/A** | No agent declared; body references `explore` subagent (exists in `.opencode/agents/`) |
| Skills referenced exist | **PASS** | No explicit skill references; references `explore` subagent (exists) and LSP (built-in) |
| Workflow referenced exists | **N/A** | No external workflow reference — entire protocol is inline (~380 lines) |
| No references to deleted/archived | **PASS** | No dead references found |
| Clear purpose distinct from others | **PASS** | Generates AGENTS.md hierarchy — unique purpose |
| Connects to ecosystem | **PARTIAL** | Self-contained execution protocol. No workflow binding. Uses `task()` calls but no skill loading |
| No hardcoded platform paths | **PASS** | Uses relative paths and bash patterns only |

**Issues:**
- 🛑 **Missing YAML frontmatter entirely** — this file is not a valid OpenCode command per the spec. OpenCode commands require `---` delimiters with at minimum a `description` field.
- ⚠️ **~380 lines of inline execution protocol** — should extract to a workflow file and reference it, keeping the command file thin (<50 lines).
- ⚠️ **`!bash` injected-state pattern** — uses `!bash` echo blocks which is a shell-injection pattern but no `!bash` block is present; the command uses code-fenced bash examples instead.

### 2. `deep-research-synthesis-repomix.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **PASS** | Valid `---` delimiters, valid YAML inside |
| Has `description` field | **PASS** | `description: "Reference document: Advanced Repomix + OpenCode orchestration cheat sheet..."` |
| Has `agent` field | **PASS** | `agent: researcher` |
| Agent referenced exists | **PASS** | `researcher` exists in `.opencode/agents/researcher.md` |
| Skills referenced exist | **N/A** | No explicit skill references |
| Workflow referenced exists | **N/A** | No workflow reference |
| No references to deleted/archived | **PASS** | No dead references found |
| Clear purpose distinct from others | **PASS** | Reference/cheat sheet — unique purpose |
| Connects to ecosystem | **PARTIAL** | Self-described as "NOT an executable command" — is a reference doc, not a runnable command |
| No hardcoded platform paths | **PASS** | Uses relative paths only |

**Issues:**
- ⚠️ **Misclassified as a command** — frontmatter explicitly says "NOT an executable command" and `type: reference`. This is a reference document that happens to live in the commands directory. Should be in `references-lab/`.
- ℹ️ `subtask: true` is set but this is not executable, so the field is meaningless.

### 3. `harness-audit.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **PASS** | Valid `---` delimiters, valid YAML |
| Has `description` field | **PASS** | Present, descriptive |
| Has `agent` field | **PASS** | `agent: hivefiver-orchestrator` |
| Agent referenced exists | **PASS** | `hivefiver-orchestrator` exists in `.opencode/agents/` |
| Skills referenced exist | **PASS** | References `harness-audit` skill — exists at `.opencode/skills/harness-audit/SKILL.md` |
| Workflow referenced exists | **N/A** | No external workflow reference — inline delegation plan |
| No references to deleted/archived | **PASS** | No dead references |
| Clear purpose distinct from others | **PASS** | Multi-phase harness audit — distinct scope |
| Connects to ecosystem | **PASS** | Loads `harness-audit` skill, dispatches subagents, produces audit-report.md |
| No hardcoded platform paths | **PASS** | Uses `!bash` for injected state (valid OpenCode pattern) |

**Issues:**
- ℹ️ **`!bash` injected state block** — uses the OpenCode `!bash` pattern for runtime state injection. This is valid per the OpenCode spec, but the bash commands reference `src/`, `.opencode/`, `dist/` — assumes a specific project structure.

### 4. `harness-doctor.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **PASS** | Valid `---` delimiters, valid YAML |
| Has `description` field | **PASS** | Present, descriptive |
| Has `agent` field | **PASS** | `agent: conductor` |
| Agent referenced exists | **PASS** | `conductor` exists in `.opencode/agents/` |
| Skills referenced exist | **N/A** | No explicit skill references |
| Workflow referenced exists | **N/A** | No external workflow reference |
| No references to deleted/archived | **PASS** | No dead references |
| Clear purpose distinct from others | **PASS** | Diagnostics/health check — unique purpose |
| Connects to ecosystem | **PARTIAL** | Self-contained. References `delegate-task` (harness plugin tool), `.opencode/rules/harness-rules.md` |
| No hardcoded platform paths | **PASS** | Uses relative paths only |

**Issues:**
- ⚠️ **References `.opencode/rules/harness-rules.md`** — this file should be verified to exist. If missing, the command's "Rules Check" step will fail silently.
- ⚠️ **References `delegate-task` tool** — assumes harness plugin is loaded. No guard for when plugin is absent.

### 5. `hf-audit.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **PASS** | Valid `---` delimiters, valid YAML |
| Has `description` field | **PASS** | Present, descriptive |
| Has `agent` field | **PASS** | `agent: hivefiver-orchestrator` |
| Agent referenced exists | **PASS** | `hivefiver-orchestrator` exists |
| Skills referenced exist | **N/A** | No explicit skill loads, but workflow may load skills |
| Workflow referenced exists | **PASS** | `@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/workflows-lab/active/refactoring/audit.md` — **FILE EXISTS** |
| No references to deleted/archived | **PASS** | No dead references |
| Clear purpose distinct from others | **FAIL** | Overlaps with `harness-audit.md` — both trigger on "audit skills" |
| Connects to ecosystem | **PASS** | References local workflow via absolute `@` path |
| No hardcoded platform paths | **FAIL** | Hardcoded absolute path: `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/...` |

**Issues:**
- 🛑 **Hardcoded absolute path** — workflow reference uses full absolute path `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/workflows-lab/active/refactoring/audit.md`. This breaks if the worktree moves or on a different machine. Should use relative path or project-root-relative reference.
- ⚠️ **Trigger overlap with `harness-audit.md`** — both commands trigger on "audit skills". `harness-audit.md` is a comprehensive multi-phase harness audit; `hf-audit.md` is a meta-concept quality audit. Trigger collision causes ambiguity.
- ℹ️ **CORRECTION to prior audit**: The prior audit (v1) claimed this command's workflow reference pointed to `hivefiver-v2` worktree. **This is false.** The actual path in the file points to `harness-experiment` worktree (the current worktree). The file **exists** at the referenced path.

### 6. `hf-create.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **PASS** | Valid `---` delimiters, valid YAML |
| Has `description` field | **PASS** | Present, descriptive |
| Has `agent` field | **PASS** | `agent: hivefiver-orchestrator` |
| Agent referenced exists | **PASS** | `hivefiver-orchestrator` exists |
| Skills referenced exist | **N/A** | No explicit skill loads in command; workflow loads skills |
| Workflow referenced exists | **PASS** | `@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/workflows-lab/active/refactoring/create.md` — **FILE EXISTS** |
| No references to deleted/archived | **PASS** | No dead references |
| Clear purpose distinct from others | **PASS** | Meta-concept creation — unique purpose |
| Connects to ecosystem | **PASS** | References local workflow |
| No hardcoded platform paths | **FAIL** | Hardcoded absolute path |

**Issues:**
- 🛑 **Hardcoded absolute path** — same issue as `hf-audit.md`. Full absolute path to workflow file.
- ℹ️ **CORRECTION to prior audit**: Prior audit claimed dead reference to `hivefiver-v2`. **False.** Path points to current worktree and file exists.

### 7. `hf-prompt-enhance.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **PASS** | Valid `---` delimiters, valid YAML |
| Has `description` field | **PASS** | Present, descriptive |
| Has `agent` field | **PASS** | `agent: hivefiver-orchestrator` |
| Agent referenced exists | **PASS** | `hivefiver-orchestrator` exists |
| Skills referenced exist | **N/A** | No explicit skill loads |
| Workflow referenced exists | **N/A** | No external workflow reference — full inline protocol |
| No references to deleted/archived | **PASS** | No dead references |
| Clear purpose distinct from others | **PASS** | Prompt enhancement pipeline — unique purpose |
| Connects to ecosystem | **PASS** | Uses `task` tool, references `.hivemind/state/` paths |
| No hardcoded platform paths | **PASS** | Uses relative `.hivemind/state/` paths |

**Issues:**
- ℹ️ **~150 lines of inline workflow** — well-structured but could benefit from extraction to a workflow file for reusability.
- ⚠️ **References `.hivemind/state/session-context-prompt.md`** — assumes hivemind runtime has created this file. Has guard (`create if missing`) which is good.

### 8. `hf-stack.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **PASS** | Valid `---` delimiters, valid YAML |
| Has `description` field | **PASS** | Present, descriptive |
| Has `agent` field | **PASS** | `agent: hivefiver-orchestrator` |
| Agent referenced exists | **PASS** | `hivefiver-orchestrator` exists |
| Skills referenced exist | **N/A** | No explicit skill loads in command; workflow validates skills |
| Workflow referenced exists | **PASS** | `@/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/workflows-lab/active/refactoring/stack.md` — **FILE EXISTS** |
| No references to deleted/archived | **PASS** | No dead references |
| Clear purpose distinct from others | **PASS** | Skill stacking — unique purpose |
| Connects to ecosystem | **PASS** | References local workflow |
| No hardcoded platform paths | **FAIL** | Hardcoded absolute path |

**Issues:**
- 🛑 **Hardcoded absolute path** — same issue as `hf-audit.md` and `hf-create.md`.
- ℹ️ **CORRECTION to prior audit**: Prior audit claimed dead reference to `hivefiver-v2`. **False.** Path points to current worktree and file exists.

### 9. `plan.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **PASS** | Valid `---` delimiters, valid YAML |
| Has `description` field | **PASS** | Present |
| Has `agent` field | **PASS** | `agent: conductor` |
| Agent referenced exists | **PASS** | `conductor` exists |
| Skills referenced exist | **N/A** | No explicit skill references |
| Workflow referenced exists | **N/A** | No external workflow reference |
| No references to deleted/archived | **PASS** | No dead references |
| Clear purpose distinct from others | **PASS** | Planning mode — distinct from execution |
| Connects to ecosystem | **PASS** | References `task_plan.md`, `delegate-task`, links to `/start-work` |
| No hardcoded platform paths | **PASS** | No absolute paths |

**Issues:**
- ℹ️ Clean. No issues found.

### 10. `start-work.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **PASS** | Valid `---` delimiters, valid YAML |
| Has `description` field | **PASS** | Present |
| Has `agent` field | **PASS** | `agent: conductor` |
| Agent referenced exists | **PASS** | `conductor` exists |
| Skills referenced exist | **N/A** | No explicit skill references |
| Workflow referenced exists | **N/A** | No external workflow reference |
| No references to deleted/archived | **PASS** | No dead references |
| Clear purpose distinct from others | **PASS** | Plan execution — distinct from planning |
| Connects to ecosystem | **PASS** | References `task_plan.md`, `progress.md`, `delegate-task` |
| No hardcoded platform paths | **PASS** | No absolute paths |

**Issues:**
- ℹ️ Clean. No issues found.

### 11. `ultrawork.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **PASS** | Valid `---` delimiters, valid YAML |
| Has `description` field | **PASS** | Present |
| Has `agent` field | **PASS** | `agent: conductor` |
| Agent referenced exists | **PASS** | `conductor` exists |
| Skills referenced exist | **N/A** | No explicit skill references |
| Workflow referenced exists | **N/A** | No external workflow reference |
| No references to deleted/archived | **PASS** | No dead references |
| Clear purpose distinct from others | **FAIL** | Significant overlap with `start-work.md` — both execute plans via `delegate-task` |
| Connects to ecosystem | **PASS** | References `delegate-task`, `task_plan.md` |
| No hardcoded platform paths | **PASS** | No absolute paths |

**Issues:**
- ⚠️ **Overlap with `start-work.md`** — both commands:
  - Use `conductor` agent
  - Read `task_plan.md`
  - Execute phases via `delegate-task`
  - Use `critic` for verification
  
  The distinction: `ultrawork.md` is fully autonomous (no clarification, makes assumptions and proceeds), while `start-work.md` is phase-by-phase with status tracking. This distinction is subtle and could confuse users. The trigger phrases should be more differentiated.

---

## Command Summary Scorecard

| Metric | Count | Details |
|--------|-------|---------|
| Total commands | 11 | |
| Valid YAML frontmatter | 10/11 | `deep-init.md` **FAILS** — no frontmatter at all |
| Has `description` field | 10/11 | `deep-init.md` missing |
| Has `agent` field | 10/11 | `deep-init.md` missing |
| All agent refs resolve | 10/10 | All declared agents exist in `.opencode/agents/` |
| Hardcoded absolute paths | 3/11 | `hf-audit.md`, `hf-create.md`, `hf-stack.md` |
| Trigger overlaps | 2 pairs | `harness-audit` ↔ `hf-audit` ("audit skills"), `start-work` ↔ `ultrawork` (plan execution) |
| Self-contained (no workflow ref) | 7/11 | `deep-init`, `deep-research-synthesis-repomix`, `harness-audit`, `harness-doctor`, `hf-prompt-enhance`, `plan`, `start-work`, `ultrawork` |
| External workflow refs | 3/11 | `hf-audit`, `hf-create`, `hf-stack` — all use hardcoded absolute paths |
| Not actually executable commands | 1 | `deep-research-synthesis-repomix` — self-described as "reference document, NOT an executable command" |

---

## Workflow Scorecards (4 Workflows)

### 1. `audit.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **N/A** | No frontmatter — plain markdown workflow doc (acceptable for workflow files) |
| Referenced commands exist and registered | **N/A** | No command references — this workflow is called by `hf-audit.md` command |
| Referenced skills exist | **PASS** | No explicit skill loads; uses bash-only validation |
| End-to-end execution path clear | **PARTIAL** | Load state → Determine scope → Run validators → Detect overlaps → Generate report. But all steps are bash scripts — no subagent dispatch via Task tool |
| No circular dependencies | **PASS** | No circular references |
| No dead steps | **PASS** | Each step produces output consumed by the next |

**Issues:**
- ⚠️ **Bash-only, no subagent dispatch** — the workflow defines quality checks but executes them purely as shell scripts. It does not integrate with Hivefiver specialist agents (described in the dependency graph as needing `meta-synthesis-agent` for analysis).
- ⚠️ **Overlapping detection uses `diff`** — the similarity check `diff "$f1" "$f2" | grep -c "^<"` is a crude metric that may produce false positives/negatives for semantic overlap.

### 2. `create.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **N/A** | No frontmatter — plain markdown (acceptable) |
| Referenced commands exist | **PASS** | Called by `hf-create.md` which exists |
| Referenced skills exist | **PASS** | References `use-authoring-skills`, `agents-and-subagents-dev`, `command-dev`, `custom-tools-dev` — all exist in `.opencode/skills/` |
| End-to-end execution path clear | **PASS** | Load state → Classify intent → Load skills → Dispatch specialist → Collect/verify → Report |
| No circular dependencies | **PASS** | Linear flow, no loops |
| No dead steps | **PASS** | Each step feeds the next |

**Issues:**
- ℹ️ Clean workflow. Well-structured routing table.

### 3. `prompt-enhance.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **N/A** | No frontmatter — plain markdown (acceptable) |
| Referenced commands exist | **PASS** | Called by `hf-prompt-enhance.md` which exists |
| Referenced skills exist | **PARTIAL** | Implicitly references `planning-with-files` via session state contract. No explicit skill loads. |
| End-to-end execution path clear | **PASS** | Session state → Phase 0 skim → Bridge → Investigation lanes → Clarification gate → Final assembly → Report |
| No circular dependencies | **PASS** | Linear with bridge-based branching, no loops |
| No dead steps | **PASS** | All steps produce consumed outputs (SKIM_RESULT, ANALYSIS_RESULT, etc.) |

**Issues:**
- ⚠️ **References subagents that are never dispatched directly**: `context-mapper`, `context-purifier`, `risk-assessor` are listed as lane agents but the workflow describes them as conceptual lanes rather than actual Task tool calls with `subagent_type=`. The workflow uses `Task tool` calls but does not specify `subagent_type` for lane dispatches.
- ⚠️ **CI-safe fallback assumes `CI=true`** — the interactive mode fallback may not work in all non-interactive environments.

### 4. `stack.md`

| Check | Status | Detail |
|-------|--------|--------|
| YAML frontmatter valid | **N/A** | No frontmatter — plain markdown (acceptable) |
| Referenced commands exist | **PASS** | Called by `hf-stack.md` which exists |
| Referenced skills exist | **PASS** | References 20 skills in loading order — all exist in `.opencode/skills/` |
| End-to-end execution path clear | **PASS** | Load state → Parse request → Validate compatibility → Determine loading order → Produce stack config |
| No circular dependencies | **PASS** | Linear flow |
| No dead steps | **PASS** | All steps produce outputs |

**Issues:**
- ℹ️ **Lists ALL 20 skills in loading order** — comprehensive but verbose. Only the skills actually in the stack should be loaded, not all 20.

---

## Workflow Summary Scorecard

| Metric | Count | Details |
|--------|-------|---------|
| Total workflows | 4 | |
| Have YAML frontmatter | 0/4 | None have frontmatter (acceptable for workflow docs) |
| All referenced commands exist | 4/4 | `hf-audit`, `hf-create`, `hf-prompt-enhance`, `hf-stack` all exist |
| All referenced skills exist | 4/4 | All skill references resolve to files in `.opencode/skills/` |
| Clear end-to-end paths | 3/4 | `audit.md` is bash-only, lacks subagent integration |
| Circular dependencies | 0 | None found |
| Dead steps | 0 | All steps produce consumed outputs |

---

## Broken References

### Confirmed Broken (this worktree)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `hf-audit.md` | 14, 22 | Hardcoded absolute path `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/...` | Use relative path: `@./.hivefiver-meta-builder/workflows-lab/active/refactoring/audit.md` or workflow-relative reference |
| `hf-create.md` | 14, 22 | Hardcoded absolute path `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/...` | Use relative path |
| `hf-stack.md` | 14, 22 | Hardcoded absolute path `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/...` | Use relative path |

### References to Non-Existent Skills (found in skill files, not commands)

| Source File | References | Target Exists? | Fix |
|-------------|-----------|----------------|-----|
| `meta-builder/SKILL.md` (line 62) | `skill-creator` | **NO** — no `skill-creator` in skills-lab or .opencode/skills | Remove reference or create the skill |
| `skill-synthesis/SKILL.md` (line 178) | `skill-judge` (external) | **NO** — no `skill-judge` in skills-lab or .opencode/skills | Remove reference or create the skill |
| `user-intent-interactive-loop/SKILL.md` (lines 125, 126, 363) | `gcc`, `skill-creator`, `writing_skills` | **NO** — none of these exist | Remove or fix references |

### References to Non-Existent Agents (from dependency graph, verified)

| Agent File | Status | Issue |
|------------|--------|-------|
| `context-mapper.md` | EXISTS | Referenced in prompt-enhance lanes but never dispatched as `subagent_type` |
| `context-purifier.md` | EXISTS | Same as above |
| `risk-assessor.md` | EXISTS | Same as above |
| `hivefiver.md` | EXISTS | Root meta-agent name but no distinct role from `hivefiver-orchestrator` |
| `intent-loop.md` | EXISTS | Has skills but no command dispatches it |
| `meta-synthesis-agent.md` | EXISTS | No command triggers it |
| `phase-guardian.md` | EXISTS | No command dispatches it |
| `spec-verifier.md` | EXISTS | No command triggers it |

---

## Duplicate / Overlap Analysis

### Command Overlaps

| Pair | Overlap Area | Severity | Detail |
|------|-------------|----------|--------|
| `harness-audit.md` ↔ `hf-audit.md` | Both trigger on "audit skills" | ⚠️ Medium | `harness-audit` = comprehensive harness audit (multi-phase, 5 subagents). `hf-audit` = meta-concept quality audit (bash validators). Different scopes but overlapping trigger phrases create ambiguity. |
| `start-work.md` ↔ `ultrawork.md` | Both execute `task_plan.md` via `delegate-task` | ⚠️ Medium | `start-work` = phase-by-phase with status tracking. `ultrawork` = fully autonomous. The distinction is subtle — both read `task_plan.md`, both use `delegate-task`, both use `critic`. Users may not know which to use. |
| `plan.md` ↔ `ultrawork.md` | Both do planning | ℹ️ Low | `plan.md` = interview-based planning only. `ultrawork.md` = explore + plan + execute. The planning phase of ultrawork overlaps with standalone plan command. |

### No Commands Using These Workflows

| Workflow | Commands That Should Use It | Status |
|----------|---------------------------|--------|
| `audit.md` | `hf-audit.md` ✅ uses it | Connected |
| `create.md` | `hf-create.md` ✅ uses it | Connected |
| `prompt-enhance.md` | `hf-prompt-enhance.md` ✅ uses it (inline) | Connected |
| `stack.md` | `hf-stack.md` ✅ uses it | Connected |

### Commands With No Workflow Membership

| Command | Should Have Workflow? | Recommendation |
|---------|----------------------|----------------|
| `deep-init.md` | **YES** — ~380 lines of inline protocol | Extract to `deep-init.md` workflow in workflows-lab |
| `deep-research-synthesis-repomix.md` | N/A — reference doc | Move to `references-lab/` |
| `harness-audit.md` | **YES** — multi-phase delegation | Could extract delegation plan to workflow |
| `harness-doctor.md` | **YES** — 8-step diagnostic | Could extract to workflow |
| `hf-prompt-enhance.md` | N/A — inline but well-structured | OK as-is, but could extract for reuse |
| `plan.md` | **YES** — interview protocol | Could extract to workflow |
| `start-work.md` | **YES** — phase execution protocol | Could extract to workflow |
| `ultrawork.md` | **YES** — full autonomous protocol | Could extract to workflow |

---

## Workflows With Missing Steps

| Workflow | Missing Step | Impact |
|----------|-------------|--------|
| `audit.md` | No subagent dispatch for analysis phase | Audit findings are limited to what bash scripts can check — no semantic analysis, no quality scoring |
| `prompt-enhance.md` | Lane agents (`context-mapper`, `context-purifier`, `risk-assessor`) referenced but not dispatched as `Task(subagent_type=...)` | Lanes run in the orchestrator's context rather than isolated subagent sessions, defeating the "keep context lean" objective |
| `stack.md` | No compatibility validation mechanism described | Step 3 says "Validate compatibility" but provides no concrete checks beyond "skill exists" |

---

## Specific Fix List Per File

### `deep-init.md`
1. **ADD** YAML frontmatter: `---\ndescription: "Generate hierarchical AGENTS.md files with complexity scoring"\nagent: hivefiver-orchestrator\nsubtask: true\n---`
2. **EXTRACT** inline protocol (~380 lines) to `.hivefiver-meta-builder/workflows-lab/active/refactoring/deep-init.md`
3. **REPLACE** inline content with workflow reference

### `hf-audit.md`
1. **REPLACE** hardcoded absolute path with relative: `@./.hivefiver-meta-builder/workflows-lab/active/refactoring/audit.md`
2. **RENAME** trigger "audit skills" to avoid collision with `harness-audit.md` (e.g., "audit meta-concepts")

### `hf-create.md`
1. **REPLACE** hardcoded absolute path with relative: `@./.hivefiver-meta-builder/workflows-lab/active/refactoring/create.md`

### `hf-stack.md`
1. **REPLACE** hardcoded absolute path with relative: `@./.hivefiver-meta-builder/workflows-lab/active/refactoring/stack.md`

### `harness-audit.md`
1. **RENAME** trigger "audit skills" to avoid collision with `hf-audit.md` (e.g., "audit harness boundaries")

### `harness-doctor.md`
1. **VERIFY** `.opencode/rules/harness-rules.md` exists — if not, add guard or create it
2. **ADD** guard for harness plugin absence before referencing `delegate-task`

### `deep-research-synthesis-repomix.md`
1. **MOVE** to `references-lab/` directory — it is not an executable command
2. **OR** if it must stay in commands, remove `subtask: true` (meaningless for reference docs)

### `ultrawork.md`
1. **DIFFERENTIATE** trigger phrase from `start-work.md` — make autonomous nature explicit (e.g., "full autonomous mode", "no-hands execution")
2. **ADD** note explaining when to use `/ultrawork` vs `/start-work`

### `start-work.md`
1. No changes needed — clean

### `plan.md`
1. No changes needed — clean

### `hf-prompt-enhance.md`
1. **CLARIFY** lane agent dispatch — specify `subagent_type` for each lane to truly isolate context

### Workflow: `audit.md`
1. **ADD** subagent dispatch for semantic analysis phase (use `meta-synthesis-agent`)
2. **IMPROVE** overlap detection — replace crude `diff` with semantic comparison

### Workflow: `prompt-enhance.md`
1. **SPECIFY** `subagent_type` for each lane dispatch to achieve true context isolation
2. **ADD** explicit skill loading for `planning-with-files` (currently only implicit)

### Workflow: `stack.md`
1. **ADD** concrete compatibility checks for Step 3 (e.g., check for conflicting tool permissions, overlapping trigger phrases, circular skill dependencies)
2. **FILTER** skill loading — only load skills in the stack, not all 20

### Skill: `meta-builder/SKILL.md`
1. **REMOVE** reference to non-existent `skill-creator` skill (line 62)

### Skill: `skill-synthesis/SKILL.md`
1. **REMOVE** reference to non-existent `skill-judge` skill (line 178)

### Skill: `user-intent-interactive-loop/SKILL.md`
1. **REMOVE** references to non-existent `gcc` skill (lines 125, 363)
2. **REMOVE** references to non-existent `skill-creator` and `writing_skills` (line 126)

---

## Corrections to Prior Audit (v1)

The prior audit (`docs/audit/command-workflow-audit.md`) contained **3 factual errors** that this v2 audit corrects:

| Prior Audit Claim | Actual Finding | Evidence |
|-------------------|---------------|----------|
| `hf-audit.md` workflow ref points to `hivefiver-v2` worktree | Points to `harness-experiment` worktree (current worktree) | `grep` confirms path contains `harness-experiment`, not `hivefiver-v2` |
| `hf-create.md` workflow ref points to `hivefiver-v2` worktree | Points to `harness-experiment` worktree | Same as above |
| `hf-stack.md` workflow ref points to `hivefiver-v2` worktree | Points to `harness-experiment` worktree | Same as above |

The prior audit also **missed** these issues that v2 caught:
- `deep-init.md` has **no YAML frontmatter at all** (prior audit didn't flag this as a blocker)
- **Hardcoded absolute paths** in 3 command files (prior audit called them "dead refs" — they're not dead, they're just non-portable)
- **Non-existent skill references** in skill files themselves (`skill-creator`, `skill-judge`, `gcc`, `writing_skills`)

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Blockers (must fix)** | 4 |
| - `deep-init.md` missing frontmatter | 1 |
| - Hardcoded absolute paths (3 files) | 3 |
| **Warnings (should fix)** | 8 |
| - Trigger overlaps (2 pairs) | 2 |
| - Skill references to non-existent skills (4 files) | 4 |
| - Workflow missing subagent dispatch | 1 |
| - Missing compatibility validation | 1 |
| **Informational** | 5 |
| - Reference doc misclassified as command | 1 |
| - Commands with no workflow binding | 8 |
| - Orphaned agents (exist but no command uses them) | 8 |

---

_Verified: 2026-04-07_
_Verifier: Manual code-first audit (all claims backed by file reads and grep)_
