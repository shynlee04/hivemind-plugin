import { tool } from "@opencode-ai/plugin/tool"

import {
  sendPromptAsync,
  showTuiToast,
  getParentID,
  getSessionID,
  type OpenCodeClient,
} from "../../shared/session-api.js"

export function createHivemindSteerTool(client: OpenCodeClient): ReturnType<typeof tool> {
  return tool({
    description:
      "Inject a steering message into the ROOT (main) session via noReply:true context injection. Walks the parent chain from the caller's session up to the root. Bypasses the child session queue.",
    args: {
      message: tool.schema.string().describe("The steering instruction to inject"),
    },
    async execute(args, context: { sessionID?: string; directory?: string; worktree?: string }) {
      const callerSessionId = context?.sessionID

      let rootSessionId: string | undefined

      if (callerSessionId) {
        let currentId: string | undefined = callerSessionId
        const visited = new Set<string>()
        while (currentId && !visited.has(currentId)) {
          visited.add(currentId)
          const sess = (await client.session.get({ path: { id: currentId } })) as
            | { id?: string; parentID?: string; parentId?: string }
            | undefined
          const sessRecord: { id?: string; parentID?: string; parentId?: string } = sess ?? {}
          const parentId: string | undefined =
            getParentID(sessRecord) ?? sessRecord.parentId
          if (!parentId) {
            rootSessionId = getSessionID(sessRecord) ?? currentId
            break
          }
          currentId = parentId
        }
      }

      if (!rootSessionId) {
        const sessionsResp = await client.session.list()
        const sessionsList: Array<{ id: string; parentID?: string }> = Array.isArray(sessionsResp)
          ? (sessionsResp as Array<{ id: string; parentID?: string }>)
          : (((sessionsResp as { data?: Array<{ id: string; parentID?: string }> })?.data ?? []) as Array<{
              id: string
              parentID?: string
            }>)
        const rootSessions = sessionsList.filter((s) => !s.parentID)
        if (rootSessions.length > 0) {
          rootSessionId = rootSessions[0].id
        }
      }

      if (!rootSessionId) {
        await showTuiToast(client, "No root session found to steer", "error")
        return JSON.stringify({ status: "error", message: "No root session found" })
      }

      const steerMessage = `[STEER] ${args.message}`
      await sendPromptAsync(client, rootSessionId, {
        parts: [{ type: "text", text: steerMessage }],
        noReply: true,
      })

      await showTuiToast(client, `Steering: "${args.message.slice(0, 80)}"`, "info")

      return JSON.stringify({
        status: "injected",
        sessionId: rootSessionId,
        callerSessionId: callerSessionId ?? null,
        message: `Steering message injected into root session ${rootSessionId}`,
      })
    },
  })
}
