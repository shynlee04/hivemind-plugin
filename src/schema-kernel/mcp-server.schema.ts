import { z } from "zod"

// ---------------------------------------------------------------------------
// 1. MCP Server Type — discriminated union tag
// ---------------------------------------------------------------------------

/**
 * Discriminator for MCP server transport: local process or remote HTTP.
 */
export const MCPServerTypeSchema = z.enum(["local", "remote"])

export type MCPServerType = z.infer<typeof MCPServerTypeSchema>

// ---------------------------------------------------------------------------
// 2. Local MCP Server — spawned as a child process
// ---------------------------------------------------------------------------

/**
 * Configuration for a locally-running MCP server. The `command` array is
 * executed as a child process (e.g. `["npx", "-y", "pkg"]`).
 */
export const LocalMCPServerSchema = z
  .object({
    type: z.literal("local"),
    command: z.array(z.string().min(1)).min(1),
    environment: z.record(z.string(), z.string()).optional(),
    enabled: z.boolean().optional().default(true),
    timeout: z.number().int().positive().optional(),
  })
  .strict()

export type LocalMCPServer = z.infer<typeof LocalMCPServerSchema>

// ---------------------------------------------------------------------------
// 3. Remote MCP Server — HTTP/HTTPS endpoint
// ---------------------------------------------------------------------------

/**
 * OAuth credentials for a remote MCP server.
 */
const MCPOAuthSchema = z
  .object({
    clientId: z.string().min(1),
    scope: z.string().optional(),
  })
  .strict()

/**
 * Configuration for a remote MCP server accessed via HTTP. The `url`
 * must be a valid HTTP(S) endpoint.
 */
export const RemoteMCPServerSchema = z
  .object({
    type: z.literal("remote"),
    url: z.string().url(),
    headers: z.record(z.string(), z.string()).optional(),
    oauth: MCPOAuthSchema.optional(),
    enabled: z.boolean().optional().default(true),
    timeout: z.number().int().positive().optional(),
  })
  .strict()

export type RemoteMCPServer = z.infer<typeof RemoteMCPServerSchema>

// ---------------------------------------------------------------------------
// 4. MCP Server Config — discriminated union
// ---------------------------------------------------------------------------

/**
 * A single MCP server entry: either a local process or remote endpoint.
 * Discriminated on the `type` field.
 */
export const MCPServerConfigSchema = z.discriminatedUnion("type", [
  LocalMCPServerSchema,
  RemoteMCPServerSchema,
])

export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>

// ---------------------------------------------------------------------------
// 5. MCP Server Registry — named collection in opencode.json
// ---------------------------------------------------------------------------

/**
 * The `mcp` section of opencode.json: a mapping of server names to their
 * configurations.
 */
export const MCPServerRegistrySchema = z.record(
  z.string().min(1),
  MCPServerConfigSchema,
)

export type MCPServerRegistry = z.infer<typeof MCPServerRegistrySchema>
