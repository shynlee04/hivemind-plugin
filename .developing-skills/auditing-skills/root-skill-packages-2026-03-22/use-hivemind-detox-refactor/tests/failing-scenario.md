# Failing Scenario: Polluted Detox Router Request

**Date:** 2026-03-21
**Skill:** use-hivemind-detox-refactor
**Severity:** HIGH
**Status:** RED - Failing Scenario

---

## Scenario Description

The agent is asked to fix HiveMind context rot and delegation problems. The polluted built-in graph tries to force broad entry routing, missing targets, and projection-first reasoning.

## Input Conditions

1. The request is about the HiveMind framework itself.
2. Active built-in skills contain over-broad trigger language.
3. Some routes point to missing targets such as `permission-design` or `delegation-handoff`.
4. `.opencode/**` contains stale support files that do not reflect root authority.

## Expected Behavior

The router should:

1. classify the request into the smallest detox concern
2. select the smallest matching bundle
3. refuse missing or deprecated routes
4. treat `.opencode/**` as evidence only
5. choose the minimum external helper lane instead of polluted built-in defaults

## Incorrect Behavior

- route directly into `use-hivemind` as a master helper
- trust `MUST LOAD` or `auto-run` prose without `src/**` backing
- route into `_archived` or `_deprecated_hive`
- trust stale `.opencode/**` support files as authority
- guess missing targets instead of blocking them

## Pass Condition

The router returns a bounded response with:

- accepted concern
- bundle selection
- helper-lane selection
- blocked routes
- next bounded action
