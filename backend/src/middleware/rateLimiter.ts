import rateLimit from 'express-rate-limit';

// ── General API rate limiter ───────────────────────────────────────────────
export const generalLimiter = rateLimit({
  windowMs:          15 * 60 * 1000, // 15 minutes
  max:               100,
  standardHeaders:   true,
  legacyHeaders:     false,
  message: {
    success: false,
    error:   'Too many requests. Please wait before trying again.',
  },
});

// ── Solver-specific limiter ────────────────────────────────────────────────
// POST /api/v1/slots is the most expensive endpoint (sweep-line over date range).
// Tighter limit prevents abuse (e.g. 60-day range + 5-min granularity per second).
export const solverLimiter = rateLimit({
  windowMs:          15 * 60 * 1000, // 15 minutes
  max:               20,
  standardHeaders:   true,
  legacyHeaders:     false,
  message: {
    success: false,
    error:   'Too many slot search requests. Please wait 15 minutes before retrying.',
  },
});
