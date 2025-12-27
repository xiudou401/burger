import express, { NextFunction, Request, Response } from 'express';
import mealRoutes from './routes/meal.routes';
import path from 'path';
import cors from 'cors';
import { AppError } from './errors/AppError';

const app = express();

// app.use(cors({ origin: 'http://localhost:3000' }));

app.use('/img', express.static(path.join(__dirname, '../public/img')));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(req.path, req.method);
  next();
});

app.use('/api/meals', mealRoutes);

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || '服务器内部错误',
  });
});

export default app;
