/**
 * Social Media Studio Pro — optional local helper server.
 *
 * The extension works without this server for YouTube and for a
 * short-lived Facebook connection. Run this server only if you need:
 *   - TikTok publishing (its OAuth token exchange mandates a client secret)
 *   - Long-lived (60-day) Facebook Page tokens instead of ~1-2 hour ones
 *
 * Usage: copy `.env.example` to `.env`, fill in your app secrets, then:
 *   npm install && npm start
 */

import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { tiktokRouter } from './routes/tiktok.js';
import { facebookRouter } from './routes/facebook.js';

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : true,
  }),
);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    tiktokConfigured: Boolean(config.tiktokClientSecret),
    facebookConfigured: Boolean(config.facebookAppSecret),
  });
});

app.use('/oauth/tiktok', tiktokRouter);
app.use('/oauth/facebook', facebookRouter);

app.use((err, _req, res, _next) => {
  console.error('[helper-server] Unhandled error:', err);
  res.status(500).json({ error: 'internal_error', message: err.message });
});

app.listen(config.port, () => {
  console.log(`Social Media Studio Pro helper server listening on http://localhost:${config.port}`);
  if (!config.tiktokClientSecret) console.warn('  ⚠ TIKTOK_CLIENT_SECRET not set — TikTok connect will fail.');
  if (!config.facebookAppSecret) console.warn('  ⚠ FACEBOOK_APP_SECRET not set — Facebook tokens will be short-lived.');
});
