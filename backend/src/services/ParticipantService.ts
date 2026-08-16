import { IParticipantRepository, CreateParticipantDto, UpdateParticipantDto, CreateBusyBlockDto } from '../repositories/IParticipantRepository';
import { IParticipant } from '../models/participant.model';
import { ICalendarAdapter } from '../adapters/ICalendarAdapter';
import { AppError } from '../errors/AppError';

const MAX_PARTICIPANTS = 50;

// ── Participant Service ────────────────────────────────────────────────────
// Owns all business rules for participant management.
// Receives dependencies via constructor (Dependency Injection).

export class ParticipantService {
  constructor(
    private readonly repo: IParticipantRepository,
    private readonly calendarAdapter?: ICalendarAdapter
  ) {}

  async getAll(): Promise<IParticipant[]> {
    return this.repo.findAll();
  }

  async getById(id: string): Promise<IParticipant> {
    const participant = await this.repo.findById(id);
    if (!participant) throw AppError.notFound('Participant');
    return participant;
  }

  async create(dto: CreateParticipantDto): Promise<IParticipant> {
    // Enforce participant cap
    const count = await this.repo.countAll();
    if (count >= MAX_PARTICIPANTS) {
      throw AppError.conflict(`Maximum ${MAX_PARTICIPANTS} participants allowed`);
    }

    // Validate availability window
    this.validateAvailabilityWindow(dto.availableStart, dto.availableEnd);

    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdateParticipantDto): Promise<IParticipant> {
    await this.getById(id); // throws 404 if not found

    if (dto.availableStart || dto.availableEnd) {
      const existing = await this.repo.findById(id) as IParticipant;
      this.validateAvailabilityWindow(
        dto.availableStart ?? existing.availableStart,
        dto.availableEnd  ?? existing.availableEnd
      );
    }

    const updated = await this.repo.update(id, dto);
    if (!updated) throw AppError.notFound('Participant');
    return updated;
  }

  async delete(id: string): Promise<void> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw AppError.notFound('Participant');
  }

  async addBusyBlock(participantId: string, dto: CreateBusyBlockDto): Promise<IParticipant> {
    await this.getById(participantId); // throws 404 if not found
    this.validateTimeOrder(dto.start, dto.end, 'Busy block start must be before end');

    const updated = await this.repo.addBusyBlock(participantId, dto);
    if (!updated) throw AppError.notFound('Participant');
    return updated;
  }

  async removeBusyBlock(participantId: string, blockId: string): Promise<IParticipant> {
    await this.getById(participantId);

    const updated = await this.repo.removeBusyBlock(participantId, blockId);
    if (!updated) throw AppError.notFound('Participant');
    return updated;
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  private validateAvailabilityWindow(start: string, end: string): void {
    this.validateTimeOrder(start, end, 'availableStart must be before availableEnd');
  }

  private validateTimeOrder(start: string, end: string, message: string): void {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      throw AppError.badRequest(message);
    }
  }
}
