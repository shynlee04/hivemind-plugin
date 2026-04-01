import type {
  HmSettingDashboardSideCarInput,
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
function mapHealthVariant(status: string): 'default' | 'outline' | 'destructive' | 'secondary' {
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

/** Settings group tab definitions for the Tabs component */
const SETTINGS_GROUP_TABS = [
  { label: 'Identity', value: 'identity' },
  { label: 'Expertise', value: 'expertise' },
  { label: 'Governance', value: 'governance' },
]

/**
 * Build the left pane (pane40) — informational session/runtime data.
 * Uses Stack, Heading, Card, Text, Badge (original components).
 */
function buildLeftPane(
  elements: Record<string, HmSettingDashboardSpecElement>,
  proof: HmSettingDashboardSideCarInput,
): string {
  const children: string[] = []

  // Session info texts
  children.push('left-session-id')
  elements['left-session-id'] = {
    type: 'Text',
    props: { text: `Session: ${proof.pane40.sessionId}`, variant: 'body' },
  }

  children.push('left-authority')
  elements['left-authority'] = {
    type: 'Text',
    props: { text: `Authority: ${proof.pane40.runtimeAuthority}`, variant: 'body' },
  }

  children.push('left-attachment')
  elements['left-attachment'] = {
    type: 'Text',
    props: { text: `Mode: ${proof.pane40.attachmentMode}`, variant: 'body' },
  }

  // Health badge
  children.push('left-health-badge')
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
      children.push(eventId)
      elements[eventId] = {
        type: 'Text',
        props: { text: `• ${proof.pane40.recentEvents[i]}`, variant: 'caption' },
      }
    }
  } else {
    children.push('left-no-events')
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
    children,
  }

  return 'left-card'
}

/**
 * Build the right pane (pane60) — settings configuration with interactive elements.
 * Uses Select (language), Tabs (settings groups), Input (text fields), Button (actions).
 */
function buildRightPane(
  elements: Record<string, HmSettingDashboardSpecElement>,
  proof: HmSettingDashboardSideCarInput,
): string {
  const children: string[] = []
  const settings = proof.pane60.currentSettings
  const languages = proof.supportedLanguages ?? ['en']

  // ── Language selector (Select) ─────────────────────────────────────────
  children.push('right-language-select')
  elements['right-language-select'] = {
    type: 'Select',
    props: {
      label: 'Language',
      name: 'chatLanguage',
      options: languages,
      value: { $bindState: '/selectedLanguage' },
      placeholder: 'Select language',
    },
  }

  // ── Settings groups (Tabs) ─────────────────────────────────────────────
  children.push('right-settings-tabs')
  elements['right-settings-tabs'] = {
    type: 'Tabs',
    props: {
      tabs: SETTINGS_GROUP_TABS,
      defaultValue: 'identity',
      value: { $bindState: '/activeTab' },
    },
  }

  // ── Editable input fields (Input) ──────────────────────────────────────

  // Preferred user name input (identity group)
  // NOTE: $bindState value cast needed because InputProps.value is typed as
  // string | null (reserved for P4 type update). The json-render SDK handles
  // $bindState objects at runtime correctly.
  children.push('right-input-preferredUserName')
  elements['right-input-preferredUserName'] = {
    type: 'Input',
    props: {
      label: 'Display Name',
      name: 'preferredUserName',
      type: 'text',
      placeholder: 'Enter your name',
      value: { $bindState: '/inputValues/preferredUserName' } as unknown as string,
    },
  }

  // ── Settings overview text ─────────────────────────────────────────────
  children.push('right-settings')
  elements['right-settings'] = {
    type: 'Text',
    props: { text: formatSettings(settings), variant: 'body' },
  }

  // Next action
  children.push('right-next-action')
  elements['right-next-action'] = {
    type: 'Text',
    props: { text: `Next: ${proof.pane60.nextAction}`, variant: 'lead' },
  }

  // Guidance texts
  if (proof.pane60.guidance.length > 0) {
    for (let i = 0; i < proof.pane60.guidance.length; i++) {
      const guidanceId = `right-guidance-${i}`
      children.push(guidanceId)
      elements[guidanceId] = {
        type: 'Text',
        props: { text: `• ${proof.pane60.guidance[i]}`, variant: 'caption' },
      }
    }
  }

  // Changed fields badge
  if (proof.pane60.changedFields.length > 0) {
    children.push('right-changes-badge')
    elements['right-changes-badge'] = {
      type: 'Badge',
      props: {
        text: `${proof.pane60.changedFields.length} changed`,
        variant: 'secondary',
      },
    }
  }

  // ── Action buttons (Button) ────────────────────────────────────────────

  // Save button
  children.push('right-btn-save')
  elements['right-btn-save'] = {
    type: 'Button',
    props: {
      label: 'Save',
      variant: 'primary',
      disabled: null,
    },
    on: {
      press: { action: 'saveSettings', params: {} },
    },
  }

  // Reset button
  children.push('right-btn-reset')
  elements['right-btn-reset'] = {
    type: 'Button',
    props: {
      label: 'Reset',
      variant: 'secondary',
      disabled: null,
    },
    on: {
      press: { action: 'resetSettings', params: {} },
    },
  }

  elements['right-card'] = {
    type: 'Card',
    props: {
      title: proof.pane60.title,
      maxWidth: 'md',
    },
    children,
  }

  return 'right-card'
}

/**
 * Build a json-render Spec from an {@link HmSettingDashboardProof}.
 *
 * Layout:
 *   root (Stack vertical)
 *     ├─ heading (Heading h1)
 *     └─ body (Stack horizontal)
 *         ├─ leftCard  (Card — pane40 runtime/session mirror)
 *         └─ rightCard (Card — pane60 settings/guidance + interactive)
 *
 * Right pane interactive elements: Select, Tabs, Input, Button.
 * Left pane informational: Text, Badge (unchanged).
 */
export function buildHmSettingDashboardSpec(
  proof: HmSettingDashboardSideCarInput,
): HmSettingDashboardSpec {
  const elements: Record<string, HmSettingDashboardSpecElement> = {}

  // ── Heading ────────────────────────────────────────────────────────────
  elements['heading'] = {
    type: 'Heading',
    props: { text: 'Hivefiver Settings Dashboard', level: 'h1' },
  }

  // ── Panes ──────────────────────────────────────────────────────────────
  buildLeftPane(elements, proof)
  buildRightPane(elements, proof)

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
    selectedLanguage: proof.pane60.currentSettings['chatLanguage'] ?? null,
    selectedTheme: 'auto',
    activeTab: 'identity',
    inputValues: {
      preferredUserName: proof.pane60.currentSettings['preferredUserName'] ?? null,
    },
  }

  return {
    root: 'root',
    elements,
    state,
  }
}
