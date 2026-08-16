import { client } from './client';
import { Participant, CreateParticipantInput } from '../types';

export const participantApi = {
  getAll: ()                           => client.get<Participant[]>('/participants'),
  getById: (id: string)                => client.get<Participant>(`/participants/${id}`),
  create: (data: CreateParticipantInput) => client.post<Participant>('/participants', data),
  update: (id: string, data: Partial<CreateParticipantInput>) =>
    client.put<Participant>(`/participants/${id}`, data),
  remove: (id: string)                 => client.delete<void>(`/participants/${id}`),
};
