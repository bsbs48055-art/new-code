# TikTok API Setup (Desktop App)

TikTok Multi Uploader ships with **no bundled TikTok credentials**. You register your own TikTok Developer app, once, and every TikTok account you connect authorizes that app directly through TikTok's real login page.

## 1. Create your TikTok Developer app

1. Go to the [TikTok for Developers portal](https://developers.tiktok.com/) and sign in with the TikTok account you want to manage apps with (this can be different from the accounts you'll post to later).
2. **Manage apps → Create an app.** Fill in the basic details (name, description, category, icon — anything reasonable).
3. Under your app's products, add:
   - **Login Kit**
   - **Content Posting API**
4. Under **Login Kit → Platform → Desktop**, configure a redirect URI. This app defaults to:

   ```
   http://127.0.0.1:53127/callback/
   ```

   You can pick a different port in **Settings → OAuth redirect port** inside the app — just make sure the redirect URI you register here matches exactly (including the trailing slash). TikTok's [Login Kit for Desktop](https://developers.tiktok.com/doc/login-kit-desktop/) guide documents `http://127.0.0.1:<port>/callback/` as a valid desktop redirect URI (this is different from TikTok's *web* Login Kit, which requires HTTPS — desktop apps are explicitly allowed to use a local loopback address).
5. Request scopes: `user.info.basic`, `video.publish`, `video.upload`.
6. Copy the **Client Key** and **Client Secret** from your app's dashboard.

## 2. Configure the app

1. Open TikTok Multi Uploader → **Settings**.
2. Paste your **Client Key** and **Client Secret**, then **Save credentials**. The secret is encrypted at rest using your OS's keychain and is only ever sent directly to TikTok's own token endpoint (`https://open.tiktokapis.com/v2/oauth/token/`) — never to any third-party server.
3. If you changed the redirect port in step 1.4 above, set the same port under **OAuth redirect port** and save.

## 3. Connect your TikTok accounts

1. Go to **Accounts → Connect TikTok account**.
2. Your system browser opens TikTok's real sign-in/consent page. Log in (or switch accounts, if you're already logged into a different one) and approve access.
3. You'll be redirected to a small local success page; you can close that browser tab and return to the app — the account now appears in **Accounts**.
4. Repeat for each additional TikTok account you want this app to be able to publish to.

## 4. The audit limitation (read this before you upload)

TikTok's Content Posting API [documents](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post) this restriction plainly:

> All content posted by unaudited clients will be restricted to private viewing mode. Once you have successfully tested your integration, to lift the restriction on content visibility, your API client must undergo an audit to verify compliance with our Terms of Service.

In practice this means:

- **Before your app is audited:** every video this app posts, to any account, will be forced to **"Only me" (SELF_ONLY)** privacy by TikTok's servers — regardless of what privacy level you pick in the Upload screen. This is enforced server-side by TikTok, not by this app. It's enough to fully test the whole pipeline (connecting accounts, uploading, confirming the post landed) end-to-end.
- **To post publicly:** submit your app for TikTok's audit from the Developer Portal once you've tested the integration. TikTok reviews apps for Terms of Service / policy compliance before lifting the restriction. There's no bundled workaround for this — it's a platform policy TikTok enforces on every third-party posting app, including this one.
- This limitation is **per developer app, not per number of accounts** — you can still connect and post privately to as many of your own TikTok accounts as you like while unaudited.

## 5. Rate limits and other platform rules to keep in mind

- Each account's access token is limited to **6 posting requests per minute** (TikTok's documented limit).
- TikTok enforces a **daily cap on the number of posts** per user and per API client; hitting it returns `spam_risk_too_many_posts` / `reached_active_user_cap` errors, which show up in this app's Activity Log.
- Max video size for direct file upload is **4 GB**; supported containers are `mp4`, `mov`, and `webm`.
- The **delay between accounts** setting (Settings → Automation behavior) adds a pause between each account's upload when posting to multiple accounts back-to-back — useful to avoid bursting a lot of API calls in a tight window.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| "Add your TikTok Client Key and Client Secret in Settings…" | You haven't saved credentials yet, or the app was restarted before saving. |
| Browser opens but TikTok shows a redirect/URI error | The redirect URI registered in the Developer Portal doesn't exactly match `http://127.0.0.1:<port>/callback/` (check the port and trailing slash). |
| "TikTok token exchange failed…" | Wrong Client Secret, or the authorization code expired (codes are single-use and short-lived — try connecting again). |
| Post always ends up private even though you picked "Public" | Your app hasn't been audited yet — see section 4 above. |
| `scope_not_authorized` | The connected account didn't grant the `video.publish` scope — remove and reconnect the account, making sure to approve all requested permissions. |
