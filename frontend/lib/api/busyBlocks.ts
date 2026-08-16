import { client } from './client';
import { Participant, BusyBlockInput } from '../types';

export const busyBlockApi = {
  create: (participantId: string, data: BusyBlockInput) =>
    client.post<Participant>(`/participants/${participantId}/busy`, data),
  remove: (participantId: string, blockId: string) =>
    client.delete<Participant>(`/participants/${participantId}/busy/${blockId}`),
};
