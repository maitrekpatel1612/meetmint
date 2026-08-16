import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { errorMiddleware } from './errors/errorMiddleware';
import { v1Router } from './routes/v1';

export function createApp(): Application {
  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // ── Core middleware ────────────────────────────────────────────────────────
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
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
