import { Router, Request, Response, NextFunction } from 'express';
import { slotService } from '../../container';
import { validate } from '../../middleware/validate';
import { solverLimiter } from '../../middleware/rateLimiter';
import { slotRequestSchema } from '../../validators/slotSchema';

export const slotRouter = Router();

// POST /api/v1/slots
slotRouter.post(
  '/',
  solverLimiter,
  validate(slotRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await slotService.findSlots(req.body);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
);
