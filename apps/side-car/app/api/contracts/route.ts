import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'

const CONTRACTS_DIR = join(process.cwd(), '..', '..', '.hivemind', 'agent-work-contract')
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/** Infer display status from contract fields. */
function inferStatus(d: Record<string, unknown>): string {
  if (d.completedAt) return 'completed'
  if (d.failedAt) return 'failed'
  const s = d.status as string
  return ['completed', 'failed', 'cancelled'].includes(s) ? s : 'active'
}

/** Count tasks by status. */
function tallyTasks(tasks: Array<{ status?: string }>) {
  let completed = 0, pending = 0, active = 0
  for (const t of tasks) {
    if (t.status === 'complete' || t.status === 'completed') completed++
    else if (t.status === 'active') active++
    else pending++
  }
  return { total: tasks.length, completed, pending, active }
}

/** Read and parse a contract JSON file with its file stats. */
async function readContract(filePath: string) {
  const [raw, s] = await Promise.all([readFile(filePath, 'utf-8'), stat(filePath)])
  return { data: JSON.parse(raw), size: s.size, mtime: s.mtime.toISOString(), birthtime: s.birthtime.toISOString() }
}

/** GET /api/contracts — list summaries, or ?id=xxx for full contract. */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (id) {
    try {
      const { data, size, mtime } = await readContract(join(CONTRACTS_DIR, `${id}.json`))
      return NextResponse.json({ ...data, _fileSize: size, _modifiedTime: mtime }, { headers: CORS_HEADERS })
    } catch {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404, headers: CORS_HEADERS })
    }
  }

  let files: string[]
  try { files = (await readdir(CONTRACTS_DIR)).filter((f) => f.endsWith('.json')) }
  catch { return NextResponse.json([], { headers: CORS_HEADERS }) }

  const summaries = []
  for (const file of files) {
    try {
      const { data, size, mtime, birthtime } = await readContract(join(CONTRACTS_DIR, file))
      const wf = data.workflow as { tasks?: Array<{ status?: string }> } | undefined
      summaries.push({
        id: data.contractId ?? file.replace('.json', ''),
        status: inferStatus(data),
        createdAt: data.createdAt ?? birthtime,
        updatedAt: data.updatedAt ?? mtime,
        tasks: tallyTasks(wf?.tasks ?? []),
        summary: data.briefing?.summary ?? '',
        fileSize: size,
        modifiedTime: mtime,
      })
    } catch { /* skip malformed */ }
  }
  summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return NextResponse.json(summaries, { headers: CORS_HEADERS })
}

/** CORS preflight. */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
