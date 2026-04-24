## hm-opencode-project-inspection
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: process
**Failure Reason**: Description overshadowed by hm-opencode-project-audit (both audit OpenCode projects with overlapping triggers like "check boundaries" and "verify architecture"). Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding.
**Description OK?**: NO (overshadowed)
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-opencode-platform-reference
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding. Reference skill does not fit Group 1 or Group 2 cleanly (provides lookup/reference, not process or tactical implementation), violating 2-2-2 arrangement.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: NO (reference skill is neither Group 1 nor Group 2)

## hm-opencode-non-interactive-shell
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-omo-reference
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: Description contains banned word "harness" ("harness design patterns"). Body starts with "## 6-NON Defence Table" — enforcement table. Reference skill does not fit Group 1 or Group 2 cleanly. Not portable due to "harness" in description.
**Description OK?**: NO (contains "harness")
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: NO ("harness" in description)
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: NO (reference skill is neither Group 1 nor Group 2)

## hm-agent-composition
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: Description contains banned word "GSD" ("GSD specialist agents", "GSD agent patterns"). Body starts with "## 6-NON Defence Table" — enforcement table. Not portable due to "GSD" in description.
**Description OK?**: NO (contains "GSD")
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: NO ("GSD" in description)
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-test-driven-execution
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: process
**Failure Reason**: Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-spec-driven-authoring
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: process
**Failure Reason**: Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-research-chain
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: coordinator
**Group**: process
**Failure Reason**: Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding. Coordinator skill lacks self-correction mechanism: does not detect if loaded by subagent, does not tell agent which skills to load first, has no hierarchy verification.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: NO (no mechanism to detect wrong hierarchy)
**2-2-2 Compliant?**: YES

## hm-refactor
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-phase-execution
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: coordinator
**Group**: process
**Failure Reason**: Description contains banned word "GSD" ("GSD-style phase plans"). Body starts with "## 6-NON Defence Table" — enforcement table. Coordinator skill lacks self-correction mechanism.
**Description OK?**: NO (contains "GSD")
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: NO ("GSD" in description)
**Self-Correcting?**: NO (no mechanism to detect wrong hierarchy)
**2-2-2 Compliant?**: YES

## hm-debug
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: process
**Failure Reason**: Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-completion-looping
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: process
**Failure Reason**: Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-synthesis
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: Body's first heading after frontmatter is "## 6-NON Defence Table" — enforcement table with no insight/onboarding, appearing before the skill title.
**Description OK?**: YES
**Body OK?**: NO (first heading is 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-detective
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: Body's first heading after frontmatter is "## 6-NON Defence Table" — enforcement table with no insight/onboarding, appearing before the skill title.
**Description OK?**: YES
**Body OK?**: NO (first heading is 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-deep-research
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: Body's first heading after frontmatter is "## 6-NON Defence Table" — enforcement table with no insight/onboarding, appearing before the skill title.
**Description OK?**: YES
**Body OK?**: NO (first heading is 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-planning-with-files
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: process
**Failure Reason**: Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hivefiver-delegation-gates
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: process
**Failure Reason**: Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-phase-loop
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: process
**Failure Reason**: Body starts with "## 6-NON Defence Table" — enforcement table with no insight/onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-coordinating-loop
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: coordinator
**Group**: process
**Failure Reason**: Body starts with "## 6-NON Defence Table" and second heading is "## HIERARCHY ENFORCEMENT — Run This FIRST" — pure enforcement/gates with no insight/onboarding before procedural content. Despite having self-correction (hierarchy verification scripts), the body start fails.
**Description OK?**: YES
**Body OK?**: NO (starts with 6-NON Defence Table + HIERARCHY ENFORCEMENT)
**Portable?**: YES
**Self-Correcting?**: YES (has verify-hierarchy.sh and prerequisite checks)
**2-2-2 Compliant?**: YES

## hm-subagent-delegation-patterns
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: process
**Failure Reason**: First substantive heading after title is "## The Iron Law" — enforcement/gates with no explanatory onboarding before diving into protocol steps.
**Description OK?**: YES
**Body OK?**: NO (starts with Iron Law)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-skill-synthesis
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: First substantive heading after title is "## The Iron Law" — enforcement/gates with no explanatory onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with Iron Law)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-agents-md-sync
**PASS/FAIL**: FAIL
**Lineage**: project-generic
**Hierarchy**: sub-session
**Group**: process
**Failure Reason**: First substantive heading after title is "## The Iron Law" — enforcement/gates with no explanatory onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with Iron Law)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-command-parser
**PASS/FAIL**: PASS
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: None
**Description OK?**: YES
**Body OK?**: YES (title followed by "## Parsing Patterns" — immediate insight into what the skill teaches)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-opencode-project-audit
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: coordinator
**Group**: process
**Failure Reason**: Description contains banned word "harness" ("full harness audit"). Description is overshadowed by hm-opencode-project-inspection (both audit OpenCode projects with overlapping triggers). First heading contains "harness" ("# harness-audit"), making it not portable.
**Description OK?**: NO (contains "harness" and overshadowed)
**Body OK?**: NO (first heading contains banned word "harness")
**Portable?**: NO ("harness" in description and first heading)
**Self-Correcting?**: NO (no mechanism to detect wrong hierarchy)
**2-2-2 Compliant?**: YES

## hivefiver-context-absorb
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: process
**Failure Reason**: First substantive heading after title is "## Execution Context" — pure routing telling agent to load other skills first, with no insight/onboarding into what this skill IS.
**Description OK?**: YES
**Body OK?**: NO (starts with routing: "Load these skills before starting")
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hm-user-intent-interactive-loop
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: coordinator
**Group**: process
**Failure Reason**: First substantive heading after title is "## HARD GATES — Non-Negotiable Enforcement" — pure enforcement/gates with no insight/onboarding. Despite having self-correction (hierarchy verification scripts), the body start fails.
**Description OK?**: YES
**Body OK?**: NO (starts with HARD GATES)
**Portable?**: YES
**Self-Correcting?**: YES (has verify-hierarchy.sh, prerequisite checks, gate enforcement)
**2-2-2 Compliant?**: YES

## hivefiver-custom-tools-dev
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: Description follows generic AI-written template identical to hivefiver-command-dev and hivefiver-agents-and-subagents-dev ("This skill should be used when the user asks to 'X', 'Y', ... mentions A, B, ... or needs guidance on..."). First substantive heading after title is "## The Iron Law" — enforcement with no onboarding.
**Description OK?**: NO (generic AI template, identical structure to command-dev and agents-and-subagents-dev)
**Body OK?**: NO (starts with Iron Law)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hivefiver-command-dev
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: Description follows generic AI-written template identical to hivefiver-custom-tools-dev and hivefiver-agents-and-subagents-dev. First substantive heading after title is "## The Iron Law" — enforcement with no onboarding.
**Description OK?**: NO (generic AI template, identical structure)
**Body OK?**: NO (starts with Iron Law)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hivefiver-agents-and-subagents-dev
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: Description follows generic AI-written template identical to hivefiver-custom-tools-dev and hivefiver-command-dev. First substantive heading after title is "## The Iron Law" — enforcement with no onboarding.
**Description OK?**: NO (generic AI template, identical structure)
**Body OK?**: NO (starts with Iron Law)
**Portable?**: YES
**Self-Correcting?**: N/A (sub-session)
**2-2-2 Compliant?**: YES

## hivefiver-use-authoring-skills
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: sub-session
**Group**: implementation
**Failure Reason**: First heading after frontmatter is "## The Iron Law" and second is "## HIERARCHY ENFORCEMENT — Run This FIRST" — body starts with pure enforcement/gates with no insight/onboarding.
**Description OK?**: YES
**Body OK?**: NO (starts with Iron Law + HIERARCHY ENFORCEMENT)
**Portable?**: YES
**Self-Correcting?**: YES (has verify-hierarchy.sh, but sub-session so not required)
**2-2-2 Compliant?**: YES

## hm-meta-builder
**PASS/FAIL**: FAIL
**Lineage**: meta-builder
**Hierarchy**: coordinator
**Group**: process
**Failure Reason**: Coordinator skill (layer 0, root router) lacks self-correction mechanism: does not detect if loaded by subagent, has no hierarchy verification script, does not explicitly tell front-facing agents that subagents should never load this skill.
**Description OK?**: YES
**Body OK?**: YES (title followed by "## Overview" with clear explanation of what the skill is and when to use/not use)
**Portable?**: YES
**Self-Correcting?**: NO (no mechanism to detect wrong hierarchy or enforce loading order)
**2-2-2 Compliant?**: YES

# SUMMARY
## Pass/Fail
| Verdict | Count | Skills |
|---------|-------|--------|
| PASS | 1 | hm-command-parser |
| FAIL | 30 | hm-opencode-project-inspection, hm-opencode-platform-reference, hm-opencode-non-interactive-shell, hm-omo-reference, hm-agent-composition, hm-test-driven-execution, hm-spec-driven-authoring, hm-research-chain, hm-refactor, hm-phase-execution, hm-debug, hm-completion-looping, hm-synthesis, hm-detective, hm-deep-research, hm-planning-with-files, hivefiver-delegation-gates, hm-phase-loop, hm-coordinating-loop, hm-subagent-delegation-patterns, hm-skill-synthesis, hm-agents-md-sync, hm-opencode-project-audit, hivefiver-context-absorb, hm-user-intent-interactive-loop, hivefiver-custom-tools-dev, hivefiver-command-dev, hivefiver-agents-and-subagents-dev, hivefiver-use-authoring-skills, hm-meta-builder |

## Failure Breakdown
| Failure Reason | Count | Skills |
|----------------|-------|--------|
| Description contains banned word (GSD, harness, Hivefiver) | 4 | hm-omo-reference (harness), hm-agent-composition (GSD), hm-phase-execution (GSD), hm-opencode-project-audit (harness) |
| Description overshadowed by another skill | 2 | hm-opencode-project-inspection, hm-opencode-project-audit |
| Description is generic AI-written template | 3 | hivefiver-custom-tools-dev, hivefiver-command-dev, hivefiver-agents-and-subagents-dev |
| Body starts with enforcement/gates/tables (6-NON, HARD GATES, HIERARCHY ENFORCEMENT) | 20 | hm-opencode-project-inspection, hm-opencode-platform-reference, hm-opencode-non-interactive-shell, hm-omo-reference, hm-agent-composition, hm-test-driven-execution, hm-spec-driven-authoring, hm-research-chain, hm-refactor, hm-phase-execution, hm-debug, hm-completion-looping, hm-synthesis, hm-detective, hm-deep-research, hm-planning-with-files, hivefiver-delegation-gates, hm-phase-loop, hm-coordinating-loop, hm-user-intent-interactive-loop |
| Body starts with Iron Law | 7 | hm-subagent-delegation-patterns, hm-skill-synthesis, hm-agents-md-sync, hivefiver-custom-tools-dev, hivefiver-command-dev, hivefiver-agents-and-subagents-dev, hivefiver-use-authoring-skills |
| Body starts with routing | 1 | hivefiver-context-absorb |
| Not portable (banned word in description or first 2 headings) | 4 | hm-omo-reference, hm-agent-composition, hm-phase-execution, hm-opencode-project-audit |
| No self-correction (coordinator/hierarchy skill) | 4 | hm-research-chain, hm-phase-execution, hm-opencode-project-audit, hm-meta-builder |
| 2-2-2 violation (reference skill not Group 1 or Group 2) | 2 | hm-opencode-platform-reference, hm-omo-reference |

## The 5 Most Broken
1. **hm-omo-reference** — Description contains "harness", body starts with 6-NON Defence Table, not portable, and is a reference skill that violates 2-2-2 Group classification (4 failure reasons)
2. **hm-opencode-project-audit** — Description contains "harness" and is overshadowed by inspection, body first heading contains "harness", not portable, and lacks self-correction as a coordinator skill (4 failure reasons)
3. **hm-agent-composition** — Description contains "GSD", body starts with 6-NON Defence Table, and not portable (3 failure reasons)
4. **hm-phase-execution** — Description contains "GSD", body starts with 6-NON Defence Table, and lacks self-correction as a coordinator skill (3 failure reasons)
5. **hm-opencode-project-inspection** — Description is overshadowed by audit skill, and body starts with 6-NON Defence Table (2 failure reasons)
