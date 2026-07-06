/**
 * TikTok OAuth token exchange/refresh. Both operations require the app's
 * confidential `client_secret`, which is why they're proxied through this
 * server instead of happening directly inside the Chrome extension.
 */

import { Router } from 'express';
import { config } from '../config.js';

export const tiktokRouter = Router();

const TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/';

function requireClientSecret(res) {
  if (!config.tiktokClientSecret) {
    res.status(500).json({ error: 'server_misconfigured', error_description: 'TIKTOK_CLIENT_SECRET is not set on the server.' });
    return false;
  }
  return true;
}

tiktokRouter.post('/token', async (req, res) => {
  if (!requireClientSecret(res)) return;
  const { code, codeVerifier, redirectUri, clientKey } = req.body ?? {};
  if (!code || !codeVerifier || !redirectUri || !clientKey) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Missing code, codeVerifier, redirectUri, or clientKey.' });
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: config.tiktokClientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  const data = await response.json();
  res.status(response.status).json(data);
});

tiktokRouter.post('/refresh', async (req, res) => {
  if (!requireClientSecret(res)) return;
  const { refreshToken, clientKey } = req.body ?? {};
  if (!refreshToken || !clientKey) {
    return res.status(400).json({ error: 'invalid_request', error_description: 'Missing refreshToken or clientKey.' });
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: config.tiktokClientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();
  res.status(response.status).json(data);
});
