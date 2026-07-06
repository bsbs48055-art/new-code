import http from 'node:http';
import type { AddressInfo } from 'node:net';

export interface LoopbackResult {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
}

const SUCCESS_HTML = `<!doctype html><html><head><meta charset="utf-8" />
<title>TikTok Multi Uploader</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0f1115;color:#f2f3f5;
display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{text-align:center;padding:40px;border-radius:16px;background:#171a21;box-shadow:0 10px 40px rgba(0,0,0,.4)}
h1{font-size:20px;margin-bottom:8px}p{color:#9aa1ac}</style></head>
<body><div class="card"><h1>✅ TikTok account connected</h1><p>You can close this tab and return to TikTok Multi Uploader.</p></div></body></html>`;

const ERROR_HTML = (message: string) => `<!doctype html><html><head><meta charset="utf-8" />
<title>TikTok Multi Uploader</title>
<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0f1115;color:#f2f3f5;
display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.card{text-align:center;padding:40px;border-radius:16px;background:#171a21;box-shadow:0 10px 40px rgba(0,0,0,.4);max-width:480px}
h1{font-size:20px;margin-bottom:8px}p{color:#9aa1ac}</style></head>
<body><div class="card"><h1>⚠️ Connection failed</h1><p>${message}</p><p>You can close this tab and try again from TikTok Multi Uploader.</p></div></body></html>`;

/**
 * Starts a short-lived HTTP server on 127.0.0.1 to receive the OAuth
 * redirect, per TikTok's documented "Login Kit for Desktop" flow
 * (https://developers.tiktok.com/doc/login-kit-desktop/), which explicitly
 * allow-lists loopback redirect URIs such as `http://127.0.0.1:<port>/callback/`
 * for native/desktop apps (unlike the web flow, which requires HTTPS).
 */
export function waitForOAuthRedirect(port: number, expectedState: string, timeoutMs = 5 * 60_000): Promise<LoopbackResult> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (!req.url || !req.url.startsWith('/callback')) {
        res.writeHead(404).end();
        return;
      }
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      const code = url.searchParams.get('code') ?? undefined;
      const state = url.searchParams.get('state') ?? undefined;
      const error = url.searchParams.get('error') ?? undefined;
      const errorDescription = url.searchParams.get('error_description') ?? undefined;

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(error || !code ? ERROR_HTML(errorDescription ?? error ?? 'No authorization code was returned.') : SUCCESS_HTML);

      cleanup();
      if (error || !code) {
        resolve({ error, errorDescription });
        return;
      }
      if (state !== expectedState) {
        resolve({ error: 'state_mismatch', errorDescription: 'The state parameter did not match. Please try connecting again.' });
        return;
      }
      resolve({ code, state });
    });

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for TikTok to redirect back. Please try again.'));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timeout);
      server.close();
    }

    server.on('error', (err) => {
      cleanup();
      reject(err);
    });

    server.listen(port, '127.0.0.1', () => {
      const address = server.address() as AddressInfo;
      void address;
    });
  });
}
