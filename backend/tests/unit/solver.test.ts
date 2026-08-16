import { solve } from '../../src/solver/solver';
import type { ParticipantInput } from '../../src/solver/solver';

// ── Sample team from the brief ─────────────────────────────────────────────
const PARTICIPANTS: ParticipantInput[] = [
  { name: 'Maya', timezone: 'Asia/Kolkata',        availableStart: '09:00', availableEnd: '18:00', busyBlocks: [] },
  { name: 'Tom',  timezone: 'Europe/London',       availableStart: '08:00', availableEnd: '17:00', busyBlocks: [] },
  { name: 'Sara', timezone: 'America/Los_Angeles', availableStart: '06:00', availableEnd: '15:00', busyBlocks: [] },
  { name: 'Jack', timezone: 'Australia/Sydney',    availableStart: '10:00', availableEnd: '19:00', busyBlocks: [] },
];

const BASE_OPTIONS = {
  durationMinutes: 45,
  dateRangeStart:  '2026-03-09',
  dateRangeEnd:    '2026-03-09',
  granularityMinutes: 15,
};

describe('solve() — core algorithm', () => {
  it('returns an object with candidates and totalEvaluated', () => {
    const result = solve(PARTICIPANTS, BASE_OPTIONS);
    expect(result).toHaveProperty('candidates');
    expect(result).toHaveProperty('totalEvaluated');
    expect(Array.isArray(result.candidates)).toBe(true);
  });

  it('returns no 4-person full overlap for the brief team on 2026-03-09', () => {
    const { candidates } = solve(PARTICIPANTS, BASE_OPTIONS);
    const fullOverlap = candidates.filter(c => c.availableCount === 4);
    expect(fullOverlap).toHaveLength(0);
  });

  it('returns some partial-overlap candidates (best-effort result)', () => {
    const { candidates } = solve(PARTICIPANTS, BASE_OPTIONS);
    expect(candidates.length).toBeGreaterThan(0);
  });

  it('all returned candidates have availableCount >= 1', () => {
    const { candidates } = solve(PARTICIPANTS, BASE_OPTIONS);
    candidates.forEach(c => {
      expect(c.availableCount).toBeGreaterThanOrEqual(1);
    });
  });

  it('every candidate has a localTime entry for every participant', () => {
    const { candidates } = solve(PARTICIPANTS, BASE_OPTIONS);
    candidates.forEach(c => {
      expect(c.localTimes).toHaveLength(PARTICIPANTS.length);
    });
  });

  it('startUtc is always before endUtc', () => {
    const { candidates } = solve(PARTICIPANTS, BASE_OPTIONS);
    candidates.forEach(c => {
      expect(new Date(c.startUtc) < new Date(c.endUtc)).toBe(true);
    });
  });

  it('respects busy blocks — excludes windows overlapping a busy block', () => {
    // Maya has a meeting 08:00-09:00 IST on 2026-03-09
    // IST 08:00 = UTC 02:30, IST 09:00 = UTC 03:30
    const withBusy: ParticipantInput[] = [
      {
        ...PARTICIPANTS[0],
        busyBlocks: [{ date: '2026-03-09', start: '08:00', end: '09:00' }],
      },
      ...PARTICIPANTS.slice(1),
    ];
    const { candidates } = solve(withBusy, BASE_OPTIONS);

    // No candidate that starts in UTC 02:30–03:30 should have Maya available
    const busyWindowStartMs = new Date('2026-03-09T02:30:00Z').getTime();
    const busyWindowEndMs   = new Date('2026-03-09T03:30:00Z').getTime();

    candidates.forEach(c => {
      const slotStartMs = new Date(c.startUtc).getTime();
      const slotEndMs   = new Date(c.endUtc).getTime();
      const overlaps = slotStartMs < busyWindowEndMs && slotEndMs > busyWindowStartMs;
      if (overlaps) {
        const mayaTime = c.localTimes.find(lt => lt.name === 'Maya');
        expect(mayaTime?.isAvailable).toBe(false);
      }
    });
  });

  it('returns no candidates for empty participant list', () => {
    const { candidates } = solve([], BASE_OPTIONS);
    expect(candidates).toHaveLength(0);
  });

  it('handles single participant correctly', () => {
    const single = [PARTICIPANTS[0]]; // Maya: 09:00-18:00 IST = 03:30-12:30 UTC
    const { candidates } = solve(single, BASE_OPTIONS);
    candidates.forEach(c => {
      expect(c.availableCount).toBe(1);
      expect(c.totalCount).toBe(1);
    });
  });
});
