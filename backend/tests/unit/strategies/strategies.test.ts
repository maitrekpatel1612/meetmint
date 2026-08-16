import { describe, expect, it } from '@jest/globals';
import { AttendanceStrategy } from '../../../src/solver/strategies/AttendanceStrategy';
import { ConvenienceStrategy } from '../../../src/solver/strategies/ConvenienceStrategy';
import { FairnessStrategy }    from '../../../src/solver/strategies/FairnessStrategy';
import { HybridStrategy }      from '../../../src/solver/strategies/HybridStrategy';
import { Scheduler }           from '../../../src/solver/Scheduler';
import type { CandidateSlot }  from '../../../src/solver/strategies/IScoringStrategy';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeSlot(overrides: Partial<CandidateSlot> = {}): CandidateSlot {
  return {
    startUtc:       '2026-03-09T08:00:00Z',
    endUtc:         '2026-03-09T08:45:00Z',
    availableCount: 3,
    totalCount:     4,
    unavailable:    ['Sara'],
    localTimes: [
      { name: 'Maya', timezone: 'Asia/Kolkata',        date: '2026-03-09', start: '13:30', end: '14:15', isAvailable: true  },
      { name: 'Tom',  timezone: 'Europe/London',       date: '2026-03-09', start: '08:00', end: '08:45', isAvailable: true  },
      { name: 'Sara', timezone: 'America/Los_Angeles', date: '2026-03-09', start: '00:00', end: '00:45', isAvailable: false },
      { name: 'Jack', timezone: 'Australia/Sydney',    date: '2026-03-09', start: '19:00', end: '19:45', isAvailable: true  },
    ],
    ...overrides,
  };
}

// ── AttendanceStrategy ─────────────────────────────────────────────────────

describe('AttendanceStrategy', () => {
  const strategy = new AttendanceStrategy();

  it('label is "attendance"', () => expect(strategy.label).toBe('attendance'));

  it('score equals availableCount', () => {
    expect(strategy.score(makeSlot({ availableCount: 3 }))).toBe(3);
    expect(strategy.score(makeSlot({ availableCount: 4 }))).toBe(4);
  });

  it('higher attendance → higher score', () => {
    const a = makeSlot({ availableCount: 2 });
    const b = makeSlot({ availableCount: 4 });
    expect(strategy.score(b)).toBeGreaterThan(strategy.score(a));
  });
});

// ── ConvenienceStrategy ────────────────────────────────────────────────────

describe('ConvenienceStrategy', () => {
  const strategy = new ConvenienceStrategy();

  it('label is "convenience"', () => expect(strategy.label).toBe('convenience'));

  it('slot at preferred hours scores higher than midnight slot', () => {
    const preferred = makeSlot(); // Maya 13:30, Tom 08:00, Jack 19:00 — all reasonable
    const midnight  = makeSlot({
      localTimes: [
        { name: 'Maya', timezone: 'Asia/Kolkata', date: '2026-03-09', start: '02:00', end: '02:45', isAvailable: true },
        { name: 'Tom',  timezone: 'Europe/London', date: '2026-03-09', start: '02:00', end: '02:45', isAvailable: true },
        { name: 'Sara', timezone: 'America/Los_Angeles', date: '2026-03-09', start: '00:00', end: '00:45', isAvailable: false },
        { name: 'Jack', timezone: 'Australia/Sydney', date: '2026-03-09', start: '02:00', end: '02:45', isAvailable: true },
      ],
    });
    expect(strategy.score(preferred)).toBeGreaterThan(strategy.score(midnight));
  });

  it('returns a finite number', () => {
    expect(isFinite(strategy.score(makeSlot()))).toBe(true);
  });
});

// ── FairnessStrategy ───────────────────────────────────────────────────────

describe('FairnessStrategy', () => {
  const strategy = new FairnessStrategy();

  it('label is "fairness"', () => expect(strategy.label).toBe('fairness'));

  it('equal-distance slot scores higher than high-variance slot', () => {
    const fair = makeSlot({
      localTimes: [
        { name: 'Maya', timezone: 'Asia/Kolkata',        date: '2026-03-09', start: '13:00', end: '13:45', isAvailable: true },
        { name: 'Tom',  timezone: 'Europe/London',       date: '2026-03-09', start: '13:00', end: '13:45', isAvailable: true },
        { name: 'Sara', timezone: 'America/Los_Angeles', date: '2026-03-09', start: '00:00', end: '00:45', isAvailable: false },
        { name: 'Jack', timezone: 'Australia/Sydney',    date: '2026-03-09', start: '13:00', end: '13:45', isAvailable: true },
      ],
    });
    const unfair = makeSlot({
      localTimes: [
        { name: 'Maya', timezone: 'Asia/Kolkata',        date: '2026-03-09', start: '23:30', end: '00:15', isAvailable: true },
        { name: 'Tom',  timezone: 'Europe/London',       date: '2026-03-09', start: '09:00', end: '09:45', isAvailable: true },
        { name: 'Sara', timezone: 'America/Los_Angeles', date: '2026-03-09', start: '00:00', end: '00:45', isAvailable: false },
        { name: 'Jack', timezone: 'Australia/Sydney',    date: '2026-03-09', start: '02:00', end: '02:45', isAvailable: true },
      ],
    });
    expect(strategy.score(fair)).toBeGreaterThanOrEqual(strategy.score(unfair));
  });
});

// ── HybridStrategy ─────────────────────────────────────────────────────────

describe('HybridStrategy', () => {
  const strategy = new HybridStrategy();

  it('label is "hybrid"', () => expect(strategy.label).toBe('hybrid'));

  it('returns a finite number', () => {
    expect(isFinite(strategy.score(makeSlot()))).toBe(true);
  });
});

// ── Scheduler ─────────────────────────────────────────────────────────────

describe('Scheduler', () => {
  it('sorts by score DESC', () => {
    const scheduler = new Scheduler('attendance');
    const slots = [
      makeSlot({ availableCount: 1, startUtc: '2026-03-09T08:00:00Z' }),
      makeSlot({ availableCount: 3, startUtc: '2026-03-09T09:00:00Z' }),
      makeSlot({ availableCount: 2, startUtc: '2026-03-09T10:00:00Z' }),
    ];
    const ranked = scheduler.rank(slots);
    expect(ranked[0].availableCount).toBe(3);
    expect(ranked[1].availableCount).toBe(2);
    expect(ranked[2].availableCount).toBe(1);
  });

  it('tie-breaks chronologically (earlier first)', () => {
    const scheduler = new Scheduler('attendance');
    const slots = [
      makeSlot({ availableCount: 2, startUtc: '2026-03-09T10:00:00Z' }),
      makeSlot({ availableCount: 2, startUtc: '2026-03-09T08:00:00Z' }),
    ];
    const ranked = scheduler.rank(slots);
    expect(ranked[0].startUtc).toBe('2026-03-09T08:00:00Z');
  });

  it('does not mutate the original array', () => {
    const scheduler = new Scheduler('attendance');
    const slots = [
      makeSlot({ availableCount: 1 }),
      makeSlot({ availableCount: 3 }),
    ];
    const original = [...slots];
    scheduler.rank(slots);
    expect(slots[0].availableCount).toBe(original[0].availableCount);
  });

  it('throws on unknown strategy name', () => {
    expect(() => new Scheduler('unknown' as any)).toThrow();
  });

  it('getAvailableStrategies returns all 4', () => {
    const strategies = Scheduler.getAvailableStrategies();
    expect(strategies).toContain('attendance');
    expect(strategies).toContain('convenience');
    expect(strategies).toContain('fairness');
    expect(strategies).toContain('hybrid');
  });
});
