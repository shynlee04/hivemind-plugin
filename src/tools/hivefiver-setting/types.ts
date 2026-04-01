/**
 * Types for the hivemind_hm_setting tool.
 * Handles configuration group reads and proposed changes.
 */

export type HmSettingGroup =
  | 'language'
  | 'expertise'
  | 'governance'
  | 'operation-mode'
  | 'all'

export interface HmSettingToolArgs {
  /** Configuration group to modify */
  group: HmSettingGroup
  /** Specific key within group */
  key?: string
  /** New value (JSON string for complex values) */
  value?: string
  /** Optional locale for localized UI copy */
  locale?: string
  /** Output presentation mode */
  renderMode?: 'json' | 'tui'
  /** When true, returns the 40/60 dashboard layout with runtime mirror and settings/guidance UI */
  dashboard?: boolean
}

export interface HmSettingLanguageOptionDescriptor {
  value: string
  label: string
  nativeLabel: string
}

export interface HmSettingLanguageFieldDescriptor {
  key: 'communication_language' | 'document_language'
  label: string
  description: string
  currentValue: string | null
  options: HmSettingLanguageOptionDescriptor[]
}

export interface HmSettingLanguageSelectorDescriptor {
  locale: string
  title: string
  description: string
  fields: HmSettingLanguageFieldDescriptor[]
}

export interface HmSettingProposedChange {
  group: HmSettingGroup
  key: string
  currentValue: unknown
  value: string
}

export interface HmSettingResult {
  group: HmSettingGroup
  currentConfig: Record<string, unknown>
  proposedChange: HmSettingProposedChange | null
  authorizationRequired: boolean
  written: boolean
  localizedMessage?: string
  languageSelector?: HmSettingLanguageSelectorDescriptor
}

export interface HmSettingDashboardPane40 {
  title: string
  sessionId: string
  runtimeAuthority: string
  attachmentMode: string
  workflowId?: string
  trajectoryId?: string
  gateSummary: string
  healthSummary: string
  recentEvents: string[]
}

export interface HmSettingDashboardPane60 {
  title: string
  group: HmSettingGroup
  changedFields: string[]
  impactSummary: string[]
  nextAction: string
  guidance: string[]
  currentSettings: Record<string, unknown>
}

/**
 * Shared core fields used by both TUI renderer and side-car spec builder.
 * Contains pane layout, mode, and workflow/trajectory identifiers.
 */
export interface HmSettingDashboardCore {
  mode: 'question-gate' | 'settings'
  pane40: HmSettingDashboardPane40
  pane60: HmSettingDashboardPane60
}

/**
 * Side-car-only fields (language support, state seeds).
 * Not consumed by the TUI renderer.
 */
export interface HmSettingDashboardSideCar {
  /** Supported language codes for the language selector */
  supportedLanguages?: string[]
}

/**
 * Output-only fields (produced by rendering, not inputs).
 */
export interface HmSettingDashboardOutput {
  rendered?: string
  dashboardSpec?: HmSettingDashboardSpec
}

/** TUI render input = core only (TUI is a pure function of core) */
export type HmSettingDashboardTuiRenderInput = HmSettingDashboardCore

/** Side-car render input = core + side-car-specific */
export type HmSettingDashboardSideCarInput = HmSettingDashboardCore & HmSettingDashboardSideCar

/**
 * Full proof (intersection of all parts).
 * Kept for backward compatibility — existing code continues to work.
 */
export type HmSettingDashboardProof = HmSettingDashboardCore & HmSettingDashboardSideCar & HmSettingDashboardOutput

/** Component-specific prop interfaces for the json-render Spec */

export interface TextProps {
  text: string
  variant: 'body' | 'caption' | 'muted' | 'lead'
}

export interface BadgeProps {
  text: string
  variant: 'default' | 'outline' | 'destructive' | 'secondary'
}

export interface CardProps {
  title: string
  description?: string
  maxWidth?: string
}

export interface HeadingProps {
  text: string
  level: 'h1' | 'h2' | 'h3'
}

export interface StackProps {
  direction: 'horizontal' | 'vertical'
  gap: 'sm' | 'md' | 'lg'
}

export interface SelectProps {
  label: string
  name: string
  options: string[]
  value: string | { $bindState: string } | null
  placeholder?: string
}

export interface TabsProps {
  tabs: Array<{ label: string; value: string }>
  defaultValue: string
  value: string | { $bindState: string } | null
}

export interface InputProps {
  label: string
  name: string
  type: 'text' | 'number' | 'password'
  placeholder?: string
  value: string | null
}

export interface ButtonProps {
  label: string
  variant: 'primary' | 'secondary' | 'destructive'
  disabled: boolean | null
}

/** json-render Spec element — discriminated union of component types */
export type HmSettingDashboardSpecElement =
  | { type: 'Text'; props: TextProps; children?: string[]; visible?: boolean; on?: Record<string, string> }
  | { type: 'Badge'; props: BadgeProps; children?: string[]; visible?: boolean; on?: Record<string, string> }
  | { type: 'Card'; props: CardProps; children?: string[]; visible?: boolean; on?: Record<string, string> }
  | { type: 'Heading'; props: HeadingProps; children?: string[]; visible?: boolean; on?: Record<string, string> }
  | { type: 'Stack'; props: StackProps; children?: string[]; visible?: boolean; on?: Record<string, string> }
  | { type: 'Text'; props: TextProps; children?: string[]; visible?: boolean; on?: Record<string, unknown> }
  | { type: 'Badge'; props: BadgeProps; children?: string[]; visible?: boolean; on?: Record<string, unknown> }
  | { type: 'Card'; props: CardProps; children?: string[]; visible?: boolean; on?: Record<string, unknown> }
  | { type: 'Heading'; props: HeadingProps; children?: string[]; visible?: boolean; on?: Record<string, unknown> }
  | { type: 'Stack'; props: StackProps; children?: string[]; visible?: boolean; on?: Record<string, unknown> }
  | { type: 'Select'; props: SelectProps; children?: string[]; visible?: boolean; on?: Record<string, unknown> }
  | { type: 'Tabs'; props: TabsProps; children?: string[]; visible?: boolean; on?: Record<string, unknown> }
  | { type: 'Input'; props: InputProps; children?: string[]; visible?: boolean; on?: Record<string, unknown> }
  | { type: 'Button'; props: ButtonProps; children?: string[]; visible?: boolean; on?: Record<string, unknown> }

/** json-render Spec contract for the side-car dashboard renderer */
export interface HmSettingDashboardSpec {
  root: string
  elements: Record<string, HmSettingDashboardSpecElement>
  state?: Record<string, unknown>
}
