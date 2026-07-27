import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { apiRouter } from './routes/api.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/', (_req, res) => {
  res.json({
    name: 'Content Hunter AI Pro API',
    version: '1.0.0',
    docs: 'See /api/health and project docs/',
  });
});

app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Content Hunter AI Pro API listening on http://localhost:${config.port}`);
});
