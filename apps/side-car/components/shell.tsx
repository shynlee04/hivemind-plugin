'use client'

import React from 'react'

/** Configuration for a single tab in the shell navigation. */
export interface TabConfig {
  id: string
  label: string
  icon?: string
  loading?: boolean
  error?: string
}

/** Props for the Shell layout component. */
export interface ShellProps {
  tabs: TabConfig[]
  activeTab: string
  onTabChange: (tabId: string) => void
  children: React.ReactNode
}

/** Tab bar button with active indicator. */
function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: TabConfig
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`
        flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap
        transition-colors shrink-0 cursor-pointer
        ${isActive
          ? 'text-primary border-b-2 border-primary'
          : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'}
      `}
    >
      {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
      {tab.label}
    </button>
  )
}

/**
 * Shell provides a sticky tab bar and a content area for rendering
 * the active tab. Children own their own visibility via TabPanel.
 */
export default function Shell({ tabs, activeTab, onTabChange, children }: ShellProps) {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <nav
        role="tablist"
        aria-label="Side-car navigation"
        className="sticky top-0 z-10 flex items-center gap-0 border-b border-border bg-card px-2 overflow-x-auto"
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  )
}
