import { IParticipantRepository } from '../repositories/IParticipantRepository';
import { solve, ParticipantInput } from '../solver/solver';
import { Scheduler, StrategyName } from '../solver/Scheduler';
import { AppError } from '../errors/AppError';
import { CandidateSlot } from '../solver/strategies/IScoringStrategy';

// ── Slot search options (validated upstream by Zod) ───────────────────────
export interface SlotSearchOptions {
  durationMinutes: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  granularityMinutes: number;
  maxResults: number;
  strategy: StrategyName;
}

export interface SlotSearchResult {
  slots: CandidateSlot[];
  noFullOverlap: boolean;
  totalCandidatesEvaluated: number;
  strategy: StrategyName;
}

const MAX_DAYS = 60;

// ── Slot Service ───────────────────────────────────────────────────────────
// Orchestrates: fetch participants → run solver → apply strategy → return results.
// Keeps route handlers thin; all orchestration logic lives here.

export class SlotService {
  constructor(private readonly repo: IParticipantRepository) {}

  async findSlots(options: SlotSearchOptions): Promise<SlotSearchResult> {
    const { durationMinutes, dateRangeStart, dateRangeEnd, granularityMinutes, maxResults, strategy } = options;

    // Guard: date range
    const startDate = new Date(dateRangeStart);
    const endDate   = new Date(dateRangeEnd);
    const daysDiff  = Math.ceil((endDate.getTime() - startDate.getTime()) / 86_400_000);

    if (daysDiff < 0) {
      throw AppError.badRequest('dateRangeEnd must be on or after dateRangeStart');
    }
    if (daysDiff > MAX_DAYS) {
      throw AppError.badRequest(`Date range cannot exceed ${MAX_DAYS} days`);
    }

    // Fetch all participants from DB
    const participants = await this.repo.findAll();

    if (participants.length === 0) {
      throw AppError.badRequest('No participants found. Add participants before searching for slots.');
    }

    // Map Mongoose documents to plain solver input
    const solverParticipants: ParticipantInput[] = participants.map(p => ({
      name:           p.name,
      timezone:       p.timezone,
      availableStart: p.availableStart,
      availableEnd:   p.availableEnd,
      busyBlocks:     p.busyBlocks.map(b => ({
        date:  b.date,
        start: b.start,
        end:   b.end,
      })),
    }));

    // Run the solver (pure function — no DB calls)
    const { candidates, totalEvaluated } = solve(solverParticipants, {
      durationMinutes,
      dateRangeStart,
      dateRangeEnd,
      granularityMinutes,
    });

    // Rank using selected strategy
    const scheduler = new Scheduler(strategy);
    const ranked    = scheduler.rank(candidates);

    // Determine if any slot has full attendance
    const totalParticipants = participants.length;
    const noFullOverlap = !ranked.some(s => s.availableCount === totalParticipants);

    return {
      slots:                    ranked.slice(0, maxResults),
      noFullOverlap,
      totalCandidatesEvaluated: totalEvaluated,
      strategy,
    };
  }
}
