import { IScoringStrategy, CandidateSlot } from './IScoringStrategy';

// ── Strategy C: Fairness ───────────────────────────────────────────────────
// Score = attendance bonus - variance of local convenience across participants.
// A slot that is mildly inconvenient for everyone scores higher than one that
// is perfect for some but terrible for others.
// Lower variance = fairer distribution = higher score.

const PREFERRED_MID = 13; // 13:00 local is ideal midpoint

function distanceFromIdeal(localStart: string): number {
  const [h, m] = localStart.split(':').map(Number);
  return Math.abs(h + m / 60 - PREFERRED_MID);
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

export class FairnessStrategy implements IScoringStrategy {
  readonly label = 'fairness';

  score(slot: CandidateSlot): number {
    const attendanceBase = slot.availableCount * 10;

    const distances = slot.localTimes
      .filter(lt => lt.isAvailable)
      .map(lt => distanceFromIdeal(lt.start));

    const variancePenalty = variance(distances) * 2;

    return attendanceBase - variancePenalty;
  }
}
