# Hivemind Power-On — Governance Philosophy

This reference explains the design rationale behind the `hivemind-power-on` skill: why it loads first, why it treats tools as sources of truth, and why it enforces governance at every turn.

## Why Load First?

Every session begins in an unknown state. The agent could be:

- Starting fresh on a project with no prior sessions
- Reconnecting after a disconnect with active delegations in flight
- Resuming after a context compact (lost short-term awareness)
- Following up on a prior session from hours or days ago

Without a session governance scan, the agent is blind to the project's runtime reality. It may:
- Duplicate work already done by another session
- Miss an active delegation that needs monitoring
- Create a new delegation when a session could be resumed
- Route to the wrong specialist for the current phase

**The load-first principle** says: before any action, discover the session landscape. This is not a nice-to-have — it is a runtime prerequisite for any agent that dispatches work or makes routing decisions.

## Why Tool-First, Not Aspirational?

Prior versions of this skill described what *could* be done. The current version describes what tools *actually* do.

**The tool-first principle:**
1. Every claim must map to a tool action with verifiable parameters
2. No aspirational workflows ("you could auto-resume sessions...") without a tool that performs them
3. TBD tools are documented honestly — they exist, they have a future purpose, but they are partial today
4. When a tool's behavior changes, the skill changes with it

This principle prevents hallucination. An agent reading this skill should never say "I can auto-resume" unless a tool action enables it.

## Why Enforce Governance at Every Turn?

Session state is ephemeral. Between user turns:
- Delegations complete or fail
- New sessions are created by background processes
- Sessions expire or are cleaned up
- The project's `.hivemind/` state root may have been modified

**The every-turn principle:** Reload this skill and re-scan the session landscape at the start of every user turn. The session landscape from 5 minutes ago may be stale.

Exceptions:
- Single-turn interactions where no delegation history is needed
- When the current turn is fully self-contained (no session data required)

## Why Gate Every Delegation Return?

Every delegation that returns output must pass the quality gate triad. Without gates, delegation becomes an assembly line that produces output with no quality floor.

**The gate triad principle:**
1. **Lifecycle:** Did the delegation follow the correct mutation authority? Are CQRS boundaries intact?
2. **Spec:** Does the output trace to requirements? Are there gaps?
3. **Evidence:** Is the claimed completion backed by runtime proof? Or is it mock-only?

Gates are not optional. A delegation that returns without gate passage is not "done" — it is unvalidated output.

## Why Escalate at Depth = 3?

Delegation chains deeper than 3 levels become brittle:
- Context degrades exponentially (each child inherits less of the original intent)
- Error propagation becomes unclear (where did the failure originate?)
- Recovery cost multiplies (must reconstruct the full chain to fix anything)
- Tool budget fragmentation (each layer consumes its own budget)

**The depth-3 principle:** If more than 3 levels of delegation are needed, the workflow architecture needs rethinking. Flatten the hierarchy, split the problem differently, or restart from root with accumulated context.

## Why Honesty About Tool Limitation?

The TBD tools section exists because:
1. Agents that discover these tools need to know their honest state
2. Claiming a tool is fully operational when it is not leads to runtime failures
3. Documenting the intended future purpose guides roadmap awareness

The PARTIAL classification is not a failure — it is an honest signal to agents and users about what works today and what is still evolving.
