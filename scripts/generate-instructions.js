import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const agentsDir = "./assets/agents";
const instructionsDir = "./assets/agent-instructions";

async function main() {
  const files = await fs.readdir(agentsDir);
  const hmFiles = files.filter(f => f.startsWith("hm-") && f.endsWith(".md") && f !== "hm-l0-orchestrator.md");

  console.log(`[Instructions Generator] Found ${hmFiles.length} non-orchestrator hm-* agents.`);

  await fs.mkdir(instructionsDir, { recursive: true });

  for (const file of hmFiles) {
    const agentName = file.replace(/\.md$/, "");
    const agentPath = path.join(agentsDir, file);
    const content = await fs.readFile(agentPath, "utf-8");
    const parsed = matter(content);

    const description = parsed.data.description || "";
    const body = parsed.content;

    // Extract sections
    const role = extractSection(body, "Role") || description || "Specialist agent.";
    const flow = extractSection(body, "Execution Flow") || "Follow the default execution steps.";
    const successCriteria = extractSection(body, "Success Criteria") || "Ensure all outputs are correct.";
    const boundary = extractSection(body, "Delegation Boundary") || "No delegation allowed unless explicitly authorized.";

    // Generate instruction content
    const instructionContent = `# ${agentName} Instruction Profile

## 1. Identity, Role & Namespace Scope
* **Role**: ${role}
* **Namespace Boundary**: You belong to the **HM lineage** (runtime/product developer). You are strictly prohibited from implementing or modifying GSD internal developer tooling files, which are tracked in \`.opencode/gsd-file-manifest.json\`.
* **Execution Boundary**: You must work only within your designated domain context.

## 2. Delegation Requirements & Stacking
* **Delegation Bounds**: ${boundary}
* **GSD Tooling Boundary**: For any internal developer operations, repository maintenance, or GSD workflows, you MUST delegate to \`gsd-*\` agents instead of implementing them inline.
* **Session Stacking**: Before invoking any subtask, call \`delegation-status({ action: "find-stackable" })\`. If a matching session exists, stack onto it using the \`task_id\` or \`stackOnSessionId\` parameters.
* **Commit Governance**: Ensure atomic git commits. Commit documents, code changes, and test files in separate logical commits.

## 3. Workflow, Verification & Exit Criteria
* **Workflow Steps**:
${flow}
* **Success Criteria**:
${successCriteria}
* **Analysis Paralysis Guard**: If you execute more than 5 consecutive read/grep/glob/command actions without generating output or advancing the workflow state: STOP, write a status report, and return control.
* **Verification Duty**: You MUST verify all file modifications on disk and compile/typecheck output before returning a successful completion status.
`;

    // Write instruction file
    const instructionFilePath = path.join(instructionsDir, `${agentName}.md`);
    await fs.writeFile(instructionFilePath, instructionContent, "utf-8");
    console.log(`[Instructions Generator] Generated instructions for ${agentName}`);

    // Update agent frontmatter
    parsed.data.instruction = [
      ".opencode/rules/universal-rules.md",
      "AGENTS.md",
      `.opencode/agent-instructions/${agentName}.md`
    ];

    const updatedContent = matter.stringify(parsed.content, parsed.data);
    await fs.writeFile(agentPath, updatedContent, "utf-8");
    console.log(`[Instructions Generator] Updated frontmatter for ${file}`);
  }

  console.log("[Instructions Generator] Completed generation and frontmatter updates for all agents.");
}

function extractSection(body, header) {
  const lines = body.split("\n");
  const sectionLines = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      if (inSection) break;
      const headerText = trimmed.replace(/^#+\s+/, "").toLowerCase();
      if (headerText.includes(header.toLowerCase())) {
        inSection = true;
        continue;
      }
    }
    if (inSection) {
      sectionLines.push(line);
    }
  }

  return sectionLines.join("\n").trim();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
