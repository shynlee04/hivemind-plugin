#!/usr/bin/env node
import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("usage: validate-prd-json.mjs <path>");
  process.exit(1);
}

let data;
try {
  data = JSON.parse(readFileSync(path, "utf-8"));
} catch (err) {
  console.error(`invalid json: ${String(err)}`);
  process.exit(1);
}

const errors = [];
if (typeof data !== "object" || data === null || Array.isArray(data)) {
  errors.push("root must be an object");
}

if (data && Object.prototype.hasOwnProperty.call(data, "prd")) {
  errors.push("anti-pattern: wrapper key 'prd' is not allowed");
}
if (data && Object.prototype.hasOwnProperty.call(data, "tasks")) {
  errors.push("anti-pattern: use userStories, not tasks");
}
if (data && !Object.prototype.hasOwnProperty.call(data, "name")) {
  errors.push("missing root key: name");
}
if (data && !Object.prototype.hasOwnProperty.call(data, "userStories")) {
  errors.push("missing root key: userStories");
}
if (data && data.userStories && !Array.isArray(data.userStories)) {
  errors.push("userStories must be an array");
}

if (Array.isArray(data?.userStories)) {
  const seen = new Set();

  data.userStories.forEach((story, index) => {
    const prefix = `userStories[${index}]`;
    if (typeof story !== "object" || story === null || Array.isArray(story)) {
      errors.push(`${prefix} must be an object`);
      return;
    }

    const id = typeof story.id === "string" ? story.id.trim() : "";
    if (!id) {
      errors.push(`${prefix}.id is required`);
    } else if (seen.has(id)) {
      errors.push(`${prefix}.id duplicates '${id}'`);
    } else {
      seen.add(id);
    }

    const title = typeof story.title === "string" ? story.title.trim() : "";
    if (!title) {
      errors.push(`${prefix}.title is required`);
    }

    if (story.dependencies !== undefined) {
      if (!Array.isArray(story.dependencies)) {
        errors.push(`${prefix}.dependencies must be an array`);
      } else {
        story.dependencies.forEach((dep, depIndex) => {
          if (typeof dep !== "string" || dep.trim().length === 0) {
            errors.push(`${prefix}.dependencies[${depIndex}] must be non-empty string`);
            return;
          }
          if (dep === id) {
            errors.push(`${prefix}.dependencies[${depIndex}] cannot self-reference`);
          }
        });
      }
    }

    if (story.acceptanceCriteria !== undefined) {
      if (!Array.isArray(story.acceptanceCriteria)) {
        errors.push(`${prefix}.acceptanceCriteria must be an array`);
      } else {
        story.acceptanceCriteria.forEach((item, acIndex) => {
          if (typeof item !== "string" || item.trim().length === 0) {
            errors.push(`${prefix}.acceptanceCriteria[${acIndex}] must be non-empty string`);
          }
        });
      }
    }

    if (story.relatedEntities !== undefined) {
      if (typeof story.relatedEntities !== "object" || story.relatedEntities === null || Array.isArray(story.relatedEntities)) {
        errors.push(`${prefix}.relatedEntities must be an object`);
      } else {
        const allowedKeys = ["session_id", "plan_id", "phase_id", "graph_task_id", "story_id"];
        Object.entries(story.relatedEntities).forEach(([key, value]) => {
          if (!allowedKeys.includes(key)) {
            errors.push(`${prefix}.relatedEntities.${key} is not supported`);
            return;
          }
          if (value !== undefined && value !== null && (typeof value !== "string" || value.trim().length === 0)) {
            errors.push(`${prefix}.relatedEntities.${key} must be non-empty string when provided`);
          }
        });
      }
    }
  });

  const knownIds = new Set(data.userStories.map((story) => story?.id).filter((id) => typeof id === "string"));
  data.userStories.forEach((story, index) => {
    if (!Array.isArray(story?.dependencies)) return;
    story.dependencies.forEach((dep, depIndex) => {
      if (typeof dep === "string" && dep.trim().length > 0 && !knownIds.has(dep)) {
        errors.push(`userStories[${index}].dependencies[${depIndex}] references unknown id '${dep}'`);
      }
    });
  });
}

if (errors.length > 0) {
  errors.forEach((err) => console.error(err));
  process.exit(2);
}

console.log("ok");
