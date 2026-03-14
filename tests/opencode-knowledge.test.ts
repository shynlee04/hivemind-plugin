import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { resolveStartWork } from "../src/hooks/start-work/index.js"
import { createPluginRuntimePlan } from "../src/plugin/index.js"

describe("opencode knowledge routing", () => {
  it("adds deterministic runtime knowledge for execution-oriented shell work", () => {
    const decision = resolveStartWork({
      userMessage: "implement the runtime bridge and run npm build plus git checks",
      sessionId: "ses_opencode_knowledge",
      sessionScope: "main",
      activeLineage: "hivefiver",
      hasHivemind: true,
      hivemindHealthy: true,
      hasWorkflow: true,
      hasHandoff: false,
    })

    const knowledgeIds = decision.opencodeKnowledge.map((surface) => surface.knowledgeId)
    assert.deepEqual(knowledgeIds.includes("opencode-commands-are-prompts"), true)
    assert.deepEqual(knowledgeIds.includes("opencode-plugins-are-runtime"), true)
    assert.deepEqual(knowledgeIds.includes("opencode-non-interactive-shell"), true)
    assert.deepEqual(knowledgeIds.includes("opencode-project-or-global-surfaces"), true)
  })

  it("renders OpenCode runtime knowledge into the plugin runtime plan", async () => {
    const response = await createPluginRuntimePlan({
      startWork: {
        userMessage: "plan and verify the plugin runtime with build and test commands",
        sessionId: "ses_opencode_runtime_plan",
        sessionScope: "main",
        activeLineage: "hivefiver",
        hasHivemind: true,
        hivemindHealthy: true,
        hasWorkflow: true,
        hasHandoff: false,
      },
      promptState: {
        sessionId: "ses_opencode_runtime_plan",
        sessionScope: "main",
        lineage: "hivefiver",
        workflowId: "wf_opencode_runtime_plan",
        branchFocus: "deterministic runtime routing",
      },
    })

    assert.match(response.data?.opencodeKnowledgePacket ?? "", /<opencode-runtime-knowledge>/)
    assert.match(response.data?.opencodeKnowledgePacket ?? "", /shell_mode=non-interactive-no-tty/)
    assert.equal(
      response.data?.pluginContext.opencodeKnowledge.some(
        (surface) => surface.knowledgeId === "opencode-plugins-are-runtime",
      ),
      true,
    )
  })
})
