import { existsSync } from "fs"
import { mkdir, readFile, writeFile } from "fs/promises"
import { dirname } from "path"
import { z } from "zod"

const GRAPH_STATE_VERSION = "1.0.0"

export const OrphanRecordSchema = z.object({
  id: z.string(),
  type: z.enum(["task", "mem"]),
  reason: z.string(),
  original_data: z.unknown(),
  quarantined_at: z.string(),
})

export type OrphanRecord = z.infer<typeof OrphanRecordSchema>

export interface OrphansFile {
  version: string
  orphans: OrphanRecord[]
}

const OrphansFileSchema = z.object({
  version: z.string(),
  orphans: z.array(OrphanRecordSchema),
})

function createParseFailureSignal(reason: string, originalData: unknown): OrphansFile {
  return {
    version: GRAPH_STATE_VERSION,
    orphans: [
      {
        id: "orphan-parse-failure",
        type: "mem",
        reason: `parse_failure:${reason}`,
        original_data: originalData,
        quarantined_at: new Date().toISOString(),
      },
    ],
  }
}

/**
 * Load the orphans file, creating empty if it doesn't exist.
 */
export async function loadOrphansFile(orphanPath: string): Promise<OrphansFile> {
  if (!existsSync(orphanPath)) {
    return { version: GRAPH_STATE_VERSION, orphans: [] }
  }

  try {
    const raw = await readFile(orphanPath, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    const result = OrphansFileSchema.safeParse(parsed)
    if (!result.success) {
      return createParseFailureSignal("schema_validation", {
        error: result.error.message,
        orphanPath,
      })
    }
    return result.data
  } catch (error) {
    return createParseFailureSignal("json_parse", {
      error: error instanceof Error ? error.message : String(error),
      orphanPath,
    })
  }
}

/**
 * Save an orphan record to the quarantine file.
 */
export async function quarantineOrphan(
  orphanPath: string,
  record: OrphanRecord,
): Promise<void> {
  const orphansFile = await loadOrphansFile(orphanPath)
  const alreadyQuarantined = orphansFile.orphans.some(
    (existing) => existing.type === record.type && existing.id === record.id,
  )
  if (alreadyQuarantined) {
    return
  }

  orphansFile.orphans.push(record)

  const directory = dirname(orphanPath)
  await mkdir(directory, { recursive: true })
  await writeFile(orphanPath, JSON.stringify(orphansFile, null, 2))
}
