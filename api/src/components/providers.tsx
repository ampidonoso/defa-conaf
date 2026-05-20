"use client";

import { useState, useCallback, type ReactNode } from "react";
import { AppContext } from "@/lib/store";
import type { BalanceReport, HistoryEntry } from "@/lib/types";
import type { ParseResult } from "@/lib/parser";

export function Providers({ children }: { children: ReactNode }) {
  const [parseResult, setParseResultState] = useState<ParseResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const setParseResult = useCallback((r: ParseResult) => {
    setParseResultState(r);
  }, []);

  const addHistory = useCallback((e: HistoryEntry) => {
    setHistory((prev) => [...prev, e]);
  }, []);

  const report: BalanceReport | null = parseResult?.consolidado ?? null;

  return (
    <AppContext.Provider value={{ report, parseResult, setParseResult, history, addHistory }}>
      {children}
    </AppContext.Provider>
  );
}
