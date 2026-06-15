# Spec-Lock Workflow

Follow this workflow when the user asks to turn intent into locked requirements or implementation-compliance checks.

## Checklist

- [ ] Name the source artifact, source owner/audience, and requested output.
- [ ] Extract explicit MUST/SHOULD/MAY statements and implicit correctness/security/data-integrity requirements.
- [ ] Run the ambiguity gate; rewrite once with measurable proxies or block.
- [ ] Create one-condition REQ rows with source quote/path and verification method.
- [ ] Derive positive, negative, boundary, and integration cases where applicable.
- [ ] Map existing implementation/tests if this is a compliance task.
- [ ] Produce a handoff packet for test-first execution or return blocked requirements.

## Stop States

| Stop state | Use when | Output |
|---|---|---|
| `missing-source` | No PRD/spec/story/contract/brief exists. | Ask for source artifact or produce only a discovery checklist. |
| `ambiguous-source` | Actor, threshold, output, or verification method is missing. | Blocked REQ rows plus smallest clarifying question. |
| `source-conflict` | Two source statements contradict and no priority rule exists. | Both citations plus decision needed. |
| `tooling-blocked` | Required inspection/test command cannot run. | Attempted command/evidence plus fallback/manual option. |
