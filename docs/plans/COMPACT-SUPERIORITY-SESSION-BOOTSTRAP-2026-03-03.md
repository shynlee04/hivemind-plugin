# Compact Superiority — Session Bootstrap Package

> **Document ID:** COMPACT-SUPERIORITY-SESSION-BOOTSTRAP-2026-03-03  
> **Date:** 2026-03-03  
> **Purpose:** Deterministic session packet for three downstream compact processes with observation + context append contracts  
> **Scope:** Documentation-only execution bootstrap

**Terminology policy note:**
- **OpenCode terminology is canonical for project artifacts.**
- **Kilocode mode terminology is orchestration-only for this development environment.**

---

## 1) New Session Packet

### Packet ID
`CS-BOOTSTRAP-P8-2026-03-03`

### Packet objective
Run three compact downstream processes in strict order to:
1. Close governance/path/runtime blockers,
2. Produce gate-evidence packets,
3. Establish release-adjudication readiness baseline.

### Packet sequence (fixed)
1. **Process A — Contract Convergence Process**
2. **Process B — Runtime Integrity Process**
3. **Process C — Compact Core Readiness Process**

No reordering is allowed.

---

## 2) Process A — Contract Convergence Process

### Objective
Converge active governance contracts into one canonical matrix using OpenCode-canonical project terminology and explicit orchestration-only aliases where needed.

### Entry criteria
- Session bootstrap packet is loaded.
- P0 contradictions are still open.
- Current context includes the master synthesis artifact and phase-tracking artifact.

### Exact prompt block
```text
[PROCESS-A: CONTRACT-CONVERGENCE]
You are executing Process A in compact sequence.

Goal:
- Produce one canonical governance contract matrix that resolves:
  1) main-session vs sub-session vs continuity recovery confirmation behavior,
  2) governance semantic field ambiguity,
  3) terminology boundary drift between OpenCode-canonical wording and environment-only mode aliases.

Constraints:
- Documentation output only.
- Use OpenCode-canonical terminology in project artifacts.
- Use Kilocode mode terminology only when labeling internal orchestration lanes.
- Explicitly mark superseded legacy wording.
- Include evidence links to current planning artifacts.

Required outputs:
- Contract Matrix
- Terminology Normalization Ledger
- Conflict Closure Register

Stop only when all Process A outputs are complete and closure status is explicit.
```

### Outputs
1. Canonical contract matrix (session-type behaviors + governance semantics)
2. Terminology normalization ledger
3. Conflict closure register (open/closed per conflict ID)

### Stop criteria
- G0 evidence package is complete.
- No unresolved confirmation-policy contradiction remains in active operational contract text.

---

## 3) Process B — Runtime Integrity Process

### Objective
Stabilize runtime prerequisites: path canonicality, CQRS boundary enforcement, and compaction authority singularity.

### Entry criteria
- Process A outputs are complete and attached.
- Canonical contract matrix has been accepted as active source.

### Exact prompt block
```text
[PROCESS-B: RUNTIME-INTEGRITY]
You are executing Process B in compact sequence.

Goal:
- Produce runtime integrity evidence for:
  1) path canonicality closure,
  2) CQRS hard-boundary closure,
  3) compaction authority unification decision.

Constraints:
- Documentation output only.
- No implementation edits.
- Use resolver-first path language and queue-boundary terminology.
- Every claim must map to current evidence artifacts.

Required outputs:
- Path Lint Closure Report
- CQRS Boundary Evidence Packet
- Compaction Authority Decision Record

Stop only when all three outputs are complete and PASS/PARTIAL/FAIL is explicit per gate.
```

### Outputs
1. Path lint closure report
2. CQRS boundary evidence packet
3. Compaction authority decision record

### Stop criteria
- G1, G2, and G3 each have explicit adjudication.
- Any non-PASS item is captured with rollback trigger and corrective packet requirement.

---

## 4) Process C — Compact Core Readiness Process

### Objective
Prepare and adjudicate compact-core readiness for CIS/RLE/AEM/PDF rollout without bypassing unresolved upstream blockers.

### Entry criteria
- Process B outputs are complete.
- Runtime integrity gates are adjudicated and attached.

### Exact prompt block
```text
[PROCESS-C: COMPACT-CORE-READINESS]
You are executing Process C in compact sequence.

Goal:
- Build final readiness package for phased compact-core rollout:
  CIS -> RLE -> AEM -> PDF.
- Recompute release adjudication readiness under current gate outcomes.

Constraints:
- Documentation output only.
- Preserve strict phase order.
- No release-ready claim if any P0 blocker remains open.
- Use OpenCode-canonical terminology in project artifacts.
- Use Kilocode mode labels only for internal orchestration metadata.

Required outputs:
- P3/P4 Readiness Packet
- Integrated Validation Packet
- Release Adjudication Memo (PASS/PARTIAL/FAIL)

Stop only when release posture is explicitly stated and blocker carry-forward list is finalized.
```

### Outputs
1. P3/P4 readiness packet
2. Integrated validation packet
3. Release adjudication memo

### Stop criteria
- G4/G5 status is explicit.
- Rollout status is clearly declared as release-ready or blocked.
- If blocked, carry-forward obligations are enumerated with next-session entry conditions.

---

## 5) How to Start Session (Copy-Paste Block)

```text
[START-COMPACT-SUPERIORITY-SESSION]
Session Packet ID: CS-BOOTSTRAP-P8-2026-03-03

Execute in strict order:
1) Process A — Contract Convergence Process
2) Process B — Runtime Integrity Process
3) Process C — Compact Core Readiness Process

Execution Rules:
- Documentation-only outputs.
- OpenCode-canonical terminology for project-facing artifacts.
- Kilocode mode labels only for orchestration metadata.
- No implementation edits.
- Context append is mandatory after each process.
- Stop immediately at declared stop criteria for each process.
```

---

## 6) Context Append Contract (Mandatory After Each Process)

After finishing each process, paste back exactly this structure:

```text
[CONTEXT-APPEND]
Packet ID: CS-BOOTSTRAP-P8-2026-03-03
Process: A|B|C
Gate Status:
- G0: PASS|PARTIAL|FAIL
- G1: PASS|PARTIAL|FAIL
- G2: PASS|PARTIAL|FAIL
- G3: PASS|PARTIAL|FAIL
- G4: PASS|PARTIAL|FAIL
- G5: PASS|PARTIAL|FAIL

Outputs Produced:
1) <artifact-title>
2) <artifact-title>
3) <artifact-title>

Open Blockers:
- <P0/P1/P2 item + impact + mitigation>

Carry-Forward Actions:
- <action 1>
- <action 2>

Readiness Statement:
- <one-line statement>
[/CONTEXT-APPEND]
```

Contract rules:
1. Do not omit gate status fields.
2. Do not collapse blocker priority.
3. Use OpenCode-canonical terminology in artifacts; allow Kilocode mode aliases only in orchestration metadata.
4. Include explicit readiness statement every time.

---

## 7) Compact Continuity Handoff Format

Use this handoff when transferring to the next session:

```text
[COMPACT-CONTINUITY-HANDOFF]
Handoff ID: CCH-2026-03-03-<sequence>
From Packet: CS-BOOTSTRAP-P8-2026-03-03
Last Completed Process: A|B|C
Current Rollout Phase: P0|P1|P2|P3|P4|P5

Gate Snapshot:
G0=<status>; G1=<status>; G2=<status>; G3=<status>; G4=<status>; G5=<status>

Confirmed Outputs:
- <artifact-path-or-title>
- <artifact-path-or-title>

Unresolved Blockers:
- <priority>: <blocker> | Impact: <impact> | Next mitigation: <action>

Next Session Entry Criteria:
- <criterion 1>
- <criterion 2>

Orchestration Lane Recommendation:
- Primary: <mode>
- Secondary: <mode>

Final Continuity Note:
- <deterministic next-start instruction>
[/COMPACT-CONTINUITY-HANDOFF]
```

---

## Final bootstrap statement

This bootstrap package defines a deterministic, observable three-process compact flow with mandatory context append and continuity handoff contracts, preserving OpenCode-canonical artifact terminology while allowing Kilocode mode labels for orchestration mechanics only.
