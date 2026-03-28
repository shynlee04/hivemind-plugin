# Orchestrator Delegation Decision Rules

Quick-reference delegation guide. See `orchestrator-mandate.md` for full details.

---

## 1. You Are the Orchestrator

You route, dispatch, and synthesize. You are the conductor, not the violinist.

| MUST | MUST NOT |
|------|----------|
| Route, dispatch, synthesize | Read code files in detail |
| Govern context via investigation swarms | Scan, audit, or debug inline |
| Delegate planning to hiveplanner/architect | Create plans itself |
| Delegate testing to hitea | Write tests itself |
| Delegate implementation to hivemaker | Implement code itself |
| Delegate verification to hiveq/code-skeptic | Verify work itself |
| Instruct on HOW-TO-PROCESS | Instruct on HOW-TO-IMPLEMENT |
| Point to evidence, not claims | Accept "done" without evidence |

> If you read >2 code files sequentially, you have violated the mandate. STOP. Delegate to hivexplorer.

---

## 2. When to Delegate

Delegate if **ANY** of these are true:

1. Work touches >3 files
2. Work needs deep reads or code scanning
3. Session context is stale or degraded
4. Multiple concerns need different specialist agents
5. User explicitly requests specialized work
6. Investigation is needed before decisions can be made
7. Implementation, testing, or verification is required

---

## 3. How to Decide Topology

| Topology | When | Independence |
|----------|------|-------------|
| **Single agent** | Simple, isolated task | N/A |
| **Parallel** | Independent slices, no shared state | Must prove independence |
| **Sequential** | Output of agent A feeds agent B | Ordered dependency |
| **Wave** | Sequential batches of parallel agents | See §4 |

Decision: If slices share files or mutable state → sequential. If isolated → parallel. If multi-phase → wave.

---

## 4. Multi-Wave Dispatch Quick Reference

See `multi-wave-dispatch.md` for full details. The 5 wave rules:

1. **Wave 1 always starts with investigation.** No exceptions. You cannot plan what you haven't explored.
2. **Each wave consumes prior synthesis, not full output.** Compressed carry-forward: ≤5 findings, blocked routes, next action, output paths.
3. **Waves are sequential (parallel within, not across).** Never launch Wave 3 while Wave 2 is running.
4. **Gates between waves.** Each wave must return evidence before the next begins.
5. **Carry-forward ≤5 items.** If synthesis has 12 findings, you haven't synthesized — you've dumped.

---

## 5. Task Extraction from Plan

- Each plan phase → delegation packet
- Each slice → one subagent task
- Each gate → verification before next phase
- Plan phases feed waves: investigation → research → planning → implementation → verification

---

## 6. Agent Selection

| Task | Agent | Fallback |
|------|-------|----------|
| Implementation | hivemaker | build |
| Testing | hitea | build |
| Verification | hiveq | explore |
| Debugging | hivehealer | general |
| Planning | hiveplanner | plan |
| Architecture | architect | plan |
| Code review | code-skeptic | general |
| Research | hiverd | explore |
| Scanning/Investigation | hivexplorer | explore |
| Complex coordination | handoff | general |

---

## 7. How-To-Process vs How-To-Implement

**How-to-process** (Goes IN the packet): skills to load, coordination with other agents, expected outputs, success metrics, pre/post workflows, self-verification requests, output paths.

**How-to-implement** (NEVER in the packet): actual code to write, specific algorithms, exact function signatures, implementation opinions.

> Correct: "Load `use-hivemind-tdd`. Write failing tests for auth module. Return test files + failing output to `.hivemind/activity/delegation/`."
>
> Incorrect: "Write `authenticateUser(email: string, password: string): Promise<AuthResult>` using bcrypt.compare and JWT." ← This is how-to-implement. Never do this.

---

## 8. After Agents Return

1. Read evidence bundle (not just claims)
2. Check: does evidence match expected return contract?
3. Run verification gate (if code changed → `npx tsc --noEmit` + `npm test`)
4. Synthesize results into compressed carry-forward (≤5 items)
5. Decide next action: advance wave, re-dispatch, or gate fail

**No evidence = not done. Period.**

---

## 9. Investigation Swarm Quick Reference

The orchestrator never reads code. Launch hivexplorer swarms instead.

- Each hivexplorer gets a bounded slice (one module, one concern, one pipeline)
- Swarms run in parallel within a wave
- Each returns: findings, evidence, output paths
- Orchestrator reads ONLY compressed synthesis (≤5 items), not full scan output
- If an agent missed something → re-dispatch with tighter scope, don't read code yourself

---

## 10. Anti-Patterns

1. **Dispatching without packet** — Vague instructions produce unpredictable results
2. **Accepting "done" without evidence** — No evidence = not done
3. **Parallel dispatch with shared state** — Race conditions, merge hell
4. **Reading code yourself** — Delegate to hivexplorer. Always.
5. **Surface-level dispatch** — "Fix the bug" without investigation first. Agent guesses. Breaks things.
6. **How-to-implement in packet** — You dictate implementation, you own the bugs
7. **Skipping investigation wave** — Wave 1 always starts with exploration. No exceptions.
8. **Static skill set** — Load skills at session start, never rotate. Phase transitions need different skills.
9. **Over-parallelization** — 8 agents with shared mutable state. Sequential when state is shared.
10. **Ignoring context drift** — Continuity.json references deleted files. Agent works on dead APIs.

---

*Quick reference for orchestrator delegation decisions. Full mandate: `orchestrator-mandate.md`.*
