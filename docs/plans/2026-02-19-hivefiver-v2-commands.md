# HiveFiver v2 Commands - Implementation Artifact

## Canonical Command
- `/hivefiver <action>`

## Canonical Actions
- `init`, `spec`, `architect`, `workflow`, `build`, `validate`, `deploy`, `research`, `audit`, `tutor`

## Compatibility Layer
- Legacy commands retained.
- Alias commands added for v2 action parity.

## UX Contract
- Tab-structured outputs.
- Progress meter and gate status in each command response.
- MCQ-first interactions in onboarding/spec/tutor flows.

## Validation Loops
- Spec/research/tutor flows include max 10-attempt retry protocol.
