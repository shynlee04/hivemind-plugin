'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { JSONUIProvider, Renderer, useStateStore, SetState, Spec } from '@json-render/react'
import Shell, { TabConfig } from '../components/shell'
import TabPanel from '../components/tab-panel'
import { registry, handlers } from '../lib/registry'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Summary shape returned by GET /api/contracts (list mode). */
interface ContractSummary {
  id: string
  status: string
  createdAt: string
  updatedAt: string
  tasks: { total: number; completed: number; pending: number; active: number }
  summary: string
  fileSize: number
  modifiedTime: string
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

const TABS: TabConfig[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'contracts', label: 'Contracts', icon: '📋' },
  { id: 'sessions', label: 'Sessions', icon: '📱' },
  { id: 'events', label: 'Live Events', icon: '⚡' },
  { id: 'planner', label: 'Planner', icon: '🗺️' },
  { id: 'builder', label: 'Builder', icon: '🔧' },
]

// ---------------------------------------------------------------------------
// Shared spec renderer with live state + action handlers
// ---------------------------------------------------------------------------

function SpecRenderer({ spec }: { spec: Spec | null }) {
  const { set, getSnapshot } = useStateStore()
  const setState: SetState = useCallback(
    (updater) => { const next = updater(getSnapshot()); for (const [k, v] of Object.entries(next)) set(k, v) },
    [set, getSnapshot],
  )
  const resolvedHandlers = useMemo(() => handlers(() => setState, getSnapshot), [setState, getSnapshot])
  if (!spec) return null
  return (
    <JSONUIProvider registry={registry} handlers={resolvedHandlers}>
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  )
}

// ---------------------------------------------------------------------------
// Spec builders (exported for future testing)
// ---------------------------------------------------------------------------

/** Converts flat settings key-value data into a form-like json-render spec. */
function buildSettingsSpec(settings: Record<string, unknown>): Spec {
  const fields = Object.entries(settings).flatMap(([key, value]) => {
    const label = key.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const strVal = String(value ?? '')
    const inputType = typeof value === 'boolean' ? 'switch' : 'input'
    return [
      { id: `label-${key}`, el: { type: 'Text', props: { className: 'text-sm font-medium', children: label } } },
      inputType === 'switch'
        ? { id: `field-${key}`, el: { type: 'Switch', props: { checked: value, 'data-key': key } } }
        : { id: `field-${key}`, el: { type: 'Input', props: { defaultValue: strVal, 'data-key': key } } },
    ]
  })

  const elements: Record<string, unknown> = {
    'settings-form': {
      type: 'Card', props: { className: 'p-6 max-w-2xl mx-auto' },
      children: ['title', 'sep1', ...fields.map((f) => f.id), 'sep2', 'buttons'],
    },
    title: { type: 'Heading', props: { level: 3, children: 'Settings' } },
    sep1: { type: 'Separator' },
    sep2: { type: 'Separator' },
    buttons: {
      type: 'Stack', props: { direction: 'row', gap: 2 },
      children: ['save-btn', 'reset-btn'],
    },
    'save-btn': {
      type: 'Button', props: { children: 'Save', variant: 'default' },
      on: { press: { action: 'saveSettings', params: { section: 'general', settings: { $state: '/settings' } } } },
    },
    'reset-btn': {
      type: 'Button', props: { children: 'Reset', variant: 'outline' },
      on: { press: { action: 'resetSettings', params: { section: 'general' } } },
    },
  }
  for (const f of fields) elements[f.id] = f.el

  return { root: 'settings-form', elements: elements as Spec['elements'] }
}

/** Converts contract summaries into a list-like json-render spec with status badges. */
function buildContractsSpec(contracts: ContractSummary[]): Spec {
  const statusColor: Record<string, string> = {
    active: 'bg-blue-500', completed: 'bg-green-500', failed: 'bg-red-500', cancelled: 'bg-yellow-500',
  }
  const cardIds = contracts.map((c) => `card-${c.id}`)

  const elements: Record<string, unknown> = {
    'contracts-root': {
      type: 'Stack', props: { gap: 3, className: 'p-4' },
      children: ['heading', 'refresh-btn', 'sep', ...cardIds],
    },
    heading: { type: 'Heading', props: { level: 3, children: `Contracts (${contracts.length})` } },
    'refresh-btn': {
      type: 'Button', props: { children: 'Refresh', variant: 'outline', size: 'sm' },
      on: { press: { action: 'refreshDashboard', params: {} } },
    },
    sep: { type: 'Separator' },
  }

  for (const c of contracts) {
    const dot = statusColor[c.status] ?? 'bg-gray-500'
    elements[`card-${c.id}`] = {
      type: 'Card', props: { className: 'p-4' },
      children: [
        `hdr-${c.id}`, `badge-${c.id}`, `tasks-${c.id}`, `time-${c.id}`,
        ...(c.summary ? [`desc-${c.id}`] : []),
      ],
    }
    elements[`hdr-${c.id}`] = {
      type: 'Stack', props: { direction: 'row', gap: 2, className: 'items-center' },
      children: [`dot-${c.id}`, `id-${c.id}`],
    }
    elements[`dot-${c.id}`] = { type: 'Text', props: { className: `inline-block w-2 h-2 rounded-full ${dot}` } }
    elements[`id-${c.id}`] = { type: 'Text', props: { className: 'font-mono text-sm', children: c.id } }
    elements[`badge-${c.id}`] = {
      type: 'Badge', props: { variant: 'outline', children: c.status },
    }
    elements[`tasks-${c.id}`] = {
      type: 'Text',
      props: {
        className: 'text-xs text-muted-foreground',
        children: `${c.tasks.completed}/${c.tasks.total} tasks · ${c.tasks.active} active · ${c.tasks.pending} pending`,
      },
    }
    elements[`time-${c.id}`] = {
      type: 'Text',
      props: {
        className: 'text-xs text-muted-foreground',
        children: `Updated ${new Date(c.updatedAt).toLocaleString()}`,
      },
    }
    if (c.summary) {
      elements[`desc-${c.id}`] = { type: 'Text', props: { className: 'text-sm mt-1', children: c.summary } }
    }
  }

  return { root: 'contracts-root', elements: elements as Spec['elements'] }
}

// ---------------------------------------------------------------------------
// Types — Live Events
// ---------------------------------------------------------------------------

/** Shape of a single SSE event from /api/events. */
interface LiveEvent {
  type: string
  payload: Record<string, unknown>
}

/** Build a json-render spec for a list of live events (newest-first). */
function buildEventsSpec(events: LiveEvent[], status: string, statusDot: string, statusColor: string): Spec {
  const reversed = [...events].reverse()
  const cardIds = reversed.map((_, i) => `evt-${i}`)
  const elements: Record<string, unknown> = {
    'events-root': {
      type: 'Stack', props: { gap: 3, className: 'p-4' },
      children: ['heading', 'status-row', 'sep', 'events-list'],
    },
    heading: { type: 'Heading', props: { level: 3, children: `Live Events (${events.length})` } },
    'status-row': {
      type: 'Stack', props: { direction: 'row', gap: 2, className: 'items-center' },
      children: ['status-dot', 'status-text'],
    },
    'status-dot': { type: 'Text', props: { className: `inline-block w-2 h-2 rounded-full ${statusDot}` } },
    'status-text': { type: 'Text', props: { className: `text-sm ${statusColor}`, children: status } },
    sep: { type: 'Separator' },
    'events-list': {
      type: 'Stack', props: { gap: 2, className: 'max-h-[60vh] overflow-y-auto' },
      children: cardIds.length > 0 ? cardIds : ['empty-msg'],
    },
    'empty-msg': { type: 'Text', props: { className: 'text-muted-foreground text-center py-8', children: 'Waiting for events...' } },
  }

  const badgeMap: Record<string, string> = {
    'session.created': 'default', 'session.resumed': 'secondary', 'session.closed': 'outline',
    'tool.executed': 'default', 'tool.failed': 'destructive',
    'message.sent': 'secondary', 'message.received': 'secondary',
    'task.started': 'default', 'task.completed': 'secondary', 'contract.created': 'default',
  }

  for (let idx = 0; idx < reversed.length; idx++) {
    const evt = reversed[idx]
    const agent = typeof evt.payload.agent === 'string' ? evt.payload.agent : 'unknown'
    const ts = typeof evt.payload.ts === 'string' ? new Date(evt.payload.ts).toLocaleTimeString() : ''
    elements[`evt-${idx}`] = {
      type: 'Card', props: { className: 'p-3' },
      children: [`evt-hdr-${idx}`, `evt-body-${idx}`],
    }
    elements[`evt-hdr-${idx}`] = {
      type: 'Stack', props: { direction: 'row', gap: 2, className: 'items-center' },
      children: [`evt-badge-${idx}`, `evt-agent-${idx}`, `evt-time-${idx}`],
    }
    elements[`evt-badge-${idx}`] = { type: 'Badge', props: { variant: badgeMap[evt.type] ?? 'outline', children: evt.type } }
    elements[`evt-agent-${idx}`] = { type: 'Text', props: { className: 'text-xs text-muted-foreground', children: agent } }
    elements[`evt-time-${idx}`] = { type: 'Text', props: { className: 'text-xs text-muted-foreground ml-auto', children: ts } }
    elements[`evt-body-${idx}`] = {
      type: 'Text', props: { className: 'text-xs font-mono text-muted-foreground mt-1', children: JSON.stringify(evt.payload, null, 2) },
    }
  }

  return { root: 'events-root', elements: elements as Spec['elements'] }
}

/** Live Events panel — SSE-driven scrolling event log using json-render. */
function LiveEventsPanel() {
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  useEffect(() => {
    const es = new EventSource('/api/events')
    es.onopen = () => setStatus('connected')
    es.onerror = () => setStatus('disconnected')
    es.onmessage = (e) => {
      try {
        const parsed: LiveEvent = JSON.parse(e.data)
        if (parsed.type !== 'connected') setEvents((prev) => [...prev.slice(-99), parsed])
      } catch { /* ignore */ }
    }
    return () => es.close()
  }, [])

  const sColor = status === 'connected' ? 'text-green-500' : status === 'connecting' ? 'text-yellow-500' : 'text-red-500'
  const sDot = status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
  const spec = buildEventsSpec(events, status, sDot, sColor)

  return (
    <JSONUIProvider registry={registry} handlers={handlers(() => () => ({}), () => ({}))}>
      <Renderer spec={spec} registry={registry} />
    </JSONUIProvider>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SideCarApp() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [connected, setConnected] = useState(false)

  // -- Dashboard state (Phase 1, unchanged) --
  const [dashboardSpec, setDashboardSpec] = useState<Spec | null>(null)
  const [dashLoading, setDashLoading] = useState(true)
  const [dashError, setDashError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDashboardSpec(await res.json())
      setDashError(null)
      setConnected(true)
    } catch (err) {
      setDashError(err instanceof Error ? err.message : 'Failed to load dashboard')
      setConnected(false)
    } finally {
      setDashLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
    const id = setInterval(fetchDashboard, 5000)
    return () => clearInterval(id)
  }, [fetchDashboard])

  useEffect(() => {
    const es = new EventSource('/api/events')
    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)
    es.onmessage = (e) => {
      try { const d = JSON.parse(e.data); if (d.type === 'dashboard-update') setDashboardSpec(d.spec) }
      catch { /* ignore malformed */ }
    }
    return () => es.close()
  }, [])

  // -- Settings state (Phase 2) --
  const [settingsSpec, setSettingsSpec] = useState<Spec | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Record<string, unknown> = await res.json()
      setSettingsSpec(buildSettingsSpec(data))
      setSettingsError(null)
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  // -- Contracts state (Phase 2, 3s polling) --
  const [contractsSpec, setContractsSpec] = useState<Spec | null>(null)
  const [contractsLoading, setContractsLoading] = useState(true)
  const [contractsError, setContractsError] = useState<string | null>(null)

  const fetchContracts = useCallback(async () => {
    try {
      const res = await fetch('/api/contracts')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: ContractSummary[] = await res.json()
      setContractsSpec(buildContractsSpec(data))
      setContractsError(null)
    } catch (err) {
      setContractsError(err instanceof Error ? err.message : 'Failed to load contracts')
    } finally {
      setContractsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContracts()
    const id = setInterval(fetchContracts, 3000)
    return () => clearInterval(id)
  }, [fetchContracts])

  // -- Sessions state (Phase 3) --
  const [sessionsSpec, setSessionsSpec] = useState<Spec | null>(null)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [sessionsError, setSessionsError] = useState<string | null>(null)

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSessionsSpec(await res.json())
      setSessionsError(null)
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : 'Failed to load sessions')
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    const id = setInterval(fetchSessions, 10000)
    return () => clearInterval(id)
  }, [fetchSessions])

  return (
    <JSONUIProvider registry={registry}>
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex items-center justify-between px-4 py-1 border-b border-border bg-card">
          <span className="text-xs text-muted-foreground">HiveMind Side-Car</span>
          <span className={`flex items-center gap-1 text-xs ${connected ? 'text-green-500' : 'text-red-500'}`}>
            <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <Shell tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab}>
          <TabPanel isActive={activeTab === 'dashboard'} isLoading={dashLoading} error={dashError} onRetry={fetchDashboard}>
            <SpecRenderer spec={dashboardSpec} />
          </TabPanel>
          <TabPanel isActive={activeTab === 'settings'} isLoading={settingsLoading} error={settingsError} onRetry={fetchSettings}>
            <SpecRenderer spec={settingsSpec} />
          </TabPanel>
          <TabPanel isActive={activeTab === 'contracts'} isLoading={contractsLoading} error={contractsError} onRetry={fetchContracts}>
            <SpecRenderer spec={contractsSpec} />
          </TabPanel>
          <TabPanel isActive={activeTab === 'sessions'} isLoading={sessionsLoading} error={sessionsError} onRetry={fetchSessions}>
            <SpecRenderer spec={sessionsSpec} />
          </TabPanel>
          <TabPanel isActive={activeTab === 'events'}>
            <LiveEventsPanel />
          </TabPanel>
          <TabPanel isActive={activeTab === 'planner'}>
            <p className="flex items-center justify-center h-64 text-muted-foreground">Planner — Coming in Phase 4</p>
          </TabPanel>
          <TabPanel isActive={activeTab === 'builder'}>
            <p className="flex items-center justify-center h-64 text-muted-foreground">Builder — Coming in Phase 5</p>
          </TabPanel>
        </Shell>
      </div>
    </JSONUIProvider>
  )
}
