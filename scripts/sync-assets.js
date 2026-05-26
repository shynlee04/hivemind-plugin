import { existsSync, mkdirSync, readdirSync, rmSync, cpSync, statSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const metaBuilderRoot = join(projectRoot, ".hivefiver-meta-builder");
const assetsRoot = join(projectRoot, "assets");

if (!existsSync(metaBuilderRoot)) {
  console.log("[Harness Build] .hivefiver-meta-builder not found, skipping assets sync.");
  process.exit(0);
}

const PRIMITIVE_MAP = {
  agents: join(metaBuilderRoot, "agents-lab", "active", "refactoring"),
  skills: join(metaBuilderRoot, "skills-lab", "active", "refactoring"),
  commands: join(metaBuilderRoot, "commands-lab", "active", "refactoring"),
};

console.log("[Harness Build] Syncing active primitives to assets/...");

for (const [kind, sourceDir] of Object.entries(PRIMITIVE_MAP)) {
  const targetDir = join(assetsRoot, kind);
  
  if (existsSync(targetDir)) {
    rmSync(targetDir, { recursive: true, force: true });
  }
  mkdirSync(targetDir, { recursive: true });

  if (existsSync(sourceDir)) {
    for (const entry of readdirSync(sourceDir)) {
      if (entry === ".gitkeep") continue;
      if (entry.startsWith("gsd-") || entry === "gsd") continue;
      if (entry.startsWith("hm-l1-") || entry.startsWith("hm-l2-") || entry.startsWith("hm-l3-")) continue;
      
      const srcPath = join(sourceDir, entry);
      const destPath = join(targetDir, entry);
      
      cpSync(srcPath, destPath, { recursive: true });
    }
    console.log(`[Harness Build] Synced ${kind} from ${sourceDir}`);
  }
}
console.log("[Harness Build] Assets sync completed successfully.");
