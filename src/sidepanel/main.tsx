import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardApp } from '@/dashboard/App';
import '@/styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DashboardApp />
  </StrictMode>,
);
