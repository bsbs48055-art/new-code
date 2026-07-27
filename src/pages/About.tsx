import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { APP_NAME, APP_VERSION } from '@/utils/constants';

export function AboutPage() {
  return (
    <div className="page-shell space-y-6">
      <PageHeader title="About" description={`${APP_NAME} v${APP_VERSION}`} />
      <Card>
        <CardHeader>
          <CardTitle>Premium AI content research — the compliant way</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Content Hunter AI Pro helps creators discover trending topics, keywords, hashtags, viral patterns,
            audience insights, and content opportunities using official APIs and publicly available feeds.
          </p>
          <p>
            This extension does <strong className="text-foreground">not</strong> scrape websites that prohibit scraping,
            bypass platform protections, automate reposting of copyrighted content, or violate platform Terms of Service.
          </p>
          <p>
            Supported sources include YouTube Data API, Google Trends (via permitted libraries/endpoints), Reddit API,
            News API, and RSS feeds where redistribution is allowed by the feed publisher.
          </p>
          <p>
            Secrets (OpenAI, YouTube, Reddit, News API keys) are stored on your Express backend in environment variables —
            never shipped inside the Chrome package.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Tech stack</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Chrome Extension Manifest V3 · React 19 · TypeScript · Vite · Tailwind CSS · Shadcn-style UI · Framer Motion ·
          Node.js/Express · Firebase Auth · Chrome Storage · IndexedDB · OpenAI · YouTube Data API · Google Trends ·
          Reddit API · News API
        </CardContent>
      </Card>
    </div>
  );
}
