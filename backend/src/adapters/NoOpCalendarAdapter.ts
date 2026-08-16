import { ICalendarAdapter, DateRange, ExternalBusyBlock } from './ICalendarAdapter';

// ── No-Op Adapter ─────────────────────────────────────────────────────────
// Placeholder used until a real calendar integration is implemented.
// Returns an empty array — the hook for Google Calendar / Outlook is in place;
// swap this for a real implementation without touching the service layer.

export class NoOpCalendarAdapter implements ICalendarAdapter {
  readonly providerName = 'None (No-Op)';

  async getBusyBlocks(
    _userId: string,
    _dateRange: DateRange
  ): Promise<ExternalBusyBlock[]> {
    return [];
  }
}
