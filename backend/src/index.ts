import 'dotenv/config';
import { createApp } from './app';
import { connectDB } from './db';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

(async () => {
  await connectDB();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[server] MeetMint API running on http://localhost:${PORT}/api/v1`);
  });
})();
