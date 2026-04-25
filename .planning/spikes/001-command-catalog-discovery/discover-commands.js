import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

/**
 * Spike 001: Command Catalog Discovery
 *
 * Discovers all OpenCode command definitions from `.opencode/command/*.md`
 * and `.opencode/commands/*.md`, extracts YAML frontmatter with gray-matter,
 * and produces a structured catalog.
 */

async function main() {
  const { default: matter } = await import('gray-matter');

  const roots = [
    '.opencode/command',
    '.opencode/commands',
  ];

  const catalog = [];
  let totalFiles = 0;
  let parsedFiles = 0;
  let parseErrors = 0;

  for (const root of roots) {
    let entries;
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch (err) {
      console.error(`  SKIP: ${root} — ${err.message}`);
      continue;
    }

    for (const entry of entries) {
      if (!entry.isFile() || extname(entry.name) !== '.md') continue;
      totalFiles++;

      const path = join(root, entry.name);
      let content;
      try {
        content = readFileSync(path, 'utf-8');
      } catch (err) {
        console.error(`  ERROR reading ${path}: ${err.message}`);
        parseErrors++;
        continue;
      }

      let data;
      let parseMethod = 'gray-matter';
      try {
        const parsed = matter(content);
        data = parsed.data;
      } catch (err) {
        // Fallback: try regex extraction for malformed YAML
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (!frontmatterMatch) {
          console.error(`  ERROR parsing ${path}: ${err.message} (no frontmatter found)`);
          parseErrors++;
          continue;
        }
        const rawFm = frontmatterMatch[1];
        data = {};
        // Extract simple key: value pairs with regex
        for (const line of rawFm.split('\n')) {
          const match = line.match(/^(\w[\w-]*):\s*(.*)$/);
          if (match) {
            let [, key, value] = match;
            value = value.trim();
            // Remove surrounding quotes
            value = value.replace(/^['"](.*)['"]$/s, '$1');
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (/^\d+$/.test(value)) value = parseInt(value, 10);
            data[key] = value;
          }
        }
        parseMethod = 'regex-fallback';
        console.log(`  RECOVERED ${path} via regex fallback (${Object.keys(data).join(', ')})`);
      }

      parsedFiles++;

      // Extract trigger phrases from description
      const description = data.description || '';
      const triggerMatch = description.match(/Triggers?:\s*([^]+?)(?=\n\n|$)/i);
      const triggers = triggerMatch
        ? triggerMatch[1]
            .split(/[,;]/)
            .map(t => t.trim().replace(/^['"]|['"]$/g, ''))
            .filter(Boolean)
        : [];

      const commandName = entry.name.replace(/\.md$/, '');
      const source = root.replace(/\/$/, '').endsWith('commands') ? 'custom' : 'builtin';

      catalog.push({
        id: `${source}.${commandName}`,
        name: commandName,
        source,
        path,
        description: description.replace(/\s*Triggers?:.*/i, '').trim(),
        triggers,
        agent: data.agent || null,
        model: data.model || null,
        subtask: data.subtask ?? null,
        argumentHint: data['argument-hint'] || data.argumentHint || null,
        tools: data.tools || null,
        hasObjective: content.includes('<objective>'),
        hasProcess: content.includes('<process>'),
      });
    }
  }

  // Also check opencode.json for JSON-defined commands
  let jsonCommands = [];
  try {
    const opencodeConfig = JSON.parse(readFileSync('opencode.json', 'utf-8'));
    if (opencodeConfig.command) {
      for (const [name, cmd] of Object.entries(opencodeConfig.command)) {
        jsonCommands.push({
          id: `json.${name}`,
          name,
          source: 'json',
          path: 'opencode.json',
          description: cmd.description || null,
          triggers: [],
          agent: cmd.agent || null,
          model: cmd.model || null,
          subtask: cmd.subtask ?? null,
          argumentHint: null,
          tools: null,
          hasObjective: false,
          hasProcess: false,
          template: cmd.template || null,
        });
      }
    }
  } catch (err) {
    console.error(`  SKIP: opencode.json — ${err.message}`);
  }

  catalog.push(...jsonCommands);

  // Sort by source then name
  catalog.sort((a, b) => {
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    return a.name.localeCompare(b.name);
  });

  // Output
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SPIKE 001: Command Catalog Discovery');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Total markdown files scanned: ${totalFiles}`);
  console.log(`Successfully parsed:          ${parsedFiles}`);
  console.log(`Parse/read errors:            ${parseErrors}`);
  console.log(`JSON commands from config:    ${jsonCommands.length}`);
  console.log(`Total catalog entries:        ${catalog.length}`);

  // Field coverage
  const withDescription = catalog.filter(c => c.description).length;
  const withAgent = catalog.filter(c => c.agent).length;
  const withTriggers = catalog.filter(c => c.triggers.length > 0).length;
  const withTools = catalog.filter(c => c.tools).length;
  const withObjective = catalog.filter(c => c.hasObjective).length;
  const withProcess = catalog.filter(c => c.hasProcess).length;

  console.log('\n--- Field Coverage ---');
  console.log(`Description:     ${withDescription}/${catalog.length}`);
  console.log(`Agent:           ${withAgent}/${catalog.length}`);
  console.log(`Trigger phrases: ${withTriggers}/${catalog.length}`);
  console.log(`Tools map:       ${withTools}/${catalog.length}`);
  console.log(`<objective>:     ${withObjective}/${catalog.length}`);
  console.log(`<process>:       ${withProcess}/${catalog.length}`);

  // Source distribution
  const bySource = {};
  for (const c of catalog) {
    bySource[c.source] = (bySource[c.source] || 0) + 1;
  }
  console.log('\n--- Source Distribution ---');
  for (const [source, count] of Object.entries(bySource)) {
    console.log(`  ${source}: ${count}`);
  }

  // Triggers distribution
  const triggerCounts = catalog.map(c => c.triggers.length);
  const avgTriggers = triggerCounts.reduce((a, b) => a + b, 0) / catalog.length;
  console.log(`\n--- Trigger Distribution ---`);
  console.log(`Commands with triggers: ${withTriggers}`);
  console.log(`Average triggers/cmd:   ${avgTriggers.toFixed(2)}`);

  // Top 10 by trigger count
  const topTriggerCommands = [...catalog]
    .filter(c => c.triggers.length > 0)
    .sort((a, b) => b.triggers.length - a.triggers.length)
    .slice(0, 10);

  console.log('\n--- Top 10 Commands by Trigger Count ---');
  for (const c of topTriggerCommands) {
    console.log(`  ${c.name} (${c.triggers.length} triggers): ${c.triggers.slice(0, 3).join(', ')}${c.triggers.length > 3 ? '...' : ''}`);
  }

  // Output full catalog as JSON for downstream spikes
  const catalogPath = '.planning/spikes/001-command-catalog-discovery/catalog.json';
  // Using node:fs writeFileSync — but we're in ESM, use dynamic import or just console.log
  // Actually, let's output to stdout for now and save via redirection

  console.log('\n--- Catalog JSON (first 3 entries) ---');
  console.log(JSON.stringify(catalog.slice(0, 3), null, 2));
  console.log(`\n... (${catalog.length - 3} more entries)`);

  // Write catalog.json
  const { writeFileSync } = await import('node:fs');
  writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
  console.log(`\nFull catalog written to: ${catalogPath}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
