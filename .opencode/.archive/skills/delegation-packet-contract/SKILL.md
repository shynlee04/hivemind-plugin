---
name: "delegation-packet-contract"
description: "Creates and validates typed delegation packets before any sub-agent dispatch."
triggers:
  - "Before task delegation"
  - "When scope/constraints are ambiguous"
version: "1.0.0"
---

> ⚠️ **DEPRECATED** (2026-03-03): This skill has been superseded by `delegation-intelligence` v2.7.0+.
> All delegation packet fields and validation are documented in delegation-intelligence (lines 115-138).
> Full packet structure reference: development-patterns.md (lines 259-330).
> This skill will be removed after 2026-04-01.

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
