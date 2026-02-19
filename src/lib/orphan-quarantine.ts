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
      return { version: GRAPH_STATE_VERSION, orphans: [] }
    }
    return result.data
  } catch {
    return { version: GRAPH_STATE_VERSION, orphans: [] }
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
  orphansFile.orphans.push(record)

  const directory = dirname(orphanPath)
  await mkdir(directory, { recursive: true })
  await writeFile(orphanPath, JSON.stringify(orphansFile, null, 2))
}
