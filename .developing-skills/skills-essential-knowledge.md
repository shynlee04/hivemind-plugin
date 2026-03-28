Skill Writing Guide
## Anatomy of a Skill
Anatomy of a Skill
Every skill consists of a required SKILL.md file and optional bundled resources:
```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter metadata (required)
│   │   ├── name: (required)
│   │   └── description: (required)
│   └── Markdown instructions (required)
└── Bundled Resources (optional)
    ├── scripts/          - Executable code (Python/Bash/etc.)
    ├── references/       - Documentation intended to be loaded into context as needed
    └── assets/           - Files used in output (templates, icons, fonts, etc.)
```
## SKILL.md (required)

Metadata Quality: The name and description in YAML frontmatter determine when Claude will use the skill. Be specific about what the skill does and when to use it. Use the third-person (e.g. "This skill should be used when..." instead of "Use this skill when...").

## Bundled Resources (optional)

Scripts (scripts/)
Executable code (Python/Bash/etc.) for tasks that require deterministic reliability or are repeatedly rewritten.

When to include: When the same code is being rewritten repeatedly or deterministic reliability is needed
Example: scripts/rotate_pdf.py for PDF rotation tasks
Benefits: Token efficient, deterministic, may be executed without loading into context
Note: Scripts may still need to be read by Claude for patching or environment-specific adjustments


## References (references/)

Documentation and reference material intended to be loaded as needed into context to inform Claude's process and thinking.

When to include: For documentation that Claude should reference while working
Examples: references/finance.md for financial schemas, references/mnda.md for company NDA template, references/policies.md for company policies, references/api_docs.md for API specifications
Use cases: Database schemas, API documentation, domain knowledge, company policies, detailed workflow guides
Benefits: Keeps SKILL.md lean, loaded only when Claude determines it's needed
Best practice: If files are large (>10k words), include grep search patterns in SKILL.md
Avoid duplication: Information should live in either SKILL.md or references files, not both. Prefer references files for detailed information unless it's truly core to the skill—this keeps SKILL.md lean while making information discoverable without hogging the context window. Keep only essential procedural instructions and workflow guidance in SKILL.md; move detailed reference material, schemas, and examples to references files.


## Assets (assets/)
Files not intended to be loaded into context, but rather used within the output Claude produces.

When to include: When the skill needs files that will be used in the final output
Examples: assets/logo.png for brand assets, assets/slides.pptx for PowerPoint templates, assets/frontend-template/ for HTML/React boilerplate, assets/font.ttf for typography
Use cases: Templates, images, icons, boilerplate code, fonts, sample documents that get copied or modified
Benefits: Separates output resources from documentation, enables Claude to use files without loading them into context

## Progressive Disclosure Design Principle
Skills use a three-level loading system to manage context efficiently:

Metadata (name + description) - Always in context (~100 words)
SKILL.md body - When skill triggers (<5k words)
Bundled resources - As needed by Claude (Unlimited*)
*Unlimited because scripts can be executed without reading into context window.