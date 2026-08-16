// ── Custom Application Error ───────────────────────────────────────────────
// Thrown anywhere in the service/route layer. The global error middleware
// catches it and converts it to the correct HTTP response.

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode    = statusCode;
    this.details       = details;
    this.isOperational = true; // distinguishable from unexpected programmer errors
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource: string): AppError {
    return new AppError(404, `${resource} not found`);
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError(400, message, details);
  }

  static conflict(message: string): AppError {
    return new AppError(409, message);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, message);
  }
}
