import { DateTime } from 'luxon';
import { CandidateSlot, LocalTime } from './strategies/IScoringStrategy';

// ── Solver input types ─────────────────────────────────────────────────────

export interface ParticipantInput {
  name: string;
  timezone: string;       // IANA tz identifier
  availableStart: string; // "HH:mm" local
  availableEnd: string;   // "HH:mm" local
  busyBlocks: BusyBlockInput[];
}

export interface BusyBlockInput {
  date: string;  // "YYYY-MM-DD"
  start: string; // "HH:mm" local
  end: string;   // "HH:mm" local
}

export interface SolverOptions {
  durationMinutes: number;
  dateRangeStart: string;  // "YYYY-MM-DD"
  dateRangeEnd: string;    // "YYYY-MM-DD"
  granularityMinutes?: number; // default 15, used as fallback
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Convert "HH:mm" → minutes since midnight */
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Convert minutes since midnight → "HH:mm" */
function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * For a participant, compute their availability as a UTC interval for a given ISO date.
 * Returns [utcStartMins, utcEndMins] relative to midnight UTC of that date, or null
 * if the timezone conversion spans across multiple days (handled by caller).
 */
function getUtcAvailabilityInterval(
  participant: ParticipantInput,
  isoDate: string
): { startUtcMs: number; endUtcMs: number } | null {
  const tz = participant.timezone;

  const localStart = DateTime.fromISO(`${isoDate}T${participant.availableStart}`, { zone: tz });
  const localEnd   = DateTime.fromISO(`${isoDate}T${participant.availableEnd}`,   { zone: tz });

  if (!localStart.isValid || !localEnd.isValid) return null;

  return {
    startUtcMs: localStart.toUTC().toMillis(),
    endUtcMs:   localEnd.toUTC().toMillis(),
  };
}

/**
 * Check whether a busy block (in participant local time) overlaps with
 * a UTC window [windowStartMs, windowEndMs).
 */
function busyBlockOverlaps(
  block: BusyBlockInput,
  windowStartMs: number,
  windowEndMs: number,
  timezone: string
): boolean {
  const blockStart = DateTime.fromISO(`${block.date}T${block.start}`, { zone: timezone });
  const blockEnd   = DateTime.fromISO(`${block.date}T${block.end}`,   { zone: timezone });

  if (!blockStart.isValid || !blockEnd.isValid) return false;

  const bStartMs = blockStart.toUTC().toMillis();
  const bEndMs   = blockEnd.toUTC().toMillis();

  // Overlap when: blockStart < windowEnd AND blockEnd > windowStart
  return bStartMs < windowEndMs && bEndMs > windowStartMs;
}

// ── Sweep-line core ────────────────────────────────────────────────────────

/**
 * For a single UTC day, compute all UTC windows where at least 1 participant
 * is available using a sweep-line over availability interval endpoints.
 * Returns scored candidate slots.
 *
 * Algorithm:
 * 1. Build [startMs, endMs] availability intervals per participant (already in UTC).
 * 2. Create start/end events, sort by time.
 * 3. Sweep: track active participant count. When count > 0, we have an overlap region.
 * 4. Slice each overlap region into durationMinutes windows.
 * 5. For each window, check busy blocks and build LocalTime for every participant.
 */
function sweepDay(
  dayIso: string,          // "YYYY-MM-DD" in UTC
  participants: ParticipantInput[],
  durationMs: number,
  granularityMs: number
): CandidateSlot[] {
  // Step 1: Build UTC availability intervals for this day for each participant
  type ParticipantInterval = {
    participant: ParticipantInput;
    startMs: number;
    endMs: number;
  };

  const intervals: ParticipantInterval[] = [];

  for (const p of participants) {
    const utc = getUtcAvailabilityInterval(p, dayIso);
    if (!utc) continue;
    intervals.push({ participant: p, startMs: utc.startUtcMs, endMs: utc.endUtcMs });
  }

  if (intervals.length === 0) return [];

  // Step 2: Build sweep-line events
  type Event = { timeMs: number; type: 'start' | 'end'; participantIndex: number };
  const events: Event[] = [];

  intervals.forEach((interval, idx) => {
    events.push({ timeMs: interval.startMs, type: 'start', participantIndex: idx });
    events.push({ timeMs: interval.endMs,   type: 'end',   participantIndex: idx });
  });

  // Sort: by time, with 'end' before 'start' at same time (no zero-length windows)
  events.sort((a, b) => a.timeMs - b.timeMs || (a.type === 'end' ? -1 : 1));

  // Step 3: Sweep to find overlap regions where count >= 1
  type Region = { startMs: number; endMs: number };
  const regions: Region[] = [];
  const active = new Set<number>();
  let regionStart: number | null = null;

  for (const ev of events) {
    if (ev.type === 'start') {
      if (active.size === 0) regionStart = ev.timeMs;
      active.add(ev.participantIndex);
    } else {
      active.delete(ev.participantIndex);
      if (active.size === 0 && regionStart !== null) {
        regions.push({ startMs: regionStart, endMs: ev.timeMs });
        regionStart = null;
      }
    }
  }

  // Step 4 + 5: Slice regions into durationMs windows, check busy blocks, build output
  const candidates: CandidateSlot[] = [];

  for (const region of regions) {
    // Snap start to nearest granularity boundary
    let windowStart = Math.ceil(region.startMs / granularityMs) * granularityMs;

    while (windowStart + durationMs <= region.endMs) {
      const windowEnd = windowStart + durationMs;
      const startUtc  = new Date(windowStart).toISOString();
      const endUtc    = new Date(windowEnd).toISOString();

      // Build per-participant local times and check availability + busy blocks
      const localTimes: LocalTime[] = [];
      let availableCount = 0;
      const unavailable: string[] = [];

      for (const p of participants) {
        const utc = getUtcAvailabilityInterval(p, dayIso);

        // Is participant available at all during this window?
        const inAvailability =
          utc !== null &&
          utc.startUtcMs <= windowStart &&
          utc.endUtcMs >= windowEnd;

        // Does any busy block overlap the window?
        const hasBusyConflict = p.busyBlocks.some(block =>
          busyBlockOverlaps(block, windowStart, windowEnd, p.timezone)
        );

        const isAvailable = inAvailability && !hasBusyConflict;

        // Convert UTC window to participant's local time
        const localStart = DateTime.fromMillis(windowStart, { zone: p.timezone });
        const localEnd   = DateTime.fromMillis(windowEnd,   { zone: p.timezone });

        localTimes.push({
          name:        p.name,
          timezone:    p.timezone,
          date:        localStart.toFormat('yyyy-MM-dd'),
          start:       localStart.toFormat('HH:mm'),
          end:         localEnd.toFormat('HH:mm'),
          isAvailable,
        });

        if (isAvailable) {
          availableCount++;
        } else {
          unavailable.push(p.name);
        }
      }

      // Only emit slots where at least 1 participant is available
      if (availableCount > 0) {
        candidates.push({
          startUtc,
          endUtc,
          availableCount,
          totalCount: participants.length,
          unavailable,
          localTimes,
        });
      }

      windowStart += granularityMs;
    }
  }

  return candidates;
}

// ── Public solver entry point ──────────────────────────────────────────────

/**
 * Pure function — no side effects, no DB calls. Fully unit-testable.
 *
 * Returns all candidate slots across the date range where at least 1
 * participant is available, with per-participant local times.
 * Caller (SlotService + Scheduler) handles scoring and limiting results.
 */
export function solve(
  participants: ParticipantInput[],
  options: SolverOptions
): { candidates: CandidateSlot[]; totalEvaluated: number } {
  const { durationMinutes, dateRangeStart, dateRangeEnd, granularityMinutes = 15 } = options;

  const durationMs    = durationMinutes * 60 * 1000;
  const granularityMs = granularityMinutes * 60 * 1000;

  // Iterate over each UTC day in the range
  let current = DateTime.fromISO(dateRangeStart, { zone: 'utc' });
  const end   = DateTime.fromISO(dateRangeEnd,   { zone: 'utc' });

  const allCandidates: CandidateSlot[] = [];
  let totalEvaluated = 0;

  while (current <= end) {
    const dayIso = current.toFormat('yyyy-MM-dd');
    const dayCandidates = sweepDay(dayIso, participants, durationMs, granularityMs);
    totalEvaluated += dayCandidates.length;
    allCandidates.push(...dayCandidates);
    current = current.plus({ days: 1 });
  }

  return { candidates: allCandidates, totalEvaluated };
}
