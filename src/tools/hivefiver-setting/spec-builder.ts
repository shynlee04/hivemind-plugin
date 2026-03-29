import type {
  HmSettingDashboardProof,
  HmSettingDashboardSpec,
  HmSettingDashboardSpecElement,
} from './types.js'

/**
 * Map a health summary string to a badge variant for the side-car renderer.
 *
 * | healthSummary | variant     |
 * |---------------|-------------|
 * | ready         | default     |
 * | degraded      | outline     |
 * | error         | destructive |
 * | (other)       | secondary   |
 */
function mapHealthVariant(status: string): string {
  switch (status) {
    case 'ready':
      return 'default'
    case 'degraded':
      return 'outline'
    case 'error':
      return 'destructive'
    default:
      return 'secondary'
  }
}

/**
 * Format a settings record into a human-readable multi-line string.
 */
function formatSettings(settings: Record<string, unknown>): string {
  return Object.entries(settings)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join('\n')
}

/**
 * Build a json-render Spec from an {@link HmSettingDashboardProof}.
 *
 * Layout:
 *   root (Stack vertical)
 *     ├─ heading (Heading h1)
 *     └─ body (Stack horizontal)
 *         ├─ leftCard  (Card — pane40 runtime/session mirror)
 *         └─ rightCard (Card — pane60 settings/guidance)
 *
 * Only uses the five registered component types: Stack, Heading, Card, Text, Badge.
 */
export function buildHmSettingDashboardSpec(
  proof: HmSettingDashboardProof,
): HmSettingDashboardSpec {
  const elements: Record<string, HmSettingDashboardSpecElement> = {}

  // ── Heading ────────────────────────────────────────────────────────────
  elements['heading'] = {
    type: 'Heading',
    props: { text: 'Hivefiver Settings Dashboard', level: 'h1' },
  }

  // ── Left card (pane40) ─────────────────────────────────────────────────
  const leftCardChildren: string[] = []

  // Session info texts
  leftCardChildren.push('left-session-id')
  elements['left-session-id'] = {
    type: 'Text',
    props: { text: `Session: ${proof.pane40.sessionId}`, variant: 'body' },
  }

  leftCardChildren.push('left-authority')
  elements['left-authority'] = {
    type: 'Text',
    props: { text: `Authority: ${proof.pane40.runtimeAuthority}`, variant: 'body' },
  }

  leftCardChildren.push('left-attachment')
  elements['left-attachment'] = {
    type: 'Text',
    props: { text: `Mode: ${proof.pane40.attachmentMode}`, variant: 'body' },
  }

  // Health badge
  leftCardChildren.push('left-health-badge')
  elements['left-health-badge'] = {
    type: 'Badge',
    props: {
      text: proof.pane40.healthSummary,
      variant: mapHealthVariant(proof.pane40.healthSummary),
    },
  }

  // Recent events
  if (proof.pane40.recentEvents.length > 0) {
    for (let i = 0; i < proof.pane40.recentEvents.length; i++) {
      const eventId = `left-event-${i}`
      leftCardChildren.push(eventId)
      elements[eventId] = {
        type: 'Text',
        props: { text: `• ${proof.pane40.recentEvents[i]}`, variant: 'caption' },
      }
    }
  } else {
    leftCardChildren.push('left-no-events')
    elements['left-no-events'] = {
      type: 'Text',
      props: { text: 'No recent events', variant: 'muted' },
    }
  }

  elements['left-card'] = {
    type: 'Card',
    props: {
      title: proof.pane40.title,
      description: `Gate: ${proof.pane40.gateSummary}`,
      maxWidth: 'md',
    },
    children: leftCardChildren,
  }

  // ── Right card (pane60) ────────────────────────────────────────────────
  const rightCardChildren: string[] = []

  // Settings text
  rightCardChildren.push('right-settings')
  elements['right-settings'] = {
    type: 'Text',
    props: { text: formatSettings(proof.pane60.currentSettings), variant: 'body' },
  }

  // Next action
  rightCardChildren.push('right-next-action')
  elements['right-next-action'] = {
    type: 'Text',
    props: { text: `Next: ${proof.pane60.nextAction}`, variant: 'lead' },
  }

  // Guidance texts
  if (proof.pane60.guidance.length > 0) {
    for (let i = 0; i < proof.pane60.guidance.length; i++) {
      const guidanceId = `right-guidance-${i}`
      rightCardChildren.push(guidanceId)
      elements[guidanceId] = {
        type: 'Text',
        props: { text: `• ${proof.pane60.guidance[i]}`, variant: 'caption' },
      }
    }
  }

  // Changed fields badge
  if (proof.pane60.changedFields.length > 0) {
    rightCardChildren.push('right-changes-badge')
    elements['right-changes-badge'] = {
      type: 'Badge',
      props: {
        text: `${proof.pane60.changedFields.length} changed`,
        variant: 'secondary',
      },
    }
  }

  elements['right-card'] = {
    type: 'Card',
    props: {
      title: proof.pane60.title,
      maxWidth: 'md',
    },
    children: rightCardChildren,
  }

  // ── Body (horizontal) ──────────────────────────────────────────────────
  elements['body'] = {
    type: 'Stack',
    props: { direction: 'horizontal', gap: 'md' },
    children: ['left-card', 'right-card'],
  }

  // ── Root (vertical) ────────────────────────────────────────────────────
  elements['root'] = {
    type: 'Stack',
    props: { direction: 'vertical', gap: 'lg' },
    children: ['heading', 'body'],
  }

  // ── State seeds ────────────────────────────────────────────────────────
  const state: Record<string, unknown> = {
    hasChanges: proof.pane60.changedFields.length > 0,
    hasGuidance: proof.pane60.guidance.length > 0,
  }

  return {
    root: 'root',
    elements,
    state,
  }
}
