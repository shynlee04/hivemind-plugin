import React from "react";
import { loadDashboardSnapshot, loadServerData } from "../snapshot.js";
import type { AppAction } from "../state.js";

export function useDashboardData(dispatch: React.Dispatch<AppAction>) {
  const mountedRef = React.useRef(false);

  const refresh = React.useCallback(async () => {
    try {
      const snapshot = await loadDashboardSnapshot(process.cwd());
      const serverData = await loadServerData();
      if (!mountedRef.current) return;
      dispatch({ type: "SNAPSHOT", value: snapshot });
      dispatch({ type: "SERVER_DATA", value: serverData });
    } catch (error) {
      if (!mountedRef.current) return;
      dispatch({ type: "ERROR", value: error instanceof Error ? error.message : String(error) });
    }
  }, [dispatch]);

  React.useEffect(() => {
    mountedRef.current = true;
    dispatch({ type: "CONNECTED", value: true });
    void refresh();

    const poller = setInterval(() => {
      void refresh();
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(poller);
    };
  }, [dispatch, refresh]);

  return refresh;
}
