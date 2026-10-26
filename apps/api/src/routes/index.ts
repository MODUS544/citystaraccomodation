import { Router } from 'express';
import { healthRouter } from './health.routes';
import { roomsRouter } from './rooms.routes';
import { bookingsRouter } from './bookings.routes';
import { adminRouter } from './admin.routes';

export const apiRouter = Router();

// Mount modular sub-routers
apiRouter.use('/health', healthRouter);
apiRouter.use('/rooms', roomsRouter);
apiRouter.use('/bookings', bookingsRouter);
apiRouter.use('/admin', adminRouter);
