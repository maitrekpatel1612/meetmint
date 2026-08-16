// ── Calendar Adapter Interface ─────────────────────────────────────────────
// Any external calendar provider (Google Calendar, Outlook, iCal) must
// implement this interface. The service layer only depends on this contract.

export interface DateRange {
  start: string; // "YYYY-MM-DD"
  end: string;   // "YYYY-MM-DD"
}

export interface ExternalBusyBlock {
  date: string;  // "YYYY-MM-DD"
  start: string; // "HH:mm" local
  end: string;   // "HH:mm" local
  label?: string;
}

export interface ICalendarAdapter {
  /**
   * Fetch busy blocks for a user from an external calendar.
   * @param userId - external identifier for the user
   * @param dateRange - range to query
   */
  getBusyBlocks(userId: string, dateRange: DateRange): Promise<ExternalBusyBlock[]>;

  /**
   * Human-readable name of this adapter, e.g. "Google Calendar"
   */
  readonly providerName: string;
}
