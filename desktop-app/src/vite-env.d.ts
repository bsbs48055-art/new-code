/// <reference types="vite/client" />

import type { ElectronApi } from '../electron/types';

declare global {
  interface Window {
    api: ElectronApi;
  }
}

export {};
