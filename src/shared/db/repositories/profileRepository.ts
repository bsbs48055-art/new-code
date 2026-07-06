/** Data-access layer for named publishing profiles (e.g. "Gaming", "Shorts"). */

import { db } from '@shared/db/db';
import type { PublishingProfile } from '@shared/types/index';
import { generateId } from '@shared/utils/id';

export const profileRepository = {
  async all(): Promise<PublishingProfile[]> {
    return db.profiles.orderBy('updatedAt').reverse().toArray();
  },

  async get(id: string): Promise<PublishingProfile | undefined> {
    return db.profiles.get(id);
  },

  async create(input: Omit<PublishingProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<PublishingProfile> {
    const now = Date.now();
    const profile: PublishingProfile = { ...input, id: generateId('profile'), createdAt: now, updatedAt: now };
    await db.profiles.put(profile);
    return profile;
  },

  async update(id: string, patch: Partial<PublishingProfile>): Promise<void> {
    await db.profiles.update(id, { ...patch, updatedAt: Date.now() });
  },

  async remove(id: string): Promise<void> {
    await db.profiles.delete(id);
  },
};
