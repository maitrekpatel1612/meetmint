import { Schema, model, Document, Types } from 'mongoose';

// ── Sub-document interfaces ────────────────────────────────────────────────

export interface IBusyBlock {
  _id: Types.ObjectId;
  date: string;   // "YYYY-MM-DD"
  start: string;  // "HH:mm" local time
  end: string;    // "HH:mm" local time
  label?: string;
}

// ── Main document interface ────────────────────────────────────────────────

export interface IParticipant extends Document {
  _id: Types.ObjectId;
  name: string;
  timezone: string;       // IANA tz identifier e.g. "Asia/Kolkata"
  availableStart: string; // "HH:mm" local time
  availableEnd: string;   // "HH:mm" local time
  busyBlocks: IBusyBlock[];
  createdAt: Date;
  updatedAt: Date;
}

// ── Busy block sub-schema ──────────────────────────────────────────────────

const busyBlockSchema = new Schema<IBusyBlock>(
  {
    date:  { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    start: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    end:   { type: String, required: true, match: /^\d{2}:\d{2}$/ },
    label: { type: String, default: '' },
  },
  { _id: true }
);

// ── Participant schema ─────────────────────────────────────────────────────

const participantSchema = new Schema<IParticipant>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
      trim: true,
    },
    availableStart: {
      type: String,
      required: [true, 'availableStart is required'],
      match: [/^\d{2}:\d{2}$/, 'availableStart must be in HH:mm format'],
    },
    availableEnd: {
      type: String,
      required: [true, 'availableEnd is required'],
      match: [/^\d{2}:\d{2}$/, 'availableEnd must be in HH:mm format'],
    },
    busyBlocks: {
      type: [busyBlockSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: false },
    toObject: { virtuals: false },
  }
);

export const Participant = model<IParticipant>('Participant', participantSchema);
