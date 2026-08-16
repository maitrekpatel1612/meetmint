'use client';
import { useMutation } from '@tanstack/react-query';
import { slotApi } from '../lib/api/slots';
import { SlotSearchInput } from '../lib/types';
import { toast } from 'sonner';

// ── Find slots mutation ────────────────────────────────────────────────────
// Slot search is a mutation (POST), not a query, because it's triggered
// explicitly by the coordinator pressing "Find Slots" — not on mount.

export function useSlots() {
  return useMutation({
    mutationFn: (params: SlotSearchInput) => slotApi.find(params),
    onError: (err: Error) => toast.error(err.message),
  });
}
