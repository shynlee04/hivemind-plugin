import React from "react";
import { render } from "ink";
import { App } from "./App.js";
import { DashboardLanguage } from "./types.js";

// Re-exporting loadDashboardSnapshot for completeness
export { loadDashboardSnapshot } from "./loader.js";

export interface DashboardOptions {
  language?: DashboardLanguage;
  refreshMs?: number;
}

export async function runDashboardTui(
  projectRoot: string,
  options: DashboardOptions = {}
): Promise<void> {
  const result = render(
    React.createElement(App, {
      projectRoot,
      initialLanguage: options.language ?? "en",
      refreshMs: options.refreshMs ?? 2000,
    })
  );

  await result.waitUntilExit();
}
