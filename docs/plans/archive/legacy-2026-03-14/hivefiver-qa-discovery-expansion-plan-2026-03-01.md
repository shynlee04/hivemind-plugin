# HiveFiver QA Discovery Expansion Plan

Date: 2026-03-01
Owner: hivefiver
Status: in_progress
Scope: .opencode/** and .hivemind/** only

## Objective

Add deterministic, spec-driven requirement clarification mechanics for user journeys that need brainstorming, pain discovery, and QA-oriented intake before build.

## User Intent Coverage

This expansion targets the existing start-stage intents and deepens the intake path:

- build_new
- extend
- improve
- learn (guided)

The doctor and audit paths remain unchanged.

## Skill Inputs (Found + Selected)

Selected as input patterns for this expansion:

1. brainstorming (holistic ideation and constraint probing)
2. qa-test-planner (spec and acceptance criteria orientation)
3. find-skills (discovery and candidate retrieval)

These are used as design references. No external skill install is required for this iteration.

## Planned Assets

1. New script:
   - `.opencode/skills/hivefiver-coordination/scripts/journey-intake-qa.sh`
   - Deterministic output: JSON question pack by intent and maturity level

2. New command:
   - `.opencode/commands/hivefiver-discovery.md`
   - Guided requirement and pain discovery entry point

3. Expansion of intake command:
   - `.opencode/commands/hivefiver-intake.md`
   - Inject deterministic question pack from journey-intake-qa.sh

4. New reference document:
   - `.opencode/skills/hivefiver-coordination/references/qa-discovery-playbook.md`
   - Question taxonomy, risk signals, and acceptance criteria mapping

5. Router integration:
   - `.opencode/commands/hivefiver.md`
   - Add `discovery` route to deterministic command table

## Deterministic Mechanism Design

### Input

- user_intent (build_new, extend, improve, learn)
- user_input_length_band (short, medium, long)
- technical_maturity_band (L0, L1, L2, L3)

### Processing

- map to journey profile
- emit fixed question groups:
  - problem and pain
  - constraints and boundaries
  - success criteria and QA checks
  - anti-goals and exclusions

### Output

Machine-parseable JSON:

- `journey`
- `question_groups`
- `required_answers`
- `ambiguity_threshold`
- `next_stage_recommendation`

## Validation Plan

1. Run script with all supported intents and levels
2. Verify JSON schema presence and deterministic keys
3. Run `quality-check.sh build .`
4. Verify command files contain enforcement blocks and output contracts

## Risk and Mitigation

- Risk: overlap with existing intake command semantics
  - Mitigation: keep intake as executor, discovery as pre-intake clarifier

- Risk: overloading prompts with too many questions
  - Mitigation: fixed 3-tier question pack and hard cap per tier

- Risk: route ambiguity in hivefiver root command
  - Mitigation: add explicit `discovery` action and unknown-action fallback

## Exit Criteria

- discovery command exists and routes correctly
- journey-intake-qa.sh outputs deterministic JSON for each intent
- intake command consumes script output via enforcement block
- playbook reference exists and aligns with command/script behavior
- quality-check evidence collected
