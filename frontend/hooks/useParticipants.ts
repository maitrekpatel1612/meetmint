'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantApi } from '../lib/api/participants';
import { busyBlockApi } from '../lib/api/busyBlocks';
import { CreateParticipantInput, BusyBlockInput } from '../lib/types';
import { toast } from 'sonner';

export const PARTICIPANTS_KEY = ['participants'] as const;

// ── Fetch all participants ─────────────────────────────────────────────────
export function useParticipants() {
  return useQuery({
    queryKey: PARTICIPANTS_KEY,
    queryFn:  participantApi.getAll,
    staleTime: 30_000,
  });
}

// ── Add participant ────────────────────────────────────────────────────────
export function useAddParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateParticipantInput) => participantApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARTICIPANTS_KEY });
      toast.success('Participant added');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Remove participant ─────────────────────────────────────────────────────
export function useRemoveParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => participantApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARTICIPANTS_KEY });
      toast.success('Participant removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Add busy block ─────────────────────────────────────────────────────────
export function useAddBusyBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId, data }: { participantId: string; data: BusyBlockInput }) =>
      busyBlockApi.create(participantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARTICIPANTS_KEY });
      toast.success('Busy block added');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Remove busy block ──────────────────────────────────────────────────────
export function useRemoveBusyBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ participantId, blockId }: { participantId: string; blockId: string }) =>
      busyBlockApi.remove(participantId, blockId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PARTICIPANTS_KEY });
      toast.success('Busy block removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
