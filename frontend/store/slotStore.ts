'use client';
import { create } from 'zustand';
import { Slot } from '../lib/types';

// ── Slot UI Store (Zustand) ────────────────────────────────────────────────
// Only UI state — which slot is highlighted/expanded.

interface SlotStore {
  highlightedSlotIndex: number | null;
  setHighlightedSlot: (index: number | null) => void;
}

export const useSlotStore = create<SlotStore>((set) => ({
  highlightedSlotIndex: null,
  setHighlightedSlot: (index) => set({ highlightedSlotIndex: index }),
}));
