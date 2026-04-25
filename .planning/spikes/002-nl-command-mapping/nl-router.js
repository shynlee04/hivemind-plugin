import { readFileSync } from 'node:fs';

/**
 * Spike 002: Natural Language → Command Mapping
 *
 * Given a structured command catalog with descriptions and trigger phrases,
 * when natural language input is provided,
 * then keyword + semantic matching produces the correct command match.
 */

// Simple tokenization: lowercase, remove punctuation, split on whitespace, filter stopwords
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'can', 'shall', 'to', 'of', 'in', 'for',
  'on', 'at', 'by', 'with', 'from', 'up', 'about', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now', 'this', 'that',
  'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves',
  'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'whose', 'if', 'because',
  'until', 'while', 'as', 's', 't', 'don', 'doesn', 'didn', 'wasn', 'weren',
  'won', 'wouldn', 'couldn', 'shouldn', 'mightn', 'mustn', 'needn', 'hasn',
  'haven', 'hadn', 'isn', 'aren', 'ain', 'll', 're', 've', 'd', 'o', 'did',
  'does', 'doing', 'get', 'gets', 'got', 'getting', 'go', 'goes', 'going',
  'went', 'use', 'using', 'used', 'make', 'makes', 'made', 'making',
  'run', 'runs', 'ran', 'running', 'want', 'wants', 'wanted', 'wanting',
  'help', 'helps', 'helped', 'helping', 'need', 'needs', 'needed', 'needing',
  'try', 'tries', 'tried', 'trying', 'start', 'starts', 'started', 'starting',
  'work', 'works', 'worked', 'working', 'create', 'creates', 'created', 'creating',
  'add', 'adds', 'added', 'adding', 'check', 'checks', 'checked', 'checking',
  'set', 'sets', 'setting', 'let', 'lets', 'letting', 'put', 'puts', 'putting',
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function computeOverlapScore(queryTokens, commandTokens) {
  if (!queryTokens.length || !commandTokens.length) return 0;
  const querySet = new Set(queryTokens);
  const commandSet = new Set(commandTokens);
  let matches = 0;
  for (const token of querySet) {
    if (commandSet.has(token)) matches++;
    // Partial match for compound words
    else {
      for (const ct of commandSet) {
        if (ct.includes(token) || token.includes(ct)) {
          matches += 0.5;
          break;
        }
      }
    }
  }
  return matches / Math.sqrt(querySet.size * commandSet.size);
}

function route(query, catalog) {
  const queryTokens = tokenize(query);

  // Strategy 1: Exact trigger phrase match (highest confidence)
  for (const cmd of catalog) {
    for (const trigger of cmd.triggers) {
      if (trigger.toLowerCase() === query.toLowerCase()) {
        return { command: cmd, score: 1.0, strategy: 'exact-trigger', reason: `Exact match on trigger "${trigger}"` };
      }
    }
  }

  // Strategy 2: Trigger phrase substring match
  for (const cmd of catalog) {
    for (const trigger of cmd.triggers) {
      if (query.toLowerCase().includes(trigger.toLowerCase()) || trigger.toLowerCase().includes(query.toLowerCase())) {
        return { command: cmd, score: 0.9, strategy: 'trigger-substring', reason: `Substring match on trigger "${trigger}"` };
      }
    }
  }

  // Strategy 3: Keyword overlap scoring across description + objective + process
  let best = null;
  let bestScore = 0;

  for (const cmd of catalog) {
    const descTokens = tokenize(cmd.description);
    const objTokens = tokenize(cmd.hasObjective ? 'objective goal purpose' : '');
    const procTokens = tokenize(cmd.hasProcess ? 'process workflow steps execution' : '');
    const agentTokens = tokenize(cmd.agent || '');
    const nameTokens = tokenize(cmd.name.replace(/-/g, ' '));

    const allTokens = [...descTokens, ...objTokens, ...procTokens, ...agentTokens, ...nameTokens];

    const score = computeOverlapScore(queryTokens, allTokens);

    // Boost for custom commands with richer metadata
    const sourceBoost = cmd.source === 'custom' ? 1.1 : 1.0;
    const triggerBoost = cmd.triggers.length > 0 ? 1.2 : 1.0;
    const finalScore = score * sourceBoost * triggerBoost;

    if (finalScore > bestScore) {
      bestScore = finalScore;
      best = { command: cmd, score, strategy: 'keyword-overlap', reason: `Score ${score.toFixed(3)} from ${descTokens.length} description tokens + ${nameTokens.length} name tokens` };
    }
  }

  if (best && bestScore > 0) {
    best.score = bestScore;
    return best;
  }

  return { command: null, score: 0, strategy: 'none', reason: 'No match found' };
}

function main() {
  const catalogPath = '.planning/spikes/001-command-catalog-discovery/catalog.json';
  let catalog;
  try {
    catalog = JSON.parse(readFileSync(catalogPath, 'utf-8'));
  } catch (err) {
    console.error(`Failed to load catalog: ${err.message}`);
    console.error('Run Spike 001 first: node .planning/spikes/001-command-catalog-discovery/discover-commands.js');
    process.exit(1);
  }

  // Test queries covering explicit triggers, implicit descriptions, and edge cases
  const testQueries = [
    // Exact trigger matches (should hit Strategy 1)
    'audit harness',
    'check boundaries',
    'configure agent',
    'create a skill',

    // Substring trigger matches (should hit Strategy 2)
    'can you audit the harness for me',
    'I want to configure an agent',
    'help me create a new skill',

    // Description-based matches (Strategy 3)
    'run some tests and show coverage',
    'plan out a new phase for the project',
    'debug a bug in the code',
    'add an item to the backlog',
    'update the project roadmap',
    'review the code quality',
    'build a new skill from scratch',
    'enhance my prompt',
    'analyze the project dependencies',
    'run a full security audit',
    'set up a new agent configuration',
    'verify the architecture is sound',
    'check if commands are healthy',
    'do a comprehensive project audit',

    // Edge cases / vague queries
    'help me with something',
    'fix the broken stuff',
    'make it better',
  ];

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  SPIKE 002: Natural Language → Command Mapping');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`Catalog size: ${catalog.length} commands`);
  console.log(`Commands with triggers: ${catalog.filter(c => c.triggers.length > 0).length}`);
  console.log(`Test queries: ${testQueries.length}\n`);

  let exactMatches = 0;
  let substringMatches = 0;
  let keywordMatches = 0;
  let noMatches = 0;

  for (const query of testQueries) {
    const result = route(query, catalog);

    if (result.strategy === 'exact-trigger') exactMatches++;
    else if (result.strategy === 'trigger-substring') substringMatches++;
    else if (result.strategy === 'keyword-overlap') keywordMatches++;
    else noMatches++;

    const cmdName = result.command ? result.command.name : 'NONE';
    const cmdDesc = result.command
      ? result.command.description.length > 60
        ? result.command.description.slice(0, 60) + '...'
        : result.command.description
      : '—';

    const strategyIcon =
      result.strategy === 'exact-trigger' ? '✓' :
      result.strategy === 'trigger-substring' ? '~' :
      result.strategy === 'keyword-overlap' ? '?' :
      '✗';

    console.log(`${strategyIcon} "${query}"`);
    console.log(`   → /${cmdName} (${result.strategy}, score ${result.score.toFixed(3)})`);
    console.log(`   → ${cmdDesc}`);
    console.log();
  }

  console.log('--- Match Summary ---');
  console.log(`Exact trigger matches:     ${exactMatches}`);
  console.log(`Substring trigger matches: ${substringMatches}`);
  console.log(`Keyword overlap matches:   ${keywordMatches}`);
  console.log(`No match:                  ${noMatches}`);
  console.log(`Coverage:                  ${((testQueries.length - noMatches) / testQueries.length * 100).toFixed(1)}%`);

  // Show top 5 commands by description richness (longest descriptions = more signal for matching)
  console.log('\n--- Top Commands by Description Richness ---');
  const richest = [...catalog]
    .sort((a, b) => (b.description?.length || 0) - (a.description?.length || 0))
    .slice(0, 5);
  for (const cmd of richest) {
    console.log(`  ${cmd.name}: ${cmd.description?.length || 0} chars`);
  }
}

main();
