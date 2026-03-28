Skill Development for Claude Code Plugins
This skill provides guidance for creating effective skills for Claude Code plugins.

About Skills
Skills are modular, self-contained packages that extend Claude's capabilities by providing specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific domains or tasks—they transform Claude from a general-purpose agent into a specialized agent equipped with procedural knowledge that no model can fully possess.

What Skills Provide
Specialized workflows - Multi-step procedures for specific domains
Tool integrations - Instructions for working with specific file formats or APIs
Domain expertise - Company-specific knowledge, schemas, business logic
Bundled resources - Scripts, references, and assets for complex and repetitive tasks
Anatomy of a Skill
Every skill consists of a required SKILL.md file and optional bundled resources:

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
SKILL.md (required)
Metadata Quality: The name and description in YAML frontmatter determine when Claude will use the skill. Be specific about what the skill does and when to use it. Use the third-person (e.g. "This skill should be used when..." instead of "Use this skill when...").

Bundled Resources (optional)
Scripts (scripts/)
Executable code (Python/Bash/etc.) for tasks that require deterministic reliability or are repeatedly rewritten.

When to include: When the same code is being rewritten repeatedly or deterministic reliability is needed
Example: scripts/rotate_pdf.py for PDF rotation tasks
Benefits: Token efficient, deterministic, may be executed without loading into context
Note: Scripts may still need to be read by Claude for patching or environment-specific adjustments
References (references/)
Documentation and reference material intended to be loaded as needed into context to inform Claude's process and thinking.

When to include: For documentation that Claude should reference while working
Examples: references/finance.md for financial schemas, references/mnda.md for company NDA template, references/policies.md for company policies, references/api_docs.md for API specifications
Use cases: Database schemas, API documentation, domain knowledge, company policies, detailed workflow guides
Benefits: Keeps SKILL.md lean, loaded only when Claude determines it's needed
Best practice: If files are large (>10k words), include grep search patterns in SKILL.md
Avoid duplication: Information should live in either SKILL.md or references files, not both. Prefer references files for detailed information unless it's truly core to the skill—this keeps SKILL.md lean while making information discoverable without hogging the context window. Keep only essential procedural instructions and workflow guidance in SKILL.md; move detailed reference material, schemas, and examples to references files.
Assets (assets/)
Files not intended to be loaded into context, but rather used within the output Claude produces.

When to include: When the skill needs files that will be used in the final output
Examples: assets/logo.png for brand assets, assets/slides.pptx for PowerPoint templates, assets/frontend-template/ for HTML/React boilerplate, assets/font.ttf for typography
Use cases: Templates, images, icons, boilerplate code, fonts, sample documents that get copied or modified
Benefits: Separates output resources from documentation, enables Claude to use files without loading them into context
Progressive Disclosure Design Principle
Skills use a three-level loading system to manage context efficiently:

Metadata (name + description) - Always in context (~100 words)
SKILL.md body - When skill triggers (<5k words)
Bundled resources - As needed by Claude (Unlimited*)
*Unlimited because scripts can be executed without reading into context window.

Skill Creation Process
To create a skill, follow the "Skill Creation Process" in order, skipping steps only if there is a clear reason why they are not applicable.

Step 1: Understanding the Skill with Concrete Examples
Skip this step only when the skill's usage patterns are already clearly understood. It remains valuable even when working with an existing skill.

To create an effective skill, clearly understand concrete examples of how the skill will be used. This understanding can come from either direct user examples or generated examples that are validated with user feedback.

For example, when building an image-editor skill, relevant questions include:

"What functionality should the image-editor skill support? Editing, rotating, anything else?"
"Can you give some examples of how this skill would be used?"
"I can imagine users asking for things like 'Remove the red-eye from this image' or 'Rotate this image'. Are there other ways you imagine this skill being used?"
"What would a user say that should trigger this skill?"
To avoid overwhelming users, avoid asking too many questions in a single message. Start with the most important questions and follow up as needed for better effectiveness.

Conclude this step when there is a clear sense of the functionality the skill should support.

Step 2: Planning the Reusable Skill Contents
To turn concrete examples into an effective skill, analyze each example by:

Considering how to execute on the example from scratch
Identifying what scripts, references, and assets would be helpful when executing these workflows repeatedly
Example: When building a pdf-editor skill to handle queries like "Help me rotate this PDF," the analysis shows:

Rotating a PDF requires re-writing the same code each time
A scripts/rotate_pdf.py script would be helpful to store in the skill
Example: When designing a frontend-webapp-builder skill for queries like "Build me a todo app" or "Build me a dashboard to track my steps," the analysis shows:

Writing a frontend webapp requires the same boilerplate HTML/React each time
An assets/hello-world/ template containing the boilerplate HTML/React project files would be helpful to store in the skill
Example: When building a big-query skill to handle queries like "How many users have logged in today?" the analysis shows:

Querying BigQuery requires re-discovering the table schemas and relationships each time
A references/schema.md file documenting the table schemas would be helpful to store in the skill
For Claude Code plugins: When building a hooks skill, the analysis shows:

Developers repeatedly need to validate hooks.json and test hook scripts
scripts/validate-hook-schema.sh and scripts/test-hook.sh utilities would be helpful
references/patterns.md for detailed hook patterns to avoid bloating SKILL.md
To establish the skill's contents, analyze each concrete example to create a list of the reusable resources to include: scripts, references, and assets.

Step 3: Create Skill Structure
For Claude Code plugins, create the skill directory structure:

mkdir -p plugin-name/skills/skill-name/{references,examples,scripts}
touch plugin-name/skills/skill-name/SKILL.md
Note: Unlike the generic skill-creator which uses init_skill.py, plugin skills are created directly in the plugin's skills/ directory with a simpler manual structure.

Step 4: Edit the Skill
When editing the (newly-created or existing) skill, remember that the skill is being created for another instance of Claude to use. Focus on including information that would be beneficial and non-obvious to Claude. Consider what procedural knowledge, domain-specific details, or reusable assets would help another Claude instance execute these tasks more effectively.

Start with Reusable Skill Contents
To begin implementation, start with the reusable resources identified above: scripts/, references/, and assets/ files. Note that this step may require user input. For example, when implementing a brand-guidelines skill, the user may need to provide brand assets or templates to store in assets/, or documentation to store in references/.

Also, delete any example files and directories not needed for the skill. Create only the directories you actually need (references/, examples/, scripts/).

Update SKILL.md
Writing Style: Write the entire skill using imperative/infinitive form (verb-first instructions), not second person. Use objective, instructional language (e.g., "To accomplish X, do Y" rather than "You should do X" or "If you need to do X"). This maintains consistency and clarity for AI consumption.

Description (Frontmatter): Use third-person format with specific trigger phrases:

---
name: Skill Name
description: This skill should be used when the user asks to "specific phrase 1", "specific phrase 2", "specific phrase 3". Include exact phrases users would say that should trigger this skill. Be concrete and specific.
version: 0.1.0
---
Good description examples:

description: This skill should be used when the user asks to "create a hook", "add a PreToolUse hook", "validate tool use", "implement prompt-based hooks", or mentions hook events (PreToolUse, PostToolUse, Stop).
Bad description examples:

description: Use this skill when working with hooks.  # Wrong person, vague
description: Load when user needs hook help.  # Not third person
description: Provides hook guidance.  # No trigger phrases
To complete SKILL.md body, answer the following questions:

What is the purpose of the skill, in a few sentences?
When should the skill be used? (Include this in frontmatter description with specific triggers)
In practice, how should Claude use the skill? All reusable skill contents developed above should be referenced so that Claude knows how to use them.
Keep SKILL.md lean: Target 1,500-2,000 words for the body. Move detailed content to references/:

Detailed patterns → references/patterns.md
Advanced techniques → references/advanced.md
Migration guides → references/migration.md
API references → references/api-reference.md
Reference resources in SKILL.md:

## Additional Resources

### Reference Files

For detailed patterns and techniques, consult:
- **`references/patterns.md`** - Common patterns
- **`references/advanced.md`** - Advanced use cases

### Example Files

Working examples in `examples/`:
- **`example-script.sh`** - Working example
Step 5: Validate and Test
For plugin skills, validation is different from generic skills:

Check structure: Skill directory in plugin-name/skills/skill-name/
Validate SKILL.md: Has frontmatter with name and description
Check trigger phrases: Description includes specific user queries
Verify writing style: Body uses imperative/infinitive form, not second person
Test progressive disclosure: SKILL.md is lean (~1,500-2,000 words), detailed content in references/
Check references: All referenced files exist
Validate examples: Examples are complete and correct
Test scripts: Scripts are executable and work correctly
Use the skill-reviewer agent:

Ask: "Review my skill and check if it follows best practices"
The skill-reviewer agent will check description quality, content organization, and progressive disclosure.

Step 6: Iterate
After testing the skill, users may request improvements. Often this happens right after using the skill, with fresh context of how the skill performed.

Iteration workflow:

Use the skill on real tasks
Notice struggles or inefficiencies
Identify how SKILL.md or bundled resources should be updated
Implement changes and test again
Common improvements:

Strengthen trigger phrases in description
Move long sections from SKILL.md to references/
Add missing examples or scripts
Clarify ambiguous instructions
Add edge case handling
Plugin-Specific Considerations
Skill Location in Plugins
Plugin skills live in the plugin's skills/ directory:

my-plugin/
├── .claude-plugin/
│   └── plugin.json
├── commands/
├── agents/
└── skills/
    └── my-skill/
        ├── SKILL.md
        ├── references/
        ├── examples/
        └── scripts/
Auto-Discovery
Claude Code automatically discovers skills:

Scans skills/ directory
Finds subdirectories containing SKILL.md
Loads skill metadata (name + description) always
Loads SKILL.md body when skill triggers
Loads references/examples when needed
No Packaging Needed
Plugin skills are distributed as part of the plugin, not as separate ZIP files. Users get skills when they install the plugin.

Testing in Plugins
Test skills by installing plugin locally:

# Test with --plugin-dir
cc --plugin-dir /path/to/plugin

# Ask questions that should trigger the skill
# Verify skill loads correctly
Examples from Plugin-Dev
Study the skills in this plugin as examples of best practices:

hook-development skill:

Excellent trigger phrases: "create a hook", "add a PreToolUse hook", etc.
Lean SKILL.md (1,651 words)
3 references/ files for detailed content
3 examples/ of working hooks
3 scripts/ utilities
agent-development skill:

Strong triggers: "create an agent", "agent frontmatter", etc.
Focused SKILL.md (1,438 words)
References include the AI generation prompt from Claude Code
Complete agent examples
plugin-settings skill:

Specific triggers: "plugin settings", ".local.md files", "YAML frontmatter"
References show real implementations (multi-agent-swarm, ralph-wiggum)
Working parsing scripts
Each demonstrates progressive disclosure and strong triggering.

Progressive Disclosure in Practice
What Goes in SKILL.md
Include (always loaded when skill triggers):

Core concepts and overview
Essential procedures and workflows
Quick reference tables
Pointers to references/examples/scripts
Most common use cases
Keep under 3,000 words, ideally 1,500-2,000 words

What Goes in references/
Move to references/ (loaded as needed):

Detailed patterns and advanced techniques
Comprehensive API documentation
Migration guides
Edge cases and troubleshooting
Extensive examples and walkthroughs
Each reference file can be large (2,000-5,000+ words)

What Goes in examples/
Working code examples:

Complete, runnable scripts
Configuration files
Template files
Real-world usage examples
Users can copy and adapt these directly

What Goes in scripts/
Utility scripts:

Validation tools
Testing helpers
Parsing utilities
Automation scripts
Should be executable and documented

Writing Style Requirements
Imperative/Infinitive Form
Write using verb-first instructions, not second person:

Correct (imperative):

To create a hook, define the event type.
Configure the MCP server with authentication.
Validate settings before use.
Incorrect (second person):

You should create a hook by defining the event type.
You need to configure the MCP server.
You must validate settings before use.
Third-Person in Description
The frontmatter description must use third person:

Correct:

description: This skill should be used when the user asks to "create X", "configure Y"...
Incorrect:

description: Use this skill when you want to create X...
description: Load this skill when user asks...
Objective, Instructional Language
Focus on what to do, not who should do it:

Correct:

Parse the frontmatter using sed.
Extract fields with grep.
Validate values before use.
Incorrect:

You can parse the frontmatter...
Claude should extract fields...
The user might validate values...
Validation Checklist
Before finalizing a skill:

Structure:

 SKILL.md file exists with valid YAML frontmatter
 Frontmatter has name and description fields
 Markdown body is present and substantial
 Referenced files actually exist
Description Quality:

 Uses third person ("This skill should be used when...")
 Includes specific trigger phrases users would say
 Lists concrete scenarios ("create X", "configure Y")
 Not vague or generic
Content Quality:

 SKILL.md body uses imperative/infinitive form
 Body is focused and lean (1,500-2,000 words ideal, <5k max)
 Detailed content moved to references/
 Examples are complete and working
 Scripts are executable and documented
Progressive Disclosure:

 Core concepts in SKILL.md
 Detailed docs in references/
 Working code in examples/
 Utilities in scripts/
 SKILL.md references these resources
Testing:

 Skill triggers on expected user queries
 Content is helpful for intended tasks
 No duplicated information across files
 References load when needed
Common Mistakes to Avoid
Mistake 1: Weak Trigger Description
❌ Bad:

description: Provides guidance for working with hooks.
Why bad: Vague, no specific trigger phrases, not third person

✅ Good:

description: This skill should be used when the user asks to "create a hook", "add a PreToolUse hook", "validate tool use", or mentions hook events. Provides comprehensive hooks API guidance.
Why good: Third person, specific phrases, concrete scenarios

Mistake 2: Too Much in SKILL.md
❌ Bad:

skill-name/
└── SKILL.md  (8,000 words - everything in one file)
Why bad: Bloats context when skill loads, detailed content always loaded

✅ Good:

skill-name/
├── SKILL.md  (1,800 words - core essentials)
└── references/
    ├── patterns.md (2,500 words)
    └── advanced.md (3,700 words)
Why good: Progressive disclosure, detailed content loaded only when needed

Mistake 3: Second Person Writing
❌ Bad:

You should start by reading the configuration file.
You need to validate the input.
You can use the grep tool to search.
Why bad: Second person, not imperative form

✅ Good:

Start by reading the configuration file.
Validate the input before processing.
Use the grep tool to search for patterns.
Why good: Imperative form, direct instructions

Mistake 4: Missing Resource References
❌ Bad:

# SKILL.md

[Core content]

[No mention of references/ or examples/]
Why bad: Claude doesn't know references exist

✅ Good:

# SKILL.md

[Core content]

## Additional Resources

### Reference Files
- **`references/patterns.md`** - Detailed patterns
- **`references/advanced.md`** - Advanced techniques

### Examples
- **`examples/script.sh`** - Working example
Why good: Claude knows where to find additional information

Quick Reference
Minimal Skill
skill-name/
└── SKILL.md
Good for: Simple knowledge, no complex resources needed

Standard Skill (Recommended)
skill-name/
├── SKILL.md
├── references/
│   └── detailed-guide.md
└── examples/
    └── working-example.sh
Good for: Most plugin skills with detailed documentation

Complete Skill
skill-name/
├── SKILL.md
├── references/
│   ├── patterns.md
│   └── advanced.md
├── examples/
│   ├── example1.sh
│   └── example2.json
└── scripts/
    └── validate.sh
Good for: Complex domains with validation utilities

Best Practices Summary
✅ DO:

Use third-person in description ("This skill should be used when...")
Include specific trigger phrases ("create X", "configure Y")
Keep SKILL.md lean (1,500-2,000 words)
Use progressive disclosure (move details to references/)
Write in imperative/infinitive form
Reference supporting files clearly
Provide working examples
Create utility scripts for common operations
Study plugin-dev's skills as templates
❌ DON'T:

Use second person anywhere
Have vague trigger conditions
Put everything in SKILL.md (>3,000 words without references/)
Write in second person ("You should...")
Leave resources unreferenced
Include broken or incomplete examples
Skip validation
Additional Resources
Study These Skills
Plugin-dev's skills demonstrate best practices:

../hook-development/ - Progressive disclosure, utilities
../agent-development/ - AI-assisted creation, references
../mcp-integration/ - Comprehensive references
../plugin-settings/ - Real-world examples
../command-development/ - Clear critical concepts
../plugin-structure/ - Good organization
Reference Files
For complete skill-creator methodology:

references/skill-creator-original.md - Full original skill-creator content
Implementation Workflow
To create a skill for your plugin:

Understand use cases: Identify concrete examples of skill usage
Plan resources: Determine what scripts/references/examples needed
Create structure: mkdir -p skills/skill-name/{references,examples,scripts}
Write SKILL.md:
Frontmatter with third-person description and trigger phrases
Lean body (1,500-2,000 words) in imperative form
Reference supporting files
Add resources: Create references/, examples/, scripts/ as needed
Validate: Check description, writing style, organization
Test: Verify skill loads on expected triggers
Iterate: Improve based on usage
Focus on strong trigger descriptions, progressive disclosure, and imperative writing style for effective skills that load when needed and provide targeted guidance.
About Skills
Skills are modular, self-contained packages that extend Claude's capabilities by providing specialized knowledge, workflows, and tools. Think of them as "onboarding guides" for specific domains or tasks—they transform Claude from a general-purpose agent into a specialized agent equipped with procedural knowledge that no model can fully possess.

What Skills Provide
Specialized workflows - Multi-step procedures for specific domains
Tool integrations - Instructions for working with specific file formats or APIs
Domain expertise - Company-specific knowledge, schemas, business logic
Bundled resources - Scripts, references, and assets for complex and repetitive tasks
Core Principles
Concise is Key
The context window is a public good. Skills share the context window with everything else Claude needs: system prompt, conversation history, other Skills' metadata, and the actual user request.

Default assumption: Claude is already very smart. Only add context Claude doesn't already have. Challenge each piece of information: "Does Claude really need this explanation?" and "Does this paragraph justify its token cost?"

Prefer concise examples over verbose explanations.

Set Appropriate Degrees of Freedom
Match the level of specificity to the task's fragility and variability:

High freedom (text-based instructions): Use when multiple approaches are valid, decisions depend on context, or heuristics guide the approach.

Medium freedom (pseudocode or scripts with parameters): Use when a preferred pattern exists, some variation is acceptable, or configuration affects behavior.

Low freedom (specific scripts, few parameters): Use when operations are fragile and error-prone, consistency is critical, or a specific sequence must be followed.

Think of Claude as exploring a path: a narrow bridge with cliffs needs specific guardrails (low freedom), while an open field allows many routes (high freedom).

Anatomy of a Skill
Every skill consists of a required SKILL.md file and optional bundled resources:

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
SKILL.md (required)
Every SKILL.md consists of:

Frontmatter (YAML): Contains name and description fields. These are the only fields that Claude reads to determine when the skill gets used, thus it is very important to be clear and comprehensive in describing what the skill is, and when it should be used.
Body (Markdown): Instructions and guidance for using the skill. Only loaded AFTER the skill triggers (if at all).
Bundled Resources (optional)
Scripts (scripts/)
Executable code (Python/Bash/etc.) for tasks that require deterministic reliability or are repeatedly rewritten.

When to include: When the same code is being rewritten repeatedly or deterministic reliability is needed
Example: scripts/rotate_pdf.py for PDF rotation tasks
Benefits: Token efficient, deterministic, may be executed without loading into context
Note: Scripts may still need to be read by Claude for patching or environment-specific adjustments
References (references/)
Documentation and reference material intended to be loaded as needed into context to inform Claude's process and thinking.

When to include: For documentation that Claude should reference while working
Examples: references/finance.md for financial schemas, references/mnda.md for company NDA template, references/policies.md for company policies, references/api_docs.md for API specifications
Use cases: Database schemas, API documentation, domain knowledge, company policies, detailed workflow guides
Benefits: Keeps SKILL.md lean, loaded only when Claude determines it's needed
Best practice: If files are large (>10k words), include grep search patterns in SKILL.md
Avoid duplication: Information should live in either SKILL.md or references files, not both. Prefer references files for detailed information unless it's truly core to the skill—this keeps SKILL.md lean while making information discoverable without hogging the context window. Keep only essential procedural instructions and workflow guidance in SKILL.md; move detailed reference material, schemas, and examples to references files.
Assets (assets/)
Files not intended to be loaded into context, but rather used within the output Claude produces.

When to include: When the skill needs files that will be used in the final output
Examples: assets/logo.png for brand assets, assets/slides.pptx for PowerPoint templates, assets/frontend-template/ for HTML/React boilerplate, assets/font.ttf for typography
Use cases: Templates, images, icons, boilerplate code, fonts, sample documents that get copied or modified
Benefits: Separates output resources from documentation, enables Claude to use files without loading them into context
What to Not Include in a Skill
A skill should only contain essential files that directly support its functionality. Do NOT create extraneous documentation or auxiliary files, including:

README.md
INSTALLATION_GUIDE.md
QUICK_REFERENCE.md
CHANGELOG.md
etc.
The skill should only contain the information needed for an AI agent to do the job at hand. It should not contain auxilary context about the process that went into creating it, setup and testing procedures, user-facing documentation, etc. Creating additional documentation files just adds clutter and confusion.

Progressive Disclosure Design Principle
Skills use a three-level loading system to manage context efficiently:

Metadata (name + description) - Always in context (~100 words)
SKILL.md body - When skill triggers (<5k words)
Bundled resources - As needed by Claude (Unlimited because scripts can be executed without reading into context window)
Progressive Disclosure Patterns
Keep SKILL.md body to the essentials and under 500 lines to minimize context bloat. Split content into separate files when approaching this limit. When splitting out content into other files, it is very important to reference them from SKILL.md and describe clearly when to read them, to ensure the reader of the skill knows they exist and when to use them.

Key principle: When a skill supports multiple variations, frameworks, or options, keep only the core workflow and selection guidance in SKILL.md. Move variant-specific details (patterns, examples, configuration) into separate reference files.

Pattern 1: High-level guide with references

# PDF Processing

## Quick start

Extract text with pdfplumber:
[code example]

## Advanced features

- **Form filling**: See [FORMS.md](FORMS.md) for complete guide
- **API reference**: See [REFERENCE.md](REFERENCE.md) for all methods
- **Examples**: See [EXAMPLES.md](EXAMPLES.md) for common patterns
Claude loads FORMS.md, REFERENCE.md, or EXAMPLES.md only when needed.

Pattern 2: Domain-specific organization

For Skills with multiple domains, organize content by domain to avoid loading irrelevant context:

bigquery-skill/
├── SKILL.md (overview and navigation)
└── reference/
    ├── finance.md (revenue, billing metrics)
    ├── sales.md (opportunities, pipeline)
    ├── product.md (API usage, features)
    └── marketing.md (campaigns, attribution)
When a user asks about sales metrics, Claude only reads sales.md.

Similarly, for skills supporting multiple frameworks or variants, organize by variant:

cloud-deploy/
├── SKILL.md (workflow + provider selection)
└── references/
    ├── aws.md (AWS deployment patterns)
    ├── gcp.md (GCP deployment patterns)
    └── azure.md (Azure deployment patterns)
When the user chooses AWS, Claude only reads aws.md.

Pattern 3: Conditional details

Show basic content, link to advanced content:

# DOCX Processing

## Creating documents

Use docx-js for new documents. See [DOCX-JS.md](DOCX-JS.md).

## Editing documents

For simple edits, modify the XML directly.

**For tracked changes**: See [REDLINING.md](REDLINING.md)
**For OOXML details**: See [OOXML.md](OOXML.md)
Claude reads REDLINING.md or OOXML.md only when the user needs those features.

Important guidelines:

Avoid deeply nested references - Keep references one level deep from SKILL.md. All reference files should link directly from SKILL.md.
Structure longer reference files - For files longer than 100 lines, include a table of contents at the top so Claude can see the full scope when previewing.
Skill Creation Process
Skill creation involves these steps:

Understand the skill with concrete examples
Plan reusable skill contents (scripts, references, assets)
Initialize the skill (run init_skill.py)
Edit the skill (implement resources and write SKILL.md)
Package the skill (run package_skill.py)
Iterate based on real usage
Follow these steps in order, skipping only if there is a clear reason why they are not applicable.

Step 1: Understanding the Skill with Concrete Examples
Skip this step only when the skill's usage patterns are already clearly understood. It remains valuable even when working with an existing skill.

To create an effective skill, clearly understand concrete examples of how the skill will be used. This understanding can come from either direct user examples or generated examples that are validated with user feedback.

For example, when building an image-editor skill, relevant questions include:

"What functionality should the image-editor skill support? Editing, rotating, anything else?"
"Can you give some examples of how this skill would be used?"
"I can imagine users asking for things like 'Remove the red-eye from this image' or 'Rotate this image'. Are there other ways you imagine this skill being used?"
"What would a user say that should trigger this skill?"
To avoid overwhelming users, avoid asking too many questions in a single message. Start with the most important questions and follow up as needed for better effectiveness.

Conclude this step when there is a clear sense of the functionality the skill should support.

Step 2: Planning the Reusable Skill Contents
To turn concrete examples into an effective skill, analyze each example by:

Considering how to execute on the example from scratch
Identifying what scripts, references, and assets would be helpful when executing these workflows repeatedly
Example: When building a pdf-editor skill to handle queries like "Help me rotate this PDF," the analysis shows:

Rotating a PDF requires re-writing the same code each time
A scripts/rotate_pdf.py script would be helpful to store in the skill
Example: When designing a frontend-webapp-builder skill for queries like "Build me a todo app" or "Build me a dashboard to track my steps," the analysis shows:

Writing a frontend webapp requires the same boilerplate HTML/React each time
An assets/hello-world/ template containing the boilerplate HTML/React project files would be helpful to store in the skill
Example: When building a big-query skill to handle queries like "How many users have logged in today?" the analysis shows:

Querying BigQuery requires re-discovering the table schemas and relationships each time
A references/schema.md file documenting the table schemas would be helpful to store in the skill
To establish the skill's contents, analyze each concrete example to create a list of the reusable resources to include: scripts, references, and assets.

Step 3: Initializing the Skill
At this point, it is time to actually create the skill.

Skip this step only if the skill being developed already exists, and iteration or packaging is needed. In this case, continue to the next step.

When creating a new skill from scratch, always run the init_skill.py script. The script conveniently generates a new template skill directory that automatically includes everything a skill requires, making the skill creation process much more efficient and reliable.

Usage:

scripts/init_skill.py <skill-name> --path <output-directory>
The script:

Creates the skill directory at the specified path
Generates a SKILL.md template with proper frontmatter and TODO placeholders
Creates example resource directories: scripts/, references/, and assets/
Adds example files in each directory that can be customized or deleted
After initialization, customize or remove the generated SKILL.md and example files as needed.

Step 4: Edit the Skill
When editing the (newly-generated or existing) skill, remember that the skill is being created for another instance of Claude to use. Include information that would be beneficial and non-obvious to Claude. Consider what procedural knowledge, domain-specific details, or reusable assets would help another Claude instance execute these tasks more effectively.

Learn Proven Design Patterns
Consult these helpful guides based on your skill's needs:

Multi-step processes: See references/workflows.md for sequential workflows and conditional logic
Specific output formats or quality standards: See references/output-patterns.md for template and example patterns
These files contain established best practices for effective skill design.

Start with Reusable Skill Contents
To begin implementation, start with the reusable resources identified above: scripts/, references/, and assets/ files. Note that this step may require user input. For example, when implementing a brand-guidelines skill, the user may need to provide brand assets or templates to store in assets/, or documentation to store in references/.

Added scripts must be tested by actually running them to ensure there are no bugs and that the output matches what is expected. If there are many similar scripts, only a representative sample needs to be tested to ensure confidence that they all work while balancing time to completion.

Any example files and directories not needed for the skill should be deleted. The initialization script creates example files in scripts/, references/, and assets/ to demonstrate structure, but most skills won't need all of them.

Update SKILL.md
Writing Guidelines: Always use imperative/infinitive form.

Frontmatter
Write the YAML frontmatter with name and description:

name: The skill name
description: This is the primary triggering mechanism for your skill, and helps Claude understand when to use the skill.
Include both what the Skill does and specific triggers/contexts for when to use it.
Include all "when to use" information here - Not in the body. The body is only loaded after triggering, so "When to Use This Skill" sections in the body are not helpful to Claude.
Example description for a docx skill: "Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extraction. Use when Claude needs to work with professional documents (.docx files) for: (1) Creating new documents, (2) Modifying or editing content, (3) Working with tracked changes, (4) Adding comments, or any other document tasks"
Do not include any other fields in YAML frontmatter.

Body
Write instructions for using the skill and its bundled resources.

Step 5: Packaging a Skill
Once development of the skill is complete, it must be packaged into a distributable .skill file that gets shared with the user. The packaging process automatically validates the skill first to ensure it meets all requirements:

scripts/package_skill.py <path/to/skill-folder>
Optional output directory specification:

scripts/package_skill.py <path/to/skill-folder> ./dist
The packaging script will:

Validate the skill automatically, checking:

YAML frontmatter format and required fields
Skill naming conventions and directory structure
Description completeness and quality
File organization and resource references
Package the skill if validation passes, creating a .skill file named after the skill (e.g., my-skill.skill) that includes all files and maintains the proper directory structure for distribution. The .skill file is a zip file with a .skill extension.

If validation fails, the script will report the errors and exit without creating a package. Fix any validation errors and run the packaging command again.

Step 6: Iterate
After testing the skill, users may request improvements. Often this happens right after using the skill, with fresh context of how the skill performed.

Iteration workflow:

Use the skill on real tasks
Notice struggles or inefficiencies
Identify how SKILL.md or bundled resources should be updated
Implement changes and test again

Skill Judge
Evaluate Agent Skills against official specifications and patterns derived from 17+ official examples.

Core Philosophy
What is a Skill?
A Skill is NOT a tutorial. A Skill is a knowledge externalization mechanism.

Traditional AI knowledge is locked in model parameters. To teach new capabilities:

Traditional: Collect data → GPU cluster → Train → Deploy new version
Cost: $10,000 - $1,000,000+
Timeline: Weeks to months
Skills change this:

Skill: Edit SKILL.md → Save → Takes effect on next invocation
Cost: $0
Timeline: Instant
This is the paradigm shift from "training AI" to "educating AI" — like a hot-swappable LoRA adapter that requires no training. You edit a Markdown file in natural language, and the model's behavior changes.

The Core Formula
Good Skill = Expert-only Knowledge − What Claude Already Knows

A Skill's value is measured by its knowledge delta — the gap between what it provides and what the model already knows.

Expert-only knowledge: Decision trees, trade-offs, edge cases, anti-patterns, domain-specific thinking frameworks — things that take years of experience to accumulate
What Claude already knows: Basic concepts, standard library usage, common programming patterns, general best practices
When a Skill explains "what is PDF" or "how to write a for-loop", it's compressing knowledge Claude already has. This is token waste — context window is a public resource shared with system prompts, conversation history, other Skills, and user requests.

Tool vs Skill
Concept	Essence	Function	Example
Tool	What model CAN do	Execute actions	bash, read_file, write_file, WebSearch
Skill	What model KNOWS how to do	Guide decisions	PDF processing, MCP building, frontend design
Tools define capability boundaries — without bash tool, model can't execute commands. Skills inject knowledge — without frontend-design Skill, model produces generic UI.

The equation:

General Agent + Excellent Skill = Domain Expert Agent
Same Claude model, different Skills loaded, becomes different experts.

Three Types of Knowledge in Skills
When evaluating, categorize each section:

Type	Definition	Treatment
Expert	Claude genuinely doesn't know this	Must keep — this is the Skill's value
Activation	Claude knows but may not think of	Keep if brief — serves as reminder
Redundant	Claude definitely knows this	Should delete — wastes tokens
The art of Skill design is maximizing Expert content, using Activation sparingly, and eliminating Redundant ruthlessly.

Evaluation Dimensions (120 points total)
D1: Knowledge Delta (20 points) — THE CORE DIMENSION
The most important dimension. Does the Skill add genuine expert knowledge?

Score	Criteria
0-5	Explains basics Claude knows (what is X, how to write code, standard library tutorials)
6-10	Mixed: some expert knowledge diluted by obvious content
11-15	Mostly expert knowledge with minimal redundancy
16-20	Pure knowledge delta — every paragraph earns its tokens
Red flags (instant score ≤5):

"What is [basic concept]" sections
Step-by-step tutorials for standard operations
Explaining how to use common libraries
Generic best practices ("write clean code", "handle errors")
Definitions of industry-standard terms
Green flags (indicators of high knowledge delta):

Decision trees for non-obvious choices ("when X fails, try Y because Z")
Trade-offs only an expert would know ("A is faster but B handles edge case C")
Edge cases from real-world experience
"NEVER do X because [non-obvious reason]"
Domain-specific thinking frameworks
Evaluation questions:

For each section, ask: "Does Claude already know this?"
If explaining something, ask: "Is this explaining TO Claude or FOR Claude?"
Count paragraphs that are Expert vs Activation vs Redundant
D2: Mindset + Appropriate Procedures (15 points)
Does the Skill transfer expert thinking patterns along with necessary domain-specific procedures?

The difference between experts and novices isn't "knowing how to operate" — it's "how to think about the problem." But thinking patterns alone aren't enough when Claude lacks domain-specific procedural knowledge.

Key distinction:

Type	Example	Value
Thinking patterns	"Before designing, ask: What makes this memorable?"	High — shapes decision-making
Domain-specific procedures	"OOXML workflow: unpack → edit XML → validate → pack"	High — Claude may not know this
Generic procedures	"Step 1: Open file, Step 2: Edit, Step 3: Save"	Low — Claude already knows
Score	Criteria
0-3	Only generic procedures Claude already knows
4-7	Has domain procedures but lacks thinking frameworks
8-11	Good balance: thinking patterns + domain-specific workflows
12-15	Expert-level: shapes thinking AND provides procedures Claude wouldn't know
What counts as valuable procedures:

Workflows Claude hasn't been trained on (new tools, proprietary systems)
Correct ordering that's non-obvious (e.g., "validate BEFORE packing, not after")
Critical steps that are easy to miss (e.g., "MUST recalculate formulas after editing")
Domain-specific sequences (e.g., MCP server's 4-phase development process)
What counts as redundant procedures:

Generic file operations (open, read, write, save)
Standard programming patterns (loops, conditionals, error handling)
Common library usage that's well-documented
Expert thinking patterns look like:

Before [action], ask yourself:
- **Purpose**: What problem does this solve? Who uses it?
- **Constraints**: What are the hidden requirements?
- **Differentiation**: What makes this solution memorable?
Valuable domain procedures look like:

### Redlining Workflow (Claude wouldn't know this sequence)
1. Convert to markdown: `pandoc --track-changes=all`
2. Map text to XML: grep for text in document.xml
3. Implement changes in batches of 3-10
4. Pack and verify: check ALL changes were applied
Redundant generic procedures look like:

Step 1: Open the file
Step 2: Find the section
Step 3: Make the change
Step 4: Save and test
The test:

Does it tell Claude WHAT to think about? (thinking patterns)
Does it tell Claude HOW to do things it wouldn't know? (domain procedures)
A good Skill provides both when needed.

D3: Anti-Pattern Quality (15 points)
Does the Skill have effective NEVER lists?

Why this matters: Half of expert knowledge is knowing what NOT to do. A senior designer sees purple gradient on white background and instinctively cringes — "too AI-generated." This intuition for "what absolutely not to do" comes from stepping on countless landmines.

Claude hasn't stepped on these landmines. It doesn't know Inter font is overused, doesn't know purple gradients are the signature of AI-generated content. Good Skills must explicitly state these "absolute don'ts."

Score	Criteria
0-3	No anti-patterns mentioned
4-7	Generic warnings ("avoid errors", "be careful", "consider edge cases")
8-11	Specific NEVER list with some reasoning
12-15	Expert-grade anti-patterns with WHY — things only experience teaches
Expert anti-patterns (specific + reason):

NEVER use generic AI-generated aesthetics like:
- Overused font families (Inter, Roboto, Arial)
- Cliched color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Default border-radius on everything
Weak anti-patterns (vague, no reasoning):

Avoid making mistakes.
Be careful with edge cases.
Don't write bad code.
The test: Would an expert read the anti-pattern list and say "yes, I learned this the hard way"? Or would they say "this is obvious to everyone"?

D4: Specification Compliance — Especially Description (15 points)
Does the Skill follow official format requirements? Special focus on description quality.

Score	Criteria
0-5	Missing frontmatter or invalid format
6-10	Has frontmatter but description is vague or incomplete
11-13	Valid frontmatter, description has WHAT but weak on WHEN
14-15	Perfect: comprehensive description with WHAT, WHEN, and trigger keywords
Frontmatter requirements:

name: lowercase, alphanumeric + hyphens only, ≤64 characters
description: THE MOST CRITICAL FIELD — determines if skill gets used at all
Why description is THE MOST IMPORTANT field:

┌─────────────────────────────────────────────────────────────────────┐
│  SKILL ACTIVATION FLOW                                              │
│                                                                     │
│  User Request → Agent sees ALL skill descriptions → Decides which  │
│                 (only descriptions, not bodies!)     to activate    │
│                                                                     │
│  If description doesn't match → Skill NEVER gets loaded            │
│  If description is vague → Skill might not trigger when it should  │
│  If description lacks keywords → Skill is invisible to the Agent   │
└─────────────────────────────────────────────────────────────────────┘
The brutal truth: A Skill with perfect content but poor description is useless — it will never be activated. The description is the only chance to tell the Agent "use me in these situations."

Description must answer THREE questions:

WHAT: What does this Skill do? (functionality)
WHEN: In what situations should it be used? (trigger scenarios)
KEYWORDS: What terms should trigger this Skill? (searchable terms)
Excellent description (all three elements):

description: "Comprehensive document creation, editing, and analysis with support
for tracked changes, comments, formatting preservation, and text extraction.
When Claude needs to work with professional documents (.docx files) for:
(1) Creating new documents, (2) Modifying or editing content,
(3) Working with tracked changes, (4) Adding comments, or any other document tasks"
Analysis:

WHAT: creation, editing, analysis, tracked changes, comments
WHEN: "When Claude needs to work with... for: (1)... (2)... (3)..."
KEYWORDS: .docx files, tracked changes, professional documents
Poor description (missing elements):

description: "处理文档相关功能"
Problems:

WHAT: vague ("文档相关功能" — what specifically?)
WHEN: missing (when should Agent use this?)
KEYWORDS: missing (no ".docx", no specific scenarios)
Another poor example:

description: "A helpful skill for various tasks"
This is useless — Agent has no idea when to activate it.

Description quality checklist:

 Lists specific capabilities (not just "helps with X")
 Includes explicit trigger scenarios ("Use when...", "When user asks for...")
 Contains searchable keywords (file extensions, domain terms, action verbs)
 Specific enough that Agent knows EXACTLY when to use it
 Includes scenarios where this skill MUST be used (not just "can be used")
D5: Progressive Disclosure (15 points)
Does the Skill implement proper content layering?

Skill loading has three layers:

Layer 1: Metadata (always in memory)
         Only name + description
         ~100 tokens per skill

Layer 2: SKILL.md Body (loaded after triggering)
         Detailed guidelines, code examples, decision trees
         Ideal: < 500 lines

Layer 3: Resources (loaded on demand)
         scripts/, references/, assets/
         No limit
Score	Criteria
0-5	Everything dumped in SKILL.md (>500 lines, no structure)
6-10	Has references but unclear when to load them
11-13	Good layering with MANDATORY triggers present
14-15	Perfect: decision trees + explicit triggers + "Do NOT Load" guidance
For Skills WITH references directory, check Loading Trigger Quality:

Trigger Quality	Characteristics
Poor	References listed at end, no loading guidance
Mediocre	Some triggers but not embedded in workflow
Good	MANDATORY triggers in workflow steps
Excellent	Scenario detection + conditional triggers + "Do NOT Load"
The loading problem:

Loading too little ◄─────────────────────────────────► Loading too much
- References sit unused                    - Wastes context space
- Agent doesn't know when to load          - Irrelevant info dilutes key content
- Knowledge is there but never accessed    - Unnecessary token overhead
Good loading trigger (embedded in workflow):

### Creating New Document

**MANDATORY - READ ENTIRE FILE**: Before proceeding, you MUST read
[`docx-js.md`](docx-js.md) (~500 lines) completely from start to finish.
**NEVER set any range limits when reading this file.**

**Do NOT load** `ooxml.md` or `redlining.md` for this task.
Bad loading trigger (just listed):

## References
- docx-js.md - for creating documents
- ooxml.md - for editing
- redlining.md - for tracking changes
For simple Skills (no references, <100 lines): Score based on conciseness and self-containment.

D6: Freedom Calibration (15 points)
Is the level of specificity appropriate for the task's fragility?

Different tasks need different levels of constraint. This is about matching freedom to fragility.

Score	Criteria
0-5	Severely mismatched (rigid scripts for creative tasks, vague for fragile ops)
6-10	Partially appropriate, some mismatches
11-13	Good calibration for most scenarios
14-15	Perfect freedom calibration throughout
The freedom spectrum:

Task Type	Should Have	Why	Example Skill
Creative/Design	High freedom	Multiple valid approaches, differentiation is value	frontend-design
Code review	Medium freedom	Principles exist but judgment required	code-review
File format operations	Low freedom	One wrong byte corrupts file, consistency critical	docx, xlsx, pdf
High freedom (text-based instructions):

Commit to a BOLD aesthetic direction. Pick an extreme: brutally minimal,
maximalist chaos, retro-futuristic, organic natural...
Medium freedom (pseudocode or parameterized):

Review priority:
1. Security vulnerabilities (must fix)
2. Logic errors (must fix)
3. Performance issues (should fix)
4. Maintainability (optional)
Low freedom (specific scripts, exact steps):

**MANDATORY**: Use exact script in `scripts/create-doc.py`
Parameters: --title "X" --author "Y"
Do NOT modify the script.
The test: Ask "if Agent makes a mistake, what's the consequence?"

High consequence → Low freedom
Low consequence → High freedom
D7: Pattern Recognition (10 points)
Does the Skill follow an established official pattern?

Through analyzing 17 official Skills, we identified 5 main design patterns:

Pattern	~Lines	Key Characteristics	Example	When to Use
Mindset	~50	Thinking > technique, strong NEVER list, high freedom	frontend-design	Creative tasks requiring taste
Navigation	~30	Minimal SKILL.md, routes to sub-files	internal-comms	Multiple distinct scenarios
Philosophy	~150	Two-step: Philosophy → Express, emphasizes craft	canvas-design	Art/creation requiring originality
Process	~200	Phased workflow, checkpoints, medium freedom	mcp-builder	Complex multi-step projects
Tool	~300	Decision trees, code examples, low freedom	docx, pdf, xlsx	Precise operations on specific formats
Score	Criteria
0-3	No recognizable pattern, chaotic structure
4-6	Partially follows a pattern with significant deviations
7-8	Clear pattern with minor deviations
9-10	Masterful application of appropriate pattern
Pattern selection guide:

Your Task Characteristics	Recommended Pattern
Needs taste and creativity	Mindset (~50 lines)
Needs originality and craft quality	Philosophy (~150 lines)
Has multiple distinct sub-scenarios	Navigation (~30 lines)
Complex multi-step project	Process (~200 lines)
Precise operations on specific format	Tool (~300 lines)
D8: Practical Usability (15 points)
Can an Agent actually use this Skill effectively?

Score	Criteria
0-5	Confusing, incomplete, contradictory, or untested guidance
6-10	Usable but with noticeable gaps
11-13	Clear guidance for common cases
14-15	Comprehensive coverage including edge cases and error handling
Check for:

Decision trees: For multi-path scenarios, is there clear guidance on which path to take?
Code examples: Do they actually work? Or are they pseudocode that breaks?
Error handling: What if the main approach fails? Are fallbacks provided?
Edge cases: Are unusual but realistic scenarios covered?
Actionability: Can Agent immediately act, or needs to figure things out?
Good usability (decision tree + fallback):

| Task | Primary Tool | Fallback | When to Use Fallback |
|------|-------------|----------|----------------------|
| Read text | pdftotext | PyMuPDF | Need layout info |
| Extract tables | camelot-py | tabula-py | camelot fails |

**Common issues**:
- Scanned PDF: pdftotext returns blank → Use OCR first
- Encrypted PDF: Permission error → Use PyMuPDF with password
Poor usability (vague):

Use appropriate tools for PDF processing.
Handle errors properly.
Consider edge cases.
NEVER Do When Evaluating
NEVER give high scores just because it "looks professional" or is well-formatted
NEVER ignore token waste — every redundant paragraph should result in deduction
NEVER let length impress you — a 43-line Skill can outperform a 500-line Skill
NEVER skip mentally testing the decision trees — do they actually lead to correct choices?
NEVER forgive explaining basics with "but it provides helpful context"
NEVER overlook missing anti-patterns — if there's no NEVER list, that's a significant gap
NEVER assume all procedures are valuable — distinguish domain-specific from generic
NEVER undervalue the description field — poor description = skill never gets used
NEVER put "when to use" info only in the body — Agent only sees description before loading
Evaluation Protocol
Step 1: First Pass — Knowledge Delta Scan
Read SKILL.md completely and for each section ask:

"Does Claude already know this?"

Mark each section as:

[E] Expert: Claude genuinely doesn't know this — value-add
[A] Activation: Claude knows but brief reminder is useful — acceptable
[R] Redundant: Claude definitely knows this — should be deleted
Calculate rough ratio: E:A:R

Good Skill: >70% Expert, <20% Activation, <10% Redundant
Mediocre Skill: 40-70% Expert, high Activation
Bad Skill: <40% Expert, high Redundant
Step 2: Structure Analysis
[ ] Check frontmatter validity
[ ] Count total lines in SKILL.md
[ ] List all reference files and their sizes
[ ] Identify which pattern the Skill follows
[ ] Check for loading triggers (if references exist)
Step 3: Score Each Dimension
For each of the 8 dimensions:

Find specific evidence (quote relevant lines)
Assign score with one-line justification
Note specific improvements if score < max
Step 4: Calculate Total & Grade
Total = D1 + D2 + D3 + D4 + D5 + D6 + D7 + D8
Max = 120 points
Grade Scale (percentage-based):

Grade	Percentage	Meaning
A	90%+ (108+)	Excellent — production-ready expert Skill
B	80-89% (96-107)	Good — minor improvements needed
C	70-79% (84-95)	Adequate — clear improvement path
D	60-69% (72-83)	Below Average — significant issues
F	<60% (<72)	Poor — needs fundamental redesign
Step 5: Generate Report
# Skill Evaluation Report: [Skill Name]

## Summary
- **Total Score**: X/120 (X%)
- **Grade**: [A/B/C/D/F]
- **Pattern**: [Mindset/Navigation/Philosophy/Process/Tool]
- **Knowledge Ratio**: E:A:R = X:Y:Z
- **Verdict**: [One sentence assessment]

## Dimension Scores

| Dimension | Score | Max | Notes |
|-----------|-------|-----|-------|
| D1: Knowledge Delta | X | 20 | |
| D2: Mindset vs Mechanics | X | 15 | |
| D3: Anti-Pattern Quality | X | 15 | |
| D4: Specification Compliance | X | 15 | |
| D5: Progressive Disclosure | X | 15 | |
| D6: Freedom Calibration | X | 15 | |
| D7: Pattern Recognition | X | 10 | |
| D8: Practical Usability | X | 15 | |

## Critical Issues
[List must-fix problems that significantly impact the Skill's effectiveness]

## Top 3 Improvements
1. [Highest impact improvement with specific guidance]
2. [Second priority improvement]
3. [Third priority improvement]

## Detailed Analysis
[For each dimension scoring below 80%, provide:
- What's missing or problematic
- Specific examples from the Skill
- Concrete suggestions for improvement]
Common Failure Patterns
Pattern 1: The Tutorial
Symptom: Explains what PDF is, how Python works, basic library usage
Root cause: Author assumes Skill should "teach" the model
Fix: Claude already knows this. Delete all basic explanations.
     Focus on expert decisions, trade-offs, and anti-patterns.
Pattern 2: The Dump
Symptom: SKILL.md is 800+ lines with everything included
Root cause: No progressive disclosure design
Fix: Core routing and decision trees in SKILL.md (<300 lines ideal)
     Detailed content in references/, loaded on-demand
Pattern 3: The Orphan References
Symptom: References directory exists but files are never loaded
Root cause: No explicit loading triggers
Fix: Add "MANDATORY - READ ENTIRE FILE" at workflow decision points
     Add "Do NOT Load" to prevent over-loading
Pattern 4: The Checkbox Procedure
Symptom: Step 1, Step 2, Step 3... mechanical procedures
Root cause: Author thinks in procedures, not thinking frameworks
Fix: Transform into "Before doing X, ask yourself..."
     Focus on decision principles, not operation sequences
Pattern 5: The Vague Warning
Symptom: "Be careful", "avoid errors", "consider edge cases"
Root cause: Author knows things can go wrong but hasn't articulated specifics
Fix: Specific NEVER list with concrete examples and non-obvious reasons
     "NEVER use X because [specific problem that takes experience to learn]"
Pattern 6: The Invisible Skill
Symptom: Great content but skill rarely gets activated
Root cause: Description is vague, missing keywords, or lacks trigger scenarios
Fix: Description must answer WHAT, WHEN, and include KEYWORDS
     "Use when..." + specific scenarios + searchable terms

Example fix:
BAD:  "Helps with document tasks"
GOOD: "Create, edit, and analyze .docx files. Use when working with
       Word documents, tracked changes, or professional document formatting."
Pattern 7: The Wrong Location
Symptom: "When to use this Skill" section in body, not in description
Root cause: Misunderstanding of three-layer loading
Fix: Move all triggering information to description field
     Body is only loaded AFTER triggering decision is made
Pattern 8: The Over-Engineered
Symptom: README.md, CHANGELOG.md, INSTALLATION_GUIDE.md, CONTRIBUTING.md
Root cause: Treating Skill like a software project
Fix: Delete all auxiliary files. Only include what Agent needs for the task.
     No documentation about the Skill itself.
Pattern 9: The Freedom Mismatch
Symptom: Rigid scripts for creative tasks, vague guidance for fragile operations
Root cause: Not considering task fragility
Fix: High freedom for creative (principles, not steps)
     Low freedom for fragile (exact scripts, no parameters)
Quick Reference Checklist
┌─────────────────────────────────────────────────────────────────────────┐
│  SKILL EVALUATION QUICK CHECK                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  KNOWLEDGE DELTA (most important):                                      │
│    [ ] No "What is X" explanations for basic concepts                   │
│    [ ] No step-by-step tutorials for standard operations                │
│    [ ] Has decision trees for non-obvious choices                       │
│    [ ] Has trade-offs only experts would know                           │
│    [ ] Has edge cases from real-world experience                        │
│                                                                         │
│  MINDSET + PROCEDURES:                                                  │
│    [ ] Transfers thinking patterns (how to think about problems)        │
│    [ ] Has "Before doing X, ask yourself..." frameworks                 │
│    [ ] Includes domain-specific procedures Claude wouldn't know         │
│    [ ] Distinguishes valuable procedures from generic ones              │
│                                                                         │
│  ANTI-PATTERNS:                                                         │
│    [ ] Has explicit NEVER list                                          │
│    [ ] Anti-patterns are specific, not vague                            │
│    [ ] Includes WHY (non-obvious reasons)                               │
│                                                                         │
│  SPECIFICATION (description is critical!):                              │
│    [ ] Valid YAML frontmatter                                           │
│    [ ] name: lowercase, ≤64 chars                                       │
│    [ ] description answers: WHAT does it do?                            │
│    [ ] description answers: WHEN should it be used?                     │
│    [ ] description contains trigger KEYWORDS                            │
│    [ ] description is specific enough for Agent to know when to use     │
│                                                                         │
│  STRUCTURE:                                                             │
│    [ ] SKILL.md < 500 lines (ideal < 300)                               │
│    [ ] Heavy content in references/                                     │
│    [ ] Loading triggers embedded in workflow                            │
│    [ ] Has "Do NOT Load" for preventing over-loading                    │
│                                                                         │
│  FREEDOM:                                                               │
│    [ ] Creative tasks → High freedom (principles)                       │
│    [ ] Fragile operations → Low freedom (exact scripts)                 │
│                                                                         │
│  USABILITY:                                                             │
│    [ ] Decision trees for multi-path scenarios                          │
│    [ ] Working code examples                                            │
│    [ ] Error handling and fallbacks                                     │
│    [ ] Edge cases covered                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
The Meta-Question
When evaluating any Skill, always return to this fundamental question:

"Would an expert in this domain, looking at this Skill, say: 'Yes, this captures knowledge that took me years to learn'?"

If the answer is yes → the Skill has genuine value. If the answer is no → it's compressing what Claude already knows.

The best Skills are compressed expert brains — they take a designer's 10 years of aesthetic accumulation and compress it into 43 lines, or a document expert's operational experience into a 200-line decision tree.

What gets compressed must be things Claude doesn't have. Otherwise, it's garbage compression.

Self-Evaluation Note
This Skill (skill-judge) should itself pass evaluation:

Knowledge Delta: Provides specific evaluation criteria Claude wouldn't generate on its own
Mindset: Shapes how to think about Skill quality, not just checklist items
Anti-Patterns: "NEVER Do When Evaluating" section with specific don'ts
Specification: Valid frontmatter with comprehensive description
Progressive Disclosure: Self-contained, no external references needed
Freedom: Medium freedom appropriate for evaluation task
Pattern: Follows Tool pattern with decision frameworks
Usability: Clear protocol, report template, quick reference
Evaluate this Skill against itself as a calibration exercise.