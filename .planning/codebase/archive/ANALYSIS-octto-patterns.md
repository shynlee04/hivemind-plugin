# Octto Codebase Analysis - Agent-Work-Contract Integration

**Analysis Date:** 2026-03-20
**Source:** octto.xml (outputId: 721cd38982f99b2a)

---

## Executive Summary

Octto is an OpenCode plugin implementing **branch-based brainstorming** with interactive Q&A through a browser UI. It uses a multi-agent architecture with WebSocket-based session management and persistent state files for cross-agent coordination.

---

## 1. Session Store Pattern

### Architecture Overview

Octto uses a **dual-store pattern**:

1. **SessionStore** (`src/session/sessions.ts`) - Ephemeral WebSocket session management
2. **StateStore** (`src/state/store.ts`) - Persistent brainstorm state

### SessionStore: WebSocket-Based Interactive Q&A

```typescript
// src/session/sessions.ts
export interface SessionStore {
  startSession: (input: StartSessionInput) => Promise<StartSessionOutput>;
  endSession: (sessionId: string) => Promise<EndSessionOutput>;
  pushQuestion: (sessionId: string, type: QuestionType, config: BaseConfig) => PushQuestionOutput;
  getNextAnswer: (input: GetNextAnswerInput) => Promise<GetNextAnswerOutput>;
  cancelQuestion: (questionId: string) => { ok: boolean };
  listQuestions: (sessionId?: string) => ListQuestionsOutput;
  handleWsConnect: (sessionId: string, ws: ServerWebSocket<unknown>) => void;
  handleWsDisconnect: (sessionId: string) => void;
  handleWsMessage: (sessionId: string, message: WsClientMessage) => void;
  getSession: (sessionId: string) => Session | undefined;
}
```

**Key Patterns:**

1. **Map-Based State** - Sessions stored in-memory with O(1) lookup:
```typescript
// Internal state
readonly sessions: Map<string, Session>;
readonly questionToSession: Map<string, string>;  // Reverse index for answers
```

2. **Waiter Pattern** - Promise-based blocking for async answers:
```typescript
// src/session/waiter.ts
export interface Waiters<K, T> {
  register: (key: K, callback: (result: T) => void) => () => void;
  notifyFirst: (key: K, result: T) => boolean;
  notifyAll: (key: K, result: T) => void;
  clear: (key: K) => void;
}

// Usage in sessions.ts
readonly sessionWaiters: ReturnType<typeof createWaiters<string, { questionId: string; response: Answer }>>
```

3. **WebSocket Lifecycle Management**:
```typescript
function handleWsConnect(state: StoreState, sessionId: string, ws: ServerWebSocket<unknown>): void {
  const session = state.sessions.get(sessionId);
  if (!session) return;
  
  session.wsConnected = true;
  session.wsClient = ws;
  
  // Send pending questions to new connection
  for (const question of session.questions.values()) {
    if (question.status === STATUSES.PENDING) {
      // Resend question via WebSocket
    }
  }
}
```

### StateStore: Persistent Brainstorm State

```typescript
// src/state/store.ts
export interface StateStore {
  createSession: (sessionId: string, request: string, branches: CreateBranchInput[]) => Promise<BrainstormState>;
  getSession: (sessionId: string) => Promise<BrainstormState | null>;
  setBrowserSessionId: (sessionId: string, browserSessionId: string) => Promise<void>;
  addQuestionToBranch: (sessionId: string, branchId: string, question: BranchQuestion) => Promise<BranchQuestion>;
  recordAnswer: (sessionId: string, questionId: string, answer: Answer) => Promise<void>;
  completeBranch: (sessionId: string, branchId: string, finding: string) => Promise<void>;
  getNextExploringBranch: (sessionId: string) => Promise<Branch | null>;
  isSessionComplete: (sessionId: string) => Promise<boolean>;
  deleteSession: (sessionId: string) => Promise<void>;
}
```

**Concurrency Pattern - Session-Level Locking:**
```typescript
type SessionLock = <T>(sessionId: string, operation: () => Promise<T>) => Promise<T>;

function createSessionLock(): SessionLock {
  const operationQueues = new Map<string, Promise<unknown>>();
  
  return <T>(sessionId: string, operation: () => Promise<T>): Promise<T> => {
    const currentQueue = operationQueues.get(sessionId) ?? Promise.resolve();
    const newQueue = currentQueue.then(operation, operation);
    operationQueues.set(sessionId, newQueue);
    return newQueue as Promise<T>;
  };
}

// Usage - serializes all operations per session
async function addQuestionToBranch(persistence, lock, sessionId, branchId, question) {
  return lock(sessionId, async () => {
    const state = await loadSessionOrThrow(persistence, sessionId);
    if (!state.branches[branchId]) throw new Error(`Branch not found: ${branchId}`);
    state.branches[branchId].questions.push(question);
    await persistence.save(state);
    return question;
  });
}
```

### Question Lifecycle

```
1. pushQuestion() → status: PENDING
2. WebSocket sends to browser
3. User answers → WebSocket receives
4. handleWsMessage() → status: ANSWERED, answer stored
5. sessionWaiters.notifyFirst() → Promise resolves
6. Agent receives answer
```

---

## 2. Branch-Based Exploration Pattern

### Data Model

```typescript
// src/state/types.ts
export interface BrainstormState {
  readonly session_id: string;
  browser_session_id: string | null;
  readonly request: string;
  readonly created_at: number;
  updated_at: number;
  branches: Record<string, Branch>;      // Branch ID → Branch
  readonly branch_order: string[];        // Ordered list of branch IDs
}

export interface Branch {
  readonly id: string;
  readonly scope: string;                 // What this branch explores
  status: BranchStatus;                   // 'exploring' | 'done'
  questions: BranchQuestion[];
  finding: string | null;                 // Synthesized conclusion
}

export interface BranchQuestion {
  readonly id: string;
  readonly type: QuestionType;            // 'pick_one' | 'ask_text' | etc.
  readonly text: string;
  readonly config: BaseConfig;
  answer?: Answer;                        // Undefined until answered
  answeredAt?: number;
}
```

### Parallel Branch Execution

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Request                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │     bootstrapper subagent      │
              │  Creates 2-4 exploration      │
              │        branches               │
              └───────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │   Branch 1   │ │   Branch 2   │ │   Branch 3   │
     │  "services"  │ │   "format"   │ │  "security"  │
     │   EXPLORING  │ │   EXPLORING  │ │   EXPLORING  │
     └──────────────┘ └──────────────┘ └──────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │   probe gets │ │   probe gets │ │   probe gets │
     │  Q&A history  │ │  Q&A history  │ │  Q&A history  │
     │  asks more or │ │  asks more or │ │  asks more or │
     │   completes   │ │   completes   │ │   completes   │
     └──────────────┘ └──────────────┘ └──────────────┘
            │                 │                 │
            ▼                 ▼                 ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │    DONE      │ │    DONE      │ │    DONE      │
     │  finding:... │ │  finding:... │ │  finding:... │
     └──────────────┘ └──────────────┘ └──────────────┘
                              │
                              ▼
                   ┌──────────────────┐
                   │ Final synthesis │
                   │   design.md      │
                   └──────────────────┘
```

### Branch State Machine

```typescript
// Branch lifecycle
EXPLORING → (probe returns done=true) → DONE
EXPLORING → (probe returns question) → EXPLORING (with more questions)

// getNextExploringBranch returns first non-DONE branch
async function getNextExploringBranch(persistence, sessionId): Promise<Branch | null> {
  const state = await persistence.load(sessionId);
  if (!state) return null;
  
  for (const branchId of state.branch_order) {
    const branch = state.branches[branchId];
    if (branch.status === BRANCH_STATUSES.EXPLORING) {
      return branch;
    }
  }
  return null;
}

// isSessionComplete returns true when all branches done
async function isSessionComplete(persistence, sessionId): Promise<boolean> {
  const state = await persistence.load(sessionId);
  if (!state) return true;
  return Object.values(state.branches).every(b => b.status === BRANCH_STATUSES.DONE);
}
```

---

## 3. Probe/Bootstrapper/Orchestrator Agent Pattern

### Agent Registry

```typescript
// src/agents/index.ts
export const AGENTS = {
  octto: "octto",           // Primary orchestrator
  bootstrapper: "bootstrapper", // Fast subagent
  probe: "probe",           // Thoughtful subagent
} as const;

export const agents: Record<AgentName, AgentConfig> = {
  [AGENTS.octto]: octto,
  [AGENTS.bootstrapper]: bootstrapper,
  [AGENTS.probe]: probe,
};
```

### Agent Responsibilities

| Agent | Mode | Purpose | Output |
|-------|------|---------|--------|
| **octto (Orchestrator)** | `primary` | Coordinates entire flow, manages session | Final design document |
| **bootstrapper** | `subagent` | Decomposes request into branches | JSON with 2-4 branches + initial questions |
| **probe** | `subagent** | Evaluates Q&A, decides more or done | JSON with `{done, finding?, question?}` |

### Orchestrator (octto.ts) Workflow

```typescript
// Defined in agent prompt
<purpose>
Run brainstorming sessions using branch-based exploration.
Each branch explores one aspect of the design within its scope.
</purpose>

<workflow>
<step number="1" name="bootstrap">
Call bootstrapper subagent to create branches:
background_task(agent="bootstrapper", prompt="Create branches for: {request}")
Parse the JSON response to get branches array.
</step>

<step number="2" name="create-session">
Create brainstorm session with the branches:
create_brainstorm(request="{request}", branches=[...parsed branches...])
Save the session_id and browser_session_id from the response.
</step>

<step number="3" name="await-completion">
Wait for brainstorm to complete (handles everything automatically):
await_brainstorm_complete(session_id, browser_session_id)
This processes all answers asynchronously and returns when all branches are done.
</step>

<step number="4" name="finalize">
End the session and write design document:
end_brainstorm(session_id)
Write to docs/plans/YYYY-MM-DD-{topic}-design.md
</step>
</workflow>
```

### Bootstrapper Agent Pattern

**Role:** Fast decomposition with structured output

```typescript
// src/agents/bootstrapper.ts
export const agent: AgentConfig = {
  description: "Analyzes a request and creates exploration branches with scopes",
  mode: "subagent",
  model: "openai/gpt-5.2-codex",
  temperature: 0.5,
  prompt: `<purpose>
Analyze the user's request and create 2-4 exploration branches.
Each branch explores ONE specific aspect of the design.
</purpose>

<output-format>
Return ONLY a JSON object. No markdown, no explanation.

{
  "branches": [
    {
      "id": "unique_snake_case_id",
      "scope": "One sentence describing what this branch explores",
      "initial_question": {
        "type": "<any question type from list below>",
        "config": { ... }
      }
    }
  ]
}
</output-format>

<branch-guidelines>
<guideline>Each branch explores ONE distinct aspect (not overlapping)</guideline>
<guideline>Scope is a clear boundary - questions stay within scope</guideline>
<guideline>2-4 branches total - don't over-decompose</guideline>
</branch-guidelines>`
};
```

### Probe Agent Pattern

**Role:** Evaluate Q&A and decide continuation

```typescript
// src/agents/probe.ts
export const agent: AgentConfig = {
  description: "Evaluates branch Q&A and decides whether to ask more or complete",
  mode: "subagent",
  model: "openai/gpt-5.2-codex",
  temperature: 0.5,
  prompt: `<purpose>
You evaluate a brainstorming branch's Q&A history and decide:
1. Need more information? Return a follow-up question
2. Have enough? Return a finding that synthesizes the user's preferences
</purpose>

<context>
You receive:
- The original user request
- All branches with their scopes (to understand the full picture)
- The Q&A history for the branch you're evaluating
</context>

<output-format>
Return ONLY a JSON object. No markdown, no explanation.

If MORE information needed:
{
  "done": false,
  "question": {
    "type": "pick_one|pick_many|...",
    "config": { ... }
  }
}

If ENOUGH information gathered:
{
  "done": true,
  "finding": "Clear summary of what the user wants for this aspect"
}
</output-format>`
};
```

### Probe Result Processing

```typescript
// src/tools/processor.ts
export function parseProbeResponse(parts: { type: string; [key: string]: unknown }[]): ProbeResult {
  const responseText = parts
    .filter((part): part is typeof part & { text: string } => 
      part.type === 'text' && typeof part.text === 'string')
    .map(part => part.text)
    .join('');
  
  // Extract JSON from response
  const jsonMatch = responseText.match(/{[\s\S]*}/);
  if (!jsonMatch) {
    return { done: true, finding: "Could not parse probe response" };
  }
  
  const parsed = v.safeParse(ProbeResultSchema, JSON.parse(jsonMatch[0]));
  if (!parsed.success) {
    return { done: true, finding: "Could not validate probe response" };
  }
  
  return parsed.output;
}
```

---

## 4. Interactive Q&A Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OpenCode Plugin Entry                           │
│                          (src/index.ts)                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Main Orchestrator Flow                          │
│  1. bootstrapper → JSON branches[]                                      │
│  2. create_brainstorm(request, branches)                                │
│     ├─> StateStore.createSession(sessionId, request, branches)          │
│     ├─> SessionStore.startSession() → browser UI opens                 │
│     └─> Returns: { session_id, browser_session_id, url }                │
│  3. await_brainstorm_complete(session_id, browser_session_id)           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Answer Processing Loop                               │
│   while (!isSessionComplete(sessionId)) {                               │
│     answer = await sessions.getNextAnswer({                            │
│       session_id: browserSessionId,                                    │
│       block: true,                                                      │
│       timeout: timeoutMs                                                │
│     });                                                                 │
│                                                                         │
│     [answer received from WebSocket]                                   │
│                                     │                                   │
│                                     ▼                                   │
│     processAnswer(stateStore, sessions, sessionId,                     │
│                   browserSessionId, questionId, response, client)       │
│                                     │                                   │
│                                     ▼                                   │
│     branch = getNextExploringBranch(sessionId)                          │
│     probe = runProbeAgent(client, state, branchId)                     │
│                                     │                                   │
│                         ┌─────────────┴─────────────┐                   │
│                         ▼                           ▼                   │
│               probe.done = true            probe.done = false           │
│               completeBranch()            pushQuestion()                │
│               (state → DONE)              (state → still EXPLORING)     │
│   }                                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### WebSocket Message Protocol

```typescript
// Server → Client
type WsServerMessage = 
  | { type: "question"; id: string; questionType: QuestionType; config: BaseConfig }
  | { type: "cancel"; id: string }
  | { type: "end" };

// Client → Server
type WsClientMessage = 
  | { type: "response"; id: string; answer: Answer }
  | { type: "connected" };
```

### Question State Machine

```typescript
// src/session/types.ts
export const STATUSES = {
  PENDING: "pending",
  ANSWERED: "answered",
  CANCELLED: "cancelled",
  TIMEOUT: "timeout",
  NONE_PENDING: "none_pending",  // No questions, session complete
} as const;

export interface Question {
  readonly id: string;
  readonly type: QuestionType;
  config: BaseConfig;
  status: QuestionStatus;
  response?: Answer;
  createdAt: Date;
  answeredAt?: Date;
  retrieved?: boolean;  // Has agent fetched this answer?
}
```

### getRequest Next Answer Blocking Pattern

```typescript
// src/session/sessions.ts
async function waitForNextAnswer(
  state: StoreState, 
  session: Session, 
  input: GetNextAnswerInput
): Promise<GetNextAnswerOutput> {
  // Check for already-answered, not-yet-retrieved questions
  const unretrieved = findUnretrievedAnswer(session);
  if (unretrieved) return unretrieved;
  
  // Check if all pending (nothing to wait for)
  const hasPending = Array.from(session.questions.values())
    .some((q) => q.status === STATUSES.PENDING);
  if (!hasPending) {
    return { completed: false, status: STATUSES.NONE_PENDING };
  }
  
  // Block until an answer arrives
  return new Promise((resolve) => {
    const cleanup = state.sessionWaiters.register(input.session_id, ({ questionId, response }) => {
      const question = session.questions.get(questionId);
      if (question) question.retrieved = true;
      resolve({
        completed: true,
        status: STATUSES.ANSWERED,
        question_id: questionId,
        question_type: question?.type,
        response,
      });
    });
    
    if (input.timeout) {
      setTimeout(() => {
        cleanup();
        resolve({ completed: false, status: STATUSES.TIMEOUT });
      }, input.timeout as number);
    }
  });
}
```

---

## 5. Key Patterns Transferable to Agent-Work-Contract

### Pattern 1: Dual Store Architecture

**Transfer:** Separate WebSocket session management from persistent work state.

```typescript
// For agent-work-contract
interface AgentWorkSessionStore {
  // Ephemeral WebSocket/real-time connections
  startSession(input: { title: string; questions?: InitialQuestion[] }): Promise<{ session_id; url }>;
  pushQuestion(sessionId: string, type: QType, config: unknown): { question_id: string };
  getNextAnswer(sessionId: string, options: { block: boolean; timeout?: number }): Promise<AnswerResult>;
  endSession(sessionId: string): Promise<void>;
}

interface AgentWorkStateStore {
  // Persistent workflow state
  createWorkflow(sessionId: string, request: string, branches: BranchInput[]): Promise<WorkflowState>;
  getWorkflow(sessionId: string): Promise<WorkflowState | null>;
  addStepToBranch(sessionId: string, branchId: string, step: Step): Promise<Step>;
  completeBranch(sessionId: string, branchId: string, result: string): Promise<void>;
  getNextActiveBranch(sessionId: string): Promise<Branch | null>;
  isWorkflowComplete(sessionId: string): Promise<boolean>;
}
```

### Pattern 2: Branch-Based Parallel Exploration

**Transfer:** Decompose complex requests into parallel exploration branches.

```typescript
// For agent-work-contract
interface WorkBranch {
  id: string;
  scope: string;              // What this branch explores/executes
  status: "pending" | "active" | "complete" | "failed";
  steps: BranchStep[];
  result: string | null;     // Synthesized output
}

interface BranchStep {
  id: string;
  type: "question" | "action" | "verification";
  payload: unknown;
  result?: unknown;
  completedAt?: number;
}

// Key insight: Each branch is independent, enabling:
// - Parallel agent dispatch
// - Independent completion timing
// - Scoped context for subagents
```

### Pattern 3: Probe Agent for Adaptive Continuation

**Transfer:** Use a "decide" subagent to evaluate progress and determine next action.

```typescript
// For agent-work-contract - continuation agent
interface ContinuationDecision {
  done: boolean;
  reason?: string;
  nextAction?: {
    type: "question" | "task" | "verification";
    payload: unknown;
  };
}

// Context passed to continuation agent:
interface ContinuationContext {
  originalRequest: string;
  allBranches: BranchSummary[];
  currentBranchId: string;
  currentBranchHistory: QAndAOrActionResult[];
}

// The continuation agent evaluates:
// 1. Is this branch satisfied?
// 2. Do we need more information?
// 3. Should we pivot to a different approach?
```

### Pattern 4: Session Lock for Concurrency Safety

**Transfer:** Serialize operations per workflow/session.

```typescript
// For agent-work-contract
function createWorkflowLock(): WorkflowLock {
  const queues = new Map<string, Promise<unknown>>();
  
  return <T>(workflowId: string, operation: () => Promise<T>): Promise<T> => {
    const current = queues.get(workflowId) ?? Promise.resolve();
    const next = current.then(operation, operation);
    queues.set(workflowId, next);
    return next as Promise<T>;
  };
}

// Ensures:
// - Question added to correct branch
// - Answer recorded before next answer processed
// - Branch status updates are atomic
```

### Pattern 5: Context Building for Subagents

**Transfer:** Format full context for continuation decisions.

```typescript
// Octto's formatBranchContext pattern
function formatBranchContext(state: BrainstormState, branchId: string): string {
  const lines: string[] = [
    `<original_request>${state.request}</original_request>`,
    "",
    "<branches>"
  ];
  
  for (const [id, branch] of Object.entries(state.branches)) {
    lines.push(formatBranchXml(id, branch, id === branchId)); // highlights current
  }
  
  lines.push("</branches>");
  lines.push("");
  lines.push(`Evaluate the branch "${branchId}" and decide: ask another question or complete with a finding.`);
  
  return lines.join("\n");
}

// For agent-work-contract: Include:
// - Original task
// - All parallel branch states
// - Current branch's execution history
// - Clear decision prompt
```

---

## 6. Recommendations for Integration

### 6.1 Adopt the Dual-Session Pattern

```typescript
// Recommended architecture for agent-work-contract
interface AgentWorkPlugin {
  // Browser session (real-time UI)
  sessionManager: SessionManager;
  
  // Workflow state (persistent)
  workflowStore: WorkflowStore;
  
  // Tools
  tools: {
    create_workflow: (request: string, branches: BranchInput[]) => WorkflowHandle;
    await_completion: (workflowId: string) => Promise<WorkflowResult>;
    get_branch_status: (workflowId: string, branchId: string) => BranchStatus;
    // ... per-question/per-task tools
  };
}
```

### 6.2 Implement Question Types as Contracts

Octto has 15 question types. Agent-work-contract could define:

```typescript
interface WorkContractType {
  type: "approval" | "selection" | "input" | "verification" | "delegation";
  config: unknown;
  expectedResponseType: "boolean" | "string" | "string[]" | "artifact";
}
```

### 6.3 Reuse the Waiter Pattern

```typescript
// Octto's waiter pattern for async coordination
interface WaiterManager<K, T> {
  register(key: K, callback: (result: T) => void): () => void;  // Returns cleanup
  notifyFirst(key: K, result: T): boolean;
  notifyAll(key: K, result: T): void;
}
```

### 6.4 Integrate Probe-as-Subagent Pattern

```typescript
// In agent-work-contract orchestrator
async function processBranchCompletion(
  stateStore: WorkflowStore,
  branchId: string
): Promise<void> {
  const decision = await runContinuationAgent(state, branchId);
  
  if (decision.done) {
    await stateStore.completeBranch(sessionId, branchId, decision.result!);
  } else if (decision.nextAction) {
    await stateStore.addStepToBranch(sessionId, branchId, {
      type: decision.nextAction.type,
      payload: decision.nextAction.payload,
    });
  }
}
```

### 6.5 File-Based Persistence for State

```typescript
// Octto's JSON file approach (adapted)
interface WorkflowPersistence {
  baseDir: string;  // e.g., .agent-work/workflows/
  
  save(workflowId: string, state: WorkflowState): Promise<void>;
  load(workflowId: string): Promise<WorkflowState | null>;
  delete(workflowId: string): Promise<void>;
}

// Benefits:
// - Human-readable for debugging
// - Git-trackable for audit
// - Simple concurrency via file locking
```

---

## 7. Key Code Locations

| Pattern | File | Lines of Interest |
|---------|------|-------------------|
| SessionStore interface | `src/session/sessions.ts` | 1080-1091 |
| WebSocket handlers | `src/session/sessions.ts` | 1405-1455 |
| Waiter pattern | `src/session/waiter.ts` | 1801-1820 |
| StateStore interface | `src/state/store.ts` | 2032-2040 |
| Session lock | `src/state/store.ts` | 2046-2063 |
| Branch state machine | `src/state/types.ts` | 2210-2238 |
| Bootstrapper agent | `src/agents/bootstrapper.ts` | 250-341 |
| Probe agent | `src/agents/probe.ts` | 437-490 |
| Orchestrator workflow | `src/agents/octto.ts` | 373-437 |
| Answer processing loop | `src/tools/brainstorm.ts` | 2317-2368 |
| Probe evaluation | `src/tools/processor.ts` | 2969-3080 |

---

## 8. Summary

Octto provides a complete reference implementation for:

1. **Dual-Store Architecture** - Separating real-time UI from persistent workflow state
2. **Branch-Based Decomposition** - Parallel exploration with scoped subagents
3. **Adaptive Continuation** - Probe agent pattern for "more or done" decisions
4. **WebSocket Q&A** - Real-time question delivery with async blocking
5. **Session-Level Locking** - Safe concurrent modifications per workflow

These patterns directly transfer to agent-work-contract for implementing:
- Parallel task branches
- Interactive human-in-loop flows
- Persistent workflow state
- Subagent coordination with scoped context