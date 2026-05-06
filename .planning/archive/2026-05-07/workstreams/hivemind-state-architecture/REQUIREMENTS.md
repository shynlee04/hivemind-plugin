---
id: WS-1
type: requirements
created: 2026-05-06
updated: 2026-05-06
status: locked
lineage: shared
---

# WS-1: Hivemind State Architecture — Requirements

> Source: WS1-01-SPEC.md, Q6 Validation Decision (2026-04-25), MASTER-PROJECT-SKELETON §8

## REQ-WS1-01: Directory Structure Completeness

**Source:** WS1-01-SPEC.md §1  
**Condition:** `.hivemind/` directory tree contains all 18 directories (7 existing + 11 new)  
**Acceptance Criteria:**
- Given the project root, when running `find .hivemind -type d | sort`, then output matches the spec tree exactly.  
**Verification Method:** `find .hivemind -type d | sort` count ≥ 18  
**Status:** locked ✅

## REQ-WS1-02: configs.json Schema Validation (Positive)

**Source:** WS1-01-SPEC.md §3  
**Condition:** `configs.json` with all 5 valid fields passes Zod schema validation  
**Acceptance Criteria:**
- Given a valid config object, when parsed with `HivemindConfigsSchema.safeParse()`, then result.success === true.  
**Verification Method:** Unit test — `tests/schema-kernel/hivemind-configs.schema.test.ts`  
**Status:** locked ✅

## REQ-WS1-03: configs.json Schema Validation (Negative)

**Source:** WS1-01-SPEC.md §3  
**Condition:** `configs.json` with invalid enum values is rejected by Zod schema  
**Acceptance Criteria:**
- Given `{ mode: "invalid" }`, when parsed with `HivemindConfigsSchema.safeParse()`, then result.success === false.  
**Verification Method:** Unit test — `tests/schema-kernel/hivemind-configs.schema.test.ts`  
**Status:** locked ✅

## REQ-WS1-04: .gitignore Runtime State Prevention

**Source:** WS1-01-SPEC.md §7  
**Condition:** `.gitignore` rules prevent runtime state files from being tracked  
**Acceptance Criteria:**
- Given runtime state files exist, when running `git check-ignore .hivemind/state/session-continuity.json`, then exit code is 0.  
**Verification Method:** `git check-ignore` on state files  
**Status:** locked ✅

## REQ-WS1-05: Zero Regressions

**Source:** WS1-01-SPEC.md §8  
**Condition:** Existing runtime state (session-continuity.json, delegations.json) remains functional after scaffolding  
**Acceptance Criteria:**
- Given the project, when running `npm test`, then all existing tests pass with 0 regressions.  
**Verification Method:** `npm test`  
**Status:** locked ✅

## REQ-WS1-06: Canonical State Dir Resolution

**Source:** WS1-01-SPEC.md §6  
**Condition:** `getCanonicalStateDir()` resolves to `.hivemind/state` for all callers  
**Acceptance Criteria:**
- Given the harness runtime, when calling `getCanonicalStateDir()`, then it returns the path ending in `.hivemind/state`.  
**Verification Method:** Existing unit tests  
**Status:** locked ✅

## REQ-WS1-07: .gitkeep Coverage

**Source:** WS1-01-SPEC.md §1  
**Condition:** All 11 new directories contain `.gitkeep` files for git tracking  
**Acceptance Criteria:**
- Given the project root, when running `find .hivemind -name .gitkeep | wc -l`, then count ≥ 11.  
**Verification Method:** `find .hivemind -name .gitkeep | wc -l`  
**Status:** locked ✅
