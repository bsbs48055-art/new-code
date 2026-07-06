/**
 * Facebook long-lived token exchange. Requires the app's confidential
 * `app_secret`, so it's proxied through this server rather than being
 * called directly from the extension.
 */

import { Router } from 'express';
import { config } from '../config.js';

export const facebookRouter = Router();

facebookRouter.post('/exchange', async (req, res) => {
  if (!config.facebookAppSecret) {
    return res.status(500).json({ error: 'server_misconfigured', message: 'FACEBOOK_APP_SECRET is not set on the server.' });
  }
  const { shortLivedToken, appId } = req.body ?? {};
  if (!shortLivedToken || !appId) {
    return res.status(400).json({ error: 'invalid_request', message: 'Missing shortLivedToken or appId.' });
  }

  const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', config.facebookAppSecret);
  url.searchParams.set('fb_exchange_token', shortLivedToken);

  const response = await fetch(url.toString());
  const data = await response.json();
  res.status(response.status).json(data);
});
