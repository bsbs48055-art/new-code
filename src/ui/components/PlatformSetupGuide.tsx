import { useState } from 'react';
import { Copy, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { getExtensionId, getOAuthRedirectUri, isYouTubeClientIdConfigured } from '@shared/utils/manifestChecks';
import { useToastStore } from '@ui/state/toastStore';

function CopyField({ label, value }: { label: string; value: string }) {
  const push = useToastStore((s) => s.push);
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ marginBottom: 4 }}>{label}</label>
      <div className="flex items-center gap-2">
        <code
          style={{
            flex: 1,
            padding: '7px 10px',
            background: 'var(--color-surface-alt)',
            borderRadius: 6,
            fontSize: 12,
            overflow: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </code>
        <button
          className="btn btn-ghost btn-icon"
          title="Copy"
          onClick={() => {
            navigator.clipboard.writeText(value);
            push('Copied to clipboard.', 'success');
          }}
        >
          <Copy size={14} />
        </button>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2" style={{ marginBottom: 8, fontSize: 13 }}>
      <span
        className="flex items-center justify-center"
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-contrast)',
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {n}
      </span>
      <span>{children}</span>
    </div>
  );
}

function LinkOut({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {children} <ExternalLink size={11} />
    </a>
  );
}

type Platform = 'youtube' | 'facebook' | 'tiktok';

/** Expandable, in-app walkthrough for the one-time developer app registration each platform requires. */
export function PlatformSetupGuide({ platform }: { platform: Platform }) {
  const [open, setOpen] = useState(false);
  const extensionId = getExtensionId();
  const redirectUri = getOAuthRedirectUri();
  const youtubeConfigured = isYouTubeClientIdConfigured();

  return (
    <div style={{ marginTop: 8, marginBottom: 4 }}>
      <button
        className="btn btn-ghost"
        style={{ fontSize: 12, padding: '4px 6px' }}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {platform === 'youtube' && (youtubeConfigured ? (
          <span className="flex items-center gap-1" style={{ color: 'var(--color-success)' }}>
            <CheckCircle2 size={13} /> YouTube app configured — setup guide
          </span>
        ) : (
          <span className="flex items-center gap-1" style={{ color: 'var(--color-warning)' }}>
            <AlertCircle size={13} /> YouTube needs one-time setup — show me how
          </span>
        ))}
        {platform === 'facebook' && 'Facebook setup guide'}
        {platform === 'tiktok' && 'TikTok setup guide'}
      </button>

      {open && (
        <div className="card" style={{ padding: 14, marginTop: 6, background: 'var(--color-surface-alt)' }}>
          <CopyField label="Your extension ID (needed on Google Cloud Console)" value={extensionId} />
          <CopyField label="Your OAuth redirect URI (needed on Facebook/TikTok developer sites)" value={redirectUri} />

          {platform === 'youtube' && (
            <>
              <Step n={1}>
                Open <LinkOut href="https://console.cloud.google.com/apis/library/youtube.googleapis.com">Google Cloud Console</LinkOut> and create (or pick) a project, then enable the <strong>YouTube Data API v3</strong> and <strong>YouTube Analytics API</strong>.
              </Step>
              <Step n={2}>
                Go to <LinkOut href="https://console.cloud.google.com/apis/credentials/consent">OAuth consent screen</LinkOut>, configure it, and add these scopes: <code>youtube.upload</code>, <code>youtube.readonly</code>, <code>yt-analytics.readonly</code>.
              </Step>
              <Step n={3}>
                Go to <LinkOut href="https://console.cloud.google.com/apis/credentials">Credentials</LinkOut> → <strong>Create Credentials → OAuth client ID</strong> → Application type <strong>Chrome Extension</strong> → paste in the <strong>extension ID</strong> copied above.
              </Step>
              <Step n={4}>
                Copy the generated <strong>Client ID</strong>. This has to be placed inside the extension's <code>manifest.json</code> file and the extension rebuilt — it can't be entered on this page since it's a build-time setting, not a runtime one.
              </Step>
              <div
                className="card"
                style={{ padding: 10, marginTop: 6, fontSize: 12, background: 'var(--color-surface)' }}
              >
                <strong>Don't want to edit code yourself?</strong> Send your Google Client ID back to the assistant that
                built this extension — it can add it to <code>manifest.json</code> for you and hand you back a
                freshly rebuilt, ready-to-install zip.
              </div>
            </>
          )}

          {platform === 'facebook' && (
            <>
              <Step n={1}>
                Open <LinkOut href="https://developers.facebook.com/apps/">Facebook for Developers</LinkOut> → <strong>Create App</strong> (type: Business/Consumer).
              </Step>
              <Step n={2}>
                Add the <strong>Facebook Login</strong> product. In its settings, add the <strong>redirect URI</strong> copied above to "Valid OAuth Redirect URIs".
              </Step>
              <Step n={3}>
                Request permissions: <code>pages_show_list</code>, <code>pages_manage_posts</code>, <code>pages_read_engagement</code>, <code>publish_video</code>.
              </Step>
              <Step n={4}>
                Copy the <strong>App ID</strong> from the app's Settings → Basic page and paste it into the "Facebook App ID" field below, then click Connect.
              </Step>
              <Step n={5}>
                While your app is in "Development" mode, only you (as an admin/tester on the app) can connect — this is normal and expected until you submit it for Facebook's App Review.
              </Step>
            </>
          )}

          {platform === 'tiktok' && (
            <>
              <Step n={1}>
                Open the <LinkOut href="https://developers.tiktok.com/">TikTok Developer Portal</LinkOut> → create an app → add <strong>Login Kit</strong> and <strong>Content Posting API</strong> products.
              </Step>
              <Step n={2}>
                Add the <strong>redirect URI</strong> copied above to the app's allowed redirect URIs.
              </Step>
              <Step n={3}>
                Request scopes: <code>user.info.basic</code>, <code>video.upload</code>, <code>video.publish</code>.
              </Step>
              <Step n={4}>
                Copy the <strong>Client Key</strong> into the "TikTok Client Key" field below.
              </Step>
              <Step n={5}>
                TikTok's login also needs a <strong>Client Secret</strong>, which must run on the local helper server
                (never inside the extension) — put it in <code>server/.env</code> and run <code>npm run server</code>.
                See <code>docs/API_SETUP.md</code> for the full walkthrough.
              </Step>
              <Step n={6}>
                Until TikTok approves your app for public use, it can only publish to your own TikTok developer/sandbox
                account — this is a TikTok platform policy, not a limitation of this extension.
              </Step>
            </>
          )}
        </div>
      )}
    </div>
  );
}
