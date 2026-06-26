'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Clock, MousePointerClick, ChevronLeft, ChevronRight } from 'lucide-react';
import { getClusterById, ClusterDetail as ClusterDetailType, Article } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_LIMIT = 20;

interface ClusterDetailProps {
  clusterId: number | null;
  selectedSources: string[];
  onSourcesDiscovered?: (sources: string[]) => void;
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
}

function ArticleCardSkeleton() {
  return (
    <div className="space-y-2 p-4 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-4 w-28 rounded" />
      </div>
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-5/6 rounded" />
      <Skeleton className="h-3 w-4/6 rounded" />
    </div>
  );
}

export const ClusterDetail: React.FC<ClusterDetailProps> = ({
  clusterId,
  selectedSources,
  onSourcesDiscovered,
}) => {
  const [detail, setDetail] = useState<ClusterDetailType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    if (!clusterId) return;

    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getClusterById(clusterId, 1, PAGE_LIMIT);
        if (isMounted) {
          setDetail(data);
          setArticles(data.articles);
          if (onSourcesDiscovered) {
            const sources = [...new Set(data.articles.map((a) => a.source))];
            onSourcesDiscovered(sources);
          }
        }
      } catch {
        if (isMounted) {
          setError('Failed to load cluster details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [clusterId, onSourcesDiscovered]);

  const handlePageChange = async (newPage: number) => {
    if (!clusterId) return;
    setPage(newPage);
    setLoading(true);
    setError(null);
    try {
      const data = await getClusterById(clusterId, newPage, PAGE_LIMIT);
      setDetail(data);
      setArticles(data.articles);
    } catch {
      setError('Failed to load articles.');
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = selectedSources.length
    ? articles.filter((a) => selectedSources.includes(a.source))
    : articles;

  // No cluster selected
  if (!clusterId) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <MousePointerClick size={36} strokeWidth={1.5} />
          <p className="text-sm text-center leading-relaxed">
            Click a topic on the timeline<br />to explore its articles.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading skeleton
  if (loading && !detail) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-6 w-3/4 rounded mt-2" />
          <Skeleton className="h-4 w-1/2 rounded mt-1" />
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          {[...Array(4)].map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 flex items-center justify-center py-16 text-destructive text-sm">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (!detail) return null;

  return (
    <Card className="flex flex-col lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)]">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-medium">
            Cluster
          </Badge>
        </div>
        <CardTitle className="text-lg leading-snug mt-1">{detail.label}</CardTitle>
        <CardDescription>
          {detail.articleCount} article{detail.articleCount !== 1 ? 's' : ''}
          {detail.startTime
            ? ` · ${formatTime(detail.startTime)} – ${formatTime(detail.endTime)}`
            : ''}
        </CardDescription>
      </CardHeader>
      <Separator className="shrink-0" />

      <ScrollArea className="flex-1 min-h-0">
        <CardContent className="pt-4 pb-2 space-y-2">
          {filteredArticles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No articles match the selected source filters.
            </p>
          ) : (
            filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))
          )}
        </CardContent>
      </ScrollArea>

      {/* Pagination */}
      <div className="shrink-0 border-t border-border px-4 py-3 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="h-8 px-3 text-xs"
        >
          <ChevronLeft size={13} />
          Prev
        </Button>
        <span className="text-xs text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={articles.length < PAGE_LIMIT || loading}
          className="h-8 px-3 text-xs"
        >
          Next
          <ChevronRight size={13} />
        </Button>
      </div>
    </Card>
  );
};

function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="group rounded-lg border border-border p-4 hover:bg-zinc-900 transition-colors duration-150">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-medium">
            {article.source}
          </Badge>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock size={10} />
            {new Intl.DateTimeFormat('en', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date(article.publishedAt))}
          </span>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-muted-foreground hover:text-primary transition-colors duration-150"
          aria-label="Open article"
        >
          <ExternalLink size={13} />
        </a>
      </div>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-sm font-medium text-foreground hover:text-primary transition-colors duration-150 leading-snug mb-1.5"
      >
        {article.title}
      </a>
      {article.summary && (
        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
          {article.summary}
        </p>
      )}
    </div>
  );
}

export default ClusterDetail;
