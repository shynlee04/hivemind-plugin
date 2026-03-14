---
name: "delegation-packet-contract"
description: "Creates and validates typed delegation packets before any sub-agent dispatch."
triggers:
  - "Before task delegation"
  - "When scope/constraints are ambiguous"
version: "1.0.0"
---

# Delegation Packet Contract

## Objective
Guarantee deterministic delegation payloads with explicit scope, constraints, and evidence requirements.

## Required Fields
- intent_id
- source_command
- target_agent
- target_workflow
- skills_to_load
- scope
- constraints
- success_metrics
- acceptance_criteria
- required_evidence
- failure_policy
