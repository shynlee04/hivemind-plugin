---
session_id: ses_2e5b80b50ffeUxYZMOZHpLnNL8
timestamp: 2026-03-23T10:42:23.902Z
purpose: planning
session_state: ready
trajectory: none
workflow: none
agent: unset
---

## Assistant Output

Based on my comprehensive investigation, here is the complete pipeline map:

---

# PRE-SEND HUMAN-USER MESSAGE INJECTION PIPELINE MAP

## PIPELINE: `experimental.chat.messages.transform`

```
PIPELINE-messages-transform:
  segments:
    - name: Source Definition
      src: src/plugin/messages-transform-adapter.ts
      dist: dist/plugin/messages-transform-adapter.js
      registration: N/A (source only)
      invocation: N/A
      modification_point: |
        Lines 41-178: createMessagesTransformHandler() function
        - Finds last user message via findLastUserMessage()
        - Filters by variant === 'new' || variant === 'continue'
        - Extracts sessionID/messageID from lastUserMessage.info
        - Calls turnSnapshot.getSnapshot() for runtime bindings
        - Creates StartWorkInput via createStartWorkInput()
        - Calls resolveStartWork() for purpose classification
        - Injects synthetic parts at line 170: lastUserMessage.parts = [...injectedParts, ...lastUserMessage.parts]
        - Conditionally appends route hint at line 173

    - name: Registration (Plugin Factory)
      src: src/plugin/opencode-plugin.ts (lines 50-54, 203)
      dist: dist/plugin/opencode-plugin.js (lines 38-42, 171)
      registration: |
        Line 50-54: Creates messagesTransform handler with deps:
          - directory: input.directory
          - turnSnapshot: createTurnSnapshotLoader(directory)
          - nlFirstDispatchKeys: new Set<string>()
        Line 203: 'experimental.chat.messages.transform': messagesTransform
      invocation: OpenCode SDK calls hook by name on each chat turn
      modification_point: Line 203 in opencode-plugin.ts exports the handler

    - name: Compilation/Transpilation
      src: src/plugin/messages-transform-adapter.ts (179 lines, TypeScript)
      dist: dist/plugin/messages-transform-adapter.js (135 lines, JavaScript)
      registration: TypeScript compiled via tsc, source maps generated
      invocation: Loaded by OpenCode plugin loader from dist/
      modification_point: |

    - name: Runtime Wiring
      src: src/plugin/opencode-plugin.ts line 203
      dist: dist/plugin/opencode-plugin.js line 171
      registration: |
        'experimental.chat.messages.transform': messagesTransform
        This is the direct hook registration object key.
      invocation: |
        OpenCode runtime calls: await Plugin.trigger('experimental.chat.messages.transform', input, output)
        - Input: { agent?: string } — agent ID from runtime
        - Output: { messages: MessageLike[] } — mutable message array
      modification_point: The handler receives output.messages and mutates lastUserMessage.parts

    - name: Invocation Trigger
      src: N/A (OpenCode internal)
      dist: N/A
      registration: OpenCode calls hook on every chat turn before LLM invocation
      invocation: |
        Trigger conditions:
        1. Every chat turn where OpenCode assembles messages for LLM
        2. SDK hook key: 'experimental.chat.messages.transform'
        3. Variant filter: only injects if lastMsg.info?.variant === 'new' || 'continue'
      modification_point: Variant filter at messages-transform-adapter.ts lines 56-59

    - name: Turn Snapshot Loader (Dependency)
      src: src/plugin/runtime-snapshot.ts (35 lines)
      dist: dist/plugin/runtime-snapshot.js
      registration: |
        Created at opencode-plugin.ts line 46:
        const turnSnapshot = createTurnSnapshotLoader(directory)
      invocation: Called within messagesTransform handler at lines 68, 103
      modification_point: |
        TurnSnapshotLoader interface:
        - getSnapshot(): Promise<RuntimeBindingsSnapshot> — caches per turn
        - resetTurnSnapshot(): void — clears cache at turn start

    - name: Injection Point (Message Modification)
      src: src/plugin/messages-transform-adapter.ts line 170
      dist: dist/plugin/messages-transform-adapter.js line 126
      registration: |
        Synthetic parts injected in order:
        1. turnHierarchyPacket (line 137)
        2. contextPacket (line 138)
        3. skillFocusPacket (line 143) — conditional on skills.length > 0
        4. routeReminder (line 175) — appended after user parts, conditional
      invocation: |
        Line 170: lastUserMessage.parts = [...injectedParts, ...(lastUserMessage.parts ?? [])]
        Line 173-176: routeReminder appended after user parts
      modification_point: |
        Mutation target: output.messages[lastUserIndex].parts
        All synthetic parts have synthetic: true flag and ui_hidden: true metadata

    - name: Final Send Path
      src: N/A (OpenCode internal)
      dist: N/A
      registration: Modified messages array passed to LLM.stream() or equivalent
      invocation: |
        After hook completes, OpenCode uses modified output.messages
        for the LLM call in this turn.
      modification_point: Messages now contain prepended synthetic parts
```

---

## SUPPORTING PIPELINES

### PIPELINE: Turn Snapsh
