import { useRef, useState } from 'react';
import { Download, Upload, Link2, Unlink, KeyRound, Save } from 'lucide-react';
import { PLATFORM_LABELS, type PlatformId } from '@shared/types/index';
import { MESSAGE_TYPES } from '@shared/constants';
import { sendToBackground } from '@shared/messaging';
import { aiKeyStore } from '@shared/db/settingsRepository';
import { downloadBackup, importBackup, type BackupPayload } from '@shared/utils/backup';
import { useSettings } from '@ui/hooks/useSettings';
import { useAuthStates } from '@ui/hooks/useAuthStates';
import { ThemeToggle } from '@ui/components/ThemeToggle';
import { useToastStore } from '@ui/state/toastStore';

const ALL_PLATFORMS: PlatformId[] = ['youtube', 'facebook', 'tiktok'];

/** Settings page: theme, language, defaults, notifications, platform connections/credentials, AI, backup/restore. */
export function Settings() {
  const { settings, updateSettings, loaded } = useSettings();
  const authStates = useAuthStates();
  const push = useToastStore((s) => s.push);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [connecting, setConnecting] = useState<PlatformId | null>(null);

  if (!loaded) return null;

  const connect = async (platform: PlatformId) => {
    setConnecting(platform);
    try {
      const result = await sendToBackground<{ platform: PlatformId }, { ok: boolean; error?: string }>(
        MESSAGE_TYPES.CONNECT_PLATFORM,
        { platform },
      );
      if (result.ok) push(`${PLATFORM_LABELS[platform]} connected.`, 'success');
      else push(result.error ?? `Failed to connect ${PLATFORM_LABELS[platform]}.`, 'error');
    } finally {
      setConnecting(null);
    }
  };

  const disconnect = async (platform: PlatformId) => {
    await sendToBackground(MESSAGE_TYPES.DISCONNECT_PLATFORM, { platform });
    push(`${PLATFORM_LABELS[platform]} disconnected.`, 'info');
  };

  const saveApiKey = async () => {
    if (!apiKeyDraft.trim()) return;
    await aiKeyStore.setApiKey(apiKeyDraft.trim());
    setApiKeyDraft('');
    push('AI API key saved (encrypted locally).', 'success');
  };

  const clearApiKey = async () => {
    await aiKeyStore.clearApiKey();
    push('AI API key removed.', 'info');
  };

  const handleExport = async () => {
    await downloadBackup();
    push('Backup downloaded.', 'success');
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const payload = JSON.parse(await file.text()) as BackupPayload;
      await importBackup(payload);
      push('Backup imported successfully.', 'success');
    } catch (error) {
      push(`Import failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  };

  return (
    <div className="flex flex-col gap-4" style={{ maxWidth: 780 }}>
      <h2 style={{ marginTop: 0 }}>Settings</h2>

      <section className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>Appearance</h3>
        <div className="flex items-center justify-between">
          <span className="text-muted" style={{ fontSize: 13 }}>Theme</span>
          <ThemeToggle />
        </div>
        <div className="field" style={{ marginTop: 14 }}>
          <label>Language</label>
          <select value={settings.language} onChange={(e) => updateSettings({ language: e.target.value })} style={{ width: 200 }}>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="pt">Português</option>
          </select>
        </div>
      </section>

      <section className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>Platform Connections</h3>
        <p className="text-muted" style={{ fontSize: 12, marginTop: -6 }}>
          Connections use each platform's official OAuth login. The extension only ever acts on the account you explicitly
          authorize — it never reads passwords, cookies, or session tokens.
        </p>
        <div className="flex flex-col gap-2">
          {ALL_PLATFORMS.map((platform) => {
            const state = authStates.find((s) => s.platform === platform);
            return (
              <div key={platform} className="flex items-center justify-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{PLATFORM_LABELS[platform]}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    {state?.connected ? `Connected as ${state.accountLabel ?? state.accountId}` : 'Not connected'}
                  </div>
                </div>
                {state?.connected ? (
                  <button className="btn btn-danger" onClick={() => disconnect(platform)}>
                    <Unlink size={14} /> Disconnect
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => connect(platform)} disabled={connecting === platform}>
                    <Link2 size={14} /> {connecting === platform ? 'Connecting…' : 'Connect'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>Platform Apps (Developer Credentials)</h3>
        <p className="text-muted" style={{ fontSize: 12, marginTop: -6 }}>
          Register your own apps with Google, Facebook, and TikTok — see docs/API_SETUP.md. These identify your extension to
          each platform; they are not secrets by themselves.
        </p>
        <div className="field">
          <label>Facebook App ID</label>
          <input
            value={settings.platformApps.facebookAppId ?? ''}
            onChange={(e) => updateSettings({ platformApps: { ...settings.platformApps, facebookAppId: e.target.value } })}
          />
        </div>
        <div className="field">
          <label>Facebook Page ID (optional — defaults to your first managed Page)</label>
          <input
            value={settings.platformApps.facebookPageId ?? ''}
            onChange={(e) => updateSettings({ platformApps: { ...settings.platformApps, facebookPageId: e.target.value } })}
          />
        </div>
        <div className="field">
          <label>TikTok Client Key</label>
          <input
            value={settings.platformApps.tiktokClientKey ?? ''}
            onChange={(e) => updateSettings({ platformApps: { ...settings.platformApps, tiktokClientKey: e.target.value } })}
          />
        </div>
        <div className="field">
          <label>Local helper server URL (for TikTok/Facebook token exchange — run "npm run server")</label>
          <input
            value={settings.platformApps.helperServerUrl}
            onChange={(e) => updateSettings({ platformApps: { ...settings.platformApps, helperServerUrl: e.target.value } })}
          />
        </div>
      </section>

      <section className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>Uploads</h3>
        <div className="field">
          <label>Concurrent uploads: {settings.uploadConcurrency}</label>
          <input
            type="range"
            min={1}
            max={5}
            value={settings.uploadConcurrency}
            onChange={(e) => updateSettings({ uploadConcurrency: Number(e.target.value) })}
          />
        </div>
      </section>

      <section className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>Notifications</h3>
        {(['uploadComplete', 'uploadFailed', 'scheduleReminder'] as const).map((key) => (
          <label key={key} className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text)', marginBottom: 8 }}>
            <input
              type="checkbox"
              style={{ width: 'auto' }}
              checked={settings.notifications[key]}
              onChange={(e) => updateSettings({ notifications: { ...settings.notifications, [key]: e.target.checked } })}
            />
            {key === 'uploadComplete' && 'Notify when an upload completes'}
            {key === 'uploadFailed' && 'Notify when an upload fails'}
            {key === 'scheduleReminder' && 'Notify when a scheduled upload starts'}
          </label>
        ))}
      </section>

      <section className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>AI Tools</h3>
        <div className="field">
          <label>API endpoint (OpenAI-compatible)</label>
          <input value={settings.aiProvider.endpoint} onChange={(e) => updateSettings({ aiProvider: { ...settings.aiProvider, endpoint: e.target.value } })} />
        </div>
        <div className="field">
          <label>Model</label>
          <input value={settings.aiProvider.model} onChange={(e) => updateSettings({ aiProvider: { ...settings.aiProvider, model: e.target.value } })} />
        </div>
        <div className="field">
          <label>API key {settings.aiProvider.hasApiKey ? '(configured)' : '(not set)'}</label>
          <div className="flex gap-2">
            <input type="password" value={apiKeyDraft} onChange={(e) => setApiKeyDraft(e.target.value)} placeholder="sk-…" />
            <button className="btn btn-primary" onClick={saveApiKey}>
              <KeyRound size={14} /> Save
            </button>
            {settings.aiProvider.hasApiKey && (
              <button className="btn btn-ghost" onClick={clearApiKey}>
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: 18 }}>
        <h3 style={{ marginTop: 0 }}>Backup & Restore</h3>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={14} /> Export Backup
          </button>
          <button className="btn btn-secondary" onClick={() => importInputRef.current?.click()}>
            <Upload size={14} /> Import Backup
          </button>
          <input ref={importInputRef} type="file" accept="application/json" hidden onChange={handleImport} />
        </div>
      </section>

      <div className="flex items-center gap-2 text-muted" style={{ fontSize: 12 }}>
        <Save size={13} /> Changes save automatically.
      </div>
    </div>
  );
}
