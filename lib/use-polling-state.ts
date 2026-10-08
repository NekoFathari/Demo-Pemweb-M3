"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getState } from "@/lib/api-client";
import type { AppState } from "@/lib/types";

export function usePollingState(intervalMs: number) {
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      const next = await getState();
      if (!mounted.current) return;
      setState(next);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      if (!mounted.current) return;
      setError(err instanceof Error ? err.message : "Gagal memuat data");
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      await load();
    }

    void tick();
    const timer = setInterval(() => {
      void tick();
    }, intervalMs);

    return () => {
      cancelled = true;
      mounted.current = false;
      clearInterval(timer);
    };
  }, [intervalMs, load]);

  return { state, error, lastSync, reload: load };
}
