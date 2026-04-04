# Session Investigation

## Table of Contents

- [Session Data Ecosystem](#session-data-ecosystem-3-layers)
- [Layer 1: Session-Inspection Investigation](#layer-1-session-inspection-investigation)
- [Layer 2: Sessions Investigation](#layer-2-sessions-investigation)
- [Layer 3: Session Export Investigation](#layer-3-session-export-investigation)
- [Time-Machine Investigation Protocol](#time-machine-investigation-protocol)
- [Long-Haul Analysis](#long-haul-analysis)

## Session Data Ecosystem (3 layers)

| Layer | Path | Scale | Primary Use |
|-------|------|-------|-------------|
| 1. Session-inspection | `.hivemind/session-inspection/ses_*/` | 427 dirs, 768 files | Full assistant output capture for purification |
| 2. Sessions | `.hivemind/sessions/ses_*/` | 1,748 JSON + 103 dirs | Structured session metadata + event journals |
| 3. Session exports | Project root `session-ses_*.md` | 5 files, 54,281 lines total | Raw conversation transcripts |

## Layer 1: Session-Inspection Investigation

**Path:** `.hivemind/session-inspection/ses_*/`

Each directory contains:
- `assistant-output.md` — full assistant output capture
- `purification-command.json` — purification command metadata

**Use when:** Reconstructing what agents actually did, finding decisions made, understanding tool call patterns.

**Investigation approach:**
1. Repomix pack a session-inspection directory
2. Grep packed output for key decisions, tool calls, outcomes
3. Cross-reference with git commits in same timeframe
4. Synthesize findings into agent behavior narrative

**Pattern detection:**
- Tool call sequences (which tools were called, in what order)
- Decision points (where agents made choices)
- Failure patterns (where agents got stuck or returned errors)

## Layer 2: Sessions Investigation

**Path:** `.hivemind/sessions/ses_*/`

Each directory contains:
- `session.json` — session metadata
- `events.md` — timestamped entries
- `diagnostics.log` — diagnostic events

**session.json fields:**
- `sessionId` — unique session identifier
- `lineage` — hivefiver or hiveminder
- `purposeClass` — discovery, brainstorming, research, planning, implementation, gatekeeping, tdd, course-correction
- `agent` — agent name
- `created` — ISO 8601 timestamp
- `status` — session status
- `delegationCount` — number of delegations

**events.md format:** Timestamped `assistant_output` entries with actor, title, summary.

**Use when:** Workflow pattern analysis, delegation tracking, session lifecycle understanding.

## Layer 3: Session Export Investigation

**Path:** Project root `session-ses_*.md` (5 files, 54K+ lines)

Raw conversation transcripts from manual exports.

**Use when:** Understanding user prompt patterns, long-haul session analysis, workflow reconstruction.

**Approach:** Targeted grep for specific patterns — do NOT read full files. Search for:
- User prompt patterns (recurring questions, workflow triggers)
- Error patterns (where sessions went wrong)
- Decision patterns (what was decided and why)
- Handoff patterns (how work transferred between agents)

## Time-Machine Investigation Protocol

1. Identify time period of interest
2. Filter sessions by date range (`session.json` `created` field)
3. Repomix pack relevant session-inspection directories
4. Grep packed output for decisions, tool usage, outcomes
5. Cross-reference with git commits in same timeframe (`git log --since --until`)
6. Synthesize findings into temporal activity narrative

**Output format:**
```
Timeline: {start_date} → {end_date}
- Session {id}: {purposeClass} — {key_decision}
- Git commit {sha}: {message}
- Handoff: {source} → {destination}
```

## Long-Haul Analysis

Track session purpose classes across time:

| Analysis | Method |
|----------|--------|
| Purpose class distribution | Count sessions by `purposeClass` across time range |
| Recurring user prompts | Grep session exports for repeated phrases |
| Workflow bottlenecks | Identify session types with longest duration |
| Delegation chains | Trace `delegationCount` and handoff records across sessions |

**Bottleneck detection:**
- Sessions with >50 events may indicate stuck workflows
- Sessions with `purposeClass: course-correction` indicate prior approach failed
- High `delegationCount` with low completion indicates delegation chain issues
