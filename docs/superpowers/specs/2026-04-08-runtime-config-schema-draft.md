# Runtime Configuration Schema Draft

**Date**: 2026-04-08
**Status**: SCHEMA DRAFT — review before implementation
**Scope**: concrete draft for the generated runtime config file produced by guided setup

---

## 1. Design Intent

This schema draft defines the primary durable output of guided setup.

It is intentionally:

- product-facing in shape
- explicit enough to validate strictly
- compatible with future plugin and SDK/runtime consumption
- opinionated about defaults, but inspectable and editable

The config should describe user intent clearly enough that internal runtime code can evolve without changing the meaning of the top-level product choices.

---

## 2. Top-Level Shape

```jsonc
{
  "$schema": "https://example.com/schemas/hivemind-runtime-config-v1.json",
  "version": 1,
  "product": {
    "profile": "balanced",
    "explainability": "basic",
    "collaboration_mode": "guided"
  },
  "models": {
    "default": "openai/gpt-5.4",
    "small": "openai/gpt-5.4-mini",
    "fallbacks": {
      "research": ["openai/gpt-5.4", "anthropic/claude-sonnet-4.5"],
      "implementation": ["openai/gpt-5.4"],
      "review": ["openai/gpt-5.4", "anthropic/claude-sonnet-4.5"]
    }
  },
  "runtime": {
    "background_execution": {
      "enabled": true,
      "mode": "owned-process",
      "default_timeout_ms": 300000,
      "max_output_bytes": 10240
    },
    "auto_loop": {
      "enabled": true,
      "max_iterations": 3,
      "completion_signal": "<promise>DONE</promise>",
      "backoff_ms": 1000
    },
    "concurrency": {
      "global_limit": 3,
      "per_root_descendant_limit": 3
    },
    "recovery": {
      "enabled": true,
      "checkpoint_on_compact": true,
      "staleness_policy": "warn",
      "risk_assessment": "basic"
    },
    "persistence": {
      "enabled": true,
      "state_dir": ".opencode/state/hivemind",
      "continuity_file": "session-continuity.json"
    }
  },
  "delegation": {
    "default_category": "implementation",
    "max_depth": 3,
    "categories": {
      "research": {
        "temperature": 0.2,
        "tool_profile": "researcher"
      },
      "implementation": {
        "temperature": 0.1,
        "tool_profile": "builder"
      },
      "review": {
        "temperature": 0.1,
        "tool_profile": "critic"
      },
      "deep": {
        "temperature": 0.2,
        "tool_profile": "researcher"
      },
      "quick": {
        "temperature": 0.0,
        "tool_profile": "builder"
      }
    }
  },
  "budgets": {
    "max_tool_calls_per_session": 400,
    "repeated_signature_threshold": 16,
    "warning_cap": 25,
    "reset_on_compact": true
  },
  "security": {
    "background_command_policy": "allowlist",
    "allowed_background_commands": ["node", "npm", "npx", "pnpm", "vitest"],
    "cwd_policy": "project-root-only",
    "session_patch_policy": "workspace-allowlist"
  },
  "setup_metadata": {
    "generated_at": "2026-04-08T00:00:00.000Z",
    "generated_by": "hf-setup",
    "questionnaire_version": 1,
    "rationale_summary": [
      "Selected balanced profile for general-purpose collaborative use",
      "Enabled persistence and compact-time checkpointing for resume support"
    ]
  },
  "managed": {
    "generator_managed_paths": [
      "product.profile",
      "runtime.background_execution",
      "runtime.auto_loop",
      "budgets"
    ],
    "user_editable_paths": [
      "models",
      "delegation.categories",
      "security.allowed_background_commands"
    ]
  }
}
```

---

## 3. Section Semantics

### `product`

Represents the user-facing operating posture chosen during guided setup.

- `profile`: high-level posture such as `safe`, `balanced`, or `autonomous`
- `explainability`: how much reasoning/explanation the system should surface
- `collaboration_mode`: how tightly the product should keep the user in the loop

This section is intentionally abstract. It should remain stable even if internal runtime implementation changes.

### `models`

Captures runtime model preferences and fallback chains. This keeps model choice explicit without scattering provider choices across unrelated config sections.

### `runtime`

Contains the main operational controls:

- background execution
- auto-loop behavior
- concurrency
- recovery and checkpointing
- persistence paths

### `delegation`

Defines how work is routed across categories and what defaults those categories imply.

### `budgets`

Exposes safety and throttling controls in one place. These were previously internal or hardcoded.

### `security`

Defines public-facing safety policies for the most dangerous runtime surfaces.

### `setup_metadata`

Records the origin and explanation context of the generated config.

### `managed`

Defines which fields are owned by the setup generator versus explicitly editable by users.

---

## 4. Proposed Enums

### Product profile

- `safe`
- `balanced`
- `autonomous`

### Explainability

- `basic`
- `verbose`

### Collaboration mode

- `guided`
- `mixed`
- `hands_off`

### Background execution mode

- `disabled`
- `owned-process`
- `subsession`
- `auto`

### Staleness policy

- `ignore`
- `warn`
- `require_confirmation`

### Risk assessment

- `off`
- `basic`
- `strict`

### Background command policy

- `deny-all`
- `allowlist`
- `prompt-once`

### CWD policy

- `project-root-only`
- `workspace-allowlist`

### Session patch policy

- `disabled`
- `workspace-allowlist`
- `session-files-only`

---

## 5. Validation Rules Draft

### Structural rules

1. `version` must be an integer.
2. Unknown top-level keys should fail parse in strict mode.
3. All durations and limits must be positive integers.
4. Category keys must be from the supported category set.

### Semantic rules

1. `runtime.background_execution.enabled = false` should force `mode = disabled` during normalization.
2. `background_command_policy = allowlist` requires at least one allowed command.
3. `collaboration_mode = hands_off` should not be paired with `profile = safe` unless explicitly allowed.
4. `per_root_descendant_limit` must be less than or equal to a documented upper bound.
5. `warning_cap` must not exceed a hard maximum enforced by runtime.

### Runtime readiness rules

1. persistence paths must resolve under allowed directories
2. category tool profiles must map to known specialist profiles
3. selected models and fallbacks must be syntactically valid
4. security rules must not widen access beyond supported runtime safety boundaries

---

## 6. Normalization Rules Draft

Normalization should be limited and predictable.

Suggested normalization behavior:

1. fill missing optional sections from profile defaults
2. translate user-friendly aliases into canonical enum values
3. derive disabled sub-sections from top-level booleans
4. preserve user ordering only where order matters, such as fallback lists

Normalization should not silently invent unsafe settings.

---

## 7. Fixture Profiles To Support

The schema and validation system should ship with a small set of first-class fixtures:

1. `safe-local.json`
2. `balanced-collab.json`
3. `autonomous-research.json`
4. `background-heavy.json`
5. `minimal-runtime.json`

These fixtures should become both documentation examples and test fixtures.

---

## 8. Testing Draft

### Schema tests

- accepts valid configs for all fixture profiles
- rejects invalid enums
- rejects negative or zero limits where unsupported
- rejects unknown keys in strict mode

### Semantic validation tests

- rejects insecure command policy combinations
- rejects invalid category/tool-profile combinations
- rejects impossible runtime mode combinations

### Integration smoke tests

- runtime initializes with each valid fixture
- background settings are enforced
- category routing loads cleanly
- continuity and recovery settings are consumable

---

## 9. Managed vs Editable Contract

This draft assumes a mixed-ownership model.

### Generator-managed

- product profile-derived fields
- budgets
- background execution defaults
- recovery defaults

### User-editable

- model choices and fallback chains
- category tuning within safe bounds
- allowlist contents within supported policy modes

The exact ownership rules should be documented before implementation so regeneration does not unexpectedly overwrite user intent.

---

## 10. Open Review Questions

1. Should `setup_metadata.rationale_summary` stay inline in the config, or live in a sidecar file?
2. Should `managed` live in the same config file, or only in generator metadata?
3. Is `subsession` versus `owned-process` too technical for V1, and should setup map into those invisibly?
4. Should `models.fallbacks` be user-visible in V1, or derived from profiles?
5. Should `security.allowed_background_commands` be editable by default, or only through advanced mode?

---

## 11. Draft Summary

This schema draft gives guided setup a concrete target:

- one full config file
- product-facing top-level sections
- strict validation capability
- room for plugin and SDK/runtime reuse

It is ready for review before implementation planning.
