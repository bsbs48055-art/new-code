import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { COUNTRIES, LANGUAGES, PLATFORMS } from '@/utils/constants';
import { useAuthStore, useSettingsStore, useToastStore } from '@/store';
import { loadSecureKeys, saveSecureKeys, type SecureKeyBag } from '@/services/storage';
import { healthCheck } from '@/api/research';
import {
  loginWithEmail,
  loginWithGoogle,
  logoutFirebase,
  registerWithEmail,
} from '@/firebase/auth';
import type { Platform, ThemeMode } from '@/types';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const push = useToastStore((s) => s.push);
  const [keys, setKeys] = useState<SecureKeyBag>({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  useEffect(() => {
    void loadSecureKeys().then(setKeys);
  }, []);

  const saveKeys = async () => {
    await saveSecureKeys(keys);
    push({ title: 'Firebase client config saved', variant: 'success' });
  };

  const testBackend = async () => {
    try {
      await healthCheck(settings.apiBaseUrl);
      setBackendOk(true);
      push({ title: 'Backend connected', variant: 'success' });
    } catch (err) {
      setBackendOk(false);
      push({
        title: 'Backend unreachable',
        description: err instanceof Error ? err.message : 'Check API base URL',
        variant: 'error',
      });
    }
  };

  return (
    <div className="page-shell space-y-6">
      <PageHeader title="Settings" description="Theme, defaults, notifications, Firebase login, and backend connection." />

      <Card>
        <CardHeader>
          <CardTitle>Appearance & Defaults</CardTitle>
          <CardDescription>Personalize the research workspace.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">Light / Dark / System</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="space-y-1.5">
            <Label>Theme mode</Label>
            <Select value={settings.theme} onValueChange={(v) => void update({ theme: v as ThemeMode })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Language</Label>
            <Select value={settings.language} onValueChange={(v) => void update({ language: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Default Country</Label>
            <Select value={settings.defaultCountry} onValueChange={(v) => void update({ defaultCountry: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Default Platform</Label>
            <Select value={settings.defaultPlatform} onValueChange={(v) => void update({ defaultPlatform: v as Platform })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>OpenAI model (server default override hint)</Label>
            <Input value={settings.openaiModel} onChange={(e) => void update({ openaiModel: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>API Base URL</Label>
            <Input value={settings.apiBaseUrl} onChange={(e) => void update({ apiBaseUrl: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Cache TTL (minutes)</Label>
            <Input
              type="number"
              min={1}
              value={settings.cacheTtlMinutes}
              onChange={(e) => void update({ cacheTtlMinutes: Number(e.target.value) || 30 })}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Auto Save</p>
              <p className="text-xs text-muted-foreground">Save AI outputs automatically</p>
            </div>
            <Switch checked={settings.autoSave} onCheckedChange={(v) => void update({ autoSave: v })} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Notifications</p>
              <p className="text-xs text-muted-foreground">Toast + Chrome notifications</p>
            </div>
            <Switch checked={settings.notifications} onCheckedChange={(v) => void update({ notifications: v })} />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <Button onClick={() => void testBackend()}>Test Backend</Button>
            {backendOk === true ? <span className="text-sm text-emerald-500">Connected</span> : null}
            {backendOk === false ? <span className="text-sm text-rose-500">Unreachable</span> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Firebase Authentication</CardTitle>
          <CardDescription>
            Store only the public Firebase web config in the extension. Server API secrets belong in <code>server/.env</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5"><Label>API Key</Label><Input value={keys.firebaseApiKey ?? ''} onChange={(e) => setKeys({ ...keys, firebaseApiKey: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Auth Domain</Label><Input value={keys.firebaseAuthDomain ?? ''} onChange={(e) => setKeys({ ...keys, firebaseAuthDomain: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Project ID</Label><Input value={keys.firebaseProjectId ?? ''} onChange={(e) => setKeys({ ...keys, firebaseProjectId: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>App ID</Label><Input value={keys.firebaseAppId ?? ''} onChange={(e) => setKeys({ ...keys, firebaseAppId: e.target.value })} /></div>
          </div>
          <Button onClick={() => void saveKeys()}>Save Firebase Config</Button>

          <div className="border-t border-border pt-4">
            {user ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{user.displayName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="outline" onClick={() => void logoutFirebase().then(() => setUser(null))}>Sign out</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      void loginWithEmail(email, password)
                        .then(setUser)
                        .then(() => push({ title: 'Signed in', variant: 'success' }))
                        .catch((err) => push({ title: 'Sign-in failed', description: String(err.message ?? err), variant: 'error' }))
                    }
                  >
                    Sign in
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void registerWithEmail(email, password)
                        .then(setUser)
                        .then(() => push({ title: 'Account created', variant: 'success' }))
                        .catch((err) => push({ title: 'Register failed', description: String(err.message ?? err), variant: 'error' }))
                    }
                  >
                    Register
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void loginWithGoogle()
                        .then(setUser)
                        .then(() => push({ title: 'Signed in with Google', variant: 'success' }))
                        .catch((err) => push({ title: 'Google sign-in failed', description: String(err.message ?? err), variant: 'error' }))
                    }
                  >
                    Google
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
