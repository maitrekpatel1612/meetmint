import { client } from './client';
import { SlotSearchInput, SlotSearchResult } from '../types';

export const slotApi = {
  find: (params: SlotSearchInput) => client.post<SlotSearchResult>('/slots', params),
};
