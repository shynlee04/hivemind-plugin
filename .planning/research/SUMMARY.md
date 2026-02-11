# Research Summary: HiveMind v3

**Domain:** AI Agent Context Governance — Cognitive Mesh for Multi-Platform Agent Intelligence
**Researched:** 2026-02-12
**Overall confidence:** HIGH (verified against 8 real plugins, SDK source, idumb-v2 architecture)

## The Single Success Statement

> **We create a hivemind's brain that boosts intelligence and provides users' true expertise of AI agents — work faster, more efficiently, handle with full bulletproof context drift.**

This is NOT a feature list. It is an **ecosystem of interconnected approaches** that chain intelligently, automatically, with truly effective tools. The concepts are platform-agnostic — if brought to Claude Code, Cursor, or any future platform, they still hold. The SDK (OpenCode, Claude, etc.) is what gives us means to **materialize** the theories.

## The 5-System Cognitive Mesh (idumb-v2)

The product IS these 5 interconnected systems. Not features — **systems that feed each other**:

```
                    ┌─────────────────────────┐
                    │   Session Management    │
                    │    & Auto-Export        │
                    │  (Lifecycle)            │
                    └────────┬────────────────┘
                             │
┌───────────────────┐   ┌────┴────┐   ┌───────────────────┐
│  Auto-Hooks &     │───│  System │───│  The 'Mems' Brain │
│  Governance       │   │  Core   │   │  (Shared Knowledge│
│  (Triggers/Rules) │   │(Agents) │   │   Repository)     │
└───────────────────┘   └────┬────┘   └───────────────────┘
                             │
                    ┌────────┴────────────────┐
                    │   Unique Agent Tools    │
                    │  (Hook-Activated        │
                    │   Utilities)            │
                    └─────────────────────────┘
```

### System 1: Auto-Hooks & Governance (Triggers & Rules)
**Concept:** Automatic reactions to agent behavior — never blocking, always informing.
- Time-to-Stale: Auto-archive after 3 days inactivity
- Hierarchy Chain Breaking: Detect relational logic failures
- Git Atomic Commits: Action-triggered history preservation
- Activate Agent Tools: Ensure agents use what they must

### System 2: Session Management & Auto-Export (Lifecycle)
**Concept:** Every session IS an on-going plan. Sessions are first-class citizens.
- Session = On-going Plan: Active/Archived lifecycle
- Auto-Export of a Whole Session: Full session capture
- Long Session Handling: Capture last, compact messages
- Session Structure: ID, Date, Meta Key, Role, By AI

### System 3: Unique Agent Tools (Hook-Activated Utilities)
**Concept:** Tools that make agents smarter — cognitive prosthetics, not commands.
- Hierarchy Reading Tools: Structured access to the tree
- Fast Read/Extract: Bash, Headings, Grep, 'Brainy', Git Read
- Precision Extraction: Contextual focus from large codebases
- Thinking Frameworks: Cognitive models that guide reasoning

### System 4: The 'Mems' Brain (Shared Knowledge Repository)
**Concept:** Persistent memory that survives sessions, compactions, and platform switches.
- Shared Brain: Mems share one → Atomic Git
- Main Shelves: Organized storage by category
- Meta Data & IDs: Tracking lineage and relationships
- Just-in-Time Memory: Long-haul, multi-phase trial & error

### System 5: System Core (For Agents)
**Concept:** The orchestrator that connects all 4 outer systems. Brain state, hierarchy tree, detection engine.

## Key Findings

**The mesh, not the parts:** No single system works alone. Auto-Hooks detect drift → trigger Session lifecycle → inform Agent Tools what to read → persist findings in Mems Brain → Core routes the chain. Remove any one system and the ecosystem degrades gracefully but loses its intelligence multiplier.

**SDK = materialization layer:** The OpenCode SDK (`@opencode-ai/plugin` + `@opencode-ai/sdk`) provides the channels:
- `client.session.*` materializes Session Management concepts
- `client.tui.showToast()` materializes governance visibility
- `client.file.*` + `client.find.*` materializes Fast Read/Extract
- `event` hook (32 event types) materializes Auto-Hooks triggers
- `$` BunShell materializes subprocess extraction tools
- `experimental.chat.messages.transform` materializes context pruning
- Direct filesystem (`.hivemind/`) materializes Mems Brain persistence

**Platform portability:** The 5 systems are pure concepts. On Claude Code, "hooks" become "tool_use interception," "TUI toasts" become "status messages," "session API" becomes "conversation metadata." The architecture document captures this abstraction.

**Plugin ecosystem patterns (from 8 analyzed plugins):**
- micode: `client.session.create/prompt/delete` — spawns review sessions
- subtask2: `setClient()` + loop state — orchestration control
- oh-my-opencode: 41 internal hooks — proves complex mesh IS viable in plugin architecture
- plannotator: `noReply: true` — silent context injection
- dynamic-context-pruning: `messages.transform` — proves context manipulation works

**Critical pitfall (verified):** `permission.ask` exists in SDK but MUST NEVER be used — blocking tools clashes with other plugins, contradicts soft governance philosophy, and defeats the purpose (inform, don't punish).

## Implications for Roadmap

Based on research, the phase structure should follow the **mesh dependency chain**:

1. **Governance Foundation Fix** — Fix ST11/ST12 failures
   - Addresses: Bootstrap in all modes, evidence teaching from turn 0
   - Avoids: "Agents never learn governance" pitfall
   - Rationale: Nothing else matters if agents aren't taught from session start

2. **SDK Client Integration** — Wire `client`, `$`, `serverUrl` into plugin entry
   - Addresses: All 5 systems gain real capabilities (sessions, TUI, files, events)
   - Avoids: Filesystem-only governance (fragile, no real-time feedback)
   - Rationale: The SDK is the materialization layer — without it, concepts stay theoretical

3. **Event-Driven Governance** — Replace turn-counting with real events
   - Addresses: Auto-Hooks system (triggers from `session.idle`, `file.edited`, `session.diff`)
   - Avoids: Polling/counting anti-pattern
   - Rationale: Events are the nervous system of the mesh

4. **Session-as-Plan Lifecycle** — Sessions become first-class plans with SDK integration
   - Addresses: Session Management system (`client.session.*`, auto-export, long session handling)
   - Avoids: "Session = just a text file" limitation
   - Rationale: Sessions are the unit of work in the idumb-v2 model

5. **Fast Extraction & Precision Tools** — Codebase-aware agent tools
   - Addresses: Unique Agent Tools system (repomix wrap, `client.find.*`, BunShell grep/glob)
   - Avoids: "Agent can't see the codebase" blindspot
   - Rationale: Tools that make agents smarter, not just obedient

6. **Orchestration & Loop Control** — Ralph-style task orchestration
   - Addresses: System Core orchestration + Mems Brain for cross-loop memory
   - Avoids: "One-shot agent" limitation
   - Rationale: Multi-phase work requires persistent loop state

7. **Stress Test Infrastructure** — Validate the mesh under pressure
   - Addresses: All 5 systems under bombardment, 10+ compactions, framework detection
   - Avoids: "Works in demo, breaks in production"
   - Rationale: Final validation before publish

**Phase ordering rationale:**
- 1 before anything: governance is the foundation
- 2 unlocks all SDK capabilities for phases 3-6
- 3→4: events feed session lifecycle
- 5 independent but benefits from 3+4 context
- 6 benefits from all prior systems
- 7 validates everything

**Research flags for phases:**
- Phase 2: Needs careful SDK integration testing (deadlock risk during init, verified in oh-my-opencode)
- Phase 3: Standard pattern from plugins, low risk
- Phase 6: Ralph loop pattern needs deeper study (oh-my-opencode has ralph-loop hook internally)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Cognitive Mesh (5 systems) | HIGH | Directly from user's idumb-v2 diagram — this IS the product |
| SDK Capabilities | HIGH | Verified from SDK source, 8 real plugins, official docs |
| Plugin Patterns | HIGH | 8 repos downloaded and analyzed via repomix |
| Platform Portability | MEDIUM | Conceptually sound, not yet proven on Claude Code |
| Stress Test Gaps | HIGH | Verified via 6-agent parallel investigation |
| Orchestration (Ralph loop) | MEDIUM | Pattern identified in oh-my-opencode, needs deeper study |

## Gaps to Address

- How does `messages.transform` interact with HiveMind's existing compaction hook? (potential conflict)
- Ralph loop state persistence format — study oh-my-opencode's implementation
- Claude Code SDK mapping — which concepts map to which primitives
- `session.prompt({ noReply: true })` — can this inject governance context without triggering AI?
- BunShell (`$`) availability — is it always present or Bun-runtime dependent?

---
*Last updated: 2026-02-12 after SDK verification + plugin ecosystem analysis*
