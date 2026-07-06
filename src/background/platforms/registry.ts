/** Central lookup from platform ID to its adapter implementation. */

import type { PlatformId } from '@shared/types/index';
import type { PlatformAdapter } from './PlatformAdapter';
import { youtubeAdapter } from './youtube';
import { facebookAdapter } from './facebook';
import { tiktokAdapter } from './tiktok';

export const platformAdapters: Record<PlatformId, PlatformAdapter> = {
  youtube: youtubeAdapter,
  facebook: facebookAdapter,
  tiktok: tiktokAdapter,
};

export function getPlatformAdapter(platform: PlatformId): PlatformAdapter {
  return platformAdapters[platform];
}
