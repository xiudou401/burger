import express, { NextFunction, Request, Response } from 'express';
import mealRoutes from './routes/mealRoutes';
import path from 'path';
import cors from 'cors';

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));

app.use('/img', express.static(path.join(__dirname, '../public/img')));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(req.path, req.method);
  next();
});

app.use('/api/meals', mealRoutes);

export default app;
