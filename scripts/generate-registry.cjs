#!/usr/bin/env node
/**
 * Generate full agent_configs and command_agent_mappings from .opencode/ primitives.
 * Outputs JSON to stdout for manual merge into configs.json.
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const AGENTS_DIR = path.join(PROJECT_ROOT, '.opencode', 'agents');
const COMMANDS_DIR = path.join(PROJECT_ROOT, '.opencode', 'commands');

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let multiline = false;
  for (const line of lines) {
    if (multiline) {
      if (/^\s/.test(line)) {
        fm[currentKey] = (fm[currentKey] ? fm[currentKey] + ' ' : '') + line.trim();
        continue;
      } else {
        multiline = false;
      }
    }
    // Match key: value or key: > or key: |
    const kvMatch = line.match(/^([a-zA-Z_]+):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === '>' || val === '|' || val === '>-' || val === '|-') {
        multiline = true;
        fm[currentKey] = '';
      } else {
        fm[currentKey] = val.replace(/^["']|["']$/g, '');
        multiline = false;
      }
    }
  }
  return fm;
}

// Collect agents (hm-* and hf-* only, no gsd-*)
const agentConfigs = {};
const agentFiles = fs.readdirSync(AGENTS_DIR).filter(f => 
  (f.startsWith('hm-') || f.startsWith('hf-')) && f.endsWith('.md')
);
for (const file of agentFiles) {
  const name = file.replace('.md', '');
  const content = fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8');
  const fm = extractFrontmatter(content);
  const desc = fm.description || '';
  agentConfigs[name] = {
    description: desc.slice(0, 200),
  };
}

// Collect commands (non-gsd-* only)
const commandMappings = {};
const commandFiles = fs.readdirSync(COMMANDS_DIR).filter(f => 
  f.endsWith('.md') && !f.startsWith('gsd-')
);
for (const file of commandFiles) {
  const name = file.replace('.md', '');
  const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf8');
  const fm = extractFrontmatter(content);
  const desc = fm.description || '';
  const agent = fm.agent || '';
  commandMappings[name] = {
    description: desc.slice(0, 200),
    agent: agent,
  };
}

console.log(JSON.stringify({ agentConfigs, commandMappings }, null, 2));
