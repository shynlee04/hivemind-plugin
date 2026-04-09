# These are executed as exact order steps → failing one = failure → inventory to must refactor later because they are debt

### [SKILL.md](http://SKILL.md) first before anything else

1. Down the stream the naming of the skills → if they share similar meaning - doubt? → check description if still pass ? next
2. The anatomy and the description → follow rules if not - fail

```markdown
# THE MANDATE OF A SKILL
Skills teach expertise that even SOTA LLMs do not know without explicit instruction. Skills auto-select skill pairs at runtime based on descriptions and main headings. The skills system has these two lineages, two hierarchies, and two task/expert-orientations:

## Make SKILL when made correctly they must belong to either:

- Domain expertise: Package specialized knowledge into reusable instructions, from legal review processes to data analysis pipelines.
- New capabilities: Give agents new capabilities (e.g. creating presentations, building MCP servers, analyzing datasets).
- Repeatable workflows: Turn multi-step tasks into consistent and auditable workflows.
- Interoperability: Reuse the same skill across different skills-compatible agent products.

Thes above are exactly our skills archiecture **IF the skill NOT MAKE into** any of the above -> they fail
## Anatomy of a Skill
skill-name/
├── -> >>>>>> **SKILL.md (required) <<<<**
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
    
## Progressive Disclosure
Skills use a three-level loading system:

Metadata (name + description) - Always in context (~100 words)
SKILL.md body - In context whenever skill triggers (<500 lines ideal)
Bundled resources - As needed (unlimited, scripts can execute without loading)
These word counts are approximate and you can feel free to go longer if needed.

### Key patterns:

Keep SKILL.md under 500 lines; if you're approaching this limit, add an additional layer of hierarchy along with clear pointers about where the model using the skill should go next to follow up.
Reference files clearly from SKILL.md with guidance on when to read them
For large reference files (>300 lines), include a table of contents

####Domain organization:  
When a skill supports multiple domains/frameworks, organize by variant:

cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```

## 3 . description : this tiny section takes a page just to teach the how-to https://agentskills.io/skill-creation/optimizing-descriptions

Showing how important description is:

 must land the 90% pick rate at the runtime granularity of workflow when agent needs it and it must concisely give a real-world sense of what it is, and what it teaches, when to use it best and in few word how it is the one serve the purpose and (if any) the conditions for using it. The following will be the skill’s description immediate failures:

- Absurd using Hivemind-framework specific vocabularies and terms (naming of the agents, concepts etc - it is ok for the OpenCode concepts)
- Skill may teach special knowledge - but the description does not make it into any of the runtime skill-picking decision because - but the description make it overshadow by the similar one, or if it is a different one but the description make it sounds like the same set
- The very deceptive description → skill gives wrong decision, not at the wrong time, serve the wrong work; disturbing workflow

```markdown
#### The following is not a direct inventory for problematic but they are the 50% point deduction:

- The generic ai-written description, reaptead language, same pattern

```

# Then what next requires knowing these very well in order to set the conditional for inventory or handle at spot

<aside>
💡

## If skills are not making into any of these architecture - they will fail to be used, and not being used properly

#### **There are 2 Linages:**

- Meta builder module skills
- Project-specific skills

```markdown
Going from **Lingages** , the tasks and expert groups can belong to both 
with careful assessment. However the hierarchies and management teams are not allowed to mix between (for example skill `skill-authoring` 
or `agent-subagent-dev` must never be picked by builder, or hiveminder agent
```

**2 Hierarchies:**

- Higher coordinator and orchestrator for task management of agentic workflows →
    - these are the group must be picked by the front-facing and never be picked when subagent be delegated → assess this for failure conditions
- Sub-session level for granular task execution
    - in contrary this must be picked by the delegated agent - because if picked by front agents → the agent will act not plan nor interview users

```markdown
TIP: that's why agents, commands, skills and workflows are the system and they are ecosystem
```

**2 Task/Expert-Orientation Groups:**

**Group 1 —** 

How-to-Process: Workflows, tasks, pipelines, guardrails, validation, loops, cycles, and iterative processes for task management and workflow coherence. These ensure execution orders, steps, and procedures are followed. Require robust strategic movements between domains, hierarchy transitions, and domain switching. Must be robust, flowing coherently, NOT intricate or complex, NOT mechanical.

!IMPORTANT → since this task and group 1 is mostly for managements of teams through guardrails, validation - highly likely they are the `coordination, orchestration, verification, gatekeeping, iterative, loop, review, cycles` >>> these always must teach the agents know how to validate and against which conditions, as for the nature of how wide this is the eldege cases must be address showing how to very specifically, utilizing the documents, commands, other concepts when the skill is using together with 

IMMPORTANT 2 → and this group 1 can be tightly related to the hierarchy skills above so beware if they do not match to each other, either 2 fail or both fail

**Group 2 —** 

How-to-Implement: Tactical and expert tasks requiring specific tech patterns. Stacked with valid knowledge, advanced patterns, and methods applied in depth.

- For knowing if the skill can make it group 2 qualified  or not and by just look at the [SKILL.md](http://SKILL.md) → the skill that has very generic language, the skill that does not lead to the depth, and the skill tend to throw the  document link in instead of showing step
</aside>

### 4. [SKILL.md](http://SKILL.md) - by reading the body, these skill are

going by headings, the first heading and the 2nd can really tell if the skills worthy

- skills that required background knowledge, (which are also special) and skills of hierarchy → but does not give insight as background
- skills that teach specialist knowledge or how to implement something, how to manage meta builder team  → but does not have overview what the fuck it is
- the starter and the domain router but start right with routing, not giving any insight or onboarding
- the generic routing that not teaching but confusing
- the generic skills of advanced technique but give fragmented instruction —> these must be steps, if then, showing samples, combining and stacking, giving tips
- the quality that are inferior, giving cycle and loop steps or complex iteration as 1 bullet point without references at the place to expanded of workflow or $ARGUMENT, scrip !bash script to load the prompt or template or references at time it is used

#### The body [SKILL.md](http://SKILL.md) absolute isolate for refactoring vs. those that consider for removal and migrated

- Overlapping and hierarchy mess → see within its own than the other skills, are they teaching the same things, or are they  making distinct routers
- skills of hierarchy and management tasks and agents team, or harness workflow → but find itself to not knowing any order.
- the skill that are either rarely picked or picked to often making it the confusion
- the skills which are not arranging themself into the 2-2-2 I said above

<aside>
💡

Ban these for the first sniff of skill assessment: no grep, glob, no quick search , these are truly the misconception why  the keywords matched but the skill does not fucking work

</aside>

# Finaly is the quality of how a specialist of skills are written:

For  SKILLS Of How-to-implement (an expertise such as tech…) the following must be true

```markdown
### Extract from a hands-on task
Complete a real task in conversation with an agent, providing context, corrections, and preferences along the way. Then extract the reusable pattern into a skill. Pay attention to:
Steps that worked — the sequence of actions that led to success
Corrections you made — places where you steered the agent’s approach (e.g., “use library X instead of Y,” “check for edge case Z”)
Input/output formats — what the data looked like going in and coming out
Context you provided — project-specific facts, conventions, or constraints the agent didn’t already know

### Synthesize from existing project artifacts
When you have a body of existing knowledge, you can feed it into an LLM and ask it to synthesize a skill. A data-pipeline skill synthesized from your team’s actual incident reports and runbooks will outperform one synthesized from a generic “data engineering best practices” article, because it captures your schemas, failure modes, and recovery procedures. The key is project-specific material, not generic references.
Good source material includes:
Internal documentation, runbooks, and style guides
API specifications, schemas, and configuration files
Code review comments and issue trackers (captures recurring concerns and reviewer expectations)
Version control history, especially patches and fixes (reveals patterns through what actually changed)
Real-world failure cases and their resolutions

```

# Self-reflection - by asking these questions, put yourself in such these following situations - would you understand this much more

1. see how an isolate innate OpenCode agents like `general` use the skill → whether it fails  to achieve the end result
2. As 1 but you must put it under any project not just this one
3. skills which are not well handle the vriants are also highly failure