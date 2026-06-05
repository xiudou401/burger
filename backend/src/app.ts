import express, { NextFunction, Request, Response } from 'express';
import mealRoutes from './routes/meal.routes';
import cartRoutes from './routes/cart.routes';
import menuVersionRoutes from './routes/menu-version.routes';
import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/order.routes';
import staffInviteRoutes from './routes/staff-invite.routes';
import stripeRoutes from './routes/stripe.routes';
import path from 'path';
import cors from 'cors';

import { AppError } from './errors/AppError';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';

const app = express();

// logger first
app.use(logger);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use('/api/stripe', express.raw({ type: 'application/json' }), stripeRoutes);

app.use(express.json());

app.use('/img', express.static(path.join(process.cwd(), 'public/img')));

// routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});
app.use('/api/auth', authRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/staff-invites', staffInviteRoutes);
app.use('/api/menu-version', menuVersionRoutes);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new AppError('Route not found', 404));
});

// global error handler
app.use(errorHandler);

export default app;
