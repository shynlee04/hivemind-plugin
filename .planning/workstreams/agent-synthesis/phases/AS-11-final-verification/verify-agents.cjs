#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../../..");
const agentsDir = path.join(root, ".hivefiver-meta-builder/agents-lab/active/refactoring");
const skillsDir = path.join(root, ".hivefiver-meta-builder/skills-lab/active/refactoring");

/**
 * Parses the simple YAML subset used by OpenCode agent frontmatter.
 * Supports scalar top-level keys, top-level arrays, and nested permission maps.
 *
 * @param {string} content Agent markdown content.
 * @returns {{ yaml: Record<string, unknown>, frontmatter: string, body: string } | null} Parsed parts or null when frontmatter is absent.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = match[1];
  const body = match[2] || "";
  const yaml = {};
  const lines = frontmatter.split("\n");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const scalar = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!scalar) continue;

    const key = scalar[1];
    let value = scalar[2].trim();

    if (value === "") {
      const children = [];
      const map = {};
      let hasList = false;
      let hasMap = false;
      let childIndex = index + 1;
      while (childIndex < lines.length && /^\s+/.test(lines[childIndex])) {
        const child = lines[childIndex];
        const listItem = child.match(/^\s+-\s+(.+)$/);
        const mapItem = child.match(/^\s+([^:#][^:]*):\s*(.*)$/);
        if (listItem) {
          hasList = true;
          children.push(stripQuotes(listItem[1].trim()));
        } else if (mapItem) {
          hasMap = true;
          map[mapItem[1].trim()] = stripQuotes(mapItem[2].trim());
        }
        childIndex += 1;
      }
      yaml[key] = hasList && !hasMap ? children : map;
      continue;
    }

    yaml[key] = stripQuotes(value);
  }

  return { yaml, frontmatter, body };
}

/**
 * Removes surrounding single or double quotes from a scalar value.
 *
 * @param {string} value Raw scalar.
 * @returns {string} Unquoted scalar.
 */
function stripQuotes(value) {
  return value.replace(/^['\"]|['\"]$/g, "");
}

/**
 * Lists available primitive names from a directory.
 *
 * @param {string} directory Directory containing primitive files or skill folders.
 * @param {"agents" | "skills"} type Primitive type.
 * @returns {Set<string>} Names available on disk.
 */
function listNames(directory, type) {
  const names = new Set();
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (type === "agents" && entry.isFile() && entry.name.endsWith(".md")) {
      const name = entry.name.replace(/\.md$/, "");
      if (name.startsWith("hm-l") || name.startsWith("hf-l")) names.add(name);
    }
    if (type === "skills" && entry.isDirectory()) {
      const skillPath = path.join(directory, entry.name, "SKILL.md");
      if (fs.existsSync(skillPath)) names.add(entry.name);
    }
  }
  return names;
}

/**
 * Returns frontmatter array entries for a key such as skills.
 *
 * @param {string} frontmatter YAML frontmatter text.
 * @param {string} key Key to extract.
 * @returns {string[]} Array entries.
 */
function extractArray(frontmatter, key) {
  const result = [];
  const lines = frontmatter.split("\n");
  let active = false;
  for (const line of lines) {
    if (new RegExp(`^${key}:\\s*$`).test(line)) {
      active = true;
      continue;
    }
    if (active && /^\S/.test(line)) break;
    if (active) {
      const item = line.match(/^\s+-\s+(.+)$/);
      if (item) result.push(stripQuotes(item[1].trim()));
    }
  }
  return result;
}

/**
 * Extracts permission patterns under `permission.task` or `permission.skill`.
 *
 * @param {string} frontmatter YAML frontmatter text.
 * @param {"task" | "skill"} permissionName Permission block name.
 * @returns {string[]} Pattern keys.
 */
function extractPermissionPatterns(frontmatter, permissionName) {
  const lines = frontmatter.split("\n");
  const patterns = [];
  let inPermission = false;
  let inBlock = false;

  for (const line of lines) {
    if (/^permission:\s*$/.test(line)) {
      inPermission = true;
      inBlock = false;
      continue;
    }
    if (inPermission && /^\S/.test(line)) break;
    if (!inPermission) continue;

    const blockStart = line.match(/^\s{2}([A-Za-z0-9_-]+):\s*$/);
    const siblingScalar = line.match(/^\s{2}([A-Za-z0-9_-]+):\s+(.+)$/);
    if (blockStart || siblingScalar) {
      const blockName = (blockStart || siblingScalar)[1];
      inBlock = blockName === permissionName;
      continue;
    }
    if (inBlock) {
      const pattern = line.match(/^\s{4}([^:]+):\s*(allow|ask|deny)\s*$/);
      if (pattern) patterns.push(stripQuotes(pattern[1].trim()));
    }
  }

  return patterns;
}

/**
 * Checks whether an exact name or glob-like pattern resolves against available names.
 *
 * @param {string} pattern Exact primitive name or wildcard pattern.
 * @param {Set<string>} names Available primitive names.
 * @returns {boolean} True when resolvable.
 */
function resolves(pattern, names) {
  if (["*", "**"].includes(pattern)) return true;
  if (!pattern.includes("*")) return names.has(pattern);
  const regex = new RegExp(`^${pattern.split("*").map(escapeRegex).join(".*")}$`);
  return [...names].some((name) => regex.test(name));
}

/**
 * Escapes a regex fragment.
 *
 * @param {string} text Text to escape.
 * @returns {string} Escaped regex text.
 */
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Detects deny-all bash constraints that block all shell access.
 *
 * @param {string} frontmatter YAML frontmatter text.
 * @returns {boolean} True when bash is denied globally.
 */
function hasBashDenyAll(frontmatter) {
  if (/^\s{2}bash:\s*deny\s*$/m.test(frontmatter)) return true;
  return /^\s{2}bash:\s*\n(?:\s{4}.*\n)*?\s{4}['\"]?\*['\"]?:\s*deny\s*$/m.test(frontmatter);
}

const agentNames = listNames(agentsDir, "agents");
const skillNames = listNames(skillsDir, "skills");
const agentFiles = [...agentNames].sort().map((name) => `${name}.md`);
const violations = [];
const stats = { total: 0, hm: 0, hf: 0 };

for (const file of agentFiles) {
  const name = file.replace(/\.md$/, "");
  const content = fs.readFileSync(path.join(agentsDir, file), "utf8");
  const parsed = parseFrontmatter(content);
  stats.total += 1;
  if (name.startsWith("hm-")) stats.hm += 1;
  if (name.startsWith("hf-")) stats.hf += 1;

  if (!parsed) {
    violations.push(`MISSING-YAML: ${name}`);
    continue;
  }

  const { yaml, frontmatter, body } = parsed;
  const nameParts = name.match(/^(hm|hf)-l([0-3])-/);
  const expectedLineage = nameParts?.[1];
  const expectedDepth = nameParts ? `L${nameParts[2]}` : null;

  if (yaml.name !== name) violations.push(`NAME-MISMATCH: ${name} — got ${yaml.name || "MISSING"}`);
  if (!yaml.mode) violations.push(`MODE-MISSING: ${name}`);
  if (yaml.lineage !== expectedLineage) violations.push(`LINEAGE-MISMATCH: ${name} — got ${yaml.lineage || "MISSING"}, expected ${expectedLineage}`);
  if (yaml.depth !== expectedDepth) violations.push(`DEPTH-MISMATCH: ${name} — got ${yaml.depth || "MISSING"}, expected ${expectedDepth}`);

  if (/^\s{2}edit:\s*deny\s*$/m.test(frontmatter)) violations.push(`EDIT-DENY: ${name}`);
  if (/^\s{2}write:\s*deny\s*$/m.test(frontmatter)) violations.push(`WRITE-DENY: ${name}`);
  if (hasBashDenyAll(frontmatter)) violations.push(`BASH-DENY-ALL: ${name}`);

  for (const skill of extractArray(frontmatter, "skills")) {
    if (!resolves(skill, skillNames)) violations.push(`SKILL-REF: ${name} — ${skill} does not resolve`);
  }
  for (const pattern of extractPermissionPatterns(frontmatter, "skill")) {
    if (!resolves(pattern, skillNames)) violations.push(`SKILL-PERM: ${name} — ${pattern} does not resolve`);
  }
  for (const pattern of extractPermissionPatterns(frontmatter, "task")) {
    if (!resolves(pattern, agentNames)) violations.push(`TASK-PERM: ${name} — ${pattern} does not resolve`);
  }

  if (!/<naming>[\s\S]*?<\/naming>/i.test(body)) violations.push(`NAMING-MISSING: ${name}`);
}

console.log("=== AS-11 Agent Verification ===");
console.log(`Agents checked: ${stats.total} (hm=${stats.hm}, hf=${stats.hf})`);
console.log(`Expected hm/hf agents: 56`);
console.log(`Violations: ${violations.length}`);
if (violations.length > 0) {
  for (const violation of violations) console.log(`  - ${violation}`);
}
console.log(violations.length === 0 && stats.total === 56 ? "RESULT: PASS" : "RESULT: FAIL");
process.exit(violations.length === 0 && stats.total === 56 ? 0 : 1);
