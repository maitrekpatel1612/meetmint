import { IScoringStrategy, CandidateSlot } from './strategies/IScoringStrategy';
import { AttendanceStrategy } from './strategies/AttendanceStrategy';
import { ConvenienceStrategy } from './strategies/ConvenienceStrategy';
import { FairnessStrategy } from './strategies/FairnessStrategy';
import { HybridStrategy } from './strategies/HybridStrategy';

// ── Strategy name union ────────────────────────────────────────────────────
export type StrategyName = 'attendance' | 'convenience' | 'fairness' | 'hybrid';

// ── Strategy registry ──────────────────────────────────────────────────────
const STRATEGY_MAP: Record<StrategyName, IScoringStrategy> = {
  attendance:  new AttendanceStrategy(),
  convenience: new ConvenienceStrategy(),
  fairness:    new FairnessStrategy(),
  hybrid:      new HybridStrategy(),
};

// ── Scheduler (Strategy Pattern host) ─────────────────────────────────────
// Accepts any IScoringStrategy at construction time. Adding a new ranking
// approach requires zero changes here — just a new strategy class.
//
// Usage:
//   const scheduler = new Scheduler('convenience');
//   const ranked = scheduler.rank(candidates);

export class Scheduler {
  private strategy: IScoringStrategy;

  constructor(strategyName: StrategyName = 'attendance') {
    this.strategy = STRATEGY_MAP[strategyName];
    if (!this.strategy) {
      throw new Error(`Unknown strategy: "${strategyName}"`);
    }
  }

  /**
   * Ranks candidate slots using the configured strategy.
   * Primary sort: strategy score DESC.
   * Secondary sort: chronological ASC (tie-break by start time).
   */
  rank(slots: CandidateSlot[]): CandidateSlot[] {
    return [...slots].sort((a, b) => {
      const scoreDiff = this.strategy.score(b) - this.strategy.score(a);
      if (scoreDiff !== 0) return scoreDiff;
      // tie-break: earlier slots first
      return a.startUtc.localeCompare(b.startUtc);
    });
  }

  static getAvailableStrategies(): StrategyName[] {
    return Object.keys(STRATEGY_MAP) as StrategyName[];
  }
}
