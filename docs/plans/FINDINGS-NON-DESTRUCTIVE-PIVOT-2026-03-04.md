# Findings & Decisions: Non-Destructive Pivot

**Date**: 2026-03-04  
**Type**: Research findings + technical decisions + platform evidence  
**Owner**: hiveplanner  
**Linked to**: `MASTER-NON-DESTRUCTIVE-PIVOT-2026-03-04.md`

---

## 1. Platform Mechanics Evidence (from 85K reference doc)

### 1.1 Session Hierarchy & DAG Structure

**Finding**: Sessions form a directed acyclic graph with typed parent/child relationships. Every child spawned by the `task` tool carries a `parentID` and an isolated message history. The orchestrator receives ONLY the synthesized `<task_result>` text back.

**Evidence** (reference doc citations):
- Session schema: `parentID: Identifier.schema("session").optional()` — session.ts L119-161
- Fork capability: sessions can be forked at any message boundary — session.ts L234-274
- Task result format: `task_id: <session_id>` + `<task_result>...</task_result>` — task.ts L119-163
- Child session isolation: new session created with `parentID: ctx.sessionID` — task.ts L66-102

**Implication for plan**: Delegation is inherently isolated. The orchestrator (hivefiver) cannot accidentally pollute a subagent's context, and vice versa. The delegation packet in the `prompt` parameter is the ONLY way to pass context into a child session. This means we MUST put lineage + artifact_type in the prompt text — there's no other mechanism.

### 1.2 Agent Definition: Machine-Parsed vs Decorative

**Finding**: Agent frontmatter is parsed via `ConfigMarkdown.parse()` and validated against a Zod schema. Only specific fields are machine-parsed. Unknown fields pass through without error but are NOT used by the engine.

**Machine-parsed fields** (with evidence):
| Field | Zod Type | Engine Usage | Source |
|-------|----------|-------------|--------|
| `description` | `z.string()` | Displayed in agent list, used in tool description for task routing | skill.ts L1765 |
| `mode` | `"primary" \| "subagent"` | Determines if command with this agent becomes subtask | prompt.ts L1238 |
| `model` | `string` | Model selection: command.model → agent.model → input.model → lastModel | prompt.ts L1793-1858 |
| `temperature` | `z.number()` | LLM sampling parameter | agent.ts (title agent has 0.5) |
| `steps` | `z.number().int().positive().optional()` | After N iterations, forces text-only — drift prevention | agent.ts L44-45, prompt.ts L556-560 |
| `permission` | `PermissionNext.Config` | Machine-enforced ruleset, merged last-wins | agent.ts L56-75 |
| `hidden` | `z.boolean()` | Hides from agent list (compaction, title, summary agents are hidden) | agent.ts L664, L676 |
| `prompt` | `string` | Injected as system prompt (explore, compaction agents have hardcoded prompts) | agent.ts L655, L665 |

**Decorative fields** (engine ignores, LLM reads):
- Any field NOT in the Zod schema: `identity`, `scope`, `lineage`, `delegation_policy`, `recursive_delegation`
- These pass through `safeParse()` without error — Zod `.pick()` only validates selected fields
- The LLM sees them because the full frontmatter YAML is part of the file content loaded as prompt

**Decision**: Use decorative fields for LLM-oriented metadata that reinforces machine-enforced behavior. Example: `scope: ".opencode/**"` in frontmatter reinforces the permission rule `edit: { "*": "deny", ".opencode/**": "allow" }`. Belt and suspenders.

### 1.3 Skill Loading: Timing, Pruning, Discovery

**Finding**: Skills are discovered at startup, cached in `Instance.state()`, and loaded on-demand when invoked. Skill output is prune-protected but NOT automatically re-injected after compaction.

**Evidence**:
- Discovery scan is async, runs once at instance startup: `export const state = Instance.state(async () => {...})` — skill.ts L1749
- Discovery order (project overrides global):
  1. `~/.claude/skills/**`, `~/.agents/skills/**` (global external)
  2. `.claude/skills/**`, `.agents/skills/**` (project external)
  3. `.opencode/skill/**`, `.opencode/skills/**` (project opencode)
  4. `config.skills.paths` (custom paths from config)
  5. `config.skills.urls` (remote CDN via `index.json`) — skill.ts L45-176
- Prune protection: `PRUNE_PROTECTED_TOOLS = ["skill"]` — compaction.ts L50-57. The prune pass goes backward through messages, truncating old tool outputs, but SKIPS skill outputs entirely.
- Prune window: last 40K tokens are protected from ANY pruning. Beyond that, non-skill tool outputs get truncated. — compaction.ts L1529-1530: `PRUNE_MINIMUM = 20_000`, `PRUNE_PROTECT = 40_000`
- Skill output format: `<skill_content name="...">` XML block with `<skill_files>` listing — skill.ts L99-120
- Skills auto-register as slash commands: skill name becomes `/skillname` — command.ts L126-138

**Implication for plan**: 
- T0 skill load is the most reliable moment for domain expertise injection
- Mid-session, the skill content is still IN context (prune-protected) but the model's ATTENTION to it decays as newer messages accumulate
- After compaction, skills are NOT in the new session — they must be explicitly re-loaded or their critical content must be in the compaction hook's `context` injection
- This confirms: identity/routing MUST be in agent body (system prompt), NOT skill

### 1.4 Command Mechanics: Deterministic vs LLM-Mediated

**Finding**: Commands have two execution paths, and the distinction is critical for orchestration design.

**Path 1 — Deterministic subtask** (no LLM judgment):
- Condition: `(agent.mode === "subagent" && command.subtask !== false) || command.subtask === true` — prompt.ts L1238
- Behavior: Command becomes a `SubtaskPart` on the user message. Session loop detects it and executes as TaskTool call BEFORE the next LLM turn — prompt.ts L350-526
- Use case: Chain starters. User invokes → deterministic execution → result back to orchestrator

**Path 2 — LLM-mediated** (`@agentname`):
- When user types `@agentname`, it bypasses permission check (`bypassAgentCheck: true`) and generates synthetic text: "Use the above message and context to generate a prompt and call the task tool with subagent: [name]" — prompt.ts L1260-1283
- This relies on LLM compliance — not deterministic

**Path 3 — Direct template** (no task tool):
- If command targets a `primary` agent and `subtask` is not explicitly true, the template parts are added directly to the user message — prompt.ts L1239-1254
- No child session spawned — runs in the current session context

**Decision**: For hivefiver orchestration, prefer `subtask: true` commands for deterministic chain-starting. Use `@agent` for user-directed ad-hoc delegation. Never rely on commands for autonomous agent-to-agent routing (agents cannot auto-invoke commands — confirmed, no auto-invoke mechanism exists in the platform).

### 1.5 Permission Merge: Defaults → Agent → User

**Finding**: Permissions are ordered arrays of rules evaluated with `findLast()` (last-match-wins). The merge strategy is: defaults → agent definition → user session overrides.

**Evidence**:
- Default permission construction: agent.ts L56-75 — includes `"*": "allow"`, `doom_loop: "ask"`, `.env` file protection
- Merge call: `PermissionNext.merge(defaults, agentConfig, user)` — agent.ts L584-591 (build agent example)
- Evaluation: `merged.findLast(rule => Wildcard.match(permission, rule.permission) && Wildcard.match(pattern, rule.pattern))` — next.ts L236-243
- If no rule matches: defaults to `{ action: "ask" }` — next.ts L1329

**Built-in guardrails**:
- `doom_loop: "ask"` — halts infinite tool call chains
- `.env` file protection in default read rules
- `explore` agent: total write/edit lockdown (`"*": "deny"` for everything except read tools) — agent.ts L633-658
- `plan` agent: only its plan file is editable — agent.ts L596-617
- Child sessions: todowrite/todoread denied + task denied unless explicit — task.ts L66-102

**Implication for plan**: Permission overrides in opencode.json for hivefiver will be the LAST layer merged, giving us definitive control. We can set `edit: { "*": "deny", ".opencode/**": "allow" }` and the engine will enforce this regardless of what the agent body says.

### 1.6 Steps Budget: Drift Prevention

**Finding**: The `steps` field on an agent definition limits agentic iterations. After N steps, the session loop forces a text-only response — no more tool calls allowed.

**Evidence**:
- Schema: `steps: z.number().int().positive().optional()` — agent.ts L44-45
- Enforcement: `const maxSteps = agent.steps ?? Infinity; const isLastStep = step >= maxSteps` — prompt.ts L556-560
- Default: `Infinity` (no limit) if not set

**Implication for plan**: This is our Rank 2 durable mechanism for drift prevention. hivefiver's steps budget should be high enough to complete orchestration tasks (which involve multiple delegations) but low enough to prevent runaway sessions. Starting value: 25. Tunable in Phase 7.

### 1.7 Compaction Hooks: Post-Compaction SOT Injection

**Finding**: The `experimental.session.compacting` hook lets plugins inject domain-specific context into the compaction prompt. The `context` field appends to the default prompt; the `prompt` field replaces it entirely.

**Evidence**:
- Hook signature: `"experimental.session.compacting"?: (input: { sessionID: string }, output: { context: string[]; prompt?: string }) => Promise<void>` — plugin/index.ts L1687-1690
- Default compaction template: Goal / Instructions / Discoveries / Accomplished / Relevant files — compaction.ts L151-178
- Compaction agent runs with ALL tools denied — agent.ts L660-674

**Implication for plan**: This is our T3 mechanism. When a session compacts, the hook can inject: current AGENTS.md content, active plan file path, schema SOT. The next session starts with ground truth embedded in the compaction summary. Implementation deferred to Phase 6 (need stable SOT artifacts first).

---

## 2. Skill Anatomy Patterns

### From anthropics/skill-creator (Three Progressive Disclosure Patterns)

1. **Progressive Disclosure**: metadata (~100 tokens always visible in skill list) → SKILL.md body (<500 lines loaded on trigger) → references/scripts (loaded on-demand via file reads)
2. **Domain Organization**: organize by variant/domain to avoid loading irrelevant context into working memory
3. **Principle of Lack of Surprise**: no malware, no exploits, predictable behavior within declared scope

### From softaworks/skill-judge (Five Structural Patterns + 8D Rubric)

**Structural patterns**:
| Pattern | Lines | Freedom | Use Case |
|---------|-------|---------|----------|
| Mindset | ~50 | High | Creative/design tasks: principles, not steps |
| Navigation | ~30 | Medium-High | Router to sub-files: for multiple distinct scenarios |
| Philosophy | ~150 | High | Art/creation: two-step philosophy → expression |
| Process | ~200 | Medium | Complex multi-step: phased workflow with checkpoints |
| Tool | ~300 | Low | Precise operations: decision trees, code examples |

**Quality dimensions (8D/120pts)**:
- D1: Knowledge Delta (20pts) — expert-only content, not tutorial/beginner material
- D2: Mindset + Procedures (15pts) — thinking patterns + domain-specific workflows
- D3: Anti-Pattern Quality (15pts) — specific NEVER list with WHY for each
- D4: Specification Compliance (15pts) — `description` is THE MOST CRITICAL field (drives discovery)
- D5: Progressive Disclosure (15pts) — proper layering with explicit loading triggers
- D6: Freedom Calibration (15pts) — constraint level matches task fragility
- D7: Pattern Recognition (10pts) — follows one of the 5 established patterns
- D8: Practical Usability (15pts) — decision trees, error handling, edge cases covered

**Decision for hivefiver T0 skill**: Should follow the **Process** pattern (~200 lines, medium freedom) because meta-builder orchestration is a complex multi-step workflow with checkpoints, not a creative task (Mindset) or a precise scripted operation (Tool).

---

## 3. Landscape Inventory (Verified Facts)

### Skills (62 total across all discovery paths)

| Location | Count | Details |
|----------|-------|---------|
| `.opencode/skills/` | 49 dirs (48 with SKILL.md, 1 without) | Primary skill directory |
| `.claude/skills/` | 9 entries (4 are symlinks to `.agents/`) | External project-level |
| `.agents/skills/` | 4 directories | External project-level |

**Categorization from audit**:
- 28 minimal single-file skills (SKILL.md only, no references/)
- 17 rich skills (with scripts/, references/, or multiple files)
- 2 deprecated (marked in SKILL.md)
- 1 stub (directory exists, no SKILL.md)
- 14+ hivefiver-specific skills (names contain "hivefiver" or are clearly meta-builder domain)
- 5 hitea-specific skills (testing domain)
- `gx-context-engine` has active directive-emitting scripts (⚠️ potential false emitter)

### Agents (10 total)

| Agent | Locations | Mode | Discrepancies |
|-------|-----------|------|---------------|
| hiveminder | `.opencode/agents/`, root `agents/` | primary | Line count differs |
| hivefiver | `.opencode/agents/` (181L), `.opencode/agents/hivefiver-reserved.md` (543L), root `agents/` (543L) | primary | 3 copies, recursive_delegation conflict |
| hivemaker | `.opencode/agents/`, root `agents/` | subagent vs all | mode differs between copies |
| hivehealer | `.opencode/agents/`, root `agents/` | subagent | Minor differences |
| hiveplanner | `.opencode/agents/`, root `agents/` | subagent | Minor differences |
| hiveq | `.opencode/agents/`, root `agents/` | subagent | Minor differences |
| hivexplorer | `.opencode/agents/`, root `agents/` | subagent | Minor differences |
| hiverd | `.opencode/agents/`, root `agents/` | subagent | Minor differences |
| hitea | `.opencode/agents/` ONLY | subagent | No root copy |
| (native agents) | Built into engine | various | build, plan, general, explore, compaction, title, summary |

### Commands (79 total)

| Location | Count | Categories |
|----------|-------|-----------|
| `.opencode/commands/` | 44 | 11 hivefiver-stage, 13 hiveminder-utility, 6 hiverd-research, 6 hiveq-verification, 4 hitea-testing, 4 gx-context-engine |
| Root project commands | 35 | Mixed utility |

**Key fact**: ZERO evidence of agent auto-invocation in any session. Agents do NOT auto-invoke commands. Commands are 100% user-initiated (TUI slash command). Once invoked, `subtask: true` commands execute deterministically. Confirmed via platform source analysis + GitHub Issue #2185 (still open).

### Other Assets

| Asset Type | Count | Notes |
|------------|-------|-------|
| Workflows (YAML) | 9 | Target various agents, may trigger hooks |
| Plugins | 1 | hiveops-governance: 885 lines, 5 hooks — primary context poisoner suspect |
| Custom tools | 0 | `.opencode/tool/` directory doesn't exist |
| Archives | 0 | `.opencode/.archive/` doesn't exist yet |

---

## 4. Technical Decisions

| # | Decision | Rationale | Evidence | Phase |
|---|----------|-----------|----------|-------|
| D1 | Skills are T0-only reliable for attention; mid-session governance via agent body + permissions | Skill output is prune-protected but model attention decays. Agent body is system prompt (re-sent every turn). Permissions are machine-enforced | compaction.ts L50-57, agent.ts prompt field, next.ts L236-243 | Architecture (P0) |
| D2 | Team roster goes in agent body, NOT skill | System prompt has highest attention weight, re-sent every turn. An orchestrator that forgets its team is broken | Agent.Info.prompt → system prompt on every turn | Architecture (P0) |
| D3 | Commands are user-initiated chain starters, not autonomous brain | Platform has no auto-invoke mechanism. `subtask: true` is deterministic pre-LLM trigger but requires initial user invocation | GitHub Issue #2185, prompt.ts L1238 subtask condition | Architecture (P0) |
| D4 | Delegation packets carry lineage + artifact_type in prompt text | Child sessions have isolated message history. The `prompt` parameter of TaskTool is the ONLY way to pass context into a child session | task.ts L119-163, session isolation in L66-102 | Architecture (P0) |
| D5 | hiveq validates by artifact type, not generically | Phase-plan validation constitution ≠ atomic-plan constitution. The delegation packet's artifact_type routes to correct rubric | User requirement: "hiveq must validate by artifact type, not generic 'validate this'" | Architecture (P0) |
| D6 | Archive to `.opencode/.archive/` not git-delete | Non-destructive, reversible. Can restore by moving back. Git history preserved either way | User hard rule: "git-atomic, reversible, evidence-based" | Phase 1 |
| D7 | Single canonical hivefiver profile, archive duplicates | 3 copies = identity crisis. One source of truth. Symlinks or CI-sync for any needed mirrors | 3 copies found with conflicting recursive_delegation and line counts | Phase 3 |
| D8 | Decorative frontmatter for LLM-oriented metadata | Engine ignores unknown fields (Zod `.pick().safeParse()`). LLM reads full YAML block. Belt-and-suspenders with machine permissions | ConfigMarkdown.parse() extracts .data and .content separately | Phase 3 |
| D9 | Steps budget starts at 25 for hivefiver | High enough for multi-delegation orchestration, low enough to prevent runaway. Tunable | agent.ts L44-45 schema definition | Phase 3 |
| D10 | hivefiver T0 skill follows Process pattern (~200 lines) | Meta-builder orchestration = complex multi-step with checkpoints. Not creative (Mindset) or scripted (Tool) | softaworks/skill-judge structural patterns | Phase 3 |
| D11 | Shared subagents get `lineage: shared` in decorative frontmatter | Both lineages use same agents. Lineage routing via delegation prompt, not separate agent definitions | User requirement: "shared subagents between the 2 lineages" | Phase 5 |

---

## 5. Issues Encountered & Resolutions

| # | Issue | Attempts | Resolution | Status |
|---|-------|----------|------------|--------|
| I1 | hivexplorer skills audit timed out on first dispatch | 2 | Simplified prompt: list directories only, no content reads. Re-dispatched with targeted ls commands | Resolved |
| I2 | vercel-labs/agent-browser has no skill-creator skill | 1 | Repo contains agent-browser skill, not skill-creator. Used anthropics/skills + softaworks/agent-toolkit instead | Resolved |
| I3 | Commands appear "dead" but user says "100% shot initiator" | 1 | Reconciled: commands ARE valuable when manually initiated — they're deterministic chain starters. Just not auto-invoked by agents autonomously. Platform confirms no auto-invoke mechanism | Resolved |
| I4 | Agent body described as "loaded once at session init" vs "re-sent every turn" | 1 | Clarified: agent body is parsed once into Agent.Info.prompt, but that prompt field is included in the system prompt construction on EVERY LLM turn. It's loaded once from disk, then re-used every turn within the session | Resolved |
| I5 | 3 hivefiver copies: which is canonical? | 0 | Deferred to Phase 3 — requires user input (Question Q1) | Pending |
| I6 | hiveops-governance plugin: 5 hooks unclassified | 0 | Deferred to Phase 2 — requires detailed forensic investigation | Pending |

---

## 6. Source References

| Document | Size | Location | Purpose |
|----------|------|----------|---------|
| PIVOTING-TO-NON-DESTRUCTIVE.md | 14,455 bytes, 251 lines | `/Users/apple/hivemind-plugin/PIVOTING-TO-NON-DESTRUCTIVE.md` | Strategy, use cases, hard constraints, methodology, deliverables |
| OPENCODE-ADVANCED-NON-DESTRUCTIVE-META-BUILD.md | 85,547 bytes, 2,228 lines | `/Users/apple/hivemind-plugin/docs/OPENCODE-ADVANCED-NON-DESTRUCTIVE-META-BUILD.md` | Platform mechanics: 14 sections with source citations to OpenCode codebase |
| skill-creator (anthropics) | Loaded via skill tool | `~/.agents/skills/skill-creator/` | Skill anatomy, 3 progressive disclosure patterns, iterative evaluation |
| skill-judge (softaworks) | Loaded via skill tool | `/Users/apple/hivemind-plugin/.agents/skills/skill-judge/` | 8D/120pt rubric, 5 structural patterns, freedom calibration |
| AGENTS.md | ~5K bytes | `/Users/apple/hivemind-plugin/AGENTS.md` | Current agent registry, architecture essentials, dual-injection system documentation |
| CONTAMINATION-GUARDRAILS.md | Referenced | `/Users/apple/hivemind-plugin/CONTAMINATION-GUARDRAILS.md` | Toxic artifact registry, safe protocols, contamination forensics |

---

## 7. Key Platform Source Files Referenced

| File | Lines Cited | What It Reveals |
|------|-------------|----------------|
| `agent.ts` | L44-45, L56-75, L76-203 | Steps schema, permission defaults, all built-in agent definitions |
| `prompt.ts` | L294-325, L350-526, L556-560, L924-952, L1238, L1260-1283, L1321-1371, L1374-1459, L1733-1791, L1793-1858 | Session loop, subtask execution, steps enforcement, plan mode 5-phase, command parsing |
| `next.ts` | L236-243, L259-281 | Permission evaluation (findLast), error types |
| `task.ts` | L14-25, L44-59, L64-65, L66-102, L119-163 | Task tool parameters, permission bypass, child session creation, output format |
| `compaction.ts` | L30-48, L50-99, L151-178 | Overflow detection, pruning logic, compaction template |
| `skill.ts` | L45-176, L99-120 | Skill discovery hierarchy, skill output format |
| `instruction.ts` | L14-43, L117-142, L168-191 | AGENTS.md discovery, system instructions, sub-directory auto-injection |
| `command.ts` | L44-52, L84-97, L126-138 | Argument hints, config commands, skill-as-command registration |
| `plugin/index.ts` | L24-44, L134-142, L148-234 | Plugin loading, event subscription, complete Hooks interface |
| `registry.ts` | L37-62, L64-86 | Custom tool registration, plugin tool wrapping |
| `bus.ts` | L41-104 | Event publish/subscribe system |
| `discovery.ts` | L39-97 | Remote skill URL discovery |

---

*This document is updated as new findings emerge. Decisions are numbered for traceability across the master plan and progress log.*
