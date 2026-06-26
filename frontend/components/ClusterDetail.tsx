'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Clock, Sparkles, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
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
  onChangeSources: (sources: string[]) => void;
  onSourcesDiscovered?: (sources: string[]) => void;
}

function ArticleCardSkeleton() {
  return (
    <div className="space-y-2 p-4 rounded-lg border border-border bg-card">
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
  onChangeSources,
  onSourcesDiscovered,
}) => {
  const [detail, setDetail] = useState<ClusterDetailType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<Article[]>([]);
  const [availableSources, setAvailableSources] = useState<string[]>([]);

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
          const sources = [...new Set(data.articles.map((a) => a.source))];
          setAvailableSources(sources);
          if (onSourcesDiscovered) {
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

  const toggleSource = (src: string) => {
    if (selectedSources.includes(src)) {
      onChangeSources(selectedSources.filter((s) => s !== src));
    } else {
      onChangeSources([...selectedSources, src]);
    }
  };

  const filteredArticles = selectedSources.length
    ? articles.filter((a) => selectedSources.includes(a.source))
    : articles;

  // No Selection Empty State
  if (!clusterId) {
    return (
      <Card className="h-[480px] flex flex-col justify-center items-center border-dashed border-2 border-border p-6 bg-card/20">
        <div className="flex flex-col items-center max-w-[280px] text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles size={20} />
          </div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">Select a News Topic</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Click on a timeline track or select a ranked topic from the trending panel to load articles and analyze sources.
          </p>
        </div>
      </Card>
    );
  }

  // Loading skeleton state
  if (loading && !detail) {
    return (
      <Card className="h-[480px] flex flex-col border-border">
        <CardHeader className="pb-3 shrink-0">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-6 w-3/4 rounded mt-2" />
          <Skeleton className="h-4 w-1/2 rounded mt-1" />
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3 flex-1 overflow-hidden">
          {[...Array(2)].map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[480px] flex flex-col justify-center items-center border-border">
        <p className="text-xs text-destructive">{error}</p>
      </Card>
    );
  }

  if (!detail) return null;

  return (
    <Card className="flex flex-col h-[480px] border-border">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5">
            Topic Focus
          </Badge>
          <span className="text-[10px] text-muted-foreground font-medium">
            {detail.articleCount} articles total
          </span>
        </div>
        <CardTitle className="text-sm font-semibold leading-snug mt-1 truncate">{detail.label}</CardTitle>
        <CardDescription className="text-[11px] font-medium">
          Active span: {new Date(detail.startTime).toLocaleDateString()} – {new Date(detail.endTime).toLocaleDateString()}
        </CardDescription>

        {/* Source Inline Filters inside Card Header */}
        {availableSources.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/60">
            <span className="text-[10px] text-muted-foreground mr-1 flex items-center gap-1">
              <Filter size={10} /> Filters:
            </span>
            <Button
              variant={selectedSources.length === 0 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChangeSources([])}
              className="h-5 px-2 text-[10px] rounded-full"
            >
              All
            </Button>
            {availableSources.map((src) => {
              const active = selectedSources.includes(src);
              return (
                <Button
                  key={src}
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSource(src)}
                  className="h-5 px-2 text-[10px] rounded-full"
                >
                  {src}
                </Button>
              );
            })}
          </div>
        )}
      </CardHeader>
      
      <Separator />

      {/* Articles List */}
      <ScrollArea className="flex-1 min-h-0 bg-secondary/15">
        <CardContent className="p-3 space-y-2">
          {filteredArticles.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No articles match the selected source filters.
            </p>
          ) : (
            filteredArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))
          )}
        </CardContent>
      </ScrollArea>

      {/* Pagination Footer */}
      <div className="shrink-0 border-t border-border px-3 py-2.5 flex items-center justify-between bg-card">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="h-7 px-2 text-[10px]"
        >
          <ChevronLeft size={12} className="mr-0.5" />
          Prev
        </Button>
        <span className="text-[11px] font-medium text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={articles.length < PAGE_LIMIT || loading}
          className="h-7 px-2 text-[10px]"
        >
          Next
          <ChevronRight size={12} className="ml-0.5" />
        </Button>
      </div>
    </Card>
  );
};

function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="group rounded-lg border border-border bg-card p-3 hover:bg-secondary/40 transition-all duration-150">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-medium">
            {article.source}
          </Badge>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock size={9} />
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
          aria-label="Open article link"
        >
          <ExternalLink size={12} />
        </a>
      </div>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-xs font-semibold text-foreground hover:text-primary transition-colors duration-150 leading-snug mb-1"
      >
        {article.title}
      </a>
      {article.summary && (
        <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
          {article.summary}
        </p>
      )}
    </div>
  );
}

export default ClusterDetail;
