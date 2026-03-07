# Domain Routing

**CONDITIONAL LOAD**: At entry-resolution Step 3, when intent spans multiple domains OR domain is non-dev.

> Consolidated from the domain pack routing skill. Lineage-agnostic — both hivefiver and hiveminder route across domains.

## Domain Detection

Classify user intent into one of five domain packs:

| User Signals | Domain Pack | Capability Area |
|-------------|-------------|-----------------|
| Software, app, API, code, developer tool, infrastructure | `dev` | Engineering, integrations, deployment |
| Marketing, content, brand, campaign, SEO, growth | `marketing` | Campaigns, content systems, growth ops |
| Finance, accounting, budget, invoice, forecasting | `finance` | Budgeting, reporting, executive metrics |
| Operations, office, HR, admin, process, documentation | `office-ops` | Docs, spreadsheets, presentation pipelines |
| Mixed or unclear signals spanning 2+ domains | `hybrid` | Multi-domain solutions |

If domain cannot be resolved from user input, set `domain_pack: "hybrid"` and flag as `inferred`.

## Domain Pack Selection

After detection, the domain pack determines:

| Decision | What It Affects |
|----------|----------------|
| **Capability map** | Which tools, skills, and resources are relevant |
| **Workflow recommendation** | Which workflow pattern fits the domain |
| **Required skills** | Domain-specific skills to load (via find-skill if not innate) |
| **Required gates** | Domain-specific quality gates |
| **Artifact plan** | What deliverables the domain expects |

## Cross-Domain Routing

When `hybrid` is detected:

1. Identify the PRIMARY domain (>50% of signals)
2. Identify SECONDARY domains
3. Route workflow to primary domain pack
4. Load secondary domain skills as supplements
5. Flag cross-domain coordination points

## Required Output

```yaml
domain_routing_result:
  domain_pack: "dev" | "marketing" | "finance" | "office-ops" | "hybrid"
  primary_domain: "<if hybrid>"
  secondary_domains: ["<if hybrid>"]
  capability_map: [list of relevant capabilities]
  workflow_recommendation: "<recommended workflow>"
  required_skills: [list of skills to load]
  required_gates: [list of quality gates]
```

## Integration with Persona Routing

Domain routing runs ALONGSIDE persona routing:
- Persona determines **governance level** (how strict)
- Domain determines **capability scope** (what tools/skills)
- Together they define the complete session configuration

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Defaulting to `dev` | Non-dev users get dev-only tools |
| Ignoring hybrid signals | Cross-domain work loses coordination |
| Re-routing on every turn | Domain is session-level, not turn-level |
| Domain without persona | Missing governance calibration |
