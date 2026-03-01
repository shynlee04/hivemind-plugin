# Intent Pipeline Definitions

> SOT for intent → stage sequence mapping. Every intent MUST have a defined pipeline.
> Used by: router (hivefiver.md), pipeline-orchestrator.sh, gate-check.sh

---

## Intent → Pipeline Map

| Intent | Pipeline ID | Stage Sequence | Approval Gates | Bypass Stages |
|--------|-------------|----------------|----------------|---------------|
| build_new | full_build | start → discovery → intake → spec → architect → build | spec_approval, architect_approval | — |
| extend | full_build | start → discovery → intake → spec → architect → build | spec_approval, architect_approval | — |
| fix_broken | doctor_fix | start → doctor | — | intake, spec, architect, build |
| audit_health | audit_only | start → audit | — | intake, spec, architect, build |
| improve | audit_then_build | start → audit → intake → spec → architect → build | audit_triage, spec_approval | discovery |
| learn | guided_onboard | start → discovery | — | intake, spec, architect, build |
| custom | adaptive | start → discovery → (classify → route) | discovery_triage | — |

---

## Pipeline Definitions

### full_build (build_new, extend)

```
start ──────> discovery ──────> intake ──────> spec ──────> architect ──────> build
  │             │                  │              │             │               │
  │ Gate:       │ Gate:            │ Gate:        │ Gate:       │ Gate:         │ Gate:
  │ classify    │ profile+QA       │ 9 inputs     │ 0 TBD      │ acyclic deps  │ contracts
  │ intent      │ ambiguity=0     │ ambiguity=0  │ measurable  │ no G-01..G-10 │ cross-ref
  └─────────────└─────────────────└──────────────└─────────────└───────────────└──> DONE
```

**Stage transitions:**
- start → discovery: Always (intent classified as build_new or extend)
- discovery → intake: Ambiguity gate passes (unresolved_critical=0, unresolved_minor≤1)
- intake → spec: All 9 inputs collected, ambiguity_count=0
- spec → architect: Gate 1 passes (no TBD, measurable criteria, valid deps)
- architect → build: Gate 2 passes (acyclic deps, no anti-patterns)
- build → DONE: Gate 3 passes (contracts valid, cross-refs clean)

**Checkpoint fields:**
- pipeline_active=true
- completed_stages accumulates: start,discovery,intake,spec,architect,build
- last_checkpoint updated at each gate

---

### doctor_fix (fix_broken)

```
start ──────> doctor ──────> [verify] ──────> DONE
  │             │                │
  │ Gate:       │ Gate:          │ Gate:
  │ classify    │ root cause     │ re-scan
  │ intent      │ identified     │ clean
  └─────────────└────────────────└──> DONE (or loop doctor)
```

**Stage transitions:**
- start → doctor: Intent classified as fix_broken
- doctor → verify: All proposed fixes applied with user approval
- verify → DONE: Re-scan shows zero new broken refs

**QA integration:**
- Doctor invokes journey-intake-qa.sh with `fix_broken` intent for diagnostic questions
- Questions focus on: symptoms, affected assets, when it broke, what changed

---

### audit_only (audit_health)

```
start ──────> audit ──────> [doctor if critical] ──────> DONE
  │             │                │
  │ Gate:       │ Gate:          │ Gate:
  │ classify    │ scan complete  │ fixes applied
  │ intent      │ report emitted │ or acknowledged
  └─────────────└────────────────└──> DONE
```

**Stage transitions:**
- start → audit: Intent classified as audit_health
- audit → doctor: If critical findings found, recommend escalation
- audit → DONE: If no critical findings, report emitted

**QA integration:**
- Audit invokes journey-intake-qa.sh with `audit_health` intent for scoping questions
- Questions focus on: audit scope (full/partial), asset types to check, known concerns

---

### audit_then_build (improve)

```
start ──> audit ──> [triage] ──> intake ──> spec ──> architect ──> build ──> DONE
  │         │          │           │          │          │            │
  │ Gate:   │ Gate:    │ Gate:     │ Same as full_build pipeline     │
  │ classify│ findings │ user      │          │          │            │
  │ intent  │ report   │ approves  │          │          │            │
  └─────────└──────────└───────────└──────────└──────────└────────────└──> DONE
```

**Stage transitions:**
- start → audit: Intent classified as improve
- audit → triage: Findings report emitted
- triage → intake: User approves which findings to address (audit_triage gate)
- intake → build: Same as full_build pipeline

**Note:** Improve skips discovery (user already knows what they want improved — audit identifies specifics)

---

### guided_onboard (learn)

```
start ──────> discovery ──────> [route to intent]
  │             │                  │
  │ Gate:       │ Gate:            │
  │ classify    │ user understands │
  │ intent      │ framework basics │
  └─────────────└──────────────────└──> (new intent or END)
```

**Stage transitions:**
- start → discovery: Intent classified as learn
- discovery: Run guided onboarding, explain framework capabilities
- discovery → route: If user forms a concrete intent, reclassify and route to appropriate pipeline
- discovery → END: If user is satisfied with learning, pipeline closes

---

### adaptive (custom/unknown)

```
start ──────> discovery ──────> [classify] ──────> [route to correct pipeline]
  │             │                  │
  │ Gate:       │ Gate:            │
  │ no match    │ intent emerges   │
  │ initially   │ from QA          │
  └─────────────└──────────────────└──> (correct pipeline)
```

**Stage transitions:**
- start → discovery: Intent unknown, needs clarification
- discovery: Guided QA determines what user actually needs
- classify: Re-run classify-intent.sh with clarified input
- route: Route to the appropriate pipeline (full_build, doctor_fix, audit_only, etc.)

---

## Approval Gates

| Gate Name | Trigger | Requires |
|-----------|---------|----------|
| spec_approval | spec → architect | User confirms spec is correct |
| architect_approval | architect → build | User confirms architecture design |
| audit_triage | audit → intake (improve only) | User selects which findings to fix |
| discovery_triage | discovery → next (custom only) | User confirms classified intent |

---

## Error Recovery Paths

| Error State | Detection | Recovery |
|-------------|-----------|----------|
| Stage failure | gate_check returns allowed=false | Roll back to last completed stage, report what failed |
| Pipeline stall | pipeline_active=true but no progress for >1 session | Offer: resume, restart from checkpoint, or abandon |
| Delegation failure | validate-delegation.sh verify-return fails | Retry delegate, or escalate to user |
| Quality failure | quality-check.sh returns critical findings | Fix findings before advancing (doctor or manual) |
| Context exhaustion | session approaching limits | Auto-checkpoint via session-continue.sh, spawn fresh session |

### Error State Fields (STATE.md Pipeline State)

| Field | Values | Purpose |
|-------|--------|---------|
| pipeline_error | empty \| error description | Current error state |
| last_checkpoint | empty \| stage:timestamp | Last successful checkpoint |
| error_recovery | empty \| retry \| rollback \| abandon | Recovery action taken |

---

## Stage → QA Question Integration

| Stage | QA Script Invocation | Purpose |
|-------|---------------------|---------|
| discovery | `journey-intake-qa.sh auto $MATURITY $COMPLEXITY` | Guided requirement clarification |
| intake | `journey-intake-qa.sh auto $MATURITY $COMPLEXITY` | Structured 9-input collection |
| audit | `journey-intake-qa.sh auto L1 medium` | Audit scoping questions |
| doctor | `journey-intake-qa.sh auto L1 medium` | Diagnostic questions |
| spec | — | No QA (transforms intake output) |
| architect | — | No QA (transforms spec output) |
| build | — | No QA (executes architecture) |

---

## Delegation per Stage

| Stage | Delegate To | Delegation Template | Purpose |
|-------|-------------|---------------------|---------|
| start | — | — | Self-handled |
| discovery | — | — | Self-handled (guided QA) |
| intake | hivexplorer | investigation_template | Investigate existing assets if user references them |
| spec | — | — | Self-handled (transform intake) |
| architect | hiveplanner | planning_template | Complex dependency graphs |
| build | hivefiver (self) | stage_continuation | Self-delegate if context approaching limits |
| audit | hivexplorer | investigation_template | Parallel asset scanning |
| doctor | hivexplorer | investigation_template | Diagnose broken chains |
| ANY→ANY | hivefiver (self) | checkpoint_resume | Cross-session continuation |
| audit→doctor | hivefiver (self) | audit_doctor_escalation | Escalate critical findings |
| discovery→intake | hivefiver (self) | discover_intake_transition | Promote from discovery to intake |
