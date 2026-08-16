import { z } from 'zod';

// ── Participant schemas ────────────────────────────────────────────────────

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createParticipantSchema = z.object({
  name:           z.string().min(1).max(100).trim(),
  timezone:       z.string().min(1).max(100).trim(),
  availableStart: z.string().regex(timeRegex, 'Must be HH:mm format'),
  availableEnd:   z.string().regex(timeRegex, 'Must be HH:mm format'),
});

export const updateParticipantSchema = z.object({
  name:           z.string().min(1).max(100).trim().optional(),
  timezone:       z.string().min(1).max(100).trim().optional(),
  availableStart: z.string().regex(timeRegex, 'Must be HH:mm format').optional(),
  availableEnd:   z.string().regex(timeRegex, 'Must be HH:mm format').optional(),
}).refine(obj => Object.keys(obj).length > 0, {
  message: 'At least one field must be provided for update',
});

export const busyBlockSchema = z.object({
  date:  z.string().regex(dateRegex, 'Must be YYYY-MM-DD format'),
  start: z.string().regex(timeRegex, 'Must be HH:mm format'),
  end:   z.string().regex(timeRegex, 'Must be HH:mm format'),
  label: z.string().max(200).optional(),
});

// ── Inferred types ─────────────────────────────────────────────────────────
export type CreateParticipantInput = z.infer<typeof createParticipantSchema>;
export type UpdateParticipantInput = z.infer<typeof updateParticipantSchema>;
export type BusyBlockInput         = z.infer<typeof busyBlockSchema>;
