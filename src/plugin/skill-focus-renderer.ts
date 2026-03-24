/**
 * Skill Focus Renderer — Renders the available_skills injection block.
 *
 * Produces a synthetic message part that informs the LLM:
 * - Which skills are available for the current turn
 * - The current session role (orchestrate / specialist / standalone)
 *
 * Written as natural user-side prompting with no role labels.
 */

import type { SkillEntry } from './skill-exposure-map.js'
import { renderSessionRoleDirective, type SessionRole } from './skill-exposure-map.js'

/**
 * Render a skill entry as a key=value line matching the established
 * HiveMind context format.
 */
function renderSkillLine(entry: SkillEntry, index: number): string {
  return `skill_${index + 1}=${JSON.stringify(entry.name)}`
}

/**
 * Render the skill focus block as a string for synthetic part injection.
 *
 * Uses the established key=value format inside XML tags, consistent with
 * the existing <hivemind context_version="v1"> block.
 *
 * @param skills        - Ordered skill entries to expose
 * @param sessionRole   - The resolved session role directive
 * @returns Rendered skill focus block string
 */
export function renderSkillFocusBlock(
  skills: SkillEntry[],
  sessionRole?: SessionRole,
): string {
  const lines: string[] = ['<available_skills>']

  for (let i = 0; i < skills.length; i += 1) {
    lines.push(renderSkillLine(skills[i], i))
  }

  // Add natural-language reminder line
  lines.push('REMINDER: The skills above are available for this turn. Use the skill tool to load any of them when your task matches their purpose.')

  // Add session role directive if provided
  if (sessionRole) {
    lines.push('')
    lines.push(renderSessionRoleDirective(sessionRole))
  }

  lines.push('</available_skills>')
  return lines.join('\n')
}
