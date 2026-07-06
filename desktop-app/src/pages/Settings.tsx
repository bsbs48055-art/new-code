import { useEffect, useState } from 'react';
import { ExternalLink, Save } from 'lucide-react';
import { useAppStore } from '../state/store';

export default function Settings() {
  const settings = useAppStore((s) => s.settings);
  const saveClientCredentials = useAppStore((s) => s.saveClientCredentials);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [clientKey, setClientKey] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(20);
  const [redirectPort, setRedirectPort] = useState(53127);
  const [saved, setSaved] = useState(false);
  const [version, setVersion] = useState('');

  useEffect(() => {
    if (settings) {
      setClientKey(settings.tiktokClientKey);
      setDelaySeconds(settings.delayBetweenAccountsSeconds);
      setRedirectPort(settings.oauthRedirectPort);
    }
  }, [settings]);

  useEffect(() => {
    void window.api.app.getVersion().then(setVersion);
  }, []);

  async function handleSaveCredentials() {
    await saveClientCredentials(clientKey.trim(), clientSecret.trim());
    setClientSecret('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function handleSaveBehavior() {
    await updateSettings({ delayBetweenAccountsSeconds: delaySeconds, oauthRedirectPort: redirectPort });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your own TikTok Developer app and how the uploader behaves.</p>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">TikTok Developer App</h2>
        <p className="card-subtitle">
          This app ships with no bundled TikTok credentials &mdash; register your own app at{' '}
          <span className="link" onClick={() => window.api.app.openExternal('https://developers.tiktok.com/')}>
            developers.tiktok.com <ExternalLink size={11} style={{ display: 'inline' }} />
          </span>{' '}
          with the Login Kit and Content Posting API products, then paste its credentials here. See{' '}
          <code>docs/API_SETUP.md</code> for the full walkthrough.
        </p>

        <div className="form-group">
          <label className="form-label">Client Key</label>
          <input className="input" value={clientKey} onChange={(e) => setClientKey(e.target.value)} placeholder="aw1a2b3c4d5e6f7g" />
        </div>

        <div className="form-group">
          <label className="form-label">
            Client Secret {settings?.hasTikTokClientSecret && <span className="badge badge-success">Saved</span>}
          </label>
          <input
            className="input"
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder={settings?.hasTikTokClientSecret ? 'Leave blank to keep the saved secret' : 'Paste your Client Secret'}
          />
          <div className="form-hint">
            Encrypted at rest using your operating system&rsquo;s secure keychain (Windows Credential Manager, macOS
            Keychain, or the Linux Secret Service) &mdash; never stored in plain text, never sent anywhere except
            directly to TikTok&rsquo;s official token endpoint.
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSaveCredentials}>
          <Save size={15} /> Save credentials
        </button>
      </div>

      <div className="card">
        <h2 className="card-title">Automation behavior</h2>
        <div className="field-row">
          <div className="form-group">
            <label className="form-label">Delay between accounts (seconds)</label>
            <input
              className="input"
              type="number"
              min={0}
              max={600}
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(Number(e.target.value))}
            />
            <div className="form-hint">
              A pause between each account&rsquo;s upload when posting the same video to multiple accounts.
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">OAuth redirect port</label>
            <input
              className="input"
              type="number"
              min={1024}
              max={65535}
              value={redirectPort}
              onChange={(e) => setRedirectPort(Number(e.target.value))}
            />
            <div className="form-hint">
              Must match the loopback redirect URI registered in your TikTok app: <code>http://127.0.0.1:{redirectPort}/callback/</code>
            </div>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSaveBehavior}>
          <Save size={15} /> Save
        </button>
        {saved && <span style={{ marginLeft: 12, color: 'var(--success)', fontSize: 13 }}>Saved.</span>}
      </div>

      <div className="card">
        <h2 className="card-title">About</h2>
        <p className="card-subtitle">
          TikTok Multi Uploader v{version || '1.0.0'}. Publishes exclusively through TikTok&rsquo;s official Content
          Posting API using OAuth accounts you explicitly connect. It never automates TikTok&rsquo;s website, never
          reuses your browser&rsquo;s TikTok session/cookies, and never asks for your TikTok password.
        </p>
      </div>
    </>
  );
}
