import { z } from 'zod';
import { Scheduler } from '../solver/Scheduler';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const slotRequestSchema = z.object({
  durationMinutes: z
    .number({ required_error: 'durationMinutes is required' })
    .int()
    .min(15, 'Minimum duration is 15 minutes')
    .max(480, 'Maximum duration is 480 minutes (8 hours)'),

  dateRangeStart: z
    .string()
    .regex(dateRegex, 'dateRangeStart must be YYYY-MM-DD'),

  dateRangeEnd: z
    .string()
    .regex(dateRegex, 'dateRangeEnd must be YYYY-MM-DD'),

  granularityMinutes: z
    .number()
    .int()
    .refine(v => [5, 15, 30].includes(v), 'granularityMinutes must be 5, 15, or 30')
    .default(15),

  maxResults: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10),

  strategy: z
    .enum(['attendance', 'convenience', 'fairness', 'hybrid'])
    .default('attendance'),
})
.refine(
  data => new Date(data.dateRangeStart) <= new Date(data.dateRangeEnd),
  { message: 'dateRangeEnd must be on or after dateRangeStart', path: ['dateRangeEnd'] }
)
.refine(
  data => {
    const diff = (new Date(data.dateRangeEnd).getTime() - new Date(data.dateRangeStart).getTime()) / 86_400_000;
    return diff <= 60;
  },
  { message: 'Date range cannot exceed 60 days', path: ['dateRangeEnd'] }
);

export type SlotRequestInput = z.infer<typeof slotRequestSchema>;
