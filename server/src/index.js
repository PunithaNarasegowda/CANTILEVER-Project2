import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import { connectDatabase } from './db.js';
import tasksRouter from './routes/tasks.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'task-management-api' });
});

app.use('/api/tasks', tasksRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error.' });
});

async function start() {
  try {
    await connectDatabase();
  } catch (error) {
    console.warn('MongoDB is not connected. Falling back to in-memory task storage.');
  }

  app.listen(port, () => {
    console.log(`Task API listening on http://localhost:${port}`);
  });
}

start();