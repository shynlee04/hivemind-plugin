# OpenCode SDK Debug Integration - Deep Dive Guide

> **Status**: ACTIVE | **Version**: 1.0 | **Date**: 2026-02-17
> **Reference**: https://skills.sh/wshobson/agents/debugging-strategies
> **Reference**: https://skills.sh/obra/superpowers/systematic-debugging
> **Reference**: https://skills.sh/wshobson/agents/parallel-debugging
> **Reference**: https://deepwiki.com/search/using_sdk_and_the_innate_conce_cd09c2f1-4257-473c-90dc-7756dfc61996?mode=fast

---

## Table of Contents

1. [OpenCode SDK Fundamentals](#opencode-sdk-fundamentals)
2. [Event Hooks Deep Dive](#event-hooks-deep-dive)
3. [SDK Session Manipulation](#sdk-session-manipulation)
4. [Implementing Debug Hooks](#implementing-debug-hooks)
5. [noReply Prompt Injection](#noreply-prompt-injection)
6. [Headless Swarm Debugging](#headless-swarm-debugging)
7. [Best Practices](#best-practices)

---

## OpenCode SDK Fundamentals

### Installation

```bash
npm install @opencode-ai/sdk
```

### Core Imports

```typescript
import { createOpencodeClient } from "@opencode-ai/sdk"
import type { Session, Message, Part, Project } from "@opencode-ai/sdk"
```

### Client Initialization

```typescript
// In plugin context (src/index.ts)
export const MyPlugin: Plugin = async ({ project, client, $, directory }) => {
  // client is already initialized
  // Use it directly for session manipulation
}
```

---

## Event Hooks Deep Dive

### Available Hooks for Debugging

| Hook | Fires When | Blocking | Use Case |
|------|-----------|----------|----------|
| `experimental.chat.messages.transform` | Before LLM call | ❌ | Inject debug context |
| `tool.execute.before` | Before any tool | ✅ | Block dangerous commands |
| `tool.execute.after` | After any tool | ❌ | Log, classify |
| `experimental.session.compacting` | Before compaction | ❌ | Modify compaction context |
| `event` | Any event | ❌ | React to LSP, tests |

### Hook Signature Pattern

```typescript
import type { Plugin } from "@opencode-ai/plugin"

export const DebugPlugin: Plugin = async ({ project, client, $, directory }) => {
  return {
    // Non-blocking: messages.transform
    "experimental.chat.messages.transform": async (
      input: {},
      output: { messages: Message[] }
    ): Promise<void> => {
      // Add debug reminder to last user message
      const lastMsg = output.messages[output.messages.length - 1]
      if (lastMsg.role === "user") {
        lastMsg.parts.push({
          type: "text",
          text: "\n\n<!-- DEBUG REMINDER: Check for active debug sessions -->",
          synthetic: true
        })
      }
    },

    // Blocking: tool.execute.before
    "tool.execute.before": async (
      input: { tool: string; args: any },
      output: { args: any }
    ): Promise<void> => {
      // Block write tools if no session declared
      if (input.tool === "write" && !hasSession()) {
        throw new Error("Cannot write without declaring intent first")
      }
    },

    // Non-blocking: tool.execute.after
    "tool.execute.after": async (
      input: { tool: string; args: any },
      output: { result: any }
    ): Promise<void> => {
      // Log all tool executions for debugging
      console.log(`[TOOL] ${input.tool}:`, output.result.status)
    },

    // React to events
    "event": async (event): Promise<void> => {
      if (event.type === "lsp.diagnostics.publish") {
        // Handle LSP diagnostics
        const diagnostics = event.data.diagnostics
        const errors = diagnostics.filter(d => d.severity === 1)
        
        if (errors.length > 0) {
          // Trigger debug orchestration
          await triggerDebugOrchestration(errors)
        }
      }
    }
  }
}
```

---

## SDK Session Manipulation

### Creating New Session

```typescript
// Create a headless debug session
const session = await client.session.create({
  projectId: project.id,
  model: "claude-3-5-sonnet-20241022",
  systemPrompt: getDebugSystemPrompt()
})

// Get session ID
const debugSessionId = session.id
```

### Sending noReply Prompts

```typescript
// Inject context without triggering response
await client.session.prompt(debugSessionId, {
  message: {
    role: "user",
    parts: [
      {
        type: "text",
        text: `Debug context:\n- Error: ${errorMessage}\n- File: ${file}\n- Line: ${line}`,
        synthetic: true
      }
    ]
  },
  noReply: true // Key: Don't wait for response
})
```

### Sending Regular Prompts

```typescript
// Get debug investigation response
const response = await client.session.prompt(debugSessionId, {
  message: {
    role: "user", 
    parts: [{ type: "text", text: "Investigate this error and propose fix" }]
  }
})

// Extract response
const proposedFix = response.message.parts[0].text
```

---

## Implementing Debug Hooks

### Complete LSP Diagnostics Handler

```typescript
// src/hooks/debug-lsp-handler.ts
import type { Plugin } from "@opencode-ai/plugin"

interface DiagnosticError {
  message: string
  file: string
  line: number
  severity: "error" | "warning" | "hint"
}

export const DebugLSPHook: Plugin = async ({ client, project }) => {
  return {
    "event": async (event): Promise<void> => {
      if (event.type !== "lsp.diagnostics.publish") return

      const { uri, diagnostics } = event.data
      const errors: DiagnosticError[] = diagnostics
        .filter((d: any) => d.severity === 1) // Error only
        .map((d: any) => ({
          message: d.message,
          file: uri,
          line: d.range.start.line,
          severity: "error" as const
        }))

      if (errors.length === 0) return

      // Step 1: Create debug session
      const debugSession = await client.session.create({
        projectId: project.id,
        model: "claude-3-5-sonnet-20241022",
        systemPrompt: getDebugSystemPrompt(errors)
      })

      // Step 2: Inject error context
      await client.session.prompt(debugSession.id, {
        message: {
          role: "user",
          parts: [{
            type: "text",
            text: formatErrorContext(errors),
            synthetic: true
          }]
        },
        noReply: true
      })

      // Step 3: Request investigation
      const investigation = await client.session.prompt(debugSession.id, {
        message: {
          role: "user",
          parts: [{
            type: "text",
            text: "Analyze these LSP errors. Identify root cause and propose fixes."
          }]
        }
      })

      // Step 4: Log results (or save to memory)
      console.log("[DEBUG] Investigation results:", investigation.message.parts[0].text)
    }
  }
}

function getDebugSystemPrompt(errors: DiagnosticError[]): string {
  return `You are a debug assistant for HiveMind v3.0. 
You are analyzing ${errors.length} LSP error(s).
Your role is to investigate and propose fixes, NOT to apply them.
Return your analysis in JSON format:
{ "rootCause": "...", "fixes": [...], "confidence": 0-100 }`
}

function formatErrorContext(errors: DiagnosticError[]): string {
  return errors.map(e => 
    `Error in ${e.file}:${e.line}\n${e.message}`
  ).join("\n\n")
}
```

### Complete Test Failure Handler

```typescript
// src/hooks/debug-test-handler.ts
export const DebugTestHook: Plugin = async ({ client, project }) => {
  return {
    "event": async (event): Promise<void> => {
      if (event.type !== "test.failed") return

      const { testName, output, file } = event.data

      // Create headless session for test debugging
      const debugSession = await client.session.create({
        projectId: project.id,
        systemPrompt: `You are debugging test failure: ${testName}`
      })

      // Inject test output
      await client.session.prompt(debugSession.id, {
        message: {
          role: "user",
          parts: [{
            type: "text",
            text: `Test failed with output:\n${output}\n\nFile: ${file}\nTest: ${testName}\n\nInvestigate and identify root cause.`,
            synthetic: true
          }]
        },
        noReply: true
      })

      // Get analysis
      const analysis = await client.session.prompt(debugSession.id, {
        message: {
          role: "user",
          parts: [{ type: "text", text: "Analyze test failure and identify root cause" }]
        }
      })

      // Save to memory for future reference
      await saveToMemory("test-failures", {
        testName,
        file,
        analysis: analysis.message.parts[0].text,
        timestamp: new Date().toISOString()
      })
    }
  }
}
```

---

## noReply Prompt Injection

### What is noReply?

`noReply` is a powerful SDK feature that allows injecting context without waiting for a response. This is essential for:

1. **Context enrichment** - Add debugging info without interrupting flow
2. **State injection** - Put agent in correct debugging mindset
3. **Memory anchoring** - Remind agent of past solutions

### Pattern: Debug Context Injection

```typescript
// Inject debug reminder before each turn
export const DebugContextPlugin: Plugin = async ({ client }) => {
  return {
    "experimental.chat.messages.transform": async (_, output) => {
      // Check for active debug session
      const hasActiveDebug = await checkForActiveDebug()
      
      if (hasActiveDebug) {
        // Get active debug context
        const debugContext = await getDebugContext()
        
        // Inject as synthetic message
        output.messages.splice(1, 0, {
          role: "user",
          parts: [{
            type: "text",
            text: `<!-- ACTIVE DEBUG SESSION -->\n${debugContext}`,
            synthetic: true
          }]
        })
      }
    }
  }
}
```

### Pattern: Pre-Stop Checklist Injection

```typescript
// Inject checklist before agent stops
export const PreStopDebugChecklist: Plugin = async () => {
  return {
    "experimental.chat.messages.transform": async (_, output) => {
      // Find last assistant message
      const lastAssistantIdx = output.messages.findIndex(
        m => m.role === "assistant"
      )
      
      if (lastAssistantIdx === -1) return
      
      // Inject pre-stop reminder
      output.messages.splice(lastAssistantIdx + 1, 0, {
        role: "user",
        parts: [{
          type: "text",
          text: `<!-- PRE-STOP CHECKLIST -->
Before you stop, verify:
- [ ] Root cause identified?
- [ ] Fix applied and tested?
- [ ] Solution saved to memory?
- [ ] Anchors cleaned up?`,
          synthetic: true
        }]
      })
    }
  }
}
```

---

## Headless Swarm Debugging

### Spawning Debug Agents

```typescript
// src/lib/debug-swarm.ts
import { createOpencodeClient } from "@opencode-ai/sdk"

interface DebugAgentConfig {
  id: string
  hypothesis: string
  testMethod: string
  successCriteria: string
}

export async function spawnDebugSwarm(
  projectId: string,
  agents: DebugAgentConfig[]
): Promise<string[]> {
  const client = createOpencodeClient({
    serverUrl: process.env.OPENCODE_SERVER_URL || "http://localhost:3000"
  })

  const sessionIds: string[] = []

  for (const agent of agents) {
    // Create session for each hypothesis
    const session = await client.session.create({
      projectId,
      model: "claude-3-5-sonnet-20241022",
      systemPrompt: getDebugAgentSystemPrompt(agent)
    })

    // Inject hypothesis context
    await client.session.prompt(session.id, {
      message: {
        role: "user",
        parts: [{
          type: "text",
          text: `Hypothesis: ${agent.hypothesis}\nTest: ${agent.testMethod}\nSuccess: ${agent.successCriteria}`,
          synthetic: true
        }]
      },
      noReply: true
    })

    sessionIds.push(session.id)
  }

  return sessionIds
}

function getDebugAgentSystemPrompt(agent: DebugAgentConfig): string {
  return `You are a debug agent testing hypothesis: ${agent.hypothesis}

Your goal: Verify if this hypothesis is the root cause of the bug.

Test method: ${agent.testMethod}
Success criteria: ${agent.successCriteria}

Process:
1. Reproduce the error using the test method
2. Verify if hypothesis holds
3. Report result as JSON:
   { "confirmed": true/false, "evidence": "...", "confidence": 0-100 }`
}
```

### Collecting Swarm Results

```typescript
export async function collectSwarmResults(sessionIds: string[]): Promise<any[]> {
  const results: any[] = []

  for (const sessionId of sessionIds) {
    // Get final message from session
    const messages = await getSessionMessages(sessionId)
    const lastMessage = messages[messages.length - 1]
    
    // Parse result
    const result = parseDebugResult(lastMessage.parts[0].text)
    results.push(result)
  }

  return results
}

export function synthesizeWinner(results: any[]): any {
  // Find confirmed hypothesis with highest confidence
  const confirmed = results.filter(r => r.confirmed)
  
  if (confirmed.length === 0) {
    return { winner: null, message: "No hypothesis confirmed" }
  }

  const winner = confirmed.reduce((best, current) => 
    current.confidence > best.confidence ? current : best
  )

  return { winner, confirmed }
}
```

---

## Best Practices

### ✅ DO

1. **Use noReply for context injection** - Don't wait for response
2. **Create separate sessions for each hypothesis** - Isolated context
3. **Save to memory after resolution** - Future reference
4. **Check drift score** - Maintain context integrity
5. **Use synthetic: true** - Mark injected content clearly

### ❌ DON'T

1. **Don't block on headless sessions** - Use noReply
2. **Don't create unlimited sessions** - Max 5 parallel
3. **Don't ignore export_cycle** - Always clean up
4. **Don't inject raw logs** - Filter/summarize first
5. **Don't skip verification** - Always test + type check

---

## Integration Checklist

- [ ] Install @opencode-ai/sdk
- [ ] Register debug hooks in src/index.ts
- [ ] Implement LSP diagnostics handler
- [ ] Implement test failure handler
- [ ] Set up noReply injection for context
- [ ] Create headless swarm spawning function
- [ ] Implement result collection and synthesis
- [ ] Add memory saving for solutions
- [ ] Test with sample errors

---

## File Reference

| File | Purpose |
|------|---------|
| `src/hooks/debug-lsp-handler.ts` | LSP diagnostics → debug session |
| `src/hooks/debug-test-handler.ts` | Test failure → debug session |
| `src/lib/debug-swarm.ts` | Headless agent spawning |
| `src/lib/debug-context.ts` | Context injection utilities |

---

**END OF SDK DEEP DIVE GUIDE**
