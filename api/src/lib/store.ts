"use client";

import { createContext, useContext } from "react";
import type { BalanceReport, HistoryEntry } from "./types";
import type { ParseResult } from "./parser";

export interface AppState {
  report: BalanceReport | null;
  parseResult: ParseResult | null;
  history: HistoryEntry[];
  setParseResult: (r: ParseResult) => void;
  addHistory: (e: HistoryEntry) => void;
}

export const AppContext = createContext<AppState>({
  report: null,
  parseResult: null,
  history: [],
  setParseResult: () => {},
  addHistory: () => {},
});

export function useAppState() {
  return useContext(AppContext);
}
