import { IParticipantRepository } from './repositories/IParticipantRepository';
import { ParticipantRepository } from './repositories/ParticipantRepository';
import { ParticipantService } from './services/ParticipantService';
import { SlotService } from './services/SlotService';
import { NoOpCalendarAdapter } from './adapters/NoOpCalendarAdapter';

// ── Manual Dependency Injection container ─────────────────────────────────
// All dependencies are wired here. Services receive their repositories via
// constructor injection — no class creates its own dependencies.
// To swap to a different DB, only this file and the repository need to change.

const calendarAdapter = new NoOpCalendarAdapter();

const participantRepository: IParticipantRepository = new ParticipantRepository();

export const participantService = new ParticipantService(
  participantRepository,
  calendarAdapter
);

export const slotService = new SlotService(participantRepository);
