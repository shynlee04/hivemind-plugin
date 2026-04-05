# Enforcement Gap Analysis

**Date:** 2026-04-03
**Source:** 14,606 lines of session history + 2 failure tests

## Core Problem
SKILL.md files describe enforcement but don't actually enforce. They're text, not mechanisms.

## Evidence
- Test 1: `@file create this` → AI asks "How can I help?" with 4 options
- Test 2: `create skill` → AI asks A/B/C questions
- Intent was CRYSTAL CLEAR but AI asked 7+ questions

## Root Causes (All 5 Skills)
1. "Do this first" = text, not enforcement
2. Gate scripts exist but never run
3. Question tool enforcement = description, not blocking
4. Routing tables = tables, not parsers
5. No subagent review loop

## Fix Strategy
Each skill needs real enforcement via:
- OpenCode commands that auto-parse intent
- Bash scripts that run and block
- Subagent review loops that catch failures
- Agent configurations that restrict behavior

## Priority Order
1. meta-builder (entry point - routing)
2. use-authoring-skills (skill creation)
3. user-intent-interactive-loop (question enforcement)
4. coordinating-loop (subagent dispatch)
5. planning-with-files (gate enforcement)

## Delegation Plan
Fix ONE skill at a time. Each fix gets:
- Subagent to implement
- Critic review subagent
- Loop until critic passes
- Commit after each skill
