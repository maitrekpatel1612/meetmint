import { z } from 'zod';

// ── Shared TypeScript types & Zod schemas ─────────────────────────────────

export interface BusyBlock {
  _id: string;
  date: string;   // "YYYY-MM-DD"
  start: string;  // "HH:mm"
  end: string;    // "HH:mm"
  label?: string;
}

export interface Participant {
  _id: string;
  name: string;
  timezone: string;
  availableStart: string;
  availableEnd: string;
  busyBlocks: BusyBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface LocalTime {
  name: string;
  timezone: string;
  date: string;
  start: string;
  end: string;
  isAvailable: boolean;
}

export interface Slot {
  startUtc: string;
  endUtc: string;
  availableCount: number;
  totalCount: number;
  unavailable: string[];
  localTimes: LocalTime[];
}

export interface SlotSearchResult {
  slots: Slot[];
  noFullOverlap: boolean;
  totalCandidatesEvaluated: number;
  strategy: StrategyName;
}

export type StrategyName = 'attendance' | 'convenience' | 'fairness' | 'hybrid';

// ── Zod schemas (client-side form validation) ─────────────────────────────

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createParticipantSchema = z.object({
  name:           z.string().min(1, 'Name is required').max(100),
  timezone:       z.string().min(1, 'Timezone is required'),
  availableStart: z.string().regex(timeRegex, 'Must be HH:mm'),
  availableEnd:   z.string().regex(timeRegex, 'Must be HH:mm'),
});

export const busyBlockSchema = z.object({
  date:  z.string().regex(dateRegex, 'Must be YYYY-MM-DD'),
  start: z.string().regex(timeRegex, 'Must be HH:mm'),
  end:   z.string().regex(timeRegex, 'Must be HH:mm'),
  label: z.string().max(200).optional(),
});

export const slotSearchSchema = z.object({
  durationMinutes:    z.number().int().min(15).max(480),
  dateRangeStart:     z.string().regex(dateRegex),
  dateRangeEnd:       z.string().regex(dateRegex),
  granularityMinutes: z.union([z.literal(5), z.literal(15), z.literal(30)]),
  maxResults:         z.number().int().min(1).max(50),
  strategy:           z.enum(['attendance', 'convenience', 'fairness', 'hybrid']),
});

export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
export type BusyBlockInput         = z.infer<typeof busyBlockSchema>;
export type SlotSearchInput        = z.infer<typeof slotSearchSchema>;
