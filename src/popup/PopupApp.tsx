import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, LayoutDashboard, TrendingUp, Sparkles, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';
import { useTheme } from '@/hooks/useTheme';
import { useSettingsStore } from '@/store';
import { APP_NAME } from '@/utils/constants';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { listIdeas } from '@/services/ideas';

async function openDashboard(path = '/') {
  if (typeof chrome !== 'undefined' && chrome.sidePanel?.open && chrome.tabs) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.windowId != null) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      await chrome.storage.session.set({ ch_initial_route: path });
      return;
    }
  }
  // Fallback: open sidepanel HTML in a new tab during local testing
  window.open(`/sidepanel.html#${path}`, '_blank');
}

export function PopupApp() {
  useAppBootstrap();
  useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const [keyword, setKeyword] = useState('');
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    void listIdeas().then((ideas) => setSavedCount(ideas.length));
  }, []);

  return (
    <div className="popup-root flex flex-col bg-transparent">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold tracking-tight"
          >
            {APP_NAME}
          </motion.h1>
          <p className="text-[11px] text-muted-foreground">
            {settings.defaultCountry} · {settings.defaultPlatform}
          </p>
        </div>
        <ThemeToggle />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-2">
          <Input
            placeholder="Quick keyword hunt…"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && keyword.trim()) {
                void chrome.storage?.session?.set({ ch_quick_keyword: keyword.trim() });
                void openDashboard('/search');
              }
            }}
          />
          <Button
            className="w-full"
            onClick={() => {
              if (keyword.trim()) void chrome.storage?.session?.set({ ch_quick_keyword: keyword.trim() });
              void openDashboard('/search');
            }}
          >
            <Search className="h-4 w-4" /> Search
          </Button>
        </motion.div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => void openDashboard('/')}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Button>
          <Button variant="secondary" onClick={() => void openDashboard('/trending')}>
            <TrendingUp className="h-4 w-4" /> Trending
          </Button>
          <Button variant="secondary" onClick={() => void openDashboard('/ai')}>
            <Sparkles className="h-4 w-4" /> AI
          </Button>
          <Button variant="secondary" onClick={() => void openDashboard('/settings')}>
            <Settings className="h-4 w-4" /> Settings
          </Button>
        </div>

        <div className="mt-auto rounded-xl border border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">{savedCount} saved ideas</p>
          <p className="mt-1">Official APIs only. No scraping bypasses. Configure keys on the backend.</p>
        </div>
      </div>
    </div>
  );
}
