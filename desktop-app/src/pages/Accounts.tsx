import { useState } from 'react';
import { Plus, RefreshCw, Trash2, Users, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useAppStore } from '../state/store';

export default function Accounts() {
  const accounts = useAppStore((s) => s.accounts);
  const settings = useAppStore((s) => s.settings);
  const connectingAccount = useAppStore((s) => s.connectingAccount);
  const connectAccount = useAppStore((s) => s.connectAccount);
  const removeAccount = useAppStore((s) => s.removeAccount);
  const refreshAccountStatus = useAppStore((s) => s.refreshAccountStatus);

  const [error, setError] = useState<string | null>(null);
  const [busyAccountId, setBusyAccountId] = useState<string | null>(null);
  const configured = Boolean(settings?.tiktokClientKey && settings.hasTikTokClientSecret);

  async function handleConnect() {
    setError(null);
    const result = await connectAccount();
    if (!result.ok) setError(result.error ?? 'Could not connect this account.');
  }

  async function handleRefresh(accountId: string) {
    setBusyAccountId(accountId);
    try {
      await refreshAccountStatus(accountId);
    } finally {
      setBusyAccountId(null);
    }
  }

  async function handleRemove(accountId: string) {
    setBusyAccountId(accountId);
    try {
      await removeAccount(accountId);
    } finally {
      setBusyAccountId(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Accounts</h1>
          <p className="page-subtitle">
            Each TikTok account is added by signing in through TikTok&rsquo;s own official login page (opened in
            your browser). This app never sees or stores your password &mdash; only an encrypted access token.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleConnect} disabled={!configured || connectingAccount}>
          {connectingAccount ? <span className="spinner" /> : <Plus size={16} />}
          Connect TikTok account
        </button>
      </div>

      {!configured && (
        <div className="banner banner-warning">
          Add your TikTok Developer app credentials in Settings first &mdash; TikTok requires every app to register
          its own Client Key / Client Secret before anyone can sign in.
        </div>
      )}

      {error && <div className="banner banner-warning">{error}</div>}

      <div className="card">
        {accounts.length === 0 ? (
          <div className="empty-state">
            <Users />
            <p>No TikTok accounts connected yet.</p>
          </div>
        ) : (
          <div className="account-grid">
            {accounts.map((account) => (
              <div key={account.id} className="account-card">
                <div className="account-header">
                  <div className="avatar">
                    {account.avatarUrl ? <img src={account.avatarUrl} alt="" /> : account.displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="account-name">{account.displayName}</div>
                    <div className="account-meta">open_id: {account.openId.slice(0, 10)}&hellip;</div>
                  </div>
                </div>

                {account.isUnaudited ? (
                  <span className="badge badge-warning">
                    <AlertTriangle size={11} /> Posts stay private (app not yet audited)
                  </span>
                ) : (
                  <span className="badge badge-success">
                    <CheckCircle2 size={11} /> Full posting access
                  </span>
                )}

                <div className="account-actions">
                  <button className="btn btn-secondary" disabled={busyAccountId === account.id} onClick={() => handleRefresh(account.id)}>
                    {busyAccountId === account.id ? <span className="spinner" /> : <RefreshCw size={13} />}
                    Refresh
                  </button>
                  <button className="btn btn-danger" disabled={busyAccountId === account.id} onClick={() => handleRemove(account.id)}>
                    <Trash2 size={13} />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Why can I only add a few accounts before TikTok audits my app?</h2>
        <p className="card-subtitle">
          TikTok&rsquo;s Content Posting API requires every developer app to go through an audit before it can post
          publicly on behalf of arbitrary accounts. Until your app passes that audit, you can still connect and post
          to as many of your own TikTok accounts as you like &mdash; TikTok just forces those posts to stay in{' '}
          <strong>“Only me”</strong> privacy while the app is unaudited. See{' '}
          <span
            className="link"
            onClick={() => window.api.app.openExternal('https://developers.tiktok.com/doc/content-posting-api-reference-direct-post')}
          >
            TikTok&rsquo;s Direct Post documentation <ExternalLink size={11} style={{ display: 'inline' }} />
          </span>{' '}
          for details, and docs/API_SETUP.md in this project for how to request an audit once you&rsquo;re ready.
        </p>
      </div>
    </>
  );
}
