# Plan Protocol (2026-03-03)

**Status**: active  
**Owner**: hiveplanner  
**Plan ID**: PROTO-PLAN-001  
**Date**: 2026-03-03
Plan ID: PROTO-PLAN-001

## Lane Separation

- `META*`: framework-level planning and governance evolution.
- `PROJ*`: project implementation planning.

Never mix META and PROJ nodes under the same parent.

## State Machine

`open -> routing -> branch -> pivot -> completion -> close`

## Required Frontmatter

- `id`
- `parent`
- `status`
- `priority`
- `scope`
- `type`
- `created`
- `last_sync`
- `validation_log`

## Validation Rule

- Every active node must have a matching validation artifact.
- Every manifest record must map to an existing plan file.
