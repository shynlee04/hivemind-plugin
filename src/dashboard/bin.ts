#!/usr/bin/env bun
/**
 * Dashboard Standalone Entry Point
 *
 * This file is the entry point for running the dashboard as a detached
 * Bun process. It parses command-line arguments and launches the TUI.
 *
 * Usage:
 *   bun run dist/dashboard/bin.js --projectRoot /path/to/project [options]
 *
 * Options:
 *   --projectRoot  (required) Project root directory
 *   --language     Language code (en|vi), default: en
 *   --refreshMs    Refresh interval in ms, default: 2000
 */

import React from "react";
import { render } from "ink";
import { App } from "./App.js";
import { DashboardLanguage } from "./types.js";

interface DashboardArgs {
  projectRoot: string;
  language: DashboardLanguage;
  refreshMs: number;
}

function parseArgs(): DashboardArgs {
  const args = process.argv.slice(2);
  const parsed: DashboardArgs = {
    projectRoot: process.cwd(),
    language: "en",
    refreshMs: 2000,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--projectRoot" && args[i + 1]) {
      parsed.projectRoot = args[i + 1];
      i++;
    } else if (args[i] === "--language" && args[i + 1]) {
      parsed.language = args[i + 1] as DashboardLanguage;
      i++;
    } else if (args[i] === "--refreshMs" && args[i + 1]) {
      parsed.refreshMs = parseInt(args[i + 1], 10) || 2000;
      i++;
    }
  }

  return parsed;
}

async function main(): Promise<void> {
  const args = parseArgs();

  const result = render(
    React.createElement(App, {
      projectRoot: args.projectRoot,
      initialLanguage: args.language,
      refreshMs: args.refreshMs,
    })
  );

  await result.waitUntilExit();
}

main().catch((err) => {
  console.error("Dashboard error:", err);
  process.exit(1);
});
