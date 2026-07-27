import { motion } from 'framer-motion';
import type { ContentItem } from '@/types';
import { Badge } from '@/components/ui/input';
import { formatNumber, formatPercent } from '@/utils/cn';
import { ExternalLink } from 'lucide-react';

export function ContentResultCard({ item, index = 0 }: { item: ContentItem; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.35 }}
      className="glass-panel overflow-hidden"
    >
      <div className="flex flex-col gap-3 p-4 sm:flex-row">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt=""
            className="h-28 w-full rounded-xl object-cover sm:h-24 sm:w-40"
            loading="lazy"
          />
        ) : (
          <div className="flex h-28 w-full items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground sm:h-24 sm:w-40">
            {item.platform}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{item.platform}</Badge>
            <Badge variant="outline">{item.source}</Badge>
            {item.growth != null ? <Badge variant="success">{formatPercent(item.growth)}</Badge> : null}
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{item.title}</h3>
          {item.description ? (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {item.engagement != null ? <span>Engagement {formatNumber(item.engagement)}</span> : null}
            {item.popularity != null ? <span>Popularity {formatNumber(item.popularity)}</span> : null}
            {item.publishedAt ? <span>{new Date(item.publishedAt).toLocaleDateString()}</span> : null}
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
