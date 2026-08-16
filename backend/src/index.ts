import 'dotenv/config';
import { createApp } from './app';
import { connectDB } from './db';
import { seedDefaultParticipants } from './seed';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

(async () => {
  await connectDB();
  await seedDefaultParticipants();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[server] MeetMint API running on http://localhost:${PORT}/api/v1`);
  });
})();
