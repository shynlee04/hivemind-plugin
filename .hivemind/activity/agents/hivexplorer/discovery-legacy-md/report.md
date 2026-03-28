# Legacy .md Runtime Components — Discovery Report

**Agent:** hivexplorer  
**Slice:** discovery-legacy-md  
**Scope:** All `.md` files that define runtime behavior (agents, commands, workflows, prompts, skills)  
**Git Commit:** 7183335  
**Date:** 2026-03-26  

---

## Executive Summary

The codebase has **6 distinct categories** of `.md` files that define or influence runtime behavior. Some are OpenCode-spec-required (skills), some are actively loaded by TypeScript code (commands, agents), and some are **dead legacy** with zero runtime consumers (workflows, noise commands, deprecated hive skills).

---

## 1. AGENT DEFINITIONS — `.md`

### 1a. `agents/*.deprecated.md` — Canonical Agent Source (9 files)

| File | Classification | Runtime Consumer |
|------|---------------|------------------|
| `agents/hivefiver.deprecated.md` | **CONVERT to .ts** | `src/shared/opencode-agent-registry.ts:95` reads via `readFileSync` |
| `agents/hivemaker.deprecated.md` | **CONVERT to .ts** | Same |
| `agents/hiveminder.deprecated.md` | **CONVERT to .ts** | Same |
| `agents/hiveplanner.deprecated.md` | **CONVERT to .ts** | Same |
| `agents/hiveq.deprecated.md` | **CONVERT to .ts** | Same |
| `agents/hivehealer.deprecated.md` | **CONVERT to .ts** | Same |
| `agents/hivexplorer.deprecated.md` | **CONVERT to .ts** | Same |
| `agents/hiverd.deprecated.md` | **CONVERT to .ts** | Same |
| `agents/hitea.deprecated.md` | **CONVERT to .ts** | Same |
| `agents/AGENTS.md` | **CONVERT to .ts** | Documentation of the registry; no runtime consumer |

**Evidence:** `src/shared/opencode-agent-registry.ts:94-95` — `loadAgentMarkdown()` calls `readFileSync(join(packageRoot, 'agents', \`${id}.deprecated.md\`), 'utf-8')`. The registry at line 40-50 defines the 9 IDs. The TypeScript code parses YAML frontmatter from these `.md` files at runtime.

**Migration Path:** The agent registry (`opencode-agent-registry.ts`) already does the YAML parsing in TypeScript. The `.deprecated.md` files contain:
- YAML frontmatter (description, mode, tools, permission, contract)
- Markdown body (role priming, workflows, delegation rules)

The YAML frontmatter should become TypeScript interfaces/objects. The markdown body is agent system prompt content — this could stay as `.md` (loaded as instruction strings) OR be compiled into TypeScript template literals. The **frontmatter is the runtime contract** and should be TypeScript. The body is prompt content that could go either way.

### 1b. `.opencode/agents/*.md` — Runtime Projections (13 files)

| File | Classification | Notes |
|------|---------------|-------|
| `.opencode/agents/general.md` | **KEEP as .md** | OpenCode built-in agent |
| `.opencode/agents/explore.md` | **KEEP as .md** | OpenCode built-in agent |
| `.opencode/agents/hiveminder.md` | **CONVERT to .ts** | HiveMind-specific, hand-maintained, 505 lines |
| `.opencode/agents/hivemaker.md` | **CONVERT to .ts** | HiveMind-specific |
| `.opencode/agents/hiveplanner.md` | **CONVERT to .ts** | HiveMind-specific |
| `.opencode/agents/hiveq.md` | **CONVERT to .ts** | HiveMind-specific |
| `.opencode/agents/hivehealer.md` | **CONVERT to .ts** | HiveMind-specific |
| `.opencode/agents/hivexplorer.md` | **CONVERT to .ts** | HiveMind-specific |
| `.opencode/agents/hiverd.md` | **CONVERT to .ts** | HiveMind-specific |
| `.opencode/agents/hitea.md` | **CONVERT to .ts** | HiveMind-specific |
| `.opencode/agents/hivefiver.md` | **CONVERT to .ts** | HiveMind-specific |
| `.opencode/agents/handoff.md` | **CONVERT to .ts** | HiveMind-specific |
| `.opencode/agents/architect.md` | **CONVERT to .ts** | HiveMind-specific |
| `.opencode/agents/code-skeptic.md` | **CONVERT to .ts** | HiveMind-specific |

**Evidence:** These `.opencode/agents/*.md` files contain OpenCode frontmatter (description, mode, tools, permission) + markdown body. They ARE the runtime agent definitions that OpenCode loads. The 2 OpenCode built-ins (`general.md`, `explore.md`) must stay as `.md` per OpenCode spec. The 11+ HiveMind-specific agents are hand-maintained large `.md` files (some 500+ lines).

**Note:** `agents/*.deprecated.md` and `.opencode/agents/*.md` are NOT identical. The `.opencode/` versions are expanded/different from the `agents/` source. Both exist as parallel authoring surfaces.

---

## 2. COMMAND DEFINITIONS — `.md`

### 2a. `commands/*.md` — Root Command Surface (45 files)

**10 Registered Commands (ACTIVE):**

| File | Classification | Bundle ID |
|------|---------------|-----------|
| `commands/hm-init.md` (60 lines) | **CONVERT to .ts** | `hm-init` in `command-bundles.ts:6-22` |
| `commands/hm-doctor.md` | **CONVERT to .ts** | `hm-doctor` in `command-bundles.ts:23-40` |
| `commands/hm-harness.md` | **CONVERT to .ts** | `hm-harness` in `command-bundles.ts:41-58` |
| `commands/hm-settings.md` (57 lines) | **CONVERT to .ts** | `hm-settings` in `command-bundles.ts:59-76` |
| `commands/hm-research.md` (27 lines) | **CONVERT to .ts** | `hm-research` in `command-bundles.ts:77-93` |
| `commands/hm-plan.md` | **CONVERT to .ts** | `hm-plan` in `command-bundles.ts:94-110` |
| `commands/hm-implement.md` | **CONVERT to .ts** | `hm-implement` in `command-bundles.ts:111-127` |
| `commands/hm-verify.md` (26 lines) | **CONVERT to .ts** | `hm-verify` in `command-bundles.ts:128-144` |
| `commands/hm-tdd.md` (26 lines) | **CONVERT to .ts** | `hm-tdd` in `command-bundles.ts:145-161` |
| `commands/hm-course-correct.md` | **CONVERT to .ts** | `hm-course-correct` in `command-bundles.ts:162-178` |

**Evidence:** `src/features/runtime-entry/instruction-loader.ts:134-147` — `loadCommandAsset(name)` reads `commands/${name}.md` via `readFile(new URL(\`../../../commands/${fileName}\`, import.meta.url))`. This is called from `src/features/runtime-entry/command.ts:64` during command execution. The `.md` files are loaded at runtime and their YAML frontmatter + markdown body are parsed.

**Migration Path:** Each command `.md` contains YAML frontmatter (description, agent, subtask, consumes_state, produces_state, verification_contract, closeout_gate, artifact_projections) + markdown body (objective, context, process, output contract). The frontmatter is runtime metadata that belongs in TypeScript. The body is instruction content loaded as a string — could be TypeScript template literals or kept as loaded strings.

**33 Unregistered Commands (NOISE — DEPRECATE):**

| File | Classification |
|------|---------------|
| `commands/hiverd-research.md` | **DEPRECATE** — not in `command-bundles.ts` |
| `commands/hiverd-synthesize.md` | **DEPRECATE** |
| `commands/hiverd-analyze.md` | **DEPRECATE** |
| `commands/hiverd-brainstorm.md` | **DEPRECATE** |
| `commands/hiverd-compare.md` | **DEPRECATE** |
| `commands/hiverd-document.md` | **DEPRECATE** |
| `commands/hiveq-verify.md` | **DEPRECATE** |
| `commands/hiveq-gate-check.md` | **DEPRECATE** |
| `commands/hiveq-lint.md` | **DEPRECATE** |
| `commands/hiveq-regression.md` | **DEPRECATE** |
| `commands/hiveq-compliance.md` | **DEPRECATE** |
| `commands/hiveq-audit.md` | **DEPRECATE** |
| `commands/hiveminder-orchestrate.md` | **DEPRECATE** |
| `commands/hivemind-status.md` | **DEPRECATE** |
| `commands/hivemind-scan.md` | **DEPRECATE** |
| `commands/hivemind-delegate.md` | **DEPRECATE** |
| `commands/hivemind-lint.md` | **DEPRECATE** |
| `commands/hivemind-debug-verify.md` | **DEPRECATE** |
| `commands/hivemind-clarify.md` | **DEPRECATE** |
| `commands/hivemind-compact.md` | **DEPRECATE** |
| `commands/hivemind-dashboard.md` | **DEPRECATE** |
| `commands/hivemind-debug-trigger.md` | **DEPRECATE** |
| `commands/hivemind-context.md` | **DEPRECATE** |
| `commands/hivemind-pre-stop.md` | **DEPRECATE** |
| `commands/hivefiver.md` | **DEPRECATE** — violates rules with shell scripts |
| `commands/hivefiver-start.md` | **DEPRECATE** |
| `commands/hivefiver-plan-spawn.md` | **DEPRECATE** |
| `commands/hivefiver-spec.md` | **DEPRECATE** |
| `commands/hivefiver-doctor.md` | **DEPRECATE** |
| `commands/hivefiver-discovery.md` | **DEPRECATE** |
| `commands/hivefiver-intake.md` | **DEPRECATE** |
| `commands/hivefiver-audit.md` | **DEPRECATE** |
| `commands/hivefiver-build.md` | **DEPRECATE** |
| `commands/hivefiver-continue.md` | **DEPRECATE** |
| `commands/hivefiver-architect.md` | **DEPRECATE** |
| `commands/AGENTS.md` | **KEEP as .md** — documentation only |

**Evidence:** `commands/AGENTS.md:42-100` explicitly classifies these as NOISE. `command-bundles.ts` has exactly 10 entries — none reference these files. No TypeScript code in `src/` consumes them.

### 2b. `.opencode/commands/*.md` — Dev Mirror (10 files)

| File | Classification |
|------|---------------|
| `.opencode/commands/hm-plan.md` | **SYMLINK** to root `commands/hm-plan.md` |
| `.opencode/commands/hm-verify.md` | **SYMLINK** |
| `.opencode/commands/hm-tdd.md` | **SYMLINK** |
| `.opencode/commands/hm-research.md` | **SYMLINK** |
| `.opencode/commands/hm-harness.md` | **SYMLINK** |
| `.opencode/commands/hm-implement.md` | **SYMLINK** |
| `.opencode/commands/hm-course-correct.md` | **SYMLINK** |
| `.opencode/commands/hm-init.md.deprecated` | **DEPRECATE** — `.deprecated` suffix, not loaded |
| `.opencode/commands/hm-doctor.md.deprecated` | **DEPRECATE** |
| `.opencode/commands/hm-settings.md.deprecated` | **DEPRECATE** |

**Evidence:** `diff` shows identical content between root `commands/hm-plan.md` and `.opencode/commands/hm-plan.md`. The 3 `.md.deprecated` files are stale copies that would not be loaded (no code reads `.md.deprecated` files from `.opencode/commands/`).

---

## 3. WORKFLOW DEFINITIONS — `.yaml`

### 3a. `workflows/*.yaml` — All Legacy (22 files)

| Files | Classification |
|-------|---------------|
| All 21 `.yaml` files | **DEPRECATE** |
| `workflows/AGENTS.md` | **KEEP as .md** — documentation |

**Evidence:** `workflows/AGENTS.md` explicitly states: "All YAML workflow files in this directory are LEGACY/NOISE and should not be used." No TypeScript code in `src/` references these YAML files. `command-bundles.ts` uses `workflowChain: string[]` (inline string arrays), not YAML file references.

---

## 4. PROMPT DEFINITIONS — `.md`

### 4a. `prompts/*.md` — Standalone Prompt Files (8 files)

| File | Classification | Referenced From |
|------|---------------|-----------------|
| `prompts/synthesis-instruction.md` | **CONVERT to .ts** | No TypeScript reference found |
| `prompts/research-question-framing.md` | **CONVERT to .ts** | No TypeScript reference found |
| `prompts/verification-criteria.md` | **CONVERT to .ts** | No TypeScript reference found |
| `prompts/hivemind-brownfield-remediation.md` | **CONVERT to .ts** | No TypeScript reference found |
| `prompts/analysis-methodology.md` | **CONVERT to .ts** | No TypeScript reference found |
| `prompts/brainstorm-framing.md` | **CONVERT to .ts** | No TypeScript reference found |
| `prompts/comparison-criteria.md` | **CONVERT to .ts** | No TypeScript reference found |
| `prompts/compliance-rules.md` | **CONVERT to .ts** | No TypeScript reference found |

**Evidence:** `grep` for `prompts/` or `.prompts/` in `src/**/*.ts` returned **zero results**. These prompt files have NO TypeScript consumer. They appear to be instruction content that agents might reference conversationally, but they are not loaded by any runtime code.

---

## 5. SKILL DEFINITIONS — `.md`

### 5a. Skills ARE Inherently .md-Based (OpenCode Spec)

Skills use `SKILL.md` with YAML frontmatter — this is an **OpenCode spec requirement**. Skills MUST remain as `.md` files.

### 5b. `.opencode/skills/*/SKILL.md` — Runtime Skills (20+ skill trees)

| Location | Classification |
|----------|---------------|
| `.opencode/skills/use-hivemind-*/SKILL.md` | **KEEP as .md** — OpenCode spec |
| `.opencode/skills/hivemind-*/SKILL.md` | **KEEP as .md** — OpenCode spec |
| `.opencode/skills/*/references/*.md` | **KEEP as .md** — skill support files |
| `.opencode/skills/*/templates/*.md` | **KEEP as .md** — skill support files |
| `.opencode/skills/*/tests/*.md` | **KEEP as .md** — skill test docs |

**Evidence:** `src/shared/opencode-skill-registry.ts:87-110` — `discoverSkills()` scans `{packageRoot}/skills/` directories for `SKILL.md` files. This is the OpenCode skill loading mechanism. Skills MUST use `.md` format.

### 5c. `skills/skills/*/SKILL.md` — Old Skill Surface (19 skill trees)

| Location | Classification |
|----------|---------------|
| `skills/skills/use-hivemind-*/SKILL.md` | **SYMLINK** — should symlink to `.opencode/skills/` |
| `skills/skills/hivemind-*/SKILL.md` | **SYMLINK** |
| `skills/skills/tdd-delegation/` | **SYMLINK** |
| `skills/skills/research-delegation/` | **SYMLINK** |
| `skills/skills/spec-distillation/` | **SYMLINK** |
| `skills/skills/git-continuity-memory/` | **SYMLINK** |
| `skills/skills/context-*/` | **SYMLINK** |

**Evidence:** `opencode-skill-registry.ts:88` — `discoverSkills()` scans `{packageRoot}/skills/` which resolves to the project root `skills/` directory. It then looks for `SKILL.md` inside each subdirectory. The `skills/skills/` nested structure is the actual scan target. This creates a duplication risk with `.opencode/skills/`.

### 5d. `skills/_deprecated_hive/` — Deprecated Skills (29 entries)

| Location | Classification |
|----------|---------------|
| All 29 directories under `skills/_deprecated_hive/` | **DEPRECATE** |

**Evidence:** The `_deprecated_hive` directory name and `_` prefix indicate these are archived. The `registry-internal.yaml:21-24` archival note confirms these were moved to `_deprecated_hive/`. The underscore prefix should cause `discoverSkills()` to skip them (line 95: `!entry.name.startsWith('_')`).

### 5e. `.developing-skills/refactored-skills/*/SKILL.md` — Development Copies

| Location | Classification |
|----------|---------------|
| `.developing-skills/refactored-skills/*/SKILL.md` | **KEEP** — active development workspace |
| `.developing-skills/.hivemind/` | **KEEP** — session inspection artifacts |

**Evidence:** This is the active development workspace for skill authoring. These are working copies, not runtime surfaces.

---

## 6. OTHER RUNTIME `.md` FILES

### 6a. `.opencode/plugins/hivemind-context-governance.ts` — Plugin Entry

This is a `.ts` file, not `.md`. No `.md` involvement.

### 6b. Root `.md` Files

| File | Classification |
|------|---------------|
| `AGENTS.md` | **KEEP as .md** — workspace governance |
| `README.md` | **KEEP as .md** — documentation |
| `SKILL.md` (if exists at root) | **KEEP as .md** — OpenCode skill entry |

---

## Structure Map

```
agents/
├── *.deprecated.md (9)        ← CONVERT: read by opencode-agent-registry.ts at runtime
└── AGENTS.md (1)              ← KEEP: documentation

.opencode/agents/
├── general.md                 ← KEEP: OpenCode built-in
├── explore.md                 ← KEEP: OpenCode built-in
└── hiv*.md (11)               ← CONVERT: HiveMind agent definitions

commands/
├── hm-*.md (10 registered)    ← CONVERT: loaded by instruction-loader.ts at runtime
├── hiverd-*.md (6)            ← DEPRECATE: unregistered noise
├── hiveq-*.md (6)             ← DEPRECATE: unregistered noise
├── hivemind-*.md (11)         ← DEPRECATE: unregistered noise
├── hivefiver-*.md (11)        ← DEPRECATE: unregistered noise
└── AGENTS.md                  ← KEEP: documentation

.opencode/commands/
├── hm-*.md (7)                ← SYMLINK: mirrors of root commands/
└── hm-*.md.deprecated (3)     ← DEPRECATE: stale copies

workflows/
├── *.yaml (21)                ← DEPRECATE: no runtime consumer
└── AGENTS.md                  ← KEEP: documentation

prompts/
└── *.md (8)                   ← CONVERT to .ts: no TypeScript consumer found

skills/
├── skills/*/SKILL.md (19+)    ← KEEP as .md: OpenCode spec required
├── _deprecated_hive/ (29)     ← DEPRECATE: archived
└── registry-internal.yaml     ← KEEP: metadata

.opencode/skills/
└── */SKILL.md (20+)           ← KEEP as .md: OpenCode spec required

.developing-skills/
└── refactored-skills/*/SKILL.md ← KEEP: development workspace
```

---

## Patterns Found

### Pattern 1: Dual Authoring Surfaces
Agents have TWO authoring surfaces: `agents/*.deprecated.md` AND `.opencode/agents/*.md`. The TypeScript registry reads from `agents/` but `.opencode/agents/` has hand-maintained expanded content. These are out of sync.

### Pattern 2: Command Bundle + .md Coupling
Command bundles in `command-bundles.ts` reference `commandFile: 'hm-init.md'` which is then loaded from `commands/hm-init.md` at runtime by `instruction-loader.ts`. The `.md` files contain the instruction body but the TypeScript code provides routing, pressure contracts, workflow chains, etc. This is a split authority pattern.

### Pattern 3: Zero Consumer Prompt Files
All 8 `prompts/*.md` files have no TypeScript consumer. They appear to be orphaned instruction content.

### Pattern 4: Massive Command Noise
33 of 45 command files are unregistered noise — 73% of commands/ is dead.

### Pattern 5: Skills Are the Exception
Skills are the ONLY category where `.md` is the spec-required format. The OpenCode skill loader (`opencode-skill-registry.ts`) explicitly scans for `SKILL.md` files.

---

## Gaps

1. **No clear projection pipeline** — The `agents/*.deprecated.md` → `.opencode/agents/*.md` projection is not automated. Both exist as hand-maintained files that have drifted apart.

2. **No deprecation cleanup** — The 33 noise commands, 21 workflow YAMLs, and 29 deprecated skills have not been removed despite being classified as dead.

3. **Prompt files orphaned** — 8 `prompts/*.md` files have no runtime consumer and no deprecation notice.

4. **Command `.md` body is prompt content** — The markdown body of command `.md` files IS the instruction prompt given to the agent. Converting to TypeScript means deciding whether these become template literals or remain as loaded string assets.

---

## Migration Priority

| Priority | Category | Action | Effort |
|----------|----------|--------|--------|
| P0 | 33 noise commands | DELETE | Low |
| P0 | 21 workflow YAMLs | DELETE | Low |
| P0 | 29 deprecated skills | DELETE | Low |
| P0 | 3 `.md.deprecated` in .opencode/commands/ | DELETE | Trivial |
| P1 | 8 orphaned prompts | DELETE or CONVERT | Low |
| P1 | 10 registered commands .md | CONVERT frontmatter to TS; body can stay .md | Medium |
| P2 | 9 agents/*.deprecated.md | CONVERT to TS registry entries | Medium |
| P2 | 11 .opencode/agents/*.md | CONVERT to TS (except 2 OpenCode built-ins) | High |
| P3 | Skills SKILL.md | KEEP as .md (OpenCode spec) | N/A |
