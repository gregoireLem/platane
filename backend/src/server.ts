import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { config } from './config.js';
import { prisma } from './db.js';
import { adminRouter } from './routes/admin.js';
import { contentRouter } from './routes/content.js';
import { reservationsRouter } from './routes/reservations.js';

const app = express();
const localOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        config.FRONTEND_ORIGINS.includes(origin) ||
        localOriginPattern.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json({ limit: '6mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/reservations', reservationsRouter);
app.use('/content', contentRouter);
app.use('/admin', adminRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      details: error.flatten()
    });
  }

  console.error(error);

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR'
  });
});

const server = app.listen(config.PORT, () => {
  console.log(`Reservation backend listening on http://localhost:${config.PORT}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
