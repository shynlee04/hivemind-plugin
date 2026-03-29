import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextResponse } from 'next/server'

const SPEC_PATH = join(process.cwd(), '..', '..', '.hivemind', 'activity', 'state', 'dashboard-spec.json')

const FALLBACK_SPEC = {
  root: 'root',
  elements: {
    root: {
      type: 'Alert',
      props: {
        title: 'No Dashboard Data',
        message: 'Run /hmsettings --dashboard to generate the dashboard spec.',
        type: 'info',
      },
    },
  },
}

/**
 * GET /api/dashboard
 *
 * Reads the dashboard spec from .hivemind/activity/state/dashboard-spec.json.
 * Returns a fallback Alert spec when the file does not exist.
 */
export async function GET() {
  try {
    const raw = await readFile(SPEC_PATH, 'utf-8')
    const spec = JSON.parse(raw)
    return NextResponse.json(spec)
  } catch {
    return NextResponse.json(FALLBACK_SPEC)
  }
}
