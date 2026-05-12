#!/usr/bin/env node

/**
 * hm-executor: Reorder YAML frontmatter fields in all hm-* and hf-* agent files
 * and strip `#` comment lines from YAML frontmatter.
 *
 * Rules:
 * 1. OpenCode-native fields FIRST: name, description, mode, temperature, steps, color, permission
 * 2. All other Hivemind custom fields AFTER, preserving relative order
 * 3. Remove lines in YAML frontmatter that start with # (comment-only lines)
 * 4. Markdown body (after closing ---) is NEVER touched
 */

const yaml = require('yaml');
const fs = require('fs');
const path = require('path');

const AGENTS_DIR = path.join(__dirname, '..', '..', '.opencode', 'agents');

// OpenCode-native fields in their required priority order
const NATIVE_FIELD_ORDER = ['name', 'description', 'mode', 'temperature', 'steps', 'color', 'permission'];

/**
 * Reorder a parsed YAML object's keys:
 * native fields first (in NATIVE_FIELD_ORDER), then custom fields in their original order.
 */
function reorderKeys(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;

  const result = {};
  const existingKeys = new Set(Object.keys(obj));

  // Add native fields in order if they exist on this object
  for (const key of NATIVE_FIELD_ORDER) {
    if (existingKeys.has(key)) {
      result[key] = obj[key];
      existingKeys.delete(key);
    }
  }

  // Add remaining custom fields in their original order from the object
  for (const key of Object.keys(obj)) {
    if (existingKeys.has(key)) {
      result[key] = obj[key];
    }
  }

  return result;
}

/**
 * Extract YAML frontmatter and markdown body from an agent file.
 * Returns { yamlText, body } or null if no frontmatter found.
 */
function splitFrontmatter(content) {
  // Match: file must start with --- followed by newline
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;

  const yamlText = match[1];
  const bodyStart = match[0].length;
  const body = content.slice(bodyStart);

  return { yamlText, body };
}

/**
 * Process a single agent file.
 * Returns true on success, false on failure.
 */
function processFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.error(`  ERROR: Cannot read ${filePath}: ${e.message}`);
    return false;
  }

  const split = splitFrontmatter(content);
  if (!split) {
    console.error(`  ERROR: No frontmatter found in ${filePath}`);
    return false;
  }

  const { yamlText, body } = split;

  // Parse the YAML
  let parsed;
  try {
    parsed = yaml.parse(yamlText);
  } catch (e) {
    console.error(`  ERROR: YAML parse failed in ${filePath}: ${e.message}`);
    return false;
  }

  if (!parsed || typeof parsed !== 'object') {
    console.error(`  ERROR: Parsed YAML is not an object in ${filePath}`);
    return false;
  }

  // Reorder the keys at the top level
  const reordered = reorderKeys(parsed);

  // Convert back to YAML string
  let newYaml;
  try {
    newYaml = yaml.stringify(reordered, {
      lineWidth: 0,       // No line wrapping
      indent: 2,           // 2-space indent
      doubleQuotedMinLength: Infinity, // Never auto-quote short strings
      doubleQuotedAsJSON: false,
    });
  } catch (e) {
    console.error(`  ERROR: YAML stringify failed in ${filePath}: ${e.message}`);
    return false;
  }

  // Trim trailing newline from stringify output for clean reassembly
  newYaml = newYaml.trimEnd();

  // Reconstruct file: ---\n + yaml + ---\n + body
  const newContent = `---\n${newYaml}\n---\n${body}`;

  // Verify the new content is different (sanity check)
  if (newContent === content) {
    console.log(`  (unchanged)`);
  }

  // Write back
  try {
    fs.writeFileSync(filePath, newContent, 'utf8');
  } catch (e) {
    console.error(`  ERROR: Cannot write ${filePath}: ${e.message}`);
    return false;
  }

  return true;
}

/**
 * Verify that a file's YAML frontmatter is valid by re-parsing it.
 */
function verifyFile(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return { ok: false, error: `Cannot read: ${e.message}` };
  }

  const split = splitFrontmatter(content);
  if (!split) {
    return { ok: false, error: 'No frontmatter found' };
  }

  try {
    const parsed = yaml.parse(split.yamlText);
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Parse result is not an object' };
    }
  } catch (e) {
    return { ok: false, error: `Parse failed: ${e.message}` };
  }

  return { ok: true };
}

// --- Main ---

const allFiles = fs.readdirSync(AGENTS_DIR)
  .filter(f => (f.startsWith('hm-') || f.startsWith('hf-')) && f.endsWith('.md'))
  .sort();

console.log(`Found ${allFiles.length} agent files to process.\n`);

let successCount = 0;
let failCount = 0;
const failedFiles = [];

for (const file of allFiles) {
  const filePath = path.join(AGENTS_DIR, file);
  console.log(`${file}...`);
  if (processFile(filePath)) {
    successCount++;
  } else {
    failCount++;
    failedFiles.push(file);
  }
}

console.log(`\n=== TRANSFORMATION COMPLETE ===`);
console.log(`Total files: ${allFiles.length}`);
console.log(`Succeeded:  ${successCount}`);
console.log(`Failed:     ${failCount}`);
if (failedFiles.length > 0) {
  console.log(`Failed files: ${failedFiles.join(', ')}`);
}

// Verification pass
console.log(`\n=== VERIFICATION PASS ===`);
let verifyOk = 0;
let verifyFail = 0;
for (const file of allFiles) {
  const filePath = path.join(AGENTS_DIR, file);
  const result = verifyFile(filePath);
  if (result.ok) {
    verifyOk++;
  } else {
    verifyFail++;
    console.log(`  FAIL: ${file} - ${result.error}`);
  }
}
console.log(`YAML valid: ${verifyOk}/${allFiles.length}`);
if (verifyFail > 0) {
  console.log(`INVALID: ${verifyFail} files have broken YAML!`);
}
