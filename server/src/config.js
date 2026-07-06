/** Loads and validates environment configuration for the helper server. */

import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 8787),
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET ?? '',
  tiktokClientSecret: process.env.TIKTOK_CLIENT_SECRET ?? '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
