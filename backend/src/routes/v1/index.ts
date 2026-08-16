import { Router } from 'express';
import { generalLimiter } from '../../middleware/rateLimiter';
import { participantRouter } from './participants.routes';
import { busyRouter } from './busy.routes';
import { slotRouter } from './slots.routes';

export const v1Router = Router();

// Apply general rate limiter to all v1 routes
v1Router.use(generalLimiter);

// Mount routers
v1Router.use('/participants', participantRouter);
v1Router.use('/participants/:id/busy', busyRouter);
v1Router.use('/slots', slotRouter);
