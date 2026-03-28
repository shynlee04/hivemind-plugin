#!/usr/bin/env node
import { readFileSync } from "node:fs";

/**
 * check-mcp-readiness.mjs — Verify MCP provider availability for research
 *
 * Usage: node check-mcp-readiness.mjs [config-path]
 *
 * Default config path: templates/mcp-config-template.json
 * Output: JSON with provider status for all 8 research providers
 */

const configPath = process.argv[2] || "templates/mcp-config-template.json";

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf-8"));
} catch (error) {
  console.error(`failed to read config: ${String(error)}`);
  process.exit(1);
}

const mcp = typeof config?.mcp === "object" && config.mcp !== null ? config.mcp : {};

const expected = [
  { key: "context7", env: [], description: "Official documentation" },
  { key: "deepwiki", env: [], description: "Repository synthesis" },
  { key: "repomix", env: [], description: "Repository packing" },
  { key: "tavily", env: ["TAVILY_API_KEY"], description: "AI web search" },
  { key: "exa", env: ["EXA_API_KEY"], description: "Code-aware search" },
  { key: "sequential-thinking", env: [], description: "Multi-step reasoning" },
  { key: "grep", env: [], description: "GitHub code search" },
  { key: "brave-search", env: ["BRAVE_API_KEY"], description: "General web search" },
];

const rows = expected.map(({ key, env, description }) => {
  const entry = mcp[key];
  if (!entry) {
    return {
      provider: key,
      description,
      status: "missing",
      detail: "No MCP entry found in config",
    };
  }

  if (entry.enabled === false) {
    return {
      provider: key,
      description,
      status: "disabled",
      detail: "Configured but explicitly disabled",
    };
  }

  const missingEnv = env.filter((name) => !process.env[name]);
  if (missingEnv.length > 0) {
    return {
      provider: key,
      description,
      status: "missing_credentials",
      detail: `Missing environment variable(s): ${missingEnv.join(", ")}`,
    };
  }

  if (entry.type !== "remote" && entry.type !== "local") {
    return {
      provider: key,
      description,
      status: "misconfigured",
      detail: `Unsupported type: ${entry.type}. Expected 'remote' or 'local'.`,
    };
  }

  return {
    provider: key,
    description,
    status: "ready",
    detail: "OK",
  };
});

const readyCount = rows.filter((r) => r.status === "ready").length;
const totalCount = rows.length;

console.log(JSON.stringify({
  summary: {
    ready: readyCount,
    total: totalCount,
    defaultStackReady: ["context7", "deepwiki", "repomix", "grep", "sequential-thinking"]
      .every((k) => rows.find((r) => r.provider === k)?.status === "ready"),
  },
  providers: rows,
}, null, 2));
