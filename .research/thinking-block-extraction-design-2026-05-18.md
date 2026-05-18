# Thinking Block Extraction & Classification System — Design Contract

> **Ngày:** 2026-05-18
> **Phase:** CP-TB-01 (Thinking Block Ecosystem)
> **Status:** RESEARCH COMPLETE — READY FOR SPEC
> **Evidence:** L2 (SDK source verification) + L3 (session file analysis)
> **Research artifacts:**
> - `.research/opencode-sdk-architecture-2026-05-18.md` (489 lines)
> - `.research/thinking-block-analysis-2026-05-18.md` (492 lines)

---

## 1. Problem Statement

Các LLM models hiện đại (Claude Extended Thinking, Gemini Thinking, OpenAI o-series, DeepSeek-R1, Qwen) đều sinh ra **reasoning/thinking blocks** — nội dung suy luận nội bộ trước khi đưa ra câu trả lời cuối cùng. Trong các phiên làm việc đa agent (L0 orchestrator → L1 coordinator → L2 specialist), các thinking blocks này chứa:

- **Phân tích kiến trúc** và quyết định thiết kế
- **Debug reasoning** và hypothesis testing
- **Delegation planning** và task breakdown
- **Code implementation strategy** và import path analysis
- **Error diagnosis** và root cause investigation

**Vấn đề hiện tại:** Session-tracker của Hivemind **lọc bỏ** thinking blocks (`message-capture.ts:203-204`), chỉ giữ lại `thinkingDuration` metadata. Điều này gây mất mát thông tin quý giá cho:
- Post-mortem investigation
- Cross-session knowledge recovery
- Agent context injection (RAG)
- Delegation quality analysis
- Trajectory reconstruction

---

## 2. OpenCode SDK Architecture — Key Findings

### 2.1 ReasoningPart là First-Class Citizen

```typescript
// message-v2.ts — ReasoningPart schema
export const ReasoningPart = Schema.Struct({
  ...partBase,  // { id, sessionID, messageID }
  type: Schema.Literal("reasoning"),
  text: Schema.String,
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Any)),
  time: Schema.Struct({
    start: NonNegativeInt,
    end: Schema.optional(NonNegativeInt),
  }),
})
```

**Critical properties:**
- `text`: Nội dung reasoning đầy đủ
- `metadata`: Provider-specific data (`anthropic.signature`, `bedrock.signature`)
- `time.start/end`: Timestamps cho duration calculation
- **KHÔNG có** field `synthetic` hoặc `ignored` — reasoning blocks luôn được giữ

### 2.2 Streaming Architecture

Reasoning được stream qua 3 events:
1. `reasoning-start` → Tạo ReasoningPart rỗng với `time.start`
2. `reasoning-delta` → Append text incrementally
3. `reasoning-end` → Set `time.end`, finalize

Plugin có thể capture qua `message.part.updated` hook.

### 2.3 12 Part Types trong SDK

| Part Type | Purpose | Thinking-Related |
|-----------|---------|------------------|
| `TextPart` | Nội dung văn bản | No |
| **`ReasoningPart`** | Thinking/reasoning blocks | **YES — primary target** |
| `ToolPart` | Tool calls với state machine | Context for classification |
| `SubtaskPart` | Delegation to child agent | Hierarchy signal |
| `StepStartPart` | Agentic step boundary | Boundary marker |
| `StepFinishPart` | Step end với token counts | Contains `tokens.reasoning` |
| `FilePart` | Attachments | No |
| `SnapshotPart` | Filesystem snapshot | No |
| `PatchPart` | File changes | Context for code impl |
| `AgentPart` | Agent switch | Agent identity |
| `RetryPart` | API retry | Error context |
| `CompactionPart` | Context compaction | Lifecycle marker |

### 2.4 Session Hierarchy

```typescript
export type Session = {
  id: string
  parentID?: string        // ← Parent-child relationship
  // ...
}

export type SubtaskPart = {
  type: "subtask"
  prompt: string
  agent: string
  model?: { providerID: string; modelID: string }
}
```

Agent modes: `all`, `primary`, `subagent` — xác định vai trò và tool access.

---

## 3. Thinking Block Analysis — Key Findings

### 3.1 Statistical Summary

| Metric | Value |
|--------|-------|
| Total blocks analyzed | 50 (from 5 session files) |
| Average lines/block | 403 |
| Size range | 17 — 3,400 lines |
| Large/Massive (>500 lines) | 44% |
| Embedded tool I/O | 25-45% of content |

### 3.2 Classification Taxonomy (7 Categories)

| Category | % | Description |
|----------|---|-------------|
| **Code Implementation** | 36% | Writing, rewriting, extracting code |
| **Meta/Process** | 26% | Delegation, skill loading, orchestration |
| **Planning/Design** | 16% | Strategy, approach, task breakdown |
| **Research** | 10% | Reading files, searching, verifying APIs |
| **Analysis/Investigation** | 8% | Debugging, tracing, analyzing errors |
| **Verification** | 2% | Running tests, typecheck, validation |
| **Reasoning/Logic** | 2% | Pure logical deduction |

### 3.3 Summary Extraction Patterns

| Signal | Reliability | Usage |
|--------|------------|-------|
| First line | 62% | Quick summary |
| "Let me..." pattern | 76% (within 200 chars) | **Strongest signal** |
| "I need to..." pattern | 67% (followed by numbered lists) | Task breakdown |
| Last pre-tool sentence | 68% | Conclusion extraction |

### 3.4 Session Type Differences

| Characteristic | Orchestrator | Subagent |
|---------------|-------------|----------|
| Thinking block count | Higher (10-16) | Lower (3-7) |
| Avg block size | Larger (299-960 lines) | Smaller (77-512 lines) |
| Delegation calls | Present | Absent |
| Summary sections | Present | Absent |

---

## 4. Proposed Architecture

### 4.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode Plugin (Hivemind)                │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ Thinking     │    │ Classifier   │    │ Storage       │  │
│  │ Capture Hook │───→│ Service      │───→│ Engine        │  │
│  │ (plugin)     │    │ (7-category) │    │ (JSONL + idx) │  │
│  └──────────────┘    └──────────────┘    └───────────────┘  │
│         │                   │                   │           │
│         ▼                   ▼                   ▼           │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ Summary      │    │ Session      │    │ Retrieval     │  │
│  │ Extractor    │    │ Graph Builder│    │ Tools (5)     │  │
│  │ (3-signal)   │    │ (parent-child)│   │ (progressive) │  │
│  └──────────────┘    └──────────────┘    └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Component Breakdown

#### A. Thinking Capture Hook (Plugin)

**Mechanism:** Subscribe to `message.part.updated` event

```typescript
export const ThinkingCapturePlugin = async ({ client, directory }) => {
  return {
    event: async ({ event }) => {
      if (event.type === "message.part.updated") {
        const part = event.properties.part
        if (part.type === "reasoning") {
          // Capture: part.text, part.metadata, part.time
          // Route to ThinkingCaptureService
        }
      }
    },
  }
}
```

**Data captured per block:**
- `part.id`, `part.messageID`, `part.sessionID`
- `part.text` (full reasoning content)
- `part.metadata` (provider signatures)
- `part.time.start`, `part.time.end` (duration)
- `delta` (for streaming capture)

#### B. Classifier Service (7-Category)

**Input:** Raw thinking block text
**Output:** Classification with confidence scores

```typescript
interface Classification {
  primary: "code_implementation" | "meta_process" | "planning_design"
           | "research" | "analysis_investigation" | "verification" | "reasoning_logic"
  confidence: number  // 0-1
  secondary: string[]  // max 2
  signals: {
    letMePattern: boolean
    numberedSteps: boolean
    toolCalls: string[]
    filePaths: string[]
    errorReferences: string[]
  }
}
```

**Classification algorithm:**
1. Strip embedded tool I/O (between `**Tool:**` markers)
2. Extract first 200 chars for pattern matching
3. Check trigger keywords per category
4. Score and rank categories
5. Return primary + secondary with confidence

#### C. Summary Extractor (3-Signal Algorithm)

```
Algorithm: ExtractSummary(thinkingBlockText)
1. Strip embedded tool I/O transcripts
2. Signal A: First 2 sentences after _Thinking:_ marker
3. Signal B: First "Let me [verb] [object]" sentence (within 200 chars)
4. Signal C: Last sentence before first **Tool:** or **Error:** or ---
5. Combine: "[intent from A/B] → [action from B] → [expected outcome from C]"
6. Truncate to 150 chars max
7. Return { summary, confidence, signals_used: ["A", "B", "C"] }
```

**Expected accuracy:** ~80% Small/Medium blocks, ~60% Large/Massive blocks

#### D. Storage Engine (JSONL + Index)

**File structure:**
```
.hivemind/thinking-blocks/
├── {session_id}.jsonl          # One thinking block per line
├── index.jsonl                 # Global index: session_id → metadata
└── summaries/
    └── {session_id}.jsonl      # Pre-computed summaries only
```

**JSONL record schema:**
```json
{
  "id": "ses_1ce7_tb_001",
  "session_id": "ses_1ce7",
  "message_id": "msg_abc123",
  "part_id": "part_xyz789",
  "turn_index": 1,
  "agent_name": "Gsd-Executor",
  "model": "glm-5.1",
  "timestamp": "2026-05-16T22:56:31Z",
  "duration_ms": 11100,
  "summary": "Continue fixing initialization.ts with correct import paths",
  "classification": {
    "primary": "code_implementation",
    "confidence": 0.92,
    "secondary": ["analysis_investigation"]
  },
  "metrics": {
    "line_count": 960,
    "char_count": 44078,
    "code_block_count": 29,
    "tool_call_count": 3,
    "file_ref_count": 12,
    "error_count": 0
  },
  "context": {
    "file_paths": ["src/features/session-tracker/initialization.ts"],
    "tools_invoked": ["read", "bash", "edit"],
    "errors_encountered": []
  },
  "session_hierarchy": {
    "is_subagent": false,
    "agent_mode": "all",
    "parent_session_id": null,
    "delegation_ids": []
  },
  "storage": {
    "reasoning_text_offset": 0,
    "reasoning_text_length": 15234,
    "tool_transcript_offset": 15234,
    "tool_transcript_length": 28844
  }
}
```

#### E. Session Graph Builder

**Purpose:** Link parent-child sessions for hierarchy-aware queries

```typescript
interface SessionNode {
  id: string
  parent_id: string | null
  agent_name: string
  agent_mode: "all" | "primary" | "subagent"
  thinking_block_count: number
  categories: Record<string, number>
  created_at: string
  children: string[]
}
```

Built from:
- `session.parentID` (SDK Session type)
- `SubtaskPart` in message history
- Delegation records from `.hivemind/state/delegations.json`

### 4.3 Progressive Disclosure Levels

| Level | Content | Token Cost | Use Case |
|-------|---------|-----------|----------|
| **L1: Summary** | 1-2 sentence summary + classification | ~50 tokens | Quick scanning, search results |
| **L2: Metadata** | L1 + metrics, file refs, tools | ~200 tokens | Filtering, analytics |
| **L3: Reasoning Only** | L2 + reasoning text (code stripped) | ~500-2000 tokens | Agent context injection, RAG |
| **L4: Full Content** | Complete thinking block with I/O | ~2000-15000 tokens | Deep investigation, debugging |
| **L5: Session Chain** | All blocks + tool I/O + hierarchy | ~10000+ tokens | Session replay, forensics |

**Retrieval API design:**
```typescript
interface ThinkingRetrievalQuery {
  session_id?: string
  category?: string
  date_range?: { from: string; to: string }
  agent_name?: string
  is_subagent?: boolean
  min_confidence?: number
  level: "L1" | "L2" | "L3" | "L4" | "L5"
  limit?: number
  offset?: number
}
```

---

## 5. Tool Design (5 Retrieval Tools)

### 5.1 `thinking-search`

**Purpose:** Search thinking blocks across sessions by category, agent, keyword

**Input:**
```json
{
  "query": "debug initialization",
  "category": "analysis_investigation",
  "session_id": "ses_1ce7",
  "level": "L1",
  "limit": 10
}
```

**Output:** Array of thinking block summaries with metadata

### 5.2 `thinking-get`

**Purpose:** Get a specific thinking block by ID at requested disclosure level

**Input:**
```json
{
  "id": "ses_1ce7_tb_003",
  "level": "L3"
}
```

**Output:** Single thinking block with reasoning text (code stripped)

### 5.3 `thinking-session-chain`

**Purpose:** Get all thinking blocks from a session chain (parent + children)

**Input:**
```json
{
  "session_id": "ses_1ce7",
  "level": "L2",
  "include_children": true
}
```

**Output:** Session graph with thinking blocks per node

### 5.4 `thinking-classify`

**Purpose:** Classify a raw thinking block text (for batch processing)

**Input:**
```json
{
  "text": "...",
  "session_context": {
    "agent_name": "hm-l2-debugger",
    "is_subagent": true
  }
}
```

**Output:** Classification with confidence scores

### 5.5 `thinking-summary`

**Purpose:** Extract summary from a thinking block

**Input:**
```json
{
  "text": "...",
  "category": "code_implementation"
}
```

**Output:** `{ summary, confidence, signals_used }`

---

## 6. Integration with Existing Hivemind Components

### 6.1 Session-Tracker Integration

**Current state:** `message-capture.ts` filters out thinking blocks

**Proposed change:**
```typescript
// BEFORE (current):
const nonThinkingParts = parts.filter(p => p.type !== "thinking")

// AFTER (proposed):
const thinkingParts = parts.filter(p => p.type === "thinking")
const nonThinkingParts = parts.filter(p => p.type !== "thinking")

// Capture thinking blocks separately
if (thinkingParts.length > 0) {
  await this.thinkingCaptureService.capture(
    input.sessionID,
    input.messageID,
    thinkingParts,
    input.agent,
    input.model,
  )
}
```

**New dependency:** `ThinkingCaptureService` injected into `MessageCapture`

### 6.2 Delegation Integration

**Link thinking blocks to delegation records:**

```typescript
// When delegate-task is called, record the thinking block that preceded it
interface DelegationThinkingLink {
  delegation_id: string
  thinking_block_id: string  // The thinking block that planned this delegation
  child_session_id: string
}
```

Stored in `.hivemind/state/delegation-thinking-links.json`

### 6.3 Trajectory Integration

**Extend trajectory with thinking block references:**

```typescript
// Current trajectory entry
interface TrajectoryEntry {
  // ... existing fields
  thinking_block_ids: string[]  // References to thinking blocks in this turn
}
```

This enables trajectory replay with full reasoning context.

### 6.4 Agent-Work-Contract Integration

**Include thinking block evidence in contracts:**

```typescript
interface AgentWorkContract {
  // ... existing fields
  reasoning_evidence: {
    planning_thinking_id: string    // Thinking block that planned this work
    execution_thinking_ids: string[] // Thinking blocks during execution
    review_thinking_id: string      // Thinking block that reviewed results
  }
}
```

---

## 7. Implementation Phases

### Phase 1: Capture Hook (CP-TB-01.1)
- Create `ThinkingCapturePlugin` in `.opencode/plugins/`
- Subscribe to `message.part.updated` event
- Write raw thinking blocks to `.hivemind/thinking-blocks/{session_id}.jsonl`
- **Deliverable:** Plugin that captures thinking blocks in real-time

### Phase 2: Classifier + Summary Extractor (CP-TB-01.2)
- Implement `ClassifierService` with 7-category taxonomy
- Implement `SummaryExtractor` with 3-signal algorithm
- Add classification and summary to JSONL records
- **Deliverable:** Classified and summarized thinking blocks

### Phase 3: Session Graph Builder (CP-TB-01.3)
- Build session graph from SDK `session.children()` and delegation records
- Link thinking blocks to session hierarchy
- Create `index.jsonl` for fast lookup
- **Deliverable:** Hierarchy-aware thinking block index

### Phase 4: Retrieval Tools (CP-TB-01.4)
- Implement 5 retrieval tools (`thinking-search`, `thinking-get`, etc.)
- Support progressive disclosure levels (L1-L5)
- Add Zod schemas for input validation
- **Deliverable:** 5 new Hivemind tools

### Phase 5: Integration (CP-TB-01.5)
- Modify `MessageCapture` to route thinking blocks to capture service
- Link thinking blocks to delegation records
- Extend trajectory entries with thinking block references
- **Deliverable:** Fully integrated thinking block ecosystem

---

## 8. Constraints & Guardrails

### 8.1 What This System Does NOT Do

| Boundary | Reason |
|----------|--------|
| **Does NOT modify reasoning text** | Breaks Anthropic/Bedrock signatures (issues #16748, #18078) |
| **Does NOT store in `.opencode/`** | `.hivemind/` is canonical state root (Q6 decision) |
| **Does NOT replace session-tracker** | Complements existing capture; thinking is additional surface |
| **Does NOT require LLM for classification** | Rule-based keyword + pattern matching (fast, deterministic) |
| **Does NOT expose thinking to other agents** | Thinking blocks are read-only; no agent can modify another's thinking |

### 8.2 Provider-Specific Handling

| Provider | Special Handling |
|----------|-----------------|
| **Anthropic** | Preserve `metadata.anthropic.signature` — DO NOT trim text |
| **Bedrock** | Same as Anthropic — `trimEnd()` invalidates signatures |
| **OpenAI** | `reasoningSummary: "auto"` may provide encrypted content |
| **DeepSeek** | May have empty reasoning blocks — handle gracefully |
| **Qwen** | Watch for infinite repetition loops (issue #25129) |

### 8.3 Performance Constraints

| Constraint | Limit | Rationale |
|-----------|-------|-----------|
| Module size | <500 LOC | Architecture convention |
| Ingestion latency | <100ms per block | Must not block hook pipeline |
| Index rebuild time | <5s for 1000 blocks | Fast recovery on restart |
| Query response time | <500ms for L1/L2 | Interactive use |

---

## 9. Evidence Index

| Claim | Source | Level |
|-------|--------|-------|
| ReasoningPart schema | `message-v2.ts` (GitHub) | L2 |
| 12 Part types | `types.gen.ts` (GitHub) | L2 |
| 3-event streaming | `processor.ts` (GitHub) | L2 |
| Plugin hooks list | opencode.ai/docs/plugins/ | L3 |
| 50 blocks analyzed | 5 session files (local) | L2 |
| 7-category taxonomy | Analysis of 50 blocks | L3 |
| Summary extraction patterns | Pattern analysis (local) | L3 |
| Session hierarchy signals | SubtaskPart + delegation records | L2 |
| Signature preservation issues | GitHub #16748, #18078 | L3 |

---

## 10. Next Steps

1. **Review this design contract** — Confirm scope and architecture
2. **Write SPEC.md** — Convert to falsifiable requirements with acceptance criteria
3. **Create PLAN.md** — Task breakdown with dependencies and verification commands
4. **Implement Phase 1** — Start with capture hook (lowest risk, highest value)

---

*Design contract synthesized from L2 SDK source verification + L3 session file analysis. All claims traced to evidence. Ready for spec-locking.*
