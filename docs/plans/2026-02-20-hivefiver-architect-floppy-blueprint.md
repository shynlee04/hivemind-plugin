# HiveFiver Architect Blueprint (floppy_engineer)

Date: 2026-02-20  
Status: Operator-ready blueprint  
Scope: Compact execution guide for `/hivefiver architect` in floppy_engineer lane

## 1) Persona and Domain Routing

- Lane: `floppy_engineer` (implementation-first, bounded by governance gates).
- Domain pack priority: engineering runtime, command orchestration, and validation stack.
- Entry rule: if user prompt is missing command context, auto-realign to `init -> spec -> research` before architecture synthesis.
- Boundary rule: architect output defines structure and next execution actions; it does not skip evidence or quality gates.

## 2) Command Workflow (Required Order)

1. `hivefiver init`
   - Initialize intent, hierarchy anchor, and active trajectory/tactic/action cursor.
2. `hivefiver spec`
   - Distill objective, constraints, acceptance criteria, and failure boundaries.
3. `hivefiver research`
   - Run internal code scan + MCP/web validation for current patterns and risks.
4. `hivefiver architect`
   - Produce architecture blueprint tied to evidence, gates, and execution sequencing.

No step may be skipped. If the command is invoked directly at `architect`, enforce recovery to missing prior steps.

## 3) Required Gates Before Architect Output

- Chain integrity gate
  - Verify `trajectory -> tactic -> action` exists and active cursor is valid.
- Role boundary gate
  - Orchestrator plans and validates; builder implements. No mixed-role output.
- Evidence gate
  - Claims must cite scan/test/research artifacts from current run.
- Quality gate
  - Architecture must include verifiable acceptance criteria and explicit non-go conditions.
- Drift gate
  - If drift or stale-gap signal is present, force context refresh before continuing.
- Flow compliance gate
  - Confirm command lineage `init -> spec -> research -> architect` is complete.

If any gate fails, architect output is blocked and recovery path is required.

## 4) Immediate Next 3 Actions

1. Run architecture handoff audit
   - Confirm current docs and hierarchy state align with this blueprint's gate sequence.
2. Generate execution packets
   - Convert approved architecture sections into implementation packets with pass/fail checks.
3. Enforce closeout protocol
   - Attach evidence snapshot, unresolved risks, and next-action seed to prevent context loss.

## 5) Failure Branches and Recovery Path

### Branch A: Missing command lineage
- Signal: `architect` invoked without `init/spec/research` artifacts.
- Recovery: route to missing step (`init` first, then replay sequence) and re-run gates.

### Branch B: Broken hierarchy chain
- Signal: missing or mismatched trajectory/tactic/action nodes.
- Recovery: restore cursor via hierarchy scan and context update; block architecture until valid.

### Branch C: Evidence deficit
- Signal: architecture claims without internal scan or external validation outputs.
- Recovery: run research gate again, attach evidence tokens, then regenerate architecture output.

### Branch D: Role boundary violation
- Signal: architect output includes implementation changes or execution-side mutation.
- Recovery: split outputs into orchestrator blueprint + builder execution plan and re-validate.

### Branch E: Drift or stale session risk
- Signal: long-gap warning, repeated confusion markers, or low-confidence context.
- Recovery: refresh context state, re-anchor active action, rerun flow compliance gate.

## 6) Completion Rule

`/hivefiver architect` is considered valid only when all gates pass, failure branches are resolved or documented, and the output contains an explicit next-action handoff with evidence links.
