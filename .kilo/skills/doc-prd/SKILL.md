---
name: doc-prd
description: Create Product Requirements Documents (PRD) following SDD methodology - Layer 2 artifact defining product features and user needs
metadata:
  tags:
    - sdd-workflow
    - layer-2-artifact
    - shared-architecture
  custom_fields:
    layer: 2
    artifact_type: PRD
    architecture_approaches: [ai-agent-based, traditional-8layer]
    priority: shared
    development_status: active
    skill_category: core-workflow
    upstream_artifacts: [BRD]
    downstream_artifacts: [EARS, BDD, ADR]
    version: "1.3"
    last_updated: "2026-03-05"
---

# doc-prd

## Purpose

Create **Product Requirements Documents (PRD)** - Layer 2 artifact in the SDD workflow that defines product features, user needs, measurable success criteria, and KPIs.

**Layer**: 2

**Upstream**: BRD (Layer 1)

**Downstream Artifacts**: EARS (Layer 3), BDD (Layer 4), ADR (Layer 5)

## Prerequisites

### Upstream Artifact Verification (CRITICAL)

**Before creating this document, you MUST:**

1. **List existing upstream artifacts**:
   ```bash
   ls docs/01_BRD/ docs/02_PRD/ 2>/dev/null
   ```

2. **Reference only existing documents** in traceability tags
3. **Use `null`** only when upstream artifact type genuinely doesn't exist
4. **NEVER use placeholders** like `BRD-XXX` or `TBD`
5. **Do NOT create missing upstream artifacts** - skip functionality instead

Before creating a PRD, read:

1. **Shared Standards**: `.claude/skills/doc-flow/SHARED_CONTENT.md`
2. **Upstream BRD**: Read the BRD that drives this PRD
  **Note on Sectioned BRDs**: If BRD is split into multiple section files (0-18), read ALL files as ONE logical document. See `PRD-MVP-TEMPLATE.md` Section 22.
3. **Template**: `ai_dev_ssd_flow/02_PRD/PRD-MVP-TEMPLATE.md`
4. **Creation Rules**: `ai_dev_ssd_flow/02_PRD/PRD-MVP-TEMPLATE.md`
5. **Validation Rules**: `ai_dev_ssd_flow/02_PRD/PRD_MVP_SCHEMA.yaml`

## When to Use This Skill

Use `doc-prd` when:
- Have completed BRD (Layer 1)
- Need to define product features and user requirements
- Translating business needs to product specifications
- Establishing KPIs and success metrics
- You are at Layer 2 of the SDD workflow

## PRD-Specific Guidance

### 1. Required Sections (21 Total)

PRD documents follow the **MVP template structure** (21 sections). See `ai_dev_ssd_flow/02_PRD/PRD-MVP-TEMPLATE.md` for complete structure.

> **Note**: MVP template is the framework standard. All readiness scores use ≥90% thresholds. Expansion happens through NEW MVP iterations (PRD-02, PRD-03), not template changes.

**Section 1. Document Control** (MANDATORY - First section):
- Status, Version, Date Created, Last Updated
- Author, Reviewer, Approver
- BRD Reference (`@brd: BRD.NN.EE.SS`)
- **SYS-Ready Score**: >=90% required (format: `XX% (Target: >=90%)`)
- **EARS-Ready Score**: >=90% required (format: `XX% (Target: >=90%)`)
- Template Variant (Standard/Agent-Based/Automation-Focused)
- Document Revision History table

**All 21 Sections (in order)**:
1. **Document Control**: Metadata, versioning, dual scoring (SYS-Ready + EARS-Ready >=90%)
2. **Executive Summary**: Business value and timeline overview (2-3 sentences)
3. **Problem Statement**: Current state, business impact, opportunity assessment
4. **Target Audience & User Personas**: Primary users, secondary users, business stakeholders
5. **Success Metrics (KPIs)**: Primary KPIs, secondary KPIs, success criteria by phase
6. **Goals & Objectives**: Primary business goals, secondary objectives, stretch goals
7. **Scope & Requirements**: In scope features, out of scope items, dependencies, assumptions
8. **User Stories & User Roles**: Role definitions, story summaries (PRD-level only, no EARS/BDD detail)
9. **Functional Requirements**: User journey mapping, capability requirements
10. **Customer-Facing Content & Messaging (MANDATORY)**: Product positioning, messaging, user-facing content
11. **Acceptance Criteria**: Business acceptance, technical acceptance, quality assurance
12. **Constraints & Assumptions**: Business/technical/external constraints, key assumptions
13. **Risk Assessment**: High-risk items, risk mitigation plan
14. **Success Definition**: Go-live criteria, post-launch validation, measurement timeline
15. **Stakeholders & Communication**: Core team, stakeholders, communication plan
16. **Implementation Approach**: Development phases, testing strategy
17. **Budget & Resources**: Development/operational budget, resource requirements
18. **Traceability**: Upstream sources, downstream artifacts, traceability tags, validation evidence
19. **References**: Internal documentation, external standards, domain references, technology references
20. **EARS Enhancement Appendix**: EARS pattern templates and requirement syntax guidance
21. **Quality Assurance & Testing Strategy**: QA standards, testing strategy

**Critical Notes**:
- All 21 sections are MANDATORY with explicit numbering (`## N. Title` format)
- Section 10 (Customer-Facing Content) is blocking - must contain substantive content
- Section 8 (User Stories) must include layer separation scope note
- Section 21 (QA & Testing Strategy) moved from BRD as technical QA belongs at product level

### 2. Dual Scoring Requirements

PRD documents require **two quality scores** in Document Control:

| Score | Purpose | Threshold |
|-------|---------|-----------|
| **SYS-Ready Score** | Readiness for SYS creation | >=90% |
| **EARS-Ready Score** | Readiness for EARS creation | >=90% |

**Format**: `XX% (Target: >=90%)`

**SYS-Ready Scoring Criteria (100%)**:
- Product Requirements Completeness (40%): All 21 sections, measurable KPIs, acceptance criteria, stakeholder analysis
- Technical Readiness (30%): System boundaries, quality attributes quantified, Architecture Decision Requirements
- Business Alignment (20%): ROI validated, market analysis, success metrics, risk mitigation
- Traceability (10%): Upstream BRD references, downstream links

**EARS-Ready Scoring Criteria (100%)**:
- Business Requirements Clarity (40%): SMART objectives, functional requirements, acceptance criteria
- Requirements Maturity (35%): System boundaries, stakeholder requirements, problem statement
- EARS Translation Readiness (20%): User journeys, quality attributes quantified
- Strategic Alignment (5%): Domain-specific business logic references

### 3. Template Variant Selection

| Variant | Sections | Use Case |
|---------|----------|----------|
| **Standard** | 1-21 (21) | Business features, core platform (DEFAULT) |
| **Agent-Based** | 1-15 (15) | ML/AI agents, intelligent systems |
| **Automation-Focused** | 1-12 (12) | n8n workflows, event processing |

**Selection Criteria**:
1. ML/AI agent? -> Agent-Based
2. n8n workflow/automation? -> Automation-Focused
3. Otherwise -> Standard (default)

### 4. User Stories Scope (Section 8)

**Layer Separation Principle**:
- **PRD (Layer 2)**: User role definitions, story summaries, product-level acceptance criteria
- **EARS (Layer 3)**: Detailed behavioral scenarios (WHEN-THE-SHALL-WITHIN format)
- **BDD (Layer 4)**: Executable test scenarios (Given-When-Then format)

**MANDATORY Scope Note** (include in Section 8):
> This section provides role definitions and story summaries. Detailed behavioral requirements are captured in EARS; executable test specifications are in BDD feature files.

**User Story Format**: "As a [role], I want [capability] so that [benefit]"

**PRD-Level Content (INCLUDE)**:
- User role definitions (personas)
- Story titles and summaries (2-3 sentences max)
- Product-level acceptance criteria
- Business value justification

**NOT PRD-Level (EXCLUDE)**:
- EARS-level specifications -> Layer 3
- BDD-level test scenarios -> Layer 4
- Technical implementation details -> Layer 6/7
- System architecture decisions -> ADR (Layer 5)

### 5. Customer-Facing Content (Section 10) - MANDATORY

**Status**: BLOCKING - error if missing or placeholder-only

**Required Content Categories** (minimum 3):
1. Product positioning statements
2. Key messaging themes
3. Feature descriptions for marketing
4. User-facing documentation requirements
5. Help text and tooltips
6. Error messages (user-visible)
7. Success confirmations
8. Onboarding content
9. Release notes template

### 6. Architecture Decision Requirements (Section 18)

**Purpose**: Elaborate BRD Section 7.2 topics with **technical content** (options, criteria).

**Layer Separation**:
```
BRD Section 7.2          ->    PRD Section 18         ->    ADR
(WHAT & WHY)                   (HOW to evaluate)           (Final decision)
-------------------------------------------------------------------
Business drivers               Technical options           Selected option
Business constraints           Evaluation criteria         Trade-off analysis
```

**PRD Section 18 Format**:
```markdown
##### BRD.NN.32.SS: [Topic Name]

**Upstream**: BRD-NN section 7.2.X

**Technical Options**:
1. **[Option A]**: [Description]
2. **[Option B]**: [Description]

**Evaluation Criteria**:
- **[Criterion 1]**: [Measurable target]
- **[Criterion 2]**: [Measurable target]

**Product Constraints**:
- [Constraint 1]

**Decision Timeline**: [Milestone reference]

**ADR Requirements**: [What ADR must decide]
```

**CRITICAL**: Do NOT reference specific ADR numbers (ADR-01, ADR-033, etc.) - ADRs don't exist yet!

### 6.1 Cross-Linking Tags (AI-Friendly)

**Purpose**: Establish lightweight, machine-readable hints for AI discoverability and dependency tracing across PRD documents without blocking validation.

**Tags Supported**:
- `@depends: PRD-NN` — Hard prerequisite; this PRD cannot proceed without the referenced PRD
- `@discoverability: PRD-NN (short rationale)` — Related document for AI search and ranking (informational)

**ID Format**: Document-level IDs follow `{DOC_TYPE}-NN` per `ID_NAMING_STANDARDS.md` (e.g., `PRD-01`, `PRD-02`).

**Placement**: Add tags to Traceability section (Section 18) or inline with dependency descriptions.

**Example**:
```markdown
@depends: PRD-01 (Core Platform)
@discoverability: PRD-02 (Feature Enhancements - shared architecture)
```

**Validator Behavior**: Cross-linking tags are recognized and reported as **info-level** findings (non-blocking). They enable AI/LLM tools to infer relationships and improve search ranking without affecting document approval.

**Optional for MVP**: Cross-linking tags are optional in MVP templates and are not required for PRD approval; they are purely informational.

### 7. EARS Enhancement Appendix (Section 20)

**Purpose**: Provides structured requirements for EARS transformation.

**Required Subsections**:

**20.1 Timing Profile Matrix**:
| Operation | p50 | p95 | p99 | Unit | Trigger Event | Notes |
|-----------|-----|-----|-----|------|---------------|-------|
| [operation] | [value] | [value] | [value] | ms | [event] | [constraints] |

**20.2 Boundary Value Matrix**:
| Threshold | Operator | Value | At Boundary | Above | Below |
|-----------|----------|-------|-------------|-------|-------|
| [name] | >= or > or <= or < | [value] | [behavior] | [behavior] | [behavior] |

**20.3 State Transition Diagram**: Mermaid stateDiagram-v2 with error states

**20.4 Fallback Path Documentation**:
| Dependency | Failure Mode | Detection | Fallback Behavior | Timeout | Recovery |
|------------|--------------|-----------|-------------------|---------|----------|

**20.5 EARS-Ready Checklist**: All timing, boundary, state, fallback items verified

## Tag Format Convention

| Notation | Format | Artifacts | Purpose |
|----------|--------|-----------|---------|
| Dash | TYPE-NN | ADR, SPEC, CTR | Technical artifacts - file references |
| Dot | TYPE.NN.xxxx | BRD, PRD, EARS, BDD, SYS, REQ, IMPL, TASKS | Hierarchical - element references |

**Key Distinction**:
- `@adr: ADR-033` -> Points to document `ADR-033_slug.md`
- `@brd: BRD.17.0101` -> Points to element 01.01 inside `BRD-017.md`

## Unified Element ID Format (MANDATORY)

**Pattern**: `PRD.{DOC_NUM}.{HASH}` (3 segments, dot-separated)

| Element Type | Code | Example |
|--------------|------|---------|
| Functional Requirement | 01 | PRD.02.0101 |
| Quality Attribute | 02 | PRD.02.0201 |
| Constraint | 03 | PRD.02.0301 |
| Assumption | 04 | PRD.02.0401 |
| Dependency | 05 | PRD.02.0501 |
| Acceptance Criteria | 06 | PRD.02.0601 |
| Risk | 07 | PRD.02.0701 |
| Metric | 08 | PRD.02.0801 |
| User Story | 09 | PRD.02.0901 |
| Use Case | 11 | PRD.02.1101 |
| Feature Item | 22 | PRD.02.2201 |
| Stakeholder Need | 24 | PRD.02.2401 |

**REMOVED Patterns** (Do NOT use):
- `AC-XXX` -> Use `PRD.NN.06.SS`
- `FR-XXX` -> Use `PRD.NN.01.SS`
- `F-XXX` -> Use `PRD.NN.09.SS`
- `US-XXX` -> Use `PRD.NN.09.SS`

### Feature ID Format (Simple Numeric)

**Purpose**: Establish consistent Feature ID naming convention for traceability and cross-PRD references.

**Pattern**: `NN` (variable-length sequential number, minimum 2 digits)

| Component | Format | Description |
|-----------|--------|-------------|
| Feature ID | `NN` | 2+ digit sequential (01-99, then 100-999, 1000+) |
| Document Context | `PRD-NN` | PRD number provides namespace |

**Rationale**: Document context (PRD-01) already provides namespace. Embedding PRD number in feature ID is redundant. Feature IDs match document ID numbering convention.

**Examples**:
- `01`: First feature (in any PRD)
- `15`: 15th feature
- `99`: 99th feature
- `100`: 100th feature (auto-expands)
- `1000`: 1000th feature

**Validation Regex**: `^\d{2,}$`

**Cross-PRD Reference Format**:
When referencing features from other PRDs, use the cross-reference format:

```markdown
@prd: PRD.22.0115
```

**Components**:
- `@prd:` - Tag prefix
- `PRD-NN` - Document ID (NN in element ID)
- `.01` - Element type (01 = Functional Requirement)
- `.15` - Sequence ID within document

**Uniqueness**: `PRD.22.0115` is globally unique (PRD-022, Feature 015)

**Invalid Formats** (Do NOT Use):
| Invalid Format | Issue | Correct Format |
|----------------|-------|----------------|
| `Feature-022-001` | Deprecated format | `PRD.22.0101` |
| `FR-AGENT-001` | Non-standard prefix | `PRD.NN.01.01` |
| `Feature 3.1` | Text format | `PRD.25.0103` |
| `PRD.1.1` | Not zero-padded | `PRD.01.0101` |
| `F-01` | Deprecated F- format | `PRD.NN.01.01` |

## Cumulative Tagging Requirements

**Layer 2 (PRD)**: Must include tags from Layer 1 (BRD)

**Tag Count**: 1 tag (@brd)

**Format**:
```markdown
## 18. Traceability

### Traceability Tags

**Required Tags** (Cumulative Tagging Hierarchy - Layer 2):
```markdown
@brd: BRD.01.0103, BRD.01.0110
```

- BRD.01.0103 - Business requirements driving this product
- BRD.01.0110 - Success criteria from business case

**Upstream Sources**:
- [BRD-01](../../../ai_dev_ssd_flow/PROJECT/fixtures/budget_alert/BRD-01.md) - Parent business requirements

**Downstream Artifacts**:
- EARS-NN (to be created) - Formal requirements
- BDD-NN (to be created) - Test scenarios
```

## Creation Process

### Step 1: Read Parent BRD

Read and understand the BRD that drives this PRD.

**Sectioned BRD Handling**:
If BRD is split into multiple section files (folder structure `docs/01_BRD/BRD-NN_{slug}/`):
1. Read ALL section files (BRD-NN.0 through BRD-NN.18)
2. Treat as ONE logical document
3. Extract information holistically (no section-to-section mapping)

### Step 2: Reserve ID Number

Check `docs/02_PRD/` for next available ID number (e.g., PRD-01, PRD-02).

**ID Numbering Convention**: Start with 2 digits and expand only as needed.
- ✅ Correct: PRD-01, PRD-99, PRD-102
- ❌ Incorrect: PRD-001, PRD-009 (extra leading zero not required)

**ID Matching**: PRD ID does NOT need to match BRD ID (PRD-09 may implement BRD-16).

### Step 3: Create PRD Folder and Files

**Nested Folder Rule (MANDATORY)**: ALL PRDs MUST use nested folders regardless of document size.

**Folder structure**:
1. Create folder: `docs/02_PRD/PRD-NN_{slug}/`
2. Create document file(s) inside the folder

**Sectioned PRD** (for large documents >25KB):
```
docs/02_PRD/PRD-01_user_authentication/
  PRD-01.0_index.md
  PRD-01.1_executive_summary.md
  PRD-01.2_problem_statement.md
  ...
```

**Monolithic PRD** (for smaller documents ≤25KB):
```
docs/02_PRD/PRD-01_user_authentication/
  PRD-01_user_authentication.md
```

**CRITICAL**: Even monolithic PRDs MUST be in a nested folder. Never create `docs/02_PRD/PRD-NN_{slug}.md` directly in the `02_PRD/` directory.

### Step 4: Complete Document Control

Fill all required metadata fields:
- Status, Version, Dates, Author/Reviewer/Approver
- BRD Reference with `@brd` tag
- SYS-Ready Score and EARS-Ready Score (both >=90%)
- Template Variant
- Document Revision History table

### Step 5: Complete Core Sections (2-17)

**Section 2-3**: Problem context and business impact
**Section 4-6**: Users, KPIs, goals
**Section 7-9**: Scope, user stories, functional requirements
**Section 10**: Customer-facing content (MANDATORY)
**Section 11-14**: Acceptance criteria, constraints, risks, success
**Section 15-17**: Stakeholders, implementation, budget

### Step 6: Complete Traceability (Section 18)

- Add upstream BRD references
- Document downstream artifact placeholders
- Include Architecture Decision Requirements elaboration
- Add bidirectional reference table if cross-PRD dependencies exist

### Step 7: Complete References (Section 19)

Internal documentation, external standards, domain and technology references.

### Step 8: Complete EARS Enhancement Appendix (Section 20)

- Timing Profile Matrix (p50/p95/p99)
- Boundary Value Matrix (explicit operators)
- State Transition Diagram (with error states)
- Fallback Path Documentation
- EARS-Ready Checklist

### Step 9: Complete QA Strategy (Section 21)

Quality standards and testing strategy (moved from BRD).

### Step 10: Create/Update Traceability Matrix

**MANDATORY**: Create or update `docs/02_PRD/PRD-00_TRACEABILITY_MATRIX.md`

### Step 11: Update Upstream BRD Traceability (MANDATORY)

**CRITICAL - Often Missed**: When creating a PRD, you MUST update the parent BRD's traceability section.

**Process**:
1. Open the upstream BRD (e.g., `docs/01_BRD/BRD-01_platform/BRD-01_platform.md`)
2. Locate the `## Traceability` section
3. Add this PRD to `Downstream Artifacts`:
   ```markdown
  - Downstream Artifacts: [PRD-01](../../../ai_dev_ssd_flow/PROJECT/fixtures/budget_alert/PRD-01.md)
   ```
4. Commit BRD update with PRD creation (single commit)

**Why This Matters**:
- Enables bidirectional navigation between BRD and PRD
- Impact analysis: BRD changes show affected PRDs
- Audit compliance: Regulators require bidirectional traceability

**Reference**: See `.claude/skills/doc-flow/SHARED_CONTENT.md` Section 4.3 "Bidirectional Traceability Update Workflow" for complete guidance.

### Step 12: Validate PRD

```bash
# Unified PRD core validation (canonical; pre-commit/CI parity)
bash ai_dev_ssd_flow/02_PRD/scripts/prd_core_wrapper_hook.sh ai_dev_ssd_flow/02_PRD
# Includes standardized PRD element type checks + legacy pattern detection

# Full PRD validation (includes advisory checks)
bash ai_dev_ssd_flow/02_PRD/scripts/validate_prd_wrapper.sh docs/02_PRD

# Component validator (secondary diagnostics)
python ai_dev_ssd_flow/02_PRD/scripts/validate_prd.py docs/02_PRD/PRD-NN_{slug}/

# Link integrity
python ai_dev_ssd_flow/scripts/validate_links.py --path docs/02_PRD/

# Cumulative tagging validation
python ai_dev_ssd_flow/scripts/validate_tags_against_docs.py --artifact PRD-NN --expected-layers brd --strict
```

## Validation Checklist

**Structure (21 Sections)**:
- [ ] All 21 numbered sections present (1-21)
- [ ] Document Control (Section 1) at top with all required fields
- [ ] Customer-Facing Content (Section 10) has substantive content
- [ ] User Stories (Section 8) includes layer separation scope note
- [ ] EARS Enhancement Appendix (Section 20) completed
- [ ] Quality Assurance & Testing Strategy (Section 21) completed

**Document Control Required Fields**:
- [ ] Status, Version, Date Created, Last Updated
- [ ] Author, Reviewer, Approver
- [ ] BRD Reference with @brd tag
- [ ] SYS-Ready Score >=90%
- [ ] EARS-Ready Score >=90%
- [ ] Template Variant specified
- [ ] Document Revision History table initialized

**Content Quality**:
- [ ] Parent BRD identified and referenced
- [ ] Problem-Goals framework completed
- [ ] User personas and user stories defined (PRD-level only)
- [ ] Product features specified with priority levels
- [ ] KPIs quantified (measurable metrics with targets)
- [ ] Quality attributes quantified (performance, reliability)
- [ ] Risk assessment with mitigation strategies
- [ ] Architecture Decision Requirements listed (NO ADR numbers)
- [ ] EARS Enhancement Appendix complete (timing, boundary, state, fallback)

**Traceability**:
- [ ] Cumulative tags: @brd included
- [ ] Traceability matrix created/updated
- [ ] Upstream BRD traceability section updated with this PRD
- [ ] No ADR forward references
- [ ] No broken links

**Size Limits**:
- [ ] File size <50,000 tokens (standard) or <100,000 tokens (maximum)

## Post-Creation Validation (MANDATORY - NO CONFIRMATION)

**CRITICAL**: Execute this validation loop IMMEDIATELY after document creation.

```
LOOP:
  1. Run: python ai_dev_ssd_flow/scripts/validate_cross_document.py --document {doc_path} --auto-fix
  2. IF errors fixed: GOTO LOOP (re-validate)
  3. IF warnings fixed: GOTO LOOP (re-validate)
  4. IF unfixable issues: Log for manual review, continue
  5. IF clean: Mark VALIDATED, proceed
```

### Validation Command

```bash
# Per-document validation (Phase 1) - must use nested folder path
python ai_dev_ssd_flow/scripts/validate_cross_document.py --document docs/02_PRD/PRD-NN_{slug}/PRD-NN_{slug}.md --auto-fix

# Layer validation (Phase 2) - run when all PRD documents complete
python ai_dev_ssd_flow/scripts/validate_cross_document.py --layer PRD --auto-fix
```

### Validation Codes Reference

| Code | Description | Severity |
|------|-------------|----------|
| XDOC-001 | Referenced requirement ID not found | ERROR |
| XDOC-002 | Missing cumulative tag (@brd) | ERROR |
| XDOC-003 | Upstream document not found | ERROR |
| XDOC-006 | Tag format invalid | ERROR |
| XDOC-009 | Missing traceability section | ERROR |
| FWDREF-E001 | Forward reference to non-existent ADR | ERROR |

### Quality Gate

**Blocking**: YES - Cannot proceed to EARS/SYS creation until validation passes with 0 errors.

## Common Pitfalls

1. **Missing dual scores**: Both SYS-Ready and EARS-Ready scores required
2. **Incorrect section structure**: Must be exactly 21 sections (1-21) in order
3. **Missing Section 10 content**: Customer-Facing Content is MANDATORY
4. **User Stories scope violation**: Section 8 must stay at PRD-level (no EARS/BDD detail)
5. **ADR forward references**: Don't write "See ADR-033" (ADRs don't exist yet)
6. **Missing @brd tags**: Layer 2 must include Layer 1 tags
7. **ID format errors**: Use unified format PRD.NN.xxxx (not F-XXX, US-XXX, etc.)
8. **Missing EARS Enhancement Appendix**: Section 20 required for EARS-Ready score
9. **Missing upstream BRD update**: Must add PRD reference to parent BRD's Downstream Artifacts

## Template Binding (MANDATORY)

**When creating PRD documents, use EXACTLY these metadata values:**

```yaml
tags:
  - prd                 # REQUIRED - Use 'prd' NOT 'product-prd', 'feature-prd'
  - layer-2-artifact    # REQUIRED - Layer identifier

custom_fields:
  document_type: prd    # REQUIRED - Use 'prd' NOT 'product-requirements'
  artifact_type: PRD    # REQUIRED - Uppercase
  layer: 2              # REQUIRED - PRD is Layer 2
  architecture_approaches: [ai-agent-based]  # REQUIRED - Array format
```

**FORBIDDEN Values**:
- Tags: `product-prd`, `feature-prd`, `product-requirements`
- document_type: `product-requirements`, `product_requirements`
- `architecture_approach: value` (singular form)

## Diagram Standards

All diagrams MUST use Mermaid syntax. Text-based diagrams (ASCII art, box drawings) are prohibited.
See: `ai_dev_ssd_flow/DIAGRAM_STANDARDS.md` and `mermaid-gen` skill.

---

## Next Skill

After creating PRD, use:

**`doc-ears`** - Create formal EARS requirements (Layer 3)

The EARS will:
- Reference this PRD as upstream source
- Include `@brd` and `@prd` tags (cumulative)
- Use WHEN-THE-SHALL-WITHIN format
- Formalize PRD features into requirements

## Related Resources

- **Main Guide**: `ai_dev_ssd_flow/SPEC_DRIVEN_DEVELOPMENT_GUIDE.md`
- **PRD Schema**: `ai_dev_ssd_flow/02_PRD/PRD_MVP_SCHEMA.yaml`
- **PRD Template**: `ai_dev_ssd_flow/02_PRD/PRD-MVP-TEMPLATE.md`
- **PRD Creation Rules**: `ai_dev_ssd_flow/02_PRD/PRD-MVP-TEMPLATE.md`
- **PRD Validation Rules**: `ai_dev_ssd_flow/02_PRD/PRD_MVP_SCHEMA.yaml`
- **Quality Gate Validation**: `ai_dev_ssd_flow/02_PRD/PRD_MVP_QUALITY_GATE_VALIDATION.md`
- **PRD README**: `ai_dev_ssd_flow/02_PRD/README.md`
- **Shared Standards**: `.claude/skills/doc-flow/SHARED_CONTENT.md`

**Section Templates** (DEFAULT for all PRD documents):
- **Structure**: `docs/02_PRD/PRD-NN_{slug}/PRD-NN.S_{slug}.md`
- Index template: `ai_dev_ssd_flow/02_PRD/PRD-SECTION-0-TEMPLATE.md`
- Content template: `ai_dev_ssd_flow/02_PRD/PRD-SECTION-TEMPLATE.md`
- Reference: `ai_dev_ssd_flow/ID_NAMING_STANDARDS.md`

## Quick Reference

**PRD Purpose**: Define product features and user needs

**Layer**: 2

**Tags Required**: @brd (1 tag)

**Key Sections**:
- Section 1: Document Control with dual scoring (SYS-Ready + EARS-Ready >=90%)
- Section 8: User Stories (PRD-level only)
- Section 10: Customer-Facing Content (MANDATORY)
- Section 18: Traceability with Architecture Decision Requirements
- Section 20: EARS Enhancement Appendix

**Next**: doc-ears

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.3 | 2026-03-05 | Added cross-linking tags documentation (Section 6.1); Added quality gate validation reference; Added Feature ID format documentation; Verified Section 20.1 naming compliance | System |
| 1.2 | 2026-02-26 | Migrated frontmatter to `metadata` schema; updated PRD template/rules references to `ai_dev_ssd_flow` and MVP rule filenames | System |
| 1.1 | 2026-02-11 | **Nested Folder Enforcement**: Fixed all paths from `docs/PRD/` to `docs/02_PRD/` and `docs/BRD/` to `docs/01_BRD/`; Removed OPTIONAL monolithic path outside nested folder; All PRDs must now be in nested folders regardless of size | System |
| 1.0 | 2026-02-08 | Initial skill definition with YAML frontmatter standardization | System |
