import { Types } from 'mongoose';
import { Participant, IParticipant } from '../models/participant.model';
import {
  IParticipantRepository,
  CreateParticipantDto,
  UpdateParticipantDto,
  CreateBusyBlockDto,
} from './IParticipantRepository';

// ── Mongoose implementation of IParticipantRepository ─────────────────────
// All DB calls are isolated here. The service layer only knows the interface.

export class ParticipantRepository implements IParticipantRepository {
  async findAll(): Promise<IParticipant[]> {
    return Participant.find().sort({ createdAt: 1 }).lean<IParticipant[]>();
  }

  async findById(id: string): Promise<IParticipant | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Participant.findById(id).lean<IParticipant>();
  }

  async create(dto: CreateParticipantDto): Promise<IParticipant> {
    const participant = new Participant(dto);
    return (await participant.save()).toObject() as IParticipant;
  }

  async update(id: string, dto: UpdateParticipantDto): Promise<IParticipant | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Participant.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true, runValidators: true }
    ).lean<IParticipant>();
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await Participant.findByIdAndDelete(id);
    return result !== null;
  }

  async addBusyBlock(
    participantId: string,
    dto: CreateBusyBlockDto
  ): Promise<IParticipant | null> {
    if (!Types.ObjectId.isValid(participantId)) return null;
    return Participant.findByIdAndUpdate(
      participantId,
      { $push: { busyBlocks: { ...dto, _id: new Types.ObjectId() } } },
      { new: true, runValidators: true }
    ).lean<IParticipant>();
  }

  async removeBusyBlock(
    participantId: string,
    blockId: string
  ): Promise<IParticipant | null> {
    if (!Types.ObjectId.isValid(participantId) || !Types.ObjectId.isValid(blockId)) {
      return null;
    }
    return Participant.findByIdAndUpdate(
      participantId,
      { $pull: { busyBlocks: { _id: new Types.ObjectId(blockId) } } },
      { new: true }
    ).lean<IParticipant>();
  }

  async countAll(): Promise<number> {
    return Participant.countDocuments();
  }
}
