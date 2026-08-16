import { IScoringStrategy, CandidateSlot } from './IScoringStrategy';
import { AttendanceStrategy } from './AttendanceStrategy';
import { ConvenienceStrategy } from './ConvenienceStrategy';
import { FairnessStrategy } from './FairnessStrategy';

// ── Strategy D: Hybrid ─────────────────────────────────────────────────────
// Weighted blend of Attendance + Convenience + Fairness.
// Weights are tunable. Default: 50% attendance, 30% convenience, 20% fairness.

const WEIGHTS = {
  attendance:  0.5,
  convenience: 0.3,
  fairness:    0.2,
} as const;

export class HybridStrategy implements IScoringStrategy {
  readonly label = 'hybrid';

  private attendance  = new AttendanceStrategy();
  private convenience = new ConvenienceStrategy();
  private fairness    = new FairnessStrategy();

  score(slot: CandidateSlot): number {
    return (
      this.attendance.score(slot)  * WEIGHTS.attendance  +
      this.convenience.score(slot) * WEIGHTS.convenience +
      this.fairness.score(slot)    * WEIGHTS.fairness
    );
  }
}
