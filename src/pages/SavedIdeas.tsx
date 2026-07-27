import { useEffect, useMemo, useState } from 'react';
import { PageHeader, EmptyState } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea, Badge } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createCollection,
  createFolder,
  deleteIdea,
  listCollections,
  listFolders,
  listIdeas,
  saveIdea,
  toggleFavorite,
} from '@/services/ideas';
import type { Collection, Folder, SavedIdea } from '@/types';
import { useToastStore } from '@/store';
import { Star, Trash2, FolderPlus, Plus } from 'lucide-react';

export function SavedIdeasPage() {
  const push = useToastStore((s) => s.push);
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const refresh = async () => {
    const [i, c, f] = await Promise.all([listIdeas(), listCollections(), listFolders()]);
    setIdeas(i);
    setCollections(c);
    setFolders(f);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return ideas;
    return ideas.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.content.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)) ||
        i.notes.toLowerCase().includes(q),
    );
  }, [ideas, query]);

  const create = async () => {
    if (!title.trim() || !content.trim()) {
      push({ title: 'Title and content required', variant: 'error' });
      return;
    }
    await saveIdea({
      title: title.trim(),
      content: content.trim(),
      type: 'manual',
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      notes,
      favorite: false,
    });
    setTitle('');
    setContent('');
    setTags('');
    setNotes('');
    await refresh();
    push({ title: 'Idea saved', variant: 'success' });
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Saved Ideas"
        description="Favorites, collections, folders, tags, and notes — stored locally in IndexedDB."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                void createFolder(`Folder ${folders.length + 1}`).then(refresh).then(() =>
                  push({ title: 'Folder created', variant: 'success' }),
                )
              }
            >
              <FolderPlus className="h-4 w-4" /> Folder
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                void createCollection(`Collection ${collections.length + 1}`).then(refresh).then(() =>
                  push({ title: 'Collection created', variant: 'success' }),
                )
              }
            >
              <Plus className="h-4 w-4" /> Collection
            </Button>
          </div>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader><CardTitle>New Idea</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Tags (comma separated)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            <Button onClick={() => void create()}>Save Idea</Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-3">
          <Input placeholder="Filter by title, tags, notes…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{folders.length} folders</span>
            <span>·</span>
            <span>{collections.length} collections</span>
            <span>·</span>
            <span>{ideas.filter((i) => i.favorite).length} favorites</span>
          </div>
          {filtered.length ? (
            filtered.map((idea) => (
              <Card key={idea.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{idea.title}</h3>
                      <p className="text-xs text-muted-foreground">{idea.type} · {new Date(idea.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => void toggleFavorite(idea.id).then(refresh)}
                        aria-label="Favorite"
                      >
                        <Star className={`h-4 w-4 ${idea.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => void deleteIdea(idea.id).then(refresh)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground line-clamp-4">{idea.content}</p>
                  {idea.notes ? <p className="text-xs italic text-muted-foreground">Notes: {idea.notes}</p> : null}
                  <div className="flex flex-wrap gap-1">
                    {idea.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <EmptyState title="No saved ideas" description="Save research findings, AI outputs, and notes here." />
          )}
        </div>
      </div>
    </div>
  );
}
