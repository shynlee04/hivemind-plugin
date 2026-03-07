#!/usr/bin/env node
import { readFileSync } from "node:fs";

const configPath = process.argv[2] || "templates/opencode-config-template.json";

let config;
try {
  config = JSON.parse(readFileSync(configPath, "utf-8"));
} catch (error) {
  console.error(`failed to read config: ${String(error)}`);
  process.exit(1);
}

const mcp = typeof config?.mcp === "object" && config.mcp !== null ? config.mcp : {};
const expected = [
  { key: "context7", env: [] },
  { key: "deepwiki", env: [] },
  { key: "repomix", env: [] },
  { key: "tavily", env: ["TAVILY_API_KEY"] },
  { key: "exa", env: ["EXA_API_KEY"] },
];

const rows = expected.map(({ key, env }) => {
  const entry = mcp[key];
  if (!entry) {
    return {
      provider: key,
      status: "missing",
      detail: "No MCP entry found",
    };
  }

  if (entry.enabled === false) {
    return {
      provider: key,
      status: "disabled",
      detail: "Configured but disabled",
    };
  }

  const missingEnv = env.filter((name) => !process.env[name]);
  if (missingEnv.length > 0) {
    return {
      provider: key,
      status: "missing_credentials",
      detail: `Missing env: ${missingEnv.join(", ")}`,
    };
  }

  if (entry.type !== "remote" && entry.type !== "local") {
    return {
      provider: key,
      status: "misconfigured",
      detail: "Unsupported type",
    };
  }

  return {
    provider: key,
    status: "ready",
    detail: "OK",
  };
});

console.log(JSON.stringify({ providers: rows }, null, 2));
