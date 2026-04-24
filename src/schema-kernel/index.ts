/**
 * Schema kernel barrel — re-exports all Zod schemas and inferred types
 * for OpenCode meta-concept validation: prompt-enhance pipeline, agent
 * frontmatter, command frontmatter, permission rulesets, and skill metadata.
 */

// ---------------------------------------------------------------------------
// Prompt-enhance pipeline schemas
// ---------------------------------------------------------------------------

export {
  PromptSkimResultSchema,
  PromptAnalysisFindingSchema,
  PromptAnalysisResultSchema,
  ContextBudgetRecordSchema,
  SessionPatchRecordSchema,
  EnhancedPromptOutputSchema,
  PipelineStateSchema,
} from "./prompt-enhance.schema.js"

export type {
  PromptSkimResult,
  PromptAnalysisFinding,
  PromptAnalysisResult,
  ContextBudgetRecord,
  SessionPatchRecord,
  EnhancedPromptOutput,
  PipelineState,
} from "./prompt-enhance.schema.js"

// ---------------------------------------------------------------------------
// Agent frontmatter schemas
// ---------------------------------------------------------------------------

export {
  AgentNameSchema,
  AgentModeEnum,
  AgentFrontmatterSchema,
  AgentFileSchema,
} from "./agent-frontmatter.schema.js"

export type {
  AgentName,
  AgentMode,
  AgentFrontmatter,
  AgentFile,
} from "./agent-frontmatter.schema.js"

// ---------------------------------------------------------------------------
// Command frontmatter schemas
// ---------------------------------------------------------------------------

export {
  CommandNameSchema,
  CommandFrontmatterSchema,
  CommandTemplateFeaturesSchema,
  CommandFileSchema,
} from "./command-frontmatter.schema.js"

export type {
  CommandName,
  CommandFrontmatter,
  CommandTemplateFeatures,
  CommandFile,
} from "./command-frontmatter.schema.js"

// ---------------------------------------------------------------------------
// Permission schemas
// ---------------------------------------------------------------------------

export {
  PermissionActionSchema,
  PermissionKeySchema,
  PatternEntrySchema,
  PermissionRuleSchema,
  PatternBasedPermissionSchema,
  RulesBasedPermissionSchema,
  PermissionRulesetSchema,
  AgentPermissionOverrideSchema,
} from "./permission.schema.js"

export type {
  PermissionAction,
  PermissionKey,
  PermissionRule,
  PatternBasedPermissions,
  RulesBasedPermissions,
  PermissionRuleset,
  AgentPermissionOverride,
} from "./permission.schema.js"

// ---------------------------------------------------------------------------
// Skill metadata schemas
// ---------------------------------------------------------------------------

export {
  SkillNameSchema,
  SkillFrontmatterSchema,
  SkillFileSchema,
  SkillDiscoveryLocationSchema,
} from "./skill-metadata.schema.js"

export type {
  SkillName,
  SkillFrontmatter,
  SkillFile,
  SkillDiscoveryLocation,
} from "./skill-metadata.schema.js"

// ---------------------------------------------------------------------------
// MCP server configuration schemas
// ---------------------------------------------------------------------------

export {
  MCPServerTypeSchema,
  LocalMCPServerSchema,
  RemoteMCPServerSchema,
  MCPServerConfigSchema,
  MCPServerRegistrySchema,
} from "./mcp-server.schema.js"

export type {
  MCPServerType,
  LocalMCPServer,
  RemoteMCPServer,
  MCPServerConfig,
  MCPServerRegistry,
} from "./mcp-server.schema.js"

// ---------------------------------------------------------------------------
// Tool definition schemas
// ---------------------------------------------------------------------------

export {
  ToolNameSchema,
  ToolDefinitionSchema,
  ToolFileSchema,
} from "./tool-definition.schema.js"

export type {
  ToolName,
  ToolDefinition,
  ToolFile,
} from "./tool-definition.schema.js"

// ---------------------------------------------------------------------------
// Config precedence schemas
// ---------------------------------------------------------------------------

export {
  ConfigPrecedenceLevelSchema,
  ConfigSourceSchema,
  OpenCodeConfigSchema,
} from "./config-precedence.schema.js"

export type {
  ConfigPrecedenceLevel,
  ConfigSource,
  OpenCodeConfig,
} from "./config-precedence.schema.js"
