# Session Journal System — Gherkin User Stories

**Generated:** 2026-03-24
**Scope:** Behavioral acceptance criteria for the event-tracker session journal system
**Role:** Agent / User perspective — what an agent observes when interacting with the journal
**NOT:** Unit tests. These describe system-level behavior from an external consumer's viewpoint.

---

## Feature 1: Session Lifecycle — New Session Creation

  As a HiveMind agent
  I want to start a new session and have a journal directory automatically created
  So that all my activity is captured from the first turn onward

  Background:
    Given a project root at `/workspace`
    And the HiveMind plugin is installed and active
    And the `.hivemind/sessions/` directory exists

  Scenario: First turn of a new session creates the session directory
    Given no journal exists for session `ses-abc123`
    When the `text.complete` hook fires with sessionId `ses-abc123` and agent `hiveminder`
    Then a directory `.hivemind/sessions/ses-abc123/` is created
    And `session.json` is written with status `active`
    And `session.json` contains `userMessageCount: 0`
    And `session.json` contains `agentOutputCount: 0`
    And `session.json` contains `delegationCount: 0`
    And `session.json` contains `childSessionIds: []`

  Scenario: Session metadata records the agent and lineage
    Given a new session `ses-abc123` with agent `hiveminder` and purposeClass `implementation`
    When the first `text.complete` hook fires
    Then `session.json` contains `agent: "hiveminder"`
    And `session.json` contains `lineage: "hiveminder"`
    And `session.json` contains `purposeClass: "implementation"`
    And `session.json` contains `status: "active"`

  Scenario: Session status transitions from active to completed
    Given an active session `ses-abc123` exists
    When the session completes (external signal)
    Then `session.json` is updated with `status: "completed"`
    And the `updated` timestamp reflects the completion time

  Scenario Outline: PurposeClass variants are persisted correctly
    Given a new session with purposeClass `<purpose>`
    When the first `text.complete` hook fires
    Then `session.json` contains `purposeClass: "<purpose>"`

    Examples:
      | purpose            |
      | discovery          |
      | brainstorming      |
      | research           |
      | planning           |
      | implementation     |
      | gatekeeping        |
      | tdd                |
      | course-correction  |

---

## Feature 2: Turn Capture — Message and Response

  As a HiveMind agent
  I want each assistant response recorded as a structured event
  So that the conversation history is preserved in append-only journal form

  Background:
    Given session `ses-abc123` exists in `.hivemind/sessions/ses-abc123/`
    And the injection store has a payload for `ses-abc123` with agent `hiveminder`

  Scenario: Assistant output creates an event in events.md
    Given the assistant generates a response "Hello, I've analyzed the codebase."
    When the `text.complete` hook fires with sessionId `ses-abc123`
    Then a new event block is appended to `events.md`
    And the event header is `## assistant_output`
    And the event contains `Actor: hiveminder`
    And the event contains `Title: Assistant response`
    And the event summary contains the first 200 characters of the assistant text

  Scenario: Assistant output summary is truncated to 200 characters
    Given the assistant generates a response with 500 characters
    When the `text.complete` hook fires
    Then the event summary in `events.md` contains exactly 200 characters
    And the summary is the first 200 chars of the assistant text

  Scenario: Diagnostics log records turn completion
    Given the assistant generates a response with 150 characters of text
    When the `text.complete` hook fires with agent `hiveminder`
    Then a new line is appended to `diagnostics.log`
    And the line matches pattern `* | session=ses-abc123 | level=info | message=turn_complete agent=hiveminder text_len=150`

  Scenario: Empty assistant text produces no journal write
    Given the assistant response is empty (zero-length string)
    When the `text.complete` hook fires
    Then no event is appended to `events.md`
    And no line is appended to `diagnostics.log`
    And `session.json` is not updated

  Scenario: Missing sessionID produces no journal write
    Given the `text.complete` hook fires with no sessionId
    Then no journal file is written
    And no error is thrown

  Scenario: Multiple turns increment the agent output count
    Given session `ses-abc123` has `agentOutputCount: 2`
    When the third `text.complete` hook fires
    Then `session.json` is updated with the new timestamp
    And the session metadata reflects updated `agentOutputCount: 3` (managed by the caller)

---

## Feature 3: Delegation Dispatch Tracking

  As a HiveMind orchestrator agent
  I want every delegation dispatch captured as a structured event
  So that I can trace which subagents were spawned and for what purpose

  Background:
    Given session `ses-abc123` with 5 turns of conversation
    And turn 3 contains a `**Tool: task**` invocation with agent `hivexplorer`

  Scenario: Delegation dispatch is extracted from markdown tool blocks
    Given turn 3 markdown contains:
      """
      **Tool: task**
      **Input:**
      ```json
      {
        "agent": "hivexplorer",
        "description": "Investigate parser module",
        "subagent_type": "hivexplorer",
        "packet_id": "pkt-001"
      }
      ```
      """
    When the parser processes the session
    Then `ParsedTurn.delegationTargets` for turn 3 contains 1 delegation
    And the delegation has `delegatedTo: "hivexplorer"`
    And the delegation has `description: "Investigate parser module"`
    And the delegation has `subagentType: "hivexplorer"`
    And the delegation has `packetId: "pkt-001"`

  Scenario: Multiple delegations in a single turn are all captured
    Given turn 3 contains two `**Tool: task**` blocks
    When the parser processes the session
    Then `ParsedTurn.delegationTargets` for turn 3 contains 2 delegations
    And `ParsedSession.delegations` contains both delegations

  Scenario: Delegation with malformed JSON is silently skipped
    Given a `**Tool: task**` block contains invalid JSON in its Input
    When the parser processes the session
    Then no delegation is extracted from that block
    And no error is thrown
    And other valid delegations in the same turn are still captured

  Scenario: Delegation missing required agent field is skipped
    Given a `**Tool: task**` block has valid JSON but no `agent` field
    When the parser processes the session
    Then no delegation is extracted from that block

  Scenario: Classifier emits delegation_created with medium importance
    Given a turn with delegation targets
    When the classifier processes the turn
    Then a `delegation_created` event is emitted
    And the event has `importance: "medium"`
    And the event data contains `packetId`, `delegatedTo`, `subagentType`, `description`

  Scenario: Non-task tool invocations are not treated as delegations
    Given a turn contains `**Tool: read**` or `**Tool: todowrite**`
    When the parser extracts delegations
    Then no delegation is created for those tool invocations

---

## Feature 4: Delegation Return Evidence Capture

  As a HiveMind orchestrator agent
  I want subagent return results captured as delegation_returned events
  So that I can correlate dispatch with completion and inspect evidence

  Background:
    Given session `ses-abc123` has a delegation with `packetId: "pkt-001"` dispatched in turn 3
    And the delegation returned evidence is available via `delegationReturnedEvidenceByPacketId`

  Scenario: Delegation returned event is emitted when evidence exists
    Given the classifier input includes `delegationReturnedEvidenceByPacketId: { "pkt-001": { statusDetail: "complete", evidenceSnapshot: "Found 3 files" } }`
    When the classifier processes turn 3
    Then a `delegation_returned` event is emitted alongside the `delegation_created` event
    And the event has `importance: "high"`
    And the event data contains `statusDetail: "complete"`
    And the event data contains `evidenceSnapshot: "Found 3 files"`

  Scenario: Delegation returned event is NOT emitted when no evidence exists
    Given the classifier input has no `delegationReturnedEvidenceByPacketId` entry for `pkt-001`
    When the classifier processes turn 3
    Then only `delegation_created` is emitted
    And no `delegation_returned` event is emitted

  Scenario: Delegation with null packetId never gets a returned event
    Given a delegation has `packetId: null`
    And evidence exists in `delegationReturnedEvidenceByPacketId`
    When the classifier processes the turn
    Then `delegation_created` is emitted
    And no `delegation_returned` event is emitted (packetId lookup is skipped)

  Scenario: Writer adapter formats delegation_returned details correctly
    Given a `delegation_returned` event with statusDetail "blocked" and blockedReason "Missing dependency"
    When the writer adapter maps the event
    Then the details section contains `Status: blocked`
    And the details section contains `Blocked Reason: Missing dependency`
    And the title is `Delegation returned`
    And the summary is `Delegation returned by {delegatedTo}`

  Scenario Outline: Returned evidence fields normalize to N/A when missing
    Given a delegation returned evidence with `<field>` undefined or empty
    When the evidence payload is built
    Then `<field>` is normalized to `"N/A"`

    Examples:
      | field                |
      | packetId             |
      | delegatedTo          |
      | subagentType         |
      | description          |
      | statusDetail         |
      | evidenceSnapshot     |
      | blockedReason        |
      | completionMetadata   |

  Scenario: Writer adapter resolves actor from delegatedTo for delegation events
    Given a delegation event with `delegatedTo: "hivexplorer"`
    When the writer adapter resolves the actor
    Then the actor is `"hivexplorer"`

---

## Feature 5: Compaction Detection and Recording

  As a HiveMind agent
  I want compaction events recorded in the session journal
  So that I know when and how context was reduced during a session

  Background:
    Given the HiveMind plugin is active for session `ses-abc123`
    And the SDK decides to compact the session context

  Scenario: Compaction hook writes a compaction event to events.md
    Given the `session.compacting` hook fires for `ses-abc123`
    When the compaction journal handler processes the event
    Then a new event block is appended to `events.md`
    And the event header is `## compaction`
    And the event contains `Actor: system`
    And the event contains `Title: Session compaction`
    And the event summary contains the number of context segments

  Scenario: Compaction events do not create injection or delegation files
    Given the `session.compacting` hook fires
    When the journal handler processes the event
    Then only `events.md` is appended to
    And `session.json` is not modified by the compaction handler
    And `delegation.md` is not modified

  Scenario: Multiple compactions in a session each produce separate events
    Given session `ses-abc123` receives compaction at turn 5 and turn 10
    When both `session.compacting` hooks fire
    Then `events.md` contains two `## compaction` event blocks
    And each has a distinct timestamp

  Scenario: Compaction is detected by the SDK, not by HiveMind code
    Given no HiveMind code monitors context size
    When the SDK decides compaction is needed
    Then the SDK fires `session.compacting`
    And the HiveMind handler only records the event — it does not trigger compaction

  Scenario: Parser detects compaction turns in markdown
    Given a session markdown contains `## Assistant (Compaction · model · 2.5s)`
    When the meta parser processes the header
    Then `isCompactionTurn` returns `true`
    And the turn's `isCompaction` flag is `true`

  Scenario: Compaction turns are excluded from agent output count
    Given a session has 5 turns where 1 is a compaction turn
    When counters are computed
    Then `agentOutputCount` is 4 (compaction turns excluded)

---

## Feature 6: Session Investigation — What Can Be Read

  As an agent investigating a past session
  I want to grep and read structured journal files
  So that I can reconstruct what happened without replaying the conversation

  Background:
    Given session `ses-abc123` has been active for 10 turns
    And the following files exist in `.hivemind/sessions/ses-abc123/`:
      | file             |
      | session.json     |
      | events.md        |
      | diagnostics.log  |
      | delegation.md    |
      | injection.md     |

  Scenario: events.md contains structured event blocks greppable by type
    Given `events.md` has events of types `assistant_output`, `delegation_created`, and `compaction`
    When an agent greps for `## delegation_created`
    Then all delegation events are returned as contiguous blocks

  Scenario: diagnostics.log supports grep by session, level, and agent
    Given `diagnostics.log` has pipe-delimited lines
    When an agent greps for `session=ses-abc123 | level=info`
    Then all info-level diagnostic entries for that session are returned
    And each line contains `message=turn_complete agent=hiveminder text_len=...`

  Scenario: session.json provides machine-readable session metadata
    Given `session.json` exists
    When an agent reads the file
    Then it is valid JSON with fields: `sessionId`, `lineage`, `purposeClass`, `agent`, `created`, `updated`, `status`, `userMessageCount`, `agentOutputCount`, `delegationCount`, `childSessionIds`

  Scenario: delegation.md contains delegation lifecycle entries
    Given delegation `pkt-001` was dispatched and later returned
    When an agent reads `delegation.md`
    Then the file contains blocks with `Packet ID: pkt-001`
    And each block has `Timestamp`, `Delegated To`, `Status`, `Summary`

  Scenario: injection.md records injection payloads per turn
    Given 3 turns have occurred with injection payloads
    When an agent reads `injection.md`
    Then the file contains 3 injection entry blocks
    And each has `Timestamp`, `Source`, `Summary`, and a `Payload` section

  Scenario: An agent can grep diagnostics.log for delegation events
    Given `diagnostics.log` contains lines for turns with and without delegation
    When an agent greps for `delegation`
    Then only lines mentioning delegation in their message are returned

  Scenario: An agent can reconstruct turn sequence from events.md
    Given `events.md` has events across 10 turns
    When an agent reads the file top to bottom
    Then events appear in chronological order (append-only)
    And each event block has a `Timestamp` field
    And the sequence preserves: user_message → assistant_output → delegation_created → delegation_returned ordering

---

## Feature 7: Session Index Queries

  As a HiveMind agent
  I want to query the master session index
  So that I can discover active sessions, find parent-child relationships, and navigate the delegation tree

  Background:
    Given the master index exists at `.hivemind/sessions/index.md`
    And the index contains entries for sessions: `ses-root`, `ses-sub1`, `ses-sub2`

  Scenario: Master index displays a markdown table of all sessions
    Given the index has 3 entries
    When an agent reads `index.md`
    Then the file contains a markdown table with columns: Session ID, Lineage, Purpose, Status, Created, Turns, Delegations, Parent
    And entries are sorted by Created timestamp descending (newest first)

  Scenario: Active sessions can be filtered programmatically
    Given the index has entries with statuses `active`, `completed`, and `abandoned`
    When `getActiveSessions(entries)` is called
    Then only entries with `status: "active"` are returned

  Scenario: Sub-sessions show their parent session ID
    Given `ses-sub1` was delegated from `ses-root`
    When the index entry for `ses-sub1` is rendered
    Then the Parent column shows `ses-root`
    And the Parent column for `ses-root` shows `—` (em dash, null parent)

  Scenario: Session tree can be built recursively
    Given `ses-root` has children `ses-sub1` and `ses-sub2`
    And `ses-sub1` has a child `ses-sub1a`
    When `getSessionTree(entries, "ses-root")` is called
    Then a `SessionTreeNode` is returned with 2 children
    And the first child has 1 nested child
    And circular parent references are guarded by a visited set

  Scenario: Session tree returns null for non-existent root
    Given no entry exists for `ses-nonexistent`
    When `getSessionTree(entries, "ses-nonexistent")` is called
    Then the result is `null`

  Scenario: Index entry reflects delegation count from session metadata
    Given session `ses-root` dispatched 3 delegations
    When the index entry is rendered
    Then the Delegations column shows `3`

---

## Feature 8: Session Synthesis Generation

  As a HiveMind agent
  I want to generate a synthesis document for a session
  So that I can get a compressed summary without reading the full journal

  Background:
    Given session `ses-abc123` has completed with 8 turns, 2 delegations, and 1 compaction
    And synthesis input is assembled from session metadata, turns, delegations, and events

  Scenario: Synthesis document contains five sections
    Given `SynthesisInput` is populated for `ses-abc123`
    When `renderSynthesis(input)` is called
    Then the output contains all five sections:
      | Section              |
      | Identity             |
      | Turn Summary         |
      | Delegation Chain     |
      | Key Findings         |
      | Compaction Events    |

  Scenario: Identity section shows session metadata
    Given lineage is `hiveminder`, purposeClass is `implementation`, agent is `hiveminder`
    When the synthesis is rendered
    Then the Identity section contains `Lineage: hiveminder`
    And it contains `Purpose: implementation`
    And it contains `Agent: hiveminder`
    And it contains `Created` and `Updated` timestamps

  Scenario: Turn Summary table shows all turns
    Given 8 turns with agent names, models, durations, and delegation counts
    When the synthesis is rendered
    Then the Turn Summary section contains a markdown table with 8 rows
    And each row has columns: #, Agent, Model, Duration, Delegations, Preview
    And user message previews are truncated to 200 characters

  Scenario: Delegation Chain lists all delegations
    Given 2 delegations with targets `hivexplorer` and `hiveq`
    When the synthesis is rendered
    Then the Delegation Chain section contains 2 bullet points
    And each shows `delegatedTo`, `description`, `subagentType`, and `status`

  Scenario: Key Findings shows only high-importance events
    Given 10 events with mixed importance levels
    When the synthesis is rendered
    Then the Key Findings section lists only events with `importance: "high"`
    And each finding references turn number, event type, and summary

  Scenario: Compaction Events shows the count
    Given 2 compaction events occurred
    When the synthesis is rendered
    Then the Compaction Events section shows `2 compaction(s) recorded`

  Scenario: Empty session produces empty-state messages
    Given a session with 0 turns, 0 delegations, 0 high-importance events, and 0 compactions
    When the synthesis is rendered
    Then Turn Summary shows `No turns recorded.`
    And Delegation Chain shows `No delegations.`
    And Key Findings shows `No high-importance events.`

  Scenario: Synthesis file is written to the session directory
    Given synthesis input is ready
    When `generateSessionSynthesis(projectRoot, input)` is called
    Then the file is written to `.hivemind/sessions/ses-abc123/synthesis.md`
    And the file is a full rewrite (not append)

---

## Feature 9: Injection Payload Capture

  As a HiveMind agent
  I want injection payloads recorded in the session journal
  So that I can trace what context was injected for each turn

  Background:
    Given the HiveMind plugin is active
    And the `system.transform` hook fires, then `messages.transform` hook fires

  Scenario: System transform writes to injection store
    Given `system.transform` fires with sessionId `ses-abc123`
    When the transform handler processes the event
    Then an injection payload is stored in the in-memory map
    And the payload has `agent: "system-transform"`
    And the payload has `purposeClass: "system"`
    And no disk write occurs at this point

  Scenario: Messages transform overwrites system transform payload
    Given `system.transform` already stored a payload for `ses-abc123`
    When `messages.transform` fires for the same session with agent `hiveminder`
    Then the injection store is overwritten
    And the payload now has `agent: "hiveminder"`
    And the `system-transform` payload is lost

  Scenario: Text complete consumes and clears the injection payload
    Given the injection store has a payload for `ses-abc123`
    When `text.complete` fires
    Then `getAndClearInjectionPayload(sessionId)` reads the payload
    And the store entry for `ses-abc123` is deleted
    And subsequent `text.complete` calls find no injection (undefined)

  Scenario: Injection payload provides agent name for event classification
    Given the injection store payload has `agent: "hiveminder"` and `purposeClass: "tdd"`
    When `text.complete` fires
    Then the `assistant_output` event uses actor `hiveminder`
    And `session.json` is created with `purposeClass: "tdd"` and `agent: "hiveminder"`

  Scenario: Missing injection payload defaults to unknown agent
    Given the injection store has no payload for `ses-abc123`
    When `text.complete` fires
    Then the `assistant_output` event uses actor `unknown`
    And `session.json` is created with `purposeClass: "implementation"` (default)

  Scenario: Missing injection payload defaults purposeClass to implementation
    Given the injection store has no payload for `ses-abc123`
    When `text.complete` fires
    Then `session.json` is created with `purposeClass: "implementation"`

---

## Feature 10: Mixed Agent Types and Counter Maintenance

  As a HiveMind orchestrator
  I want the session journal to track turns from different agent types
  So that I can see which agents participated and how work was distributed

  Background:
    Given session `ses-abc123` spans 6 turns
    And turns 1, 3, 5 have agent `hiveminder`
    And turns 2, 4, 6 have agent `hivexplorer`
    And turn 3 includes 2 delegations
    And turn 5 is a compaction turn

  Scenario: Each event records its originating agent
    Given the classifier processes turns 1–6
    Then assistant_output events for turns 1, 3, 5 have actor `hiveminder`
    And assistant_output events for turns 2, 4, 6 have actor `hivexplorer`

  Scenario: Counter computation excludes compaction turns
    Given 6 turns where 1 is compaction
    When `countTurns(turns)` is called
    Then `agentOutputCount` is 5 (6 minus 1 compaction)
    And `userMessageCount` is 6 (all turns have user messages)

  Scenario: Counter computation sums delegation targets across all turns
    Given turn 3 has 2 delegation targets
    When `countTurns(turns)` is called
    Then `delegationCount` is 2

  Scenario: Delegation targets are stored per-turn and aggregated at session level
    Given turn 3 has 2 delegation targets
    When the parser processes the session
    Then `ParsedTurn.delegationTargets` for turn 3 has length 2
    And `ParsedSession.delegations` contains all delegations from all turns as a flat array

  Scenario: Events have deterministic IDs based on session, turn, type, and ordinal
    Given session `ses-abc123`, turn 3, event type `delegation_created`, ordinal 2
    When the event ID is generated
    Then the ID is `ses-abc123::3::delegation_created::2`

  Scenario: Event ordinals are assigned in fixed order per turn
    Given a turn with user message, assistant output, and 2 delegations
    When events are classified
    Then `user_message` gets ordinal 0 (importance: low)
    And `assistant_output` gets ordinal 1 (importance: low)
    And first `delegation_created` gets ordinal 2 (importance: medium)
    And second `delegation_created` gets ordinal 3 (importance: medium)

  Scenario: Mixed agent turns appear in chronological order in events.md
    Given events are appended in hook-fire order
    When an agent reads `events.md`
    Then events alternate between `hiveminder` and `hivexplorer` actors
    And timestamps are monotonically increasing

  Scenario: Session metadata reflects the last-writing agent
    Given turns alternate between agents
    When `initOrUpdateSessionMetadata` is called on each turn
    Then `session.json` is updated on every call
    And the `updated` timestamp always advances
    And the `agent` field reflects the agent of the last write (caller responsibility)

---

## Cross-Cutting Observations

### Diagnostics Log Format
  Scenario: Diagnostics lines follow grep-friendly pipe-delimited format
    Given a diagnostic entry is written
    When the line is read from `diagnostics.log`
    Then it matches the pattern: `{timestamp} | session={id} | level={level} | actor={actor} | source={source} | message={message} | details={details}`
    And missing optional fields render as `N/A`
    And `details` defaults to empty string (not N/A)

### N/A Fallback Strategy
  Scenario: All normalization targets produce N/A for empty/undefined values
    Given any string field in the delegation returned evidence is undefined, null, or whitespace-only
    When `withFallback(value)` is called
    Then the result is `"N/A"`
    And no `null` or `undefined` leaks to the writer layer

### Silent Error Handling
  Scenario: Journal write failures are silently swallowed
    Given a journal write fails (disk full, permission denied, etc.)
    When the `text.complete` hook handler writes
    Then the error is caught by `.catch(() => undefined)`
    And the hook does not throw
    And the agent continues processing (fire-and-forget)

### Dual-Track Architecture
  Scenario: Legacy and journal paths fire in parallel
    Given `text.complete` fires
    When the plugin processes the hook
    Then both the legacy `sdk-supervisor` path and the new journal path execute
    And neither path depends on the other
    And a failure in one path does not block the other

### Append-Only Guarantee
  Scenario: events.md, diagnostics.log, delegation.md, and injection.md are append-only
    Given journal files exist
    When new events occur
    Then existing content is never modified or deleted
    And new content is appended at the end
    And each append creates a new block (events) or line (diagnostics)

### Session.json Idempotent Updates
  Scenario: session.json is updated on every text.complete call
    Given an existing `session.json`
    When a new `text.complete` fires
    Then `session.json` is fully rewritten (not appended)
    And existing fields are preserved
    And only `updated` timestamp and `status` change
