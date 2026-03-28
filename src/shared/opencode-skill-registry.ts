import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

import YAML from 'yaml'

export interface SkillFrontmatter {
  name: string
  description: string
  [key: string]: unknown
}

export interface OpencodeSkillRegistryEntry {
  id: string
  sourcePath: string
  frontmatter: SkillFrontmatter
  body: string
  runtimeMarkdown: string
  referenceFiles: Map<string, string>
  templateFiles: Map<string, string>
  testFiles: Map<string, string>
}

interface DiscoveredSkill {
  skillDir: string
  skillId: string
}

function splitFrontmatter(markdown: string): {
  frontmatter: SkillFrontmatter
  body: string
} {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) {
    throw new Error('Skill markdown must start with YAML frontmatter')
  }

  const [, yamlSource, body = ''] = match
  const parsed = YAML.parse(yamlSource) as SkillFrontmatter | null
  
  if (!parsed?.name || !parsed?.description) {
    throw new Error('Skill frontmatter must include name and description')
  }

  return {
    frontmatter: parsed,
    body,
  }
}

function projectRuntimeFrontmatter(
  frontmatter: SkillFrontmatter,
): { name: string; description: string } {
  return {
    name: frontmatter.name,
    description: frontmatter.description,
  }
}

function renderRuntimeMarkdown(
  frontmatter: Pick<SkillFrontmatter, 'name' | 'description'>,
  body: string,
): string {
  const renderedFrontmatter = YAML.stringify(frontmatter).trimEnd()
  const trimmedBody = body.replace(/^\n+/, '')
  return `---\n${renderedFrontmatter}\n---\n\n${trimmedBody}`
}

function readMarkdownFiles(baseDir: string, subDir: string): Map<string, string> {
  const files = new Map<string, string>()
  const fullPath = join(baseDir, subDir)

  try {
    const entries = readdirSync(fullPath, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const content = readFileSync(join(fullPath, entry.name), 'utf-8')
        files.set(`${subDir}/${entry.name}`, content)
      }
    }
  } catch {
    // Directory doesn't exist, return empty map
  }

  return files
}

function discoverSkills(scanRoots: string[], excludedSkillIds: string[] = []): DiscoveredSkill[] {
  const discovered: DiscoveredSkill[] = []
  const excludedSet = new Set(excludedSkillIds)
  const seen = new Set<string>()

  for (const root of scanRoots) {
    if (!existsSync(root)) continue

    try {
      const entries = readdirSync(root, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        if (entry.name.startsWith('_')) continue
        if (excludedSet.has(entry.name)) continue
        if (seen.has(entry.name)) continue

        const skillDir = join(root, entry.name)
        const skillMd = join(skillDir, 'SKILL.md')
        if (!existsSync(skillMd)) continue

        seen.add(entry.name)
        discovered.push({ skillDir, skillId: entry.name })
      }
    } catch {
      // directory read failed, skip this root
    }
  }

  return discovered
}

function buildRegistryEntry(skill: DiscoveredSkill): OpencodeSkillRegistryEntry {
  const sourcePath = join(skill.skillDir, 'SKILL.md')
  const source = readFileSync(sourcePath, 'utf-8')
  const { frontmatter, body } = splitFrontmatter(source)
  const runtimeFrontmatter = projectRuntimeFrontmatter(frontmatter)

  return {
    id: skill.skillId,
    sourcePath,
    frontmatter,
    body,
    runtimeMarkdown: renderRuntimeMarkdown(runtimeFrontmatter, body),
    referenceFiles: readMarkdownFiles(skill.skillDir, 'references'),
    templateFiles: readMarkdownFiles(skill.skillDir, 'templates'),
    testFiles: readMarkdownFiles(skill.skillDir, 'tests'),
  }
}

export function createOpencodeSkillRegistry(
  packageRoot: string,
  excludedSkillIds: string[] = [],
): OpencodeSkillRegistryEntry[] {
  const scanRoots = [
    join(packageRoot, '.opencode', 'skills'),
    join(homedir(), '.config', 'opencode', 'skills'),
  ]
  const skills = discoverSkills(scanRoots, excludedSkillIds)
  return skills.map((skill) => buildRegistryEntry(skill))
}