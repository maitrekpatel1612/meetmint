// ── Scoring Strategy Interface ─────────────────────────────────────────────
// Every strategy receives a candidate slot and the full participant list.
// It returns a numeric score — higher is better for ranking.

export interface CandidateSlot {
  startUtc: string;       // ISO 8601 UTC
  endUtc: string;         // ISO 8601 UTC
  availableCount: number; // how many participants can attend
  totalCount: number;
  unavailable: string[];  // names of participants who cannot attend
  localTimes: LocalTime[];
}

export interface LocalTime {
  name: string;
  timezone: string;
  date: string;           // "YYYY-MM-DD" in participant's local time
  start: string;          // "HH:mm" in participant's local time
  end: string;            // "HH:mm" in participant's local time
  isAvailable: boolean;
}

export interface IScoringStrategy {
  readonly label: string;
  score(slot: CandidateSlot): number;
}
