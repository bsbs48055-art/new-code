import { ThemeToggle } from '@ui/components/ThemeToggle';
import { ToastContainer } from '@ui/components/ToastContainer';
import { useTheme } from '@ui/hooks/useTheme';
import { Settings } from '@ui/pages/Settings';
import { APP_NAME } from '@shared/constants';

/** Full-page Settings surface, shown when the user opens the extension's Options page. */
export function OptionsApp() {
  useTheme();

  return (
    <div style={{ minHeight: '100vh', padding: '24px 32px' }}>
      <div className="flex items-center justify-between" style={{ maxWidth: 780, margin: '0 auto 20px' }}>
        <span style={{ fontWeight: 800, fontSize: 15 }}>{APP_NAME}</span>
        <ThemeToggle />
      </div>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <Settings />
      </div>
      <ToastContainer />
    </div>
  );
}
