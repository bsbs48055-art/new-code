import type { Collection, Folder, HistoryEntry, SavedIdea } from '@/types';
import { db } from '@/services/db';
import { uid } from '@/utils/cn';

export async function listIdeas(): Promise<SavedIdea[]> {
  return db.ideas.orderBy('updatedAt').reverse().toArray();
}

export async function saveIdea(input: Omit<SavedIdea, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const now = new Date().toISOString();
  const idea: SavedIdea = {
    id: input.id ?? uid('idea'),
    title: input.title,
    content: input.content,
    type: input.type,
    tags: input.tags,
    notes: input.notes,
    folderId: input.folderId,
    collectionId: input.collectionId,
    favorite: input.favorite,
    source: input.source,
    metadata: input.metadata,
    createdAt: input.id ? (await db.ideas.get(input.id))?.createdAt ?? now : now,
    updatedAt: now,
  };
  await db.ideas.put(idea);
  return idea;
}

export async function deleteIdea(id: string) {
  await db.ideas.delete(id);
}

export async function toggleFavorite(id: string) {
  const idea = await db.ideas.get(id);
  if (!idea) return null;
  idea.favorite = !idea.favorite;
  idea.updatedAt = new Date().toISOString();
  await db.ideas.put(idea);
  return idea;
}

export async function listCollections(): Promise<Collection[]> {
  return db.collections.orderBy('createdAt').reverse().toArray();
}

export async function createCollection(name: string, description?: string, color?: string) {
  const collection: Collection = {
    id: uid('col'),
    name,
    description,
    color: color ?? '#0071e3',
    createdAt: new Date().toISOString(),
  };
  await db.collections.put(collection);
  return collection;
}

export async function listFolders(): Promise<Folder[]> {
  return db.folders.orderBy('createdAt').reverse().toArray();
}

export async function createFolder(name: string, parentId?: string) {
  const folder: Folder = {
    id: uid('folder'),
    name,
    parentId,
    createdAt: new Date().toISOString(),
  };
  await db.folders.put(folder);
  return folder;
}

export async function addHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>) {
  const item: HistoryEntry = {
    ...entry,
    id: uid('hist'),
    createdAt: new Date().toISOString(),
  };
  await db.history.put(item);
  const count = await db.history.count();
  if (count > 500) {
    const oldest = await db.history.orderBy('createdAt').limit(count - 500).primaryKeys();
    await db.history.bulkDelete(oldest);
  }
  return item;
}

export async function listHistory(limit = 100): Promise<HistoryEntry[]> {
  return db.history.orderBy('createdAt').reverse().limit(limit).toArray();
}

export async function clearHistory() {
  await db.history.clear();
}
