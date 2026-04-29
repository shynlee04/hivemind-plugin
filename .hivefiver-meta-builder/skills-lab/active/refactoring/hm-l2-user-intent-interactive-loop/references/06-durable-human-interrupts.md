# Durable Human Interrupts

Use this reference when the interaction loop must wait for a user answer, approval, edit, auth action, or checkpoint verification.

## Interrupt Record

```yaml
interrupt_id: "<stable id>"
created_at: "<iso timestamp>"
phase: "PROBE"
question_count: 1
payload:
  prompt: "<question/checkpoint>"
  options: ["approve", "reject", "modify"]
required_response_shape: "one of options"
state_snapshot:
  intent_json: ".opencode/state/intent.json"
  progress: "progress.md"
resume_pointer: "run intent-verify.sh --probe after response"
```

## Resume Procedure

1. Load the latest interrupt record.
2. Verify the referenced state snapshot exists.
3. Validate the user's response matches `required_response_shape`.
4. Apply the response to `intent.json` and `progress.md`.
5. Continue from `resume_pointer`; do not restart PROBE unless the state is missing.

## Rejection Rules

- Do not ask a fourth PROBE question after resume; persisted count still applies.
- Do not treat plain chat history as a durable checkpoint.
- Do not ask for human verification without clear options and continuation point.
