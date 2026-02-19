#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const inputPath = process.argv[2];
const outputPath = process.argv[3] || "tasks/prd.json";
const projectName = process.argv[4] || "HiveFiver Task Export";

if (!inputPath) {
  console.error("usage: todo-to-prd-json.mjs <tasks-manifest.json> [output-path] [project-name]");
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(inputPath, "utf-8"));
} catch (error) {
  console.error(`failed to read input: ${String(error)}`);
  process.exit(1);
}

if (!manifest || !Array.isArray(manifest.tasks)) {
  console.error("input must be a TaskManifest-like JSON with root.tasks array");
  process.exit(2);
}

function status(raw) {
  if (raw === "completed" || raw === "complete") return "completed";
  if (raw === "in_progress" || raw === "active") return "in_progress";
  if (raw === "blocked" || raw === "invalidated") return "blocked";
  return "pending";
}

function list(raw) {
  if (Array.isArray(raw)) {
    return raw.filter((x) => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
  }
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.split(",").map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

const stories = manifest.tasks.map((task, index) => {
  const content = typeof task.text === "string" && task.text.trim().length > 0
    ? task.text.trim()
    : `Task ${index + 1}`;

  const acceptanceCriteria = list(task.acceptanceCriteria ?? task.acceptance_criteria);
  const dependencies = list(task.dependencies ?? task.depends_on ?? task.dependsOn);

  return {
    id: typeof task.id === "string" && task.id.length > 0 ? task.id : `story-${index + 1}`,
    title: content.split("\n")[0] || `Task ${index + 1}`,
    description: content,
    status: status(task.status),
    dependencies,
    acceptanceCriteria,
    relatedEntities: task.related_entities && typeof task.related_entities === "object"
      ? {
          session_id: typeof task.related_entities.session_id === "string" ? task.related_entities.session_id : undefined,
          plan_id: typeof task.related_entities.plan_id === "string" ? task.related_entities.plan_id : undefined,
          phase_id: typeof task.related_entities.phase_id === "string" ? task.related_entities.phase_id : undefined,
          graph_task_id: typeof task.related_entities.graph_task_id === "string" ? task.related_entities.graph_task_id : undefined,
          story_id: typeof task.related_entities.story_id === "string" ? task.related_entities.story_id : undefined,
        }
      : undefined,
  };
});

const output = {
  name: projectName,
  description: "Generated from TaskManifest TODO state",
  userStories: stories,
};

writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`wrote ${outputPath}`);
