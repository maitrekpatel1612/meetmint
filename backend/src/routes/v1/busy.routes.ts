import { Router, Request, Response, NextFunction } from 'express';
import { participantService } from '../../container';
import { validate } from '../../middleware/validate';
import { busyBlockSchema } from '../../validators/participantSchema';

export const busyRouter = Router({ mergeParams: true });

// POST /api/v1/participants/:id/busy
busyRouter.post(
  '/',
  validate(busyBlockSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const participant = await participantService.addBusyBlock(req.params.id, req.body);
      res.status(201).json({ success: true, data: participant });
    } catch (err) { next(err); }
  }
);

// DELETE /api/v1/participants/:id/busy/:blockId
busyRouter.delete('/:blockId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const participant = await participantService.removeBusyBlock(
      req.params.id,
      req.params.blockId
    );
    res.json({ success: true, data: participant });
  } catch (err) { next(err); }
});
