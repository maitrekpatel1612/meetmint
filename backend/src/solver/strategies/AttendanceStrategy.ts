import { IScoringStrategy, CandidateSlot } from './IScoringStrategy';

// ── Strategy A: Attendance ─────────────────────────────────────────────────
// Score = number of available participants.
// Maximises headcount. Default strategy.

export class AttendanceStrategy implements IScoringStrategy {
  readonly label = 'attendance';

  score(slot: CandidateSlot): number {
    return slot.availableCount;
  }
}
