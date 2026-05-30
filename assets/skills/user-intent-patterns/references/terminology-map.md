# Terminology Map: Intent Concepts Across Frameworks

Three frameworks, one problem domain: understanding what the user wants. But they speak different languages.

---

## Core Concepts: Same Idea, Different Names

| Concept | GSD | BMAD | Hivemind |
|---------|-----|------|----------|
| **Intent extraction phase** | `discuss-phase` — formal discovery before planning | Context absorption — parallel swarm ingestion of all provided material | PROBE phase — iterative questioning with stop conditions |
| **What to build** | `SPEC.md` / `PROJECT.md` — structured document with what/how | `session-context-prompt.md` — unified narrative from all absorbed sources | `intent.json` — machine-checkable JSON with 6 fields |
| **Scope boundary** | Phase scope in `ROADMAP.md` — "in scope" and "out of scope" per phase | `allowedSurfaces` in work contracts — explicit file/folder boundaries | `scope_in` + `scope_out` arrays in `intent.json` |
| **Success definition** | Phase goal + UAT criteria — verifiable acceptance tests | `requiredProof` — expected evidence before completion | `success_criteria` string — non-empty, ≥10 chars |
| **Constraints** | Dependencies + non-goals — what blocks or limits the work | `dependencies` + `nonGoals` — explicit boundaries | `constraints` array — ≥1 item |
| **Priority signal** | Phase priority in ROADMAP — ordering relative to other phases | `pressureScore` + `pressureTier` — runtime pressure classification | `priority` — "high", "medium", or "low" |
| **Work strategy** | Phase tasks — broken into individual executable steps | `taskBoundary` — bounded task scope in work contracts | `delegation` — "execute", "delegate", or "clarify" |
| **Confirmation** | User sign-off on SPEC.md before planning | Implicit — absorption synthesizes without explicit confirmation | `USER CONFIRMED: yes` in `progress.md` |
| **Persistence** | `.planning/` artifacts — SPEC.md, ROADMAP.md, PLAN.md | `hivemind-agent-work` contracts + trajectory events | `.hivemind/state/intent.json` + `progress.md` |
| **Question budget** | 3 questions per round (implicit — discuss-phase adapts) | Minimal — questions only when absorption reveals gaps | Explicit cap: max 3 per PROBE phase |
| **Stop conditions** | All phase requirements covered in SPEC.md | All required proof fields populated | 6 hard gates, all must be true |
| **Handoff format** | PLAN.md → executor subagent with full context | Work contract → delegated agent with bounded scope | Delegation packet from intent.json → subagent |

---

## Key Terminology Differences

### "Intent" vs "Requirements" vs "Context"

- **GSD** uses "requirements" — formal, spec-level language. Intent is something you extract, then transform into SPEC.md requirements. The word "intent" is rarely used directly.

- **BMAD** uses "context" — everything the user provides is context to be absorbed. "Intent" is inferred from context synthesis, not explicitly captured in a single artifact.

- **Hivemind** uses "intent" — it's the primary artifact. "User intent" is the thing you capture in intent.json. "Requirements" is downstream.

### "Phase" vs "Wave" vs "Loop"

- **GSD** has "phases" — linear progression through a roadmap. Each phase has discuss → plan → execute → verify.

- **BMAD** has "waves" — parallel bursts of activity. Multiple waves of absorption, extraction, synthesis run concurrently.

- **Hivemind** has "loops" — iterative cycles. PROBE → UNDERSTAND → PLAN → DELEGATE → UPDATE → DELIVER repeats until termination.

### "Gate" vs "Stop Condition" vs "Required Proof"

- **GSD** gates are phase boundaries — you don't move to the next phase until the current one passes verification.

- **BMAD**'s "required proof" is evidence-gated — you don't claim completion without specific proof artifacts.

- **Hivemind**'s "stop conditions" are hard gates within a phase — the PROBE phase cannot end until all 6 conditions are true.

---

## Framework-Specific Vocabulary

### GSD-Specific Terms

| Term | Definition |
|------|-----------|
| `ROADMAP.md` | Master project timeline with all phases, priorities, dependencies |
| `SPEC.md` | Phase specification — what this phase delivers |
| `PLAN.md` | Executable task breakdown with checkpoints |
| `UAT criteria` | User Acceptance Testing — how to verify the phase |
| Discuss → Plan → Execute → Verify | The 4-phase GSD workflow |
| SPIDR splitting | Spike, Pathfinder, Improver, Developer, Releaser — vertical slice decomposition |
| `gsd-discuss-phase` | The skill that runs discuss-phase |

### BMAD-Specific Terms

| Term | Definition |
|------|-----------|
| `session-context-prompt.md` | Accumulated narrative from all absorbed sources |
| Work contract | `hivemind-agent-work-create` — bounded task with proof requirements |
| Swarm absorption | Parallel multi-agent absorption of context |
| Trajectory | Execution lineage — chain of events, checkpoints, handoffs |
| Pressure score | Runtime classification of how urgently work needs attention |
| `hf-l2-context-absorb` | The skill that orchestrates BMAD absorption |

### Hivemind-Specific Terms

| Term | Definition |
|------|-----------|
| `intent.json` | Machine-checkable intent state with 6 stop condition fields |
| `question-count.json` | Tracks how many questions have been asked this PROBE phase |
| `progress.md` | Running narrative of what's been done and confirmed |
| PROBE → UNDERSTAND → PLAN → DELEGATE → UPDATE → DELIVER | The 6-phase interactive loop |
| Durable human interrupt | Persisted record of where the user was last asked a question |
| `hm-l2-user-intent-interactive-loop` | The skill that implements the loop |

---

## Conceptual Equivalents

If you know one framework, here's how to map concepts to the others:

### From GSD to Hivemind

| GSD | Hivemind Equivalent |
|-----|-------------------|
| `gsd-discuss-phase` | PROBE + UNDERSTAND phases |
| `gsd-plan-phase` | PLAN phase |
| `gsd-execute-phase` | DELEGATE phase |
| SPEC.md | intent.json + progress.md (combined) |
| UAT criteria | success_criteria + scope boundary |
| Phase priority | priority field |
| Task delegation via executor agent | delegation field + subagent dispatch |

### From BMAD to Hivemind

| BMAD | Hivemind Equivalent |
|------|-------------------|
| Context absorption (waves 1-3) | PROBE phase (passive absorption portion) |
| Narrative synthesis | UNDERSTAND phase |
| Work contract creation | Intent capture as delegation packet |
| `requiredProof` | `success_criteria` |
| `taskBoundary` | `scope_in` + `scope_out` |
| `pressureScore` | `priority` (simplified) |

### From Hivemind to GSD

| Hivemind | GSD Equivalent |
|----------|---------------|
| PROBE phase | discuss-phase |
| UNDERSTAND phase | SPEC.md authoring |
| PLAN phase | plan-phase |
| DELEGATE phase | execute-phase |
| intent.json | SPEC.md (less structured in GSD) |
| 6 stop conditions | Phase requirements coverage |
| Question cap | discuss-phase adapts (no hard cap) |

---

## Where the Frameworks Agree (Universal Truths)

Despite different terminology, all three frameworks converge on these principles:

1. **Intent must be bounded** — you need explicit scope boundaries (what's IN, what's OUT) before acting
2. **Success must be defined** — you need to know what "done" looks like before starting
3. **Questions cost attention** — you cannot ask unlimited questions without losing the user
4. **State must survive restarts** — intent that lives only in conversation memory is lost on interruption
5. **Confirmation before execution** — the user must explicitly agree to the understanding before work begins
