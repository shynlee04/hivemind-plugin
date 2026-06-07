/**
 * Schema kernel barrel — re-exports all Zod schemas and inferred types
 * for OpenCode meta-concept validation: prompt-enhance pipeline, agent
 * frontmatter, command frontmatter, permission rulesets, and skill metadata.
 */

import { z } from "zod"

// ---------------------------------------------------------------------------
// validateWithFallback — strict-first with graceful unknown-field stripping
// ---------------------------------------------------------------------------

/**
 * Validates data against a strict schema first. If validation fails ONLY
 * due to unrecognized keys, strips them via the lenient schema and returns
 * the sanitized data with a warning. Never crashes.
 */
export function validateWithFallback<T>(
  strictSchema: z.ZodSchema<T>,
  lenientSchema: z.ZodSchema<T>,
  data: unknown,
  context: string,
): { success: true; data: T; warnings: string[] } | { success: false; error: z.ZodError } {
  const strictResult = strictSchema.safeParse(data)
  if (strictResult.success) {
    return { success: true, data: strictResult.data, warnings: [] }
  }

  // Check if error is ONLY due to unrecognized keys
  const issues = strictResult.error.issues
  const hasOnlyUnrecognizedKeys = issues.every((issue) =>
    issue.message.includes("Unrecognized key") ||
    issue.code === "unrecognized_keys",
  )

  if (hasOnlyUnrecognizedKeys) {
    const lenientResult = lenientSchema.safeParse(data)
    if (lenientResult.success) {
      const strippedKeys = issues.map((issue) =>
        issue.path.join("."),
      )
      return {
        success: true,
        data: lenientResult.data,
        warnings: [`${context}: Stripped unrecognized keys: ${strippedKeys.join(", ")}`],
      }
    }
  }

  return { success: false, error: strictResult.error }
}

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

export {
  BootstrapScopeSchema,
  BootstrapConfigInputSchema,
  BootstrapInitInputSchema,
  BootstrapRecoverInputSchema,
  BootstrapRecoverCountsSchema,
  BootstrapInitResultSchema,
  BootstrapRecoverResultSchema,
} from "./bootstrap.schema.js"

export type {
  BootstrapScope,
  BootstrapConfigInput,
  BootstrapInitInput,
  BootstrapRecoverInput,
  BootstrapInitResult,
  BootstrapRecoverResult,
} from "./bootstrap.schema.js"

export {
  generateHivemindConfigsJsonSchema,
  writeConfigJsonSchema,
} from "./generate-config-json-schema.js"

export {
  DocIntelligenceActionSchema,
  DocIntelligenceInputSchema,
} from "./doc-intelligence.schema.js"

export type { DocIntelligenceSchemaInput } from "./doc-intelligence.schema.js"

export {
  TrajectoryActionSchema,
  TrajectoryToolInputSchema,
  parseTrajectoryToolInput,
} from "./trajectory.schema.js"

export type { TrajectoryToolInput } from "./trajectory.schema.js"

export {
  RuntimePressureActionSchema,
  RuntimePressureToolInputSchema,
  PressureBandSchema,
  PressureDecisionOutcomeSchema,
  parseRuntimePressureToolInput,
} from "./runtime-pressure.schema.js"

export type { RuntimePressureToolInput } from "./runtime-pressure.schema.js"
export type { PressureDecision } from "../features/runtime-pressure/types.js"

export {
  SdkSupervisorActionSchema,
  SdkSupervisorToolInputSchema,
} from "./sdk-supervisor.schema.js"

export type { SdkSupervisorToolInput } from "./sdk-supervisor.schema.js"

export {
  CommandEngineActionSchema,
  CommandEngineMessageSchema,
  CommandEngineToolInputSchema,
} from "./command-engine.schema.js"

export type { CommandEngineToolInput } from "./command-engine.schema.js"

// ---------------------------------------------------------------------------
// Agent frontmatter schemas
// ---------------------------------------------------------------------------

export {
  AGENT_FRONTMATTER_SCHEMA_VERSION,
  AgentNameSchema,
  AgentModeEnum,
  AgentFrontmatterSchema,
  AgentFrontmatterSchemaLenient,
  AgentFileSchema,
  AgentFileSchemaLenient,
} from "./agent-frontmatter.schema.js"

export type {
  AgentName,
  AgentMode,
  AgentFrontmatter,
  AgentFrontmatterLenient,
  AgentFile,
  AgentFileLenient,
} from "./agent-frontmatter.schema.js"

// ---------------------------------------------------------------------------
// Command frontmatter schemas
// ---------------------------------------------------------------------------

export {
  COMMAND_FRONTMATTER_SCHEMA_VERSION,
  CommandNameSchema,
  CommandFrontmatterSchema,
  CommandFrontmatterSchemaLenient,
  CommandTemplateFeaturesSchema,
  CommandTemplateFeaturesSchemaLenient,
  CommandFileSchema,
  CommandFileSchemaLenient,
} from "./command-frontmatter.schema.js"

export type {
  CommandName,
  CommandFrontmatter,
  CommandFrontmatterLenient,
  CommandTemplateFeatures,
  CommandTemplateFeaturesLenient,
  CommandFile,
  CommandFileLenient,
} from "./command-frontmatter.schema.js"

// ---------------------------------------------------------------------------
// Skill metadata schemas
// ---------------------------------------------------------------------------

export {
  SKILL_METADATA_SCHEMA_VERSION,
  SkillNameSchema,
  SkillFrontmatterSchema,
  SkillFrontmatterSchemaLenient,
  SkillFileSchema,
  SkillFileSchemaLenient,
  SkillDiscoveryLocationSchema,
} from "./skill-metadata.schema.js"

export type {
  SkillName,
  SkillFrontmatter,
  SkillFrontmatterLenient,
  SkillFile,
  SkillFileLenient,
  SkillDiscoveryLocation,
} from "./skill-metadata.schema.js"

// ---------------------------------------------------------------------------
// MCP server configuration schemas
// ---------------------------------------------------------------------------

export {
  MCP_SERVER_SCHEMA_VERSION,
  MCPServerTypeSchema,
  LocalMCPServerSchema,
  LocalMCPServerSchemaLenient,
  RemoteMCPServerSchema,
  RemoteMCPServerSchemaLenient,
  MCPServerConfigSchema,
  MCPServerConfigSchemaLenient,
  MCPServerRegistrySchema,
} from "./mcp-server.schema.js"

export type {
  MCPServerType,
  LocalMCPServer,
  LocalMCPServerLenient,
  RemoteMCPServer,
  RemoteMCPServerLenient,
  MCPServerConfig,
  MCPServerConfigLenient,
  MCPServerRegistry,
} from "./mcp-server.schema.js"

// ---------------------------------------------------------------------------
// Tool schemas
// ---------------------------------------------------------------------------

export {
  ToolNameSchema,
  ToolDefinitionSchema,
  ToolDefinitionSchemaLenient,
  ToolFileSchema,
  ToolFileSchemaLenient,
} from "./tool.schema.js"

export type {
  ToolName,
  ToolDefinition,
  ToolDefinitionLenient,
  ToolFile,
  ToolFileLenient,
} from "./tool.schema.js"

// ---------------------------------------------------------------------------
// Config precedence schemas
// ---------------------------------------------------------------------------

export {
  CONFIG_PRECEDENCE_SCHEMA_VERSION,
  ConfigPrecedenceLevelSchema,
  ConfigSourceSchema,
  ConfigSourceSchemaLenient,
  OpenCodeConfigSchema,
  OpenCodeConfigSchemaLenient,
} from "./config-precedence.schema.js"

export type {
  ConfigPrecedenceLevel,
  ConfigSource,
  ConfigSourceLenient,
  OpenCodeConfig,
  OpenCodeConfigLenient,
} from "./config-precedence.schema.js"

// ---------------------------------------------------------------------------
// Session-view schemas
// ---------------------------------------------------------------------------

export {
  SessionViewInputSchema,
  SessionViewDelegationFilterSchema,
} from "./session-view.schema.js"

export type {
  SessionViewInput,
  SessionViewDelegationFilter,
} from "./session-view.schema.js"

export type {
  SupportedLanguage,
  HivemindMode,
  UserExpertLevel,
  DiscussMode,
  WorkflowConfig,
  DelegationSystems,
  HivemindConfigs,
  ConfigFileValidationResult,
} from "./hivemind-configs.schema.js"
