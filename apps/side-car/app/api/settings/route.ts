import { readFile, writeFile, unlink, readdir, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { NextRequest, NextResponse } from 'next/server'

const STATE_DIR = join(process.cwd(), '..', '..', '.hivemind')
const settingsPath = (s: string) => join(STATE_DIR, `${s}-settings.json`)
const exists = (p: string) => readFile(p).then(() => true, () => false)

const DEFAULTS: Record<string, unknown> = {
  language: 'en',
  expertise: 'intermediate',
  governance: 'guided',
  'operation-mode': 'default',
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers: CORS })

/** GET /api/settings[?section=<name>] — read one or all settings sections. */
export async function GET(request: NextRequest) {
  try {
    const section = request.nextUrl.searchParams.get('section')
    if (section) {
      const p = settingsPath(section)
      if (await exists(p)) {
        return json({ section, settings: JSON.parse(await readFile(p, 'utf-8')) })
      }
      return json({ section, settings: DEFAULTS[section] ?? null })
    }
    const result: Record<string, unknown> = {}
    const entries = await readdir(STATE_DIR).catch(() => [] as string[])
    for (const f of entries) {
      if (!f.endsWith('-settings.json')) continue
      try { result[f.replace('-settings.json', '')] = JSON.parse(await readFile(join(STATE_DIR, f), 'utf-8')) }
      catch { /* skip malformed */ }
    }
    return json(result)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Read failed' }, 500)
  }
}

/** POST /api/settings — persist `{ section, settings }`. */
export async function POST(request: NextRequest) {
  try {
    const { section, settings } = (await request.json()) as { section?: string; settings?: Record<string, unknown> }
    if (!section || !settings) return json({ error: 'Missing section or settings' }, 400)
    const p = settingsPath(section)
    await mkdir(dirname(p), { recursive: true })
    await writeFile(p, JSON.stringify(settings, null, 2))
    return json({ ok: true, section })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Write failed' }, 500)
  }
}

/** DELETE /api/settings?section=<name> — remove persisted section. */
export async function DELETE(request: NextRequest) {
  try {
    const section = request.nextUrl.searchParams.get('section')
    if (!section) return json({ error: 'Missing section param' }, 400)
    const p = settingsPath(section)
    if (await exists(p)) await unlink(p)
    return json({ ok: true, section })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Delete failed' }, 500)
  }
}

/** CORS preflight. */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}
