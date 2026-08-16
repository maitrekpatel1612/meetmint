import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

// ── Zod Validation Middleware ──────────────────────────────────────────────
// Wraps any Zod schema into an Express middleware.
// On failure returns 400 with field-level error messages.
// On success, sets req.body to the parsed (and coerced) output.

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      }));

      res.status(400).json({
        success: false,
        error:   'Validation failed',
        details: errors,
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
