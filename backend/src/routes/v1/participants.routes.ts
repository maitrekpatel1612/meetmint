import { Router, Request, Response, NextFunction } from 'express';
import { participantService } from '../../container';
import { validate } from '../../middleware/validate';
import {
  createParticipantSchema,
  updateParticipantSchema,
} from '../../validators/participantSchema';

export const participantRouter = Router();

// GET /api/v1/participants
participantRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const participants = await participantService.getAll();
    res.json({ success: true, data: participants });
  } catch (err) { next(err); }
});

// GET /api/v1/participants/:id
participantRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const participant = await participantService.getById(req.params.id as string);
    res.json({ success: true, data: participant });
  } catch (err) { next(err); }
});

// POST /api/v1/participants
participantRouter.post(
  '/',
  validate(createParticipantSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const participant = await participantService.create(req.body);
      res.status(201).json({ success: true, data: participant });
    } catch (err) { next(err); }
  }
);

// PUT /api/v1/participants/:id
participantRouter.put(
  '/:id',
  validate(updateParticipantSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const participant = await participantService.update(req.params.id as string, req.body);
      res.json({ success: true, data: participant });
    } catch (err) { next(err); }
  }
);

// DELETE /api/v1/participants/:id
participantRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await participantService.delete(req.params.id as string);
    res.json({ success: true, message: 'Participant removed' });
  } catch (err) { next(err); }
});
