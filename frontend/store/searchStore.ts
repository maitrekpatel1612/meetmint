'use client';
import { create } from 'zustand';
import { SlotSearchInput, StrategyName } from '../lib/types';

// ── Search Params Store (Zustand) ─────────────────────────────────────────
// Persists the coordinator's search form state between renders.

interface SearchStore {
  searchParams: SlotSearchInput;
  setSearchParams: (params: Partial<SlotSearchInput>) => void;
  resetSearchParams: () => void;
}

const DEFAULT_PARAMS: SlotSearchInput = {
  durationMinutes:    45,
  dateRangeStart:     '2026-03-08',
  dateRangeEnd:       '2026-03-14',
  granularityMinutes: 15,
  maxResults:         10,
  strategy:           'attendance',
};

export const useSearchStore = create<SearchStore>((set) => ({
  searchParams: DEFAULT_PARAMS,

  setSearchParams: (params) =>
    set((state) => ({ searchParams: { ...state.searchParams, ...params } })),

  resetSearchParams: () => set({ searchParams: DEFAULT_PARAMS }),
}));
