'use client';
import { create } from 'zustand';
import { Participant } from '../lib/types';

// ── Participant UI Store (Zustand) ─────────────────────────────────────────
// Only UI state lives here — dialog visibility, selected participant.
// Server state (fetching, caching) is handled by TanStack Query hooks.

interface ParticipantStore {
  selectedParticipant: Participant | null;
  isAddDialogOpen: boolean;
  isBusyDialogOpen: boolean;

  setSelectedParticipant: (p: Participant | null) => void;
  setAddDialogOpen: (open: boolean) => void;
  setBusyDialogOpen: (open: boolean) => void;
}

export const useParticipantStore = create<ParticipantStore>((set) => ({
  selectedParticipant: null,
  isAddDialogOpen:     false,
  isBusyDialogOpen:   false,

  setSelectedParticipant: (p) => set({ selectedParticipant: p }),
  setAddDialogOpen:       (open) => set({ isAddDialogOpen: open }),
  setBusyDialogOpen:      (open) => set({ isBusyDialogOpen: open }),
}));
