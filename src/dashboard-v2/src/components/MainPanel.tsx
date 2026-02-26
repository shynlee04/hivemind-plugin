/** @jsxImportSource @opentui/react */
import type {} from "@opentui/react/jsx-runtime";
import { t } from "../i18n.js";
import { COLORS } from "../constants.js";
import { OverviewPanel } from "../panels/OverviewPanel.js";
import { PipelinePanel } from "../panels/PipelinePanel.js";
import { SwarmPanel } from "../panels/SwarmPanel.js";
import { HierarchyPanel } from "../panels/HierarchyPanel.js";
import { IncidentsPanel } from "../panels/IncidentsPanel.js";
import { CodeIntelPanel } from "../panels/CodeIntelPanel.js";
import { GovernancePanel } from "../panels/GovernancePanel.js";
import { SettingsPanel } from "../panels/SettingsPanel.js";
import { TAB_KEYS, type AppState } from "../state.js";
import type { DashboardLanguage } from "../i18n.js";

function getTabs(lang: DashboardLanguage): string[] {
  return TAB_KEYS.map((key) => t(key as any, lang));
}

export function MainPanel({ state }: { state: AppState }) {
  if (state.error) {
    return (
      <box flexGrow={1} border borderStyle="single" borderColor={COLORS.error} padding={1}>
        <text fg={COLORS.error}><strong>ERROR: Dashboard data load failed</strong></text>
        <text fg={COLORS.text}>{state.error}</text>
      </box>
    );
  }

  if (state.loading || !state.snapshot) {
    return (
      <box flexGrow={1} border borderStyle="single" borderColor={COLORS.border} padding={1}>
        <text fg={COLORS.neonBlue}><strong>LOADING_SNAPSHOT...</strong></text>
      </box>
    );
  }

  let content;
  switch (state.activeTab) {
    case 0:
      content = <OverviewPanel snapshot={state.snapshot} serverData={state.serverData} lastAction={state.lastAction} />;
      break;
    case 1:
      content = <PipelinePanel snapshot={state.snapshot} />;
      break;
    case 2:
      content = <SwarmPanel snapshot={state.snapshot} />;
      break;
    case 3:
      content = <HierarchyPanel snapshot={state.snapshot} />;
      break;
    case 4:
      content = <IncidentsPanel snapshot={state.snapshot} />;
      break;
    case 5:
      content = <CodeIntelPanel snapshot={state.snapshot} />;
      break;
    case 6:
      content = <GovernancePanel snapshot={state.snapshot} />;
      break;
    case 7:
      content = <SettingsPanel snapshot={state.snapshot} lang={state.lang} />;
      break;
    default:
      content = <text>Unknown tab</text>;
  }

  const tabs = getTabs(state.lang);

  return (
    <box flexGrow={1} border borderStyle="single" borderColor={COLORS.border} backgroundColor={COLORS.panelBg}>
      <box border borderStyle="single" borderColor={COLORS.border} paddingX={1} paddingY={0}>
        <text fg={COLORS.neonBlue}><strong>:: {tabs[state.activeTab]?.toUpperCase() ?? "LOADING"}</strong></text>
      </box>
      {content}
    </box>
  );
}
