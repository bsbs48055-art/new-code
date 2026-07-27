import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const cycle = () => {
    const order = ['light', 'dark', 'system'] as const;
    const next = order[(order.indexOf(theme) + 1) % order.length];
    void setTheme(next);
  };

  return (
    <Button variant="outline" size="icon" onClick={cycle} aria-label="Toggle theme" title={`Theme: ${theme}`}>
      {theme === 'dark' ? <Moon className="h-4 w-4" /> : theme === 'light' ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
    </Button>
  );
}
