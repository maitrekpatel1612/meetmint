import { IParticipant, IBusyBlock } from '../models/participant.model';
import { Types } from 'mongoose';

// ── DTOs ──────────────────────────────────────────────────────────────────

export interface CreateParticipantDto {
  name: string;
  timezone: string;
  availableStart: string;
  availableEnd: string;
}

export interface UpdateParticipantDto {
  name?: string;
  timezone?: string;
  availableStart?: string;
  availableEnd?: string;
}

export interface CreateBusyBlockDto {
  date: string;
  start: string;
  end: string;
  label?: string;
}

// ── Repository interface ───────────────────────────────────────────────────
// Abstracts all persistence concerns. Swap Mongoose for anything else
// without touching the Service layer.

export interface IParticipantRepository {
  findAll(): Promise<IParticipant[]>;
  findById(id: string): Promise<IParticipant | null>;
  create(dto: CreateParticipantDto): Promise<IParticipant>;
  update(id: string, dto: UpdateParticipantDto): Promise<IParticipant | null>;
  delete(id: string): Promise<boolean>;
  addBusyBlock(participantId: string, dto: CreateBusyBlockDto): Promise<IParticipant | null>;
  removeBusyBlock(participantId: string, blockId: string): Promise<IParticipant | null>;
  countAll(): Promise<number>;
}
