# Update to Phase 3: TUI E2E Server Connection

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prove the OpenTUI dashboard connects to a live OpenCode server, subscribes to SSE events, and invokes the `hivemind_runtime_status` tool to display real backend state, completely replacing the direct in-process function calls.

**Architecture:** The TUI runs as a separate Bun process (`apps/opentui/`). It uses `@opencode-ai/sdk` (`createOpencodeClient`) to attach to an OpenCode server `baseUrl` and create a session. It subscribes to `client.event.subscribe()` for streaming events, and calls `client.session.prompt()` invoking the `hivemind_runtime_status` tool to get the structured `RuntimeStatus` read model.

**Tech Stack:** Bun, `@opentui/react`, `@opentui/core`, `@opencode-ai/sdk`, Zod.

---

### Task 1: Replace In-Process Mock with SDK Client

Currently, `apps/opentui/src/adapters/runtime-client.ts` imports Node files directly. We must change this to use the OpenCode SDK client to call the tool over HTTP.

**Files:**
- Modify: `apps/opentui/src/adapters/runtime-client.ts`
- Modify: `apps/opentui/package.json` (ensure SDK is available if not inherited)

**Step 1: Write the failing test**

```typescript
// apps/opentui/tests/runtime-status-client.test.tsx
import { test, expect } from 'bun:test'
import { loadRuntimeStatus } from '../src/adapters/runtime-client.js'

test('SDK client attempts connection to baseUrl', async () => {
  // Pass an invalid URL and expect an SDK fetch error, proving it's making a network request
  // instead of calling the in-process Node function.
  let error;
  try {
    await loadRuntimeStatus({ baseUrl: 'http://localhost:9999' })
  } catch (e) {
    error = e
  }
  expect(error).toBeDefined()
  expect(error.message).toContain('fetch') // or similar SDK network error
})
```

**Step 2: Run test to verify it fails**

Run: `bun test apps/opentui/tests/runtime-status-client.test.tsx`
Expected: FAIL, because currently it still calls `buildRuntimeStatusSnapshot` directly and bypasses network.

**Step 3: Write minimal implementation**

Update `apps/opentui/src/adapters/runtime-client.ts` to accept a `baseUrl` and use `createOpencodeClient`:

```typescript
import { createOpencodeClient } from '@opencode-ai/sdk'
import { runtimeStatusSchema, type RuntimeStatus } from '../../../../src/shared/contracts/runtime-status.js'

export interface LoadRuntimeStatusInput {
  projectRoot?: string
  sessionId?: string
  agentId?: string
  baseUrl?: string
}

export function parseRuntimeStatus(input: unknown): RuntimeStatus {
  return runtimeStatusSchema.parse(input)
}

export async function loadRuntimeStatus(input: LoadRuntimeStatusInput = {}): Promise<RuntimeStatus> {
  const baseUrl = input.baseUrl ?? 'http://127.0.0.1:4096'
  const sessionId = input.sessionId ?? 'opentui-runtime-status'
  
  const client = createOpencodeClient({ baseUrl })
  
  // Create or get session
  await client.session.create({ body: { title: 'TUI Status Check' } }).catch(() => {})
  
  // Call the runtime status tool
  const response = await client.session.prompt({
    path: { id: sessionId },
    body: {
      message: 'call the hivemind_runtime_status tool and return the exact JSON payload',
    }
  })
  
  // Extract the tool call result from the assistant's message
  // NOTE: Depending on SDK version, we may need to iterate parts to find the tool call.
  // For the minimal implementation, we assume the tool result is returned in the text or tool_call part.
  const jsonMatch = response.message.content?.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
     throw new Error('Failed to extract JSON from SDK response')
  }
  
  return parseRuntimeStatus(JSON.parse(jsonMatch[0]))
}
```

*Note: You may need to refine the prompt logic depending on exactly how OpenCode returns the tool JSON.*

**Step 4: Run test to verify it passes**

Run: `bun test apps/opentui/tests/runtime-status-client.test.tsx`
Expected: PASS (SDK throws network error on port 9999).

**Step 5: Commit**

```bash
git add apps/opentui/src/adapters/runtime-client.ts apps/opentui/tests/
git commit -m "feat(tui): replace in-process adapter with OpenCode SDK client"
```

---

### Task 2: Implement SSE Event Subscription

The dashboard needs to stream real events from `client.event.subscribe()` rather than relying on the single-shot `recentEvents` array from the status payload alone.

**Files:**
- Modify: `apps/opentui/src/views/runtime-status.tsx`

**Step 1: Write the failing test**

*(We will mock the SSE stream or test the React hook in a testing library, but since OpenTUI tests are raw bun tests, we will verify the state hook manually if testing library isn't available).*

**Step 2: Write minimal implementation**

Add SSE subscription to the `useEffect` in `RuntimeStatusView`:

```typescript
import { createOpencodeClient } from '@opencode-ai/sdk'

// ... inside RuntimeStatusView component ...

const [liveEvents, setLiveEvents] = useState<any[]>([])

useEffect(() => {
  let cancelled = false;
  const baseUrl = props.baseUrl ?? 'http://127.0.0.1:4096'
  const client = createOpencodeClient({ baseUrl })

  async function connectEvents() {
    try {
      const eventStream = await client.event.subscribe()
      for await (const event of eventStream) {
        if (cancelled) break;
        setLiveEvents(prev => [...prev.slice(-9), event])
      }
    } catch (err) {
      if (!cancelled) setError(err instanceof Error ? err.message : 'SSE failed')
    }
  }

  void connectEvents()

  return () => { cancelled = true }
}, [props.baseUrl])

// ... update render to show liveEvents alongside status ...
```

**Step 3: Run OpenTUI Dev to verify**

Run: `bun run dev` inside `apps/opentui` (with an OpenCode server running on port 4096).
Verify: The UI connects and does not crash, showing the initial status + live events.

**Step 4: Commit**

```bash
git add apps/opentui/src/views/runtime-status.tsx
git commit -m "feat(tui): subscribe to live OpenCode SSE events"
```

---

### Task 3: Expose TUI Runner in Root CLI

We must wire the CLI to start the Bun TUI easily. We'll add a `tui` command to `src/cli.ts` or a top-level `npm run tui` script that spawns the Bun process correctly, ensuring the end-to-end UX works from the root package.

**Files:**
- Modify: `package.json`

**Step 1: Add NPM Script**

```json
  "scripts": {
    "tui": "bun run apps/opentui/src/main.tsx",
    ...
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add root tui script to spawn OpenTUI dashboard"
```