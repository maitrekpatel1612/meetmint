import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { errorMiddleware } from './errors/errorMiddleware';
import { v1Router } from './routes/v1';

export function createApp(): Application {
  const app = express();

  // ── Core middleware ────────────────────────────────────────────────────────
  app.use(cors({
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  }));
  app.use(express.json());

  // ── Health check ───────────────────────────────────────────────────────────
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Versioned API routes ───────────────────────────────────────────────────
  app.use('/api/v1', v1Router);

  // ── Global error handler (must be last) ───────────────────────────────────
  app.use(errorMiddleware);

  return app;
}
