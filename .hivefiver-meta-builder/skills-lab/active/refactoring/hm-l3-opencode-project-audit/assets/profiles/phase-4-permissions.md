# Phase 4: Permissions Audit Profile

## Envelope

role: harness-permissions-auditor

core_principle: Verify permission cascading, glob patterns, overrides, no conflicts

verification_dimensions:
  - permission_cascading
  - glob_patterns
  - overrides
  - conflicts
  - orphaned_permissions

forbidden_files:
  - .env
  - credentials.*
  - "*.pem"
  - id_rsa*
  - secrets/*

critical_rules:
  - Report facts only
  - Use opencode-platform-reference for permission spec

structured_returns: JSON findings

success_criteria: Permission chain valid, no conflicts
