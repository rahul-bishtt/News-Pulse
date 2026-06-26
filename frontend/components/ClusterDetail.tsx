'use client';

import React from 'react';
import { ExternalLink, Clock, Sparkles, ChevronLeft, ChevronRight, Filter, BookOpen } from 'lucide-react';
import { ClusterDetail as ClusterDetailType, Article } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const PAGE_LIMIT = 20;

interface ClusterDetailProps {
  clusterId: number | null;
  detail: ClusterDetailType | null;
  loading: boolean;
  error: string | null;
  selectedSources: string[];
  onChangeSources: (sources: string[]) => void;
  availableSources: string[];
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
  detail,
  loading,
  error,
  selectedSources,
  onChangeSources,
  availableSources,
}) => {
  const toggleSource = (src: string) => {
    if (selectedSources.includes(src)) {
      onChangeSources(selectedSources.filter((s) => s !== src));
    } else {
      onChangeSources([...selectedSources, src]);
    }
  };

  // No Selection Empty State
  if (!clusterId) {
    return (
      <Card className="h-[220px] flex flex-col justify-center items-center border-dashed border-2 border-border p-6 bg-card/20">
        <div className="flex flex-col items-center max-w-[280px] text-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Sparkles size={18} />
          </div>
          <h3 className="text-xs font-semibold tracking-tight text-foreground">Select a News Topic</h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Click on a timeline track or select a ranked topic from the trending panel to load articles and analyze sources.
          </p>
        </div>
      </Card>
    );
  }

  // Loading skeleton state
  if (loading && !detail) {
    return (
      <Card className="h-[220px] flex flex-col border-border justify-center p-6 bg-card/40">
        <div className="space-y-3">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-6 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-[220px] flex flex-col justify-center items-center border-border bg-card/40">
        <p className="text-xs text-destructive">{error}</p>
      </Card>
    );
  }

  if (!detail) return null;

  return (
    <Card className="flex flex-col h-[220px] border-border bg-card/40">
      <CardHeader className="pb-3 flex-1 justify-center">
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
              className="h-5 px-2 text-[10px] rounded-full cursor-pointer"
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
                  className="h-5 px-2 text-[10px] rounded-full cursor-pointer"
                >
                  {src}
                </Button>
              );
            })}
          </div>
        )}
      </CardHeader>
    </Card>
  );
};

interface ArticleListProps {
  clusterId: number | null;
  articles: Article[];
  filteredArticles: Article[];
  loading: boolean;
  error: string | null;
  page: number;
  onPageChange: (page: number) => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  clusterId,
  articles,
  filteredArticles,
  loading,
  error,
  page,
  onPageChange,
}) => {
  if (!clusterId) {
    return null; // Don't show article list if no cluster selected
  }

  if (loading && articles.length === 0) {
    return (
      <Card className="border-border bg-card/40">
        <CardHeader className="pb-3 shrink-0 flex flex-row items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          <CardTitle className="text-sm font-semibold tracking-tight">Article List</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border p-8 flex items-center justify-center bg-card/40">
        <p className="text-xs text-destructive">{error}</p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col border-border bg-card/40">
      <CardHeader className="pb-3 shrink-0 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          <CardTitle className="text-sm font-semibold tracking-tight">Article List</CardTitle>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">
          Showing {filteredArticles.length} articles on this page
        </span>
      </CardHeader>
      
      <Separator />

      {/* Articles List - Grid layout inside the Card */}
      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/5">
        {filteredArticles.length === 0 ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            No articles match the selected source filters.
          </div>
        ) : (
          filteredArticles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        )}
      </CardContent>

      {/* Pagination Footer */}
      <div className="shrink-0 border-t border-border px-4 py-3 flex items-center justify-between bg-card/30">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
          className="h-8 px-3 text-[11px] cursor-pointer"
        >
          <ChevronLeft size={14} className="mr-0.5" />
          Prev Page
        </Button>
        <span className="text-xs font-semibold text-muted-foreground">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={articles.length < PAGE_LIMIT || loading}
          className="h-8 px-3 text-[11px] cursor-pointer"
        >
          Next Page
          <ChevronRight size={14} className="ml-0.5" />
        </Button>
      </div>
    </Card>
  );
};

function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="group rounded-lg border border-border bg-card p-4 hover:bg-secondary/40 transition-all duration-150 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 font-medium">
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
            <ExternalLink size={14} />
          </a>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs font-semibold text-foreground hover:text-primary transition-colors duration-150 leading-snug mb-1.5"
        >
          {article.title}
        </a>
        {article.summary && (
          <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
            {article.summary}
          </p>
        )}
      </div>
    </div>
  );
}

export default ClusterDetail;
