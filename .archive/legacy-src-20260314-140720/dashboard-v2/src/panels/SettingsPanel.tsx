/** @jsxImportSource @opentui/react */
import React from "react";
import { t } from "../i18n.js";
import type { DashboardLanguage } from "../i18n.js";
import { COLORS } from "../constants.js";

interface SettingsPanelProps {
  snapshot: any;
  lang: DashboardLanguage;
}

export function SettingsPanel(props: SettingsPanelProps): React.ReactNode {
  const { snapshot, lang } = props;
  const set = snapshot.settings;

  return (
    <box flexDirection="column" flexGrow={1} padding={1}>
      <box marginBottom={1}>
        <text fg={COLORS.neonBlue}><strong>:: SIDECAR_BOUNDARIES</strong></text>
      </box>

      {set.boundaries.map((boundary: string, i: number) => (
        <box key={i} paddingLeft={1} marginTop={1}>
          <text fg={COLORS.neonGreen}>▸</text>
          <text fg={COLORS.text}> {boundary}</text>
        </box>
      ))}

      <box marginTop={2}>
        <text fg={COLORS.neonBlue}><strong>:: {t("settings.keyboard_controls", lang)}</strong></text>
      </box>
      <box paddingLeft={1} marginTop={1} flexDirection="column">
        <text fg={COLORS.dimText}>{t("settings.next_tab", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.prev_tab", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.jump_tab", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.refresh_snapshot", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.create_session", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.send_message", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.exec_command", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.show_todos", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.list_agents", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.toggle_lang", lang)}</text>
        <text fg={COLORS.dimText}>{t("settings.quit", lang)}</text>
      </box>
    </box>
  );
}
