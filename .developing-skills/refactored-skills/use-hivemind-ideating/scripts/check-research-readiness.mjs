#!/usr/bin/env node
// check-research-readiness.mjs — Checks MCP tool readiness for cross-stack research
// Usage: node scripts/check-research-readiness.mjs
// Outputs JSON readiness report

import { execSync } from 'child_process';

const timestamp = new Date().toISOString();

/**
 * Check if a command is available on the system
 * @param {string} cmd - Command to check
 * @returns {boolean}
 */
function commandExists(cmd) {
  try {
    execSync(`which ${cmd} 2>/dev/null`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check network connectivity to a host
 * @param {string} host - Hostname to check
 * @returns {boolean}
 */
function checkNetwork(host) {
  try {
    execSync(`ping -c 1 -t 3 ${host} 2>/dev/null`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check MCP server configuration
 * @returns {object} MCP server status
 */
function checkMcpServers() {
  const servers = {
    exa: { available: false, tools: [] },
    tavily: { available: false, tools: [] },
    brave_search: { available: false, tools: [] },
    context7: { available: false, tools: [] },
    deepwiki: { available: false, tools: [] },
    repomix: { available: false, tools: [] },
    github: { available: false, tools: [] },
  };

  // Check for MCP tool availability via environment or config
  // In practice, these would be checked against the OpenCode MCP registry
  const envIndicators = {
    exa: ['EXA_API_KEY'],
    tavily: ['TAVILY_API_KEY'],
    brave_search: ['BRAVE_API_KEY'],
    context7: [],  // No key needed, always available
    deepwiki: [],  // No key needed, always available
    repomix: [],   // Local tool
    github: ['GITHUB_TOKEN'],
  };

  for (const [server, envVars] of Object.entries(envIndicators)) {
    if (envVars.length === 0) {
      // No API key required — assume available
      servers[server].available = true;
    } else {
      // Check if at least one env var is set
      servers[server].available = envVars.some(
        (v) => process.env[v] !== undefined && process.env[v] !== ''
      );
    }
  }

  // Assign known tools per server
  servers.exa.tools = ['web_search_exa', 'crawling_exa', 'get_code_context_exa'];
  servers.tavily.tools = [
    'tavily_search', 'tavily_extract', 'tavily_crawl',
    'tavily_map', 'tavily_research', 'tavily_skill',
  ];
  servers.brave_search.tools = [
    'brave_web_search', 'brave_local_search',
    'brave_video_search', 'brave_image_search',
    'brave_news_search', 'brave_summarizer',
  ];
  servers.context7.tools = ['resolve-library-id', 'query-docs'];
  servers.deepwiki.tools = [
    'read_wiki_structure', 'read_wiki_contents', 'ask_question',
  ];
  servers.repomix.tools = [
    'pack_codebase', 'pack_remote_repository', 'grep_repomix_output',
    'read_repomix_output', 'file_system_read_file', 'file_system_read_directory',
  ];
  servers.github.tools = [
    'search_code', 'get_file_contents', 'search_repositories',
    'create_or_update_file', 'push_files',
  ];

  return servers;
}

/**
 * Assess overall readiness
 * @param {object} servers - MCP server status
 * @param {boolean} networkOk - Network connectivity status
 * @returns {object} Readiness assessment
 */
function assessReadiness(servers, networkOk) {
  const available = Object.entries(servers)
    .filter(([, s]) => s.available)
    .map(([name]) => name);

  const unavailable = Object.entries(servers)
    .filter(([, s]) => !s.available)
    .map(([name]) => name);

  let level;
  if (available.length >= 5 && networkOk) {
    level = 'FULL';
  } else if (available.length >= 3 && networkOk) {
    level = 'STANDARD';
  } else if (available.length >= 1) {
    level = 'MINIMAL';
  } else {
    level = 'UNAVAILABLE';
  }

  return {
    level,
    available_count: available.length,
    total_count: Object.keys(servers).length,
    network_ok: networkOk,
    available_servers: available,
    unavailable_servers: unavailable,
    recommendations: unavailable.length > 0
      ? [`Set API keys for: ${unavailable.join(', ')}`]
      : ['All research tools are available'],
  };
}

// --- Main execution ---

const networkOk = checkNetwork('api.github.com') || checkNetwork('google.com');
const servers = checkMcpServers();
const readiness = assessReadiness(servers, networkOk);

const report = {
  status: readiness.level === 'UNAVAILABLE' ? 'not_ready' : 'ready',
  readiness,
  servers,
  _meta: {
    created_at: timestamp,
    updated_at: timestamp,
    producer: 'use-hivemind-ideating/scripts/check-research-readiness.mjs',
  },
};

console.log(JSON.stringify(report, null, 2));

if (readiness.level === 'UNAVAILABLE') {
  process.exit(1);
}
