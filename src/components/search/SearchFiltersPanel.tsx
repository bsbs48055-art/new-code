import { CATEGORIES, COUNTRIES, LANGUAGES, PLATFORMS, SORT_OPTIONS } from '@/utils/constants';
import type { SearchFilters } from '@/types';
import { Input, Label } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, RotateCcw } from 'lucide-react';

interface Props {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  onSearch: () => void;
  onReset?: () => void;
  loading?: boolean;
}

export function SearchFiltersPanel({ filters, onChange, onSearch, onReset, loading }: Props) {
  return (
    <div className="glass-panel space-y-4 p-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="keyword">Keyword</Label>
          <Input
            id="keyword"
            placeholder="e.g. AI productivity tools"
            value={filters.keyword}
            onChange={(e) => onChange({ keyword: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={filters.category || 'all'} onValueChange={(v) => onChange({ category: v === 'all' ? '' : v })}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Country</Label>
          <Select value={filters.country} onValueChange={(v) => onChange({ country: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Language</Label>
          <Select value={filters.language} onValueChange={(v) => onChange({ language: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Platform</Label>
          <Select value={filters.platform} onValueChange={(v) => onChange({ platform: v as SearchFilters['platform'] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORMS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Sort By</Label>
          <Select value={filters.sortBy} onValueChange={(v) => onChange({ sortBy: v as SearchFilters['sortBy'] })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateFrom">From</Label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => onChange({ dateFrom: e.target.value || undefined })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateTo">To</Label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => onChange({ dateTo: e.target.value || undefined })}
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onSearch} disabled={loading}>
          <Search className="h-4 w-4" />
          {loading ? 'Searching…' : 'Search'}
        </Button>
        {onReset ? (
          <Button variant="outline" onClick={onReset} disabled={loading}>
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}
