import { IScoringStrategy, CandidateSlot, LocalTime } from './IScoringStrategy';

// ── Strategy B: Convenience ────────────────────────────────────────────────
// Score = attendance bonus - inconvenience penalty.
// Penalises slots that fall outside 08:00–18:00 local for available participants.
// A slot at midnight local time scores lower than one at 10:00.

const PREFERRED_START = 8;   // 08:00 local
const PREFERRED_END   = 18;  // 18:00 local

function inconveniencePenalty(localTime: LocalTime): number {
  const [h, m] = localTime.start.split(':').map(Number);
  const hour = h + m / 60;

  if (hour < PREFERRED_START) {
    // Before 08:00 — penalise proportionally to how early
    return (PREFERRED_START - hour) * 2;
  }
  if (hour >= PREFERRED_END) {
    // After 18:00 — penalise proportionally to how late
    return (hour - PREFERRED_END) * 2;
  }
  return 0; // inside preferred window, no penalty
}

export class ConvenienceStrategy implements IScoringStrategy {
  readonly label = 'convenience';

  score(slot: CandidateSlot): number {
    const attendanceBase = slot.availableCount * 10;

    const penalty = slot.localTimes
      .filter(lt => lt.isAvailable)
      .reduce((sum, lt) => sum + inconveniencePenalty(lt), 0);

    return attendanceBase - penalty;
  }
}
