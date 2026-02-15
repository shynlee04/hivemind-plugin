import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { DashboardSnapshot, DashboardLanguage } from "./types.js";
import { getDashboardStrings } from "./i18n.js";
import { loadDashboardSnapshot } from "./loader.js";
import { SwarmOrchestratorView } from "./views/SwarmOrchestratorView.js";
import { COLORS } from "./design-tokens.js";

interface AppProps {
  projectRoot: string;
  initialLanguage: DashboardLanguage;
  refreshMs: number;
}

export function App({ projectRoot, initialLanguage, refreshMs }: AppProps) {
  const { exit } = useApp();
  const [language, setLanguage] = useState<DashboardLanguage>(initialLanguage);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  const strings = useMemo(() => getDashboardStrings(language), [language]);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      try {
        const next = await loadDashboardSnapshot(projectRoot);
        if (!mounted) return;
        setSnapshot(next);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        setError(String(err));
      }
    };

    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, refreshMs);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [projectRoot, refreshMs]);

  useInput((input, key) => {
    if (input === "q" || key.escape || (key.ctrl && input === "c")) {
      exit();
      return;
    }

    if (input === "l") {
      setLanguage((prev) => (prev === "en" ? "vi" : "en"));
      return;
    }

    if (input === "r") {
      void loadDashboardSnapshot(projectRoot)
        .then((next) => {
          setSnapshot(next);
          setError(null);
        })
        .catch((err) => {
          setError(String(err));
        });
    }
  });

  if (error) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text color={COLORS.error} bold>Dashboard error</Text>
        <Text>{error}</Text>
        <Text color={COLORS.dim}>{strings.controls}</Text>
      </Box>
    );
  }

  if (!snapshot) {
    return (
      <Box flexDirection="column" paddingX={1}>
        <Text bold color={COLORS.primary}>{strings.title}</Text>
        <Text>Loading...</Text>
      </Box>
    );
  }

  return <SwarmOrchestratorView snapshot={snapshot} strings={strings} />;
}
