/** Data-access layer for reusable content templates (title/description/tag presets). */

import { db, type ContentTemplate } from '@shared/db/db';
import { generateId } from '@shared/utils/id';

export const templateRepository = {
  async all(): Promise<ContentTemplate[]> {
    return db.templates.orderBy('updatedAt').reverse().toArray();
  },

  async create(input: Omit<ContentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContentTemplate> {
    const now = Date.now();
    const template: ContentTemplate = { ...input, id: generateId('tmpl'), createdAt: now, updatedAt: now };
    await db.templates.put(template);
    return template;
  },

  async update(id: string, patch: Partial<ContentTemplate>): Promise<void> {
    await db.templates.update(id, { ...patch, updatedAt: Date.now() });
  },

  async remove(id: string): Promise<void> {
    await db.templates.delete(id);
  },
};
