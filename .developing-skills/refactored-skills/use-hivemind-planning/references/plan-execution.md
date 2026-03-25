# Plan Execution

## The Flow

1. Load plan → review critically
2. Extract all tasks with full text
3. Create TodoWrite with all tasks
4. Per task:
   a. Mark `in_progress`
   b. Follow each step exactly
   c. Run verifications as specified
   d. Mark `completed`
5. After all tasks complete → finishing workflow

## Stop and Ask When

- Hit a blocker (missing dependency, test fails, unclear instruction)
- Plan has critical gaps
- You don't understand an instruction
- Verification fails repeatedly (3+ attempts on same issue)

## Revisit Earlier Steps When

- Partner updates plan based on feedback
- Fundamental approach needs rethinking
- New evidence contradicts initial assumptions
- Gate criteria reveal downstream dependency on earlier phase

## Don't

- Force through blockers — stop and escalate
- Skip verifications — every gate must pass
- Guess at unclear instructions — ask for clarification
- Start on `main`/`master` without explicit consent
- Mark tasks complete without running specified verifications
- Accumulate partial progress without checkpointing
