import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, statSync } from "node:fs";
import { join, basename, dirname } from "node:path";

const projectRoot = "/Users/apple/hivemind-plugin-private";
const opencodeRoot = join(projectRoot, ".opencode");
const assetsRoot = join(projectRoot, "assets");

const gsdReferencesDir = join(opencodeRoot, "get-shit-done", "references");
const gsdTemplatesDir = join(opencodeRoot, "get-shit-done", "templates");
const gsdWorkflowsDir = join(opencodeRoot, "get-shit-done", "workflows");
const gsdCommandDir = join(opencodeRoot, "command");

const hmReferencesDir = join(assetsRoot, "references");
const hmTemplatesDir = join(assetsRoot, "templates");
const hmWorkflowsDir = join(assetsRoot, "workflows");
const hmCommandsDir = join(assetsRoot, "commands");

const agentMap = {
  "gsd-orchestrator": "hm-orchestrator",
  "gsd-roadmapper": "hm-roadmapper",
  "gsd-planner": "hm-planner",
  "gsd-executor": "hm-executor",
  "gsd-verifier": "hm-verifier",
  "gsd-debugger": "hm-debugger",
  "gsd-nyquist-auditor": "hm-nyquist-auditor",
  "gsd-phase-researcher": "hm-phase-researcher",
  "gsd-project-researcher": "hm-project-researcher",
  "gsd-code-fixer": "hm-code-fixer",
  "gsd-code-reviewer": "hm-code-reviewer",
  "gsd-codebase-mapper": "hm-codebase-mapper",
  "gsd-user-profiler": "hm-user-profiler",
  "gsd-intent-loop": "hm-intent-loop",
};

function transformContent(content) {
  let result = content;
  
  // 1. Convert get-shit-done paths to hivemind equivalent paths
  result = result.replace(/get-shit-done\/workflows\/([a-zA-Z0-9_-]+)/g, "workflows/hm-$1");
  result = result.replace(/get-shit-done\/references\/([a-zA-Z0-9_-]+)/g, "references/hm-$1");
  result = result.replace(/get-shit-done\/templates\/([a-zA-Z0-9_-]+)/g, "templates/hm-$1");
  
  // 2. Convert get-shit-done commands to hm equivalent execution contexts
  result = result.replace(/@\.opencode\/get-shit-done\/workflows\/([a-zA-Z0-9_-]+)\.md/g, "@.opencode/workflows/hm-$1.md");
  result = result.replace(/@\.opencode\/command\/gsd-([a-zA-Z0-9_-]+)\.md/g, "@.opencode/commands/hm-$1.md");
  
  // 3. Terminology translations
  result = result.replace(/get-shit-done/g, "hivemind");
  result = result.replace(/Get-Shit-Done/g, "Hivemind");
  result = result.replace(/GET-SHIT-DONE/g, "HIVEMIND");
  result = result.replace(/GSD/g, "Hivemind");
  result = result.replace(/gsd-([a-zA-Z0-9_-]+)/g, (m, name) => {
    const mapped = agentMap[`gsd-${name}`];
    return mapped ? mapped : `hm-${name}`;
  });
  result = result.replace(/\bgsd\b/g, "hm");
  result = result.replace(/\bGsd\b/g, "Hm");
  result = result.replace(/namespace:\s*gsd/g, "namespace: hm");
  result = result.replace(/coordination-model:\s*".*?"/g, 'coordination-model: "waiter-model"');

  return result;
}

function processDir(srcDir, destDir, isRoot = false) {
  if (!existsSync(destDir)) {
    mkdirSync(destDir, { recursive: true });
  }
  const entries = readdirSync(srcDir);
  for (const entry of entries) {
    if (entry === ".gitkeep" || entry === ".DS_Store" || entry === "bin") continue;
    const srcPath = join(srcDir, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      processDir(srcPath, join(destDir, entry));
    } else {
      let destFilename = entry;
      // Prepend hm- unless it is a standard file or already starts with hm-
      const lowerEntry = entry.toLowerCase();
      const skipPrefixList = ["readme.md", "security.md", "config.json", "ai-spec.md", "ui-spec.md", "checkpoint.json", "context.md", "discussion-log.md"];
      
      if (!entry.startsWith("hm-") && !skipPrefixList.includes(lowerEntry)) {
        if (entry.startsWith("gsd-")) {
          destFilename = entry.replace("gsd-", "hm-");
        } else if (entry.startsWith("gsd")) {
          destFilename = entry.replace("gsd", "hm");
        } else {
          destFilename = `hm-${lowerEntry}`;
        }
      } else if (lowerEntry === "ai-spec.md") {
        destFilename = "hm-ai-spec.md";
      } else if (lowerEntry === "ui-spec.md") {
        destFilename = "hm-ui-spec.md";
      }
      
      const destPath = join(destDir, destFilename);
      console.log(`Processing: ${srcPath} -> ${destPath}`);
      let content = readFileSync(srcPath, "utf8");
      content = transformContent(content);
      writeFileSync(destPath, content, "utf8");
    }
  }
}

// 1. Transform References
console.log("Starting GSD references transformation...");
processDir(gsdReferencesDir, hmReferencesDir);

// 2. Transform Templates
console.log("Starting GSD templates transformation...");
processDir(gsdTemplatesDir, hmTemplatesDir);

// 3. Transform Workflows
console.log("Starting GSD workflows transformation...");
processDir(gsdWorkflowsDir, hmWorkflowsDir);

// 4. Transform Commands
console.log("Starting GSD commands transformation...");
processDir(gsdCommandDir, hmCommandsDir);

console.log("Transformation of GSD to Hivemind primitives complete.");
