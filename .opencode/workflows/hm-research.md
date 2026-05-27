---
description: "Research workflow: identify research targets → gather codebase references → fetch external documentation → write research report."
---

# hm-research

## Goal
Conduct multi-source research on APIs, dependencies, codebase patterns, and technical requirements.

## Agent Routing Table
| Role | Agent | Responsibility |
|------|-------|---------------|
| Research | hm-project-researcher | Maps codebase, fetches docs, outlines approaches |
| Synthesizer | hm-synthesizer | Compresses research logs, formats research reports |

## Execution Phases
1. **Identify Targets**: Parse the target topic, phase, or libraries to research.
2. **Codebase Scan**: Map existing codebase usage, patterns, and dependencies to find relevant areas.
3. **External Fetch**: Query API specs, packages, and guides (using webfetch or context7 query-docs).
4. **Legitimacy Check**: Audit the package legitimacy and licensing if new libraries are proposed.
5. **Synthesis**: Spawn `hm-synthesizer` to compress outputs and format `RESEARCH.md`.

## Checkpoint Protocol
| Checkpoint Type | Behavior |
|-----------------|----------|
| `decision` | Choose between research alternatives |

## Output Contract
- `RESEARCH.md` report outlining architectural options, dependencies, and threat scenarios
