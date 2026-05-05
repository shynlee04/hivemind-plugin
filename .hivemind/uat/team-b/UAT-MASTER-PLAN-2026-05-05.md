# GSD-UAT Team B — Master Test Plan
**Date:** 2026-05-05
**Team:** Team B (parallel comparison track)
**Scope:** All Hivemind harness custom tools & features (NOT MCP tools)

---

## Agent Landscape (86 total)
- **hm-***: 32 agents (L0: 1, L1: 1, L2: 30)
- **hf-***: 10 agents (L0: 1, L1: 1, L2: 8)
- **gsd-***: 34 agents (specialist subagents)
- **internal**: 10 agents (build, conductor, critic, general, etc.)

---

## 3 Feature Paths

### Path 1: Agent-Callable Tools & Skills (Deterministic invocation)
**Sub-groups:**
1. **Task Management**: delegate-task, delegation-status, nl-route, todowrite
2. **Delegation/Coordination**: L0→L1→L2 delegation chain, WaiterModel dispatch, dual-signal completion
3. **Context & Memory**: session-journal-export, prompt-skim, prompt-analyze, session-patch
4. **Hivemind CRUD**: configure-primitive, hivemind-doc, hivemind-trajectory, hivemind-pressure, hivemind-sdk-supervisor, hivemind-command-engine, hivemind-agent-work-create/export

### Path 2: Runtime Programmatic (Auto-wiring, hooks, transformations)
**Sub-groups:**
1. **Hook Composition**: session.created, session.updated, session.deleted, session.idle, tool.execute.after
2. **Prompt Transformation**: prompt-skim/analyze pipeline, prompt-repackager
3. **Auto-routing**: nl-route natural language routing, lineage-router skill dispatch
4. **Lifecycle State Machine**: SessionLifecyclePhase transitions, completion detection

### Path 3: Governance, Permissions, Registry & Configuration
**Sub-groups:**
1. **Permissions**: tool capability matrix enforcement, depth-based access control
2. **Registry**: configure-primitive (agent/command/skill CRUD), validate-restart
3. **Stack & Chain**: skill loading lineage, tech-context-compliance, tech-stack-ingest
4. **Configuration**: runtime-policy, circuit breaker thresholds, budget policies

---

## 3 Phases

### Phase 1: Individual & Single-Group Live Testing
- Each tool tested individually with real invocations
- Raw system response logging
- Basic → Advanced use cases per tool
- Stack within sub-groups for combined testing

### Phase 2: Cross-Primitive Integration Testing
- Tools tested in combination with correct OpenCode primitives
- Agents + Skills + Commands working together
- Cross-path interactions (Path 1 + Path 2, Path 2 + Path 3, etc.)
- Multi-level delegation chains (L0→L1→L2)

### Phase 3: Workflow & Audit
- Full workflow runs (end-to-end lifecycle)
- Integration compliance checks
- OpenCode SDK compliance validation
- Production-readiness assessment
- Gap/debt analysis → new workstream proposals

---

## Test Execution Rules
1. **Never read project source code** — rely on system responses only
2. **Never test MCP tools** — only Hivemind harness tools
3. **Log every system response** — raw output to disk
4. **No assumptions** — act as blind end-user
5. **End-to-end lifecycle** — no partial conclusions
6. **Team-B marker** — all outputs tagged with `team-b`
7. **Write to disk frequently** — context will be lost on compact

---

## Batch Processing
- Phase 1: 6 batches (2 per path × 3 paths)
- Phase 2: 4 batches (cross-path combinations)
- Phase 3: 3 batches (audit, compliance, production)
- **Total: 13 batches**
