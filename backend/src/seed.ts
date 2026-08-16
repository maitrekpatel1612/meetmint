import mongoose from 'mongoose';
import { Participant } from './models/participant.model';

// ── Sample team from the brief ─────────────────────────────────────────────
const SEED_PARTICIPANTS = [
  {
    name: 'Maya',
    timezone: 'Asia/Kolkata',
    availableStart: '09:00',
    availableEnd: '18:00',
  },
  {
    name: 'Tom',
    timezone: 'Europe/London',
    availableStart: '08:00',
    availableEnd: '17:00',
  },
  {
    name: 'Sara',
    timezone: 'America/Los_Angeles',
    availableStart: '06:00',
    availableEnd: '15:00',
  },
  {
    name: 'Jack',
    timezone: 'Australia/Sydney',
    availableStart: '10:00',
    availableEnd: '19:00',
  },
];

/**
 * Seeds the default participants from the brief if the DB is empty.
 * Safe to call on every startup — only runs if no participants exist.
 */
export async function seedDefaultParticipants(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️  [seed skipped] MongoDB is not connected.');
    return;
  }

  try {
    const count = await Participant.countDocuments();
    if (count > 0) {
      console.log(`ℹ️  [seed] Database already contains ${count} participant(s) — skipping initial seed.`);
      return;
    }

    await Participant.insertMany(SEED_PARTICIPANTS);
    console.log(`🌱 [seed] Successfully seeded default participants (Maya, Tom, Sara, Jack) into MongoDB Atlas!`);
  } catch (err: any) {
    console.error(`❌ [seed error] Could not seed participants: ${err?.message || err}`);
  }
}
