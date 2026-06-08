import { z } from "zod"

/** Section edit operation schema for batch operations. */
const SectionEditOpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("write"), heading: z.string().min(1), body: z.string() }),
  z.object({ op: z.literal("upsert"), heading: z.string().min(1), body: z.string(), level: z.number().int().min(1).max(6).optional() }),
  z.object({ op: z.literal("append"), heading: z.string().min(1), content: z.string() }),
  z.object({ op: z.literal("insert"), afterHeading: z.string().min(1), newHeading: z.string().min(1), level: z.number().int().min(1).max(6), body: z.string() }),
  z.object({ op: z.literal("delete"), heading: z.string().min(1) }),
])

/** File operations schema for batch_files. */
const FileOpsSchema = z.object({
  path: z.string().min(1),
  ops: z.array(SectionEditOpSchema).min(1),
})

/**
 * Discriminated union input schema for all doc-intelligence actions.
 *
 * Each action variant is a separate `z.object` with `action: z.literal(...)`.
 * `z.discriminatedUnion("action", [...])` checks the discriminator first,
 * then parses only the matching variant.
 */
export const DocIntelligenceInputSchema = z.discriminatedUnion("action", [
  // ── Read (original — parity preserved) ──
  z.object({ action: z.literal("skim"), path: z.string().min(1) }),
  z.object({
    action: z.literal("skim_directory"),
    path: z.string().min(1),
    format: z.enum(["md", "json", "yaml", "xml"]).optional(),
  }),
  z.object({
    action: z.literal("read"),
    path: z.string().min(1),
    maxCharacters: z.number().int().positive().optional(),
    heading: z.string().optional(),
  }),
  z.object({
    action: z.literal("chunk"),
    path: z.string().min(1),
    maxCharacters: z.number().int().positive().optional(),
  }),
  // ── Read (extended) ──
  z.object({
    action: z.literal("read_lines"),
    path: z.string().min(1),
    startLine: z.number().int().positive(),
    endLine: z.number().int().positive().optional(),
  }),
  z.object({
    action: z.literal("read_offset"),
    path: z.string().min(1),
    offset: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
  }),
  // ── Write ──
  z.object({
    action: z.literal("create"),
    path: z.string().min(1),
    title: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()).optional(),
    initialContent: z.string().optional(),
  }),
  z.object({
    action: z.literal("write"),
    path: z.string().min(1),
    heading: z.string().min(1),
    body: z.string(),
    expectedHash: z.string().optional(),
  }),
  z.object({
    action: z.literal("upsert"),
    path: z.string().min(1),
    heading: z.string().min(1),
    body: z.string(),
    level: z.number().int().min(1).max(6).optional(),
    expectedHash: z.string().optional(),
  }),
  z.object({
    action: z.literal("append"),
    path: z.string().min(1),
    heading: z.string().min(1),
    content: z.string(),
    expectedHash: z.string().optional(),
  }),
  z.object({
    action: z.literal("insert"),
    path: z.string().min(1),
    afterHeading: z.string().min(1),
    newHeading: z.string().min(1),
    level: z.number().int().min(1).max(6),
    body: z.string(),
    expectedHash: z.string().optional(),
  }),
  z.object({
    action: z.literal("delete"),
    path: z.string().min(1),
    heading: z.string().optional(),
    mode: z.literal("file").optional(),
  }),
  // ── Batch ──
  z.object({
    action: z.literal("batch"),
    path: z.string().min(1),
    ops: z.array(SectionEditOpSchema).min(1),
  }),
  z.object({
    action: z.literal("batch_files"),
    files: z.array(FileOpsSchema).min(1),
  }),
  // ── Metadata ──
  z.object({ action: z.literal("metadata"), path: z.string().min(1) }),
  z.object({
    action: z.literal("set_metadata"),
    path: z.string().min(1),
    metadata: z.record(z.string(), z.unknown()),
  }),
  z.object({
    action: z.literal("delete_metadata"),
    path: z.string().min(1),
    field: z.string().min(1),
  }),
  // ── Hierarchy ──
  z.object({ action: z.literal("toc"), path: z.string().min(1) }),
  z.object({ action: z.literal("outline"), path: z.string().min(1) }),
  // ── Search (extended) ──
  z.object({
    action: z.literal("search"),
    path: z.string().min(1),
    query: z.string().min(1),
    maxResults: z.number().int().positive().optional(),
    regex: z.boolean().optional(),
    headingOnly: z.boolean().optional(),
  }),
  // ── Code inspect ──
  z.object({ action: z.literal("inspect"), path: z.string().min(1) }),
  // ── Cross-reference ──
  z.object({ action: z.literal("xref"), path: z.string().min(1) }),
  // ── Index ──
  z.object({ action: z.literal("index"), path: z.string().min(1) }),
  // ── Context extraction ──
  z.object({
    action: z.literal("context"),
    path: z.string().min(1),
    query: z.string().min(1),
    tokenBudget: z.number().int().positive().optional(),
  }),
])

/** Inferred input type for document intelligence tool requests. */
export type DocIntelligenceSchemaInput = z.infer<typeof DocIntelligenceInputSchema>

export { SectionEditOpSchema, FileOpsSchema }
