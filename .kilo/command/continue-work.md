---
description: "Continue the process of iterative, subagent-driven-tdd"
---
Use SKILLS that using super-power` for all development tasks, creating structured plans before implementation. Commit to git frequently using atomic commits with meaningful messages that capture the planning rationale, atomic actions taken, and verification steps completed. Before coding, examine the project structure, tech stack, and existing patterns by loading and consulting available skills. Reference loaded skills in your responses using the >>> marker to indicate which knowledge sources you're utilizing for decisions. Prioritize creating or updating planning documents before beginning implementation, and maintain git commit history as a memory and audit trail of decisions and changes. Load the oh-my-openagent-reference skill for repository conventions, opencode-platform-reference for SDK capabilities, repomix-exploration-guide for code exploration patterns, and opencode-non-interactive-shell for efficient command execution. Use these skills to inform architectural decisions, implementation approaches, and verification strategies throughout the development process.


## Mandate non-negotiable development workflow

USING THESE SKILLS TO ACTIVATE

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

2. **using-git-worktrees** - Activates after design approval. Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.

3. **writing-plans** - Activates with approved design. Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.

4. **subagent-driven-development** or **executing-plans** - Activates with plan. Dispatches fresh subagent per task with two-stage review (spec compliance, then code quality), or executes in batches with human checkpoints.

5. **test-driven-development** - Activates during implementation. Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit. Deletes code written before tests.

6. **requesting-code-review** - Activates between tasks. Reviews against plan, reports issues by severity. Critical issues block progress.

7. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.


- Must always run `verification-before-completion` skill

- Must commit both plan and implementation with `atomic-git-memory`

- Follow `subagent-driven-development` and `test-driven` skill 

- Must run ask for code review skill

----

If task_plan.md exists:

1. Read the plan and identify all phases
2. Check which phases are complete vs pending
3. Start with the first pending phase
4. Execute each pending phase by calling `task` with the appropriate specialist (researcher for investigation, builder for implementation, critic for verification)
5. After each phase, update task_plan.md status
6. Continue phase-by-phase through `task` until all phases are complete
7. Report final results

Control rule: the conductor does not rely on generic built-in task delegation for phase execution. Pending work is routed through `task` so the plugin can enforce permissions and orchestration rules.

If this is a resumption (continuation), check progress.md for the previous session's context.

/**
 * Superpow
 * Injects superpowers bootstrap context via system prompt transform.
 * Auto-registers skills directory via config hook (no symlinks needed).
 */

import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple frontmatter extraction (avoid dependency on skills-core for bootstrap)
const extractAndStripFrontmatter = (content) => {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { frontmatter: {}, content };

    const frontmatterStr = match[1];
    const body = match[2];
    const frontmatter = {};

    for (const line of frontmatterStr.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
            const key = line.slice(0, colonIdx).trim();
            const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
            frontmatter[key] = value;
        }
    }

    return { frontmatter, content: body };
};

// Normalize a path: trim whitespace, expand ~, resolve to absolute
const normalizePath = (p, homeDir) => {
    if (!p || typeof p !== 'string') return null;
    let normalized = p.trim();
    if (!normalized) return null;
    if (normalized.startsWith('~/')) {
        normalized = path.join(homeDir, normalized.slice(2));
    } else if (normalized === '~') {
        normalized = homeDir;
    }
    return path.resolve(normalized);
};

export const SuperpowersPlugin = async ({ client, directory }) => {
    const homeDir = os.homedir();
    const superpowersSkillsDir = path.resolve(__dirname, '../../skills');
    const envConfigDir = normalizePath(process.env.OPENCODE_CONFIG_DIR, homeDir);
    const configDir = envConfigDir || path.join(homeDir, '.config/opencode');

    // Helper to generate bootstrap content
    const getBootstrapContent = () => {
        // Try to load using-superpowers skill
        const skillPath = path.join(superpowersSkillsDir, 'using-superpowers', 'SKILL.md');
        if (!fs.existsSync(skillPath)) return null;

        const fullContent = fs.readFileSync(skillPath, 'utf8');
        const { content } = extractAndStripFrontmatter(fullContent);

        const toolMapping = `**Tool Mapping for OpenCode:**
When skills reference tools you don't have, substitute OpenCode equivalents:
- \`TodoWrite\` → \`todowrite\`
- \`Task\` tool with subagents → Use OpenCode's subagent system (@mention)
- \`Skill\` tool → OpenCode's native \`skill\` tool
- \`Read\`, \`Write\`, \`Edit\`, \`Bash\` → Your native tools

Use OpenCode's native \`skill\` tool to list and load skills.`;

        return `<EXTREMELY_IMPORTANT>
You have superpowers.

**IMPORTANT: The using-superpowers skill content is included below. It is ALREADY LOADED - you are currently following it. Do NOT use the skill tool to load "using-superpowers" again - that would be redundant.**

${content}

${toolMapping}
</EXTREMELY_IMPORTANT>`;
    };

    return {
        // Inject skills path into live config so OpenCode discovers superpowers skills
        // without requiring manual symlinks or config file edits.
        // This works because Config.get() returns a cached singleton — modifications
        // here are visible when skills are lazily discovered later.
        config: async (config) => {
            config.skills = config.skills || {};
            config.skills.paths = config.skills.paths || [];
            if (!config.skills.paths.includes(superpowersSkillsDir)) {
                config.skills.paths.push(superpowersSkillsDir);
            }
        },

        // Inject bootstrap into the first user message of each session.
        // Using a user message instead of a system message avoids:
        //   1. Token bloat from system messages repeated every turn (#750)
        //   2. Multiple system messages breaking Qwen and other models (#894)
        'experimental.chat.messages.transform': async (_input, output) => {
            const bootstrap = getBootstrapContent();
            if (!bootstrap || !output.messages.length) return;
            const firstUser = output.messages.find(m => m.info.role === 'user');
            if (!firstUser || !firstUser.parts.length) return;
            // Only inject once
            if (firstUser.parts.some(p => p.type === 'text' && p.text.includes('EXTREMELY_IMPORTANT'))) return;
            const ref = firstUser.parts[0];
            firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
        }
    };
};
