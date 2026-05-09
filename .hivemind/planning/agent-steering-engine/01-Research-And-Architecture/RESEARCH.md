---
feature: agent-steering-engine
phase: 01-Research-And-Architecture
artifact: RESEARCH
created: 2026-05-09
validation: online-multi-source
sdk-version: "@opencode-ai/plugin@^1.14.41"
---

# Agent Steering Engine — Phase 01 Research

> All findings validated against online sources. Local code used only for
> understanding current harness patterns. No stack-* skill references
> used as source of truth for SDK interfaces.

---

## 1. OpenCode Plugin SDK Hook APIs

### 1.1 Hook: experimental.chat.messages.transform

**Signature (online validated):**
```typescript
"experimental.chat.messages.transform"?: (
  input: {},
  output: {
    messages: {
      info: Message;
      parts: Part[];
    }[];
  },
) => Promise<void>
```

**Capabilities:**
- Transform the entire message history before sending to LLM
- Filter, reorder, merge, or modify messages
- This is the PRIMARY injection surface for the steering engine

**Registration pattern:**
```typescript
export const Plugin: Plugin = async (ctx) => {
  return {
    "experimental.chat.messages.transform": async (input, output) => {
      // Mutate output.messages in place
    },
  }
}
```

**Sources:** opencodebook.xyz/chapter_13, mintlify.com/anomalyco/opencode, DeepWiki anomalyco/opencode, GitHub anomalyco/opencode/issues/19960

**Known issues:** Fires in `prompt.ts`. Currently fires BEFORE `system.transform` (which fires in `llm.ts`).

---

### 1.2 Hook: experimental.session.compacting

**Signature (online validated):**
```typescript
"experimental.session.compacting"?: (
  input: { sessionID: string },
  output: { context: string[]; prompt?: string },
) => Promise<void>
```

**Capabilities:**
- Push strings into `output.context` array — included in compaction prompt
- Set `output.prompt` to a string — completely REPLACES default compaction prompt
- When `output.prompt` is set, `output.context` is ignored

**Registration pattern:**
```typescript
"experimental.session.compacting": async (input, output) => {
  output.context.push("## Critical State\n- Role: ...")
}
```

**Sources:** opencode.ai/docs/plugins/, opencodebook.xyz, DeepWiki anomalyco/opencode, Context7 /anomalyco/opencode

---

### 1.3 Hook: experimental.chat.system.transform

**Signature (online validated):**
```typescript
"experimental.chat.system.transform"?: (
  input: { sessionID?: string; model: Model },
  output: {
    system: string[];
  },
) => Promise<void>
```

**Capabilities:**
- Modify the list of system prompt segments
- Add, remove, or replace system prompt paragraphs via `output.system` array

**Known issue:** Currently fires AFTER `messages.transform` (tracked in GitHub issue #19960, proposed fix PR #19961). This means plugins cannot coordinate system+message mutations atomically in current SDK version.

**Sources:** opencodebook.xyz, GitHub anomalyco/opencode/issues/17637, GitHub anomalyco/opencode/issues/19960

---

### 1.4 Hook Pattern Summary

All hooks follow the same `(input, output) => Promise<void>` pattern. Plugin mutates `output` in place. No return value.

| Hook | Input | Output | Primary Use |
|------|-------|--------|-------------|
| messages.transform | `{}` | `{ messages: {info, parts}[] }` | Conditional steering injection |
| session.compacting | `{ sessionID }` | `{ context: string[], prompt?: string }` | Post-compact role recovery |
| system.transform | `{ sessionID?, model }` | `{ system: string[] }` | Persistent role marker |

---

## 2. Primitive Discovery Mechanism

### 2.1 How OpenCode Discovers Primitives

| Primitive | Discovery Directories | File Pattern |
|-----------|----------------------|--------------|
| **Agents** | `.opencode/agent/`, `.opencode/agents/`, `~/.config/opencode/agents/` | `*.md` (YAML frontmatter) |
| **Skills** | `.opencode/skills/<name>/SKILL.md`, `~/.config/opencode/skills/` | `SKILL.md` in subdirectories |
| **Commands** | `.opencode/commands/`, `~/.config/opencode/commands/` | `*.md` (YAML frontmatter) |

### 2.2 Loading Mechanism

- `Config.state()` in `packages/opencode/src/config/config.ts` orchestrates discovery
- `ConfigAgent.load(dir)` scans agent directories, parses YAML frontmatter + Markdown body
- Agent filename (minus `.md`) becomes the agent's name
- Markdown body becomes the agent's prompt
- Frontmatter fields are merged into config
- Skills walk up directory tree from CWD to git worktree root
- Both singular and plural directory names are supported (agents/ and agent/)

**Sources:** DeepWiki anomalyco/opencode, zread.ai/anomalyco/opencode/19-configuration-system, zread.ai/anomalyco/opencode/3-built-in-agents

---

## 3. YAML Frontmatter Schemas

### 3.1 Agent Frontmatter

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | Recommended | Agent description |
| `mode` | string | Optional | Agent mode (e.g., `"subagent"`) |
| `model` | string | Optional | Model override |
| `temperature` | number | Optional | Temperature setting |
| `tools` | object | Optional | Tool permissions |

*Note: Filename (without `.md`) becomes the agent's name.*

### 3.2 Skill Frontmatter

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | **Required** | 1-64 chars, lowercase alphanumeric, single hyphens, must match directory name |
| `description` | string | **Required** | 1-1024 chars |
| `license` | string | Optional | — |
| `compatibility` | string | Optional | — |
| `metadata` | object | Optional | — |

### 3.3 Command Frontmatter

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `template` | string | In JSON config | Prompt template (supports `$ARGUMENTS`) |
| `description` | string | Recommended | Command description |
| `agent` | string | Optional | Which agent to use |
| `model` | string | Optional | Model override |

*Commands can also be defined inline in `opencode.json` under `"command"` key.*

**Sources:** DeepWiki anomalyco/opencode, opencode.ai/docs/config/, zread.ai/anomalyco/opencode/3-built-in-agents

---

## 4. Token Budget Landscape

### 4.1 Model Context Windows (2025-2026, Online Validated)

| Model | Advertised | Effective Reliable | Source |
|-------|-----------|-------------------|--------|
| Claude Opus 4.6 | 1M tokens | ~200-400K | anthropic.com |
| Claude Sonnet 4.5 | 200K tokens | ~130K | platform.claude.com |
| GPT-4.1 | 1,047,576 tokens | ~200K | openai.com |
| GPT-4o | 128K tokens | ~80-100K | openai.com |
| Gemini 2.5 Pro | 1M tokens | Best-in-class | blog.google |

### 4.2 Critical Finding: Effective Context ≠ Advertised

- Models reliably use only **50-65%** of advertised context (NVIDIA RULER benchmark)
- **Constraint degradation at ~15 tool calls** for Claude agents
- **35-minute wall**: Agent success rate decreases non-linearly after 35 min equivalent task time
- **Lost-in-the-middle**: 20-50% accuracy drop for information in middle of long context
- **Context dilution**: Even with perfect retrieval, performance degrades 13.9-85% as input length increases

**Sources:** morphllm.com/context-rot, codeongrass.com, indiehackers.com, atlan.com, diffray.ai

### 4.3 Current Harness Injection (Per Turn)

| Block | Est. Tokens | Source |
|-------|------------|--------|
| Governance block | ~80-120 | core-hooks.ts:79-85 |
| Intake context | ~40-80 | core-hooks.ts:87-107 |
| Behavioral profile | ~60-100 | core-hooks.ts:109-133 |
| **Per-turn total** | **~180-300** | — |
| Compaction context | ~660-1,400 | session-hooks.ts:222-338 |

### 4.4 Proposed Injection Impact

| Injection Type | Est. Tokens | % of 200K | % of 130K effective |
|---------------|------------|-----------|-------------------|
| Role marker (REQ-04) | ~20-40 | <0.02% | <0.03% |
| Conditional reminder (REQ-02) | ~50-100 | <0.05% | <0.08% |
| Full context packet (REQ-03) | ~300-600 | <0.3% | <0.5% |

---

## 5. Agent Steering Best Practices

### 5.1 Framework Comparison

| Framework | Role Persistence | Re-injection Cadence |
|-----------|-----------------|---------------------|
| **CrewAI** | Role-Goal-Backstory in every system prompt | Per-task (role re-sent every turn) |
| **LangGraph** | Explicit StateGraph, per-node context fetch | Per-node (most surgical approach) |
| **OpenAI Agents SDK** | `instructions` parameter, supports `dynamic_instructions` | Per-invocation |
| **AutoGen** | System message in conversation loop | Per-turn via chat history |

### 5.2 Evidence-Based Recommendations

1. **Mid-conversation `<system_reminder>` pattern** — Claude Code production technique for refreshing rules mid-session
2. **Keep system prompt lean (<6K tokens total)** — Budget: identity 200-500, core workflow 500-2K, reminders 100-300
3. **Inject every ~10-15 tool calls or ~50K tokens** — Constraint degradation measurable at ~15 tool calls
4. **Per-node context engineering (LangGraph model)** — Most token-efficient approach
5. **U-shaped attention placement** — Place critical rules at BOTH ENDS of injection blocks (72-75% accuracy vs 45-55% in middle)
6. **Infrastructure enforcement for critical constraints** — Do NOT rely solely on model instructions for safety-critical constraints

**Sources:** indiehackers.com (Claude Code reverse engineering), langchain.com/blog/context-engineering, morphllm.com, codeongrass.com

---

## 6. Open Questions Resolution

| ID | Question | Status | Answer |
|----|----------|--------|--------|
| O1 | Optimal injection cadence? | PARTIALLY RESOLVED | Every 10-15 tool calls or ~50K tokens, evidence-based |
| O2 | Schema versioning? | UNRESOLVED | Design decision for Phase 02 |
| O3 | Drift detection without false positives? | PARTIALLY RESOLVED | Infrastructure enforcement > model instructions; pattern matching has high false-positive risk |
| O4 | Primitive schema format? | RESOLVED | YAML frontmatter from `.md` files — standard OpenCode mechanism |
| O5 | Third-party plugin primitives? | DEFERRED | Post-MVP per REQ-14 |

---

## 7. Knowledge Gaps (for Phase 02+)

1. **Exact `Model` type definition** — `input.model` in system.transform typed as `Model` but full interface not extracted
2. **Command `.md` file required frontmatter** — Only JSON config schema confirmed; `.md` command file schema unclear
3. **Hook execution order after fix** — Issue #19960 proposes reordering but fix status unknown
4. **Model-specific degradation curves** — "15 tool call" observation is Claude-specific; GPT/Gemini curves not publicly documented
5. **No published research on optimal cadence for AI coding agents specifically**

---

## 8. Source Index

| # | Source | Type | What It Validated |
|---|--------|------|-------------------|
| S1 | opencode.ai/docs/plugins/ | Official | Compaction hook, plugin structure |
| S2 | opencode.ai/docs/sdk/ | Official | SDK API surface (no token counting) |
| S3 | opencode.ai/docs/config/ | Official | Compaction config, command schema |
| S4 | opencodebook.xyz/chapter_13 | Community | EXACT hook signatures (all 3) |
| S5 | mintlify.com/anomalyco/opencode | Docs mirror | Plugin API examples |
| S6 | GitHub anomalyco/opencode/issues/19960 | Primary | Hook firing order issue |
| S7 | GitHub anomalyco/opencode/issues/17637 | Primary | system.transform input fields |
| S8 | DeepWiki anomalyco/opencode | AI wiki | All signatures, discovery, token internals |
| S9 | Context7 /anomalyco/opencode | Code search | Plugin source examples |
| S10 | anthropic.com, openai.com, blog.google | Official | Model context window specs |
| S11 | morphllm.com, codeongrass.com, indiehackers.com | Research | Degradation curves, best practices |
| S12 | langchain.com/blog/context-engineering | Framework | Per-node context engineering |
