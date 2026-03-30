# Anti-Patterns Compendium

Complete catalog of anti-patterns organized by category. Reference for all routing, delegation, session, and gatekeeping errors.

---

## Table of Contents

- [Delegation Anti-Patterns](#delegation-anti-patterns)
- [Session Anti-Patterns](#session-anti-patterns)
- [Orchestration Anti-Patterns](#orchestration-anti-patterns)
- [Gatekeeping Anti-Patterns](#gatekeeping-anti-patterns)

---

## Delegation Anti-Patterns

### AP-D01: Delegating Without Context Check
**Pattern:** Dispatch subagents without running Context Integrity Gate first.
**What happens:** Agent works on stale state. Implements against deleted APIs. Duplicates in-progress work.
**Fix:** Always run the Context Integrity Gate before ANY delegation.

### AP-D02: Assuming Fresh Start on Next Prompt
**Pattern:** Treat user's next prompt as "start fresh" without checking existing workflow state.
**What happens:** Abandons work in progress. Creates conflicting plans. Wastes agent cycles.
**Fix:** Check `.hivemind/activity/state/` and `continuity.json` before acting.

### AP-D03: Recursive Delegation Without Parent Context
**Pattern:** Sub-agent delegates its own sub-delegations without consuming parent planning documents or governance context.
**What happens:** Sub-delegations lack scope boundaries. Overlap with other agents. Miss governance constraints.
**Fix:** Check delegation packet's parent planning documents before dispatching sub-delegations.

### AP-D04: Re-Delegating Already-Delegated Work
**Pattern:** Create new delegation packets without checking registry for active/completed delegations.
**What happens:** Duplicate agent work. Race conditions. Wasted compute.
**Fix:** Check `.hivemind/activity/delegation/registry.json` before creating new packets.

### AP-D05: How-To-Implement in Delegation Packet
**Pattern:** Specify exact function signatures, algorithms, or code in the delegation packet.
**What happens:** Agent implements your bad design. You own the bugs. Agent expertise wasted.
**Fix:** Specify scope, constraints, success criteria only. Let the specialist decide implementation.

### AP-D06: Dispatching Without Packet
**Pattern:** Send vague instructions like "fix the bug" without formal delegation packet.
**What happens:** Agent guesses at scope. Implements wrong fix. No return contract to verify against.
**Fix:** Always emit delegation packet with scope, constraints, expected return.

### AP-D07: Surface-Level Dispatch
**Pattern:** Send work without prior investigation wave.
**What happens:** Agent guesses at root cause. Implements wrong fix. Breaks something else.
**Fix:** Wave 1 always starts with investigation. Always.

---

## Session Anti-Patterns

### AP-S01: Trusting Post-Disconnect Context
**Pattern:** Assume prior context is trustworthy after session disconnect or compaction.
**What happens:** Continuity.json references deleted files. Agent works on dead APIs.
**Fix:** Run context health gate. Check git status. Verify continuity.json.

### AP-S02: Skipping Context Gate on Resume
**Pattern:** Resume work after `/clear` or session interrupt without running context health verification.
**What happens:** Continues work that was already abandoned or completed. Uses stale state.
**Fix:** Load continuity.json. Verify task state. Run context health gate first.

### AP-S03: Treating Cancel+Resume as Continuation
**Pattern:** Assume the user's new message continues prior work when it may contradict it.
**What happens:** Continues down wrong path. Ignores user's actual new intent.
**Fix:** Treat new message as fresh intent. Verify alignment before resuming.

### AP-S04: Ignoring Context Drift
**Pattern:** Use stale context after multiple cycles without re-verification.
**What happens:** Continuity.json references deleted files. Plans reference non-existent modules.
**Fix:** Run context health gate between cycles. Re-verify after compaction.

---

## Orchestration Anti-Patterns

### AP-O01: Reading Code Yourself
**Pattern:** Orchestrator reads source files to understand problems instead of delegating to hivexplorer.
**What happens:** 30 minutes of context loading. Orchestrator session bloated. Still didn't dispatch.
**Fix:** Dispatch hivexplorer swarm. Read compressed synthesis. Move on.

### AP-O02: Doing Work Instead of Delegating
**Pattern:** Orchestrator implements code, writes tests, or creates plans directly.
**What happens:** Orchestrator stops orchestrating. Other agents idle. Context accumulates in wrong session.
**Fix:** Delegate implementation to hivemaker. Testing to hitea. Planning to hiveplanner.

### AP-O03: Static Skill Set
**Pattern:** Load skills at session start, never adjust during workflow.
**What happens:** Implementation phase runs with investigation skills loaded. Agent lacks TDD enforcement.
**Fix:** Rotate skill batch as phases change. Load context domain on drift.

### AP-O04: Over-Parallelization
**Pattern:** Dispatch many agents simultaneously with shared mutable state.
**What happens:** Race conditions. Conflicting edits. Merge hell.
**Fix:** Parallel only when slices are isolated. Sequential when state is shared.

### AP-O05: Instructing on How-To-Implement
**Pattern:** Tell agents exactly what code to write instead of what process to follow.
**What happens:** Agent implements your design. You own the bugs.
**Fix:** Instruct on HOW-TO-PROCESS: scope, constraints, success criteria, evidence requirements.

---

## Gatekeeping Anti-Patterns

### AP-G01: Accepting "Done" Without Evidence
**Pattern:** Agent says "done, tests pass" without providing verification output.
**What happens:** Tests were never run. Code doesn't compile. Downstream agents build on broken foundation.
**Fix:** Demand evidence bundle. Verify output file exists. Check gate results.

### AP-G02: Reading Code to Verify
**Pattern:** Orchestrator reads code to verify agent's work instead of running verification commands.
**What happens:** Slow verification. Misses runtime errors. Injects orchestrator bias.
**Fix:** Delegate to hiveq. Run verification commands. Read only the compressed return.

### AP-G03: Parallel Dispatch With Shared State
**Pattern:** Dispatch parallel agents that share files or mutable state without independence proof.
**What happens:** Race conditions. Conflicting edits. Corrupted state.
**Fix:** Prove independence (no shared files, no shared state) before parallel dispatch.

### AP-G04: Loading Skills Inline
**Pattern:** Orchestrator loads depth skills and does implementation work itself.
**What happens:** Violates orchestrator mandate. Session bloats. Delegation model collapses.
**Fix:** Delegate to hivefiver subagent. Orchestrator routes only.

---

_Meta: purpose=all-anti-patterns-organized-by-category | loaded_when=anti-pattern-review-or-error-prevention | parent_skill=use-hivemind_
